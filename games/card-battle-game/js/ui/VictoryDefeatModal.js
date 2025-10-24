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
        this.victorySelectionButtons = document.getElementById('victory-selection-buttons');
        this.victorySkipBtn = document.getElementById('victory-skip');
        this.victoryRerollBtn = document.getElementById('victory-reroll');
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
        this.rerollsRemaining = 0; // Re-roll 남은 횟수

        // Canvas 요소들
        this.rewardCanvases = [];
        this.selectedCardCanvas = null;

        // CardRenderer 인스턴스
        this.cardRenderer = new CardRenderer();

        // DOMCardRenderer 인스턴스 (확대 카드용)
        this.domCardRenderer = new DOMCardRenderer();

        this.initializeEventListeners();
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

        // Re-roll 횟수 초기화 (Configuration-Driven)
        this.rerollsRemaining = GameConfig?.constants?.rewards?.maxRerollsPerVictory || 1;

        // 콜백 설정 (resetVictoryState 이후에!)
        this.onVictoryContinue = callback;

        // 스테이지 번호 표시
        if (this.victoryStageSpan) {
            this.victoryStageSpan.textContent = stage || 1;
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
    showDefeat(gameStats, restartCallback, mainMenuCallback) {
        // 상태이상 효과 제거
        this.clearStatusEffects();

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

        // 모달 표시
        if (this.defeatModal) {
            this.defeatModal.classList.remove('hidden');
        }
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

        // 플레이 스타일 번역
        if (this.defeatPlayStyle) {
            const playStyleKey = `auto_battle_card_game.ui.play_style_${gameStats.playStyle || 'balanced'}`;
            const translatedStyle = I18nHelper.getText(playStyleKey) || this.getDefaultPlayStyleText(gameStats.playStyle);
            this.defeatPlayStyle.textContent = translatedStyle;
        }

        // MVP 카드
        if (this.defeatMvpCard) {
            const mvpCard = gameStats.mvpCard;
            if (mvpCard && window.CardDatabase) {
                const cardData = CardDatabase.getCard(mvpCard);
                if (cardData) {
                    this.renderMvpCard(cardData);
                } else {
                    this.showMvpCardText(mvpCard);
                }
            } else {
                this.showMvpCardText(I18nHelper.getText('auto_battle_card_game.ui.none') || '-');
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
        this.rerollsRemaining = 0; // Re-roll 횟수 초기화

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
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.classList.add('hidden');
        }
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.add('hidden');
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
        this.resetCardRewards();
        this.handleVictoryContinue();
    }

    /**
     * Re-roll 처리 (다시뽑기)
     */
    handleReroll() {
        // 안전 체크: Re-roll 횟수 소진 시 즉시 리턴
        if (this.rerollsRemaining <= 0) {
            console.warn('[VictoryDefeatModal] Re-roll 횟수 소진');
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

        // Re-roll 횟수 차감
        this.rerollsRemaining--;

        // 버튼 상태 업데이트 (0회 남은 경우 즉시 비활성화)
        this.updateRerollButton();
    }

    /**
     * Re-roll 버튼 상태 업데이트
     */
    updateRerollButton() {
        if (!this.victoryRerollBtn) return;

        if (this.rerollsRemaining <= 0) {
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

            this.resetCardRewards();
            this.handleVictoryContinue();
        }
    }

    /**
     * 카드 교체 처리
     */
    handleReplaceCard() {
        if (this.selectedRewardCard && this.gameManager) {
            this.showHandReplaceSelection();
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

        // 모든 버튼 그룹 숨기기 (손패 교체 시에는 취소 버튼만 보이도록)
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.add('hidden');
        }

        // 손패 교체 영역 표시
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.remove('hidden');
        }

        // 손패 카드들 렌더링
        this.renderHandCards();
    }

    /**
     * 손패 카드들 렌더링
     */
    renderHandCards() {
        if (!this.handCardsForReplace || !this.gameManager || !this.gameManager.player) return;

        this.handCardsForReplace.innerHTML = '';
        const handCards = this.gameManager.player.hand || [];

        handCards.forEach((card, index) => {
            // Player.hand는 Card 인스턴스를 직접 포함
            if (card) {
                const handCardElement = this.createHandCardElement(card, index);
                this.handCardsForReplace.appendChild(handCardElement);
            }
        });
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

            // 확인/취소 버튼 표시
            this.showHandConfirmationButtons();
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

        // 스크롤 위치 리셋 및 비활성화
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            contentArea.scrollTop = 0;
            contentArea.classList.add('card-enlarged');
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

        // 스크롤 재활성화
        const contentArea = document.querySelector('#victory-modal .victory-content-area');
        if (contentArea) {
            contentArea.classList.remove('card-enlarged');
        }
    }

    /**
     * 손패 확인 버튼들 표시
     */
    showHandConfirmationButtons() {
        if (this.victoryHandConfirmationButtons) {
            this.victoryHandConfirmationButtons.classList.remove('hidden');
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

        // 보상 카드 3개 다시 표시
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.remove('hidden');
        }

        // 기본 버튼들 다시 표시
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.add('hidden');
        }
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.remove('hidden');
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
        }

        // 이전 선택 상태 복구 (확대 카드만 다시 표시)
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