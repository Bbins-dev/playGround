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

        // 플레이어 이름 모달
        this.playerNameModal = null;

        // 디버그 모드
        this.debug = false;

        // Debounce용 타이머
        this.resizeTimeout = null;

        // 게임 통계 수집
        this.gameStats = {
            finalStage: 1,
            totalTurns: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalDefenseBuilt: 0,
            wastedDefense: 0,
            finalHand: [],
            // 재미있는 통계
            missCount: 0,
            criticalCount: 0,
            mostUsedElement: null,
            mvpCard: null,
            laziestCard: null,
            playStyle: 'balanced',
            cardUsageStats: new Map(), // 카드별 사용 횟수
            elementUsageStats: new Map() // 속성별 사용 횟수
        };
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
            console.error('GameManager 초기화 중 오류:', error);
            // 에러가 있어도 게임 루프는 시작
            if (!this.gameLoop) {
                this.startGameLoop();
            }
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
        // 저장된 게임 속도 설정 불러오기
        const savedSpeed = parseInt(localStorage.getItem('cardBattle_gameSpeed') || '1');
        this.gameSpeed = savedSpeed;

        // 카드 관리자 초기화
        this.cardManager = new CardManager(this);

        // HP 바 시스템 초기화
        this.hpBarSystem = new HPBarSystem();

        // 이펙트 시스템 초기화
        this.effectSystem = new EffectSystem();

        // 애니메이션 관리자 초기화
        this.animationManager = new AnimationManager();
        this.animationManager.start();

        // 전투 시스템 초기화 (저장된 속도 전달)
        this.battleSystem = new BattleSystem(this);
        this.battleSystem.setGameSpeed(this.gameSpeed);

        // UI 관리자 초기화 (다른 시스템들 이후에)
        this.uiManager = new UIManager(this);

        // 화면들 초기화
        this.mainMenu = new MainMenu(this);
        this.cardSelection = new CardSelection(this);

        // 플레이어 이름 모달 초기화
        this.playerNameModal = new PlayerNameModal();

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
            [document, 'keydown', (e) => this.handleKeyDown(e)],
            [this.canvas, 'wheel', (e) => this.handleWheelInput(e)]
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
            case 'gameOver':
                this.currentScreen = null; // 이전 화면 정리
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

        // 게임 통계 초기화
        this.initializeGameStats();

        // 플레이어 생성 (기본 이름 사용)
        const defaultName = I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
        this.player = new Player(defaultName, true);

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

        // 게임 통계 초기화
        this.initializeGameStats();

        // 플레이어 이름 입력 모달 표시
        if (this.playerNameModal) {
            this.playerNameModal.show((playerName) => {
                this.onPlayerNameConfirmed(playerName);
            });
        } else {
            console.error('플레이어 이름 모달이 초기화되지 않았습니다');
            // 기본 이름으로 계속 진행
            const defaultName = I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
            this.onPlayerNameConfirmed(defaultName);
        }
    }

    // 플레이어 이름 확정 후 처리
    onPlayerNameConfirmed(playerName) {
        console.log('GameManager: 플레이어 이름 확정:', playerName);

        // 플레이어 생성
        this.player = new Player(playerName, true);

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

        // 플레이어가 없으면 생성 (기본 이름 사용)
        if (!this.player) {
            console.log('플레이어가 없어서 생성합니다');
            const defaultName = I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
            this.player = new Player(defaultName, true);
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
        // 첫 번째 스테이지인 경우 통계 초기화
        if (this.currentStage === 1) {
            this.resetGameStats();
        }

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
        try {
            // 보상 계산
            const rewards = this.enemy.calculateRewards();

            // 승리 모달 표시 후 카드 선택으로 이동
            this.uiManager.showVictoryModal(this.currentStage, () => {
                this.showPostBattleCardSelection();
            });
        } catch (error) {
            console.error('handlePlayerVictory 에러:', error);
            // 에러가 있어도 모달은 표시
            this.uiManager.showVictoryModal(this.currentStage, () => {
                this.showPostBattleCardSelection();
            });
        }
    }

    // 플레이어 패배 처리
    handlePlayerDefeat() {
        try {
            this.changeGameState('gameOver');

            // 통계 마무리 및 사망 원인 설정
            this.finalizeGameStats();
            this.setDeathCause(this.determineCauseOfDeath());

            // 패배 모달 표시 후 메인 메뉴로 이동
            this.uiManager.showDefeatModal(() => {
                this.showMainMenu();
            });
        } catch (error) {
            console.error('handlePlayerDefeat 에러:', error);
            // 에러가 있어도 모달은 표시
            this.uiManager.showDefeatModal(() => {
                this.showMainMenu();
            });
        }
    }

    // 사망 원인 판단
    determineCauseOfDeath() {
        if (!this.player) return 'unknown';

        // 상태이상으로 인한 사망 체크
        if (this.player.hasStatusEffect('burn')) return 'burn';
        if (this.player.hasStatusEffect('poisoned')) return 'poison';

        // 일반 공격으로 사망
        return 'normal_attack';
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

    // 휠 이벤트 처리 (스크롤)
    handleWheelInput(event) {
        event.preventDefault(); // 페이지 스크롤 방지

        // 현재 화면에 휠 이벤트 전달
        if (this.currentScreen && this.currentScreen.handleWheelInput) {
            this.currentScreen.handleWheelInput(event.deltaY);
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

        // UI 매니저의 속도 버튼 업데이트
        if (this.uiManager) {
            this.uiManager.updateSpeedButton(speed);
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

    // 게임 통계 초기화
    resetGameStats() {
        this.gameStats = {
            finalStage: this.currentStage,
            totalTurns: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalDefenseBuilt: 0,
            wastedDefense: 0,
            finalHand: [],
            // 재미있는 통계
            missCount: 0,
            criticalCount: 0,
            mostUsedElement: null,
            mvpCard: null,
            laziestCard: null,
            playStyle: 'balanced',
            cardUsageStats: new Map(),
            elementUsageStats: new Map(),
            deathCause: null
        };
    }

    // 통계 업데이트 메서드들
    updateStatsOnDamage(damage, isCritical = false) {
        this.gameStats.totalDamageDealt += damage;
        if (isCritical) {
            this.gameStats.criticalCount++;
        }
    }

    updateStatsOnMiss() {
        this.gameStats.missCount++;
    }

    updateStatsOnDefense(defenseAmount) {
        this.gameStats.totalDefenseBuilt += defenseAmount;
    }

    updateStatsOnCardUse(card) {
        // 카드별 사용 횟수
        const cardId = card.id || card.name;
        this.gameStats.cardUsageStats.set(cardId, (this.gameStats.cardUsageStats.get(cardId) || 0) + 1);

        // 속성별 사용 횟수
        const element = card.element;
        this.gameStats.elementUsageStats.set(element, (this.gameStats.elementUsageStats.get(element) || 0) + 1);
    }

    updateStatsOnTurn() {
        this.gameStats.totalTurns++;
    }

    updateStatsOnPlayerDamage(damage) {
        this.gameStats.totalDamageReceived += damage;
    }

    setDeathCause(cause) {
        this.gameStats.deathCause = cause;
    }

    // 최종 통계 계산
    finalizeGameStats() {
        this.gameStats.finalStage = this.currentStage;
        this.gameStats.finalHand = [...this.player.hand];

        // 가장 많이 사용한 속성 계산
        let maxUsage = 0;
        let mostUsedElement = null;
        for (const [element, count] of this.gameStats.elementUsageStats) {
            if (count > maxUsage) {
                maxUsage = count;
                mostUsedElement = element;
            }
        }
        this.gameStats.mostUsedElement = mostUsedElement;

        // MVP 카드 계산 (가장 많이 사용된 카드)
        let maxCardUsage = 0;
        let mvpCard = null;
        for (const [cardId, count] of this.gameStats.cardUsageStats) {
            if (count > maxCardUsage) {
                maxCardUsage = count;
                mvpCard = cardId;
            }
        }
        this.gameStats.mvpCard = mvpCard;

        // 가장 게으른 카드 계산 (가장 적게 사용된 카드)
        let minCardUsage = Infinity;
        let laziestCard = null;
        for (const [cardId, count] of this.gameStats.cardUsageStats) {
            if (count < minCardUsage) {
                minCardUsage = count;
                laziestCard = cardId;
            }
        }
        this.gameStats.laziestCard = laziestCard;

        // 플레이 스타일 분석
        this.analyzePlayStyle();
    }

    // 플레이 스타일 분석
    analyzePlayStyle() {
        const { totalDamageDealt, totalDefenseBuilt, criticalCount, missCount } = this.gameStats;

        if (totalDefenseBuilt > totalDamageDealt * 1.5) {
            this.gameStats.playStyle = 'defensive';
        } else if (criticalCount > this.gameStats.totalTurns * 0.3) {
            this.gameStats.playStyle = 'aggressive';
        } else if (missCount > this.gameStats.totalTurns * 0.2) {
            this.gameStats.playStyle = 'unlucky';
        } else {
            this.gameStats.playStyle = 'balanced';
        }
    }

    // 통계 초기화 (legacy)
    initializeGameStats() {
        this.gameStats = {
            // 기본 통계
            gameStartTime: Date.now(),
            finalStage: 1,
            totalTurns: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            totalDefenseBuilt: 0,
            wastedDefense: 0,

            // 카드 사용 통계
            cardUsageCount: {}, // cardId -> count
            cardDamageDealt: {}, // cardId -> total damage
            cardsNeverUsed: [], // cardId[]

            // 유머 통계
            missCount: 0,
            enemyMissCount: 0,
            crouchCount: 0, // 쉬기 카드 사용 횟수
            maxHPReached: GameConfig.player.startingHP,
            overkillDamage: 0, // 이미 죽은 적에게 가한 추가 데미지

            // 플레이 스타일 분석
            attackCardUsage: 0,
            defenseCardUsage: 0,

            // 특별한 순간들
            closeCallMoments: [], // HP 1-2일 때의 상황들
            deathCause: '', // 사망 원인

            // 최종 손패 (패배 시점)
            finalHand: []
        };
    }

    // 카드 사용 통계 업데이트
    updateCardUsageStats(card, damage = 0) {
        if (!this.gameStats || !card) return;

        const cardId = card.id || card.name;

        // 사용 횟수 증가
        this.gameStats.cardUsageCount[cardId] = (this.gameStats.cardUsageCount[cardId] || 0) + 1;

        // 데미지 누적
        if (damage > 0) {
            this.gameStats.cardDamageDealt[cardId] = (this.gameStats.cardDamageDealt[cardId] || 0) + damage;
            this.gameStats.totalDamageDealt += damage;
        }

        // 카드 타입별 사용 통계
        if (card.type === 'attack') {
            this.gameStats.attackCardUsage++;
        } else if (card.type === 'defense') {
            this.gameStats.defenseCardUsage++;
        }

        // 특별한 카드 추적
        if (cardId === 'crouch' || card.name === '쉬기') {
            this.gameStats.crouchCount++;
        }
    }

    // 데미지 관련 통계 업데이트
    updateDamageStats(damage, isPlayerDamage = false, isMiss = false) {
        if (!this.gameStats) return;

        if (isMiss) {
            if (isPlayerDamage) {
                this.gameStats.missCount++;
            } else {
                this.gameStats.enemyMissCount++;
            }
        } else if (damage > 0) {
            if (isPlayerDamage) {
                this.gameStats.totalDamageTaken += damage;

                // 클로즈콜 체크 (HP가 낮을 때)
                if (this.player && this.player.hp <= 2 && this.player.hp > 0) {
                    this.gameStats.closeCallMoments.push({
                        hp: this.player.hp,
                        stage: this.currentStage,
                        turn: this.gameStats.totalTurns
                    });
                }
            }
        }
    }

    // 방어력 통계 업데이트
    updateDefenseStats(defenseGained, isWasted = false) {
        if (!this.gameStats) return;

        this.gameStats.totalDefenseBuilt += defenseGained;

        if (isWasted) {
            this.gameStats.wastedDefense += defenseGained;
        }
    }

    // 턴 통계 업데이트
    updateTurnStats() {
        if (!this.gameStats) return;
        this.gameStats.totalTurns++;
    }

    // 사망 원인 설정
    setDeathCause(cause) {
        if (!this.gameStats) return;
        this.gameStats.deathCause = cause;
    }

    // 최종 손패 저장
    saveFinalHand() {
        if (!this.gameStats || !this.player) return;

        this.gameStats.finalHand = this.player.hand.map(card => ({
            id: card.id || card.name,
            name: card.name,
            element: card.element,
            type: card.type
        }));

        this.gameStats.finalStage = this.currentStage;
    }

    // 사용하지 않은 카드 찾기
    findUnusedCards() {
        if (!this.gameStats || !this.player || !this.player.hand) return;

        const usedCardIds = Object.keys(this.gameStats.cardUsageCount || {});
        this.gameStats.cardsNeverUsed = this.player.hand
            .filter(card => card && !usedCardIds.includes(card.id || card.name))
            .map(card => card.id || card.name);
    }

    // 플레이 스타일 분석
    getPlayStyle() {
        if (!this.gameStats) return 'unknown';

        const totalCardUsage = this.gameStats.attackCardUsage + this.gameStats.defenseCardUsage;
        if (totalCardUsage === 0) return 'peaceful'; // 평화주의자

        const defenseRatio = this.gameStats.defenseCardUsage / totalCardUsage;

        if (defenseRatio >= 0.6) return 'turtle'; // 거북이 전사
        if (defenseRatio <= 0.3) return 'reckless'; // 무모한 돌격대장
        return 'balanced'; // 우유부단한 전략가
    }

    // MVP/LVP 카드 찾기
    getMVPCard() {
        if (!this.gameStats) return null;

        let maxUsage = 0;
        let mvpCard = null;

        for (const [cardId, count] of Object.entries(this.gameStats.cardUsageCount)) {
            if (count > maxUsage) {
                maxUsage = count;
                mvpCard = cardId;
            }
        }

        return mvpCard ? { cardId: mvpCard, usage: maxUsage } : null;
    }

    getLVPCard() {
        if (!this.gameStats || this.gameStats.cardsNeverUsed.length === 0) return null;
        return this.gameStats.cardsNeverUsed[0]; // 첫 번째 미사용 카드
    }

    // 최종 통계 계산 (패배 시 호출)
    finalizeGameStats() {
        if (!this.gameStats) return;

        this.saveFinalHand();
        this.findUnusedCards();

        // 게임 시간 계산
        this.gameStats.gameDuration = Date.now() - this.gameStats.gameStartTime;
    }
}

// 전역 객체로 등록
window.GameManager = GameManager;