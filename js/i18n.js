// Internationalization (i18n) System for PlayGround

class I18n {
    constructor() {
        this.currentLanguage = 'ko';
        this.translations = {};
        this.init();
    }

    async init() {
        // Load default language
        await this.loadLanguage(this.currentLanguage);
        
        // Set up language selector
        this.setupLanguageSelector();
        
        // Apply translations
        this.applyTranslations();
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`js/lang/${lang}.json`);
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
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    async changeLanguage(lang) {
        if (lang !== this.currentLanguage) {
            // Load new language if not already loaded
            if (!this.translations[lang]) {
                await this.loadLanguage(lang);
            }
            
            this.currentLanguage = lang;
            document.documentElement.lang = lang;
            this.applyTranslations();
            
            // Save language preference
            localStorage.setItem('playground-language', lang);
        }
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
    loadSavedLanguage() {
        const savedLang = localStorage.getItem('playground-language');
        if (savedLang && this.translations[savedLang]) {
            this.changeLanguage(savedLang);
        }
    }
}

// Initialize i18n system
window.i18n = new I18n();

// Load saved language preference on page load
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.loadSavedLanguage();
});
