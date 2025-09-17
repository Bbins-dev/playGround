// 게임 매니저 - 전체 게임 상태 및 플로우 관리

class GameManager {
    constructor() {
        // 게임 상태
        this.gameState = 'menu'; // menu, battle, cardSelection, gameOver
        this.currentStage = 1;
        this.gameSpeed = 1;

        // 핵심 시스템들
        this.battleSystem = null;
        this.renderer = null;
        this.uiManager = null;
        this.animationManager = null;

        // 화면 관리
        this.mainMenu = null;
        this.cardGallery = null;
        this.cardSelection = null;

        // 플레이어
        this.player = null;
        this.enemy = null;

        // Canvas
        this.canvas = null;
        this.ctx = null;

        // 애니메이션
        this.gameLoop = null;
        this.lastTime = 0;

        // 이벤트 리스너들
        this.boundEventListeners = new Map();
    }

    // 게임 초기화
    init() {
        try {
            console.log('🎮 게임 매니저 초기화 시작');

            // Canvas 초기화
            this.initCanvas();

            // 시스템들 초기화
            this.initSystems();

            // 데이터베이스 초기화
            CardDatabase.initialize();

            // 이벤트 리스너 등록
            this.setupEventListeners();

            // 메인 메뉴 표시
            this.showMainMenu();

            // 게임 루프 시작
            this.startGameLoop();

            console.log('✅ 게임 매니저 초기화 완료');
        } catch (error) {
            console.error('❌ 게임 초기화 실패:', error);
        }
    }

    // Canvas 초기화
    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('게임 캔버스를 찾을 수 없습니다');
        }

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;

        // Canvas 크기 설정
        this.canvas.width = GameConfig.canvas.width;
        this.canvas.height = GameConfig.canvas.height;

        console.log(`Canvas 초기화: ${this.canvas.width}x${this.canvas.height}`);
    }

    // 시스템들 초기화
    initSystems() {
        // 렌더러 초기화
        this.renderer = new Renderer(this.ctx);

        // UI 관리자 초기화
        this.uiManager = new UIManager(this);

        // 애니메이션 관리자 초기화
        this.animationManager = new AnimationManager();

        // 전투 시스템 초기화
        this.battleSystem = new BattleSystem(this);

        // 화면들 초기화
        this.mainMenu = new MainMenu(this);
        this.cardGallery = new CardGallery(this);
        this.cardSelection = new CardSelection(this);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 게임 속도 조절 버튼
        this.addEventListeners([
            ['speed-1x', 'click', () => this.setGameSpeed(1)],
            ['speed-2x', 'click', () => this.setGameSpeed(2)],
            ['speed-3x', 'click', () => this.setGameSpeed(3)],
            ['card-gallery-btn', 'click', () => this.showCardGallery()],
            ['close-gallery', 'click', () => this.hideCardGallery()]
        ]);

        // 키보드 이벤트
        this.addEventListeners([
            [document, 'keydown', (e) => this.handleKeyDown(e)],
            [window, 'resize', () => this.handleResize()]
        ]);
    }

    // 이벤트 리스너 추가 (자동 해제를 위한 추적)
    addEventListeners(listeners) {
        listeners.forEach(([elementOrId, event, handler]) => {
            const element = typeof elementOrId === 'string'
                ? document.getElementById(elementOrId)
                : elementOrId;

            if (element) {
                element.addEventListener(event, handler);
                this.boundEventListeners.set(`${elementOrId}-${event}`, { element, event, handler });
            }
        });
    }

    // 게임 루프 시작
    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            this.gameLoop = requestAnimationFrame(gameLoop);
        };

        this.gameLoop = requestAnimationFrame(gameLoop);
    }

    // 게임 업데이트
    update(deltaTime) {
        // 애니메이션 업데이트
        this.animationManager.update(deltaTime);

        // 게임 상태별 업데이트
        switch (this.gameState) {
            case 'battle':
                if (this.battleSystem) {
                    this.battleSystem.update(deltaTime);
                }
                break;

            case 'menu':
                if (this.mainMenu) {
                    this.mainMenu.update(deltaTime);
                }
                break;
        }
    }

    // 렌더링
    render() {
        // 화면 클리어
        this.renderer.clear();

        // 게임 상태별 렌더링
        switch (this.gameState) {
            case 'menu':
                if (this.mainMenu) {
                    this.mainMenu.render();
                }
                break;

            case 'battle':
                if (this.battleSystem && this.player && this.enemy) {
                    this.renderer.renderBattle(this.player, this.enemy, this.battleSystem);
                }
                break;

            case 'cardSelection':
                if (this.cardSelection) {
                    this.cardSelection.render();
                }
                break;
        }

        // 애니메이션 렌더링
        this.animationManager.render(this.ctx);
    }

    // 게임 상태 변경
    changeGameState(newState) {
        console.log(`게임 상태 변경: ${this.gameState} → ${newState}`);
        this.gameState = newState;
    }

    // 메인 메뉴 표시
    showMainMenu() {
        this.changeGameState('menu');
        this.player = null;
        this.enemy = null;
        this.currentStage = 1;
    }

    // 새 게임 시작
    startNewGame() {
        console.log('🆕 새 게임 시작');

        // 플레이어 생성
        this.player = new Player('플레이어', true);

        // 초기 카드 선택 화면으로
        this.showInitialCardSelection();
    }

    // 초기 카드 선택 화면
    showInitialCardSelection() {
        this.changeGameState('cardSelection');

        // 현재는 마구때리기 카드만 선택 가능
        const availableCards = ['bash'];
        this.cardSelection.showInitialSelection(availableCards);
    }

    // 초기 카드 선택 완료
    completeInitialCardSelection(selectedCardId) {
        const selectedCard = CardDatabase.createCardInstance(selectedCardId);
        if (selectedCard) {
            this.player.addCard(selectedCard);
            console.log(`초기 카드 선택: ${selectedCard.name}`);

            // 첫 번째 스테이지 시작
            this.startStage(1);
        }
    }

    // 스테이지 시작
    startStage(stageNumber) {
        console.log(`🏟️ 스테이지 ${stageNumber} 시작`);

        this.currentStage = stageNumber;

        // 적 생성
        this.enemy = new Enemy(`스테이지 ${stageNumber} 적`, stageNumber);
        this.enemy.buildDeck();

        // 전투 시작
        this.startBattle();
    }

    // 전투 시작
    startBattle() {
        console.log('⚔️ 전투 시작');

        this.changeGameState('battle');

        if (this.battleSystem) {
            this.battleSystem.startBattle(this.player, this.enemy);
        }
    }

    // 전투 종료
    endBattle(winner) {
        console.log(`🏁 전투 종료 - 승자: ${winner.name}`);

        if (winner === this.player) {
            // 플레이어 승리
            this.handlePlayerVictory();
        } else {
            // 플레이어 패배
            this.handlePlayerDefeat();
        }
    }

    // 플레이어 승리 처리
    handlePlayerVictory() {
        console.log('🎉 플레이어 승리!');

        // 보상 계산
        const rewards = this.enemy.calculateRewards();
        console.log('보상:', rewards);

        // 다음 스테이지로 진행 또는 카드 선택
        this.showPostBattleCardSelection();
    }

    // 플레이어 패배 처리
    handlePlayerDefeat() {
        console.log('💀 플레이어 패배');

        this.changeGameState('gameOver');

        // 게임 오버 처리
        setTimeout(() => {
            this.showMainMenu();
        }, 3000);
    }

    // 전투 후 카드 선택
    showPostBattleCardSelection() {
        this.changeGameState('cardSelection');

        // 랜덤 카드 3장 제시 (현재는 마구때리기만)
        const availableCards = ['bash', 'bash', 'bash']; // TODO: 다양한 카드 추가
        this.cardSelection.showPostBattleSelection(availableCards);
    }

    // 카드 갤러리 표시
    showCardGallery() {
        this.cardGallery.show();
    }

    // 카드 갤러리 숨기기
    hideCardGallery() {
        this.cardGallery.hide();
    }

    // 게임 속도 설정
    setGameSpeed(speed) {
        this.gameSpeed = speed;

        // 속도 버튼 업데이트
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`speed-${speed}x`).classList.add('active');

        console.log(`게임 속도: ${speed}x`);
    }

    // 키보드 이벤트 처리
    handleKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                if (this.gameState === 'battle') {
                    this.showMainMenu();
                }
                break;

            case '1':
            case '2':
            case '3':
                this.setGameSpeed(parseInt(event.key));
                break;

            case 'g':
                this.showCardGallery();
                break;
        }
    }

    // 화면 크기 변경 처리
    handleResize() {
        // TODO: 반응형 처리 구현
        console.log('화면 크기 변경');
    }

    // 게임 매니저 파괴
    destroy() {
        // 게임 루프 중지
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        // 이벤트 리스너 제거
        this.boundEventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        console.log('🔚 게임 매니저 파괴 완료');
    }
}

// 전역 객체로 등록
window.GameManager = GameManager;