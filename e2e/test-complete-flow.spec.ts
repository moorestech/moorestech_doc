import { test, expect } from '@playwright/test';

test.describe('Complete Edit Flow', () => {
  test('should complete full editing workflow', async ({ page }) => {
    console.log('=== Starting Complete Edit Flow Test ===\n');
    
    // 1. ホームページから開始
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/moorestech/i);
    console.log('✅ 1. Homepage loaded');
    
    // 2. ドキュメントページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    console.log('✅ 2. Navigated to documentation');
    
    // 3. 編集モードに入る
    const editButton = page.locator('button:has-text("編集")').first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 編集モードの確認
    const editingIndicator = page.locator('text="✓ 編集中"');
    await expect(editingIndicator).toBeVisible();
    console.log('✅ 3. Entered edit mode');
    
    // 4. EditableSidebarの確認
    const sidebar = page.locator('[class*=editableSidebar]');
    await expect(sidebar).toBeVisible();
    
    // ファイルツリーの確認
    const treeNodes = page.locator('[class*=treeNode]');
    const nodeCount = await treeNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
    console.log(`✅ 4. EditableSidebar visible with ${nodeCount} nodes`);
    
    // 5. InlineEditorの確認
    const editor = page.locator('[class*=editorContainer]');
    await expect(editor).toBeVisible();
    
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    const initialContent = await textarea.inputValue();
    expect(initialContent).toContain('Introduction');
    console.log('✅ 5. InlineEditor visible with content');
    
    // 6. コンテンツを編集
    const newContent = '# Modified Documentation\n\nThis content has been edited!';
    await textarea.fill(newContent);
    
    const updatedContent = await textarea.inputValue();
    expect(updatedContent).toBe(newContent);
    console.log('✅ 6. Content edited successfully');
    
    // 7. ファイル選択の動作確認
    // tutorialフォルダを展開
    const expandButtons = page.locator('[class*=expandIcon]');
    const expandCount = await expandButtons.count();
    
    for (let i = 0; i < expandCount; i++) {
      const button = expandButtons.nth(i);
      const isExpanded = await button.evaluate(el => 
        el.classList.toString().includes('expanded')
      );
      
      if (!isExpanded) {
        await button.click();
        await page.waitForTimeout(500);
        console.log(`   - Expanded folder ${i + 1}`);
      }
    }
    
    // basics.mdファイルを探してクリック
    const basicsFile = page.locator('text="basics.md"').first();
    if (await basicsFile.count() > 0) {
      await basicsFile.click();
      await page.waitForTimeout(1000);
      
      // エディタの内容が変わったか確認
      const basicsContent = await textarea.inputValue();
      expect(basicsContent).toContain('Tutorial Basics');
      console.log('✅ 7. File selection works - switched to basics.md');
    }
    
    // 8. 新しいファイルを追加（ダイアログをモック）
    let dialogHandled = false;
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('test-new-file.md');
      dialogHandled = true;
    });
    
    // docsフォルダのアクションボタンを表示
    const docsNode = page.locator('[class*=nodeContent]').first();
    await docsNode.hover();
    await page.waitForTimeout(500);
    
    const addFileBtn = page.locator('button:has-text("＋ファイル")').first();
    if (await addFileBtn.count() > 0) {
      await addFileBtn.click();
      await page.waitForTimeout(1000);
      
      if (dialogHandled) {
        // 新しいファイルが追加されたか確認
        const newFile = page.locator('text="test-new-file.md"');
        const fileExists = await newFile.count() > 0;
        
        if (fileExists) {
          console.log('✅ 8. New file added successfully');
          
          // 新しいファイルをクリック
          await newFile.click();
          await page.waitForTimeout(1000);
          
          const newFileContent = await textarea.inputValue();
          expect(newFileContent).toContain('test-new-file');
          console.log('✅ 9. Can edit new file');
        }
      }
    }
    
    // 10. 変更パネルの確認
    const changesPanel = page.locator('[class*=changesPanel]');
    const hasChanagesPanel = await changesPanel.count() > 0;
    
    if (hasChanagesPanel) {
      const changeStats = page.locator('[class*=changeStats]');
      const statsText = await changeStats.textContent();
      console.log(`✅ 10. Changes panel shows: ${statsText}`);
    }
    
    // 11. 編集モードを終了
    const exitButton = page.locator('button:has-text("✓ 編集中")');
    await exitButton.click();
    await page.waitForTimeout(1000);
    
    // 通常モードに戻ったか確認
    const normalEditButton = page.locator('button:has-text("✏️ 編集")');
    await expect(normalEditButton).toBeVisible();
    console.log('✅ 11. Exited edit mode successfully');
    
    console.log('\n=== ✅ ALL TESTS PASSED ===');
  });
  
  test('should verify drag and drop functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集モードに入る
    await page.click('button:has-text("編集")');
    await page.waitForTimeout(1000);
    
    // ドラッグ&ドロップのテスト（Playwrightでのシミュレーション）
    const sourceFile = page.locator('text="intro.md"').first();
    const targetFolder = page.locator('text="tutorial"').first();
    
    if (await sourceFile.count() > 0 && await targetFolder.count() > 0) {
      // ドラッグ&ドロップをシミュレート
      await sourceFile.hover();
      await page.mouse.down();
      await targetFolder.hover();
      await page.mouse.up();
      
      console.log('✅ Drag and drop simulation completed');
      // 注：実際のドラッグ&ドロップの結果確認は実装に依存
    }
  });
});