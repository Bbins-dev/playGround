/**
 * 글로벌 리더보드 UI 모달
 * 리더보드 데이터 표시 및 페이징 처리
 */

class LeaderboardModal {
    constructor() {
        this.modal = null;
        this.leaderboardClient = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.myRankData = null; // 내 순위 데이터 (선택적)

        this.init();
    }

    /**
     * 모달 초기화
     */
    init() {
        this.modal = document.getElementById('leaderboard-modal');

        if (!this.modal) {
            console.error('[LeaderboardModal] Modal element not found');
            return;
        }

        // LeaderboardClient 인스턴스 생성
        if (window.LeaderboardClient) {
            this.leaderboardClient = new LeaderboardClient();
        } else {
            console.error('[LeaderboardModal] LeaderboardClient not loaded');
        }

        this.setupEventListeners();
        console.log('[LeaderboardModal] Initialized');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 닫기 버튼
        const closeBtn = this.modal?.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 배경 클릭으로 닫기
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // 이전/다음 페이지 버튼
        const prevBtn = this.modal?.querySelector('.leaderboard-prev-btn');
        const nextBtn = this.modal?.querySelector('.leaderboard-next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevPage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                this.hide();
            }
        });
    }

    /**
     * 모달 표시
     * @param {Object} myRankData - 내 순위 하이라이트용 데이터 (선택)
     */
    async show(myRankData = null) {
        console.log('[LeaderboardModal] show() called');

        if (!this.modal) {
            console.error('[LeaderboardModal] Cannot show - modal not initialized');
            return;
        }

        this.myRankData = myRankData;
        this.currentPage = 1;

        this.modal.classList.remove('hidden');
        console.log('[LeaderboardModal] Modal visible (removed hidden class)');

        // 리더보드 로드
        await this.loadLeaderboard();
        console.log('[LeaderboardModal] Leaderboard loaded');
    }

    /**
     * 모달 숨기기
     */
    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    /**
     * 리더보드 데이터 로드
     */
    async loadLeaderboard() {
        console.log('[LeaderboardModal] loadLeaderboard() started, page:', this.currentPage);

        if (this.isLoading) {
            console.log('[LeaderboardModal] Already loading, skipping');
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            console.log('[LeaderboardModal] Fetching leaderboard data...');
            const result = await this.leaderboardClient.fetchLeaderboard(this.currentPage);
            console.log('[LeaderboardModal] Fetch result:', result);

            if (!result.success) {
                console.warn('[LeaderboardModal] Fetch failed:', result.error);
                this.showError(result.error);
                return;
            }

            this.totalPages = result.totalPages || 1;
            console.log('[LeaderboardModal] Total pages:', this.totalPages, 'Data count:', result.data?.length || 0);
            this.renderLeaderboard(result.data || []);
            this.updatePagination();

        } catch (error) {
            console.error('[LeaderboardModal] Load error:', error);
            this.showError('Failed to load leaderboard');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 리더보드 테이블 렌더링
     * @param {Array} data - 리더보드 데이터
     */
    renderLeaderboard(data) {
        const tbody = this.modal?.querySelector('.leaderboard-table tbody');
        if (!tbody) return;

        // 테이블 초기화
        tbody.innerHTML = '';

        if (data.length === 0) {
            this.showNoData();
            return;
        }

        // 시작 순위 계산
        const pageSize = GameConfig?.leaderboard?.pageSize || 50;
        const startRank = (this.currentPage - 1) * pageSize + 1;

        data.forEach((record, index) => {
            const rank = startRank + index;
            const row = this.createLeaderboardRow(record, rank);
            tbody.appendChild(row);
        });
    }

    /**
     * 리더보드 행 생성
     * @param {Object} record - 리더보드 기록
     * @param {number} rank - 순위
     * @returns {HTMLElement}
     */
    createLeaderboardRow(record, rank) {
        const row = document.createElement('tr');

        // 내 기록이면 하이라이트
        const isMyRecord = this.isMyRecord(record);
        if (isMyRecord) {
            row.classList.add('my-record');
        }

        // 순위
        const rankCell = document.createElement('td');
        rankCell.textContent = `#${rank}`;
        if (rank <= 3) {
            rankCell.classList.add(`rank-${rank}`);
        }
        row.appendChild(rankCell);

        // 플레이어 이름
        const nameCell = document.createElement('td');
        nameCell.textContent = record.player_name;
        if (isMyRecord) {
            nameCell.textContent += ' ★';
        }
        row.appendChild(nameCell);

        // 스테이지
        const stageCell = document.createElement('td');
        stageCell.textContent = record.final_stage;
        if (record.is_game_complete) {
            stageCell.textContent += ' 🏆';
        }
        row.appendChild(stageCell);

        // 턴수
        const turnsCell = document.createElement('td');
        turnsCell.textContent = record.total_turns;
        row.appendChild(turnsCell);

        // 딜량
        const damageDealtCell = document.createElement('td');
        damageDealtCell.textContent = this.formatNumber(record.total_damage_dealt);
        row.appendChild(damageDealtCell);

        // 받은 피해
        const damageReceivedCell = document.createElement('td');
        damageReceivedCell.textContent = this.formatNumber(record.total_damage_received);
        row.appendChild(damageReceivedCell);

        // 버전
        const versionCell = document.createElement('td');
        versionCell.textContent = record.game_version;
        row.appendChild(versionCell);

        // 날짜
        const dateCell = document.createElement('td');
        dateCell.textContent = this.formatDate(record.created_at);
        row.appendChild(dateCell);

        return row;
    }

    /**
     * 내 기록인지 확인
     * @param {Object} record - 리더보드 기록
     * @returns {boolean}
     */
    isMyRecord(record) {
        if (!this.myRankData) return false;

        return (
            record.final_stage === this.myRankData.finalStage &&
            record.total_turns === this.myRankData.totalTurns &&
            record.total_damage_dealt === this.myRankData.totalDamageDealt &&
            Math.abs(record.total_damage_received - this.myRankData.totalDamageReceived) < 10
        );
    }

    /**
     * 페이징 UI 업데이트
     */
    updatePagination() {
        const pageInfo = this.modal?.querySelector('.leaderboard-page-info');
        const prevBtn = this.modal?.querySelector('.leaderboard-prev-btn');
        const nextBtn = this.modal?.querySelector('.leaderboard-next-btn');

        if (pageInfo) {
            // 직접 템플릿 치환 (I18nHelper 템플릿 치환 미작동 시 대응)
            const template = I18nHelper.getText('leaderboard.page_info') || '{current} / {total}';
            const pageText = template
                .replace('{current}', this.currentPage)
                .replace('{total}', this.totalPages);
            pageInfo.textContent = pageText;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    /**
     * 이전 페이지로 이동
     */
    async prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadLeaderboard();
        }
    }

    /**
     * 다음 페이지로 이동
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.loadLeaderboard();
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoading() {
        const tbody = this.modal?.querySelector('.leaderboard-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-message">
                    ${I18nHelper.getText('leaderboard.loading') || 'Loading...'}
                </td>
            </tr>
        `;
    }

    /**
     * 에러 메시지 표시
     * @param {string} error - 에러 메시지
     */
    showError(error) {
        const tbody = this.modal?.querySelector('.leaderboard-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    ${I18nHelper.getText('leaderboard.error') || 'Error:'} ${error}
                </td>
            </tr>
        `;
    }

    /**
     * 데이터 없음 메시지 표시
     */
    showNoData() {
        const tbody = this.modal?.querySelector('.leaderboard-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    ${I18nHelper.getText('leaderboard.no_data') || 'No records yet'}
                </td>
            </tr>
        `;
    }

    /**
     * 플레이 스타일 번역
     * @param {string} style - 플레이 스타일
     * @returns {string}
     */
    translatePlayStyle(style) {
        const key = `auto_battle_card_game.gameplay.play_style.${style}`;
        return I18nHelper.getText(key) || style;
    }

    /**
     * 숫자 포맷팅 (천 단위 콤마)
     * @param {number} num - 숫자
     * @returns {string}
     */
    formatNumber(num) {
        return num?.toLocaleString() || '0';
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateString - ISO 날짜 문자열
     * @returns {string}
     */
    formatDate(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // 7일 이내면 상대 시간 표시
        if (diffDays === 0) {
            return I18nHelper.getText('leaderboard.today') || 'Today';
        } else if (diffDays === 1) {
            return I18nHelper.getText('leaderboard.yesterday') || 'Yesterday';
        } else if (diffDays < 7) {
            return I18nHelper.getText('leaderboard.days_ago', { days: diffDays }) || `${diffDays}d ago`;
        }

        // 7일 이후는 날짜 표시
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }
}

// 전역 객체로 등록
window.LeaderboardModal = LeaderboardModal;
console.log('[LeaderboardModal] Class loaded');
