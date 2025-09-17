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
    }

    // 게임 초기화
    init() {
        try {
            console.log('🎮 게임 매니저 초기화 시작');

            // Canvas 초기화
            this.initCanvas();

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

        // Canvas 크기 설정 및 반응형 업데이트
        this.updateCanvasSize();

        console.log(`Canvas 초기화: ${this.canvas.width}x${this.canvas.height}`);
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

        // 키보드 이벤트
        this.addEventListeners([
            [document, 'keydown', (e) => this.handleKeyDown(e)],
            [window, 'resize', () => this.handleResize()]
        ]);

        // 마우스 및 터치 이벤트
        this.addEventListeners([
            [this.canvas, 'click', (e) => this.handlePointerInput(e)],
            [this.canvas, 'touchstart', (e) => this.handleTouchStart(e)],
            [this.canvas, 'touchend', (e) => this.handleTouchEnd(e)],
            [this.canvas, 'mousedown', (e) => this.handleMouseDown(e)],
            [this.canvas, 'mouseup', (e) => this.handleMouseUp(e)]
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
        console.log('🔄 게임 루프 시작');
        this.lastTime = performance.now();

        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            this.gameLoop = requestAnimationFrame(gameLoop);
        };

        this.gameLoop = requestAnimationFrame(gameLoop);
        console.log('✅ 게임 루프 등록 완료');
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
            console.warn('⚠️ UIManager가 없어서 렌더링 건너뜀');
            return;
        }

        // UI 매니저를 통한 렌더링
        this.uiManager.render();
    }

    // 화면 전환
    switchScreen(screenName) {
        console.log(`🖥️ 화면 전환: ${this.gameState} → ${screenName}`);

        this.gameState = screenName;

        switch (screenName) {
            case 'menu':
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
        console.log('🏠 메인 메뉴 표시');

        // 게임 상태를 메뉴로 강제 설정
        this.gameState = 'menu';
        this.currentScreen = 'menu';

        this.switchScreen('menu');
        if (this.mainMenu) {
            this.mainMenu.show();
        }

        console.log(`✅ 메인 메뉴 설정 완료 - gameState: ${this.gameState}, currentScreen: ${this.currentScreen}`);
    }

    // 게임 상태 변경
    changeGameState(newState) {
        console.log(`🔄 게임 상태 변경: ${this.gameState} → ${newState}`);
        this.gameState = newState;
        this.switchScreen(newState);
    }

    // 새 게임 초기화
    initializeNewGame() {
        console.log('🆕 새 게임 초기화');

        // 플레이어 생성
        this.player = new Player('플레이어', true);

        // 기본 카드 추가 (카드 선택을 건너뛴 경우의 폴백)
        if (this.player.hand.length === 0) {
            console.log('⚠️ 카드가 없어서 기본 카드 추가');
            const bashCard = this.cardManager.createCard('bash');
            if (bashCard) {
                this.player.hand.push(bashCard);
            }
        }

        // 첫 번째 스테이지 시작
        this.startStage(1);
    }

    // 게임 시작 (카드 선택 완료 후)
    startGame() {
        console.log('🎮 게임 시작');
        this.initializeNewGame();
    }

    // 초기 카드 설정
    setInitialCards(cardIds) {
        console.log('🃏 초기 카드 설정:', cardIds);

        if (this.player) {
            this.player.hand = [];
            cardIds.forEach(cardId => {
                this.cardManager.addCardToPlayer(this.player, cardId);
            });
        }

        this.startStage(1);
    }

    // 보상 카드 추가 (손패 왼쪽에 추가)
    addRewardCard(cardId) {
        console.log('🎁 보상 카드 추가:', cardId);

        if (this.player && this.cardManager) {
            // 'left' 옵션으로 손패 왼쪽에 추가
            this.cardManager.addCardToPlayer(this.player, cardId, 'left');
        }

        this.continueToNextStage();
    }

    // 카드 교체
    replaceCard(newCardId) {
        console.log('🔄 카드 교체:', newCardId);
        // TODO: 구현 필요
        this.continueToNextStage();
    }

    // 카드 선택 건너뛰기
    skipCardSelection() {
        console.log('⏭️ 카드 선택 건너뛰기');
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
    handleResize() {
        this.updateCanvasSize();

        if (this.uiManager) {
            this.uiManager.handleResize();
        }

    }

    // Canvas 크기 동적 업데이트 (레터박스 방식)
    updateCanvasSize() {
        if (!this.canvas) return;

        // game-wrapper를 참조 (Canvas와 UI 오버레이를 포함하는 컨테이너)
        const gameWrapper = this.canvas.closest('.game-wrapper');
        const container = gameWrapper || this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 기본 게임 비율 (16:9)
        const gameAspectRatio = GameConfig.canvas.width / GameConfig.canvas.height;

        // 컨테이너 크기
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight;

        // 레터박스 방식으로 크기 계산
        if (containerAspectRatio > gameAspectRatio) {
            // 컨테이너가 더 넓음 - 세로를 맞추고 양옆에 레터박스
            displayHeight = Math.min(containerHeight * 0.9, 800); // 최대 높이 제한
            displayWidth = displayHeight * gameAspectRatio;
        } else {
            // 컨테이너가 더 높음 - 가로를 맞추고 위아래에 레터박스
            displayWidth = Math.min(containerWidth * 0.9, 1200); // 최대 너비 제한
            displayHeight = displayWidth / gameAspectRatio;
        }

        // Canvas 표시 크기 설정 (CSS)
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // Canvas 내부 해상도는 고정 유지
        this.canvas.width = GameConfig.canvas.width;
        this.canvas.height = GameConfig.canvas.height;

        // 레터박스 오프셋 계산 (중앙 정렬을 위해)
        this.letterboxOffset = {
            x: (containerWidth - displayWidth) / 2,
            y: (containerHeight - displayHeight) / 2
        };

        // 스케일 비율 저장 (입력 좌표 변환용)
        this.displayScale = {
            x: displayWidth / GameConfig.canvas.width,
            y: displayHeight / GameConfig.canvas.height
        };

        console.log(`Canvas 크기 업데이트: ${displayWidth}x${displayHeight} (스케일: ${this.displayScale.x.toFixed(2)})`);
        console.log(`레터박스 오프셋: ${this.letterboxOffset.x.toFixed(1)}x${this.letterboxOffset.y.toFixed(1)}`);
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

        console.log(`⚡ 게임 속도: ${speed}x`);
    }

    // 게임 데이터 로드 (저장된 게임)
    loadGameData(data) {
        try {
            // TODO: 저장된 게임 데이터 로드 구현
            console.log('📖 게임 데이터 로드:', data);
        } catch (error) {
            console.error('게임 데이터 로드 실패:', error);
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
            console.log('💾 게임 데이터 저장 완료');
        } catch (error) {
            console.error('게임 데이터 저장 실패:', error);
        }
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