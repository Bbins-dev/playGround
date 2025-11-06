// 타이머 관리 시스템 - 메모리 누수 방지 및 게임 속도 통합
class TimerManager {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.nextId = 0;
        this.gameSpeed = 1; // 전역 게임 속도 배율 (1=보통, 2=2배속, 3=3배속, 4=4배속)
        // GameConfig가 로드되면 값을 가져오고, 없으면 기본값 사용
        this.minTimingThreshold = (typeof GameConfig !== 'undefined' && GameConfig?.gameSpeed?.minTimingThreshold) || 50;

        // 속도 곡선 - 고속에서 더 공격적인 배율 적용
        this.speedCurve = {
            1: 1.0,    // 느림 (실제 2x 버튼)
            2: 2.0,
            3: 3.0,    // 보통 (실제 3x 버튼)
            4: 4.0,
            5: 5.0,    // 빠름 (실제 5x 버튼)
            6: 7.5,    // (미사용)
            7: 10.0    // 매우빠름 (실제 7x 버튼) - 초공격적 배율
        };
    }

    /**
     * 게임 속도 설정
     * @param {number} speed - 속도 배율 (1~7)
     */
    setGameSpeed(speed) {
        this.gameSpeed = Math.max(1, Math.min(7, speed)); // 1~7 범위로 제한 (초고속 지원)
    }

    /**
     * 게임 속도를 적용한 실제 딜레이 계산
     * @param {number} baseDelay - 기본 딜레이 (ms)
     * @returns {number} 속도가 적용된 실제 딜레이
     */
    applyGameSpeed(baseDelay) {
        // 입력값 검증
        if (typeof baseDelay !== 'number' || baseDelay < 0 || !isFinite(baseDelay)) {
            console.warn(`[TimerManager] 잘못된 딜레이 값: ${baseDelay}, 최소값 사용`);
            return this.minTimingThreshold;
        }

        // speedCurve를 사용하여 효과적인 속도 계산
        const effectiveSpeed = this.speedCurve[this.gameSpeed] || this.gameSpeed;
        const adjusted = Math.round(baseDelay / effectiveSpeed);
        const result = Math.max(this.minTimingThreshold, adjusted);

        // 극단적으로 빠른 경우 경고
        if (result === this.minTimingThreshold && baseDelay > this.minTimingThreshold * 2) {
            console.warn(`[TimerManager] 타이밍이 너무 빨라짐: ${baseDelay}ms → ${result}ms (속도: ${this.gameSpeed}x, 실제: ${effectiveSpeed}x)`);
        }

        return result;
    }

    // setTimeout 래퍼
    setTimeout(callback, delay, description = '') {
        const id = this.nextId++;
        const timerId = setTimeout(() => {
            this.timers.delete(id);
            callback();
        }, delay);

        this.timers.set(id, {
            id: timerId,
            type: 'timeout',
            description,
            createdAt: Date.now()
        });

        return id;
    }

    // setInterval 래퍼
    setInterval(callback, interval, description = '') {
        const id = this.nextId++;
        const timerId = setInterval(callback, interval);

        this.intervals.set(id, {
            id: timerId,
            type: 'interval',
            description,
            createdAt: Date.now()
        });

        return id;
    }

    // 타이머 취소
    clearTimeout(id) {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer.id);
            this.timers.delete(id);
            return true;
        }
        return false;
    }

    // 인터벌 취소
    clearInterval(id) {
        const interval = this.intervals.get(id);
        if (interval) {
            clearInterval(interval.id);
            this.intervals.delete(id);
            return true;
        }
        return false;
    }

    // 모든 타이머 정리
    clearAll() {
        // 모든 setTimeout 정리
        for (const [id, timer] of this.timers) {
            clearTimeout(timer.id);
        }
        this.timers.clear();

        // 모든 setInterval 정리
        for (const [id, interval] of this.intervals) {
            clearInterval(interval.id);
        }
        this.intervals.clear();
    }

    // 특정 설명의 타이머들 정리
    clearByDescription(description) {
        // timeout 정리
        for (const [id, timer] of this.timers) {
            if (timer.description === description) {
                clearTimeout(timer.id);
                this.timers.delete(id);
            }
        }

        // interval 정리
        for (const [id, interval] of this.intervals) {
            if (interval.description === description) {
                clearInterval(interval.id);
                this.intervals.delete(id);
            }
        }
    }

    // 활성 타이머 개수
    getActiveCount() {
        return {
            timeouts: this.timers.size,
            intervals: this.intervals.size,
            total: this.timers.size + this.intervals.size
        };
    }

    // 디버그 정보
    getDebugInfo() {
        const timeouts = Array.from(this.timers.entries()).map(([id, timer]) => ({
            id,
            description: timer.description,
            age: Date.now() - timer.createdAt
        }));

        const intervals = Array.from(this.intervals.entries()).map(([id, interval]) => ({
            id,
            description: interval.description,
            age: Date.now() - interval.createdAt
        }));

        return { timeouts, intervals };
    }

    // 지연된 콜백 실행 (Promise 기반)
    delay(ms, description = '') {
        return new Promise(resolve => {
            this.setTimeout(resolve, ms, description);
        });
    }

    // 조건부 타이머 (조건이 true가 될 때까지 대기)
    waitFor(condition, checkInterval = 100, timeout = 5000, description = '') {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const intervalId = this.setInterval(() => {
                if (condition()) {
                    this.clearInterval(intervalId);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    this.clearInterval(intervalId);
                    reject(new Error(`Timeout after ${timeout}ms`));
                }
            }, checkInterval, description);
        });
    }

    // 타이머 일시정지/재개 지원
    createPausableTimer(callback, delay, description = '') {
        let remaining = delay;
        let startTime = Date.now();
        let timerId = null;
        let isPaused = false;

        const start = () => {
            if (!isPaused) {
                timerId = this.setTimeout(() => {
                    callback();
                }, remaining, description);
                startTime = Date.now();
            }
        };

        const pause = () => {
            if (timerId && !isPaused) {
                this.clearTimeout(timerId);
                remaining -= Date.now() - startTime;
                isPaused = true;
            }
        };

        const resume = () => {
            if (isPaused) {
                isPaused = false;
                start();
            }
        };

        const cancel = () => {
            if (timerId) {
                this.clearTimeout(timerId);
            }
        };

        start();

        return { pause, resume, cancel };
    }

    /**
     * 게임 속도가 자동 적용되는 setTimeout
     * @param {Function} callback - 실행할 콜백 함수
     * @param {number} baseDelay - 기본 딜레이 (ms)
     * @param {string} description - 타이머 설명
     * @returns {number} 타이머 ID
     */
    speedAwareTimeout(callback, baseDelay, description = '') {
        const adjustedDelay = this.applyGameSpeed(baseDelay);
        return this.setTimeout(callback, adjustedDelay, description || `speed-aware:${baseDelay}ms`);
    }

    /**
     * 게임 속도가 자동 적용되는 setInterval
     * @param {Function} callback - 실행할 콜백 함수
     * @param {number} baseInterval - 기본 간격 (ms)
     * @param {string} description - 인터벌 설명
     * @returns {number} 인터벌 ID
     */
    speedAwareInterval(callback, baseInterval, description = '') {
        const adjustedInterval = this.applyGameSpeed(baseInterval);
        return this.setInterval(callback, adjustedInterval, description || `speed-aware-interval:${baseInterval}ms`);
    }

    /**
     * 게임 속도가 자동 적용되는 Promise 기반 딜레이
     * @param {number} baseDelay - 기본 딜레이 (ms)
     * @param {string} description - 설명
     * @returns {Promise} 지연 Promise
     */
    speedAwareDelay(baseDelay, description = '') {
        return new Promise(resolve => {
            this.speedAwareTimeout(resolve, baseDelay, description || `speed-aware-delay:${baseDelay}ms`);
        });
    }
}

// 전역 인스턴스
window.TimerManager = new TimerManager();