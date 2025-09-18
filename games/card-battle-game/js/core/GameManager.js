// 게임 매니저 - 전체 게임 상태 및 플로우 관리

class GameManager {
    constructor() {
        // 게임 상태
        this.gameState = 'menu'; // menu, battle, cardSelection, gallery, gameOver
        this.currentStage = 1;
        this.gameSpeed = 1;

        // 핵심 시스템들
        this.battleSystem = null;
        this.cardManager = null;
        this.uiManager = null;
        this.animationManager = null;
        this.hpBarSystem = null;
        this.effectSystem = null;

        // 화면 관리
        this.mainMenu = null;
        this.cardSelection = null;
        this.currentScreen = null;

        // 플레이어
        this.player = null;
        this.enemy = null;

        // Canvas
        this.canvas = null;
        this.ctx = null;

        // 애니메이션
        this.gameLoop = null;
        this.lastTime = 0;

        // 게임 데이터
        this.availableCards = [];
        this.selectedCards = [];

        // 이벤트 리스너들
        this.boundEventListeners = new Map();

        // 디버그 모드
        this.debug = false;

        // Debounce용 타이머
        this.resizeTimeout = null;
    }

    // 게임 초기화
    async init() {
        try {

            // Canvas 초기화
            this.initCanvas();

            // 고정 크기이므로 레이아웃 안정화 대기 불필요

            // 데이터베이스 초기화 (시스템들보다 먼저)
            CardDatabase.initialize();

            // 시스템들 초기화
            this.initSystems();

            // 이벤트 리스너 등록
            this.setupEventListeners();

            // 메인 메뉴 표시
            this.showMainMenu();

            // 게임 루프 시작
            this.startGameLoop();

        } catch (error) {
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

        // Canvas 크기 설정 및 반응형 업데이트
        this.updateCanvasSize();

    }

    // 레이아웃 안정화 대기
    async waitForLayoutStabilization() {

        return new Promise((resolve) => {
            // requestAnimationFrame을 두 번 호출하여 레이아웃 재계산 완료 보장
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Canvas 크기를 다시 한 번 업데이트하여 최종 안정화
                    this.updateCanvasSize();
                    resolve();
                });
            });
        });
    }

    // 시스템들 초기화
    initSystems() {
        // 카드 관리자 초기화
        this.cardManager = new CardManager(this);

        // HP 바 시스템 초기화
        this.hpBarSystem = new HPBarSystem();

        // 이펙트 시스템 초기화
        this.effectSystem = new EffectSystem();

        // 애니메이션 관리자 초기화
        this.animationManager = new AnimationManager();
        this.animationManager.start();

        // 전투 시스템 초기화
        this.battleSystem = new BattleSystem(this);

        // UI 관리자 초기화 (다른 시스템들 이후에)
        this.uiManager = new UIManager(this);

        // 화면들 초기화
        this.mainMenu = new MainMenu(this);
        this.cardSelection = new CardSelection(this);

        // 현재 화면 설정
        this.currentScreen = this.mainMenu;

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

        // 키보드 이벤트 (resize 이벤트 제거 - 고정 크기)
        this.addEventListeners([
            [document, 'keydown', (e) => this.handleKeyDown(e)]
        ]);

        // Canvas 이벤트는 메뉴가 DOM으로 전환되어 더 이상 필요하지 않음
        // 게임 플레이 중에만 필요한 Canvas 이벤트는 별도로 처리
    }

    // 이벤트 리스너 추가 (자동 해제를 위한 추적)
    addEventListeners(listeners) {
        listeners.forEach(([elementOrId, event, handler, useCapture = false]) => {
            const element = typeof elementOrId === 'string'
                ? document.getElementById(elementOrId)
                : elementOrId;

            if (element) {
                element.addEventListener(event, handler, useCapture);
                this.boundEventListeners.set(`${elementOrId}-${event}`, { element, event, handler, useCapture });
            }
        });
    }

    // 게임 루프 시작
    startGameLoop() {
        this.lastTime = performance.now();

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
        // 현재 화면 업데이트
        if (this.currentScreen && this.currentScreen.update) {
            this.currentScreen.update(deltaTime);
        }

        // 전투 중이면 전투 시스템 업데이트
        if (this.gameState === 'battle' && this.battleSystem) {
            this.battleSystem.update(deltaTime);
        }
    }

    // 렌더링
    render() {
        if (!this.uiManager) {
            return;
        }

        // UI 매니저를 통한 렌더링
        this.uiManager.render();
    }

    // 화면 전환
    switchScreen(screenName) {

        this.gameState = screenName;

        switch (screenName) {
            case 'menu':
                // 메뉴로 전환 시 전투 시스템 완전 정리
                if (this.battleSystem) {
                    this.battleSystem.cleanup();
                }
                this.currentScreen = this.mainMenu;
                break;
            case 'battle':
                this.currentScreen = null; // 전투는 특별 처리
                break;
            case 'cardSelection':
                this.currentScreen = this.cardSelection;
                break;
        }

        // UI 매니저에 화면 전환 알림
        if (this.uiManager) {
            this.uiManager.switchScreen(screenName);
        }
    }

    // 메인 메뉴 표시
    showMainMenu() {

        // 게임 상태를 메뉴로 강제 설정
        this.gameState = 'menu';
        this.currentScreen = this.mainMenu; // 객체로 설정

        this.switchScreen('menu');
        if (this.mainMenu) {
            this.mainMenu.show();
        }

    }

    // 게임 상태 변경
    changeGameState(newState) {
        this.gameState = newState;
        this.switchScreen(newState);
    }

    // 새 게임 초기화
    initializeNewGame() {

        // 플레이어 생성
        this.player = new Player('플레이어', true);

        // 기본 카드 추가 (카드 선택을 건너뛴 경우의 폴백)
        if (this.player.hand.length === 0) {
            const bashCard = this.cardManager.createCard('bash');
            if (bashCard) {
                this.player.hand.push(bashCard);
            }
        }

        // 첫 번째 스테이지 시작
        this.startStage(1);
    }

    // 새 게임 시작 (메인 메뉴에서 호출)
    startNewGame() {
        console.log('GameManager: 새 게임 시작');

        // 플레이어 생성
        this.player = new Player('플레이어', true);

        // 카드 선택 화면으로 이동
        if (this.cardSelection) {
            this.cardSelection.setupInitialSelection();
            this.switchScreen('cardSelection');
        } else {
            console.error('카드 선택 시스템이 초기화되지 않았습니다');
            this.initializeNewGame();
        }
    }

    // 게임 시작 (카드 선택 완료 후)
    startGame() {
        this.initializeNewGame();
    }

    // 초기 카드 설정
    setInitialCards(cardIds) {
        console.log('GameManager: 초기 카드 설정', cardIds);

        // 플레이어가 없으면 생성
        if (!this.player) {
            console.log('플레이어가 없어서 생성합니다');
            this.player = new Player('플레이어', true);
        }

        if (this.player) {
            this.player.hand = [];
            cardIds.forEach(cardId => {
                this.cardManager.addCardToPlayer(this.player, cardId);
            });
            console.log('카드 추가 완료. 현재 손패:', this.player.hand);
        }

        this.startStage(1);
    }

    // 보상 카드 추가 (손패 왼쪽에 추가)
    addRewardCard(cardId) {

        if (this.player && this.cardManager) {
            // 'left' 옵션으로 손패 왼쪽에 추가
            this.cardManager.addCardToPlayer(this.player, cardId, 'left');
        }

        this.continueToNextStage();
    }

    // 카드 교체
    replaceCard(newCardId) {
        if (this.player && this.cardManager) {
            // 첫 번째 카드를 새 카드로 교체
            this.cardManager.replacePlayerCard(this.player, 0, newCardId);
        }
        this.continueToNextStage();
    }

    // 카드 선택 건너뛰기
    skipCardSelection() {
        this.continueToNextStage();
    }

    // 다음 스테이지 진행
    continueToNextStage() {
        this.currentStage++;
        this.startStage(this.currentStage);
    }

    // 초기 카드 선택 완료
    completeInitialCardSelection(selectedCardId) {
        const selectedCard = CardDatabase.createCardInstance(selectedCardId);
        if (selectedCard) {
            this.player.addCard(selectedCard);

            // 첫 번째 스테이지 시작
            this.startStage(1);
        }
    }

    // 스테이지 시작
    startStage(stageNumber) {

        this.currentStage = stageNumber;

        // 적 생성
        this.enemy = new Enemy(`스테이지 ${stageNumber} 적`, stageNumber);
        this.enemy.buildDeck();

        // 전투 시작
        this.startBattle();
    }

    // 전투 시작
    startBattle() {

        this.changeGameState('battle');

        if (this.battleSystem) {
            this.battleSystem.startBattle(this.player, this.enemy);
        }
    }

    // 전투 종료
    endBattle(winner) {

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

        // 보상 계산
        const rewards = this.enemy.calculateRewards();

        // 다음 스테이지로 진행 또는 카드 선택
        this.showPostBattleCardSelection();
    }

    // 플레이어 패배 처리
    handlePlayerDefeat() {

        this.changeGameState('gameOver');

        // 게임 오버 처리
        setTimeout(() => {
            this.showMainMenu();
        }, 3000);
    }

    // 전투 후 카드 선택
    showPostBattleCardSelection() {
        this.changeGameState('cardSelection');

        // 모든 카드에서 랜덤 3장 제시
        const availableCards = this.cardManager.getRandomCards(3);
        this.cardSelection.setupRewardSelection(availableCards.map(cardId => CardDatabase.getCard(cardId)));
    }

    // 카드 갤러리 표시 (DOM 모달 사용)
    showCardGallery() {
        if (this.uiManager) {
            this.uiManager.showCardGallery();
        }
    }

    // 카드 갤러리 숨기기 (DOM 모달 사용)
    hideCardGallery() {
        if (this.uiManager) {
            this.uiManager.hideCardGallery();
        }
    }

    // 키보드 이벤트 처리
    handleKeyDown(event) {
        // 현재 화면에 키보드 이벤트 전달
        if (this.currentScreen && this.currentScreen.handleInput) {
            this.currentScreen.handleInput(event.key);
            return;
        }

        // 전역 키보드 이벤트
        switch (event.key) {
            case 'Escape':
                if (this.gameState === 'battle') {
                    this.switchScreen('menu');
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

    // 마우스/터치 좌표 계산 (레터박스 고려)
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();

        // 레터박스를 고려한 정확한 좌표 계산
        const canvasX = (event.clientX - rect.left) / this.displayScale.x;
        const canvasY = (event.clientY - rect.top) / this.displayScale.y;

        // Canvas 경계 내부인지 확인
        const isInBounds = canvasX >= 0 && canvasX <= GameConfig.canvas.width &&
                          canvasY >= 0 && canvasY <= GameConfig.canvas.height;

        return {
            x: Math.max(0, Math.min(GameConfig.canvas.width, canvasX)),
            y: Math.max(0, Math.min(GameConfig.canvas.height, canvasY)),
            inBounds: isInBounds
        };
    }

    // 터치 좌표 계산 (레터박스 고려)
    getTouchCoordinates(touch) {
        const rect = this.canvas.getBoundingClientRect();

        // 레터박스를 고려한 정확한 좌표 계산
        const canvasX = (touch.clientX - rect.left) / this.displayScale.x;
        const canvasY = (touch.clientY - rect.top) / this.displayScale.y;

        // Canvas 경계 내부인지 확인
        const isInBounds = canvasX >= 0 && canvasX <= GameConfig.canvas.width &&
                          canvasY >= 0 && canvasY <= GameConfig.canvas.height;

        return {
            x: Math.max(0, Math.min(GameConfig.canvas.width, canvasX)),
            y: Math.max(0, Math.min(GameConfig.canvas.height, canvasY)),
            inBounds: isInBounds
        };
    }

    // Canvas 이벤트 핸들러들은 DOM 메뉴 전환으로 더 이상 필요하지 않음
    // 게임 플레이 중 Canvas 이벤트가 필요한 경우 별도 구현

    // 포인터 입력 처리 (마우스 클릭)
    handlePointerInput(event) {
        event.preventDefault();
        const coords = this.getCanvasCoordinates(event);

        // Canvas 경계 내에서만 입력 처리
        if (coords.inBounds && this.currentScreen && this.currentScreen.handlePointerInput) {
            this.currentScreen.handlePointerInput(coords.x, coords.y, this.canvas);
        }
    }

    // 마우스 다운 이벤트
    handleMouseDown(event) {
        event.preventDefault();
        const coords = this.getCanvasCoordinates(event);

        // Canvas 경계 내에서만 입력 처리
        if (coords.inBounds && this.currentScreen && this.currentScreen.handleMouseDown) {
            this.currentScreen.handleMouseDown(coords.x, coords.y, this.canvas);
        }
    }

    // 마우스 업 이벤트
    handleMouseUp(event) {
        event.preventDefault();
        const coords = this.getCanvasCoordinates(event);

        // Canvas 경계 내에서만 입력 처리
        if (coords.inBounds && this.currentScreen && this.currentScreen.handleMouseUp) {
            this.currentScreen.handleMouseUp(coords.x, coords.y, this.canvas);
        }
    }

    // 터치 시작 이벤트
    handleTouchStart(event) {
        event.preventDefault();

        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const coords = this.getTouchCoordinates(touch);

            // Canvas 경계 내에서만 입력 처리
            if (coords.inBounds) {
                // 현재 화면에 터치 시작 이벤트 전달
                if (this.currentScreen && this.currentScreen.handleTouchStart) {
                    this.currentScreen.handleTouchStart(coords.x, coords.y, this.canvas);
                } else if (this.currentScreen && this.currentScreen.handlePointerInput) {
                    // 터치를 포인터 입력으로 처리
                    this.currentScreen.handlePointerInput(coords.x, coords.y, this.canvas);
                }
            }
        }
    }

    // 터치 종료 이벤트
    handleTouchEnd(event) {
        event.preventDefault();

        // 터치 종료는 changedTouches 사용
        if (event.changedTouches.length > 0) {
            const touch = event.changedTouches[0];
            const coords = this.getTouchCoordinates(touch);

            // Canvas 경계 내에서만 입력 처리 (클릭으로 처리)
            if (coords.inBounds && this.currentScreen && this.currentScreen.handlePointerInput) {
                this.currentScreen.handlePointerInput(coords.x, coords.y, this.canvas);
            }
        }
    }

    // 화면 크기 변경 처리
    // Debounced resize handler
    debouncedHandleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, 100); // 100ms debounce
    }

    handleResize() {
        this.updateCanvasSize();

        if (this.uiManager) {
            this.uiManager.handleResize();
        }

    }

    // Canvas 크기 동적 업데이트 (레터박스 방식)
    updateCanvasSize() {
        if (!this.canvas) return;

        // 고정 크기 설정 - 더 이상 반응형 없음
        this.canvas.width = GameConfig.canvas.width;  // 1247
        this.canvas.height = GameConfig.canvas.height; // 832

        // 스케일 비율은 1:1 고정 (반응형 제거)
        this.displayScale = {
            x: 1,
            y: 1
        };

        // Canvas 고정 크기 설정 완료
    }

    // 게임 속도 설정
    setGameSpeed(speed) {
        this.gameSpeed = speed;

        // 전투 시스템에 속도 적용
        if (this.battleSystem) {
            this.battleSystem.setGameSpeed(speed);
        }

        // 애니메이션 매니저에 속도 적용
        if (this.animationManager) {
            this.animationManager.setGlobalSpeed(speed);
        }

        // 게임 속도 설정 완료
    }

    // 게임 데이터 로드 (저장된 게임)
    loadGameData(data) {
        try {
            if (data && data.currentStage && data.player) {
                this.currentStage = data.currentStage;

                // 플레이어 복원
                this.player = new Player(data.player.name, true);
                this.player.hp = data.player.hp;
                this.player.maxHP = data.player.maxHP;

                // 손패 복원
                if (data.player.hand && this.cardManager) {
                    this.player.hand = [];
                    data.player.hand.forEach(cardId => {
                        const card = this.cardManager.createCard(cardId);
                        if (card) {
                            this.player.hand.push(card);
                        }
                    });
                }

                // 다음 스테이지 시작
                this.startStage(this.currentStage);
            }
        } catch (error) {
            // 로드 실패시 새 게임 시작
            this.initializeNewGame();
        }
    }

    // 게임 데이터 저장
    saveGameData() {
        try {
            const saveData = {
                currentStage: this.currentStage,
                player: this.player ? {
                    name: this.player.name,
                    hp: this.player.hp,
                    maxHP: this.player.maxHP,
                    hand: this.player.hand.map(card => card.id)
                } : null,
                timestamp: Date.now()
            };

            localStorage.setItem('cardBattleGame_save', JSON.stringify(saveData));
        } catch (error) {
        }
    }

    // 게임 매니저 파괴
    destroy() {
        // 게임 루프 중지
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        // 이벤트 리스너 제거
        this.boundEventListeners.forEach(({ element, event, handler, useCapture = false }) => {
            element.removeEventListener(event, handler, useCapture);
        });

    }
}

// 전역 객체로 등록
window.GameManager = GameManager;