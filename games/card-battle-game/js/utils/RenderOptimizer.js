// 렌더링 최적화 시스템 - Dirty checking과 캐싱
class RenderOptimizer {
    constructor() {
        this.dirtyRegions = new Set();
        this.cache = new Map();
        this.lastRenderState = {};
        this.frameCount = 0;
        this.lastCacheCleanup = 0;
        this.cacheTimeout = (typeof GameConfig !== 'undefined' && GameConfig.rendering?.cacheTimeout) || 5000;
    }

    // 더티 영역 마킹
    markDirty(region) {
        if (typeof region === 'string') {
            this.dirtyRegions.add(region);
        } else if (region && typeof region === 'object') {
            // 영역 객체 {x, y, width, height, id}
            const regionId = region.id || `${region.x}_${region.y}_${region.width}_${region.height}`;
            this.dirtyRegions.add(regionId);
        }
    }

    // 영역이 더티한지 확인
    isDirty(regionId) {
        return this.dirtyRegions.has(regionId);
    }

    // 상태 변경 체크
    hasStateChanged(key, newValue) {
        const oldValue = this.lastRenderState[key];
        const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);

        if (changed) {
            this.lastRenderState[key] = JSON.parse(JSON.stringify(newValue));
            this.markDirty(key);
        }

        return changed;
    }

    // 렌더링 결과 캐싱
    cacheRender(key, renderFunction, ...args) {
        const cacheKey = `${key}_${JSON.stringify(args)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.result;
        }

        const result = renderFunction(...args);
        this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });

        return result;
    }

    // 조건부 렌더링 - 더티하거나 강제 렌더링일 때만
    conditionalRender(regionId, renderFunction, force = false) {
        if (force || this.isDirty(regionId)) {
            renderFunction();
            this.dirtyRegions.delete(regionId);
            return true;
        }
        return false;
    }

    // 배치 렌더링 - 여러 영역을 한 번에 처리
    batchRender(regions, batchFunction) {
        const dirtyRegions = regions.filter(region => this.isDirty(region.id));

        if (dirtyRegions.length > 0) {
            batchFunction(dirtyRegions);
            dirtyRegions.forEach(region => this.dirtyRegions.delete(region.id));
            return true;
        }
        return false;
    }

    // 프레임 시작 - 최적화 체크
    beginFrame() {
        this.frameCount++;

        // 주기적으로 캐시 정리 (60프레임마다)
        if (this.frameCount % 60 === 0) {
            this.cleanupCache();
        }
    }

    // 프레임 종료 - 정리
    endFrame() {
        // 매 프레임 후 더티 영역 일부 정리 (다음 프레임에서 사용되지 않을 수 있음)
        // 하지만 중요한 영역은 유지
    }

    // 모든 영역을 더티로 마킹 (전체 다시 그리기)
    markAllDirty() {
        // 주요 렌더링 영역들 추가
        const mainRegions = [
            'player-hand', 'enemy-hand', 'player-info', 'enemy-info',
            'battle-area', 'ui-overlay', 'background', 'effects'
        ];

        mainRegions.forEach(region => this.markDirty(region));
    }

    // 캐시 정리
    cleanupCache() {
        const now = Date.now();
        const toDelete = [];

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.cache.delete(key));
        this.lastCacheCleanup = now;
    }

    // 성능 통계
    getStats() {
        return {
            dirtyRegions: this.dirtyRegions.size,
            cacheSize: this.cache.size,
            frameCount: this.frameCount,
            lastCacheCleanup: this.lastCacheCleanup
        };
    }

    // 모든 상태 초기화
    reset() {
        this.dirtyRegions.clear();
        this.cache.clear();
        this.lastRenderState = {};
        this.frameCount = 0;
    }

    // 특정 카테고리의 더티 영역 정리
    clearDirtyCategory(prefix) {
        const toDelete = [];
        for (const region of this.dirtyRegions) {
            if (region.startsWith(prefix)) {
                toDelete.push(region);
            }
        }
        toDelete.forEach(region => this.dirtyRegions.delete(region));
    }

    // 렌더링 스킵 최적화 - FPS 기반
    shouldSkipRender(targetFPS = 60) {
        const maxFPS = (typeof GameConfig !== 'undefined' && GameConfig.rendering?.maxFPS) || 60;
        const skipRate = Math.max(1, Math.floor(maxFPS / targetFPS));
        return this.frameCount % skipRate !== 0;
    }

    // 영역별 우선순위 렌더링
    priorityRender(priorities) {
        const sortedRegions = Array.from(this.dirtyRegions).sort((a, b) => {
            const priorityA = priorities[a] || 0;
            const priorityB = priorities[b] || 0;
            return priorityB - priorityA; // 높은 우선순위부터
        });

        return sortedRegions;
    }

    // 뷰포트 컬링 - 화면에 보이지 않는 요소 제외
    isInViewport(x, y, width, height, viewportX = 0, viewportY = 0, viewportWidth, viewportHeight) {
        // GameConfig 기본값 설정
        if (typeof viewportWidth === 'undefined') {
            viewportWidth = (typeof GameConfig !== 'undefined' && GameConfig.canvas?.width) || 1247;
        }
        if (typeof viewportHeight === 'undefined') {
            viewportHeight = (typeof GameConfig !== 'undefined' && GameConfig.canvas?.height) || 832;
        }

        return !(x + width < viewportX ||
                 x > viewportX + viewportWidth ||
                 y + height < viewportY ||
                 y > viewportY + viewportHeight);
    }

    // 거리 기반 컬링
    isWithinCullDistance(x1, y1, x2, y2, maxDistance) {
        if (typeof maxDistance === 'undefined') {
            maxDistance = (typeof GameConfig !== 'undefined' && GameConfig.rendering?.cullDistance) || 100;
        }
        const dx = x2 - x1;
        const dy = y2 - y1;
        return (dx * dx + dy * dy) <= (maxDistance * maxDistance);
    }
}

// 전역 인스턴스
window.RenderOptimizer = new RenderOptimizer();