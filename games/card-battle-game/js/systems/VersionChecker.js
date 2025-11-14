/**
 * VersionChecker - 자동 버전 업데이트 체크 시스템
 *
 * Supabase에서 최신 버전을 조회하여 현재 버전과 비교
 * 불일치 시 강제 새로고침 (사용자 선택권 없음, YAGNI 원칙)
 *
 * @class VersionChecker
 * @description Configuration-Driven, 최소한의 코드로 최대 효과
 */
class VersionChecker {
    /**
     * @param {object} supabaseClient - Supabase 클라이언트 인스턴스 (LeaderboardClient와 공유)
     */
    constructor(supabaseClient = null) {
        // Configuration-driven: GameConfig에서 모든 설정 가져오기
        this.config = GameConfig?.leaderboard?.versionCheck || {};
        this.currentVersion = GameConfig?.versionInfo?.number || '0.0.0';

        // Supabase 클라이언트 (기존 인스턴스 재사용)
        this.supabase = supabaseClient || window._supabaseInstance || null;

        // 안전한 기본값
        this.enabled = this.config.enabled !== false;
        this.tableName = this.config.tableName || 'app_version';
    }

    /**
     * 버전 체크 실행 (비동기)
     * Supabase에서 최신 버전 조회 → 비교 → 불일치 시 강제 새로고침
     *
     * @returns {Promise<boolean>} true: 업데이트 발견 (새로고침 예정), false: 최신 버전
     */
    async checkVersion() {
        // 비활성화 시 스킵
        if (!this.enabled) {
            return false;
        }

        // Supabase 클라이언트 없으면 조용히 스킵
        if (!this.supabase) {
            console.warn('[VersionChecker] Supabase 클라이언트가 초기화되지 않았습니다.');
            return false;
        }

        try {
            // Supabase에서 최신 버전 조회
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('version')
                .limit(1)
                .single();

            // 에러 발생 시 조용히 무시 (사용자 경험 방해 금지)
            if (error) {
                console.warn('[VersionChecker] 버전 조회 실패 (조용히 무시):', error.message);
                return false;
            }

            const latestVersion = data?.version;

            // 버전 정보 없으면 스킵
            if (!latestVersion) {
                console.warn('[VersionChecker] 서버 버전 정보 없음');
                return false;
            }

            // 버전 비교
            if (latestVersion !== this.currentVersion) {
                console.log(`[VersionChecker] 새 버전 발견! 현재: ${this.currentVersion}, 최신: ${latestVersion}`);
                this.forceUpdate();
                return true;
            }

            // 최신 버전 사용 중
            console.log(`[VersionChecker] 최신 버전 사용 중: ${this.currentVersion}`);
            return false;

        } catch (err) {
            // 예외 발생 시 조용히 무시
            console.warn('[VersionChecker] 버전 체크 중 예외 발생 (조용히 무시):', err.message);
            return false;
        }
    }

    /**
     * 강제 새로고침 (캐시 무시)
     * 간단한 알림 표시 후 즉시 reload
     */
    forceUpdate() {
        // 간단한 메시지 표시
        alert('최신 버전 발견! 새로고침 중...');

        // 캐시 무시하고 강제 새로고침
        window.location.reload(true);
    }
}

// 전역 스코프에 노출 (다른 스크립트에서 사용 가능)
window.VersionChecker = VersionChecker;
