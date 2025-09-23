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
        this.currentSubStage = 1;
        this.maxSubStages = 3; // 기본값, 설정에서 가져올 수 있음

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

    // 스테이지 정보 업데이트
    updateStage(stage, subStage = 1, maxSubStages = 3) {
        // 애니메이션 중이면 대기
        if (this.isAnimating) {
            setTimeout(() => this.updateStage(stage, subStage, maxSubStages), 100);
            return;
        }

        const hasChanged = (this.currentStage !== stage || this.currentSubStage !== subStage);

        // 상태 업데이트
        this.currentStage = stage;
        this.currentSubStage = subStage;
        this.maxSubStages = maxSubStages;

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
        // i18n 템플릿 사용
        const template = I18nHelper.getText('auto_battle_card_game.ui.stage_display_template') || 'Stage {stage}-{substage}';
        const displayText = template
            .replace('{stage}', this.currentStage)
            .replace('{substage}', this.currentSubStage);

        this.stageText.textContent = displayText;

        // data-i18n 속성도 업데이트 (필요시)
        this.stageText.setAttribute('data-stage', this.currentStage);
        this.stageText.setAttribute('data-substage', this.currentSubStage);
    }

    // 진행도 업데이트
    updateProgress() {
        let progressText = '';

        for (let i = 1; i <= this.maxSubStages; i++) {
            if (i <= this.currentSubStage) {
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
        return {
            stage: this.currentStage,
            subStage: this.currentSubStage,
            maxSubStages: this.maxSubStages,
            displayText: this.stageText.textContent,
            progressText: this.stageProgress.textContent
        };
    }

    // 스테이지 정보를 GameConfig에서 가져와서 업데이트
    updateFromGameConfig() {
        // GameConfig에서 최대 서브스테이지 수 가져오기
        if (typeof GameConfig !== 'undefined' && GameConfig.stages) {
            this.maxSubStages = GameConfig.stages.subStagesPerStage || 3;
        }

        // 진행도 다시 계산
        this.updateProgress();
    }

    // 디버그 정보 출력
    debug() {
        console.log('StageIndicator Debug:', {
            currentStage: this.currentStage,
            currentSubStage: this.currentSubStage,
            maxSubStages: this.maxSubStages,
            isVisible: !this.indicator.classList.contains('hidden'),
            isAnimating: this.isAnimating,
            displayText: this.stageText.textContent,
            progressText: this.stageProgress.textContent
        });
    }
}

// 전역 객체로 등록
window.StageIndicator = StageIndicator;