// Internationalization (i18n) System for BinBox Games

class I18n {
    constructor() {
        this.currentLanguage = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        this.translations = {};
        this.basePath = 'js/lang/';
        this.storageKey = window.PlayGroundConfig?.site.languageStorageKey || 'selectedLanguage';
        // Don't auto-initialize, let manual init() calls control this
    }

    /**
     * Resolve language with priority: URL ?lang= > localStorage > navigator.language > config default
     * @returns {string} Resolved language code
     */
    resolveLanguage() {
        const supported = window.PlayGroundConfig?.site.supportedLanguages || ['ko', 'en', 'ja'];
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';

        // 1. URL ?lang= parameter
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && supported.includes(langParam)) {
            localStorage.setItem(this.storageKey, langParam);
            return langParam;
        }

        // 2. localStorage saved preference
        const savedLang = localStorage.getItem(this.storageKey);
        if (savedLang && supported.includes(savedLang)) {
            return savedLang;
        }

        // 3. Browser language (en-US → en)
        const browserLang = (navigator.language || '').split('-')[0];
        if (browserLang && supported.includes(browserLang)) {
            return browserLang;
        }

        // 4. Config default fallback
        return defaultLang;
    }

    /**
     * Update canonical <link> tag to match current language
     * @param {string} lang - Current language code
     */
    updateCanonical(lang) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) return;

        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        const baseUrl = canonical.href.split('?')[0];

        canonical.href = (lang === defaultLang) ? baseUrl : `${baseUrl}?lang=${lang}`;
    }

    async init(initialLang, basePath = 'js/lang/') {
        this.basePath = basePath;

        this.currentLanguage = initialLang || this.resolveLanguage();

        // Load default language
        await this.loadLanguage(this.currentLanguage);

        // Set up language selector
        this.setupLanguageSelector();

        // Apply translations
        this.applyTranslations();

        // Set HTML lang attribute and update canonical
        document.documentElement.lang = this.currentLanguage;
        this.updateCanonical(this.currentLanguage);
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
            this.applyTranslations();
            
            // Save language preference (use config key)
            localStorage.setItem(this.storageKey, lang);
            
            // Update all language selectors and canonical
            this.updateLanguageSelectors(lang);
            this.updateCanonical(lang);
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
        const initialLang = window.i18n.resolveLanguage();

        // For games, use relative path for language files
        const basePath = '../../js/lang/';
        await window.i18n.init(initialLang, basePath);
        // Update language selectors to match resolved language
        window.i18n.updateLanguageSelectors(initialLang);
    });
}
