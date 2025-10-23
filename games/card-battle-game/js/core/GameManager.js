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
        this.audioSystem = null;
        this.loadingScreen = null;
        this.volumeControl = null;

        // 화면 관리
        this.mainMenu = null;
        this.cardSelectionModal = null; // DOM 모달로 변경
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
            attackCardUsage: 0,        // 공격 카드 사용 횟수
            defenseCardUsage: 0,       // 방어 카드 사용 횟수
            isGameComplete: false,     // 게임 완료 플래그 (마지막 스테이지 클리어)
            cardUsageStats: new Map(), // 카드별 사용 횟수
            elementUsageStats: new Map(), // 속성별 사용 횟수
            // 대미지 타입별 통계
            damageByType: {
                normal: 0,
                burn: 0,
                poison: 0,
                self: 0,
                reflect: 0,
                thorns: 0
            }
        };

        // 스테이지 회복 추적 (애니메이션용)
        this.stageHealingAmount = 0;
    }

    // 게임 초기화
    async init() {
        try {
            // 로딩 화면 초기화 및 표시
            this.loadingScreen = new LoadingScreen(this);
            this.loadingScreen.show();

            // Canvas 초기화
            this.initCanvas();

            // i18n 시스템 완전 로드 대기 (언어 번역 적용 후 메뉴 표시)
            await this.waitForI18nReady();

            // 데이터베이스 초기화 (시스템들보다 먼저)
            CardDatabase.initialize();

            // 시스템들 초기화 (오디오 시스템 포함)
            this.initSystems();

            // 오디오 파일 프리로드 (진행률 표시)
            await this.preloadAudioAssets();

            // 이벤트 리스너 등록
            this.setupEventListeners();

            // 게임 루프 시작 (메인 메뉴 표시 전에)
            this.startGameLoop();

            // 로딩 완료 후 "Click to Start" 버튼 표시
            this.loadingScreen.showStartButton();

            // 사용자 클릭 대기 (Autoplay 차단 해결)
            await this.loadingScreen.waitForUserClick();

            // 사용자 클릭 후 로딩 화면 숨김
            await this.loadingScreen.hide();

            // 로딩 화면 완전히 숨긴 후 메인 메뉴 표시 (BGM은 showMainMenu에서 재생)
            this.showMainMenu();

        } catch (error) {
            console.error('GameManager 초기화 중 오류:', error);
            // 에러가 있어도 로딩 화면 숨기고 게임 시작
            if (this.loadingScreen) {
                this.loadingScreen.hideImmediately();
            }
            this.showMainMenu();
            if (!this.gameLoop) {
                this.startGameLoop();
            }
        }
    }

    // i18n 시스템 준비 대기
    async waitForI18nReady() {
        // i18n 시스템이 이미 준비되어 있는지 확인
        if (window.i18nSystem && window.i18nSystem.isReady) {
            return;
        }

        // 최대 2초 대기 (안전 장치)
        const maxWaitTime = 2000;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkI18n = () => {
                if (window.i18nSystem && window.i18nSystem.isReady) {
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    console.warn('[GameManager] i18n system timeout, proceeding anyway');
                    resolve();
                } else {
                    // 50ms마다 체크
                    setTimeout(checkI18n, 50);
                }
            };
            checkI18n();
        });
    }

    // 오디오 에셋 프리로드
    async preloadAudioAssets() {
        if (!this.audioSystem) {
            console.warn('[GameManager] AudioSystem not initialized');
            return;
        }

        return new Promise((resolve) => {
            this.audioSystem.preloadAll(
                // 진행률 콜백
                (loaded, total) => {
                    if (this.loadingScreen) {
                        this.loadingScreen.updateProgress(loaded, total);
                    }
                },
                // 완료 콜백
                () => {
                    resolve();
                }
            );
        });
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

        // 오디오 시스템 초기화 (가장 먼저)
        this.audioSystem = new AudioSystem();

        // 볼륨 조절 시스템 초기화 (AudioSystem 다음)
        this.volumeControl = new VolumeControl(this);

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

        // 기존 메서드 활용하여 속도 UI 동기화
        this.uiManager.updateSpeedButton(savedSpeed);

        // 화면들 초기화
        this.mainMenu = new MainMenu(this);
        // 기존 CardSelection 대신 CardSelectionModal 사용
        this.cardSelectionModal = new CardSelectionModal(this);

        // 플레이어 이름 모달 초기화
        this.playerNameModal = new PlayerNameModal(this);

        // 현재 화면 설정
        this.currentScreen = this.mainMenu;

    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 게임 속도 조절 버튼
        this.addEventListeners([
            ['speed-1x', 'click', () => {
                // 버튼 클릭 사운드 재생
                if (this.audioSystem) {
                    this.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.setGameSpeed(1);
            }],
            ['speed-2x', 'click', () => {
                // 버튼 클릭 사운드 재생
                if (this.audioSystem) {
                    this.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.setGameSpeed(2);
            }],
            ['speed-3x', 'click', () => {
                // 버튼 클릭 사운드 재생
                if (this.audioSystem) {
                    this.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.setGameSpeed(3);
            }],
            ['card-gallery-btn', 'click', async () => await this.showCardGallery()],
            ['close-gallery', 'click', async () => await this.hideCardGallery()]
        ]);

        // 키보드 이벤트 및 뷰포트 스케일링 이벤트
        this.addEventListeners([
            [document, 'keydown', (e) => this.handleKeyDown(e)],
            [this.canvas, 'wheel', (e) => this.handleWheelInput(e)],
            [window, 'resize', () => this.handleResize()]
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
                // CardSelectionModal을 사용하므로 Canvas 화면 불필요
                this.currentScreen = null;
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
    // 모든 게임 UI 완전 초기화 (메인 메뉴 복귀 시 등)
    clearAllGameUI() {
        // HPBarSystem 완전 초기화
        if (this.hpBarSystem) {
            // 화면 테두리 효과 제거
            this.hpBarSystem.clearScreenBorderEffect();

            // 플레이어/적 상태이상 라벨 제거
            if (this.hpBarSystem.playerStatusGrid) {
                this.hpBarSystem.playerStatusGrid.innerHTML = '';
            }
            if (this.hpBarSystem.enemyStatusGrid) {
                this.hpBarSystem.enemyStatusGrid.innerHTML = '';
            }

            // 버프 라벨 제거
            if (this.hpBarSystem.playerBuffsGrid) {
                this.hpBarSystem.playerBuffsGrid.innerHTML = '';
            }
            if (this.hpBarSystem.enemyBuffsGrid) {
                this.hpBarSystem.enemyBuffsGrid.innerHTML = '';
            }

            // Effects Container 비활성화
            if (this.hpBarSystem.playerEffectsContainer) {
                this.hpBarSystem.playerEffectsContainer.classList.remove('active');
            }
            if (this.hpBarSystem.enemyEffectsContainer) {
                this.hpBarSystem.enemyEffectsContainer.classList.remove('active');
            }
        }

        // UIManager 상태이상 테두리 제거
        if (this.uiManager) {
            this.uiManager.clearStatusBorder();
        }

        // Player/Enemy 객체 상태 초기화
        if (this.player) {
            this.player.statusEffects = [];
            this.player.strength = 0;
            this.player.enhance = 0;
            this.player.focus = 0;
            this.player.speed = 0;
            this.player.scent = 0;
            this.player.sharpen = 0;
            this.player.hotWind = 0;
            this.player.lithium = 0;
            this.player.breath = 0;
        }

        if (this.enemy) {
            this.enemy.statusEffects = [];
            this.enemy.strength = 0;
            this.enemy.enhance = 0;
            this.enemy.focus = 0;
            this.enemy.speed = 0;
            this.enemy.scent = 0;
            this.enemy.sharpen = 0;
            this.enemy.hotWind = 0;
            this.enemy.lithium = 0;
            this.enemy.breath = 0;
        }
    }

    showMainMenu() {
        // 게임 상태를 메뉴로 설정
        this.gameState = 'menu';
        this.currentScreen = this.mainMenu;

        // HTML body에 게임 상태 표시 (CSS 선택자용)
        document.body.setAttribute('data-game-state', 'menu');

        // 상태이상 UI 완전 초기화
        this.clearAllGameUI();

        // 메인 메뉴 BGM 재생
        if (this.audioSystem) {
            this.audioSystem.playBGM('mainMenu', true, true);
        }

        // 인게임 볼륨 버튼 숨기기 (메뉴 화면에서는 설정 모달 사용)
        if (this.volumeControl) {
            this.volumeControl.hideIngameVolumeButton();
        }

        // UI Manager를 통해 화면 전환
        if (this.uiManager) {
            this.uiManager.switchScreen('menu');
        }

        // Canvas 기반 메인 메뉴 표시 (필요시)
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
        // 플레이어 생성
        this.player = new Player(playerName, true);

        // 새로운 CardSelectionModal 사용
        if (this.cardSelectionModal) {
            this.cardSelectionModal.show(async (selectedCard) => {
                try {
                    await this.completeInitialCardSelection(selectedCard);
                } catch (error) {
                    console.error('[GameManager] 카드 선택 완료 중 오류:', error);
                    console.error(error.stack);
                    // 오류 발생시 메인 메뉴로 복귀
                    this.switchScreen('main');
                }
            });
        } else {
            console.error('카드 선택 모달이 초기화되지 않았습니다');
            this.initializeNewGame();
        }
    }

    // 게임 시작 (카드 선택 완료 후)
    startGame() {
        this.initializeNewGame();
    }

    // 초기 카드 설정
    async setInitialCards(cardIds) {
        // 플레이어가 없으면 생성 (기본 이름 사용)
        if (!this.player) {
            const defaultName = I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
            this.player = new Player(defaultName, true);
        }

        if (this.player) {
            this.player.hand = [];
            cardIds.forEach(cardId => {
                this.cardManager.addCardToPlayer(this.player, cardId);
            });
        }

        await this.startStage(1);
    }

    // 보상 카드 추가 (손패 왼쪽에 추가)
    async addRewardCard(cardId) {
        if (this.player && this.cardManager) {
            // 'left' 옵션으로 손패 왼쪽에 추가
            this.cardManager.addCardToPlayer(this.player, cardId, 'left');
        }

        await this.continueToNextStage();
    }

    // 카드 교체
    async replaceCard(newCardId) {
        if (this.player && this.cardManager) {
            // 첫 번째 카드를 새 카드로 교체
            this.cardManager.replacePlayerCard(this.player, 0, newCardId);
        }
        await this.continueToNextStage();
    }

    // 카드 선택 건너뛰기
    async skipCardSelection() {
        await this.continueToNextStage();
    }

    // 다음 스테이지 진행
    async continueToNextStage() {
        this.currentStage++;
        await this.startStage(this.currentStage);
    }

    // 초기 카드 선택 완료
    async completeInitialCardSelection(selectedCard) {
        // selectedCard는 이미 Card 인스턴스임
        if (selectedCard) {
            this.player.addCard(selectedCard);
            // 첫 번째 스테이지 시작
            await this.startStage(1);
        } else {
            console.error('[GameManager] selectedCard가 null 또는 undefined!');
        }
    }

    // 스테이지 시작
    async startStage(stageNumber) {
        this.currentStage = stageNumber;

        // 메인 메뉴 숨김 (null 체크)
        if (this.mainMenu) {
            this.mainMenu.hide();
        } else {
            console.warn('[GameManager] mainMenu가 null!');
        }

        // 전투 화면으로 전환
        this.switchScreen('battle');

        // 적 생성
        this.enemy = new Enemy(`스테이지 ${stageNumber} 적`, stageNumber);
        this.enemy.buildDeck();

        // 스테이지 인디케이터 업데이트 (실제 스테이지 번호 표시)
        if (this.uiManager) {
            this.uiManager.updateStageInfo(stageNumber);
        }

        // 전투 시작
        await this.startBattle();
    }

    // 전투 시작
    async startBattle() {
        // 첫 번째 스테이지인 경우 통계 초기화
        if (this.currentStage === 1) {
            this.resetGameStats();
        }

        this.changeGameState('battle');

        // HTML body에 게임 상태 표시 (CSS 선택자용)
        document.body.setAttribute('data-game-state', 'battle');

        // 전투 BGM 재생 (스테이지에 따라 일반/보스 자동 선택)
        if (this.audioSystem) {
            const battleBGMKey = this.audioSystem.getBattleBGM(this.currentStage);
            this.audioSystem.playBGM(battleBGMKey, true, true);
        }

        // 인게임 볼륨 버튼 표시 (전투 중)
        if (this.volumeControl) {
            this.volumeControl.showIngameVolumeButton();
        }

        if (this.battleSystem) {
            await this.battleSystem.startBattle(this.player, this.enemy);
        } else {
            console.error('[GameManager] battleSystem이 null!');
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
            // 승리 BGM 재생 (반복 없음)
            if (this.audioSystem) {
                this.audioSystem.stopBGM(true);
                this.audioSystem.playBGM('victoryModal', false, true);
            }

            // 스테이지 클리어 효과 재생
            if (this.uiManager) {
                this.uiManager.playStageCompleteEffect();
            }

            // 보상 계산
            const rewards = this.enemy.calculateRewards();

            // 보상 카드 생성
            const rewardCards = this.generateRewardCards();

            // 마지막 스테이지 체크 (확장 가능)
            const maxStage = GameConfig.gameRules.getMaxStage();
            const isLastStage = this.currentStage >= maxStage;

            if (isLastStage) {
                // 🎉 게임 완료 - 패배 모달을 "게임 클리어" 모드로 표시
                this.changeGameState('gameOver');

                // 승리 BGM 재생
                if (this.audioSystem) {
                    this.audioSystem.stopBGM(true);
                    this.audioSystem.playBGM('victory', false, true);
                }

                // 통계 finalize
                this.finalizeGameStats();

                // gameStats에 게임 완료 플래그 추가
                this.gameStats.isGameComplete = true;

                // 패배 모달 표시 (게임 완료 모드)
                this.uiManager.showDefeatModal(
                    this.gameStats,
                    () => this.restartGame(),
                    () => this.returnToMainMenu()
                );
            } else {
                // 일반 스테이지 클리어 - 기존 로직
                this.uiManager.showVictoryModal(this.currentStage, async () => {
                    await this.proceedToNextStage();
                }, rewardCards);
            }
        } catch (error) {
            console.error('handlePlayerVictory 에러:', error);
            // 에러가 있어도 모달은 표시
            const rewardCards = this.generateRewardCards();

            // 마지막 스테이지 체크 (확장 가능)
            const maxStage = GameConfig.gameRules.getMaxStage();
            const isLastStage = this.currentStage >= maxStage;

            if (isLastStage) {
                // 게임 완료
                this.changeGameState('gameOver');
                this.finalizeGameStats();
                this.gameStats.isGameComplete = true;
                this.uiManager.showDefeatModal(
                    this.gameStats,
                    () => this.restartGame(),
                    () => this.returnToMainMenu()
                );
            } else {
                // 일반 스테이지 클리어
                this.uiManager.showVictoryModal(this.currentStage, async () => {
                    await this.proceedToNextStage();
                }, rewardCards);
            }
        }
    }

    // 플레이어 패배 처리
    handlePlayerDefeat() {
        try {
            this.changeGameState('gameOver');

            // 패배 BGM 재생 (반복 없음)
            if (this.audioSystem) {
                this.audioSystem.stopBGM(true);
                this.audioSystem.playBGM('gameOver', false, true);
            }

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

    // 전투 후 카드 선택 (기존 Canvas 방식 - 현재 미사용)
    showPostBattleCardSelection() {
        this.changeGameState('cardSelection');

        // 모든 카드에서 랜덤 3장 제시
        const availableCards = this.cardManager.getRandomCards(3);
        this.cardSelection.setupRewardSelection(availableCards.map(cardId => CardDatabase.getCard(cardId)));
    }

    /**
     * 보상 카드 생성 (승리 모달용)
     * @returns {Array} 보상 카드 배열
     */
    generateRewardCards() {
        if (!this.cardManager) return [];

        try {
            // CardManager를 통해 랜덤 카드 3장 생성
            const cardIds = this.cardManager.getRandomCards(3);
            const rewardCards = cardIds.map(cardId => CardDatabase.getCard(cardId)).filter(Boolean);

            return rewardCards;
        } catch (error) {
            console.error('보상 카드 생성 에러:', error);
            return [];
        }
    }

    /**
     * 다음 스테이지로 진행
     */
    async proceedToNextStage() {
        try {
            // 스테이지 증가
            this.currentStage++;

            // 플레이어 체력 회복 처리
            this.applyStageHealing();

            // 다음 적 생성
            this.setupNextBattle();

            // startBattle이 모든 초기화를 처리 (DRY)
            await this.startBattle();

        } catch (error) {
            console.error('❌ 다음 스테이지 진행 에러:', error);
            // 에러 발생 시 메인 메뉴로 이동
            this.showMainMenu();
        }
    }

    /**
     * 스테이지 클리어 후 체력 회복 처리
     */
    applyStageHealing() {
        if (!this.player) return;

        // 최대 체력 증가 (스테이지 클리어마다)
        const maxHPIncrease = GameConfig.healing.maxHPIncreasePerStage || 5;
        this.player.maxHP += maxHPIncrease;

        // 이전 스테이지 기준으로 체크 (클리어한 스테이지)
        const previousStage = this.currentStage - 1;
        const isFullHealStage = previousStage > 0 && previousStage % GameConfig.healing.fullHealInterval === 0;

        if (isFullHealStage) {
            // 10, 20, 30... 스테이지를 클리어했을 때 회복
            const healAmount = this.player.maxHP - this.player.hp;
            this.player.hp = this.player.maxHP;
            this.stageHealingAmount = healAmount;
        } else {
            // 일반 회복 (5 HP)
            const healAmount = this.player.heal(GameConfig.healing.stageHealing);
            this.stageHealingAmount = healAmount;
        }
    }

    /**
     * 다음 전투 설정
     */
    setupNextBattle() {
        // 새로운 적 생성
        this.enemy = new Enemy(`스테이지 ${this.currentStage} 적`, this.currentStage);

        // 적 덱 구성
        this.enemy.buildDeck();

        // 스테이지 인디케이터 업데이트
        if (this.uiManager) {
            this.uiManager.updateStageInfo(this.currentStage);
        }

        // 플레이어 상태 초기화
        if (this.player) {
            this.player.lastDamageTaken = 0;
            this.player.defense = 0;
            // 모든 상태이상 초기화 (도발, 기절 등)
            this.player.clearAllStatusEffects();
            // 모든 버프 초기화 (힘 버프 등)
            this.player.clearBuffs();

            // 플레이어 카드들의 런타임 스탯 초기화
            if (this.player.hand) {
                this.player.hand.forEach(card => {
                    if (card.resetRuntimeStats) {
                        card.resetRuntimeStats();
                    }
                });
            }
        }

        // 새 Enemy 인스턴스는 이미 lastDamageTaken = 0으로 초기화됨

        // UI 업데이트
        if (this.uiManager) {
            this.uiManager.updateUIVisibility();
        }

        // HP 바 시스템 업데이트 (올바른 방법으로 수정)
        if (this.hpBarSystem && this.player && this.enemy) {
            this.hpBarSystem.updateHP(this.player, true);
            this.hpBarSystem.updateHP(this.enemy, false);
            this.hpBarSystem.updateDefense(this.player, true);
            this.hpBarSystem.updateDefense(this.enemy, false);

            // 이름도 업데이트
            this.hpBarSystem.updateNames(this.player, this.enemy);

            // 상태 이상도 업데이트
            this.hpBarSystem.updateStatusEffects(this.player, true);
            this.hpBarSystem.updateStatusEffects(this.enemy, false);
        }
    }

    // 카드 갤러리 표시 (DOM 모달 사용)
    async showCardGallery() {
        if (this.uiManager) {
            this.uiManager.showCardGallery();
        }

        // 현재 BGM 일시정지 & 스택에 저장, 카드 갤러리 BGM 재생
        if (this.audioSystem) {
            this.audioSystem.pauseAndSaveBGM();
            await this.audioSystem.playBGM('cardGallery', true, true);
        }
    }

    // 카드 갤러리 숨기기 (DOM 모달 사용)
    async hideCardGallery() {
        if (this.uiManager) {
            this.uiManager.hideCardGallery();
        }

        // 이전 BGM 복원 (내부적으로 현재 BGM 정지 처리)
        if (this.audioSystem) {
            await this.audioSystem.restorePreviousBGM();
        }
    }

    // 키보드 이벤트 처리
    handleKeyDown(event) {
        // 모든 키보드 입력 무시 (마우스/터치만 사용)
        return;

        // (아래 코드는 실행되지 않음)
        // // 현재 화면에 키보드 이벤트 전달
        // if (this.currentScreen && this.currentScreen.handleInput) {
        //     this.currentScreen.handleInput(event.key);
        //     return;
        // }

        // // 전역 키보드 이벤트
        // switch (event.key) {
        //     // ESC 키로 메인 메뉴 복귀 기능 비활성화
        //     // case 'Escape':
        //     //     if (this.gameState === 'battle') {
        //     //         this.switchScreen('menu');
        //     //     }
        //     //     break;

        //     case '1':
        //     case '2':
        //     case '3':
        //         this.setGameSpeed(parseInt(event.key));
        //         break;

        //     case 'g':
        //         this.showCardGallery();
        //         break;
        // }
    }

    // 휠 이벤트 처리 (스크롤)
    handleWheelInput(event) {
        event.preventDefault(); // 페이지 스크롤 방지

        // 현재 화면에 휠 이벤트 전달
        if (this.currentScreen && this.currentScreen.handleWheelInput) {
            this.currentScreen.handleWheelInput(event.deltaY);
        }
    }

    // 마우스 좌표 계산 - CanvasUtils 사용 (중복 제거)
    getCanvasCoordinates(event) {
        return CanvasUtils.getCanvasCoordinates(event, this.canvas, this.displayScale);
    }

    // 터치 좌표 계산 - CanvasUtils 사용 (중복 제거)
    getTouchCoordinates(touch) {
        // 터치 이벤트를 위한 임시 이벤트 객체 생성
        const touchEvent = { touches: [touch] };
        return CanvasUtils.getCanvasCoordinates(touchEvent, this.canvas, this.displayScale);
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

    // Canvas 크기 동적 업데이트 (Configuration-Driven)
    updateCanvasSize() {
        if (!this.canvas) return;

        // GameConfig 기반 동적 크기 설정
        this.canvas.width = GameConfig.canvas.width;
        this.canvas.height = GameConfig.canvas.height;

        // CSS 변수 동기화 - 단일 진실의 원천 유지
        this.syncCSSVariables();

        // 스케일 비율은 1:1 고정 (반응형 제거)
        this.displayScale = {
            x: 1,
            y: 1
        };
    }

    // CSS 변수와 GameConfig 동기화 - Configuration-Driven Development
    syncCSSVariables() {
        const root = document.documentElement;

        // Canvas 크기
        root.style.setProperty('--canvas-width', `${GameConfig.canvas.width}px`);
        root.style.setProperty('--canvas-height', `${GameConfig.canvas.height}px`);

        // 뷰포트 스케일링 설정 - JavaScript로 정확한 계산
        if (GameConfig.viewport && GameConfig.viewport.autoScale) {
            this.updateViewportScale();
            root.style.setProperty('--viewport-auto-scale', 'true');
        } else {
            root.style.setProperty('--viewport-auto-scale', 'false');
        }

        // 카드 크기
        root.style.setProperty('--card-preview-width', `${GameConfig.cardSizes.preview.width}px`);
        root.style.setProperty('--card-preview-height', `${GameConfig.cardSizes.preview.height}px`);
        root.style.setProperty('--card-gallery-width', `${GameConfig.cardSizes.gallery.width}px`);
        root.style.setProperty('--card-gallery-height', `${GameConfig.cardSizes.gallery.height}px`);
        root.style.setProperty('--card-large-width', `${GameConfig.cardSizes.large.width}px`);
        root.style.setProperty('--card-large-height', `${GameConfig.cardSizes.large.height}px`);
        root.style.setProperty('--card-hand-width', `${GameConfig.cardSizes.hand.width / 2}px`); // CSS에서 축소
        root.style.setProperty('--card-hand-height', `${GameConfig.cardSizes.hand.height / 2}px`); // CSS에서 축소

        // 메뉴 크기
        if (GameConfig.mainMenu) {
            root.style.setProperty('--menu-button-width', `${GameConfig.mainMenu.menuItems.width}px`);
            root.style.setProperty('--menu-button-height', `${GameConfig.mainMenu.menuItems.height}px`);
            root.style.setProperty('--menu-start-y', `${GameConfig.mainMenu.menuItems.startY}px`);
            root.style.setProperty('--menu-item-height', `${GameConfig.mainMenu.menuItems.itemHeight}px`);
            root.style.setProperty('--menu-icon-size', `${GameConfig.mainMenu.menuItems.iconSize}px`);
            root.style.setProperty('--menu-text-size-normal', `${GameConfig.mainMenu.menuItems.textSize.normal}px`);
            root.style.setProperty('--menu-text-size-selected', `${GameConfig.mainMenu.menuItems.textSize.selected}px`);
            root.style.setProperty('--menu-title-size', `${GameConfig.mainMenu.title.size}px`);
            root.style.setProperty('--menu-title-y', `${GameConfig.mainMenu.title.y}px`);
            root.style.setProperty('--menu-subtitle-size', `${GameConfig.mainMenu.subtitle.size}px`);
        }

        // 언어 선택기 설정
        if (GameConfig.languageSelector) {
            root.style.setProperty('--language-selector-font-size', `${GameConfig.languageSelector.fontSize}px`);
            root.style.setProperty('--language-selector-padding-vertical', `${GameConfig.languageSelector.padding.vertical}px`);
            root.style.setProperty('--language-selector-padding-horizontal', `${GameConfig.languageSelector.padding.horizontal}px`);
            root.style.setProperty('--language-selector-border-radius', `${GameConfig.languageSelector.borderRadius}px`);
        }

        // 표준 입력 크기 (GameConfig에서 정의되지 않은 경우 기본값 유지)
        root.style.setProperty('--input-width', '300px');
        root.style.setProperty('--element-min-width', '60px');

        // 모달 크기 설정 - Configuration-Driven
        if (GameConfig.modals) {
            // 공통 모달 설정
            if (GameConfig.modals.common) {
                root.style.setProperty('--modal-overlay', GameConfig.modals.common.overlay);
                root.style.setProperty('--modal-backdrop-blur', GameConfig.modals.common.backdropBlur);
                root.style.setProperty('--modal-border-radius', `${GameConfig.modals.common.borderRadius}px`);
                root.style.setProperty('--modal-box-shadow', GameConfig.modals.common.boxShadow);
                root.style.setProperty('--modal-padding', `${GameConfig.modals.common.padding}px`);
            }

            // 개별 모달별 크기 설정 (반응형 제거 - 고정 크기만 사용)
            Object.keys(GameConfig.modals).forEach(modalType => {
                if (modalType === 'common') return; // 공통 설정은 건너뛰기

                const modalConfig = GameConfig.modals[modalType];
                const prefix = `--modal-${modalType.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

                root.style.setProperty(`${prefix}-width`, `${modalConfig.width}px`);
                root.style.setProperty(`${prefix}-height`, `${modalConfig.height}px`);
                root.style.setProperty(`${prefix}-padding`, `${modalConfig.padding}px`);

                // cardSelection 모달 그리드 설정
                if (modalType === 'cardSelection' && modalConfig.grid) {
                    const gridConfig = modalConfig.grid;
                    const footerConfig = modalConfig.footer;
                    const textConfig = modalConfig.text;

                    // 텍스트 폰트 크기 CSS 변수 동기화
                    if (textConfig) {
                        root.style.setProperty('--card-selection-title-font-size', `${textConfig.title}px`);
                        root.style.setProperty('--card-selection-instruction-font-size', `${textConfig.instruction}px`);
                    }

                    // 그리드 CSS 변수 동기화
                    root.style.setProperty('--card-selection-grid-max-height', `${gridConfig.maxHeight}px`);
                    root.style.setProperty('--card-selection-grid-padding-top', `${gridConfig.padding.top}px`);
                    root.style.setProperty('--card-selection-grid-padding-bottom', `${gridConfig.padding.bottom}px`);
                    root.style.setProperty('--card-selection-grid-padding-sides', `${gridConfig.padding.sides}px`);
                    root.style.setProperty('--card-selection-grid-gap-row', `${gridConfig.gap.row}px`);
                    root.style.setProperty('--card-selection-grid-gap-column', `${gridConfig.gap.column}px`);

                    // Footer CSS 변수 동기화
                    if (footerConfig) {
                        root.style.setProperty('--card-selection-footer-padding-top', `${footerConfig.padding.top}px`);
                        root.style.setProperty('--card-selection-footer-padding-bottom', `${footerConfig.padding.bottom}px`);
                        root.style.setProperty('--card-selection-footer-padding-sides', `${footerConfig.padding.sides}px`);
                        root.style.setProperty('--card-selection-footer-margin-top', `${footerConfig.marginTop}px`);

                        // Footer 버튼 설정
                        if (footerConfig.button) {
                            root.style.setProperty('--card-selection-button-font-size', `${footerConfig.button.fontSize}px`);
                            root.style.setProperty('--card-selection-button-padding-vertical', `${footerConfig.button.padding.vertical}px`);
                            root.style.setProperty('--card-selection-button-padding-horizontal', `${footerConfig.button.padding.horizontal}px`);
                        }
                    }
                }
            });
        }

        // 스테이지 인디케이터 설정
        if (GameConfig.ui.stageIndicator) {
            const stageConfig = GameConfig.ui.stageIndicator;
            root.style.setProperty('--stage-indicator-top', `${stageConfig.position.top}px`);
            root.style.setProperty('--stage-indicator-font-size', `${stageConfig.size.fontSize}px`);
            root.style.setProperty('--stage-indicator-icon-size', `${stageConfig.size.iconSize}px`);
            root.style.setProperty('--stage-indicator-progress-font-size', `${stageConfig.size.progressFontSize}px`);
            root.style.setProperty('--stage-indicator-padding', `${stageConfig.size.padding}px`);
            root.style.setProperty('--stage-indicator-min-width', `${stageConfig.size.minWidth}px`);
        }

        // 갤러리 버튼 설정
        if (GameConfig.ui.galleryButton) {
            const galleryConfig = GameConfig.ui.galleryButton;
            root.style.setProperty('--gallery-button-bottom', `${galleryConfig.position.bottom}px`);
            root.style.setProperty('--gallery-button-padding-vertical', `${galleryConfig.size.padding.vertical}px`);
            root.style.setProperty('--gallery-button-padding-horizontal', `${galleryConfig.size.padding.horizontal}px`);
            root.style.setProperty('--gallery-button-font-size', `${galleryConfig.size.fontSize}px`);
            root.style.setProperty('--gallery-button-font-weight', `${galleryConfig.size.fontWeight}`);
            root.style.setProperty('--gallery-button-border-radius', `${galleryConfig.size.borderRadius}px`);
            root.style.setProperty('--gallery-button-min-width', `${galleryConfig.size.minWidth}px`);
        }

        // 새로 추가된 색상 시스템
        if (GameConfig.colors) {
            // UI 색상
            if (GameConfig.colors.ui) {
                root.style.setProperty('--color-primary', GameConfig.colors.ui.primary);
                root.style.setProperty('--color-primary-hover', GameConfig.colors.ui.primaryHover);
                root.style.setProperty('--color-secondary', GameConfig.colors.ui.secondary);
                root.style.setProperty('--color-text-primary', GameConfig.colors.ui.text.primary);
                root.style.setProperty('--color-text-secondary', GameConfig.colors.ui.text.secondary);
                root.style.setProperty('--color-text-outline', GameConfig.colors.ui.text.outline);
                root.style.setProperty('--color-text-disabled', GameConfig.colors.ui.text.disabled);
                root.style.setProperty('--color-selected', GameConfig.colors.ui.selection.selected);
                root.style.setProperty('--color-hover', GameConfig.colors.ui.selection.hover);
                root.style.setProperty('--color-border', GameConfig.colors.ui.selection.border);
            }

            // 상태 색상
            if (GameConfig.colors.status) {
                root.style.setProperty('--color-victory', GameConfig.colors.status.victory);
                root.style.setProperty('--color-defeat', GameConfig.colors.status.defeat);
                root.style.setProperty('--color-warning', GameConfig.colors.status.warning);
                root.style.setProperty('--color-info', GameConfig.colors.status.info);
                root.style.setProperty('--color-neutral', GameConfig.colors.status.neutral);
            }

            // 효과 색상
            if (GameConfig.colors.effects) {
                root.style.setProperty('--color-buff', GameConfig.colors.effects.buff);
                root.style.setProperty('--color-debuff', GameConfig.colors.effects.debuff);
                root.style.setProperty('--color-poison', GameConfig.colors.effects.poison);
                root.style.setProperty('--color-burn', GameConfig.colors.effects.burn);
                root.style.setProperty('--color-stun', GameConfig.colors.effects.stun);
            }

            // 오버레이 색상
            if (GameConfig.colors.overlay) {
                root.style.setProperty('--color-modal-overlay', GameConfig.colors.overlay.modal);
                root.style.setProperty('--color-tooltip-overlay', GameConfig.colors.overlay.tooltip);
                root.style.setProperty('--color-glass', GameConfig.colors.overlay.glass);
            }
        }

        // 폰트 시스템
        if (GameConfig.fonts) {
            if (GameConfig.fonts.families) {
                root.style.setProperty('--font-family-main', GameConfig.fonts.families.main);
                root.style.setProperty('--font-family-title', GameConfig.fonts.families.title);
                root.style.setProperty('--font-family-mono', GameConfig.fonts.families.mono);
            }

            if (GameConfig.fonts.sizes) {
                root.style.setProperty('--font-size-small', `${GameConfig.fonts.sizes.small}px`);
                root.style.setProperty('--font-size-medium', `${GameConfig.fonts.sizes.medium}px`);
                root.style.setProperty('--font-size-large', `${GameConfig.fonts.sizes.large}px`);
                root.style.setProperty('--font-size-xlarge', `${GameConfig.fonts.sizes.xlarge}px`);
                root.style.setProperty('--font-size-title', `${GameConfig.fonts.sizes.title}px`);
                root.style.setProperty('--font-size-huge', `${GameConfig.fonts.sizes.huge}px`);
            }

            if (GameConfig.fonts.weights) {
                root.style.setProperty('--font-weight-normal', GameConfig.fonts.weights.normal);
                root.style.setProperty('--font-weight-bold', GameConfig.fonts.weights.bold);
                root.style.setProperty('--font-weight-bolder', GameConfig.fonts.weights.bolder);
            }
        }

        // CSS 변수 확장 설정
        if (GameConfig.cssVariables) {
            if (GameConfig.cssVariables.spacing) {
                root.style.setProperty('--spacing-small', `${GameConfig.cssVariables.spacing.small}px`);
                root.style.setProperty('--spacing-medium', `${GameConfig.cssVariables.spacing.medium}px`);
                root.style.setProperty('--spacing-large', `${GameConfig.cssVariables.spacing.large}px`);
                root.style.setProperty('--spacing-xlarge', `${GameConfig.cssVariables.spacing.xlarge}px`);
            }

            if (GameConfig.cssVariables.borderRadius) {
                root.style.setProperty('--border-radius-small', `${GameConfig.cssVariables.borderRadius.small}px`);
                root.style.setProperty('--border-radius-medium', `${GameConfig.cssVariables.borderRadius.medium}px`);
                root.style.setProperty('--border-radius-large', `${GameConfig.cssVariables.borderRadius.large}px`);
                root.style.setProperty('--border-radius-xlarge', `${GameConfig.cssVariables.borderRadius.xlarge}px`);
            }

            if (GameConfig.cssVariables.shadows) {
                root.style.setProperty('--shadow-small', GameConfig.cssVariables.shadows.small);
                root.style.setProperty('--shadow-medium', GameConfig.cssVariables.shadows.medium);
                root.style.setProperty('--shadow-large', GameConfig.cssVariables.shadows.large);
                root.style.setProperty('--shadow-glow', GameConfig.cssVariables.shadows.glow);
            }

            if (GameConfig.cssVariables.blur) {
                root.style.setProperty('--blur-small', `${GameConfig.cssVariables.blur.small}px`);
                root.style.setProperty('--blur-medium', `${GameConfig.cssVariables.blur.medium}px`);
                root.style.setProperty('--blur-large', `${GameConfig.cssVariables.blur.large}px`);
            }

            if (GameConfig.cssVariables.cardGrid) {
                root.style.setProperty('--card-grid-gap', `${GameConfig.cssVariables.cardGrid.gap}px`);
                root.style.setProperty('--card-grid-columns', GameConfig.cssVariables.cardGrid.columns);
                root.style.setProperty('--card-grid-padding', GameConfig.cssVariables.cardGrid.padding);
            }
        }

        // 애니메이션 타이밍 설정
        if (GameConfig.timing) {
            if (GameConfig.timing.ui) {
                root.style.setProperty('--timing-fade-in', `${GameConfig.timing.ui.fadeIn}ms`);
                root.style.setProperty('--timing-fade-out', `${GameConfig.timing.ui.fadeOut}ms`);
                root.style.setProperty('--timing-transition', `${GameConfig.timing.ui.transition}ms`);
                root.style.setProperty('--timing-hover', `${GameConfig.timing.ui.hover}ms`);
            }

            if (GameConfig.timing.combat) {
                root.style.setProperty('--timing-damage', `${GameConfig.timing.combat.damage}ms`);
                root.style.setProperty('--timing-heal', `${GameConfig.timing.combat.heal}ms`);
                root.style.setProperty('--timing-status-change', `${GameConfig.timing.combat.statusChange}ms`);
            }
        }

        // 메시지 타입별 색상 동기화 (플로팅 숫자용) - Configuration-Driven
        if (GameConfig.masterColors && GameConfig.masterColors.messageTypes) {
            const messageTypes = GameConfig.masterColors.messageTypes;
            Object.keys(messageTypes).forEach(type => {
                const color = messageTypes[type];
                root.style.setProperty(`--color-message-${type}`, color);
            });
        }

        // z-index 레이어 동기화 - Configuration-Driven (하드코딩 방지)
        if (GameConfig.zIndexLayers) {
            Object.keys(GameConfig.zIndexLayers).forEach(layer => {
                // camelCase를 kebab-case로 변환 (volumeButton → volume-button)
                const kebabCase = layer.replace(/([A-Z])/g, '-$1').toLowerCase();
                root.style.setProperty(`--z-${kebabCase}`, GameConfig.zIndexLayers[layer]);
            });
        }

    }

    // 뷰포트 스케일링 계산 및 적용
    updateViewportScale() {
        if (!GameConfig.viewport || !GameConfig.viewport.autoScale) return;

        const root = document.documentElement;

        // 실제 뷰포트 크기 (레티나 디스플레이 고려)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 스케일 비율 계산
        const scaleX = viewportWidth / GameConfig.canvas.width;
        const scaleY = viewportHeight / GameConfig.canvas.height;

        // 화면에 맞는 최적 스케일 (종횡비 유지)
        let optimalScale = Math.min(scaleX, scaleY);

        // 설정된 최소/최대 스케일 제한 적용
        optimalScale = Math.max(GameConfig.viewport.minScale, optimalScale);
        optimalScale = Math.min(GameConfig.viewport.maxScale, optimalScale);

        // CSS 변수로 설정
        root.style.setProperty('--viewport-scale', optimalScale);
    }

    // 윈도우 리사이즈 핸들러
    handleResize() {
        // 디바운스로 성능 최적화
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            this.updateViewportScale();
        }, 100);
    }

    // 게임 속도 설정
    setGameSpeed(speed) {
        this.gameSpeed = speed;

        // localStorage에 저장
        localStorage.setItem('cardBattle_gameSpeed', speed.toString());

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
            attackCardUsage: 0,        // 공격 카드 사용 횟수
            defenseCardUsage: 0,       // 방어 카드 사용 횟수
            isGameComplete: false,     // 게임 완료 플래그 (마지막 스테이지 클리어)
            cardUsageStats: new Map(),
            elementUsageStats: new Map(),
            deathCause: null,
            // 대미지 타입별 통계
            damageByType: {
                normal: 0,
                burn: 0,
                poison: 0,
                self: 0,
                reflect: 0,
                thorns: 0
            }
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
        const { totalDamageDealt, totalDefenseBuilt, missCount, totalTurns } = this.gameStats;

        // 안전한 비율 계산 (0으로 나누기 방지)
        const missRate = totalTurns > 0 ? missCount / totalTurns : 0;
        const defenseRatio = totalDamageDealt > 0 ? totalDefenseBuilt / totalDamageDealt : 0;

        // 우선순위: Unlucky → Defensive → Aggressive → Balanced

        if (missRate >= 0.1) {
            // 🎲 불운한: 10% 이상 빗나감 (기존 20% → 10%)
            this.gameStats.playStyle = 'unlucky';
        } else if (defenseRatio >= 0.8) {
            // 🛡️ 방어적: 방어력이 딜의 80% 이상 (기존 150% → 80%)
            this.gameStats.playStyle = 'defensive';
        } else if (defenseRatio < 0.3 && totalDamageDealt > totalDefenseBuilt * 2) {
            // ⚔️ 공격적: 방어가 딜의 30% 미만 AND 딜이 방어의 2배 이상
            //           (크리티컬 대신 방어/공격 비율 사용)
            this.gameStats.playStyle = 'aggressive';
        } else {
            // ⚖️ 균형잡힌: 나머지 모든 경우 (기본값)
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
            finalHand: [],

            // 대미지 타입별 통계
            damageByType: {
                normal: 0,
                burn: 0,
                poison: 0,
                self: 0,
                reflect: 0,
                thorns: 0
            }
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

    // 사망 원인 설정 (중복 제거 - legacy 메서드 삭제)
    // setDeathCause는 위에 최신 버전이 있음

    // 최종 손패 저장 (중복 제거 - legacy 메서드 삭제)
    // finalizeGameStats는 위에 최신 버전이 있음

    // 최종 손패 저장 (legacy 메서드)
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

    // 최종 통계 계산 (legacy 메서드 - 패배 시 호출)
    finalizeGameStatsLegacy() {
        if (!this.gameStats) return;

        this.saveFinalHand();
        this.findUnusedCards();

        // 게임 시간 계산
        this.gameStats.gameDuration = Date.now() - this.gameStats.gameStartTime;
    }

    // 중앙 대미지 기록 시스템 (확장성과 정확성을 위한 통합 메서드)
    recordDamage(source, target, amount, damageType = 'normal') {
        if (!this.gameStats || typeof amount !== 'number' || amount < 0) {
            return;
        }

        // 플레이어가 받은 모든 대미지 기록 (방어력으로 막힌 것도 포함)
        if (target === 'player') {
            this.gameStats.totalDamageReceived += amount;

            // 대미지 타입별 세부 통계 (안전한 접근)
            if (this.gameStats.damageByType && this.gameStats.damageByType[damageType] !== undefined) {
                this.gameStats.damageByType[damageType] += amount;
            } else {
                console.warn(`Unknown damage type: ${damageType} or damageByType not initialized`);
            }
        }

        // 플레이어가 적에게 가한 대미지
        if (source === 'player' && target === 'enemy') {
            this.gameStats.totalDamageDealt += amount;
        }
    }

    // 회복 기록 시스템 (향후 확장용)
    recordHealing(target, amount, healType = 'normal') {
        if (!this.gameStats || typeof amount !== 'number' || amount < 0) return;

        if (target === 'player') {
            this.gameStats.totalHealing = (this.gameStats.totalHealing || 0) + amount;
        }
    }

    // 방어력 기록 시스템 (기존 메서드 보완)
    recordDefense(amount, wasted = false) {
        if (!this.gameStats || typeof amount !== 'number' || amount < 0) return;

        this.gameStats.totalDefenseBuilt += amount;
        if (wasted) {
            this.gameStats.wastedDefense += amount;
        }
    }
}

// 전역 객체로 등록
window.GameManager = GameManager;