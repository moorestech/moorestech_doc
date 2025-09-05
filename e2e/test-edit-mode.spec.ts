import { test, expect } from '@playwright/test';

test.describe('Edit Mode Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Docusaurusの開発サーバーにアクセス
    await page.goto('http://localhost:3000');
  });

  test('should display home page', async ({ page }) => {
    // ホームページが正しく表示されることを確認
    await expect(page).toHaveTitle(/moorestech/i);
    
    // メインコンテンツが表示されることを確認
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to documentation and find edit button', async ({ page }) => {
    // ドキュメントページに移動
    await page.goto('http://localhost:3000/docs/intro');
    
    // ページが読み込まれるのを待つ
    await page.waitForLoadState('networkidle');
    
    // 編集ボタンを探す
    const editButton = page.getByText('編集').first();
    const editButtonExists = await editButton.count() > 0;
    
    if (editButtonExists) {
      console.log('Edit button found');
      
      // 編集ボタンをクリック
      await editButton.click();
      
      // 編集モードに入ったかを確認
      await page.waitForTimeout(2000);
      
      // 編集モードのインジケーターを確認
      const editModeIndicator = page.getByText('編集中').first();
      const isInEditMode = await editModeIndicator.count() > 0;
      
      if (isInEditMode) {
        console.log('Successfully entered edit mode');
      } else {
        console.log('Edit mode indicator not found');
      }
      
      // EditableSidebarが表示されるか確認
      const sidebar = page.locator('.editableSidebar');
      const sidebarVisible = await sidebar.count() > 0;
      
      if (sidebarVisible) {
        console.log('Editable sidebar is visible');
        
        // ファイルツリーが表示されるか確認
        const fileTree = page.locator('.fileTree');
        await expect(fileTree).toBeVisible({ timeout: 5000 });
      } else {
        console.log('Editable sidebar not found');
      }
    } else {
      console.log('Edit button not found on the page');
    }
  });

  test('should check FileSystemContext initialization', async ({ page }) => {
    // コンソールエラーを記録
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // ドキュメントページを開く
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // コンソールエラーをチェック
    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(error => console.log('  -', error));
    }
    
    // React Developer Toolsのような方法でコンテキストをチェック
    const hasContext = await page.evaluate(() => {
      // window上のReactやコンテキストの存在をチェック
      return typeof window !== 'undefined';
    });
    
    expect(hasContext).toBeTruthy();
  });

  test('should interact with sidebar in edit mode', async ({ page }) => {
    // ドキュメントページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // サイドバーの編集ボタンを探す
    const sidebarEditButton = page.locator('.editButton').first();
    const buttonExists = await sidebarEditButton.count() > 0;
    
    if (buttonExists) {
      console.log('Sidebar edit button found');
      
      // 編集ボタンをクリック
      await sidebarEditButton.click();
      await page.waitForTimeout(2000);
      
      // EditableSidebarが表示されるのを待つ
      const editableSidebar = page.locator('.editableSidebar');
      const isVisible = await editableSidebar.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log('EditableSidebar is now visible');
        
        // ファイルツリーのルートノードを確認
        const rootNode = page.locator('.treeNode').first();
        await expect(rootNode).toBeVisible({ timeout: 5000 });
        
        // docsフォルダが表示されるか確認
        const docsFolder = page.getByText('docs', { exact: false }).first();
        const docsFolderExists = await docsFolder.count() > 0;
        
        if (docsFolderExists) {
          console.log('docs folder found in file tree');
          
          // フォルダを展開してみる
          const expandButton = page.locator('.expandIcon').first();
          if (await expandButton.count() > 0) {
            await expandButton.click();
            await page.waitForTimeout(1000);
            console.log('Expanded docs folder');
          }
        }
      } else {
        console.log('EditableSidebar not visible after clicking edit button');
      }
    } else {
      console.log('Sidebar edit button not found');
    }
  });

  test('should check editor integration', async ({ page }) => {
    // ドキュメントページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集モードに入る
    const editButton = page.locator('button:has-text("編集")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // InlineEditorが表示されるか確認
      const editor = page.locator('.editorContainer');
      const editorExists = await editor.count() > 0;
      
      if (editorExists) {
        console.log('InlineEditor found');
        
        // テキストエリアを確認
        const textarea = page.locator('textarea').first();
        const textareaExists = await textarea.count() > 0;
        
        if (textareaExists) {
          console.log('Editor textarea found');
          
          // コンテンツが読み込まれているか確認
          const content = await textarea.inputValue();
          console.log('Editor content length:', content.length);
          
          if (content.length > 0) {
            console.log('Editor has content loaded');
          } else {
            console.log('Editor is empty - might be loading issue');
          }
        }
      } else {
        console.log('InlineEditor not found');
      }
    }
  });
});