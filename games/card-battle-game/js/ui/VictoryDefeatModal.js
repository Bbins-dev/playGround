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

        this.onVictoryContinue = null;
        this.onDefeatRestart = null;
        this.onDefeatMainMenu = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 승리 모달 이벤트
        if (this.victoryContinueBtn) {
            this.victoryContinueBtn.addEventListener('click', () => {
                this.handleVictoryContinue();
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
     */
    showVictory(stage, callback) {
        this.onVictoryContinue = callback;

        // 스테이지 번호 표시
        if (this.victoryStageSpan) {
            this.victoryStageSpan.textContent = stage;
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
}

// 전역 객체로 등록
window.VictoryDefeatModal = VictoryDefeatModal;