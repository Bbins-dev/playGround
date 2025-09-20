/**
 * 승리/패배 모달 관리 클래스
 */
class VictoryDefeatModal {
    constructor(gameManager) {
        this.gameManager = gameManager;
        // 승리 모달 요소들
        this.victoryModal = document.getElementById('victory-modal');
        this.victoryStageSpan = document.getElementById('victory-stage');
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
        this.onVictoryContinue = callback;
        this.resetVictoryState();

        // 스테이지 번호 표시
        if (this.victoryStageSpan) {
            this.victoryStageSpan.textContent = stage;
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
        this.hideVictory();
        if (this.onVictoryContinue && typeof this.onVictoryContinue === 'function') {
            this.onVictoryContinue();
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
            const cardElement = document.getElementById(`reward-card-${i}`);
            const rewardCardContainer = document.querySelector(`[data-card-index="${i}"]`);

            if (cardElement && rewardCardContainer) {
                if (i < this.rewardCards.length) {
                    const card = this.rewardCards[i];
                    this.renderCardVisual(cardElement, card);

                    // 카드 선택 버튼 이벤트 추가
                    const selectBtn = rewardCardContainer.querySelector('.card-select-btn');
                    if (selectBtn) {
                        selectBtn.onclick = () => this.selectRewardCard(i);
                    }

                    rewardCardContainer.style.display = 'flex';
                } else {
                    rewardCardContainer.style.display = 'none';
                }
            }
        }
    }

    /**
     * 카드 시각적 렌더링
     * @param {HTMLElement} element - 렌더링할 DOM 요소
     * @param {Object} card - 카드 데이터
     */
    renderCardVisual(element, card) {
        if (!element || !card) return;

        // 기본 카드 정보 표시
        const cardName = this.getCardDisplayName(card);
        const cardType = card.type || 'unknown';
        const cardElement = card.element || 'none';

        element.innerHTML = `
            <div style="font-size: 10px; font-weight: bold; color: white; text-align: center;">
                <div>${cardName}</div>
                <div style="margin-top: 5px; font-size: 8px;">${cardType}</div>
                <div style="margin-top: 3px; font-size: 8px;">${this.getElementSymbol(cardElement)}</div>
            </div>
        `;

        // 속성별 배경색 설정
        const elementColors = {
            fire: 'linear-gradient(145deg, #e74c3c, #c0392b)',
            water: 'linear-gradient(145deg, #3498db, #2980b9)',
            electric: 'linear-gradient(145deg, #f1c40f, #f39c12)',
            poison: 'linear-gradient(145deg, #9b59b6, #8e44ad)',
            normal: 'linear-gradient(145deg, #95a5a6, #7f8c8d)'
        };

        element.style.background = elementColors[cardElement] || elementColors.normal;
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
            normal: '👊'
        };
        return symbols[element] || '❓';
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
     * 선택 버튼들 표시
     */
    showSelectionButtons() {
        if (this.victoryDefaultButtons) {
            this.victoryDefaultButtons.classList.add('hidden');
        }
        if (this.victorySelectionButtons) {
            this.victorySelectionButtons.classList.remove('hidden');
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
        this.showContinueButton();
        this.resetCardRewards();
    }

    /**
     * 덱에 추가 처리
     */
    handleAddToDeck() {
        if (this.selectedRewardCard && this.gameManager) {
            // GameManager를 통해 카드를 덱에 추가
            if (this.gameManager.cardManager) {
                this.gameManager.cardManager.addCardToDeck(this.selectedRewardCard.id);
            }

            this.showContinueButton();
            this.resetCardRewards();
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

        handCards.forEach((cardId, index) => {
            const card = CardDatabase.getCard(cardId);
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

        const cardVisual = document.createElement('div');
        cardVisual.className = 'card-visual';
        this.renderCardVisual(cardVisual, card);

        const cardName = document.createElement('div');
        cardName.textContent = this.getCardDisplayName(card);
        cardName.style.color = 'white';
        cardName.style.fontSize = '12px';
        cardName.style.textAlign = 'center';

        handCardDiv.appendChild(cardVisual);
        handCardDiv.appendChild(cardName);

        // 클릭 이벤트 추가
        handCardDiv.onclick = () => this.selectHandCard(index);

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
            this.gameManager.cardManager.replaceHandCard(
                this.selectedHandCardIndex,
                this.selectedRewardCard.id
            );

            this.showContinueButton();
            this.resetCardRewards();
        }
    }

    /**
     * 선택 취소 처리
     */
    handleCancelSelection() {
        this.selectedRewardCard = null;
        this.updateCardSelection(-1); // 모든 선택 해제

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

        this.selectedRewardCard = null;
        this.selectedHandCardIndex = null;
        this.isShowingCardRewards = false;
    }
}

// 전역 객체로 등록
window.VictoryDefeatModal = VictoryDefeatModal;