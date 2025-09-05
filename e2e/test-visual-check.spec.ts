import { test, expect } from '@playwright/test';

test.describe('Visual Component Check', () => {
  test('should visually check sidebar rendering', async ({ page }) => {
    // ページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集ボタンをクリック
    const editButton = page.locator('button:has-text("編集")').first();
    await editButton.click();
    await page.waitForTimeout(2000);
    
    // スクリーンショットを撮る
    await page.screenshot({ path: 'edit-mode-screenshot.png', fullPage: true });
    console.log('Screenshot saved as edit-mode-screenshot.png');
    
    // すべての要素のクラス名を調査
    const elementInfo = await page.evaluate(() => {
      const result: any = {};
      
      // サイドバー関連の要素を探す
      const sidebar = document.querySelector('[class*=sidebar]');
      if (sidebar) {
        result.sidebarClass = sidebar.className;
        result.sidebarChildren = sidebar.children.length;
        
        // 子要素のクラス名
        const children = Array.from(sidebar.children);
        result.childClasses = children.map(child => ({
          tag: child.tagName,
          class: child.className,
          text: child.textContent?.substring(0, 50)
        }));
        
        // data-testid や特定の属性を探す
        const editableSidebarByClass = sidebar.querySelector('[class*=editable]');
        if (editableSidebarByClass) {
          result.editableSidebar = {
            found: true,
            class: editableSidebarByClass.className,
            tag: editableSidebarByClass.tagName
          };
        }
      }
      
      // メイン要素を調査
      const main = document.querySelector('main');
      if (main) {
        result.mainChildren = main.children.length;
        
        const editorContainer = main.querySelector('[class*=editor]');
        if (editorContainer) {
          result.editorContainer = {
            found: true,
            class: editorContainer.className,
            tag: editorContainer.tagName
          };
        }
      }
      
      // CSS モジュールによってハッシュ化されたクラス名を探す
      const allElements = document.querySelectorAll('*');
      const editableElements = Array.from(allElements).filter(el => 
        el.className && el.className.toString().toLowerCase().includes('editable')
      );
      
      result.editableElementsFound = editableElements.map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id || 'none'
      }));
      
      return result;
    });
    
    console.log('\n=== Element Info ===');
    console.log(JSON.stringify(elementInfo, null, 2));
    
    // HTMLの一部を取得
    const sidebarHTML = await page.locator('[class*=sidebar]').first().innerHTML().catch(() => 'Not found');
    console.log('\n=== Sidebar HTML (first 500 chars) ===');
    console.log(sidebarHTML.substring(0, 500));
  });
  
  test('should check component visibility', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集ボタンをクリック
    await page.click('button:has-text("編集")');
    await page.waitForTimeout(2000);
    
    // CSSモジュールのクラス名を考慮した要素の検索
    const possibleSelectors = [
      '[class*=editableSidebar]',
      '[class*=EditableSidebar]',
      '[class*=editable]',
      '.editableSidebar',
      '[data-component="EditableSidebar"]'
    ];
    
    for (const selector of possibleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found element with selector: ${selector} (count: ${count})`);
        
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible();
        const boundingBox = await element.boundingBox();
        
        console.log(`  Visible: ${isVisible}`);
        console.log(`  BoundingBox:`, boundingBox);
      }
    }
    
    // FileTreeNodeを探す
    const treeNodeSelectors = [
      '[class*=treeNode]',
      '[class*=TreeNode]',
      '[class*=fileTree]',
      '[class*=FileTree]'
    ];
    
    for (const selector of treeNodeSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found tree element with selector: ${selector} (count: ${count})`);
      }
    }
  });
});