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
        this.currentScreen = 'menu'; // 'menu' | 'battle' | 'gallery'
        this.isInteractive = true;

        // UI 화면 상태 초기화
        this.currentScreen = 'menu';

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
            galleryCardDetail: document.getElementById('gallery-card-detail-modal')
            // cardSelection은 CardSelectionModal 클래스에서 직접 관리
        };

        // 승리/패배 모달
        this.victoryDefeatModal = new VictoryDefeatModal(this.gameManager);

        // 스테이지 인디케이터
        this.stageIndicator = new StageIndicator(this.gameManager);

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

        // CSS 커스텀 속성 설정 (GameConfig 기반 z-index)
        this.applyCSSVariables();

        this.setupEventListeners();
        this.setupSpeedControls();
        this.setupModals();
        this.updateLanguage();

        // 초기 화면 상태에 맞게 UI 가시성 업데이트
        this.updateUIVisibility();
    }

    // GameConfig 기반 CSS 변수 적용
    applyCSSVariables() {
        const root = document.documentElement;
        const zLayers = GameConfig.zIndexLayers;

        // Z-index 레이어 설정
        root.style.setProperty('--z-canvas', zLayers.canvas);
        root.style.setProperty('--z-ui-elements', zLayers.uiElements);
        root.style.setProperty('--z-main-menu-buttons', zLayers.mainMenuButtons);
        root.style.setProperty('--z-modals', zLayers.modals);
        root.style.setProperty('--z-overlays', zLayers.overlays);

        // 카드 선택 그리드 패딩 설정
        const cardSelection = GameConfig.cardSelection;
        if (cardSelection.grid) {
            root.style.setProperty('--grid-padding-top', cardSelection.grid.paddingTop + 'px');
            root.style.setProperty('--grid-padding-bottom', cardSelection.grid.paddingBottom + 'px');
            root.style.setProperty('--grid-padding-horizontal', cardSelection.grid.paddingHorizontal + 'px');
        }

        // 카드 선택 모달 높이 및 패딩 설정
        if (cardSelection.modal) {
            root.style.setProperty('--modal-height', (cardSelection.modal.heightRatio * 100) + 'vh');
            root.style.setProperty('--modal-padding', cardSelection.modal.padding + 'px');
        }
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
            galleryBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.showCardGallery();
            });
        }


        // 메뉴화면으로 돌아가기 버튼
        const backToMenuBtn = document.getElementById('back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.backToMenu();
            });
        }

        // 갤러리 닫기
        const closeGallery = document.getElementById('close-gallery');
        if (closeGallery) {
            closeGallery.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.hideCardGallery();
            });
        }

        // 갤러리 카드 상세 모달 닫기
        const closeGalleryCardDetail = document.getElementById('gallery-card-detail-close');
        if (closeGalleryCardDetail) {
            closeGalleryCardDetail.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.hideGalleryCardDetail();
            });
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

                // GameManager를 통해 통일된 속도 설정
                this.gameManager.setGameSpeed(speed);

            });
        });

        // 초기 속도 설정 적용
        this.applyInitialSpeedSetting(savedSpeed);
    }

    // 초기 속도 설정 적용
    applyInitialSpeedSetting(speed) {
        // GameManager를 통해 통일된 속도 설정
        this.gameManager.setGameSpeed(speed);
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

        // ESC 키로 모달 닫기 (비활성화)
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape') {
        //         this.hideAllModals();
        //     }
        // });
    }


    // 메인 렌더링 루프 (최적화)
    render() {
        const gameState = this.getGameState();

        // 렌더링 카운터 업데이트
        this.renderCount++;
        const currentTime = performance.now();

        // Canvas 모달 렌더링 제거 - DOM 모달 사용

        // 화면별 렌더링 (모달이 없을 때만)
        if (this.currentScreen === 'menu' && this.gameManager.mainMenu) {
            this.gameManager.mainMenu.render(this.gameManager.ctx, this.gameManager.canvas);
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

        // 화면별 추가 정보 (cardSelection은 DOM 모달로 처리하므로 제거)

        return state;
    }

    // 화면 전환
    switchScreen(screenName) {

        this.currentScreen = screenName;

        // 메뉴 화면으로 전환 시 상태이상 테두리 확실히 제거 (안전장치)
        if (screenName === 'menu') {
            this.clearStatusBorder();
        }

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
            backToMenuBtn: document.getElementById('back-to-menu'),
            mainMenuButtons: document.getElementById('main-menu-buttons'),
            hpBars: document.querySelectorAll('.hp-bar-container')
        };

        switch (this.currentScreen) {
            case 'menu':
                // 메인 메뉴에서는 메뉴 관련 UI만 표시
                this.hide(elements.speedControls);
                this.hide(elements.cardGalleryBtn);
                this.hide(elements.backToMenuBtn);
                this.show(elements.mainMenuButtons);
                // HP 바 숨기기
                elements.hpBars.forEach(bar => this.hide(bar));
                // 스테이지 인디케이터 숨기기
                if (this.stageIndicator) {
                    this.stageIndicator.hide();
                }
                break;

            case 'battle':
                this.show(elements.speedControls);
                this.show(elements.cardGalleryBtn);
                this.show(elements.backToMenuBtn);
                this.hide(elements.mainMenuButtons);
                // HP 바 표시
                elements.hpBars.forEach(bar => this.show(bar));
                // 스테이지 인디케이터 표시
                if (this.stageIndicator) {
                    this.stageIndicator.show();
                }

                // 현재 게임 속도에 맞게 버튼 상태 업데이트
                const currentSpeed = this.gameManager.gameSpeed || 1;
                this.updateSpeedButton(currentSpeed);
                break;

            // cardSelection 케이스 제거 - DOM 모달로 처리

            case 'gameOver':
                this.hide(elements.speedControls);
                this.hide(elements.cardGalleryBtn);
                this.hide(elements.backToMenuBtn);
                this.hide(elements.mainMenuButtons);
                // HP 바 표시 (게임 오버 화면에서도 표시)
                elements.hpBars.forEach(bar => this.show(bar));
                // 스테이지 인디케이터 숨기기 (게임 오버 시)
                if (this.stageIndicator) {
                    this.stageIndicator.hide();
                }
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
            // cardSelection 케이스 제거 - DOM 모달로 처리
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

    // initializeCardSelection 메서드 제거 - DOM 모달로 처리

    // 캔버스 클릭 처리
    handleCanvasClick(event) {
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
            // cardSelection 케이스 제거 - DOM 모달로 처리
        }
    }

    // 메뉴 클릭 처리 - 캔버스 클릭 비활성화
    handleMenuClick(x, y) {
        // 메인메뉴에서는 캔버스 클릭을 차단하고 DOM 버튼만 사용하도록 제한
        // MainMenu 클래스의 handlePointerInput 호출을 비활성화
        return;
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

    // handleCardSelectionClick 메서드 제거 - DOM 모달로 처리

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
        // 모든 키보드 입력 무시 (마우스/터치만 사용)
        return;

        // (아래 코드는 실행되지 않음)
        // // 메인메뉴에서는 키보드 내비게이션 비활성화
        // // DOM 버튼과 언어선택만 키보드로 조작 가능

        // // 전역 키보드 단축키 모두 비활성화
        // switch (event.key) {
        //     // ESC 키 기능 비활성화
        //     // case 'Escape':
        //     //     this.hideAllModals();
        //     //     break;
        //     // 스페이스바 게임 시작 기능 제거
        //     // case ' ': 제거
        //     // 1,2,3 키 게임 속도 변경 기능 비활성화
        //     // case '1':
        //     // case '2':
        //     // case '3':
        //     //     const speed = parseInt(event.key);
        //     //     this.gameManager.setGameSpeed(speed);
        //     //     break;
        // }
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
        // 임시로 confirm 비활성화 - 다이얼로그 폭탄 방지
        // if (confirm(confirmMessage)) {
            // 게임 상태 정리
            this.cleanupGameState();

            // 홈페이지로 이동 (로컬 홈페이지)
            window.location.href = '../../';
        // }
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

            // 적절한 UI 요소들 다시 표시
            this.showAllUIElements();

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
            // 최신 GameConfig 설정을 CSS 변수에 동기화
            this.gameManager.syncCSSVariables();

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
        // DOMCardRenderer 인스턴스를 매번 새로 생성 (최신 설정 반영)
        const domCardRenderer = new DOMCardRenderer();

        // 갤러리 카드 크기 (갤러리 전용 크기 사용)
        const cardSize = GameConfig.cardSizes.gallery;

        // 통일된 카드 렌더러로 카드 생성
        const cardElement = domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive: false,
            opacity: 1,
            context: 'default' // 카드갤러리는 항상 기본값
        });

        // 갤러리 스타일 클래스 추가
        cardElement.className += ' gallery-card';

        // 클릭 이벤트 추가 (카드 상세 모달 표시)
        cardElement.addEventListener('click', () => {
            // 카드 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.cardGalleryClick || 'cardClick');
            }
            this.showGalleryCardDetail(card);
        });

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

    // 갤러리 카드 상세 모달 표시
    showGalleryCardDetail(card) {
        const modal = this.modals.galleryCardDetail;
        const cardDetailContent = document.getElementById('gallery-card-detail-content');

        if (!modal || !cardDetailContent) return;

        // DOMCardRenderer로 확대 카드 생성
        const domCardRenderer = new DOMCardRenderer();
        const cardSize = GameConfig.cardSizes.large || { width: 520, height: 728 };

        // 확대 카드 생성
        const enlargedCard = domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive: false,
            opacity: 1,
            context: 'runtime'  // 런타임 버프/디버프 반영
        });

        // 카드 상세 내용 업데이트
        cardDetailContent.innerHTML = '';
        cardDetailContent.appendChild(enlargedCard);

        // 모달 표시
        this.showModal(modal);
    }

    // 갤러리 카드 상세 모달 숨기기
    hideGalleryCardDetail() {
        const modal = this.modals.galleryCardDetail;
        const cardDetailContent = document.getElementById('gallery-card-detail-content');

        if (modal) {
            this.hideModal(modal);
        }

        // 내용 클리어
        if (cardDetailContent) {
            cardDetailContent.innerHTML = '';
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

    // 모든 UI 요소 숨기기 (패배/승리 모달 표시 시 사용)
    hideAllUIElements() {
        // 메인메뉴 버튼 숨기기
        const mainMenuButtons = document.getElementById('main-menu-buttons');
        if (mainMenuButtons) {
            mainMenuButtons.classList.add('hidden');
        }

        // 게임 속도 컨트롤 숨기기
        const speedControls = document.getElementById('speed-controls');
        if (speedControls) {
            speedControls.classList.add('hidden');
        }

        // 다른 UI 요소들도 필요시 숨기기
        const uiElementIds = ['card-gallery-btn', 'battle-ui-elements'];
        uiElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }

    // 모든 UI 요소 보이기 (메인 메뉴 복귀 시 사용)
    showAllUIElements() {
        // updateUIVisibility 메서드 호출로 대체
        this.updateUIVisibility();
    }

    // 플레이어 상태이상에 따른 화면 테두리 효과 업데이트 (Configuration-Driven)
    updateStatusBorder() {
        const gameWrapper = document.querySelector('.game-wrapper');
        if (!gameWrapper || !this.gameManager?.player) return;

        // 기존 상태이상 테두리 클래스 제거
        Object.values(GameConfig.statusBorderEffects).forEach(effect => {
            gameWrapper.classList.remove(effect.className);
        });

        // 명시적으로 border 스타일 초기화 (잔여 border 제거)
        gameWrapper.style.border = 'none';
        gameWrapper.style.animation = 'none';

        // 플레이어의 현재 상태이상 확인
        const playerStatusEffects = this.gameManager.player.statusEffects || [];

        if (playerStatusEffects.length === 0) {
            // 상태이상이 없으면 완전히 초기화하고 종료
            gameWrapper.offsetHeight; // 강제 리플로우로 스타일 적용 보장
            return;
        }

        // 우선순위가 가장 높은 상태이상 찾기 (낮은 숫자가 높은 우선순위)
        let highestPriorityEffect = null;
        let highestPriority = Number.MAX_SAFE_INTEGER;

        playerStatusEffects.forEach(statusEffect => {
            const borderConfig = GameConfig.statusBorderEffects[statusEffect.type];
            if (borderConfig && borderConfig.priority < highestPriority) {
                highestPriority = borderConfig.priority;
                highestPriorityEffect = borderConfig;
            }
        });

        // 가장 우선순위가 높은 상태이상의 테두리 효과 적용
        if (highestPriorityEffect) {
            // inline 스타일 제거 후 CSS 클래스 적용
            gameWrapper.style.border = '';
            gameWrapper.style.animation = '';
            gameWrapper.classList.add(highestPriorityEffect.className);
            gameWrapper.offsetHeight; // 강제 리플로우로 스타일 적용 보장
        }
    }

    // 상태이상 테두리 완전 제거 (메인 메뉴 복귀 시 등)
    clearStatusBorder() {
        const gameWrapper = document.querySelector('.game-wrapper');
        if (!gameWrapper) return;

        try {
            // Step 1: 애니메이션 즉시 중단 (inline 스타일 우선 적용으로 GPU 애니메이션 강제 중단)
            gameWrapper.style.animation = 'none';
            gameWrapper.style.border = 'none';

            // Step 2: 강제 리플로우 (GPU 애니메이션 중단 보장)
            void gameWrapper.offsetHeight;

            // Step 3: 모든 상태이상 CSS 클래스 제거 (Configuration-Driven)
            Object.values(GameConfig.statusBorderEffects).forEach(effect => {
                gameWrapper.classList.remove(effect.className);
            });

            // Step 4: inline 스타일 완전 제거 (CSS 우선순위 정리)
            gameWrapper.style.removeProperty('animation');
            gameWrapper.style.removeProperty('border');

            // Step 5: 최종 강제 리플로우 (모든 스타일 변경 적용 보장)
            void gameWrapper.offsetHeight;

        } catch (error) {
            console.error('[UIManager] 상태이상 테두리 제거 중 오류:', error);
        }
    }

    // 승리 모달 표시
    showVictoryModal(stage, callback, rewardCards = null) {
        // 모든 UI 요소 즉시 숨기기
        this.hideAllUIElements();

        // DOM 기반 승리 모달 표시 (카드 보상 포함)
        this.victoryDefeatModal.showVictory(stage || 1, () => {

            // 모든 UI 요소 다시 표시
            this.updateUIVisibility();

            // 전투 상호작용 재활성화
            this.isInteractive = true;

            // 전투 화면 강제 재초기화 (다음 스테이지 시작 보장)
            if (this.currentScreen === 'battle') {
                this.initializeBattle();
            }

            if (callback && typeof callback === 'function') {
                callback();
            } else {
                console.error('❌ UIManager: GameManager 콜백이 없거나 함수가 아님');
            }
        }, rewardCards);

        this.isInteractive = false;
    }

    // 패배 모달 표시
    showDefeatModal(callback) {
        // 모든 UI 요소 즉시 숨기기
        this.hideAllUIElements();

        // 게임 상태를 gameOver로 명확히 설정
        this.gameManager.gameState = 'gameOver';

        // 게임 통계 가져오기
        const gameStats = this.gameManager.gameStats;

        // DOM 기반 패배 모달 표시
        this.victoryDefeatModal.showDefeat(
            gameStats,
            // 다시 도전하기 콜백
            () => {
                this.handleDefeatRestart();
            },
            // 메인 메뉴로 콜백
            () => {
                this.handleDefeatMainMenu();
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        );

        this.isInteractive = false;
    }

    // Canvas 모달 애니메이션 처리 (더 이상 사용하지 않음 - DOM 모달 사용)
    // animateModal() - 제거됨

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

        // 스테이지 인디케이터 언어 업데이트
        if (this.stageIndicator) {
            this.stageIndicator.updateLanguage();
        }
    }

    // 스테이지 정보 업데이트 (실제 스테이지 번호만 전달)
    updateStageInfo(stage) {
        if (this.stageIndicator) {
            this.stageIndicator.updateStage(stage);
        }
    }

    // 스테이지 클리어 효과 재생
    playStageCompleteEffect() {
        if (this.stageIndicator) {
            this.stageIndicator.playStageCompleteEffect();
        }
    }

    // 유틸리티 함수들

    // 요소 표시 - hidden 클래스 기반 통일
    show(element) {
        if (element) {
            element.classList.remove('hidden');
            // display 스타일이 none으로 설정되어 있을 수 있으므로 초기화
            if (element.style.display === 'none') {
                element.style.display = '';
            }
        }
    }

    // 요소 숨김 - hidden 클래스 기반 통일
    hide(element) {
        if (element) {
            element.classList.add('hidden');
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

    // 마우스 무브 처리 (Canvas 모달 호버 제거 - DOM 모달 사용)
    handleCanvasMouseMove(event) {
        // Canvas 모달 호버 기능 제거됨
    }

    // 패배 모달 재시작 버튼 처리
    handleDefeatRestart() {
        // 게임 상태 완전 정리
        this.cleanupGameState();

        // 모든 모달 닫기
        this.hideAllModals();

        // UI 요소 다시 표시
        this.updateUIVisibility();
        this.showAllUIElements();
        this.isInteractive = true;

        // 게임 상태 완전 초기화
        this.gameManager.currentStage = 1;
        this.gameManager.gameState = 'menu';
        this.gameManager.resetGameStats();

        // 새 게임 시작 (플레이어 이름 입력부터)
        this.gameManager.startNewGame();
    }

    // 패배 모달 메인메뉴 버튼 처리
    handleDefeatMainMenu() {
        // 게임 상태 완전 정리
        this.cleanupGameState();

        // 모든 모달 닫기
        this.hideAllModals();

        // UI 요소 다시 표시
        this.updateUIVisibility();
        this.showAllUIElements();
        this.isInteractive = true;

        // 게임 상태 초기화 및 메인메뉴로 이동
        this.gameManager.currentStage = 1;
        this.gameManager.gameState = 'menu';
        this.gameManager.resetGameStats();
        this.gameManager.currentScreen = this.gameManager.mainMenu;

        // 메인메뉴로 이동
        this.gameManager.showMainMenu();
    }
}

// 전역 객체로 등록
window.UIManager = UIManager;