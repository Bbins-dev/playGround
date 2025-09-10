// Internationalization (i18n) System for PlayGround

class I18n {
    constructor() {
        this.currentLanguage = 'ko';
        this.translations = {};
        this.basePath = 'js/lang/';
        // Don't auto-initialize, let manual init() calls control this
    }

    async init(initialLang = 'ko', basePath = 'js/lang/') {
        this.basePath = basePath;
        this.currentLanguage = initialLang;
        
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
            this.applyTranslations();
            
            // Save language preference (use consistent key)
            localStorage.setItem('selectedLanguage', lang);
            
            // Update all language selectors
            this.updateLanguageSelectors(lang);
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
        const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
        await this.setLanguage(savedLang);
    }
}

// Initialize i18n system
if (!window.i18n) {
    window.i18n = new I18n();
}

// Auto-initialize for main page
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
        await window.i18n.init(savedLang);
        await window.i18n.loadSavedLanguage();
    });
}
