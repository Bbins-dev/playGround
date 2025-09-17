// 자동전투 카드게임 메인 진입점

class CardBattleGame {
    constructor() {
        this.gameManager = null;
        this.initialized = false;
    }

    // 게임 초기화 및 시작
    async init() {
        try {

            // i18n 시스템 초기화
            if (typeof initializeI18n === 'function') {
                initializeI18n();
            }

            // 게임 매니저 생성 및 초기화
            this.gameManager = new GameManager();
            this.gameManager.init();

            this.setupEventListeners();
            this.initialized = true;


        } catch (error) {
            this.showErrorMessage(error);
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 언어 변경 이벤트 리스너
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (typeof changeLanguage === 'function') {
                    changeLanguage(e.target.value);
                }
            });
        }

        // 뒤로가기 버튼
        const backButton = document.getElementById('back-to-main');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.href = '../../index.html';
            });
        }
    }

    // 에러 메시지 표시
    showErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 68, 68, 0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        errorDiv.innerHTML = `
            <h3>🚨 게임 로드 오류</h3>
            <p style="margin: 15px 0;">${error.message}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 20px;
                background: #fff;
                color: #ff4444;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">새로고침</button>
        `;
        document.body.appendChild(errorDiv);
    }

    // 게임 종료
    destroy() {
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        this.initialized = false;
    }

    // 게임 상태 확인
    isInitialized() {
        return this.initialized;
    }

    // 게임 매니저 접근
    getGameManager() {
        return this.gameManager;
    }
}

// 전역 게임 인스턴스
let cardBattleGame = null;

// DOM 로드 완료 시 게임 시작
document.addEventListener('DOMContentLoaded', async () => {

    // 잠시 대기 후 게임 시작 (모든 스크립트 로드 완료 대기)
    setTimeout(async () => {
        if (!cardBattleGame) {
            cardBattleGame = new CardBattleGame();
            await cardBattleGame.init();
        }
    }, 100);
});

// 페이지 언로드 시 게임 정리
window.addEventListener('beforeunload', () => {
    if (cardBattleGame) {
        cardBattleGame.destroy();
    }
});

// 에러 핸들링
window.addEventListener('error', (event) => {

    if (cardBattleGame && cardBattleGame.isInitialized()) {
        const gameManager = cardBattleGame.getGameManager();
        if (gameManager && gameManager.switchScreen) {
            gameManager.switchScreen('menu');
        }
    }
});

// 처리되지 않은 Promise 거부 처리
window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
});

// 개발자 도구용 전역 접근
window.cardBattleGame = cardBattleGame;

// i18n 헬퍼 함수들
function initializeI18n() {
    const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
    const i18n = new I18n();
    i18n.init(savedLang, '../../js/lang/');
    window.i18nSystem = i18n;

    // 언어 선택기 동기화
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = savedLang;
    }

}

function changeLanguage(lang) {
    if (window.i18nSystem) {
        window.i18nSystem.setLanguage(lang);
    }
}

function getI18nText(key) {
    if (window.i18nSystem) {
        return window.i18nSystem.getTranslation(key);
    }
    return key;
}