import { test, expect } from '@playwright/test';

// 実際にテスト可能なi18n機能に焦点を当てたテスト
test.describe('Docusaurus i18n 機能のテスト（制約を考慮）', () => {

  test('日本語版ページが正常に表示される', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // URLが正しいことを確認
    await expect(page).toHaveURL(/.*\/docs\/intro/);
    // ページのタイトルが日本語であることを確認
    await expect(page.getByRole('heading', { name: 'はじめに' })).toBeVisible();
    // htmlタグのlang属性が 'ja-JP' であることを確認
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja-JP');
    
    // 日本語コンテンツが表示されることを確認
    await expect(page.getByText('moorestech公式ドキュメントへようこそ')).toBeVisible();
    await expect(page.getByText('現在このドキュメントは整備中です')).toBeVisible();
  });

  test('言語切り替えドロップダウンが表示される', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // 言語切り替えドロップダウンが存在することを確認
    const localeDropdown = page.locator('.navbar__item.dropdown');
    await expect(localeDropdown).toBeVisible();
    
    // ドロップダウンをクリックしてメニューが開くことを確認
    await localeDropdown.click();
    
    // 両方の言語オプションが存在することを確認
    await expect(page.getByRole('link', { name: '日本語' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
    
    // スクリーンショットを撮影（ドロップダウンメニューが開いた状態）
    await page.screenshot({ path: 'language-dropdown-open.png', fullPage: true });
  });

  test('言語切り替えリンクが適切なURLを持っている', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // 言語切り替えドロップダウンを開く
    const localeDropdown = page.locator('.navbar__item.dropdown');
    await localeDropdown.click();
    
    // 英語リンクのhref属性を確認
    const englishLink = page.getByRole('link', { name: 'English' });
    const englishHref = await englishLink.getAttribute('href');
    expect(englishHref).toBe('/en/docs/intro');
    
    // 日本語リンクのhref属性を確認
    const japaneseLink = page.getByRole('link', { name: '日本語' });
    const japaneseHref = await japaneseLink.getAttribute('href');
    expect(japaneseHref).toBe('/docs/intro');
  });

  test('ページメタデータとSEO設定が正しい', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // ページタイトルを確認
    const title = await page.title();
    expect(title).toContain('moorestech documentation');
    // Docusaurusではページのタイトルは設定によって異なる場合があるため、基本的な文字列をチェック
    
    // メタ言語タグを確認
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('ja-JP');
    
    // ページの基本構造を確認
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer.footer--dark')).toBeVisible();
  });

  test('サイドバーとナビゲーションが日本語で表示される', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // サイドバーの日本語表示を確認
    await expect(page.locator('.menu__list-item a').first()).toContainText('はじめに');
    
    // ナビゲーションバーの日本語表示を確認
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    
    // 言語ドロップダウンボタンに現在の言語が表示されることを確認
    const dropdownButton = page.locator('.navbar__item.dropdown');
    await expect(dropdownButton).toContainText('日本語');
  });

  test('フッターが正しく表示される', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // メインのフッターが存在することを確認（複数のfooterタグがあるため、特定のクラスで指定）
    const footer = page.locator('footer.footer--dark');
    await expect(footer).toBeVisible();
    
    // フッター内のリンクを確認
    await expect(footer.getByText('Docs')).toBeVisible();
    await expect(footer.getByText('Community')).toBeVisible();
    await expect(footer.getByText('More')).toBeVisible();
    
    // コピーライト表示を確認
    await expect(footer.getByText(/Copyright.*Built with Docusaurus/)).toBeVisible();
  });
});