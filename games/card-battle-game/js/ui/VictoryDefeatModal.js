// ★ WeakMap을 사용한 Private Storage (치트 방지)
const _rerollsRemaining = new WeakMap();

/**
 * 승리/패배 모달 관리 클래스
 */
class VictoryDefeatModal {
    constructor(gameManager) {
        this.gameManager = gameManager;
        // 승리 모달 요소들
        this.victoryModal = document.getElementById('victory-modal');
        this.victoryStageSpan = document.getElementById('victory-stage-number');
        this.victoryContinueBtn = document.getElementById('victory-continue');

        // 카드 보상 관련 요소들
        this.victoryCardRewards = document.getElementById('victory-card-rewards');
        this.victoryHandReplace = document.getElementById('victory-hand-replace');
        this.handCardsForReplace = document.getElementById('hand-cards-for-replace');
        this.cancelReplaceBtn = document.getElementById('cancel-replace-btn');

        // 버튼 그룹들
        this.victoryDefaultButtons = document.getElementById('victory-default-buttons');
        this.victoryViewHandRow = document.getElementById('victory-view-hand-row');
        this.victorySelectionButtons = document.getElementById('victory-selection-buttons');
        this.victorySkipBtn = document.getElementById('victory-skip');
        this.victoryRerollBtn = document.getElementById('victory-reroll');
        this.victoryViewHandBtn = document.getElementById('victory-view-hand');
        this.victoryAddToDeckBtn = document.getElementById('victory-add-to-deck');
        this.victoryReplaceCardBtn = document.getElementById('victory-replace-card');
        this.victoryCancelSelectionBtn = document.getElementById('victory-cancel-selection');
        this.victoryHandConfirmationButtons = document.getElementById('victory-hand-confirmation-buttons');
        this.victoryConfirmReplacementBtn = document.getElementById('victory-confirm-replacement');
        this.victoryCancelHandSelectionBtn = document.getElementById('victory-cancel-hand-selection');

        // 패배 모달 요소들
        this.defeatModal = document.getElementById('defeat-modal');
        this.defeatPlayerName = document.getElementById('defeat-player-name');
        this.defeatFinalStage = document.getElementById('defeat-final-stage');
        this.defeatTotalTurns = document.getElementById('defeat-total-turns');
        this.defeatDamageDealt = document.getElementById('defeat-damage-dealt');
        this.defeatDamageReceived = document.getElementById('defeat-damage-received');
        this.defeatDefenseBuilt = document.getElementById('defeat-defense-built');
        this.defeatCriticalCount = document.getElementById('defeat-critical-count');
        this.defeatPlayStyle = document.getElementById('defeat-play-style');
        this.defeatMvpCard = document.getElementById('defeat-mvp-card');
        this.defeatRestartBtn = document.getElementById('defeat-restart');
        this.defeatMainMenuBtn = document.getElementById('defeat-main-menu');

        // 상태 변수들
        this.onVictoryContinue = null;
        this.onDefeatRestart = null;
        this.onDefeatMainMenu = null;
        this.rewardCards = [];
        this.selectedRewardCard = null;
        this.selectedHandCardIndex = null;
        this.isShowingCardRewards = false;

        // ★ rerollsRemaining을 WeakMap으로 보호 (치트 방지)
        _rerollsRemaining.set(this, 0);

        this.viewOnlyMode = false; // 손패 확인 전용 모드 플래그

        // Canvas 요소들
        this.rewardCanvases = [];
        this.selectedCardCanvas = null;

        // CardRenderer 인스턴스
        this.cardRenderer = new CardRenderer();

        // DOMCardRenderer 인스턴스 (확대 카드용)
        this.domCardRenderer = new DOMCardRenderer();

        // ★ DOM 이벤트 보호: 주기적 검증 타이머 (치트 방지)
        this.integrityTimer = null;

        // 공유 버튼 요소들
        this.victoryShareBtn = document.getElementById('victory-share');
        this.victoryShareRow = document.getElementById('victory-share-row');
        this.defeatShareBtn = document.getElementById('defeat-share');

        // ShareSystem 인스턴스
        this.shareSystem = new ShareSystem(gameManager);

        // ShareImageGenerator 초기화 (CardRenderer와 I18n 전달)
        if (gameManager?.cardRenderer && window.i18nSystem) {
            this.shareSystem.setImageGenerator(gameManager.cardRenderer, window.i18nSystem);
            console.log('[VictoryDefeatModal] ShareImageGenerator 초기화 시도');
        } else {
            console.warn('[VictoryDefeatModal] CardRenderer 또는 i18nSystem이 없어 ShareImageGenerator를 초기화할 수 없습니다.');
        }

        // 공유 데이터 저장 (승리/패배 시 사용)
        this.currentShareData = null;

        // 게임 데이터 저장 (공유 기능용)
        this.currentStage = null;
        this.gameStats = null;

        this.initializeEventListeners();
        this.setupDOMIntegrityCheck();
    }

    // ★ rerollsRemaining Getter/Setter (WeakMap 접근 제어)
    getRerollsRemaining() {
        return _rerollsRemaining.get(this) || 0;
    }

    setRerollsRemaining(value) {
        // 유효성 검증 (음수 방지, 최대값 제한)
        const maxRerolls = GameConfig?.constants?.rewards?.maxRerollsPerVictory || 1;
        const validatedValue = Math.max(0, Math.min(value, maxRerolls));
        _rerollsRemaining.set(this, validatedValue);
    }

    decrementRerolls() {
        const current = this.getRerollsRemaining();
        if (current > 0) {
            _rerollsRemaining.set(this, current - 1);
        }
    }

    initializeEventListeners() {
        // 승리 모달 이벤트
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleVictoryContinue();
            });
        }

        // 카드 보상 관련 이벤트
        if (this.victorySkipBtn) {
            this.victorySkipBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleSkipReward();
            });
        }

        if (this.victoryRerollBtn) {
            this.victoryRerollBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleReroll();
            });
        }

        if (this.victoryViewHandBtn) {
            this.victoryViewHandBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleViewHand();
            });
        }

        if (this.victoryAddToDeckBtn) {
            this.victoryAddToDeckBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleAddToDeck();
            });
        }

        if (this.victoryReplaceCardBtn) {
            this.victoryReplaceCardBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleReplaceCard();
            });
        }

        if (this.victoryCancelSelectionBtn) {
            this.victoryCancelSelectionBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleCancelSelection();
            });
        }

        if (this.cancelReplaceBtn) {
            this.cancelReplaceBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleCancelReplace();
            });
        }

        if (this.victoryConfirmReplacementBtn) {
            this.victoryConfirmReplacementBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleConfirmReplacement();
            });
        }

        if (this.victoryCancelHandSelectionBtn) {
            this.victoryCancelHandSelectionBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleCancelHandSelection();
            });
        }

        // 패배 모달 이벤트
        if (this.defeatRestartBtn) {
            this.defeatRestartBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleDefeatRestart();
            });
        }

        if (this.defeatMainMenuBtn) {
            this.defeatMainMenuBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleDefeatMainMenu();
            });
        }

        // 공유 버튼 이벤트
        if (this.victoryShareBtn) {
            this.victoryShareBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleVictoryShare();
            });
        }

        if (this.defeatShareBtn) {
            this.defeatShareBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleDefeatShare();
            });
        }

        // 모달 외부 클릭 방지
        [this.victoryModal, this.defeatModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        e.stopPropagation();
                    }
                });
            }
        });

        // ESC 키로 모달 닫기 (비활성화)
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape') {
        //         this.hideAll();
        //     }
        // });
    }

    /**
     * 승리 공유 처리 (랜딩 페이지 방식)
     */
    async handleVictoryShare() {
        const stage = this.currentStage || this.gameManager?.currentStage || 1;
        const cards = this.gameManager?.player?.hand || [];
        const element = this.gameManager?.player?.defenseElement || 'normal';

        // 랜딩 페이지 공유 데이터 생성
        const shareData = {
            type: 'victory',
            stage: stage,
            cards: cards,
            element: element
        };

        await this.shareSystem.shareWithLandingPage(shareData);
    }

    /**
     * 패배 공유 처리 (랜딩 페이지 방식)
     */
    async handleDefeatShare() {
        const stage = this.gameStats?.finalStage || 1;
        const stats = {
            totalDamageDealt: this.gameStats?.totalDamageDealt || 0,
            totalTurns: this.gameStats?.totalTurns || 0,
            playStyle: this.gameStats?.playStyle || 'balanced',
            isGameComplete: this.gameStats?.isGameComplete || false
        };
        const cards = this.gameManager?.player?.hand || [];
        const element = this.gameManager?.player?.defenseElement || 'normal';

        // 공유 타입 결정 (완료 vs 패배)
        const type = stats.isGameComplete ? 'complete' : 'defeat';

        // 랜딩 페이지 공유 데이터 생성
        const shareData = {
            type: type,
            stage: stage,
            cards: cards,
            element: element,
            stats: stats
        };

        await this.shareSystem.shareWithLandingPage(shareData);
    }

    /**
     * 승리 모달 표시
     * @param {number} stage - 클리어한 스테이지 번호
     * @param {Function} callback - 계속하기 버튼 클릭 시 호출할 콜백
     * @param {Array} rewardCards - 보상 카드 배열 (선택사항)
     */
    showVictory(stage, callback, rewardCards = null) {

        // 상태이상 효과 제거
        this.clearStatusEffects();

        // 상태 초기화 먼저
        this.resetVictoryState();

        // Re-roll 횟수 초기화 (Configuration-Driven) - WeakMap 사용
        this.setRerollsRemaining(GameConfig?.constants?.rewards?.maxRerollsPerVictory || 1);

        // 콜백 설정 (resetVictoryState 이후에!)
        this.onVictoryContinue = callback;

        // 스테이지 번호 저장 (공유 기능용)
        this.currentStage = stage || 1;

        // 스테이지 번호 표시
        if (this.victoryStageSpan) {
            this.victoryStageSpan.textContent = this.currentStage;
        }

        // 카드 보상이 있는 경우
        if (rewardCards && rewardCards.length > 0) {
            this.setupCardRewards(rewardCards);
        } else {
            // 보상이 없는 경우 바로 계속하기 버튼 활성화
            this.showContinueButton();
        }

        // 승리 모달 사운드 재생
        const victorySfxKey = GameConfig?.audio?.battleSounds?.modalSounds?.victory;
        if (victorySfxKey && this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(victorySfxKey);
        }

        // 모달 표시
        if (this.victoryModal) {
            this.victoryModal.classList.remove('hidden');
        }
    }

    /**
     * 패배 모달 표시
     * @param {Object} gameStats - 게임 통계 데이터
     * @param {Function} restartCallback - 다시 도전하기 버튼 클릭 시 호출할 콜백
     * @param {Function} mainMenuCallback - 메인 메뉴로 버튼 클릭 시 호출할 콜백
     */
    async showDefeat(gameStats, restartCallback, mainMenuCallback) {
        // 상태이상 효과 제거
        this.clearStatusEffects();

        // 게임 통계 저장 (공유 기능용)
        this.gameStats = gameStats;

        this.onDefeatRestart = restartCallback;
        this.onDefeatMainMenu = mainMenuCallback;

        // 플레이어 정보 설정
        this.populatePlayerInfo(gameStats);

        // 통계 정보 설정
        this.populateGameStats(gameStats);

        // 게임 완료 여부에 따라 제목 동적 변경
        const titleElement = this.defeatModal?.querySelector('h2[data-i18n]');
        if (titleElement) {
            if (gameStats?.isGameComplete) {
                // 🎉 게임 클리어 모드
                const titleKey = 'auto_battle_card_game.ui.game_complete_title';
                titleElement.textContent = I18nHelper.getText(titleKey) || '🎉 게임 클리어!';
            } else {
                // 일반 패배 모드
                const titleKey = 'auto_battle_card_game.ui.defeat_title';
                titleElement.textContent = I18nHelper.getText(titleKey) || '게임 오버';
            }
        }

        // 사운드 재생 (게임 완료 시 이미 GameManager에서 승리 BGM 재생했으므로 스킵)
        if (!gameStats?.isGameComplete) {
            const gameOverSfxKey = GameConfig?.audio?.battleSounds?.modalSounds?.gameOver;
            if (gameOverSfxKey && this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(gameOverSfxKey);
            }
        } else {
            // 게임 클리어 시 승리 효과음 재생
            const victorySfxKey = GameConfig?.audio?.battleSounds?.modalSounds?.victory;
            if (victorySfxKey && this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(victorySfxKey);
            }
        }

        // ✅ 모달을 먼저 표시 (UX 개선: 빈 화면 제거)
        if (this.defeatModal) {
            this.defeatModal.classList.remove('hidden');
        }

        // 🏆 리더보드 자동 등록 및 순위 조회 (백그라운드에서 non-blocking 실행)
        // "계산 중..." 초기 상태는 populateGameStats()에서 이미 설정됨 (line 491)
        this.submitToLeaderboard(gameStats).catch(error => {
            console.error('[VictoryDefeatModal] Background leaderboard submit failed:', error);
            // 에러 시 순위 표시를 "-"로 설정 (submitToLeaderboard 내부에서 처리됨)
        });
    }

    /**
     * 플레이어 정보 설정
     * @param {Object} gameStats - 게임 통계 데이터
     */
    populatePlayerInfo(gameStats) {
        if (!gameStats) return;

        // 플레이어 이름 (GameManager에서 player 객체 참조)
        if (this.defeatPlayerName && this.gameManager && this.gameManager.player) {
            this.defeatPlayerName.textContent = this.gameManager.player.name ||
                I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
        }

        // 도달 스테이지
        if (this.defeatFinalStage) {
            this.defeatFinalStage.textContent = gameStats.finalStage || 1;
        }
    }

    /**
     * 게임 통계 정보 설정
     * @param {Object} gameStats - 게임 통계 데이터
     */
    populateGameStats(gameStats) {
        if (!gameStats) return;

        // 기본 통계
        if (this.defeatTotalTurns) {
            this.defeatTotalTurns.textContent = gameStats.totalTurns || 0;
        }

        if (this.defeatDamageDealt) {
            this.defeatDamageDealt.textContent = gameStats.totalDamageDealt || 0;
        }

        if (this.defeatDamageReceived) {
            this.defeatDamageReceived.textContent = gameStats.totalDamageReceived || 0;
        }

        if (this.defeatDefenseBuilt) {
            this.defeatDefenseBuilt.textContent = gameStats.totalDefenseBuilt || 0;
        }

        if (this.defeatCriticalCount) {
            this.defeatCriticalCount.textContent = gameStats.statusDamage || 0;
        }

        // 전세계 순위 표시 (플레이 스타일 대신)
        if (this.defeatPlayStyle) {
            // 초기 로딩 상태 표시
            this.defeatPlayStyle.textContent = I18nHelper.getText('leaderboard.calculating') || 'Calculating...';
            // 실제 순위는 submitToLeaderboard()에서 업데이트됨
        }

        // 최종 손패 (MVP 카드 대신)
        if (this.defeatMvpCard) {
            // GameManager에서 플레이어 손패 가져오기
            const finalHand = this.gameManager?.player?.hand || [];
            if (finalHand.length > 0) {
                this.renderFinalHand(finalHand);
            } else {
                this.defeatMvpCard.classList.remove('final-hand-grid');
                this.showMvpCardText(I18nHelper.getText('auto_battle_card_game.ui.no_cards') || '-');
            }
        }
    }

    /**
     * 플레이 스타일 기본 텍스트 반환
     * @param {string} playStyle - 플레이 스타일 키
     * @returns {string} 번역된 텍스트
     */
    getDefaultPlayStyleText(playStyle) {
        const styleTexts = {
            'defensive': '수비적',
            'aggressive': '공격적',
            'balanced': '균형잡힌',
            'unlucky': '불운한'
        };
        return styleTexts[playStyle] || '균형잡힌';
    }

    /**
     * MVP 카드를 Canvas로 렌더링
     * @param {Object} cardData - 카드 데이터
     */
    renderMvpCard(cardData) {
        // 기존 컨텐츠 제거
        this.defeatMvpCard.innerHTML = '';

        // Canvas 생성
        const canvas = document.createElement('canvas');
        const cardSize = GameConfig.cardSizes.victoryDetail; // 확대된 카드 크기 사용
        canvas.width = cardSize.width;
        canvas.height = cardSize.height;

        const ctx = canvas.getContext('2d');

        // CardRenderer로 카드 렌더링
        this.cardRenderer.renderCard(ctx, cardData, 0, 0, cardSize.width, cardSize.height, {
            isSelected: true,
            isHighlighted: false,
            opacity: 1
        });

        this.defeatMvpCard.appendChild(canvas);
    }

    /**
     * MVP 카드를 텍스트로 표시 (카드 데이터가 없는 경우)
     * @param {string} text - 표시할 텍스트
     */
    showMvpCardText(text) {
        this.defeatMvpCard.innerHTML = `<p style="margin: 0; font-size: 18px; font-weight: bold; text-align: center; color: var(--glass-text-primary);">${text}</p>`;
    }

    /**
     * 최종 손패를 동적 2행 레이아웃으로 렌더링
     * 5장 이하: 1행 가운데 정렬
     * 6장 이상: 1행 (총장수-5)장, 2행 5장, 각 행 가운데 정렬
     * @param {Array} handCards - 최종 손패 카드 배열
     */
    renderFinalHand(handCards) {
        // 기존 컨텐츠 제거
        this.defeatMvpCard.innerHTML = '';

        // 그리드 레이아웃 클래스 추가
        this.defeatMvpCard.classList.add('final-hand-grid');

        // 손패가 없는 경우
        if (!handCards || handCards.length === 0) {
            this.defeatMvpCard.classList.remove('final-hand-grid');
            this.showMvpCardText(I18nHelper.getText('auto_battle_card_game.ui.no_cards') || '-');
            return;
        }

        // Configuration-Driven: 패배 모달 손패 카드 크기
        const cardSize = GameConfig?.cardSizes?.defeatHand || { width: 120, height: 168 };

        const totalCards = handCards.length;

        // 5장 이하: 1행에만 표시
        if (totalCards <= 5) {
            const row1 = document.createElement('div');
            row1.className = 'final-hand-row';

            handCards.forEach((card, index) => {
                if (card) {
                    const cardContainer = this.createCardElement(card, cardSize);
                    row1.appendChild(cardContainer);
                }
            });

            this.defeatMvpCard.appendChild(row1);
        }
        // 6장 이상: 1행 (총장수-5)장, 2행 5장
        else {
            const firstRowCount = totalCards - 5;

            // 1행 생성
            const row1 = document.createElement('div');
            row1.className = 'final-hand-row';

            for (let i = 0; i < firstRowCount; i++) {
                const card = handCards[i];
                if (card) {
                    const cardContainer = this.createCardElement(card, cardSize);
                    row1.appendChild(cardContainer);
                }
            }

            // 2행 생성
            const row2 = document.createElement('div');
            row2.className = 'final-hand-row';

            for (let i = firstRowCount; i < totalCards; i++) {
                const card = handCards[i];
                if (card) {
                    const cardContainer = this.createCardElement(card, cardSize);
                    row2.appendChild(cardContainer);
                }
            }

            this.defeatMvpCard.appendChild(row1);
            this.defeatMvpCard.appendChild(row2);
        }

        // 최종 손패 아래에 플레이어 방어속성 배지 표시
        const defenseElement = this.gameManager?.player?.defenseElement || 'normal';
        const defenseBadge = this.createDefenseElementBadge(defenseElement);
        defenseBadge.style.marginTop = '12px';
        this.defeatMvpCard.appendChild(defenseBadge);
    }

    /**
     * 카드 Canvas 요소 생성
     * @param {Object} card - 카드 데이터
     * @param {Object} cardSize - 카드 크기 {width, height}
     * @returns {HTMLElement} Canvas 요소
     */
    createCardElement(card, cardSize) {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        canvas.width = cardSize.width;
        canvas.height = cardSize.height;
        canvas.className = 'final-hand-card-container';

        const ctx = canvas.getContext('2d');

        // CardRenderer로 카드 렌더링
        this.cardRenderer.renderCard(ctx, card, 0, 0, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            opacity: 1
        });

        return canvas;
    }

    /**
     * 방어속성 배지 생성 (인게임 스타일)
     * @param {string} element - 카드 속성
     * @returns {HTMLElement} 배지 요소
     */
    createDefenseElementBadge(element) {
        const badge = document.createElement('div');
        badge.className = `defense-element-badge ${element || 'normal'}`;
        // CSS 클래스 스타일을 유지하면서 크기만 조정 (배경색, 테두리 색상은 CSS에서)
        badge.style.setProperty('min-width', 'auto', 'important');
        badge.style.setProperty('height', '50px', 'important');
        badge.style.setProperty('padding', '6px 8px', 'important');  // 상하 6px, 좌우 8px
        badge.style.setProperty('gap', '4px', 'important');
        badge.style.setProperty('margin', '0', 'important');

        // 속성 정보 가져오기 (이모지 + 다국어 텍스트)
        const elementConfig = GameConfig?.elements?.[element];
        const emoji = elementConfig?.emoji || '⭐';

        // 현재 언어로 번역된 속성 텍스트 가져오기
        let elementText = element; // 기본값 (fallback)
        if (elementConfig && elementConfig.elementNames) {
            const currentLang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';
            elementText = elementConfig.elementNames[currentLang] || elementConfig.elementNames['ko'] || element;
        }

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'badge-emoji';
        emojiSpan.textContent = emoji;
        emojiSpan.style.fontSize = '22px';

        const textSpan = document.createElement('span');
        textSpan.className = 'badge-text';
        textSpan.textContent = elementText;
        textSpan.style.fontSize = '15px';

        badge.appendChild(emojiSpan);
        badge.appendChild(textSpan);

        return badge;
    }

    /**
     * 승리 계속하기 버튼 처리
     */
    handleVictoryContinue() {

        // 콜백을 임시 저장 (hideVictory에서 null이 되기 전에)
        const callback = this.onVictoryContinue;

        this.hideVictory();

        if (callback && typeof callback === 'function') {
            callback();
        } else {
            console.error('❌ onVictoryContinue 콜백이 없거나 함수가 아님');
        }
    }

    /**
     * 패배 다시 도전하기 버튼 처리
     */
    handleDefeatRestart() {
        const callback = this.onDefeatRestart;
        this.hideDefeat();
        if (callback && typeof callback === 'function') {
            callback();
        }
    }

    /**
     * 패배 메인 메뉴로 버튼 처리
     */
    handleDefeatMainMenu() {
        const callback = this.onDefeatMainMenu;
        this.hideDefeat();
        if (callback && typeof callback === 'function') {
            callback();
        }
    }

    /**
     * 승리 모달 숨김
     */
    hideVictory() {
        if (this.victoryModal) {
            this.victoryModal.classList.add('hidden');
        }
        this.onVictoryContinue = null;

        // ★ DOM 무결성 검사 타이머 정리 (메모리 누수 방지)
        this.cleanupDOMIntegrityCheck();
    }

    /**
     * 패배 모달 숨김
     */
    hideDefeat() {
        if (this.defeatModal) {
            this.defeatModal.classList.add('hidden');
        }
        this.onDefeatRestart = null;
        this.onDefeatMainMenu = null;

        // ★ DOM 무결성 검사 타이머 정리 (메모리 누수 방지)
        this.cleanupDOMIntegrityCheck();
    }

    /**
     * 모든 모달 숨김
     */
    hideAll() {
        this.hideVictory();
        this.hideDefeat();
    }

    /**
     * 승리 상태 초기화
     */
    resetVictoryState() {
        this.rewardCards = [];
        this.selectedRewardCard = null;
        this.selectedHandCardIndex = null;
        this.isShowingCardRewards = false;
        this.tempSelectedCard = null; // 임시 저장 변수 초기화
        this.setRerollsRemaining(0); // Re-roll 횟수 초기화 (WeakMap 사용)
        this.viewOnlyMode = false; // 손패 확인 모드 초기화

        // UI 요소 숨기기
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.add('hidden');
        }
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.add('hidden');
        }
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.remove('hidden');
        }
        if (this.victoryViewHandRow) {
            this.victoryViewHandRow.classList.remove('hidden');
        }
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.classList.add('hidden');
        }
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.add('hidden');
        }
        // 공유 버튼 숨김 (초기 상태)
        if (this.victoryShareRow) {
            this.victoryShareRow.classList.add('hidden');
        }

        // 모든 카드 선택 상태 초기화
        this.updateCardSelection(-1);

        // 선택된 카드 상세 정보 숨김
        this.hideSelectedCardDetail();
        this.hideSelectedHandCardDetail();
    }

    /**
     * 카드 보상 설정
     * @param {Array} rewardCards - 보상 카드 배열
     */
    setupCardRewards(rewardCards) {
        this.rewardCards = rewardCards;
        this.isShowingCardRewards = true;

        // 카드 보상 영역 표시
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.remove('hidden');
        }

        // 공유 버튼 표시 (보상 카드 선택 화면)
        if (this.victoryShareRow) {
            this.victoryShareRow.classList.remove('hidden');
        }

        // 보상 카드들 렌더링
        this.renderRewardCards();
    }

    /**
     * 보상 카드들 렌더링
     */
    renderRewardCards() {
        // Configuration-Driven: 동적 카드 갯수 처리
        const rewardCount = GameConfig?.constants?.rewards?.rewardCardCount || 4;

        for (let i = 0; i < rewardCount; i++) {
            const rewardCardContainer = document.querySelector(`[data-card-index="${i}"]`);

            if (rewardCardContainer) {
                if (i < this.rewardCards.length) {
                    const card = this.rewardCards[i];

                    // 기존 컨텐츠 제거
                    rewardCardContainer.innerHTML = '';

                    // Canvas 생성
                    const canvas = document.createElement('canvas');
                    const cardSize = GameConfig.cardSizes.victory; // 승리 모달 보상 카드 크기 사용
                    canvas.width = cardSize.width;
                    canvas.height = cardSize.height;
                    canvas.style.cursor = 'pointer';
                    canvas.style.borderRadius = '8px';

                    const ctx = canvas.getContext('2d');

                    // CardRenderer로 카드 렌더링
                    this.cardRenderer.renderCard(ctx, card, 0, 0, cardSize.width, cardSize.height, {
                        isSelected: false,
                        isHighlighted: false,
                        opacity: 1
                    });

                    rewardCardContainer.appendChild(canvas);
                    this.rewardCanvases[i] = canvas;

                    // 카드 클릭 이벤트
                    rewardCardContainer.onclick = () => this.selectRewardCard(i);
                    rewardCardContainer.style.cursor = 'pointer';
                    rewardCardContainer.style.display = 'flex';
                } else {
                    rewardCardContainer.style.display = 'none';
                }
            }
        }

        // Re-roll 버튼 상태 업데이트
        this.updateRerollButton();
    }

    /**
     * 선택된 카드 확대 표시 (DOM 방식 - 인라인 라벨 클릭 가능)
     * @param {Object} card - 표시할 카드 데이터
     */
    showSelectedCardDetail(card) {
        const detailContainer = document.getElementById('selected-card-detail');
        if (!detailContainer || !card) return;

        // 기존 컨텐츠 제거
        detailContainer.innerHTML = '';

        // DOMCardRenderer로 카드 생성 (Canvas 대신 DOM 방식)
        const cardSize = GameConfig.cardSizes.victoryDetail; // 승리 모달 확대 카드 크기 사용
        const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: true,
            isHighlighted: false,
            opacity: 1,
            context: 'default'
        });

        // 카드 스타일 추가
        cardElement.style.borderRadius = '12px';
        cardElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';

        detailContainer.appendChild(cardElement);

        // 컨테이너 표시
        detailContainer.classList.remove('hidden');

        // 스크롤 위치 리셋 및 비활성화
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            contentArea.scrollTop = 0;
            contentArea.classList.add('card-enlarged');
        }
    }

    /**
     * 보상 카드 선택
     * @param {number} cardIndex - 선택된 카드 인덱스
     */
    selectRewardCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.rewardCards.length) {
            // 카드 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.rewardCardClick || 'cardClick');
            }

            this.selectedRewardCard = this.rewardCards[cardIndex];

            // 보상 카드 3개 숨기기
            if (this.victoryCardRewards) {
                this.victoryCardRewards.classList.add('hidden');
            }

            // 공유 버튼 숨김 (확대 화면)
            if (this.victoryShareRow) {
                this.victoryShareRow.classList.add('hidden');
            }

            // 선택된 카드 확대 표시
            this.showSelectedCardDetail(this.selectedRewardCard);

            // 선택 버튼들 표시
            this.showSelectionButtons();
        }
    }

    /**
     * 카드 선택 UI 업데이트
     * @param {number} selectedIndex - 선택된 카드 인덱스
     */
    updateCardSelection(selectedIndex) {
        // Configuration-Driven: 동적 카드 갯수 처리
        const rewardCount = GameConfig?.constants?.rewards?.rewardCardCount || 4;

        for (let i = 0; i < rewardCount; i++) {
            const rewardCardContainer = document.querySelector(`[data-card-index="${i}"]`);
            if (rewardCardContainer) {
                if (i === selectedIndex) {
                    rewardCardContainer.classList.add('selected');
                } else {
                    rewardCardContainer.classList.remove('selected');
                }
            }
        }
    }

    /**
     * 선택된 카드 상세 정보 숨김
     */
    hideSelectedCardDetail() {
        const detailContainer = document.getElementById('selected-card-detail');
        if (detailContainer) {
            detailContainer.classList.add('hidden');
            detailContainer.innerHTML = '';
        }
        this.selectedCardCanvas = null;

        // 스크롤 재활성화
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            contentArea.classList.remove('card-enlarged');
        }
    }

    /**
     * 선택 버튼들 표시
     */
    showSelectionButtons() {
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.add('hidden');
        }
        if (this.victoryViewHandRow) {
            this.victoryViewHandRow.classList.add('hidden');
        }
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.remove('hidden');
        }

        // 손패 개수 체크하여 '덱에 추가' 버튼 활성화/비활성화
        this.updateAddToDeckButton();
    }

    /**
     * '덱에 추가' 버튼 활성화/비활성화 업데이트
     */
    updateAddToDeckButton() {
        if (!this.victoryAddToDeckBtn || !this.gameManager || !this.gameManager.player) {
            return;
        }

        const currentHandSize = this.gameManager.player.hand.length;
        const maxHandSize = GameConfig.player.maxHandSize;
        const isHandFull = currentHandSize >= maxHandSize;

        if (isHandFull) {
            this.victoryAddToDeckBtn.disabled = true;
            this.victoryAddToDeckBtn.classList.add('disabled');
        } else {
            this.victoryAddToDeckBtn.disabled = false;
            this.victoryAddToDeckBtn.classList.remove('disabled');
        }
    }

    /**
     * 계속하기 버튼 표시
     */
    showContinueButton() {
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.remove('hidden');
        }
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.classList.remove('hidden');
        }
        if (this.victorySkipBtn) {
            this.victorySkipBtn.classList.add('hidden');
        }
    }

    /**
     * 보상 건너뛰기 처리
     */
    handleSkipReward() {
        // ★ 저장 시점: 카드 선택 완료 (건너뛰기도 "선택 완료"로 간주)
        const config = GameConfig?.constants?.saveSystem;
        if (config?.enabled && config.saveOnRewardSelection && this.gameManager) {
            this.gameManager.saveGameData();
        }

        this.resetCardRewards();
        this.handleVictoryContinue();
    }

    /**
     * Re-roll 처리 (다시뽑기)
     */
    handleReroll() {
        // ★ 안전 체크: Re-roll 횟수 소진 시 즉시 리턴 (WeakMap 사용)
        if (this.getRerollsRemaining() <= 0) {
            console.warn('[CHEAT ATTEMPT] Re-roll 시도 차단 - 남은 횟수 0');
            // 버튼 강제 비활성화 (DOM 조작 방지)
            if (this.victoryRerollBtn) {
                this.victoryRerollBtn.disabled = true;
                this.victoryRerollBtn.classList.add('disabled');
            }
            return;
        }

        // GameManager를 통해 새로운 보상 카드 생성
        if (!this.gameManager || !this.gameManager.generateRewardCards) {
            console.error('[VictoryDefeatModal] GameManager 또는 generateRewardCards 없음');
            return;
        }

        const newRewardCards = this.gameManager.generateRewardCards();

        // 새 카드로 교체 및 재렌더링
        this.setupCardRewards(newRewardCards);

        // Re-roll 횟수 차감 (WeakMap 사용)
        this.decrementRerolls();

        // 버튼 상태 업데이트 (0회 남은 경우 즉시 비활성화)
        this.updateRerollButton();
    }

    /**
     * Re-roll 버튼 상태 업데이트 (WeakMap 사용)
     */
    updateRerollButton() {
        if (!this.victoryRerollBtn) return;

        const remainingRerolls = this.getRerollsRemaining();

        if (remainingRerolls <= 0) {
            // Re-roll 횟수 소진: 버튼 비활성화 (CSS에서 스타일 처리)
            this.victoryRerollBtn.disabled = true;
            this.victoryRerollBtn.classList.add('disabled');
        } else {
            // Re-roll 가능: 버튼 활성화
            this.victoryRerollBtn.disabled = false;
            this.victoryRerollBtn.classList.remove('disabled');
        }
    }

    /**
     * 덱에 추가 처리
     */
    handleAddToDeck() {
        if (this.selectedRewardCard && this.gameManager) {
            // 손패가 가득 찬 경우 처리하지 않음
            const currentHandSize = this.gameManager.player.hand.length;
            const maxHandSize = GameConfig.player.maxHandSize;

            if (currentHandSize >= maxHandSize) {
                console.warn('손패가 가득함 - 카드 추가 불가');
                return;
            }

            // GameManager를 통해 카드를 플레이어 손패에 추가
            if (this.gameManager.cardManager && this.gameManager.player) {
                this.gameManager.cardManager.addCardToPlayer(this.gameManager.player, this.selectedRewardCard.id);
                // 카드 획득 사운드는 addCardToPlayer() 내부에서 자동 재생됨
            }

            // ★ 저장 시점: 카드 선택 완료 (덱에 추가)
            const config = GameConfig?.constants?.saveSystem;
            if (config?.enabled && config.saveOnRewardSelection) {
                this.gameManager.saveGameData();
            }

            this.resetCardRewards();
            this.handleVictoryContinue();
        }
    }

    /**
     * 카드 교체 처리
     */
    handleReplaceCard() {
        // Prevent double-click execution
        if (this._replacingCard) return;
        this._replacingCard = true;

        if (this.selectedRewardCard && this.gameManager) {
            this.viewOnlyMode = false; // 교체 모드
            this.showHandReplaceSelection();
        }

        // Reset debounce flag after 500ms
        setTimeout(() => { this._replacingCard = false; }, 500);
    }

    /**
     * 손패 확인 처리 (조회 전용)
     */
    handleViewHand() {
        if (this.gameManager && this.gameManager.player) {
            this.viewOnlyMode = true; // 조회 전용 모드
            this.showHandViewSelection();
        }
    }

    /**
     * 손패 교체 선택 표시
     */
    showHandReplaceSelection() {
        if (!this.gameManager || !this.gameManager.player) return;

        // 선택된 카드 정보 임시 저장 (취소 시 복구용)
        this.tempSelectedCard = this.selectedRewardCard;

        // 확대창 숨기기
        this.hideSelectedCardDetail();

        // 카드 보상 영역 숨기기
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.add('hidden');
        }

        // 공유 버튼 숨김 (손패 교체 화면)
        if (this.victoryShareRow) {
            this.victoryShareRow.classList.add('hidden');
        }

        // 모든 버튼 그룹 숨기기 (손패 교체 시에는 취소 버튼만 보이도록)
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.add('hidden');
        }
        if (this.victoryViewHandRow) {
            this.victoryViewHandRow.classList.add('hidden');
        }

        // 손패 교체 영역 표시
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.remove('hidden');
        }

        // 손패 카드들 렌더링
        this.renderHandCards();
    }

    /**
     * 손패 확인 선택 표시 (조회 전용)
     */
    showHandViewSelection() {
        if (!this.gameManager || !this.gameManager.player) return;

        // 카드 보상 영역 숨기기
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.add('hidden');
        }

        // 공유 버튼 숨김 (손패 확인 화면)
        if (this.victoryShareRow) {
            this.victoryShareRow.classList.add('hidden');
        }

        // 모든 버튼 그룹 숨기기
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.add('hidden');
        }
        if (this.victoryViewHandRow) {
            this.victoryViewHandRow.classList.add('hidden');
        }

        // 손패 교체 영역 표시 (재사용)
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.remove('hidden');
            // 제목 변경 (조회 모드)
            const title = this.victoryHandReplace.querySelector('h3');
            if (title) {
                const titleKey = 'auto_battle_card_game.ui.view_hand_cards_title';
                title.textContent = I18nHelper.getText(titleKey) || '손패 카드 확인';
            }
            // 설명 텍스트 변경 (조회 모드)
            const instruction = this.victoryHandReplace.querySelector('p');
            if (instruction) {
                const instructionKey = 'auto_battle_card_game.ui.view_hand_instruction';
                instruction.textContent = I18nHelper.getText(instructionKey) || '현재 당신이 보유한 손패 현황';
            }
        }

        // 손패 카드들 렌더링
        this.renderHandCards();
    }

    /**
     * 손패 카드들 렌더링 (동적 2행 레이아웃 - 게임패배모달 방식)
     */
    renderHandCards() {
        if (!this.handCardsForReplace || !this.gameManager || !this.gameManager.player) return;

        this.handCardsForReplace.innerHTML = '';
        this.handCardsForReplace.classList.add('final-hand-grid'); // 게임패배모달과 동일한 CSS 클래스

        const handCards = this.gameManager.player.hand || [];
        const totalCards = handCards.length;

        if (totalCards === 0) return;

        if (totalCards <= 5) {
            // 5장 이하: 1행에만 가운데 정렬
            const row1 = document.createElement('div');
            row1.className = 'final-hand-row';

            handCards.forEach((card, index) => {
                if (card) {
                    const handCardElement = this.createHandCardElement(card, index);
                    row1.appendChild(handCardElement);
                }
            });

            this.handCardsForReplace.appendChild(row1);
        } else {
            // 6장 이상: 동적 2행 배치 (1행: n-5장, 2행: 5장)
            const firstRowCount = totalCards - 5;

            // 1행 렌더링
            const row1 = document.createElement('div');
            row1.className = 'final-hand-row';
            for (let i = 0; i < firstRowCount; i++) {
                if (handCards[i]) {
                    const handCardElement = this.createHandCardElement(handCards[i], i);
                    row1.appendChild(handCardElement);
                }
            }

            // 2행 렌더링
            const row2 = document.createElement('div');
            row2.className = 'final-hand-row';
            for (let i = firstRowCount; i < totalCards; i++) {
                if (handCards[i]) {
                    const handCardElement = this.createHandCardElement(handCards[i], i);
                    row2.appendChild(handCardElement);
                }
            }

            this.handCardsForReplace.appendChild(row1);
            this.handCardsForReplace.appendChild(row2);
        }
    }

    /**
     * 손패 카드 요소 생성
     * @param {Object} card - 카드 데이터
     * @param {number} index - 손패 인덱스
     * @returns {HTMLElement} 생성된 DOM 요소
     */
    createHandCardElement(card, index) {
        const handCardDiv = document.createElement('div');
        handCardDiv.className = 'hand-card';
        handCardDiv.dataset.handIndex = index;

        // Canvas 로 카드 렌더링
        const canvas = document.createElement('canvas');
        const cardSize = GameConfig.cardSizes.hand;
        canvas.width = cardSize.width;
        canvas.height = cardSize.height;
        canvas.style.borderRadius = '6px';

        const ctx = canvas.getContext('2d');
        this.cardRenderer.renderCard(ctx, card, 0, 0, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            opacity: 1
        });

        handCardDiv.appendChild(canvas);

        // 클릭 이벤트 추가
        handCardDiv.onclick = () => this.selectHandCard(index);
        handCardDiv.style.cursor = 'pointer';

        return handCardDiv;
    }

    /**
     * 손패 카드 선택
     * @param {number} handIndex - 손패 인덱스
     */
    selectHandCard(handIndex) {
        // 카드 클릭 사운드 재생
        if (this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.handCardClick || 'cardClick');
        }

        this.selectedHandCardIndex = handIndex;

        if (this.gameManager && this.gameManager.player && this.gameManager.player.hand[handIndex]) {
            const selectedCard = this.gameManager.player.hand[handIndex];

            // 손패 교체 영역 숨기기
            if (this.victoryHandReplace) {
                this.victoryHandReplace.classList.add('hidden');
            }

            // 선택된 손패 카드 확대 표시
            this.showSelectedHandCardDetail(selectedCard);

            // 조회 전용 모드일 경우 취소 버튼만 표시
            if (this.viewOnlyMode) {
                this.showViewOnlyConfirmationButtons();
            } else {
                // 교체 모드일 경우 확인/취소 버튼 표시
                this.showHandConfirmationButtons();
            }
        }
    }

    /**
     * 선택된 손패 카드 확대 표시 (DOM 방식 - 인라인 라벨 클릭 가능)
     * @param {Object} card - 표시할 카드 데이터
     */
    showSelectedHandCardDetail(card) {
        const detailContainer = document.getElementById('selected-hand-card-detail');
        if (!detailContainer || !card) return;

        // 기존 컨텐츠 제거
        detailContainer.innerHTML = '';

        // DOMCardRenderer로 카드 생성 (Canvas 대신 DOM 방식)
        const cardSize = GameConfig.cardSizes.victoryDetail; // 승리 모달 확대 카드 크기 사용
        const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: true,
            isHighlighted: false,
            opacity: 1,
            context: 'default'
        });

        // 카드 스타일 추가
        cardElement.style.borderRadius = '12px';
        cardElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';

        detailContainer.appendChild(cardElement);

        // 컨테이너 표시
        detailContainer.classList.remove('hidden');

        // 스크롤 위치 리셋 (스크롤은 유지 - 취소 버튼 접근성 보장)
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            contentArea.scrollTop = 0;
            // 손패 선택 화면에서는 card-enlarged 추가하지 않음 (취소 버튼 접근성 보장)
            // contentArea.classList.add('card-enlarged');
        }
    }

    /**
     * 선택된 손패 카드 상세 정보 숨김
     */
    hideSelectedHandCardDetail() {
        const detailContainer = document.getElementById('selected-hand-card-detail');
        if (detailContainer) {
            detailContainer.classList.add('hidden');
            detailContainer.innerHTML = '';
        }

        // 스크롤 재활성화 (손패 선택 화면에서는 항상 스크롤 활성화 상태 유지)
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            // 손패 선택 화면에서는 card-enlarged를 추가하지 않았으므로 제거할 필요 없음
            // contentArea.classList.remove('card-enlarged');
        }
    }

    /**
     * 손패 확인 버튼들 표시
     */
    showHandConfirmationButtons() {
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.remove('hidden');
        }
        // 바꾸기 버튼 표시
        if (this.victoryConfirmReplacementBtn) {
            this.victoryConfirmReplacementBtn.classList.remove('hidden');
        }
    }

    /**
     * 조회 전용 모드 버튼들 표시 (취소 버튼만)
     */
    showViewOnlyConfirmationButtons() {
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.remove('hidden');
        }
        // 바꾸기 버튼 숨김 (조회 전용 모드)
        if (this.victoryConfirmReplacementBtn) {
            this.victoryConfirmReplacementBtn.classList.add('hidden');
        }
    }

    /**
     * 손패 확인 버튼들 숨김
     */
    hideHandConfirmationButtons() {
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.add('hidden');
        }
    }

    /**
     * 교체 확인 처리
     */
    handleConfirmReplacement() {
        this.executeCardReplacement();
    }

    /**
     * 손패 선택 취소 처리
     */
    handleCancelHandSelection() {
        this.selectedHandCardIndex = null;
        this.hideSelectedHandCardDetail();
        this.hideHandConfirmationButtons();

        // 손패 교체 영역 다시 표시
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.remove('hidden');
        }
    }

    /**
     * 카드 교체 실행
     */
    executeCardReplacement() {
        if (this.selectedRewardCard &&
            this.selectedHandCardIndex !== null &&
            this.gameManager &&
            this.gameManager.cardManager) {

            // GameManager를 통해 카드 교체
            this.gameManager.cardManager.replacePlayerCard(
                this.gameManager.player,
                this.selectedHandCardIndex,
                this.selectedRewardCard.id
            );

            // ★ 저장 시점: 카드 선택 완료 (카드 교체)
            const config = GameConfig?.constants?.saveSystem;
            if (config?.enabled && config.saveOnRewardSelection) {
                this.gameManager.saveGameData();
            }

            this.resetCardRewards();
            this.handleVictoryContinue();
        }
    }

    /**
     * 선택 취소 처리
     */
    handleCancelSelection() {
        this.selectedRewardCard = null;
        this.updateCardSelection(-1); // 모든 선택 해제
        this.hideSelectedCardDetail(); // 선택된 카드 상세 정보 숨김

        // ✅ FIX: 손패 확인 버튼들 숨기기 (상태 누수 방지)
        this.hideHandConfirmationButtons();

        // 보상 카드 3개 다시 표시
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.remove('hidden');
        }

        // 공유 버튼 다시 표시 (보상 카드 선택 화면으로 복귀)
        if (this.victoryShareRow) {
            this.victoryShareRow.classList.remove('hidden');
        }

        // 기본 버튼들 다시 표시
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.remove('hidden');
        }
        if (this.victoryViewHandRow) {
            this.victoryViewHandRow.classList.remove('hidden');
        }
    }

    /**
     * 교체 취소 처리
     */
    handleCancelReplace() {
        this.selectedHandCardIndex = null;

        // 손패 교체 영역 숨기기
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.add('hidden');
            // 제목 복구 (교체 모드)
            const title = this.victoryHandReplace.querySelector('h3');
            if (title) {
                const titleKey = 'auto_battle_card_game.ui.hand_replace_title';
                title.textContent = I18nHelper.getText(titleKey) || '손패 카드 교체';
            }
        }

        // 확대창 숨기기
        this.hideSelectedHandCardDetail();

        // ✅ FIX: 손패 확인 버튼들 숨기기 (상태 누수 방지)
        this.hideHandConfirmationButtons();

        // 조회 전용 모드였다면 기본 버튼으로 돌아감
        if (this.viewOnlyMode) {
            this.viewOnlyMode = false;

            // 카드 보상 영역 다시 표시
            if (this.victoryCardRewards) {
                this.victoryCardRewards.classList.remove('hidden');
            }

            // 공유 버튼 다시 표시 (보상 카드 선택 화면으로 복귀)
            if (this.victoryShareRow) {
                this.victoryShareRow.classList.remove('hidden');
            }

            // 기본 버튼 표시
            if (this.victoryDefaultButtons) {
                this.victoryDefaultButtons.classList.remove('hidden');
            }
            // 손패 확인 버튼 행 표시
            if (this.victoryViewHandRow) {
                this.victoryViewHandRow.classList.remove('hidden');
            }
        } else {
            // 교체 모드였다면 이전 선택 상태 복구 (확대 카드만 다시 표시)
            if (this.tempSelectedCard) {
                // 카드 선택 상태 복구
                const cardIndex = this.rewardCards.indexOf(this.tempSelectedCard);
                this.updateCardSelection(cardIndex);

                // 확대창 다시 표시
                this.showSelectedCardDetail(this.tempSelectedCard);

                // 선택 버튼들도 복구
                this.showSelectionButtons();
            }
        }
    }

    /**
     * 카드 보상 관련 상태 초기화
     */
    resetCardRewards() {
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.add('hidden');
        }
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.add('hidden');
        }
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }

        // 선택된 카드 상세 정보 숨김
        this.hideSelectedCardDetail();

        this.selectedRewardCard = null;
        this.selectedHandCardIndex = null;
        this.isShowingCardRewards = false;
        this.rewardCanvases = [];
    }

    /**
     * 카드 표시 이름 가져오기
     * @param {Object} card - 카드 객체
     * @returns {string} 표시할 카드 이름
     */
    getCardDisplayName(card) {
        if (card.nameKey && typeof I18nHelper !== 'undefined') {
            return I18nHelper.getText(card.nameKey) || card.name || card.id;
        }
        return card.name || card.id;
    }

    /**
     * 속성 심볼 가져오기
     * @param {string} element - 속성 이름
     * @returns {string} 속성 심볼
     */
    getElementSymbol(element) {
        const symbols = {
            fire: '🔥',
            water: '💧',
            electric: '⚡',
            poison: '☠️',
            normal: '⭐'  // 👊 대신 ⭐ 사용
        };
        return symbols[element] || '❓';
    }

    /**
     * DOM 무결성 검사 설정 (치트 방지)
     */
    setupDOMIntegrityCheck() {
        // Configuration-Driven: 검사 주기 설정 (1초마다)
        const checkInterval = GameConfig?.constants?.security?.domCheckInterval || 1000;

        this.integrityTimer = setInterval(() => {
            this.performDOMIntegrityCheck();
        }, checkInterval);
    }

    /**
     * DOM 무결성 검사 수행 (주기적 검증)
     */
    performDOMIntegrityCheck() {
        // 카드 보상 화면이 표시 중일 때만 검사
        if (!this.isShowingCardRewards) {
            return;
        }

        // Re-roll 버튼 상태 검증
        if (this.victoryRerollBtn) {
            const actualRemaining = this.getRerollsRemaining();
            const buttonDisabled = this.victoryRerollBtn.disabled;

            // 불일치 감지: 남은 횟수 0인데 버튼이 활성화된 경우
            if (actualRemaining <= 0 && !buttonDisabled) {
                console.warn('[CHEAT DETECTED] Re-roll 버튼 상태 복구 시도');
                this.victoryRerollBtn.disabled = true;
                this.victoryRerollBtn.classList.add('disabled');
            }

            // 불일치 감지: 남은 횟수 있는데 버튼이 비활성화된 경우 (정상 복구)
            if (actualRemaining > 0 && buttonDisabled) {
                this.victoryRerollBtn.disabled = false;
                this.victoryRerollBtn.classList.remove('disabled');
            }
        }

        // '덱에 추가' 버튼 상태 검증 (손패 크기)
        if (this.victoryAddToDeckBtn && this.gameManager && this.gameManager.player) {
            const currentHandSize = this.gameManager.player.hand.length;
            const maxHandSize = GameConfig.player.maxHandSize;
            const isHandFull = currentHandSize >= maxHandSize;
            const buttonDisabled = this.victoryAddToDeckBtn.disabled;

            // 불일치 감지: 손패 가득 찼는데 버튼이 활성화된 경우
            if (isHandFull && !buttonDisabled) {
                console.warn('[CHEAT DETECTED] 덱 추가 버튼 상태 복구 시도');
                this.victoryAddToDeckBtn.disabled = true;
                this.victoryAddToDeckBtn.classList.add('disabled');
            }
        }
    }

    /**
     * DOM 무결성 검사 정리
     */
    cleanupDOMIntegrityCheck() {
        if (this.integrityTimer) {
            clearInterval(this.integrityTimer);
            this.integrityTimer = null;
        }
    }

    /**
     * 리더보드 자동 등록 및 순위 조회
     * @param {Object} gameStats - 게임 통계 데이터
     */
    async submitToLeaderboard(gameStats) {
        // LeaderboardClient 확인
        if (!window.LeaderboardClient || !GameConfig?.leaderboard?.enabled) {
            console.log('[VictoryDefeatModal] Leaderboard disabled or not available');
            if (this.defeatPlayStyle) {
                this.defeatPlayStyle.textContent = '-';
            }
            return;
        }

        // LeaderboardClient 인스턴스 (전역 인스턴스 재사용)
        if (!window.leaderboardClient) {
            window.leaderboardClient = new LeaderboardClient();
        }
        this.leaderboardClient = window.leaderboardClient;

        try {
            // 제출 데이터 구성
            const finalHand = this.gameManager?.player?.hand || [];
            const submitData = {
                playerName: this.gameManager?.player?.name || 'Unknown',
                finalStage: gameStats?.finalStage || 1,
                totalTurns: gameStats?.totalTurns || 0,
                totalDamageDealt: gameStats?.totalDamageDealt || 0,
                totalDamageReceived: gameStats?.totalDamageReceived || 0,
                totalDefenseBuilt: gameStats?.totalDefenseBuilt || 0,
                isGameComplete: gameStats?.isGameComplete || false,
                defenseElement: GameConfig?.utils?.calculateDefenseElement(finalHand) || 'normal',
                finalHand: finalHand
            };

            // 리더보드에 제출
            const submitResult = await this.leaderboardClient.submitScore(submitData);

            if (submitResult.success) {
                console.log('[VictoryDefeatModal] Score submitted successfully');

                // 내 순위 조회
                console.log('[VictoryDefeatModal] Fetching rank...');
                const rankResult = await this.leaderboardClient.getMyRank({
                    finalStage: submitData.finalStage,
                    totalTurns: submitData.totalTurns,
                    totalDamageDealt: submitData.totalDamageDealt,
                    totalDamageReceived: submitData.totalDamageReceived
                });
                console.log('[VictoryDefeatModal] Rank result:', rankResult);

                if (rankResult.success && this.defeatPlayStyle) {
                    // 순위 표시 (직접 포맷팅)
                    console.log('[VictoryDefeatModal] Displaying rank:', rankResult.rank);
                    const rankTemplate = I18nHelper.getText('leaderboard.your_rank') || '#{rank}';
                    const rankText = rankTemplate.replace('{rank}', rankResult.rank);
                    console.log('[VictoryDefeatModal] Rank text:', rankText);
                    this.defeatPlayStyle.textContent = rankText;
                } else if (this.defeatPlayStyle) {
                    console.warn('[VictoryDefeatModal] Rank fetch failed or element missing');
                    this.defeatPlayStyle.textContent = I18nHelper.getText('leaderboard.rank_unknown') || '-';
                }

            } else {
                console.warn('[VictoryDefeatModal] Score submission failed:', submitResult.error);

                // 에러 처리
                if (this.defeatPlayStyle) {
                    if (submitResult.error === 'cooldown') {
                        // Cooldown 중에는 제출하지 않음 - 조용히 "-" 표시
                        console.log('[VictoryDefeatModal] Cooldown active, skipping rank display');
                        this.defeatPlayStyle.textContent = '-';
                    } else {
                        this.defeatPlayStyle.textContent = I18nHelper.getText('leaderboard.submit_failed') || 'Submit failed';
                    }
                }
            }

        } catch (error) {
            console.error('[VictoryDefeatModal] Leaderboard error:', error);
            if (this.defeatPlayStyle) {
                this.defeatPlayStyle.textContent = '-';
            }
        }
    }

    /**
     * 상태이상 효과 제거 (승리/패배 시)
     */
    clearStatusEffects() {
        // HPBarSystem을 통해 상태이상 제거
        if (this.gameManager && this.gameManager.hpBarSystem) {
            // 플레이어 상태이상 표시 제거
            if (this.gameManager.hpBarSystem.playerStatus) {
                this.gameManager.hpBarSystem.playerStatus.innerHTML = '';
            }

            // 화면 테두리 효과 제거
            this.gameManager.hpBarSystem.clearScreenBorderEffect();
        }
    }
}

// 전역 객체로 등록
window.VictoryDefeatModal = VictoryDefeatModal;