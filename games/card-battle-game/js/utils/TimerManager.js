// 타이머 관리 시스템 - 메모리 누수 방지
class TimerManager {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.nextId = 0;
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
}

// 전역 인스턴스
window.TimerManager = new TimerManager();