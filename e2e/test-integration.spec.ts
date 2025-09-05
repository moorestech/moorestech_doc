import { test, expect } from '@playwright/test';

test.describe('Full Integration Test', () => {
  test('should integrate sidebar file selection with editor', async ({ page }) => {
    // ページにアクセス
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集ボタンをクリック
    console.log('1. Clicking edit button...');
    await page.click('button:has-text("編集")');
    await page.waitForTimeout(2000);
    
    // EditableSidebarの確認
    const sidebarSelector = '[class*=editableSidebar]';
    const sidebar = page.locator(sidebarSelector);
    const sidebarExists = await sidebar.count() > 0;
    console.log(`2. EditableSidebar found: ${sidebarExists}`);
    
    if (sidebarExists) {
      // ファイルツリーの確認
      const treeNodes = await page.locator('[class*=treeNode]').count();
      console.log(`3. Tree nodes found: ${treeNodes}`);
      
      // intro.mdノードを探してクリック
      const fileNodes = await page.locator('[class*=nodeName]').all();
      for (const node of fileNodes) {
        const text = await node.textContent();
        console.log(`   - Node: ${text}`);
        if (text && text.includes('intro.md')) {
          console.log('4. Clicking intro.md file...');
          await node.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
    
    // InlineEditorの確認（CSSモジュール対応）
    const editorSelectors = [
      '[class*=editorContainer]',
      '[class*=InlineEditor]',
      'main textarea',
      'textarea'
    ];
    
    let editorFound = false;
    for (const selector of editorSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`5. Editor found with selector: ${selector}`);
        editorFound = true;
        
        // テキストエリアの内容を確認
        if (selector.includes('textarea')) {
          const content = await page.locator(selector).first().inputValue();
          console.log(`6. Editor content: ${content.substring(0, 100)}...`);
          
          // 編集してみる
          await page.locator(selector).first().fill('# Modified Content\n\nThis is a test edit.');
          console.log('7. Content modified');
          
          // 変更が反映されたか確認
          const newContent = await page.locator(selector).first().inputValue();
          expect(newContent).toContain('Modified Content');
          console.log('8. Edit successful!');
        }
        break;
      }
    }
    
    if (!editorFound) {
      console.log('5. Editor not found in DOM');
    }
    
    // 変更パネルの確認
    const changesPanelSelector = '[class*=changesPanel]';
    const changesPanel = await page.locator(changesPanelSelector).count();
    if (changesPanel > 0) {
      console.log('9. Changes panel found');
      
      // 変更内容を確認
      const changeStats = await page.locator('[class*=changeStats]').textContent();
      console.log(`10. Change stats: ${changeStats}`);
    }
  });
  
  test('should test file operations in sidebar', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集モードに入る
    await page.click('button:has-text("編集")');
    await page.waitForTimeout(2000);
    
    // docsフォルダのアクションボタンを探す
    const nodeContent = page.locator('[class*=nodeContent]').first();
    await nodeContent.hover();
    await page.waitForTimeout(500);
    
    // ファイル追加ボタンを探してクリック
    const addFileButton = page.locator('button:has-text("＋ファイル")').first();
    const addFileExists = await addFileButton.count() > 0;
    
    if (addFileExists) {
      console.log('Add file button found');
      
      // モックのpromptを設定（Playwrightではpromptをモックできる）
      page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        if (dialog.type() === 'prompt') {
          await dialog.accept('test-file.md');
        }
      });
      
      await addFileButton.click();
      await page.waitForTimeout(1000);
      
      // 新しいファイルが追加されたか確認
      const testFile = await page.locator(':has-text("test-file.md")').count();
      console.log(`Test file created: ${testFile > 0}`);
    }
    
    // フォルダを展開
    const expandButtons = await page.locator('[class*=expandIcon]').all();
    for (const button of expandButtons) {
      const isExpanded = await button.evaluate(el => el.classList.toString().includes('expanded'));
      if (!isExpanded) {
        await button.click();
        await page.waitForTimeout(500);
        console.log('Expanded a folder');
      }
    }
  });
});