import React, { useEffect } from 'react';
import Head from '@docusaurus/Head';
import '../css/landing.css';

export default function LandingPage(): React.ReactElement {
  useEffect(() => {
    // ===== スクロール進捗バー =====
    function updateScrollProgress() {
      const scrollProgress = document.querySelector('.scroll-progress') as HTMLElement;
      if (!scrollProgress) return;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      scrollProgress.style.width = scrolled + '%';
    }
    window.addEventListener('scroll', updateScrollProgress);

    // ===== ナビゲーション =====
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // スクロール時のナビゲーションバー
    const handleNavScroll = () => {
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleNavScroll);

    // ハンバーガーメニュー
    const handleHamburgerClick = () => {
      if (navMenu && hamburger) {
        navMenu.classList.toggle('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = navMenu.classList.contains('active')
          ? 'rotate(45deg) translate(5px, 5px)'
          : 'none';
        spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
        spans[2].style.transform = navMenu.classList.contains('active')
          ? 'rotate(-45deg) translate(7px, -6px)'
          : 'none';
      }
    };
    hamburger?.addEventListener('click', handleHamburgerClick);

    // ナビゲーションリンククリック時
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu?.classList.remove('active');
        if (hamburger) {
          const spans = hamburger.querySelectorAll('span');
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
      });
    });

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href) {
          const target = document.querySelector(href);
          if (target) {
            const offsetTop = (target as HTMLElement).offsetTop - 70;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
          }
        }
      });
    });

    // ===== トレイラーモーダル =====
    const trailerBtn = document.getElementById('trailerBtn');
    const trailerModal = document.getElementById('trailerModal');
    const closeModal = document.getElementById('closeModal');
    const trailerIframe = document.getElementById('trailerIframe') as HTMLIFrameElement;

    function closeTrailerModal() {
      trailerModal?.classList.remove('active');
      if (trailerIframe) trailerIframe.src = '';
      document.body.style.overflow = 'auto';
    }

    trailerBtn?.addEventListener('click', () => {
      trailerModal?.classList.add('active');
      if (trailerIframe) trailerIframe.src = 'https://www.youtube.com/embed/sOYIfvKVeM8?autoplay=1';
      document.body.style.overflow = 'hidden';
    });

    closeModal?.addEventListener('click', closeTrailerModal);

    trailerModal?.addEventListener('click', (e) => {
      if (e.target === trailerModal) closeTrailerModal();
    });

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTrailerModal();
    };
    document.addEventListener('keydown', handleEscapeKey);

    // ===== キャラクター表示 =====
    const characterIcons = document.querySelectorAll('.character-icon');
    const characterDisplay = document.getElementById('characterDisplay');

    const characterImages: { [key: string]: string } = {
      '1': '/landing/images/character-main-full.png',
      '2': '/landing/images/character-ai-full.png',
      '3': '/landing/images/character-friend-full.png'
    };

    function displayCharacter(characterId: string) {
      const character = (window as any).i18n?.t(`characters.data.${characterId}`);
      if (!character || typeof character !== 'object') return;
      const image = characterImages[characterId];
      const placeholderSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect fill='%23334155' width='400' height='600'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${character.name}%3C/text%3E%3C/svg%3E`;
      if (characterDisplay) {
        characterDisplay.innerHTML = `
          <div class="character-detail-content">
            <div class="character-detail-image">
              <img src="${image}" alt="${character.name}" onerror="this.src='${placeholderSrc}'">
            </div>
            <div class="character-detail-info">
              <h3>${character.name}</h3>
              <p class="role">${character.role}</p>
              <p>${character.description}</p>
            </div>
          </div>
        `;
        characterDisplay.style.opacity = '0';
        setTimeout(() => { characterDisplay.style.opacity = '1'; }, 10);
      }
    }

    function updateCharacterNames() {
      const characterNames = document.querySelectorAll('[data-character-name]');
      characterNames.forEach(nameElement => {
        const characterId = nameElement.getAttribute('data-character-name');
        const name = (window as any).i18n?.t(`characters.data.${characterId}.name`);
        if (name) nameElement.textContent = name;
      });
    }

    characterIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const characterId = icon.getAttribute('data-character');
        characterIcons.forEach(i => i.classList.remove('active'));
        icon.classList.add('active');
        if (characterId) displayCharacter(characterId);
      });
    });

    // 初期表示
    setTimeout(() => {
      if (characterDisplay) displayCharacter('1');
    }, 500);

    // グローバル公開
    (window as any).displayCharacter = displayCharacter;
    (window as any).updateCharacterNames = updateCharacterNames;

    // ===== 高度なスクロールアニメーション =====
    const featureObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          featureObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -150px 0px' });

    const quickObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          (entry.target as HTMLElement).style.filter = 'blur(0px)';
          quickObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px 50px 0px' });

    const overviewObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          overviewObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

    const featureBlocks = document.querySelectorAll('.feature-block');
    const quickAnimateElements = document.querySelectorAll('.section-title, .character-icon, .mod-feature, .gallery-item, .social-link');
    const overviewElements = document.querySelectorAll('.overview-concept, .overview-release');

    featureBlocks.forEach(el => featureObserver.observe(el));

    quickAnimateElements.forEach((el, index) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(50px)';
      (el as HTMLElement).style.filter = 'blur(5px)';
      (el as HTMLElement).style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;
      quickObserver.observe(el);
    });

    overviewElements.forEach((el, index) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(50px)';
      (el as HTMLElement).style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
      overviewObserver.observe(el);
    });

    // ===== パララックス効果 =====
    const handleParallax = () => {
      const scrolled = window.scrollY;
      const heroBackground = document.querySelector('.hero-background') as HTMLElement;
      if (heroBackground) heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    };
    window.addEventListener('scroll', handleParallax);

    // ===== ギャラリー画像クリック(拡大表示) =====
    function setupGalleryModal() {
      const galleryItems = document.querySelectorAll('.gallery-item');
      galleryItems.forEach(item => {
        (item as HTMLElement).style.cursor = 'pointer';
        item.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const img = this.querySelector('img');
          if (!img) return;
          const modal = document.createElement('div');
          modal.className = 'modal active';
          modal.style.zIndex = '9999';
          modal.innerHTML = `
            <div class="modal-content">
              <button class="modal-close">&times;</button>
              <img src="${img.src}" alt="${img.alt}" style="width: 100%; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
            </div>
          `;
          document.body.appendChild(modal);
          document.body.style.overflow = 'hidden';
          const closeBtn = modal.querySelector('.modal-close');
          closeBtn?.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
          });
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove();
              document.body.style.overflow = 'auto';
            }
          });
        });
      });
    }
    setupGalleryModal();

    // ===== セクションタイトルの文字アニメーション =====
    const charStyle = document.createElement('style');
    charStyle.textContent = `
      @keyframes fadeInChar {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(charStyle);

    const titleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.children.length === 0) {
          const title = entry.target;
          const text = title.textContent || '';
          title.textContent = '';
          const chars = text.split('');
          chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.animation = `fadeInChar 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s forwards`;
            title.appendChild(span);
          });
          titleObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.8, rootMargin: '0px 0px -100px 0px' });

    document.querySelectorAll('.section-title').forEach(title => titleObserver.observe(title));

    // ===== スクロールインジケーターのクリック =====
    const scrollIndicator = document.querySelector('.scroll-indicator');
    scrollIndicator?.addEventListener('click', () => {
      const videoSection = document.querySelector('.video-section');
      if (videoSection) videoSection.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== ボタンのリップルエフェクト =====
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
      @keyframes ripple {
        to { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(rippleStyle);

    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', function(e: any) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        ripple.style.pointerEvents = 'none';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });

    // ===== マウスホバーで要素を軽く追従させる =====
    document.querySelectorAll('.feature-image, .character-detail-image').forEach(el => {
      el.addEventListener('mousemove', (e: any) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        (el as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
      });
      el.addEventListener('mouseleave', () => {
        (el as HTMLElement).style.transform = '';
      });
    });

    // クリーンアップ
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('scroll', handleNavScroll);
      window.removeEventListener('scroll', handleParallax);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <>
      <Head>
        <title>moorestech - 自動化工業ゲーム</title>
        <meta name="description" content="2026年夏Steam配信予定。歯車システムで動く工場建設、美麗なオープンワールド、魅力的なキャラクターたちとの物語。" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap" rel="stylesheet" />
        <script src="/landing/i18n/i18n.js" />
      </Head>
      <div>
        {/* TypeKit フォント読み込み */}
        <script dangerouslySetInnerHTML={{__html: `
          (function(d) {
            var config = { kitId: 'jxm0umo', scriptTimeout: 3000, async: true },
            h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
          })(document);
        `}} />

        {/* スクロール進捗バー */}
        <div className="scroll-progress"></div>

        {/* ナビゲーションバー */}
        <nav className="navbar" id="navbar">
          <div className="nav-container">
            <a href="#" className="nav-logo">
              <img src="/landing/images/game_logo.png" alt="Game Logo" className="nav-logo-image" />
            </a>
            <ul className="nav-menu">
              <li><a href="#features" className="nav-link" data-i18n="nav.features">ゲーム特徴</a></li>
              <li><a href="#story" className="nav-link" data-i18n="nav.story">ストーリー</a></li>
              <li><a href="#mod" className="nav-link" data-i18n="nav.mod">mod開発</a></li>
              <li><a href="#press" className="nav-link" data-i18n="nav.press">プレスキット</a></li>
              <li><a href="/docs/intro" className="nav-link">Wiki<svg className="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a></li>
              <li><a href="https://github.com/moorestech/moorestech" className="nav-link nav-icon-link" target="_blank" rel="noopener noreferrer" title="GitHub"><svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a></li>
            </ul>
            <div className="language-switcher" id="languageSwitcher">
              <button className="lang-dropdown-btn" id="langDropdownBtn">
                <span className="lang-current-flag" id="langCurrentFlag">🇯🇵</span>
                <span className="lang-current-name" id="langCurrentName">日本語</span>
                <svg className="lang-dropdown-arrow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <div className="lang-dropdown-menu" id="langDropdownMenu">
                <button className="lang-option active" data-lang="ja" data-flag="🇯🇵" data-name="日本語">
                  <span className="lang-option-flag">🇯🇵</span>
                  <span className="lang-option-name">日本語</span>
                </button>
                <button className="lang-option" data-lang="en" data-flag="🇺🇸" data-name="English">
                  <span className="lang-option-flag">🇺🇸</span>
                  <span className="lang-option-name">English</span>
                </button>
              </div>
            </div>
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </nav>

        {/* ファーストビュー / ヒーローセクション */}
        <section className="hero" id="hero">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="hero-cta">
              <a href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-hero-large">
                <img src="/landing/images/icon-steam.svg" alt="Steam" className="btn-icon-hero" />
                <span data-i18n="hero.steam_wishlist">Steamウィッシュリストに追加</span>
              </a>
              <button className="btn btn-secondary-white btn-hero-large" id="trailerBtn">
                <svg className="btn-icon-hero" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span data-i18n="hero.trailer">トレイラーを見る</span>
              </button>
            </div>
          </div>
          <div className="scroll-indicator">
            <div className="scroll-arrow"></div>
          </div>
        </section>

        {/* コンセプト動画セクション */}
        <section className="video-section" id="video">
          <div className="container">
            <h2 className="section-title" data-i18n="video.title">コンセプトトレイラー</h2>
            <div className="video-wrapper">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/sOYIfvKVeM8"
                title="Game Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen>
              </iframe>
            </div>
          </div>
        </section>

        {/* ゲーム概要とゲームの特徴 */}
        <section className="features" id="features">
          <div className="container">
            <h2 className="section-title" data-i18n="overview.title">ゲーム概要</h2>
            <div className="overview-content">
              <div className="overview-concept">
                <h3 className="overview-label" data-i18n="overview.concept_label">コンセプト</h3>
                <p className="overview-text" data-i18n="overview.concept_text">自動化工業ゲーム × アニメ調オープンワールド × RPG</p>
              </div>
              <div className="overview-release">
                <h3 className="overview-label" data-i18n="overview.release_label">リリース情報</h3>
                <p className="overview-text" data-i18n="overview.release_text">2026年夏 / Steam（Win/Mac/Linux）/ 2000円前後</p>
              </div>
            </div>

            <h2 className="section-title" style={{marginTop: '4rem'}} data-i18n="features.title">ゲームの特徴</h2>

            {/* 歯車システム */}
            <div className="feature-block">
              <div className="feature-content">
                <h3 className="feature-title" data-i18n="features.gear.title">歯車システムを加えた工場建設</h3>
                <p className="feature-subtitle" data-i18n="features.gear.subtitle">連鎖する歯車、広がる自動化</p>
                <ul className="feature-list">
                  <li data-i18n="features.gear.items.0">回転速度やトルクを制御し、工場を稼働させよう</li>
                  <li data-i18n="features.gear.items.1">歯車で工場が稼働している様子を見守ろう</li>
                  <li data-i18n="features.gear.items.2">敵、資源枯渇なし。自分のペースで工場を作ろう</li>
                </ul>
              </div>
              <div className="feature-image">
                <img src="/landing/images/game-feature-gear.png" alt="歯車システム" data-i18n-alt="features.gear.alt" />
              </div>
            </div>

            {/* 心揺さぶる物語体験 */}
            <div className="feature-block reverse">
              <div className="feature-content">
                <h3 className="feature-title" data-i18n="features.story.title">心揺さぶる物語体験</h3>
                <p className="feature-subtitle" data-i18n="features.story.subtitle">個性豊かなキャラクターたちと辿る、真実への旅</p>
                <ul className="feature-list">
                  <li data-i18n="features.story.items.0">個性豊かな3人のキャラクターとの絆</li>
                  <li data-i18n="features.story.items.1">物語の進行と共に変化していく関係性</li>
                  <li data-i18n="features.story.items.2">追放の裏にある隠された真実</li>
                </ul>
              </div>
              <div className="feature-image">
                <img src="/landing/images/game-feature-story.jpg" alt="心揺さぶる物語体験" data-i18n-alt="features.story.alt" />
              </div>
            </div>

            {/* オープンワールド */}
            <div className="feature-block">
              <div className="feature-content">
                <h3 className="feature-title" data-i18n="features.openworld.title">オープンワールド</h3>
                <p className="feature-subtitle" data-i18n="features.openworld.subtitle">美麗なグラフィックで描かれた世界を工場で埋め尽くそう！</p>
                <ul className="feature-list">
                  <li data-i18n="features.openworld.items.0">アニメ調の美しい3Dグラフィック</li>
                  <li data-i18n="features.openworld.items.1">広大なマップを自由に探索</li>
                  <li data-i18n="features.openworld.items.2">あなたの工場で世界を変えていく</li>
                </ul>
              </div>
              <div className="feature-image">
                <img src="/landing/images/game-feature-openworld.png" alt="オープンワールド" data-i18n-alt="features.openworld.alt" />
              </div>
            </div>

            {/* 技術進化 */}
            <div className="feature-block reverse">
              <div className="feature-content">
                <h3 className="feature-title" data-i18n="features.tech.title">技術を発展させる</h3>
                <p className="feature-subtitle" data-i18n="features.tech.subtitle">人類の技術進化をたどる壮大な旅</p>
                <ul className="feature-list">
                  <li data-i18n="features.tech.items.0">水車から始まり、蒸気機関、電気、核融合まで</li>
                  <li data-i18n="features.tech.items.1">各時代の技術を再現した機械</li>
                  <li data-i18n="features.tech.items.2">テックツリーで新技術を解放</li>
                </ul>
              </div>
              <div className="feature-image">
                <img src="/landing/images/game-feature-tech.jpg" alt="技術進化" data-i18n-alt="features.tech.alt" />
              </div>
            </div>

            {/* 初心者向け */}
            <div className="feature-block">
              <div className="feature-content">
                <h3 className="feature-title" data-i18n="features.beginner.title">自動化初心者でも安心</h3>
                <p className="feature-subtitle" data-i18n="features.beginner.subtitle">初めての自動化も、丁寧なガイドで快適なゲーム体験</p>
                <ul className="feature-list">
                  <li data-i18n="features.beginner.items.0">自動化ゲームをプレイしたことがない人でもOK</li>
                  <li data-i18n="features.beginner.items.1">段階的なチュートリアルシステム</li>
                  <li data-i18n="features.beginner.items.2">スムーズにゲームに没入できる設計</li>
                </ul>
              </div>
              <div className="feature-image">
                <img src="/landing/images/game-feature-tutorial.png" alt="初心者向けチュートリアル" data-i18n-alt="features.beginner.alt" />
              </div>
            </div>
          </div>
        </section>

        {/* ストーリー */}
        <section className="story" id="story">
          <div className="container">
            <h2 className="section-title" data-i18n="story.title">ストーリー</h2>
            <div className="story-content">
              <h3 className="story-catchphrase" data-i18n="story.catchphrase">追放されたのではなく、愛されていた。</h3>
              <div className="story-text">
                <p data-i18n="story.text.0">西暦2700年、人類が自由に恒星間航行できるようになった時代。</p>
                <p data-i18n="story.text.1">惑星セレスタルの姫・ヨリは、理由も分からぬまま遥か遠くの<br />無人惑星アルカディアへと追放される。</p>
                <p data-i18n="story.text.2">何としてでも理由を知りたかった彼女は、工業化を進めるうちに真実を知る。</p>
                <p data-i18n="story.text.3">自分を捨てたと思っていた人々は、実は自分を愛していたのだと——</p>
              </div>
            </div>
          </div>
        </section>

        {/* キャラクター */}
        <section className="characters" id="characters">
          <div className="container">
            <h2 className="section-title" data-i18n="characters.title">キャラクター</h2>
            <h3 className="characters-subtitle" data-i18n="characters.subtitle">仲間との絆を作る</h3>

            {/* キャラクターアイコン */}
            <div className="character-icons">
              <div className="character-icon active" data-character="1">
                <div className="character-icon-image">
                  <img src="/landing/images/character-main-icon.png" alt="ヨリ" />
                </div>
                <p className="character-icon-name" data-character-name="1">ヨリ</p>
              </div>

              <div className="character-icon" data-character="2">
                <div className="character-icon-image">
                  <img src="/landing/images/character-ai-icon.png" alt="エレノ" />
                </div>
                <p className="character-icon-name" data-character-name="2">エレノ</p>
              </div>

              <div className="character-icon" data-character="3">
                <div className="character-icon-image">
                  <img src="/landing/images/character-friend-icon.png" alt="クルア" />
                </div>
                <p className="character-icon-name" data-character-name="3">クルア</p>
              </div>
            </div>

            {/* キャラクター詳細表示エリア */}
            <div className="character-display" id="characterDisplay">
            </div>
          </div>
        </section>

        {/* mod開発 */}
        <section className="mod" id="mod">
          <div className="container">
            <h2 className="section-title" data-i18n="mod.title">mod開発</h2>
            <h3 className="mod-subtitle" data-i18n="mod.subtitle">modで新たな体験を、mod開発に新たな体験を</h3>
            <div className="mod-content">
              <div className="mod-features">
                <div className="mod-feature">
                  <div className="mod-icon">🔧</div>
                  <h4 data-i18n="mod.features.0.title">modを全面的にサポート</h4>
                  <p data-i18n="mod.features.0.description">ゲームシステムの大部分をmodで拡張可能</p>
                </div>
                <div className="mod-feature">
                  <div className="mod-icon">📖</div>
                  <h4 data-i18n="mod.features.1.title">オープンソース</h4>
                  <p data-i18n="mod.features.1.description">ゲームコードをOSS化し、mod開発者がゲーム開発にも参加できる</p>
                </div>
                <div className="mod-feature">
                  <div className="mod-icon">🤖</div>
                  <h4 data-i18n="mod.features.2.title">強力な開発ツール</h4>
                  <p data-i18n="mod.features.2.description">ドキュメント、AIサポートツールにより、誰でもmod開発できる</p>
                </div>
              </div>
              <div className="mod-links">
                <a href="https://discord.gg/ERPMZrrAdp" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-mod-large">
                  <img src="/landing/images/icon-discord.svg" alt="Discord" className="btn-icon-large" />
                  <span data-i18n="mod.buttons.discord">Discordに参加</span>
                </a>
                <a href="https://github.com/moorestech/moorestech" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-mod-large">
                  <img src="/landing/images/icon-github.svg" alt="GitHub" className="btn-icon-large" />
                  <span data-i18n="mod.buttons.github">GitHubを見る</span>
                </a>
                <a href="/docs/intro" className="btn btn-secondary btn-mod-large">
                  <span data-i18n="mod.buttons.wiki">Wikiを見る</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* スクリーンショットギャラリー */}
        <section className="gallery" id="gallery">
          <div className="container">
            <h2 className="section-title" data-i18n="gallery.title">スクリーンショット</h2>
            <div className="gallery-grid">
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-1.jpg" alt="スクリーンショット1" data-i18n-alt="gallery.alt.0" />
              </div>
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-2.jpg" alt="スクリーンショット2" data-i18n-alt="gallery.alt.1" />
              </div>
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-3.jpg" alt="スクリーンショット3" data-i18n-alt="gallery.alt.2" />
              </div>
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-4.jpg" alt="スクリーンショット4" data-i18n-alt="gallery.alt.3" />
              </div>
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-5.jpg" alt="スクリーンショット5" data-i18n-alt="gallery.alt.4" />
              </div>
              <div className="gallery-item">
                <img src="/landing/images/game-screenshot-6.jpg" alt="スクリーンショット6" data-i18n-alt="gallery.alt.5" />
              </div>
            </div>
          </div>
        </section>

        {/* プレスキット */}
        <section className="press" id="press">
          <div className="container">
            <h2 className="section-title" data-i18n="press.title">プレスキット / メディア向け</h2>
            <p className="press-subtitle" data-i18n="press.subtitle">記者・メディアの方へ</p>
            <div className="press-main-buttons">
              <a href="/landing/press/presskit.zip" download className="btn btn-primary btn-press-main" data-i18n="press.buttons.download_all">全てダウンロード</a>
              <a href="https://impress.games/press-kit/sakastudio/moorestech" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-press-main" data-i18n="press.buttons.open_kit">Press Kitを開く</a>
            </div>
            <div className="press-contact">
              <p><span data-i18n="press.contact">お問い合わせ先: </span><a href="mailto:sakastudio@moores.tech">sakastudio@moores.tech</a></p>
            </div>
          </div>
        </section>

        {/* コミュニティ＆SNS */}
        <section className="community" id="community">
          <div className="container">
            <h2 className="section-title" data-i18n="community.title">コミュニティに参加しよう</h2>
            <div className="social-links">
              <a href="https://discord.gg/ERPMZrrAdp" target="_blank" rel="noopener noreferrer" className="social-link discord">
                <div className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <span data-i18n="community.platforms.discord">Discord</span>
              </a>
              <a href="https://x.com/sakastudio_" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                <div className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span data-i18n="community.platforms.twitter">X / Twitter</span>
              </a>
              <a href="https://www.youtube.com/@sakastudio_" target="_blank" rel="noopener noreferrer" className="social-link youtube">
                <div className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <span data-i18n="community.platforms.youtube">YouTube</span>
              </a>
              <a href="https://github.com/moorestech/moorestech" target="_blank" rel="noopener noreferrer" className="social-link github">
                <div className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </div>
                <span data-i18n="community.platforms.github">GitHub</span>
              </a>
            </div>
          </div>
        </section>

        {/* 最終CTA */}
        <section className="final-cta">
          <div className="container">
            <h2 className="final-cta-title" data-i18n="cta.title">2026年夏、Steamでリリース予定</h2>
            <div className="final-cta-buttons">
              <a href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-cta-large">
                <img src="/landing/images/icon-steam.svg" alt="Steam" className="btn-icon-large" />
                <span data-i18n="cta.steam">Steamウィッシュリストに追加</span>
              </a>
              <a href="https://discord.gg/ERPMZrrAdp" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-cta-large">
                <svg className="btn-icon-large" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span data-i18n="cta.discord">Discordコミュニティに参加</span>
              </a>
            </div>
          </div>
        </section>

        {/* フッター */}
        <footer className="footer">
          <div className="container">
            <p data-i18n="footer.copyright">&copy; 2025 moorestech. All rights reserved.</p>
          </div>
        </footer>

        {/* トレイラーモーダル */}
        <div className="modal" id="trailerModal">
          <div className="modal-content">
            <button className="modal-close" id="closeModal">&times;</button>
            <div className="modal-video">
              <iframe
                id="trailerIframe"
                width="100%"
                height="100%"
                src=""
                title="Game Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen>
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
