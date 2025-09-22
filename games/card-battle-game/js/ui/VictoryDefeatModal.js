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
        this.victoryAddToDeckBtn = document.getElementById('victory-add-to-deck');
        this.victoryReplaceCardBtn = document.getElementById('victory-replace-card');
        this.victoryCancelSelectionBtn = document.getElementById('victory-cancel-selection');

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

        // Canvas 요소들
        this.rewardCanvases = [];
        this.selectedCardCanvas = null;

        // CardRenderer 인스턴스
        this.cardRenderer = new CardRenderer();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 승리 모달 이벤트
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.addEventListener('click', () => {
                this.handleVictoryContinue();
            });
        }

        // 카드 보상 관련 이벤트
        if (this.victorySkipBtn) {
            this.victorySkipBtn.addEventListener('click', () => {
                this.handleSkipReward();
            });
        }

        if (this.victoryAddToDeckBtn) {
            this.victoryAddToDeckBtn.addEventListener('click', () => {
                this.handleAddToDeck();
            });
        }

        if (this.victoryReplaceCardBtn) {
            this.victoryReplaceCardBtn.addEventListener('click', () => {
                this.handleReplaceCard();
            });
        }

        if (this.victoryCancelSelectionBtn) {
            this.victoryCancelSelectionBtn.addEventListener('click', () => {
                this.handleCancelSelection();
            });
        }

        if (this.cancelReplaceBtn) {
            this.cancelReplaceBtn.addEventListener('click', () => {
                this.handleCancelReplace();
            });
        }

        // 패배 모달 이벤트
        if (this.defeatRestartBtn) {
            this.defeatRestartBtn.addEventListener('click', () => {
                this.handleDefeatRestart();
            });
        }

        if (this.defeatMainMenuBtn) {
            this.defeatMainMenuBtn.addEventListener('click', () => {
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

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAll();
            }
        });
    }

    /**
     * 승리 모달 표시
     * @param {number} stage - 클리어한 스테이지 번호
     * @param {Function} callback - 계속하기 버튼 클릭 시 호출할 콜백
     * @param {Array} rewardCards - 보상 카드 배열 (선택사항)
     */
    showVictory(stage, callback, rewardCards = null) {
        console.log('🎬 VictoryDefeatModal: showVictory 호출됨, callback:', callback);

        // 상태이상 효과 제거
        this.clearStatusEffects();

        // 상태 초기화 먼저
        this.resetVictoryState();

        // 콜백 설정 (resetVictoryState 이후에!)
        this.onVictoryContinue = callback;
        console.log('🎬 VictoryDefeatModal: 콜백 설정 완료:', this.onVictoryContinue);

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
            this.defeatCriticalCount.textContent = gameStats.criticalCount || 0;
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
                    // 카드 이름 번역
                    const cardNameKey = `auto_battle_card_game.cards.${mvpCard}.name`;
                    const translatedName = I18nHelper.getText(cardNameKey) || cardData.name;
                    this.defeatMvpCard.textContent = translatedName;
                } else {
                    this.defeatMvpCard.textContent = mvpCard;
                }
            } else {
                this.defeatMvpCard.textContent = I18nHelper.getText('auto_battle_card_game.ui.none') || '-';
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
     * 승리 계속하기 버튼 처리
     */
    handleVictoryContinue() {
        console.log('🎯 VictoryDefeatModal: handleVictoryContinue 호출됨');
        console.log('🎯 onVictoryContinue 콜백:', this.onVictoryContinue);

        // 콜백을 임시 저장 (hideVictory에서 null이 되기 전에)
        const callback = this.onVictoryContinue;

        this.hideVictory();

        if (callback && typeof callback === 'function') {
            console.log('🎯 콜백 실행 중...');
            callback();
            console.log('🎯 콜백 실행 완료');
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

        // 모든 카드 선택 상태 초기화
        this.updateCardSelection(-1);

        // 선택된 카드 상세 정보 숨김
        this.hideSelectedCardDetail();
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
        for (let i = 0; i < 3; i++) {
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
    }

    /**
     * 선택된 카드 확대 표시
     * @param {Object} card - 표시할 카드 데이터
     */
    showSelectedCardDetail(card) {
        const detailContainer = document.getElementById('selected-card-detail');
        if (!detailContainer || !card) return;

        // 기존 컨텐츠 제거
        detailContainer.innerHTML = '';

        // Canvas 생성
        const canvas = document.createElement('canvas');
        const cardSize = GameConfig.cardSizes.victoryDetail; // 승리 모달 확대 카드 크기 사용
        canvas.width = cardSize.width;
        canvas.height = cardSize.height;
        canvas.style.borderRadius = '12px';
        canvas.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';

        const ctx = canvas.getContext('2d');

        // CardRenderer로 카드 렌더링
        this.cardRenderer.renderCard(ctx, card, 0, 0, cardSize.width, cardSize.height, {
            isSelected: true,
            isHighlighted: true,
            opacity: 1
        });

        detailContainer.appendChild(canvas);
        this.selectedCardCanvas = canvas;

        // 컨테이너 표시
        detailContainer.classList.remove('hidden');
    }

    /**
     * 보상 카드 선택
     * @param {number} cardIndex - 선택된 카드 인덱스
     */
    selectRewardCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.rewardCards.length) {
            this.selectedRewardCard = this.rewardCards[cardIndex];

            // UI 업데이트: 선택된 카드 강조
            this.updateCardSelection(cardIndex);

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
        for (let i = 0; i < 3; i++) {
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

        // 카드 보상 영역 숨기기
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.add('hidden');
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
        this.selectedHandCardIndex = handIndex;

        // UI 업데이트
        const handCards = this.handCardsForReplace.querySelectorAll('.hand-card');
        handCards.forEach((card, index) => {
            if (index === handIndex) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // 교체 실행
        this.executeCardReplacement();
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

        // 손패 교체 영역 숨기고 카드 보상 영역 다시 표시
        if (this.victoryHandReplace) {
            this.victoryHandReplace.classList.add('hidden');
        }
        if (this.victoryCardRewards) {
            this.victoryCardRewards.classList.remove('hidden');
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