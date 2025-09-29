// 스테이지 인디케이터 관리 클래스

class StageIndicator {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // DOM 요소들
        this.indicator = document.getElementById('stage-indicator');
        this.stageText = this.indicator.querySelector('.stage-text');
        this.stageProgress = this.indicator.querySelector('.stage-progress');

        // 상태 추적
        this.currentStage = 1;
        this.fullHealInterval = GameConfig.healing.fullHealInterval || 10; // 10스테이지마다 완전 회복

        // 애니메이션 상태
        this.isAnimating = false;

        // 초기화
        this.initialize();
    }

    // 초기화
    initialize() {
        // 초기 상태 숨김
        this.hide();

        // 다국어 업데이트
        this.updateLanguage();
    }

    // 스테이지 정보 업데이트 (실제 스테이지 번호만 받음)
    updateStage(stage) {
        // 애니메이션 중이면 대기
        if (this.isAnimating) {
            setTimeout(() => this.updateStage(stage), 100);
            return;
        }

        const hasChanged = (this.currentStage !== stage);

        // 상태 업데이트
        this.currentStage = stage;

        // UI 업데이트
        this.updateText();
        this.updateProgress();

        // 변경이 있으면 애니메이션 실행
        if (hasChanged) {
            this.playUpdateAnimation();
        }
    }

    // 텍스트 업데이트
    updateText() {
        // i18n 템플릿 사용 (실제 스테이지 번호만 표시)
        const template = I18nHelper.getText('auto_battle_card_game.ui.stage_display_template') || 'Stage {stage}';
        const displayText = template.replace('{stage}', this.currentStage);

        this.stageText.textContent = displayText;

        // data-i18n 속성도 업데이트
        this.stageText.setAttribute('data-stage', this.currentStage);
    }

    // 진행도 업데이트 (10개 단위로 표시)
    updateProgress() {
        // 현재 스테이지에서 10개 단위 내 위치 계산
        const currentInGroup = ((this.currentStage - 1) % this.fullHealInterval) + 1;
        let progressText = '';

        // 10개 점으로 진행도 표시
        for (let i = 1; i <= this.fullHealInterval; i++) {
            if (i <= currentInGroup) {
                progressText += '●'; // 완료된 단계
            } else {
                progressText += '○'; // 미완료 단계
            }
        }

        this.stageProgress.textContent = progressText;
    }

    // 스테이지 인디케이터 표시
    show() {
        if (this.indicator.classList.contains('hidden')) {
            this.indicator.classList.remove('hidden');
            this.indicator.classList.add('animate-in');

            // 애니메이션 완료 후 클래스 제거
            setTimeout(() => {
                this.indicator.classList.remove('animate-in');
            }, 500);
        }
    }

    // 스테이지 인디케이터 숨김
    hide() {
        this.indicator.classList.add('hidden');
        this.indicator.classList.remove('animate-in', 'animate-update');
    }

    // 업데이트 애니메이션 재생
    playUpdateAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.indicator.classList.add('animate-update');

        setTimeout(() => {
            this.indicator.classList.remove('animate-update');
            this.isAnimating = false;
        }, 600);
    }

    // 언어 업데이트
    updateLanguage() {
        // 현재 상태로 텍스트 다시 업데이트
        this.updateText();
    }

    // 게임 상태에 따른 표시/숨김 제어
    handleGameStateChange(gameState) {
        switch (gameState.phase) {
            case 'battle':
                // 전투 중에만 표시
                this.show();
                break;
            case 'menu':
            case 'cardSelection':
            case 'gallery':
            case 'gameOver':
                // 다른 상태에서는 숨김
                this.hide();
                break;
        }
    }

    // 스테이지 클리어 효과
    playStageCompleteEffect() {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // 특별한 클리어 애니메이션
        const originalBackground = this.indicator.style.background;
        const originalBorder = this.indicator.style.borderColor;

        // 황금색 글로우 효과
        this.indicator.style.background = 'rgba(255, 215, 0, 0.2)';
        this.indicator.style.borderColor = 'rgba(255, 215, 0, 0.5)';
        this.indicator.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8), 0 8px 32px rgba(31, 38, 135, 0.37)';

        // 펄스 효과
        this.indicator.style.transform = 'translateX(-50%) scale(1.1)';

        setTimeout(() => {
            // 원래 상태로 복원
            this.indicator.style.background = originalBackground;
            this.indicator.style.borderColor = originalBorder;
            this.indicator.style.boxShadow = '';
            this.indicator.style.transform = 'translateX(-50%) scale(1)';

            this.isAnimating = false;
        }, 1000);
    }

    // 현재 스테이지 정보 반환
    getCurrentStageInfo() {
        const currentInGroup = ((this.currentStage - 1) % this.fullHealInterval) + 1;
        return {
            stage: this.currentStage,
            currentInGroup: currentInGroup,
            fullHealInterval: this.fullHealInterval,
            displayText: this.stageText.textContent,
            progressText: this.stageProgress.textContent
        };
    }

    // 스테이지 정보를 GameConfig에서 가져와서 업데이트
    updateFromGameConfig() {
        // GameConfig에서 완전 회복 주기 가져오기
        if (typeof GameConfig !== 'undefined' && GameConfig.healing) {
            this.fullHealInterval = GameConfig.healing.fullHealInterval || 10;
        }

        // 진행도 다시 계산
        this.updateProgress();
    }

}

// 전역 객체로 등록
window.StageIndicator = StageIndicator;