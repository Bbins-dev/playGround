// I18n Helper - 통합된 다국어 지원 시스템
class I18nHelper {
    static instance = null;

    constructor() {
        if (I18nHelper.instance) {
            return I18nHelper.instance;
        }
        I18nHelper.instance = this;
        this.fallbacks = {
            'auto_battle_card_game.ui.miss': '빗나감!',
            'auto_battle_card_game.ui.critical': '치명타!',
            'auto_battle_card_game.ui.defense': '방어!',
            'auto_battle_card_game.ui.victory': '승리!',
            'auto_battle_card_game.ui.defeat': '패배...'
        };
    }

    // 통합 텍스트 가져오기 - 모든 i18n 접근 패턴 통합
    getText(key) {
        // 1. window.i18nSystem 체크 (game.js 패턴) - 우선순위
        if (window.i18nSystem && typeof window.i18nSystem.getTranslation === 'function') {
            try {
                const text = window.i18nSystem.getTranslation(key);
                if (text && text !== key) return text;
            } catch (e) {}
        }

        // 2. window.I18n.getText 체크 (UIManager 패턴)
        if (window.I18n && typeof window.I18n.getTranslation === 'function') {
            try {
                const text = window.I18n.getTranslation(key);
                if (text && text !== key) return text;
            } catch (e) {}
        }

        // 3. window.i18n.t 체크 (Enemy/EffectSystem 패턴)
        if (window.i18n && typeof window.i18n.t === 'function') {
            try {
                const text = window.i18n.t(key);
                if (text && text !== key) return text;
            } catch (e) {}
        }

        // 4. Fallback
        return this.fallbacks[key] || key;
    }

    // 언어 설정
    setLanguage(lang) {
        if (window.i18nSystem && typeof window.i18nSystem.setLanguage === 'function') {
            window.i18nSystem.setLanguage(lang);
        }
        if (window.I18n && typeof window.I18n.setLanguage === 'function') {
            window.I18n.setLanguage(lang);
        }
    }

    // 현재 언어 가져오기
    getCurrentLanguage() {
        if (window.i18nSystem && window.i18nSystem.currentLanguage) {
            return window.i18nSystem.currentLanguage;
        }
        if (window.I18n && window.I18n.currentLanguage) {
            return window.I18n.currentLanguage;
        }
        return localStorage.getItem('language') || 'ko';
    }

    // 싱글톤 인스턴스 가져오기
    static getInstance() {
        if (!I18nHelper.instance) {
            I18nHelper.instance = new I18nHelper();
        }
        return I18nHelper.instance;
    }

    // 편의 메서드
    static getText(key) {
        return I18nHelper.getInstance().getText(key);
    }

    static setLanguage(lang) {
        return I18nHelper.getInstance().setLanguage(lang);
    }

    static getCurrentLanguage() {
        return I18nHelper.getInstance().getCurrentLanguage();
    }
}

// 전역 노출
window.I18nHelper = I18nHelper;