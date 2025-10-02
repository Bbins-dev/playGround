// 자동전투 카드게임 메인 진입점

class CardBattleGame {
    constructor() {
        this.gameManager = null;
        this.initialized = false;
    }

    // 게임 초기화 및 시작
    async init() {
        try {

            // i18n 시스템 초기화 (await 추가)
            if (typeof initializeI18n === 'function') {
                await initializeI18n();
            }

            // 게임 매니저 생성 및 초기화
            this.gameManager = new GameManager();
            await this.gameManager.init();

            // 전역 접근을 위한 안전한 참조 (치팅 방지 포함)
            this.setupSecureGlobalAccess();

            this.setupEventListeners();
            this.initialized = true;


        } catch (error) {
            this.showErrorMessage(error);
        }
    }

    // 안전한 전역 접근 설정 (치팅 방지)
    setupSecureGlobalAccess() {
        // GameManager를 전역에서 접근 가능하도록 하되, 중요 메서드 보호
        window.gameManager = this.gameManager;

        // 중요 게임 데이터 보호
        this.protectGameData();
    }

    // 게임 데이터 보호 (치팅 방지)
    protectGameData() {
        try {
            // 카드 데이터베이스 보호 (읽기 전용)
            if (window.CardDatabase) {
                Object.freeze(window.CardDatabase);
                Object.freeze(window.CardDatabase.cards);
                // 개별 카드 데이터 보호
                Object.values(window.CardDatabase.cards).forEach(card => {
                    Object.freeze(card);
                });
            }

            // GameConfig 보호
            if (window.GameConfig) {
                Object.freeze(window.GameConfig);
                Object.freeze(window.GameConfig.elements);
                Object.freeze(window.GameConfig.cardTypes);
                Object.freeze(window.GameConfig.canvas);
                Object.freeze(window.GameConfig.ui);
            }

            // Player와 Enemy 클래스의 중요 메서드 보호
            if (window.Player && window.Player.prototype) {
                this.protectPlayerMethods();
            }

            if (window.Enemy && window.Enemy.prototype) {
                this.protectEnemyMethods();
            }

            // 게임 무결성 검사 타이머 설정
            this.setupIntegrityMonitoring();

        } catch (error) {
            console.warn('데이터 보호 설정 중 오류:', error);
        }
    }

    // Player 메서드 보호
    protectPlayerMethods() {
        const originalSetHP = window.Player.prototype.setHP || function() {};
        const originalTakeDamage = window.Player.prototype.takeDamage || function() {};

        // HP 변경을 감시하고 보호
        window.Player.prototype.setHP = function(value) {
            // 유효한 범위 체크
            if (typeof value !== 'number' || value < 0 || value > this.maxHP || value > 1000) {
                console.warn('비정상적인 HP 값 감지:', value);
                return;
            }
            return originalSetHP.call(this, value);
        };

        Object.freeze(window.Player.prototype.setHP);
    }

    // Enemy 메서드 보호
    protectEnemyMethods() {
        const originalSetHP = window.Enemy.prototype.setHP || function() {};
        const originalTakeDamage = window.Enemy.prototype.takeDamage || function() {};

        window.Enemy.prototype.setHP = function(value) {
            if (typeof value !== 'number' || value < 0 || value > this.maxHP || value > 1000) {
                console.warn('비정상적인 HP 값 감지:', value);
                return;
            }
            return originalSetHP.call(this, value);
        };

        Object.freeze(window.Enemy.prototype.setHP);
    }

    // 게임 무결성 모니터링 시스템
    setupIntegrityMonitoring() {
        // 5초마다 무결성 검사
        this.integrityTimer = setInterval(() => {
            this.performIntegrityCheck();
        }, 5000);

        // 페이지 가시성 변경 시 검사
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => this.performIntegrityCheck(), 1000);
            }
        });
    }

    // 무결성 검사 수행
    performIntegrityCheck() {
        try {
            // GameManager 존재 및 상태 확인
            if (!this.gameManager || !this.gameManager.isGameRunning) {
                return;
            }

            const gameManager = this.gameManager;

            // Player/Enemy HP 범위 검사
            if (gameManager.player && typeof gameManager.player.hp === 'number') {
                if (gameManager.player.hp < 0 || gameManager.player.hp > gameManager.player.maxHP + 50) {
                    console.warn('Player HP 비정상 값 감지:', gameManager.player.hp);
                    this.resetToSafeState();
                    return;
                }
            }

            if (gameManager.enemy && typeof gameManager.enemy.hp === 'number') {
                if (gameManager.enemy.hp < 0 || gameManager.enemy.hp > gameManager.enemy.maxHP + 50) {
                    console.warn('Enemy HP 비정상 값 감지:', gameManager.enemy.hp);
                    this.resetToSafeState();
                    return;
                }
            }

            // 중요 객체 변조 검사
            if (window.CardDatabase && !Object.isFrozen(window.CardDatabase)) {
                console.warn('CardDatabase 보호가 해제됨');
                Object.freeze(window.CardDatabase);
            }

            if (window.GameConfig && !Object.isFrozen(window.GameConfig)) {
                console.warn('GameConfig 보호가 해제됨');
                Object.freeze(window.GameConfig);
            }

        } catch (error) {
            console.warn('무결성 검사 중 오류:', error);
        }
    }

    // 안전한 상태로 복원
    resetToSafeState() {
        try {
            if (this.gameManager && this.gameManager.switchScreen) {
                console.log('게임을 안전한 상태로 복원 중...');
                this.gameManager.switchScreen('menu');
            }
        } catch (error) {
            console.warn('안전 상태 복원 중 오류:', error);
            // 최후 수단: 페이지 새로고침
            setTimeout(() => {
                if (confirm('게임에서 오류가 감지되었습니다. 새로고침하시겠습니까?')) {
                    location.reload();
                }
            }, 100);
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 언어 변경은 i18n.js에서 처리함 (중복 제거)

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
        // 무결성 모니터링 타이머 정리
        if (this.integrityTimer) {
            clearInterval(this.integrityTimer);
            this.integrityTimer = null;
        }

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

// 에러 핸들링 (강화 버전)
window.addEventListener('error', (event) => {
    console.error('전역 JavaScript 오류 감지:', event.error);

    // 게임이 초기화되어 있다면 안전한 상태로 복귀
    if (cardBattleGame && cardBattleGame.isInitialized()) {
        const gameManager = cardBattleGame.getGameManager();
        if (gameManager && gameManager.switchScreen) {
            try {
                gameManager.switchScreen('menu');
            } catch (error) {
                console.error('메뉴로 전환 중 오류:', error);
            }
        }
    }
});

// 처리되지 않은 Promise 거부 처리 (강화 버전)
window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);

    // 게임 관련 에러인 경우 메뉴로 이동
    if (event.reason && event.reason.message &&
        (event.reason.message.includes('battle') ||
         event.reason.message.includes('card') ||
         event.reason.message.includes('game'))) {

        if (cardBattleGame && cardBattleGame.isInitialized()) {
            const gameManager = cardBattleGame.getGameManager();
            if (gameManager && gameManager.switchScreen) {
                try {
                    gameManager.switchScreen('menu');
                } catch (error) {
                    console.error('Promise 에러 후 메뉴 전환 실패:', error);
                }
            }
        }
    }

    event.preventDefault();
});

// 개발자 도구용 전역 접근
window.cardBattleGame = cardBattleGame;

// i18n 헬퍼 함수들
async function initializeI18n() {
    // 기존 window.i18n이 있고 이미 초기화되었는지 확인
    if (window.i18n && window.i18n.isReady) {
        console.log('[Game] i18n already initialized');
        window.i18nSystem = window.i18n;
        return;
    }

    const savedLang = localStorage.getItem('selectedLanguage') || 'ko';

    // 기존 window.i18n 인스턴스 사용 (새로 생성하지 않음)
    if (!window.i18n) {
        window.i18n = new I18n();
    }

    // 초기화 및 동일 객체 참조
    await window.i18n.init(savedLang, 'js/lang/');
    window.i18nSystem = window.i18n;

    // 언어 선택기 동기화
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = savedLang;
    }

    console.log('[Game] i18n initialized successfully');
}

function changeLanguage(lang) {
    if (window.i18nSystem) {
        window.i18nSystem.setLanguage(lang);
    }
}

// 튜토리얼 모달을 위한 강제 번역 적용 함수
function applyTutorialTranslations() {
    if (window.i18nSystem) {
        window.i18nSystem.applyTranslations();
    }
}

function getI18nText(key) {
    // I18nHelper를 우선 사용
    if (window.I18nHelper) {
        return window.I18nHelper.getText(key);
    }

    // 기존 시스템 백업
    if (window.i18nSystem) {
        return window.i18nSystem.getTranslation(key);
    }
    return key; // fallback
}