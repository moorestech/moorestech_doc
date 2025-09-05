import { test, expect } from '@playwright/test';

test.describe('Debug Component Mounting', () => {
  test('should capture all console logs during edit mode', async ({ page }) => {
    // すべてのコンソールログをキャプチャ
    const consoleLogs: { type: string; text: string }[] = [];
    
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // ホームページにアクセス
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // ドキュメントページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== Initial Page Load Logs ===');
    consoleLogs.forEach(log => {
      if (log.text.includes('[') || log.text.includes('Edit')) {
        console.log(`${log.type}: ${log.text}`);
      }
    });
    
    // 編集ボタンを探してクリック
    const editButtons = await page.locator('button').all();
    console.log(`\nFound ${editButtons.length} buttons on the page`);
    
    for (const button of editButtons) {
      const text = await button.textContent();
      console.log(`  Button text: "${text}"`);
      if (text && text.includes('編集')) {
        console.log('  -> Clicking edit button');
        await button.click();
        break;
      }
    }
    
    await page.waitForTimeout(3000);
    
    console.log('\n=== After Edit Button Click Logs ===');
    consoleLogs.forEach(log => {
      if (log.text.includes('[') || log.text.includes('Edit')) {
        console.log(`${log.type}: ${log.text}`);
      }
    });
    
    // DOMの状態を確認
    console.log('\n=== DOM State ===');
    
    // EditableSidebarの存在確認
    const editableSidebar = await page.locator('.editableSidebar').count();
    console.log(`EditableSidebar elements: ${editableSidebar}`);
    
    // InlineEditorの存在確認
    const inlineEditor = await page.locator('.editorContainer').count();
    console.log(`InlineEditor elements: ${inlineEditor}`);
    
    // 編集モードのインジケーター確認
    const editingIndicator = await page.getByText('編集中').count();
    console.log(`"編集中" indicators: ${editingIndicator}`);
    
    // React DevToolsのような方法でコンポーネントツリーを調査
    const componentInfo = await page.evaluate(() => {
      // Reactコンポーネントの情報を取得
      const info: any = {};
      
      // FileSystemProviderが存在するか
      const rootElement = document.getElementById('__docusaurus');
      if (rootElement) {
        info.rootExists = true;
        info.rootClasses = rootElement.className;
      }
      
      // サイドバー要素を探す
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        info.sidebarExists = true;
        info.sidebarHTML = sidebar.innerHTML.substring(0, 200);
      }
      
      // メインコンテンツエリアを探す
      const mainContent = document.querySelector('main');
      if (mainContent) {
        info.mainExists = true;
        const editor = mainContent.querySelector('.editorContainer');
        info.editorInMain = !!editor;
      }
      
      return info;
    });
    
    console.log('\n=== Component Info ===');
    console.log(JSON.stringify(componentInfo, null, 2));
    
    // エラーログを確認
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    if (errorLogs.length > 0) {
      console.log('\n=== Error Logs ===');
      errorLogs.forEach(log => console.log(log.text));
    }
  });

  test('should check component hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // Reactコンポーネントの階層を確認
    const hierarchy = await page.evaluate(() => {
      const result: any = {};
      
      // Root要素
      const root = document.querySelector('#__docusaurus');
      if (root) {
        result.root = {
          exists: true,
          children: root.children.length
        };
      }
      
      // Layout要素
      const layout = document.querySelector('[class*=docPage]');
      if (layout) {
        result.layout = {
          exists: true,
          classes: layout.className
        };
      }
      
      // Sidebar要素
      const sidebar = document.querySelector('[class*=sidebar]');
      if (sidebar) {
        result.sidebar = {
          exists: true,
          classes: sidebar.className,
          hasEditButton: !!sidebar.querySelector('button')
        };
      }
      
      // Main要素
      const main = document.querySelector('main');
      if (main) {
        result.main = {
          exists: true,
          hasArticle: !!main.querySelector('article')
        };
      }
      
      return result;
    });
    
    console.log('\n=== Component Hierarchy ===');
    console.log(JSON.stringify(hierarchy, null, 2));
    
    // 編集ボタンをクリック
    const editButton = page.locator('button:has-text("編集")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 編集モード後の階層を確認
      const editModeHierarchy = await page.evaluate(() => {
        const result: any = {};
        
        // EditableSidebar
        const editableSidebar = document.querySelector('.editableSidebar');
        result.editableSidebar = {
          exists: !!editableSidebar,
          parent: editableSidebar?.parentElement?.className
        };
        
        // InlineEditor
        const inlineEditor = document.querySelector('.editorContainer');
        result.inlineEditor = {
          exists: !!inlineEditor,
          parent: inlineEditor?.parentElement?.tagName
        };
        
        // 編集中インジケーター
        const indicators = Array.from(document.querySelectorAll('*')).filter(
          el => el.textContent?.includes('編集中')
        );
        result.editingIndicators = indicators.length;
        
        return result;
      });
      
      console.log('\n=== Edit Mode Hierarchy ===');
      console.log(JSON.stringify(editModeHierarchy, null, 2));
    }
  });
});