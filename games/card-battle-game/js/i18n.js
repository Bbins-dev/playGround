// Internationalization (i18n) System for BinBox Games

class I18n {
    constructor() {
        this.currentLanguage = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        this.translations = {};
        this.basePath = 'js/lang/';
        this.storageKey = window.PlayGroundConfig?.site.languageStorageKey || 'selectedLanguage';
        this.isReady = false; // 초기화 완료 플래그
        // Don't auto-initialize, let manual init() calls control this
    }

    async init(initialLang, basePath = 'js/lang/') {
        this.basePath = basePath;

        // Use config default if no initial language provided
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';

        // Check URL parameter first (for SEO and direct language links)
        const urlLang = this.getLanguageFromURL();
        this.currentLanguage = urlLang || initialLang || defaultLang;

        // Load default language
        await this.loadLanguage(this.currentLanguage);

        // Set up language selector
        this.setupLanguageSelector();

        // Apply translations
        this.applyTranslations();

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;

        // 초기화 완료 플래그 설정
        this.isReady = true;
        console.log('[I18n] System ready');
    }

    /**
     * Get language from URL parameter (?lang=ko)
     * @returns {string|null} Language code or null
     */
    getLanguageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');

        // Configuration-Driven: GameConfig에서 지원 언어 목록 가져오기
        const supportedLanguages = GameConfig?.seo?.supportedLanguages || ['ko', 'en', 'ja'];
        if (langParam && supportedLanguages.includes(langParam)) {
            return langParam;
        }
        return null;
    }

    /**
     * Update URL with language parameter without page reload
     * @param {string} lang - Language code
     */
    updateURLParameter(lang) {
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);

        // Update canonical tag
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = url.href;
        }
    }

    async loadLanguage(lang) {
        try {
            // 캐시 버스팅을 위한 버전 파라미터 추가
            const version = (typeof GameConfig !== 'undefined' && GameConfig.version) ? GameConfig.version : Date.now();
            const response = await fetch(`${this.basePath}${lang}.json?v=${version}`);
            if (response.ok) {
                this.translations[lang] = await response.json();
            } else {
                console.warn(`Failed to load language: ${lang}`);
            }
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
        }
    }

    setupLanguageSelector() {
        const languageSelect = document.getElementById('languageSelect');
        const gameLanguageSelect = document.getElementById('gameLanguageSelect');
        
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
        
        if (gameLanguageSelect) {
            gameLanguageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }

    async setLanguage(lang) {
        if (lang !== this.currentLanguage) {
            // Load new language if not already loaded
            if (!this.translations[lang]) {
                await this.loadLanguage(lang);
            }

            this.currentLanguage = lang;
            document.documentElement.lang = lang;

            // Update URL parameter for SEO
            this.updateURLParameter(lang);

            // Add language class to body for language-specific styling
            document.body.className = document.body.className.replace(/lang-\w+/g, '');
            document.body.classList.add(`lang-${lang}`);

            this.applyTranslations();

            // Save language preference (use config key)
            localStorage.setItem(this.storageKey, lang);

            // Update all language selectors
            this.updateLanguageSelectors(lang);

            // Invalidate CardRenderer cache for hand cards real-time update
            if (window.gameManager?.uiManager?.renderer?.cardRenderer) {
                const cardRenderer = window.gameManager.uiManager.renderer.cardRenderer;
                if (typeof cardRenderer.invalidateCache === 'function') {
                    cardRenderer.invalidateCache('language change');
                    cardRenderer.currentLanguage = lang;
                }
            }

            // Update UIManager language (스테이지 인디케이터 등)
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateLanguage();
            }

            // Update enemy name in real-time
            if (window.gameManager?.battleSystem?.enemy) {
                const enemy = window.gameManager.battleSystem.enemy;
                if (typeof enemy.generateEnemyName === 'function') {
                    enemy.name = enemy.generateEnemyName();

                    // Update HP bar display (null 체크 강화)
                    if (window.gameManager?.battleSystem?.player &&
                        window.gameManager?.battleSystem?.enemy &&
                        window.gameManager?.hpBarSystem) {
                        window.gameManager.hpBarSystem.updateNames(
                            window.gameManager.battleSystem.player,
                            enemy
                        );
                    }
                }
            }

            // Trigger canvas re-rendering for hand cards
            if (window.gameManager && typeof window.gameManager.requestRender === 'function') {
                window.gameManager.requestRender();
            }

            // 추가 번역 적용 (모달이 열려있다면)
            setTimeout(() => {
                this.applyTranslations();
            }, 50);
        }
    }
    
    updateLanguageSelectors(lang) {
        const selectors = ['languageSelect', 'gameLanguageSelect'];
        selectors.forEach(id => {
            const selector = document.getElementById(id);
            if (selector && selector.value !== lang) {
                selector.value = lang;
            }
        });
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                // 마커 파싱이 필요한 요소인지 확인
                const needsParsing = element.hasAttribute('data-i18n-parse');

                if (needsParsing && typeof DescriptionParser !== 'undefined') {
                    // DescriptionParser를 사용하여 마커 파싱
                    this.applyParsedTranslation(element, translation);
                } else {
                    // 일반 텍스트로 설정
                    element.textContent = translation;
                }
            }
        });

        // Handle placeholder translations
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Update page title if it has i18n attribute
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                document.title = translation;
            }
        }
    }

    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return null;
            }
        }
        
        return translation;
    }

    /**
     * 마커가 포함된 번역 텍스트를 파싱하여 클릭 가능한 라벨로 렌더링
     * @param {HTMLElement} element - 대상 요소
     * @param {string} translation - 번역 텍스트 (마커 포함)
     */
    applyParsedTranslation(element, translation) {
        // 기존 내용 초기화
        element.innerHTML = '';

        // DescriptionParser로 마커 파싱
        const segments = DescriptionParser.parse(translation);

        segments.forEach(segment => {
            if (segment.type === 'text') {
                // 일반 텍스트
                element.appendChild(document.createTextNode(segment.content));
            } else if (segment.type === 'label') {
                // 라벨 생성
                const labelInfo = DescriptionParser.getLabelInfo(segment.labelType, segment.labelKey);
                if (labelInfo) {
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'inline-label clickable-label';

                    // 폰트 크기 계산 (현재 요소의 폰트 크기 기준)
                    const computedStyle = window.getComputedStyle(element);
                    const baseFontSize = parseFloat(computedStyle.fontSize) || 14;
                    const adjustedFontSize = Math.max(10, baseFontSize * 0.9);

                    // 라벨 스타일 적용
                    labelSpan.style.cssText = DescriptionParser.getLabelCSS(labelInfo, adjustedFontSize);
                    labelSpan.textContent = `${labelInfo.emoji} ${labelInfo.name}`;

                    // 클릭 이벤트 - 툴팁 모달 표시
                    labelSpan.addEventListener('click', (e) => {
                        e.stopPropagation();

                        if (window.BuffStatusTooltipModal) {
                            window.BuffStatusTooltipModal.show(segment.labelType, segment.labelKey);
                        }
                    });

                    // 커서 스타일 추가
                    labelSpan.style.cursor = 'pointer';

                    element.appendChild(labelSpan);
                }
            }
        });
    }

    // Get translation for dynamic content
    t(key) {
        return this.getTranslation(key) || key;
    }

    // Load saved language preference
    async loadSavedLanguage() {
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        const savedLang = localStorage.getItem(this.storageKey) || defaultLang;
        await this.setLanguage(savedLang);
    }
}

// Initialize i18n system
if (!window.i18n) {
    window.i18n = new I18n();
}

// 게임별 수동 초기화로 변경 (이중 초기화 방지)
// 각 게임의 game.js에서 initializeI18n() 호출로 관리
