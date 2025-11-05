// ✅ Phase 1.2: 터치 이벤트 최적화 유틸리티
// 모바일 환경에서 터치 이벤트 스로틀링을 제공합니다.

class TouchOptimizer {
    constructor() {
        this.touchThrottle = null;
        this.lastTouchTime = 0;
    }

    /**
     * 터치/포인터 이벤트 핸들러를 스로틀링합니다
     * @param {Function} handler - 원본 이벤트 핸들러
     * @param {number} delay - 스로틀 간격 (ms), 기본값은 GameConfig에서 가져옴
     * @returns {Function} 스로틀된 핸들러
     */
    throttleTouch(handler, delay = null) {
        const touchConfig = GameConfig?.constants?.performance?.touchOptimization;

        if (!touchConfig?.enabled) {
            // 최적화 비활성화 시 원본 핸들러 반환
            return handler;
        }

        const throttleMs = delay !== null ? delay : (touchConfig?.throttleMs || 16);

        return (event) => {
            const now = Date.now();

            if (now - this.lastTouchTime >= throttleMs) {
                this.lastTouchTime = now;
                handler(event);
            }
        };
    }

    /**
     * 클릭/탭 이벤트는 스로틀하지 않고 즉시 처리
     * @param {Function} handler - 원본 이벤트 핸들러
     * @returns {Function} 원본 핸들러 (스로틀 안함)
     */
    handleClick(handler) {
        return handler; // 클릭은 스로틀 안함 (응답성 유지)
    }

    /**
     * passive 리스너 옵션 반환
     * @returns {Object} addEventListener의 options 객체
     */
    getPassiveOptions() {
        const touchConfig = GameConfig?.constants?.performance?.touchOptimization;

        if (touchConfig?.usePassiveListeners) {
            return { passive: true };
        }

        return {};
    }
}

// 전역 인스턴스 생성
window.TouchOptimizer = TouchOptimizer;
window.touchOptimizer = new TouchOptimizer();
