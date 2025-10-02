/**
 * LoadingScreen.js
 * 로딩 화면 관리 시스템
 *
 * 기능:
 * - 로딩 진행률 표시
 * - 오디오 프리로딩 진행률 업데이트
 * - 로딩 완료 후 페이드 아웃
 * - 최소 로딩 시간 보장 (너무 빠른 깜빡임 방지)
 *
 * Configuration-Driven:
 * - GameConfig.audio.loading 설정 참조
 */

class LoadingScreen {
    constructor(gameManager = null) {
        // GameManager 참조
        this.gameManager = gameManager;

        // DOM 요소
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBarFill = document.getElementById('loading-bar-fill');
        this.loadingProgressText = document.getElementById('loading-progress-text');
        this.startButton = document.getElementById('loading-start-button');

        // 로딩 시작 시간
        this.startTime = Date.now();

        // 최소 로딩 시간 (GameConfig에서 가져오기)
        this.minimumLoadTime = GameConfig?.audio?.loading?.minimumLoadTime || 500;

        console.log('[LoadingScreen] Initialized');
    }

    /**
     * 로딩 화면 표시
     */
    show() {
        if (!this.loadingScreen) {
            console.warn('[LoadingScreen] Loading screen element not found');
            return;
        }

        this.loadingScreen.classList.remove('hidden', 'fade-out');
        this.startTime = Date.now();

        console.log('[LoadingScreen] Showing loading screen');
    }

    /**
     * 로딩 진행률 업데이트
     * @param {number} loaded - 로드된 파일 수
     * @param {number} total - 전체 파일 수
     */
    updateProgress(loaded, total) {
        if (!this.loadingBarFill || !this.loadingProgressText) {
            return;
        }

        // 진행률 계산 (0-100%)
        const progress = total > 0 ? (loaded / total) * 100 : 0;

        // 로딩 바 업데이트
        this.loadingBarFill.style.width = `${progress}%`;

        // 진행률 텍스트 업데이트
        this.loadingProgressText.textContent = `${loaded}/${total} files loaded`;

        console.log(`[LoadingScreen] Progress: ${loaded}/${total} (${progress.toFixed(1)}%)`);
    }

    /**
     * 로딩 완료 후 화면 숨기기
     * @param {Function} onHidden - 완전히 숨겨진 후 실행할 콜백
     * @returns {Promise<void>}
     */
    async hide(onHidden) {
        if (!this.loadingScreen) {
            if (onHidden) onHidden();
            return;
        }

        // 경과 시간 계산
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minimumLoadTime - elapsedTime);

        console.log(`[LoadingScreen] Elapsed: ${elapsedTime}ms, Remaining: ${remainingTime}ms`);

        // 최소 로딩 시간이 남았으면 대기
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // 페이드 아웃 시작
        this.loadingScreen.classList.add('fade-out');

        // 페이드 아웃 완료 대기 (CSS transition: 0.5s)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 완전히 숨기기
        this.loadingScreen.classList.add('hidden');

        console.log('[LoadingScreen] Hidden');

        // 콜백 실행
        if (onHidden) {
            onHidden();
        }
    }

    /**
     * 즉시 숨기기 (애니메이션 없음)
     */
    hideImmediately() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            console.log('[LoadingScreen] Hidden immediately');
        }
    }

    /**
     * "Click to Start" 버튼 표시
     */
    showStartButton() {
        if (!this.startButton) {
            console.warn('[LoadingScreen] Start button element not found');
            return;
        }

        this.startButton.classList.remove('hidden');
        console.log('[LoadingScreen] Start button shown');
    }

    /**
     * 사용자 클릭 대기 (Promise 반환)
     * @returns {Promise<void>}
     */
    waitForUserClick() {
        return new Promise((resolve) => {
            if (!this.startButton) {
                console.warn('[LoadingScreen] Start button not found, resolving immediately');
                resolve();
                return;
            }

            const clickHandler = () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.startButton.removeEventListener('click', clickHandler);
                console.log('[LoadingScreen] User clicked start button');
                resolve();
            };

            this.startButton.addEventListener('click', clickHandler);
        });
    }
}
