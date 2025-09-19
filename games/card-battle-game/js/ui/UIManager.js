// UI 관리 시스템 - Canvas와 DOM UI 통합 관리

class UIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // UI 요소들
        this.canvas = document.getElementById('gameCanvas');
        this.uiOverlay = document.getElementById('ui-overlay');

        // 렌더러
        this.renderer = new Renderer(this.canvas);

        // UI 상태
        this.currentScreen = 'menu'; // 'menu' | 'battle' | 'cardSelection' | 'gallery'
        this.isInteractive = true;

        // 갤러리에서 전투 일시정지 상태 추적
        this.battleWasPaused = false;

        // 렌더링 최적화
        this.renderCount = 0;
        this.lastLogTime = 0;

        // 이벤트 핸들러
        this.eventHandlers = new Map();

        // 모달 시스템
        this.modals = {
            cardGallery: document.getElementById('card-gallery-modal'),
            cardSelection: document.getElementById('card-selection-modal')
        };

        // 모달 상태
        this.modalState = null;

        // 초기화
        this.initialize();
    }

    // 초기화
    initialize() {
        try {
            this.renderer.initialize();
        } catch (error) {
            console.warn('Renderer initialization failed:', error);
            // Continue initialization even if renderer fails
        }
        this.setupEventListeners();
        this.setupSpeedControls();
        this.setupModals();
        this.updateLanguage();

    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 캔버스 클릭/터치 이벤트
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleCanvasTouch(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 윈도우 리사이즈
        window.addEventListener('resize', () => this.handleResize());

        // UI 버튼들
        this.setupUIButtons();

        // 모바일 방향 변경
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    // UI 버튼 설정
    setupUIButtons() {
        // 카드 갤러리 버튼
        const galleryBtn = document.getElementById('card-gallery-btn');
        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => this.showCardGallery());
        }

        // 홈페이지로 돌아가기 버튼
        const backToHomepageBtn = document.getElementById('back-to-homepage');
        if (backToHomepageBtn) {
            backToHomepageBtn.addEventListener('click', () => this.backToHomepage());
        }

        // 메뉴화면으로 돌아가기 버튼
        const backToMenuBtn = document.getElementById('back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.backToMenu());
        }

        // 갤러리 닫기
        const closeGallery = document.getElementById('close-gallery');
        if (closeGallery) {
            closeGallery.addEventListener('click', () => this.hideCardGallery());
        }

        // 카드 선택 건너뛰기
        const skipSelection = document.getElementById('skip-selection');
        if (skipSelection) {
            skipSelection.addEventListener('click', () => this.skipCardSelection());
        }
    }

    // 게임 속도 컨트롤 설정
    setupSpeedControls() {
        const speedButtons = document.querySelectorAll('.speed-btn');

        // localStorage에서 저장된 속도 설정 불러오기
        const savedSpeed = parseInt(localStorage.getItem('cardBattle_gameSpeed') || '1');

        speedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼에서 active 클래스 제거
                speedButtons.forEach(b => b.classList.remove('active'));

                // 클릭된 버튼에 active 클래스 추가
                e.target.classList.add('active');

                // 속도 값 추출 (1x, 2x, 3x)
                const speedText = e.target.textContent;
                const speed = parseInt(speedText.replace('x', ''));

                // localStorage에 속도 설정 저장
                localStorage.setItem('cardBattle_gameSpeed', speed.toString());

                // 게임 속도 설정
                if (this.gameManager.battleSystem) {
                    this.gameManager.battleSystem.setGameSpeed(speed);
                }
                if (this.gameManager) {
                    this.gameManager.setGameSpeed(speed);
                }

            });
        });

        // 초기 속도 설정 적용
        this.applyInitialSpeedSetting(savedSpeed);
    }

    // 초기 속도 설정 적용
    applyInitialSpeedSetting(speed) {
        const speedButtons = document.querySelectorAll('.speed-btn');

        // 저장된 속도에 해당하는 버튼 활성화
        speedButtons.forEach(btn => {
            btn.classList.remove('active');
            const btnSpeed = parseInt(btn.textContent.replace('x', ''));
            if (btnSpeed === speed) {
                btn.classList.add('active');
            }
        });

        // 전투 시스템이 있으면 속도 설정
        if (this.gameManager.battleSystem) {
            this.gameManager.battleSystem.setGameSpeed(speed);
        }
    }

    // 모달 설정
    setupModals() {
        // 모달 외부 클릭 시 닫기
        Object.values(this.modals).forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal);
                    }
                });
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    // 메인 렌더링 루프 (최적화)
    render() {
        const gameState = this.getGameState();

        // 렌더링 카운터 업데이트
        this.renderCount++;
        const currentTime = performance.now();

        // 모달이 활성화된 경우 모달만 렌더링 (다른 화면 렌더링 방지)
        if (this.modalState && (this.modalState.isAnimating || this.modalState.waitingForConfirm)) {
            const renderOptions = {
                type: this.modalState.type,
                alpha: this.modalState.alpha,
                stage: this.modalState.stage || 1,
                animationTime: this.modalState.animationTime || 0
            };

            // 패배 모달의 경우 추가 정보 전달
            if (this.modalState.type === 'defeat') {
                renderOptions.gameStats = this.modalState.gameStats;
                renderOptions.finalHand = this.modalState.finalHand;
                renderOptions.buttonHovered = this.modalState.buttonHovered;
            }

            this.renderer.renderModal(this.modalState.config, renderOptions);

            // 패배 모달에서 버튼 영역 업데이트
            if (this.modalState.type === 'defeat' && this.modalState.alpha >= 0.8) {
                this.modalState.buttonArea = this.renderer.renderConfirmButton(
                    this.modalState.config.defeat,
                    this.modalState.buttonHovered
                );
            }
            return; // 모달 중에는 다른 화면 렌더링 방지
        }

        // 화면별 렌더링 (모달이 없을 때만)
        if (this.currentScreen === 'menu' && this.gameManager.mainMenu) {
            this.gameManager.mainMenu.render(this.gameManager.ctx, this.gameManager.canvas);
        } else if (this.currentScreen === 'cardSelection' && this.gameManager.cardSelection) {
            // 카드 선택 화면은 CardSelection 클래스에서 직접 렌더링
            this.gameManager.cardSelection.render(this.gameManager.ctx, this.gameManager.canvas);
        } else if (this.currentScreen === 'gallery' && this.gameManager.cardGallery) {
            // 카드 갤러리는 CardGallery 클래스에서 직접 렌더링
            this.gameManager.cardGallery.render(this.gameManager.ctx, this.gameManager.canvas);
        } else {
            // 기타 화면은 Renderer를 통해 렌더링
            this.renderer.render(gameState);
        }
    }

    // 게임 상태 가져오기
    getGameState() {
        const state = {
            phase: this.currentScreen,
            player: this.gameManager.player,
            enemy: this.gameManager.enemy,
            battleSystem: this.gameManager.battleSystem,
            debug: this.gameManager.debug || false
        };

        // 화면별 추가 정보
        if (this.currentScreen === 'cardSelection') {
            state.availableCards = this.gameManager.availableCards || [];
            state.selectedCards = this.gameManager.selectedCards || [];
        }

        return state;
    }

    // 화면 전환
    switchScreen(screenName) {

        this.currentScreen = screenName;

        // 화면별 UI 요소 표시/숨김
        this.updateUIVisibility();

        // 화면 초기화
        this.initializeScreen(screenName);
    }

    // UI 요소 가시성 업데이트
    updateUIVisibility() {
        const elements = {
            speedControls: document.querySelector('.speed-controls'),
            cardGalleryBtn: document.getElementById('card-gallery-btn'),
            backToHomepageBtn: document.getElementById('back-to-homepage'),
            backToMenuBtn: document.getElementById('back-to-menu'),
            mainMenuButtons: document.getElementById('main-menu-buttons'),
            hpBars: document.querySelectorAll('.hp-bar-container')
        };

        switch (this.currentScreen) {
            case 'menu':
                this.show(elements.cardGalleryBtn);
                this.hide(elements.speedControls);
                this.hide(elements.backToHomepageBtn);
                this.hide(elements.backToMenuBtn);
                // 모달이 활성화되지 않은 경우에만 메인메뉴 버튼 표시
                if (!this.modalState) {
                    this.show(elements.mainMenuButtons);
                }
                // HP 바 숨기기
                elements.hpBars.forEach(bar => this.hide(bar));
                break;

            case 'battle':
                this.show(elements.speedControls);
                this.show(elements.cardGalleryBtn);
                this.show(elements.backToHomepageBtn);
                this.show(elements.backToMenuBtn);
                this.hide(elements.mainMenuButtons);
                // HP 바 표시
                elements.hpBars.forEach(bar => this.show(bar));

                // 현재 게임 속도에 맞게 버튼 상태 업데이트
                const currentSpeed = this.gameManager.gameSpeed || 1;
                this.updateSpeedButton(currentSpeed);
                break;

            case 'cardSelection':
                this.hide(elements.speedControls);
                this.hide(elements.cardGalleryBtn);
                this.show(elements.backToHomepageBtn);  // 홈페이지로 버튼 표시
                this.show(elements.backToMenuBtn);      // 메인메뉴로 버튼 표시
                this.hide(elements.mainMenuButtons);
                // HP 바 숨기기
                elements.hpBars.forEach(bar => this.hide(bar));
                break;

            case 'gameOver':
                this.hide(elements.speedControls);
                this.hide(elements.cardGalleryBtn);
                this.hide(elements.backToHomepageBtn);
                this.hide(elements.backToMenuBtn);
                this.hide(elements.mainMenuButtons);
                // HP 바 표시 (게임 오버 화면에서도 표시)
                elements.hpBars.forEach(bar => this.show(bar));
                break;
        }
    }

    // 화면 초기화
    initializeScreen(screenName) {
        switch (screenName) {
            case 'menu':
                this.initializeMenu();
                break;
            case 'battle':
                this.initializeBattle();
                break;
            case 'cardSelection':
                this.initializeCardSelection();
                break;
            case 'gameOver':
                // 게임 오버 상태에서는 특별한 초기화 불필요
                // 모달이 모든 UI 처리를 담당
                break;
        }
    }

    // 메뉴 화면 초기화
    initializeMenu() {
        // 메뉴 화면에서는 HP 바 숨김
        if (this.gameManager.hpBarSystem) {
            this.gameManager.hpBarSystem.hide();
        }
    }

    // 전투 화면 초기화
    initializeBattle() {
        // HP 바 표시
        if (this.gameManager.hpBarSystem) {
            this.gameManager.hpBarSystem.show();
        }
    }

    // 카드 선택 화면 초기화
    initializeCardSelection() {
        // HP 바 숨김
        if (this.gameManager.hpBarSystem) {
            this.gameManager.hpBarSystem.hide();
        }
    }

    // 캔버스 클릭 처리
    handleCanvasClick(event) {
        // 패배 모달에서 확인 버튼 클릭 체크
        if (this.modalState && this.modalState.type === 'defeat' && this.modalState.waitingForConfirm) {
            const coords = this.gameManager.getCanvasCoordinates(event);
            if (coords.inBounds && this.modalState.buttonArea) {
                const { x, y } = coords;
                const button = this.modalState.buttonArea;

                if (x >= button.x && x <= button.x + button.width &&
                    y >= button.y && y <= button.y + button.height) {
                    this.handleDefeatConfirm();
                    return;
                }
            }
        }

        if (!this.isInteractive) return;

        // GameManager의 좌표 변환 메서드 사용
        const coords = this.gameManager.getCanvasCoordinates(event);

        if (coords.inBounds) {
            this.processCanvasInteraction(coords.x, coords.y);
        }
    }

    // 캔버스 터치 처리
    handleCanvasTouch(event) {
        event.preventDefault();
        if (!this.isInteractive) return;

        // GameManager의 터치 좌표 변환 메서드 사용
        const coords = this.gameManager.getTouchCoordinates(event.touches[0]);

        if (coords.inBounds) {
            this.processCanvasInteraction(coords.x, coords.y);
        }
    }

    // 캔버스 상호작용 처리
    processCanvasInteraction(x, y) {
        switch (this.currentScreen) {
            case 'menu':
                this.handleMenuClick(x, y);
                break;
            case 'battle':
                this.handleBattleClick(x, y);
                break;
            case 'cardSelection':
                this.handleCardSelectionClick(x, y);
                break;
        }
    }

    // 메뉴 클릭 처리
    handleMenuClick(x, y) {
        // MainMenu 클래스에서 클릭 처리
        if (this.gameManager.mainMenu && this.gameManager.mainMenu.handlePointerInput) {
            this.gameManager.mainMenu.handlePointerInput(x, y, this.gameManager.canvas);
        }
    }

    // 전투 클릭 처리
    handleBattleClick(x, y) {
        // 플레이어 손패 클릭 체크
        const playerArea = this.renderer.areas.playerHand;
        const player = this.gameManager.player;

        if (player && player.hand) {
            const cardIndex = this.renderer.getCardIndexFromPosition(x, y, playerArea, player.hand.length);

            if (cardIndex >= 0) {
                this.handlePlayerCardClick(cardIndex);
            }
        }
    }

    // 카드 선택 클릭 처리
    handleCardSelectionClick(x, y) {
        // CardSelection 클래스에서 클릭 처리
        if (this.gameManager.cardSelection && this.gameManager.cardSelection.handlePointerInput) {
            this.gameManager.cardSelection.handlePointerInput(x, y, this.gameManager.canvas);
        }
    }

    // 플레이어 카드 클릭 처리
    handlePlayerCardClick(cardIndex) {

        // 카드 정보 표시 또는 상호작용
        const player = this.gameManager.player;
        if (player && player.hand[cardIndex]) {
            const card = player.hand[cardIndex];
            this.showCardTooltip(card);
        }
    }

    // 키보드 입력 처리
    handleKeydown(event) {
        // 각 화면의 특수 키 처리
        if (this.currentScreen === 'menu' && this.gameManager.mainMenu && this.gameManager.mainMenu.handleInput) {
            this.gameManager.mainMenu.handleInput(event.key);
        } else if (this.currentScreen === 'cardSelection' && this.gameManager.cardSelection && this.gameManager.cardSelection.handleInput) {
            this.gameManager.cardSelection.handleInput(event.key);
        }

        // 전역 키보드 단축키
        switch (event.key) {
            case 'Escape':
                this.hideAllModals();
                break;
            case ' ':
                event.preventDefault();
                if (this.currentScreen === 'menu') {
                    this.startGame();
                }
                break;
            case '1':
            case '2':
            case '3':
                const speed = parseInt(event.key);
                if (this.gameManager.battleSystem) {
                    this.gameManager.battleSystem.setGameSpeed(speed);
                    this.updateSpeedButton(speed);
                }
                break;
        }
    }

    // 화면 크기 조정 처리
    handleResize() {
        const container = this.canvas.parentElement;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        this.renderer.resize(newWidth, newHeight);
    }

    // 게임 시작
    startGame() {
        this.gameManager.startGame();
        this.switchScreen('battle');
    }

    // i18n 텍스트 가져오기 헬퍼 메서드 - I18nHelper 사용
    getI18nText(key) {
        return I18nHelper.getText(key);
    }

    // 홈페이지로 돌아가기 (게임 허브로)
    backToHomepage() {
        const confirmMessage = this.getI18nText('auto_battle_card_game.ui.confirm_back_to_homepage');
        if (confirm(confirmMessage)) {
            // 게임 상태 정리
            this.cleanupGameState();

            // 홈페이지로 이동 (로컬 홈페이지)
            window.location.href = '../../';
        }
    }

    // 메뉴화면으로 돌아가기 (게임 내 메인 메뉴로)
    backToMenu() {
        const confirmMessage = this.getI18nText('auto_battle_card_game.ui.confirm_back_to_menu');
        if (confirm(confirmMessage)) {
            // 게임 상태 정리
            this.cleanupGameState();

            // 모든 모달 닫기
            this.hideAllModals();

            // 게임 매니저 상태 초기화
            this.gameManager.gameState = 'menu';
            this.gameManager.currentScreen = this.gameManager.mainMenu;

            // 게임 내 메인 메뉴로 이동
            this.gameManager.showMainMenu();
        }
    }

    // 게임 상태 정리 (공통 로직 - 개선된 타이머 정리 포함)
    cleanupGameState() {
        // 전투 시스템 완전 정리 (타이머 포함)
        if (this.gameManager.battleSystem) {
            this.gameManager.battleSystem.cleanup();
        }

        // 플레이어와 적 초기화
        this.gameManager.player = null;
        this.gameManager.enemy = null;
    }

    // 메인으로 돌아가기 (이전 버전 호환성)
    backToMain() {
        this.backToMenu();
    }

    // 카드 갤러리 표시
    showCardGallery() {
        const modal = this.modals.cardGallery;
        const grid = document.getElementById('card-gallery-grid');

        if (modal && grid) {
            // 전투 중이면 게임 일시정지
            if (this.gameManager.gameState === 'battle' && this.gameManager.battleSystem) {
                this.gameManager.battleSystem.pause();
                this.battleWasPaused = true; // 갤러리에서 일시정지했음을 기록
            } else {
                this.battleWasPaused = false;
            }

            // 갤러리 내용 생성
            this.populateCardGallery(grid);
            this.showModal(modal);
        }
    }

    // 카드 갤러리 내용 생성
    populateCardGallery(container) {
        container.innerHTML = '';

        const cardManager = this.gameManager.cardManager;
        if (!cardManager) return;

        const allCards = cardManager.getAllCardsForGallery();

        allCards.forEach(cardData => {
            const cardElement = this.createCardGalleryElement(cardData);
            container.appendChild(cardElement);
        });
    }

    // 갤러리 카드 요소 생성 (통일된 DOMCardRenderer 사용)
    createCardGalleryElement(card) {
        // DOMCardRenderer 인스턴스 생성
        if (!this.domCardRenderer) {
            this.domCardRenderer = new DOMCardRenderer();
        }

        // 갤러리 카드 크기 (gameConfig에서 가져오기)
        const cardSize = GameConfig.cardSizes.preview;

        // 통일된 카드 렌더러로 카드 생성
        const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive: false,
            opacity: 1
        });

        // 갤러리 스타일 클래스 추가
        cardElement.className += ' gallery-card';

        return cardElement;
    }

    // 카드 갤러리 숨기기
    hideCardGallery() {
        this.hideModal(this.modals.cardGallery);

        // 갤러리에서 일시정지했던 전투라면 재개
        if (this.battleWasPaused && this.gameManager.gameState === 'battle' && this.gameManager.battleSystem) {
            this.gameManager.battleSystem.resume();
            this.battleWasPaused = false;
        }
    }

    // 카드 선택 건너뛰기
    skipCardSelection() {
        this.gameManager.skipCardSelection();
    }

    // 모달 표시
    showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            this.isInteractive = false;
        }
    }

    // 모달 숨기기
    hideModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            this.isInteractive = true;
        }
    }

    // 모든 모달 숨기기
    hideAllModals() {
        Object.values(this.modals).forEach(modal => {
            this.hideModal(modal);
        });

        // 갤러리에서 일시정지했던 전투라면 재개
        if (this.battleWasPaused && this.gameManager.gameState === 'battle' && this.gameManager.battleSystem) {
            this.gameManager.battleSystem.resume();
            this.battleWasPaused = false;
        }
    }

    // 승리 모달 표시
    showVictoryModal(stage, callback) {
        // 메인메뉴 버튼 즉시 숨기기 (DOM-Canvas 동기화)
        const mainMenuButtons = document.getElementById('main-menu-buttons');
        if (mainMenuButtons) {
            mainMenuButtons.classList.add('hidden');
        }

        // 모달 상태 설정
        this.modalState = {
            type: 'victory',
            stage: stage || 1,
            alpha: 0,
            isAnimating: true,
            callback: callback,
            animationStart: Date.now(),
            config: GameConfig.battleResult
        };

        this.isInteractive = false;

        // 페이드인 애니메이션 시작
        this.animateModal();
    }

    // 패배 모달 표시
    showDefeatModal(callback) {
        // 메인메뉴 버튼 즉시 숨기기 (DOM-Canvas 동기화)
        const mainMenuButtons = document.getElementById('main-menu-buttons');
        if (mainMenuButtons) {
            mainMenuButtons.classList.add('hidden');
        }

        // 게임 통계와 최종 손패 가져오기
        const gameStats = this.gameManager.gameStats;
        const finalHand = gameStats ? gameStats.finalHand : [];

        // 모달 상태 설정
        this.modalState = {
            type: 'defeat',
            alpha: 0,
            isAnimating: true,
            callback: callback,
            animationStart: Date.now(),
            config: GameConfig.battleResult,
            gameStats: gameStats,
            finalHand: finalHand,
            buttonHovered: false,
            waitingForConfirm: false, // 확인 대기 상태
            buttonArea: null // 버튼 클릭 영역
        };

        this.isInteractive = false;

        // 페이드인 애니메이션 시작
        this.animateModal();
    }

    // 모달 애니메이션 처리 (글래스모피즘 버전)
    animateModal() {
        if (!this.modalState || !this.modalState.isAnimating) return;

        const elapsed = Date.now() - this.modalState.animationStart;
        const config = this.modalState.config.modal.animation;

        // 애니메이션 시간 업데이트 (파티클 효과용)
        this.modalState.animationTime = elapsed;

        if (this.modalState.phase === 'fadeOut') {
            // 페이드아웃 단계
            const fadeOutProgress = Math.min(elapsed / config.fadeOut, 1);
            this.modalState.alpha = 1 - fadeOutProgress;

            if (fadeOutProgress >= 1) {
                // 페이드아웃 완료, 콜백 저장 후 모달 정리
                const savedCallback = this.modalState.callback;
                const modalType = this.modalState.type;

                this.modalState.isAnimating = false;
                this.modalState = null;
                this.isInteractive = true;

                // 전환 딜레이 후 콜백 실행 (메인 메뉴 표시)
                setTimeout(() => {
                    if (savedCallback && typeof savedCallback === 'function') {
                        savedCallback();
                    }
                }, config.transitionDelay);
                return;
            }
        } else {
            // 페이드인 -> 표시 -> 페이드아웃 단계
            if (elapsed < config.fadeIn) {
                // 페이드인 단계
                const fadeInProgress = elapsed / config.fadeIn;
                this.modalState.alpha = fadeInProgress;
            } else if (this.modalState.type === 'defeat') {
                // 패배 모달: 표시 완료 후 확인 버튼 대기
                this.modalState.alpha = 1;
                this.modalState.waitingForConfirm = true;
                // 더 이상 자동 진행하지 않음
                return;
            } else if (elapsed < config.fadeIn + config.display) {
                // 승리 모달: 표시 단계
                this.modalState.alpha = 1;
            } else {
                // 승리 모달: 페이드아웃 시작
                this.modalState.phase = 'fadeOut';
                this.modalState.animationStart = Date.now();
            }
        }

        // 다음 프레임에서 계속
        requestAnimationFrame(() => this.animateModal());
    }

    // 카드 툴팁 표시
    showCardTooltip(card) {
    }

    // 색상 어둡게 하기 유틸리티
    darkenColor(color, factor) {
        // 간단한 색상 어둡게 하기 (헥스 색상 기준)
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);

            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));

            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    // 속도 버튼 업데이트
    updateSpeedButton(speed) {
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => btn.classList.remove('active'));

        const targetBtn = document.getElementById(`speed-${speed}x`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }

    // 언어 업데이트
    updateLanguage() {
        // i18n 시스템이 있다면 업데이트
        if (window.I18n) {
            window.I18n.updatePage();
        }
    }

    // 유틸리티 함수들

    // 요소 표시
    show(element) {
        if (element) {
            // hidden 클래스가 있다면 제거, 없다면 display 스타일 사용
            if (element.classList.contains('hidden')) {
                element.classList.remove('hidden');
            } else {
                element.style.display = '';
            }
        }
    }

    // 요소 숨김
    hide(element) {
        if (element) {
            // hidden 클래스 시스템이 있다면 클래스 사용, 없다면 display 스타일 사용
            if (element.id === 'main-menu-buttons' || element.classList.contains('modal')) {
                element.classList.add('hidden');
            } else {
                element.style.display = 'none';
            }
        }
    }

    // 점이 사각형 안에 있는지 확인
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    // 상호작용 활성화/비활성화
    setInteractive(interactive) {
        this.isInteractive = interactive;
        this.canvas.style.pointerEvents = interactive ? 'auto' : 'none';
    }

    // 로딩 표시
    showLoading(message = '로딩 중...') {
        // 로딩 오버레이 표시
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(loading);
    }

    // 로딩 숨김
    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    // 정리
    cleanup() {
        // 이벤트 리스너 제거
        this.eventHandlers.forEach((handler, element) => {
            element.removeEventListener('click', handler);
        });

        // 애니메이션 정리
        if (this.renderer) {
            this.renderer.animations.clear();
        }

    }

    // 마우스 무브 처리 (패배 모달 버튼 호버)
    handleCanvasMouseMove(event) {
        if (this.modalState && this.modalState.type === 'defeat' && this.modalState.waitingForConfirm) {
            const coords = this.gameManager.getCanvasCoordinates(event);
            if (coords.inBounds && this.modalState.buttonArea) {
                const { x, y } = coords;
                const button = this.modalState.buttonArea;

                const isHovered = x >= button.x && x <= button.x + button.width &&
                                y >= button.y && y <= button.y + button.height;

                if (this.modalState.buttonHovered !== isHovered) {
                    this.modalState.buttonHovered = isHovered;
                    // 호버 상태 변경 시 커서 스타일 변경
                    this.canvas.style.cursor = isHovered ? 'pointer' : 'default';
                }
            }
        }
    }

    // 패배 확인 버튼 클릭 처리
    handleDefeatConfirm() {
        if (!this.modalState || this.modalState.type !== 'defeat') return;

        // 페이드아웃 시작
        this.modalState.phase = 'fadeOut';
        this.modalState.animationStart = Date.now();
        this.modalState.waitingForConfirm = false;
        this.modalState.isAnimating = true;

        // 커서 스타일 리셋
        this.canvas.style.cursor = 'default';

        // 애니메이션 재시작
        this.animateModal();
    }
}

// 전역 객체로 등록
window.UIManager = UIManager;