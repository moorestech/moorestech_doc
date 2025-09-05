import { test, expect } from '@playwright/test';

test.describe('InlineEditor Debug', () => {
  test('should debug InlineEditor rendering issue', async ({ page }) => {
    // コンソールメッセージをキャプチャ
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('InlineEditor')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // ページに移動
    await page.goto('http://localhost:3000/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // 編集ボタンをクリック
    await page.click('button:has-text("編集")');
    await page.waitForTimeout(2000);
    
    // InlineEditorのログを確認
    console.log('=== InlineEditor Logs ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // mainタグの内容を調査
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return { exists: false };
      
      return {
        exists: true,
        childCount: main.children.length,
        innerHTML: main.innerHTML.substring(0, 500),
        children: Array.from(main.children).map(child => ({
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          childCount: child.children.length
        }))
      };
    });
    
    console.log('\n=== Main Content ===');
    console.log(JSON.stringify(mainContent, null, 2));
    
    // InlineEditor関連の要素を探す
    const editorSearch = await page.evaluate(() => {
      const results: any = {};
      
      // クラス名で探す
      const byClass = document.querySelector('[class*=editorContainer]');
      results.byClass = {
        found: !!byClass,
        parent: byClass?.parentElement?.tagName,
        grandParent: byClass?.parentElement?.parentElement?.tagName
      };
      
      // textareaを探す  
      const textarea = document.querySelector('textarea');
      results.textarea = {
        found: !!textarea,
        parent: textarea?.parentElement?.className,
        value: textarea?.value?.substring(0, 50)
      };
      
      // ファイルエディターというテキストを探す
      const editorTitle = Array.from(document.querySelectorAll('*')).find(
        el => el.textContent === 'ファイルエディター'
      );
      results.editorTitle = {
        found: !!editorTitle,
        tagName: editorTitle?.tagName,
        parent: editorTitle?.parentElement?.className
      };
      
      return results;
    });
    
    console.log('\n=== Editor Search Results ===');
    console.log(JSON.stringify(editorSearch, null, 2));
    
    // CSSの問題を確認（display: none や visibility: hidden）
    const cssCheck = await page.evaluate(() => {
      const container = document.querySelector('[class*=editorContainer]');
      if (!container) return null;
      
      const styles = window.getComputedStyle(container);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height,
        position: styles.position,
        zIndex: styles.zIndex
      };
    });
    
    console.log('\n=== CSS Computed Styles ===');
    console.log(JSON.stringify(cssCheck, null, 2));
    
    // サイドバーでファイルをクリックしてみる
    const introFile = page.locator('text=intro.md').first();
    if (await introFile.count() > 0) {
      console.log('\n=== Clicking intro.md file ===');
      await introFile.click();
      await page.waitForTimeout(1000);
      
      // クリック後の状態を確認
      const afterClick = await page.evaluate(() => {
        const editor = document.querySelector('[class*=editorContainer]');
        const textarea = document.querySelector('textarea');
        
        return {
          editorExists: !!editor,
          textareaExists: !!textarea,
          textareaValue: textarea ? (textarea as HTMLTextAreaElement).value.substring(0, 100) : null
        };
      });
      
      console.log('\n=== After File Click ===');
      console.log(JSON.stringify(afterClick, null, 2));
    }
  });
});