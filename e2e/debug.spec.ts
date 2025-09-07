import { test, expect } from '@playwright/test';

// デバッグ用テスト
test.describe('デバッグテスト', () => {

  test('英語版ページの存在確認', async ({ page }) => {
    // 英語版ページにアクセス
    await page.goto('/en/docs/intro');
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'debug-en-page.png', fullPage: true });
    
    // ページのタイトルを取得
    const title = await page.title();
    console.log('Page title:', title);
    
    // HTMLを確認
    const html = await page.content();
    console.log('Page HTML length:', html.length);
    
    // 404ページかどうか確認
    const is404 = await page.getByText('ページが見つかりません').isVisible().catch(() => false);
    console.log('Is 404 page:', is404);
    
    if (is404) {
      // 404ページの場合、利用可能なページを確認
      await page.goto('/en/');
      await page.screenshot({ path: 'debug-en-home.png', fullPage: true });
      
      const homeTitle = await page.title();
      console.log('Home page title:', homeTitle);
    }
  });

  test('日本語版ページの確認', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'debug-ja-page.png', fullPage: true });
    
    // 言語ドロップダウンの確認
    const dropdown = page.locator('.navbar__item.dropdown');
    const isDropdownVisible = await dropdown.isVisible().catch(() => false);
    console.log('Language dropdown visible:', isDropdownVisible);
    
    if (isDropdownVisible) {
      await dropdown.click();
      await page.screenshot({ path: 'debug-dropdown-open.png', fullPage: true });
    }
  });
});