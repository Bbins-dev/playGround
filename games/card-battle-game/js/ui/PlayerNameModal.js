/**
 * 플레이어 이름 입력 모달 관리 클래스
 */
class PlayerNameModal {
    constructor(gameManager = null) {
        this.gameManager = gameManager;
        this.modal = document.getElementById('player-name-modal');
        this.nameInput = document.getElementById('player-name-input');
        this.confirmBtn = document.getElementById('confirm-name');

        this.onNameConfirmed = null; // 콜백 함수

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 확인 버튼 클릭
        this.confirmBtn.addEventListener('click', () => {
            // 버튼 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
            }
            this.handleConfirm();
        });

        // Enter 키로 확인
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConfirm();
            }
        });

        // 모달 외부 클릭으로 닫기 방지 (이름 입력은 필수)
        this.modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * 모달을 표시하고 이름 입력을 요청
     * @param {Function} callback - 이름이 확정되었을 때 호출할 콜백 (playerName 매개변수 전달)
     */
    show(callback) {
        this.onNameConfirmed = callback;
        this.nameInput.value = '';
        this.modal.classList.remove('hidden');

        // 입력 필드에 포커스
        setTimeout(() => {
            this.nameInput.focus();
        }, 100);
    }

    /**
     * 모달을 숨김
     */
    hide() {
        this.modal.classList.add('hidden');
        this.nameInput.value = '';
    }

    /**
     * 확인 버튼 처리
     */
    handleConfirm() {
        const inputName = this.nameInput.value.trim();
        let playerName;

        if (inputName && inputName.length <= GameConfig.playerName.maxLength) {
            // 유효한 이름이 입력된 경우
            playerName = inputName;
        } else {
            // 빈 이름이거나 너무 긴 경우 기본값 사용
            playerName = this.getDefaultPlayerName();
        }

        this.hide();
        if (this.onNameConfirmed) {
            this.onNameConfirmed(playerName);
        }
    }

    /**
     * 현재 언어에 맞는 기본 플레이어 이름 반환
     */
    getDefaultPlayerName() {
        return I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
    }

    /**
     * 이름 유효성 검사
     * @param {string} name - 검사할 이름
     * @returns {boolean} 유효한지 여부
     */
    isValidName(name) {
        return name &&
               name.trim().length > 0 &&
               name.trim().length <= GameConfig.playerName.maxLength;
    }
}