/**
 * 글로벌 리더보드 API 클라이언트
 * Supabase를 사용하여 리더보드 데이터 관리
 */

// Supabase 인스턴스 싱글톤 (중복 생성 방지)
let _supabaseInstance = null;

/**
 * 버전 문자열을 zero-padded 형식으로 변환
 * @param {string} version - 버전 문자열 (예: '0.9.3')
 * @returns {string} - zero-padded 버전 (예: '000.009.003')
 */
function versionToPadded(version) {
    if (!version || typeof version !== 'string') {
        return '000.000.000';
    }

    const parts = version.split('.');
    if (parts.length !== 3) {
        return '000.000.000';
    }

    return parts.map(part => part.padStart(3, '0')).join('.');
}

/**
 * zero-padded 버전을 일반 형식으로 변환
 * @param {string} padded - zero-padded 버전 (예: '000.009.003')
 * @returns {string} - 일반 버전 (예: '0.9.3')
 */
function paddedToVersion(padded) {
    if (!padded || typeof padded !== 'string') {
        return '0.0.0';
    }

    const parts = padded.split('.');
    if (parts.length !== 3) {
        return '0.0.0';
    }

    return parts.map(part => parseInt(part, 10).toString()).join('.');
}

class LeaderboardClient {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.config = GameConfig?.leaderboard;

        if (!this.config?.enabled) {
            console.warn('[LeaderboardClient] Leaderboard is disabled in GameConfig');
            return;
        }

        // 기존 Supabase 인스턴스가 있으면 재사용
        if (_supabaseInstance) {
            this.supabase = _supabaseInstance;
            window._supabaseInstance = _supabaseInstance;  // window 객체에도 노출
            this.initialized = true;
            if (GameConfig?.debugMode?.showSystemInitialization) {
                console.log('[LeaderboardClient] Reusing existing Supabase instance');
            }
            return;
        }

        this.init();
    }

    /**
     * Supabase 클라이언트 초기화
     */
    init() {
        try {
            // Supabase JS SDK가 로드되었는지 확인
            if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
                console.error('[LeaderboardClient] Supabase SDK not loaded');
                return;
            }

            const url = this.config?.supabaseUrl;
            const key = this.config?.supabaseAnonKey;

            if (!url || !key) {
                console.error('[LeaderboardClient] Missing Supabase credentials');
                return;
            }

            this.supabase = window.supabase.createClient(url, key);
            _supabaseInstance = this.supabase;  // 전역 저장 (싱글톤)
            window._supabaseInstance = this.supabase;  // window 객체에도 노출 (VersionChecker 접근용)
            this.initialized = true;
            if (GameConfig?.debugMode?.showSystemInitialization) {
                console.log('[LeaderboardClient] Initialized successfully (new instance)');
            }
        } catch (error) {
            console.error('[LeaderboardClient] Initialization error:', error);
        }
    }

    /**
     * 리더보드에 점수 제출
     * @param {Object} gameData - 게임 데이터
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async submitScore(gameData) {
        if (!this.initialized) {
            return { success: false, error: 'Client not initialized' };
        }

        // 쿨다운 체크
        const cooldownCheck = this.checkCooldown();
        if (!cooldownCheck.allowed) {
            return {
                success: false,
                error: 'cooldown',
                remainingSeconds: cooldownCheck.remainingSeconds
            };
        }

        try {
            // 데이터 검증
            const validatedData = this.validateGameData(gameData);
            if (!validatedData.valid) {
                return { success: false, error: validatedData.error };
            }

            // 제출 데이터 구성
            const submitData = {
                player_name: gameData.playerName || 'Unknown',
                final_stage: gameData.finalStage || 1,
                total_turns: gameData.totalTurns || 0,
                total_damage_dealt: gameData.totalDamageDealt || 0,
                total_damage_received: gameData.totalDamageReceived || 0,
                total_defense_built: gameData.totalDefenseBuilt || 0,
                is_game_complete: gameData.isGameComplete || false,
                defense_element: gameData.defenseElement || 'normal',
                game_version: versionToPadded(GameConfig?.versionInfo?.number || '0.0.0'),  // zero-padded 형식으로 저장
                final_hand: this.serializeFinalHand(gameData.finalHand)
            };

            // Supabase에 삽입
            const { data, error } = await this.supabase
                .from(this.config.tableName)
                .insert([submitData])
                .select();

            if (error) {
                console.error('[LeaderboardClient] Submit error:', error);
                return { success: false, error: error.message };
            }

            // 쿨다운 타임스탬프 저장
            this.setLastSubmitTime();

            console.log('[LeaderboardClient] Score submitted successfully:', data);
            return { success: true, data: data[0] };

        } catch (error) {
            console.error('[LeaderboardClient] Submit exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 리더보드 조회 (페이징)
     * @param {number} page - 페이지 번호 (1부터 시작)
     * @returns {Promise<{success: boolean, data?: Array, totalCount?: number, error?: string}>}
     */
    async fetchLeaderboard(page = 1) {
        if (!this.initialized) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const pageSize = this.config?.pageSize || 50;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // 6단계 정렬로 리더보드 조회
            const { data, error, count } = await this.supabase
                .from(this.config.tableName)
                .select('*', { count: 'exact' })
                .order('is_game_complete', { ascending: false })  // 1순위: 게임 완료 여부
                .order('final_stage', { ascending: false })      // 2순위: 높은 스테이지
                .order('game_version', { ascending: false })     // 3순위: 최신 버전 (zero-padded)
                .order('total_turns', { ascending: true })        // 4순위: 적은 턴수
                .order('total_damage_dealt', { ascending: true }) // 5순위: 적은 딜량
                .order('total_damage_received', { ascending: false }) // 6순위: 많은 피해
                .range(from, to);

            if (error) {
                console.error('[LeaderboardClient] Fetch error:', error);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data: data || [],
                totalCount: count || 0,
                currentPage: page,
                totalPages: Math.ceil((count || 0) / pageSize)
            };

        } catch (error) {
            console.error('[LeaderboardClient] Fetch exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 플레이어 이름으로 검색 (부분 일치)
     * @param {string} playerName - 검색할 플레이어 이름
     * @param {number} page - 페이지 번호
     * @returns {Promise<{success: boolean, data?: Array, totalCount?: number, currentPage?: number, totalPages?: number, error?: string}>}
     */
    async searchPlayers(playerName, page = 1) {
        if (!this.initialized) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const pageSize = this.config?.pageSize || 50;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // ILIKE로 부분 일치 검색 + 6단계 정렬
            const { data, error, count } = await this.supabase
                .from(this.config.tableName)
                .select('*', { count: 'exact' })
                .ilike('player_name', `%${playerName}%`)  // 부분 일치 검색
                .order('is_game_complete', { ascending: false })  // 1순위: 게임 완료 여부
                .order('final_stage', { ascending: false })      // 2순위: 높은 스테이지
                .order('game_version', { ascending: false })     // 3순위: 최신 버전 (zero-padded)
                .order('total_turns', { ascending: true })        // 4순위: 적은 턴수
                .order('total_damage_dealt', { ascending: true }) // 5순위: 적은 딜량
                .order('total_damage_received', { ascending: false }) // 6순위: 많은 피해
                .range(from, to);

            if (error) {
                console.error('[LeaderboardClient] Search error:', error);
                return { success: false, error: error.message };
            }

            // 각 검색 결과에 실제 글로벌 순위 추가
            const dataWithRanks = await Promise.all(
                (data || []).map(async (record) => {
                    const globalRank = await this.calculateGlobalRank(record);
                    return {
                        ...record,
                        globalRank
                    };
                })
            );

            return {
                success: true,
                data: dataWithRanks,
                totalCount: count || 0,
                currentPage: page,
                totalPages: Math.ceil((count || 0) / pageSize)
            };

        } catch (error) {
            console.error('[LeaderboardClient] Search exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 특정 레코드의 글로벌 순위 계산
     * @param {Object} record - 리더보드 레코드
     * @returns {Promise<number|null>}
     */
    async calculateGlobalRank(record) {
        try {
            // 6단계 정렬 기준으로 이 레코드보다 상위인 레코드 수 계산
            let query = this.supabase
                .from(this.config.tableName)
                .select('*', { count: 'exact', head: true });

            // is_game_complete 기준으로 분기
            if (record.is_game_complete) {
                // 완료한 경우: 완료한 레코드 중에서만 비교
                query = query.or(
                    // 1순위: 스테이지가 더 높음
                    `and(is_game_complete.eq.true,final_stage.gt.${record.final_stage}),` +
                    // 2순위: 스테이지 같고, 버전이 더 높음 (zero-padded 문자열 비교)
                    `and(is_game_complete.eq.true,final_stage.eq.${record.final_stage},game_version.gt.${record.game_version}),` +
                    // 3순위: 스테이지, 버전 같고, 턴수가 더 적음
                    `and(is_game_complete.eq.true,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.lt.${record.total_turns}),` +
                    // 4순위: 스테이지, 버전, 턴수 같고, 딜량이 더 적음
                    `and(is_game_complete.eq.true,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.eq.${record.total_turns},total_damage_dealt.lt.${record.total_damage_dealt}),` +
                    // 5순위: 스테이지, 버전, 턴수, 딜량 같고, 받은피해가 더 많음
                    `and(is_game_complete.eq.true,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.eq.${record.total_turns},total_damage_dealt.eq.${record.total_damage_dealt},total_damage_received.gt.${record.total_damage_received})`
                );
            } else {
                // 미완료한 경우: 완료한 레코드는 모두 상위 + 미완료 중 비교
                query = query.or(
                    // 0순위: 게임 완료한 레코드는 모두 상위
                    `is_game_complete.eq.true,` +
                    // 1순위: 스테이지가 더 높음
                    `and(is_game_complete.eq.false,final_stage.gt.${record.final_stage}),` +
                    // 2순위: 스테이지 같고, 버전이 더 높음 (zero-padded 문자열 비교)
                    `and(is_game_complete.eq.false,final_stage.eq.${record.final_stage},game_version.gt.${record.game_version}),` +
                    // 3순위: 스테이지, 버전 같고, 턴수가 더 적음
                    `and(is_game_complete.eq.false,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.lt.${record.total_turns}),` +
                    // 4순위: 스테이지, 버전, 턴수 같고, 딜량이 더 적음
                    `and(is_game_complete.eq.false,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.eq.${record.total_turns},total_damage_dealt.lt.${record.total_damage_dealt}),` +
                    // 5순위: 스테이지, 버전, 턴수, 딜량 같고, 받은피해가 더 많음
                    `and(is_game_complete.eq.false,final_stage.eq.${record.final_stage},game_version.eq.${record.game_version},total_turns.eq.${record.total_turns},total_damage_dealt.eq.${record.total_damage_dealt},total_damage_received.gt.${record.total_damage_received})`
                );
            }

            const { count, error } = await query;

            if (error) {
                console.error('[LeaderboardClient] Rank calculation error:', error);
                return null;
            }

            return (count || 0) + 1;

        } catch (error) {
            console.error('[LeaderboardClient] Rank calculation exception:', error);
            return null;
        }
    }

    /**
     * 특정 플레이어 데이터로 순위 확인
     * @param {Object} playerData - 플레이어 데이터
     * @returns {Promise<{success: boolean, rank?: number, error?: string}>}
     */
    async getMyRank(playerData) {
        if (!this.initialized) {
            return { success: false, error: 'Client not initialized' };
        }

        try {
            const { finalStage, totalTurns, totalDamageDealt, totalDamageReceived } = playerData;

            // 4단계 정렬 조건으로 상위 기록 카운트
            const { count, error } = await this.supabase
                .from(this.config.tableName)
                .select('*', { count: 'exact', head: true })
                .or(`final_stage.gt.${finalStage},` +
                    `and(final_stage.eq.${finalStage},total_turns.lt.${totalTurns}),` +
                    `and(final_stage.eq.${finalStage},total_turns.eq.${totalTurns},total_damage_dealt.lt.${totalDamageDealt}),` +
                    `and(final_stage.eq.${finalStage},total_turns.eq.${totalTurns},total_damage_dealt.eq.${totalDamageDealt},total_damage_received.gt.${totalDamageReceived})`
                );

            if (error) {
                console.error('[LeaderboardClient] Rank check error:', error);
                return { success: false, error: error.message };
            }

            const rank = (count || 0) + 1;
            return { success: true, rank };

        } catch (error) {
            console.error('[LeaderboardClient] Rank check exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 쿨다운 체크
     * @returns {{allowed: boolean, remainingSeconds?: number}}
     */
    checkCooldown() {
        const lastSubmitKey = this.config?.lastSubmitKey || 'leaderboard_last_submit_time';
        const lastSubmit = localStorage.getItem(lastSubmitKey);

        if (!lastSubmit) {
            return { allowed: true };
        }

        const lastSubmitTime = parseInt(lastSubmit, 10);
        const now = Date.now();
        const cooldown = this.config?.submitCooldown || 60000; // 기본 60초
        const elapsed = now - lastSubmitTime;

        if (elapsed < cooldown) {
            const remainingMs = cooldown - elapsed;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            return { allowed: false, remainingSeconds };
        }

        return { allowed: true };
    }

    /**
     * 마지막 제출 시간 저장
     */
    setLastSubmitTime() {
        const lastSubmitKey = this.config?.lastSubmitKey || 'leaderboard_last_submit_time';
        localStorage.setItem(lastSubmitKey, Date.now().toString());
    }

    /**
     * 최종 손패 직렬화 (용량 절약을 위해 null 반환)
     * @param {Array} finalHand - 카드 배열
     * @returns {null} - 데이터베이스 용량 절약을 위해 항상 null 반환
     */
    serializeFinalHand(finalHand) {
        // 무료 Supabase 용량 절약을 위해 손패 데이터를 저장하지 않음
        return null;
    }

    /**
     * 게임 데이터 검증
     * @param {Object} gameData - 검증할 게임 데이터
     * @returns {{valid: boolean, error?: string}}
     */
    validateGameData(gameData) {
        if (!gameData) {
            return { valid: false, error: 'No game data provided' };
        }

        const { playerName, finalStage, totalTurns, totalDamageDealt, totalDamageReceived } = gameData;

        // 필수 필드 체크
        if (!playerName || playerName.trim().length === 0) {
            return { valid: false, error: 'Player name is required' };
        }

        // 이름 길이 체크 (20자 제한)
        if (playerName.length > 20) {
            return { valid: false, error: 'Player name too long (max 20)' };
        }

        // 스테이지 범위 체크 (1-60)
        if (finalStage < 1 || finalStage > 60) {
            return { valid: false, error: 'Invalid stage number (1-60)' };
        }

        // 턴수 범위 체크 (0-10000)
        if (totalTurns < 0 || totalTurns > 10000) {
            return { valid: false, error: 'Invalid turn count' };
        }

        // 딜량/피해 범위 체크
        if (totalDamageDealt < 0 || totalDamageDealt > 1000000) {
            return { valid: false, error: 'Invalid damage dealt' };
        }

        if (totalDamageReceived < 0 || totalDamageReceived > 1000000) {
            return { valid: false, error: 'Invalid damage received' };
        }

        // 방어 속성 검증 (fire, water, electric, poison, normal만 허용)
        const validElements = ['fire', 'water', 'electric', 'poison', 'normal'];
        const defenseElement = gameData.defenseElement || 'normal';
        if (!validElements.includes(defenseElement)) {
            return { valid: false, error: 'Invalid defense element' };
        }

        return { valid: true };
    }
}

// 전역 객체로 등록
window.LeaderboardClient = LeaderboardClient;
console.log('[LeaderboardClient] Class loaded');
