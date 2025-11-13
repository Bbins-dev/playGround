/**
 * 플레이어 이름 입력 모달 관리 클래스
 */
class PlayerNameModal {
    constructor(gameManager = null) {
        this.gameManager = gameManager;
        this.modal = document.getElementById('player-name-modal');
        this.nameInput = document.getElementById('player-name-input');
        this.confirmBtn = document.getElementById('confirm-name');
        this.cancelBtn = document.getElementById('cancel-name');

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

        // 취소 버튼 클릭
        this.cancelBtn.addEventListener('click', () => {
            // 버튼 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
            }
            this.handleCancel();
        });

        // Enter 키로 확인
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConfirm();
            }
        });

        // 실시간 입력 길이 체크 (전각/반각 문자 구분)
        this.nameInput.addEventListener('input', () => {
            this.updateLengthCounter();
            this.validateInput();
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
        // 플레이어 이름 모달 사운드 재생
        if (this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.nameModal || 'nameModal');
        }

        this.onNameConfirmed = callback;
        this.nameInput.value = '';
        this.modal.classList.remove('hidden');

        // Pull-to-refresh 완벽 차단 (iOS/Android 공통)
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${scrollY}px`;

        // 길이 카운터 초기화
        this.updateLengthCounter();

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

        // Body 스크롤 복원 + 스크롤 위치 복구
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    /**
     * 문자 길이 계산 (전각 문자는 2, 반각 문자는 1로 카운트)
     * @param {string} text - 계산할 텍스트
     * @returns {number} 계산된 길이
     */
    calculateTextLength(text) {
        let length = 0;
        // 전각 문자 범위 정규식
        // 한글 완성형(AC00-D7A3), 한글 자모(3130-318F, FFA0-FFDC: ㄱ-ㅎ, ㅏ-ㅣ 등),
        // 히라가나/카타카나(3040-30FF, 31F0-31FF),
        // 한자(4E00-9FFF), 전각 영문/숫자/기호(FF00-FFEF)
        const fullWidthRegex = /[\uAC00-\uD7A3\u3130-\u318F\uFFA0-\uFFDC\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uFF00-\uFFEF]/;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (fullWidthRegex.test(char)) {
                length += 2;  // 전각 문자는 2로 카운트
            } else {
                length += 1;  // 반각 문자는 1로 카운트
            }
        }
        return length;
    }

    /**
     * 길이 카운터 업데이트
     */
    updateLengthCounter() {
        const currentLength = this.calculateTextLength(this.nameInput.value);
        const maxLength = 20;  // 영어 기준 20자

        const lengthDisplay = document.getElementById('current-name-length');
        const counterElement = document.querySelector('.name-length-counter');

        if (lengthDisplay) {
            lengthDisplay.textContent = currentLength;
        }

        // 길이에 따른 스타일 변경
        if (counterElement) {
            counterElement.classList.remove('warning', 'error');
            if (currentLength > maxLength) {
                counterElement.classList.add('error');
            } else if (currentLength >= maxLength * 0.8) {
                counterElement.classList.add('warning');
            }
        }
    }

    /**
     * 입력 유효성 검사 (실시간)
     */
    validateInput() {
        const currentLength = this.calculateTextLength(this.nameInput.value);
        const maxLength = 20;

        // 길이 초과 시 마지막 문자 제거
        if (currentLength > maxLength) {
            let text = this.nameInput.value;
            const fullWidthRegex = /[\uAC00-\uD7A3\u3130-\u318F\uFFA0-\uFFDC\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uFF00-\uFFEF]/;
            let calcLength = 0;
            let validText = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charLength = fullWidthRegex.test(char) ? 2 : 1;

                if (calcLength + charLength <= maxLength) {
                    validText += char;
                    calcLength += charLength;
                } else {
                    break;
                }
            }

            this.nameInput.value = validText;
            this.updateLengthCounter();
        }
    }

    /**
     * 확인 버튼 처리
     */
    handleConfirm() {
        // Prevent double-click execution
        if (this._confirming) return;
        this._confirming = true;

        const inputName = this.nameInput.value.trim();
        const nameLength = this.calculateTextLength(inputName);
        const maxLength = 20;
        let playerName;

        if (inputName && nameLength > 0 && nameLength <= maxLength) {
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

        // Reset debounce flag after 500ms
        setTimeout(() => { this._confirming = false; }, 500);
    }

    /**
     * 취소 버튼 처리 - 메인 메뉴로 복귀
     */
    handleCancel() {
        // Prevent double-click execution
        if (this._cancelling) return;
        this._cancelling = true;

        this.hide();

        // 메인 메뉴로 복귀
        if (this.gameManager) {
            this.gameManager.switchScreen('menu');
        }

        // Reset debounce flag after 500ms
        setTimeout(() => { this._cancelling = false; }, 500);
    }

    /**
     * 현재 언어에 맞는 기본 플레이어 이름 반환
     */
    getDefaultPlayerName() {
        return I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어';
    }

    /**
     * 이름 유효성 검사 (전각/반각 문자 고려)
     * @param {string} name - 검사할 이름
     * @returns {boolean} 유효한지 여부
     */
    isValidName(name) {
        const trimmedName = name.trim();
        const nameLength = this.calculateTextLength(trimmedName);
        return trimmedName.length > 0 && nameLength <= 20;
    }
}