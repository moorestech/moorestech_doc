// ===== i18n (国際化) システム =====

// 翻訳データキャッシュ
let translations = {};
let currentLanguage = 'ja'; // デフォルト言語

// サポートされている言語
const SUPPORTED_LANGUAGES = [
    'en',      // 英語
    'ja',      // 日本語
    'zh-CN',   // 簡体字中国語
    'pt-BR',   // ポルトガル語(ブラジル)
    'zh-TW',   // 繁体字中国語
    'uk',      // ウクライナ語
    'ko',      // 韓国語
    'pt-PT',   // ポルトガル語(ポルトガル)
    'tr',      // トルコ語
    'ru',      // ロシア語
    'pl',      // ポーランド語
    'fr',      // フランス語
    'de',      // ドイツ語
    'es',      // スペイン語
    'th',      // タイ語
    'id',      // インドネシア語
    'it',      // イタリア語
    'cs',      // チェコ語
];
const STORAGE_KEY = 'preferred_language';

// ===== ブラウザ言語検出 =====
function detectBrowserLanguage() {
    const browserLang = navigator.language;
    const browserLangLower = browserLang.toLowerCase();

    // 完全一致をまず試す（zh-CN, pt-BR など）
    for (const lang of SUPPORTED_LANGUAGES) {
        if (browserLangLower === lang.toLowerCase()) {
            return lang;
        }
    }

    // 地域付き言語コードの特別処理
    // 中国語: zh-Hans* → zh-CN, zh-Hant* → zh-TW
    if (browserLangLower.startsWith('zh')) {
        if (browserLangLower.includes('hans') || browserLangLower === 'zh-cn' || browserLangLower === 'zh-sg') {
            return 'zh-CN';
        }
        if (browserLangLower.includes('hant') || browserLangLower === 'zh-tw' || browserLangLower === 'zh-hk' || browserLangLower === 'zh-mo') {
            return 'zh-TW';
        }
        // デフォルトは簡体字
        return 'zh-CN';
    }

    // ポルトガル語: pt-BR はそのまま、それ以外は pt-PT
    if (browserLangLower.startsWith('pt')) {
        if (browserLangLower === 'pt-br') {
            return 'pt-BR';
        }
        return 'pt-PT';
    }

    // その他の言語は言語コードのみで一致を試みる
    const langCode = browserLangLower.split('-')[0];
    for (const lang of SUPPORTED_LANGUAGES) {
        if (lang.toLowerCase() === langCode || lang.toLowerCase().startsWith(langCode + '-')) {
            return lang;
        }
    }

    // デフォルトは日本語
    return 'ja';
}

// ===== 初期化 =====
async function initI18n() {
    // 保存された言語設定を取得
    const savedLanguage = localStorage.getItem(STORAGE_KEY);

    // 言語を決定: 1) localStorage, 2) ブラウザ言語, 3) デフォルト(ja)
    let language = savedLanguage;
    if (!language) {
        language = detectBrowserLanguage();
    }

    // 言語を設定
    await setLanguage(language);

    // 言語切り替えボタンのイベントリスナー設定
    setupLanguageSwitcher();
}

// ===== 翻訳データ読み込み =====
async function loadTranslations(language) {
    // キャッシュにあればそれを使用
    if (translations[language]) {
        return translations[language];
    }

    try {
        const response = await fetch(`i18n/${language}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${language}.json`);
        }
        const data = await response.json();
        translations[language] = data;
        return data;
    } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);

        // フォールバック: 日本語を読み込む
        if (language !== 'ja') {
            console.log('Falling back to Japanese...');
            const response = await fetch('i18n/ja.json');
            const data = await response.json();
            translations['ja'] = data;
            return data;
        }

        return {};
    }
}

// ===== 言語設定 =====
async function setLanguage(language) {
    // サポートされていない言語の場合は日本語にフォールバック
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        language = 'ja';
    }

    currentLanguage = language;

    // 翻訳データを読み込み
    const translationData = await loadTranslations(language);

    // localStorageに保存
    localStorage.setItem(STORAGE_KEY, language);

    // HTML lang属性を更新
    document.documentElement.lang = language;

    // メタタグを更新
    updateMetaTags(translationData);

    // ページコンテンツを更新
    updatePageContent(translationData);

    // 言語切り替えボタンのUI更新
    updateLanguageSwitcherUI(language);
}

// ===== メタタグ更新 =====
function updateMetaTags(data) {
    if (data.meta) {
        // title更新
        if (data.meta.title) {
            document.title = data.meta.title;
        }

        // description更新
        if (data.meta.description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', data.meta.description);
            }
        }
    }
}

// ===== ページコンテンツ更新 =====
function updatePageContent(data) {
    // data-i18n属性を持つ全要素を取得
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translatedText = getNestedValue(data, key);

        if (translatedText !== undefined && translatedText !== null) {
            // HTMLタグを含む場合はinnerHTMLを使用、そうでなければtextContentを使用
            if (translatedText.includes('<br>') || translatedText.includes('<')) {
                element.innerHTML = translatedText;
            } else {
                element.textContent = translatedText;
            }
        }
    });

    // data-i18n-alt属性を持つ全要素を取得（alt属性用）
    const altElements = document.querySelectorAll('[data-i18n-alt]');

    altElements.forEach(element => {
        const key = element.getAttribute('data-i18n-alt');
        const translatedText = getNestedValue(data, key);

        if (translatedText !== undefined && translatedText !== null) {
            element.setAttribute('alt', translatedText);
        }
    });

    // data-i18n-placeholder属性を持つ全要素を取得（placeholder属性用）
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');

    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translatedText = getNestedValue(data, key);

        if (translatedText !== undefined && translatedText !== null) {
            element.setAttribute('placeholder', translatedText);
        }
    });

    // キャラクター名を更新（script.jsの関数を呼び出し）
    if (typeof updateCharacterNames === 'function') {
        updateCharacterNames();
    }

    // 現在表示されているキャラクターを再表示（script.jsの関数を呼び出し）
    const activeCharacter = document.querySelector('.character-icon.active');
    if (activeCharacter && typeof displayCharacter === 'function') {
        const characterId = activeCharacter.getAttribute('data-character');
        displayCharacter(characterId);
    }
}

// ===== ネストされたオブジェクトから値を取得 =====
function getNestedValue(obj, path) {
    // "nav.features" のようなパスを分割して値を取得
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
        // 配列インデックスをサポート（例: "story.text.0"）
        if (value === undefined || value === null) {
            return undefined;
        }
        value = value[key];
    }

    return value;
}

// ===== 言語切り替えドロップダウンのセットアップ =====
function setupLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    const dropdownBtn = document.getElementById('langDropdownBtn');
    const dropdownMenu = document.getElementById('langDropdownMenu');
    const options = document.querySelectorAll('.lang-option');

    if (!switcher || !dropdownBtn || !dropdownMenu) return;

    // ドロップダウンボタンクリックでメニュー開閉
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switcher.classList.toggle('active');
    });

    // 言語オプションクリック
    options.forEach(option => {
        option.addEventListener('click', async () => {
            const lang = option.getAttribute('data-lang');
            await setLanguage(lang);
            switcher.classList.remove('active');
        });
    });

    // ドロップダウン外をクリックしたら閉じる
    document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
            switcher.classList.remove('active');
        }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            switcher.classList.remove('active');
        }
    });
}

// ===== 言語切り替えドロップダウンのUI更新 =====
function updateLanguageSwitcherUI(language) {
    const currentFlag = document.getElementById('langCurrentFlag');
    const currentName = document.getElementById('langCurrentName');
    const options = document.querySelectorAll('.lang-option');

    if (!currentFlag || !currentName) return;

    // 選択された言語のオプションを探す
    let selectedOption = null;
    options.forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (lang === language) {
            option.classList.add('active');
            selectedOption = option;
        } else {
            option.classList.remove('active');
        }
    });

    // ドロップダウンボタンの表示を更新
    if (selectedOption) {
        const flag = selectedOption.getAttribute('data-flag');
        const name = selectedOption.getAttribute('data-name');
        currentFlag.textContent = flag;
        currentName.textContent = name;
    }
}

// ===== 現在の言語を取得 =====
function getCurrentLanguage() {
    return currentLanguage;
}

// ===== 翻訳を取得（JavaScriptから使用） =====
function t(key) {
    const data = translations[currentLanguage];
    if (!data) return key;

    const value = getNestedValue(data, key);
    return value !== undefined && value !== null ? value : key;
}

// ===== グローバルに公開 =====
window.i18n = {
    init: initI18n,
    setLanguage: setLanguage,
    getCurrentLanguage: getCurrentLanguage,
    t: t
};

// ===== DOMContentLoaded時に初期化 =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    // すでに読み込まれている場合
    initI18n();
}
