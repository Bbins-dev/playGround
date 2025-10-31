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

    // Deep Freeze 유틸리티 (재귀적 불변화)
    deepFreeze(obj) {
        // null이나 primitive 타입은 건너뛰기
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // 이미 frozen된 객체는 건너뛰기
        if (Object.isFrozen(obj)) {
            return obj;
        }

        // 현재 레벨 freeze
        Object.freeze(obj);

        // 모든 속성에 대해 재귀적으로 freeze
        Object.getOwnPropertyNames(obj).forEach(prop => {
            const value = obj[prop];
            if (value !== null &&
                (typeof value === 'object' || typeof value === 'function') &&
                !Object.isFrozen(value)) {
                this.deepFreeze(value);
            }
        });

        return obj;
    }

    // 게임 데이터 보호 (치팅 방지)
    protectGameData() {
        try {
            // 카드 데이터베이스 보호 (Deep Freeze로 완전 불변화)
            if (window.CardDatabase) {
                this.deepFreeze(window.CardDatabase);
            }

            // GameConfig 보호 (Deep Freeze로 완전 불변화)
            if (window.GameConfig) {
                this.deepFreeze(window.GameConfig);
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

    // 게임 무결성 모니터링 시스템 - 배터리 최적화
    setupIntegrityMonitoring() {
        const securityConfig = GameConfig?.constants?.security;

        // 반복 검사: enableIntegrityCheck 설정에 따라 조건부 실행 (배터리 절약)
        if (securityConfig?.enableIntegrityCheck) {
            const checkInterval = securityConfig.integrityCheckInterval || 2000;
            this.integrityTimer = setInterval(() => {
                this.performIntegrityCheck();
            }, checkInterval);
        }

        // 페이지 복귀 시 검사: checkOnPageFocus 설정에 따라 실행 (영향 미비)
        if (securityConfig?.checkOnPageFocus) {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    setTimeout(() => this.performIntegrityCheck(), 1000);
                }
            });
        }
    }

    // 무결성 검사 수행 (강화 버전)
    performIntegrityCheck() {
        try {
            // GameManager 존재 및 상태 확인
            if (!this.gameManager || !this.gameManager.isGameRunning) {
                return;
            }

            const gm = this.gameManager;
            const securityConfig = GameConfig?.constants?.security;
            const violations = [];

            // 1. Player/Enemy HP 범위 검사 (Configuration-Driven)
            if (gm.player && typeof gm.player.hp === 'number') {
                const maxAllowedHP = gm.player.maxHP + (securityConfig?.maxHPTolerance || 50);
                if (gm.player.hp < 0 || gm.player.hp > maxAllowedHP) {
                    violations.push(`Player HP 비정상: ${gm.player.hp} (최대: ${maxAllowedHP})`);
                }
            }

            if (gm.enemy && typeof gm.enemy.hp === 'number') {
                const maxAllowedHP = gm.enemy.maxHP + (securityConfig?.maxHPTolerance || 50);
                if (gm.enemy.hp < 0 || gm.enemy.hp > maxAllowedHP) {
                    violations.push(`Enemy HP 비정상: ${gm.enemy.hp} (최대: ${maxAllowedHP})`);
                }
            }

            // 2. 손패 크기 검증 (Configuration-Driven)
            if (gm.player?.hand && Array.isArray(gm.player.hand)) {
                const maxHandSize = GameConfig.player.maxHandSize + (securityConfig?.maxHandSizeTolerance || 5);
                if (gm.player.hand.length > maxHandSize) {
                    violations.push(`손패 크기 초과: ${gm.player.hand.length} (최대: ${maxHandSize})`);
                }
            }

            // 3. 버프 수치 검증 (Configuration-Driven)
            if (gm.player) {
                const maxBuff = securityConfig?.maxBuffValue || 100;
                const buffChecks = [
                    { name: 'strength', value: gm.player.strength },
                    { name: 'focusTurns', value: gm.player.focusTurns },
                    { name: 'speedTurns', value: gm.player.speedTurns }
                ];

                buffChecks.forEach(check => {
                    if (check.value > maxBuff) {
                        violations.push(`버프 수치 비정상 (${check.name}): ${check.value} (최대: ${maxBuff})`);
                    }
                });
            }

            // 4. 스테이지 번호 검증 (Configuration-Driven)
            const maxStage = securityConfig?.maxStageNumber || 100;
            if (gm.currentStage > maxStage || gm.currentStage < 1) {
                violations.push(`스테이지 번호 비정상: ${gm.currentStage} (범위: 1-${maxStage})`);
            }

            // 5. 전투 상태 논리 검증
            if (gm.battleSystem?.battlePhase === 'ended' && gm.isGameRunning) {
                // 전투가 정상적으로 끝났는지 재확인
                const playerDead = gm.player?.isDead();
                const enemyDead = gm.enemy?.isDead();
                if (!playerDead && !enemyDead) {
                    violations.push('전투 상태 비정상: 양측 모두 생존 중인데 전투 종료됨');
                }
            }

            // 6. 중요 객체 변조 검사
            if (window.CardDatabase && !Object.isFrozen(window.CardDatabase)) {
                violations.push('CardDatabase 보호 해제 감지');
                this.deepFreeze(window.CardDatabase);
            }

            if (window.GameConfig && !Object.isFrozen(window.GameConfig)) {
                violations.push('GameConfig 보호 해제 감지');
                this.deepFreeze(window.GameConfig);
            }

            // 7. 위반 사항 처리
            if (violations.length > 0) {
                console.error('[CHEAT DETECTED] 게임 무결성 위반:', violations);
                this.resetToSafeState();
                return;
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
    // URL 파라미터 조기 체크 (공유 링크 감지)
    const urlParams = new URLSearchParams(window.location.search);
    const hasShareParam = urlParams.get('share');

    if (hasShareParam) {
        console.log('[Game] 공유 링크 감지, ShareLandingPage 초기화 준비');
    }

    // 공유 링크가 있으면 즉시 ShareLandingPage 초기화 시도
    if (hasShareParam) {
        console.log('[Game] 공유 링크용 빠른 초기화 시작...');

        // GameManager 준비 대기 (최대 3초)
        let retries = 0;
        const maxRetries = 30; // 100ms * 30 = 3초

        const waitForGameManager = setInterval(() => {
            retries++;

            if (cardBattleGame?.getGameManager && cardBattleGame.getGameManager()) {
                clearInterval(waitForGameManager);

                try {
                    const gameManager = cardBattleGame.getGameManager();
                    console.log('[Game] GameManager 준비 완료, ShareLandingPage 초기화 중...');

                    if (window.ShareLandingPage) {
                        window.shareLandingPageInstance = new ShareLandingPage(gameManager);
                        console.log('[Game] ShareLandingPage 초기화 완료');
                    } else {
                        console.error('[Game] ShareLandingPage 클래스를 찾을 수 없습니다!');
                    }
                } catch (error) {
                    console.error('[Game] ShareLandingPage 초기화 중 에러:', error);
                }
            } else if (retries >= maxRetries) {
                clearInterval(waitForGameManager);
                console.error('[Game] GameManager 대기 시간 초과 (3초)');
            }
        }, 100);
    }

    // 잠시 대기 후 게임 시작 (모든 스크립트 로드 완료 대기)
    setTimeout(async () => {
        console.log('[Game] setTimeout 실행됨, cardBattleGame:', !!cardBattleGame);

        if (!cardBattleGame) {
            try {
                console.log('[Game] CardBattleGame 초기화 시작...');
                cardBattleGame = new CardBattleGame();
                await cardBattleGame.init();
                console.log('[Game] CardBattleGame 초기화 완료');
            } catch (error) {
                console.error('[Game] CardBattleGame 초기화 중 에러:', error);
            }
        } else {
            console.warn('[Game] cardBattleGame이 이미 존재함 - 초기화 생략');
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
    // 브라우저 확장 프로그램 관련 오류 필터링 (무시)
    if (event.reason && event.reason.message) {
        const message = event.reason.message;
        const extensionErrorPatterns = [
            'message channel closed',           // 확장 프로그램 메시지 채널 오류
            'Extension context invalidated',    // 확장 프로그램 컨텍스트 무효화
            'chrome-extension://',              // Chrome 확장 프로그램 URL
            'moz-extension://',                 // Firefox 확장 프로그램 URL
        ];

        // 확장 프로그램 관련 오류인 경우 조용히 무시
        if (extensionErrorPatterns.some(pattern => message.includes(pattern))) {
            event.preventDefault();
            return;
        }
    }

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

    // URL 파라미터 우선, 그 다음 localStorage, 마지막으로 기본값
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const savedLang = urlLang || localStorage.getItem('selectedLanguage') || 'ko';

    // URL에서 언어를 읽었으면 localStorage에도 저장
    if (urlLang && ['ko', 'en', 'ja'].includes(urlLang)) {
        localStorage.setItem('selectedLanguage', urlLang);
    }

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

    console.log('[Game] i18n initialized with language:', savedLang);
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