/**
 * 글로벌 리더보드 API 클라이언트
 * Supabase를 사용하여 리더보드 데이터 관리
 */

// Supabase 인스턴스 싱글톤 (중복 생성 방지)
let _supabaseInstance = null;

// localStorage 대체용 메모리 저장소 (카카오톡 브라우저 등 localStorage 차단 시)
const _memoryStorage = new Map();

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
        this.initRetryCount = 0;
        this.maxRetries = GameConfig?.leaderboard?.initRetries || 3;

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
     * Supabase 클라이언트 초기화 (재시도 로직 포함)
     */
    init() {
        try {
            const debugMode = GameConfig?.leaderboard?.debugMode?.enabled || false;

            // 디버깅 로그: 브라우저 정보
            if (debugMode) {
                console.log('[LeaderboardClient][DEBUG] Browser UA:', navigator.userAgent);
                console.log('[LeaderboardClient][DEBUG] window.supabase:', typeof window.supabase);
            }

            // Supabase JS SDK가 로드되었는지 확인
            if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
                console.error('[LeaderboardClient] Supabase SDK not loaded');

                // 재시도 로직 (카카오톡 브라우저 등에서 SDK 로딩 지연 대응)
                if (this.initRetryCount < this.maxRetries) {
                    this.initRetryCount++;
                    const retryDelay = GameConfig?.leaderboard?.retryDelay || 1000;
                    console.warn(`[LeaderboardClient] Retrying initialization (${this.initRetryCount}/${this.maxRetries}) after ${retryDelay}ms...`);

                    setTimeout(() => {
                        this.init();
                    }, retryDelay);
                    return;
                } else {
                    console.error('[LeaderboardClient] SDK load failed after max retries');
                    this.logError('SDK_NOT_LOADED', 'Supabase SDK failed to load after retries');
                }
                return;
            }

            const url = this.config?.supabaseUrl;
            const key = this.config?.supabaseAnonKey;

            if (!url || !key) {
                console.error('[LeaderboardClient] Missing Supabase credentials');
                this.logError('MISSING_CREDENTIALS', 'Supabase URL or API key not configured');
                return;
            }

            if (debugMode) {
                console.log('[LeaderboardClient][DEBUG] Creating Supabase client...');
                console.log('[LeaderboardClient][DEBUG] URL:', url);
            }

            this.supabase = window.supabase.createClient(url, key);
            _supabaseInstance = this.supabase;  // 전역 저장 (싱글톤)
            window._supabaseInstance = this.supabase;  // window 객체에도 노출 (VersionChecker 접근용)
            this.initialized = true;

            if (GameConfig?.debugMode?.showSystemInitialization || debugMode) {
                console.log('[LeaderboardClient] Initialized successfully (new instance)');
            }
        } catch (error) {
            console.error('[LeaderboardClient] Initialization error:', error);
            this.logError('INIT_EXCEPTION', error.message, error.stack);
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
                this.logError('SUBMIT_FAILED', error.message, error.stack || JSON.stringify(error));
                return { success: false, error: error.message };
            }

            // 쿨다운 타임스탬프 저장
            this.setLastSubmitTime();

            console.log('[LeaderboardClient] Score submitted successfully:', data);
            return { success: true, data: data[0] };

        } catch (error) {
            console.error('[LeaderboardClient] Submit exception:', error);
            this.logError('SUBMIT_EXCEPTION', error.message, error.stack);
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
                this.logError('FETCH_FAILED', error.message, error.stack || JSON.stringify(error));
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
            this.logError('FETCH_EXCEPTION', error.message, error.stack);
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
            const { isGameComplete, finalStage, gameVersion, totalTurns, totalDamageDealt, totalDamageReceived } = playerData;

            // 6단계 정렬 기준으로 상위 레코드 카운트
            let query = this.supabase
                .from(this.config.tableName)
                .select('*', { count: 'exact', head: true });

            // is_game_complete 기준으로 분기
            if (isGameComplete) {
                // 완료한 경우: 완료한 레코드 중에서만 비교
                query = query.or(
                    // 1순위: 스테이지가 더 높음
                    `and(is_game_complete.eq.true,final_stage.gt.${finalStage}),` +
                    // 2순위: 스테이지 같고, 버전이 더 높음 (zero-padded 문자열 비교)
                    `and(is_game_complete.eq.true,final_stage.eq.${finalStage},game_version.gt.${gameVersion}),` +
                    // 3순위: 스테이지, 버전 같고, 턴수가 더 적음
                    `and(is_game_complete.eq.true,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.lt.${totalTurns}),` +
                    // 4순위: 스테이지, 버전, 턴수 같고, 딜량이 더 적음
                    `and(is_game_complete.eq.true,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.eq.${totalTurns},total_damage_dealt.lt.${totalDamageDealt}),` +
                    // 5순위: 스테이지, 버전, 턴수, 딜량 같고, 받은피해가 더 많음
                    `and(is_game_complete.eq.true,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.eq.${totalTurns},total_damage_dealt.eq.${totalDamageDealt},total_damage_received.gt.${totalDamageReceived})`
                );
            } else {
                // 미완료한 경우: 완료한 레코드는 모두 상위 + 미완료 중 비교
                query = query.or(
                    // 0순위: 게임 완료한 레코드는 모두 상위
                    `is_game_complete.eq.true,` +
                    // 1순위: 스테이지가 더 높음
                    `and(is_game_complete.eq.false,final_stage.gt.${finalStage}),` +
                    // 2순위: 스테이지 같고, 버전이 더 높음 (zero-padded 문자열 비교)
                    `and(is_game_complete.eq.false,final_stage.eq.${finalStage},game_version.gt.${gameVersion}),` +
                    // 3순위: 스테이지, 버전 같고, 턴수가 더 적음
                    `and(is_game_complete.eq.false,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.lt.${totalTurns}),` +
                    // 4순위: 스테이지, 버전, 턴수 같고, 딜량이 더 적음
                    `and(is_game_complete.eq.false,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.eq.${totalTurns},total_damage_dealt.lt.${totalDamageDealt}),` +
                    // 5순위: 스테이지, 버전, 턴수, 딜량 같고, 받은피해가 더 많음
                    `and(is_game_complete.eq.false,final_stage.eq.${finalStage},game_version.eq.${gameVersion},total_turns.eq.${totalTurns},total_damage_dealt.eq.${totalDamageDealt},total_damage_received.gt.${totalDamageReceived})`
                );
            }

            const { count, error } = await query;

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
     * 안전한 스토리지 접근 (localStorage 차단 시 메모리 저장소 사용)
     * @param {string} key - 키
     * @returns {string|null}
     */
    safeGetItem(key) {
        try {
            const value = localStorage.getItem(key);
            return value;
        } catch (error) {
            // localStorage 접근 불가 (카카오톡 브라우저 등)
            if (GameConfig?.leaderboard?.debugMode?.enabled) {
                console.warn('[LeaderboardClient][DEBUG] localStorage access failed, using memory fallback:', error.message);
            }
            return _memoryStorage.get(key) || null;
        }
    }

    /**
     * 안전한 스토리지 쓰기 (localStorage 차단 시 메모리 저장소 사용)
     * @param {string} key - 키
     * @param {string} value - 값
     */
    safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            // localStorage 접근 불가 (카카오톡 브라우저 등)
            if (GameConfig?.leaderboard?.debugMode?.enabled) {
                console.warn('[LeaderboardClient][DEBUG] localStorage write failed, using memory fallback:', error.message);
            }
            _memoryStorage.set(key, value);
        }
    }

    /**
     * 쿨다운 체크 (안전한 스토리지 접근)
     * @returns {{allowed: boolean, remainingSeconds?: number}}
     */
    checkCooldown() {
        const lastSubmitKey = this.config?.lastSubmitKey || 'leaderboard_last_submit_time';
        const lastSubmit = this.safeGetItem(lastSubmitKey);

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
     * 마지막 제출 시간 저장 (안전한 스토리지 접근)
     */
    setLastSubmitTime() {
        const lastSubmitKey = this.config?.lastSubmitKey || 'leaderboard_last_submit_time';
        this.safeSetItem(lastSubmitKey, Date.now().toString());
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

    /**
     * 에러 로깅 (디버깅용 상세 정보 수집)
     * @param {string} errorCode - 에러 코드 (예: 'SDK_NOT_LOADED', 'SUBMIT_FAILED')
     * @param {string} message - 에러 메시지
     * @param {string} [stack] - 스택 트레이스 (선택)
     */
    logError(errorCode, message, stack = null) {
        const debugMode = GameConfig?.leaderboard?.debugMode?.enabled || false;

        if (debugMode) {
            console.group(`[LeaderboardClient][ERROR] ${errorCode}`);
            console.error('Message:', message);
            console.error('Browser UA:', navigator.userAgent);
            console.error('Initialized:', this.initialized);
            console.error('Supabase instance:', this.supabase ? 'exists' : 'null');
            console.error('window.supabase:', typeof window.supabase);

            if (stack) {
                console.error('Stack trace:', stack);
            }

            console.groupEnd();
        }

        // 에러를 window 객체에 저장 (외부 디버깅용)
        if (!window._leaderboardErrors) {
            window._leaderboardErrors = [];
        }

        window._leaderboardErrors.push({
            code: errorCode,
            message,
            stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // 최대 10개까지만 저장 (메모리 절약)
        if (window._leaderboardErrors.length > 10) {
            window._leaderboardErrors.shift();
        }
    }
}

// 전역 객체로 등록
window.LeaderboardClient = LeaderboardClient;
console.log('[LeaderboardClient] Class loaded');
