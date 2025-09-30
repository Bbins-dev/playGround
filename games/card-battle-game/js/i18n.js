// Internationalization (i18n) System for BinBox Games

class I18n {
    constructor() {
        this.currentLanguage = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        this.translations = {};
        this.basePath = 'js/lang/';
        this.storageKey = window.PlayGroundConfig?.site.languageStorageKey || 'selectedLanguage';
        // Don't auto-initialize, let manual init() calls control this
    }

    async init(initialLang, basePath = 'js/lang/') {
        this.basePath = basePath;
        
        // Use config default if no initial language provided
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        this.currentLanguage = initialLang || defaultLang;
        
        // Load default language
        await this.loadLanguage(this.currentLanguage);
        
        // Set up language selector
        this.setupLanguageSelector();
        
        // Apply translations
        this.applyTranslations();
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`${this.basePath}${lang}.json`);
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

            // Add language class to body for language-specific styling
            document.body.className = document.body.className.replace(/lang-\w+/g, '');
            document.body.classList.add(`lang-${lang}`);

            this.applyTranslations();

            // Save language preference (use config key)
            localStorage.setItem(this.storageKey, lang);

            // Update all language selectors
            this.updateLanguageSelectors(lang);

            // Update UIManager language (스테이지 인디케이터 등)
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateLanguage();
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
                element.textContent = translation;
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
        
        // Handle content attribute translations (for meta tags)
        const contentElements = document.querySelectorAll('[data-i18n-content]');
        contentElements.forEach(element => {
            const key = element.getAttribute('data-i18n-content');
            const translation = this.getTranslation(key);
            if (translation) {
                element.setAttribute('content', translation);
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

// Auto-initialize for games only (main page is handled by main.js)
if (window.location.pathname.includes('/games/')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const storageKey = window.PlayGroundConfig?.site.languageStorageKey || 'selectedLanguage';
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        const savedLang = localStorage.getItem(storageKey) || defaultLang;

        // Add initial language class to body
        document.body.classList.add(`lang-${savedLang}`);

        // For games, use relative path for language files
        const basePath = 'js/lang/';
        await window.i18n.init(savedLang, basePath);
        // Update language selectors to match saved language
        window.i18n.updateLanguageSelectors(savedLang);
    });
}
