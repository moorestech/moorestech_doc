import { test, expect } from '@playwright/test';

// テストをグループ化
test.describe('Docusaurus i18n 機能のテスト', () => {

  test('日本語版と英語版のページに直接アクセスできる', async ({ page }) => {
    // 日本語版ページにアクセス
    await page.goto('/docs/intro');
    
    // URLが正しいことを確認
    await expect(page).toHaveURL(/.*\/docs\/intro/);
    // ページのタイトルが日本語であることを確認
    await expect(page.getByRole('heading', { name: 'はじめに' })).toBeVisible();
    // htmlタグのlang属性が 'ja-JP' であることを確認
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja-JP');

    // 英語版ページにアクセス
    await page.goto('/en/docs/intro');

    // URLが正しいことを確認
    await expect(page).toHaveURL(/.*\/en\/docs\/intro/);
    // ページのタイトルが英語であることを確認
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();
    // htmlタグのlang属性が 'en-US' であることを確認
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('言語切り替えドロップダウンが表示され、機能する', async ({ page }) => {
    // まず日本語ページにアクセス
    await page.goto('/docs/intro');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja-JP');

    // 言語切り替えドロップダウンのボタンを取得してクリック
    // Docusaurusのデフォルトのクラス名を使用
    const languageDropdown = page.locator('.navbar__item.dropdown');
    await expect(languageDropdown).toBeVisible();
    await languageDropdown.click();

    // ドロップダウンメニューの中から 'English' のリンクをクリック
    const englishLink = page.getByRole('link', { name: 'English' });
    await expect(englishLink).toBeVisible();
    await englishLink.click();

    // ページ遷移が完了し、URLが英語バージョンに変わったことを確認
    await expect(page).toHaveURL(/.*\/en\/docs\/intro/);
    // htmlタグのlang属性が 'en' に変わったことを確認
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    // ページのタイトルが英語に変わったことを確認
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();

    // 再度ドロップダウンを開いて日本語に戻すテスト
    await languageDropdown.click();
    const japaneseLink = page.getByRole('link', { name: '日本語' });
    await expect(japaneseLink).toBeVisible();
    await japaneseLink.click();

    // URLが日本語バージョンに戻ったことを確認
    await expect(page).toHaveURL(/.*\/docs\/intro/);
    // htmlタグのlang属性が 'ja' に戻ったことを確認
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja-JP');
    // ページのタイトルが日本語に戻ったことを確認
    await expect(page.getByRole('heading', { name: 'はじめに' })).toBeVisible();
  });

  test('ナビゲーションバーの言語ドロップダウンが存在することを確認', async ({ page }) => {
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
  });

  test('各言語でドキュメントのコンテンツが異なることを確認', async ({ page }) => {
    // 日本語版のコンテンツをチェック
    await page.goto('/docs/intro');
    await expect(page.getByText('moorestech公式ドキュメントへようこそ')).toBeVisible();
    await expect(page.getByText('現在このドキュメントは整備中です')).toBeVisible();
    
    // 英語版のコンテンツをチェック
    await page.goto('/en/docs/intro');
    await expect(page.getByText('Welcome to the moorestech official documentation')).toBeVisible();
    await expect(page.getByText('This documentation is currently under construction')).toBeVisible();
  });
});