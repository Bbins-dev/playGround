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

        // 초기화
        this.initialize();
    }

    // 초기화
    initialize() {
        this.renderer.initialize();
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

        // 뒤로가기 버튼
        const backBtn = document.getElementById('back-to-main');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToMain());
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

        speedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼에서 active 클래스 제거
                speedButtons.forEach(b => b.classList.remove('active'));

                // 클릭된 버튼에 active 클래스 추가
                e.target.classList.add('active');

                // 속도 값 추출 (1x, 2x, 3x)
                const speedText = e.target.textContent;
                const speed = parseInt(speedText.replace('x', ''));

                // 게임 속도 설정
                if (this.gameManager.battleSystem) {
                    this.gameManager.battleSystem.setGameSpeed(speed);
                }

            });
        });
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


        // 화면별 렌더링
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
            backBtn: document.getElementById('back-to-main'),
            mainMenuButtons: document.getElementById('main-menu-buttons')
        };

        switch (this.currentScreen) {
            case 'menu':
                this.show(elements.cardGalleryBtn);
                this.hide(elements.speedControls);
                this.hide(elements.backBtn);
                this.show(elements.mainMenuButtons);
                break;

            case 'battle':
                this.show(elements.speedControls);
                this.show(elements.cardGalleryBtn);
                this.show(elements.backBtn);
                this.hide(elements.mainMenuButtons);
                break;

            case 'cardSelection':
                this.hide(elements.speedControls);
                this.hide(elements.cardGalleryBtn);
                this.show(elements.backBtn);
                this.hide(elements.mainMenuButtons);
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

    // 메인으로 돌아가기
    backToMain() {
        if (confirm('게임을 종료하고 메인 메뉴로 돌아가시겠습니까?')) {
            // 전투 종료
            if (this.gameManager.battleSystem) {
                this.gameManager.battleSystem.battlePhase = 'ended';
            }

            // 플레이어와 적 초기화
            this.gameManager.player = null;
            this.gameManager.enemy = null;

            // 메인 메뉴로 이동
            this.gameManager.showMainMenu();
        }
    }

    // 카드 갤러리 표시
    showCardGallery() {
        const modal = this.modals.cardGallery;
        const grid = document.getElementById('card-gallery-grid');

        if (modal && grid) {
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

    // 갤러리 카드 요소 생성
    createCardGalleryElement(card) {
        const div = document.createElement('div');
        div.className = 'gallery-card';

        // Card 인스턴스의 메서드 사용
        const cardName = card.getDisplayName ? card.getDisplayName() : card.name;
        const cardDescription = card.getDisplayDescription ? card.getDisplayDescription() : card.description;
        const emoji = card.getEmoji ? card.getEmoji() : (GameConfig.elements[card.element]?.emoji || '❓');
        const elementColor = card.getColor ? card.getColor() : (GameConfig.elements[card.element]?.color || '#666');
        const typeConfig = GameConfig.cardTypes[card.type];

        // 카드 타입 이름 i18n 적용
        const typeName = typeConfig?.nameKey && typeof getI18nText === 'function'
            ? getI18nText(typeConfig.nameKey) || typeConfig.name
            : typeConfig?.name || card.type;

        // card-preview 중복 제거하고 직접 gallery-card에 콘텐츠 추가
        div.style.background = `linear-gradient(135deg, ${elementColor}, ${this.darkenColor(elementColor, 0.3)})`;

        div.innerHTML = `
            <div class="card-emoji">${emoji}</div>
            <div class="card-name">${cardName}</div>
            <div class="card-type">${typeName}</div>
            <div class="card-stats">
                <span class="card-power">⚔${card.power}</span>
                <span class="card-accuracy">🎯${card.accuracy}%</span>
            </div>
            <div class="card-description">${cardDescription}</div>
            <div class="card-cost">${card.cost || 0}</div>
        `;

        return div;
    }

    // 카드 갤러리 숨기기
    hideCardGallery() {
        this.hideModal(this.modals.cardGallery);
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
}

// 전역 객체로 등록
window.UIManager = UIManager;