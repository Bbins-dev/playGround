/**
 * 글로벌 리더보드 UI 모달
 * 리더보드 데이터 표시 및 페이징 처리
 */

class LeaderboardModal {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.modal = null;
        this.leaderboardClient = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.myRankData = null; // 내 순위 데이터 (선택적)
        this.searchQuery = null; // 검색 쿼리
        this.isSearchMode = false; // 검색 모드 플래그

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
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 닫기 버튼
        const closeBtn = this.modal?.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.hide();
            });
        }

        // 배경 클릭으로 닫기
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // 페이지네이션 버튼
        const firstBtn = this.modal?.querySelector('.leaderboard-first-btn');
        const lastBtn = this.modal?.querySelector('.leaderboard-last-btn');
        const prev10Btn = this.modal?.querySelector('.leaderboard-prev10-btn');
        const next10Btn = this.modal?.querySelector('.leaderboard-next10-btn');
        const prevBtn = this.modal?.querySelector('.leaderboard-prev-btn');
        const nextBtn = this.modal?.querySelector('.leaderboard-next-btn');

        if (firstBtn) {
            firstBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.firstPage();
            });
        }

        if (lastBtn) {
            lastBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.lastPage();
            });
        }

        if (prev10Btn) {
            prev10Btn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.prev10Pages();
            });
        }

        if (next10Btn) {
            next10Btn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.next10Pages();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.prevPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.nextPage();
            });
        }

        // 검색 버튼
        const searchBtn = this.modal?.querySelector('#leaderboard-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleSearch();
            });
        }

        // 검색 입력 필드 (Enter 키 + 실시간 길이 검증)
        const searchInput = this.modal?.querySelector('#leaderboard-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

            // 실시간 입력 길이 체크 (전각/반각 문자 구분)
            searchInput.addEventListener('input', () => {
                this.validateSearchInput();
            });
        }

        // 초기화 버튼
        const clearSearchBtn = this.modal?.querySelector('#leaderboard-clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleClearSearch();
            });
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
        if (!this.modal) {
            console.error('[LeaderboardModal] Cannot show - modal not initialized');
            return;
        }

        this.myRankData = myRankData;
        this.currentPage = 1;

        this.modal.classList.remove('hidden');

        // Pull-to-refresh 완벽 차단 (iOS/Android 공통)
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${scrollY}px`;

        // 리더보드 로드
        await this.loadLeaderboard();
    }

    /**
     * 모달 숨기기
     */
    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');

            // Body 스크롤 복원 + 스크롤 위치 복구
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }

    /**
     * 리더보드 데이터 로드
     */
    async loadLeaderboard() {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            let result;

            // 검색 모드: searchPlayers() 사용
            if (this.isSearchMode && this.searchQuery) {
                result = await this.leaderboardClient.searchPlayers(this.searchQuery, this.currentPage);
            } else {
                // 일반 모드: fetchLeaderboard() 사용
                result = await this.leaderboardClient.fetchLeaderboard(this.currentPage);
            }

            if (!result.success) {
                console.warn('[LeaderboardModal] Fetch failed:', result.error);
                this.showError(result.error);
                return;
            }

            this.totalPages = result.totalPages || 1;
            this.renderLeaderboard(result.data || []);
            this.updatePagination();
            this.updateSearchIndicator(result.totalCount || 0);

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
            // 검색 모드: globalRank 사용, 일반 모드: 페이지 기반 계산
            const rank = (this.isSearchMode && record.globalRank)
                ? record.globalRank
                : (startRank + index);
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

        // Configuration-Driven: 방어 속성별 배경색 적용
        const defenseElement = record.defense_element || 'normal';
        const elementColor = GameConfig?.masterColors?.elements?.[defenseElement] || GameConfig?.masterColors?.elements?.normal || '#F0E6D8';

        // Hex to RGBA 변환 (opacity: 0.30로 명확하게 구분 가능)
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        row.style.backgroundColor = hexToRgba(elementColor, 0.30);

        // 순위
        const rankCell = document.createElement('td');
        rankCell.textContent = `#${this.formatRank(rank)}`;
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
            const clearedText = I18nHelper.getText('leaderboard.stage_cleared') || ' (Clr)';
            stageCell.textContent += clearedText;
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
        const firstBtn = this.modal?.querySelector('.leaderboard-first-btn');
        const lastBtn = this.modal?.querySelector('.leaderboard-last-btn');
        const prev10Btn = this.modal?.querySelector('.leaderboard-prev10-btn');
        const next10Btn = this.modal?.querySelector('.leaderboard-next10-btn');
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

        // 모든 후진 버튼 비활성화 (1페이지일 때)
        const isFirstPage = this.currentPage <= 1;
        if (firstBtn) firstBtn.disabled = isFirstPage;
        if (prev10Btn) prev10Btn.disabled = isFirstPage;
        if (prevBtn) prevBtn.disabled = isFirstPage;

        // 모든 전진 버튼 비활성화 (마지막 페이지일 때)
        const isLastPage = this.currentPage >= this.totalPages;
        if (nextBtn) nextBtn.disabled = isLastPage;
        if (next10Btn) next10Btn.disabled = isLastPage;
        if (lastBtn) lastBtn.disabled = isLastPage;
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
     * 맨 처음 페이지로 이동
     */
    async firstPage() {
        if (this.currentPage !== 1) {
            this.currentPage = 1;
            await this.loadLeaderboard();
        }
    }

    /**
     * 맨 끝 페이지로 이동
     */
    async lastPage() {
        if (this.currentPage !== this.totalPages) {
            this.currentPage = this.totalPages;
            await this.loadLeaderboard();
        }
    }

    /**
     * 10페이지 뒤로 이동
     */
    async prev10Pages() {
        const jumpSize = GameConfig?.leaderboard?.pagination?.jumpSize || 10;
        this.currentPage = Math.max(1, this.currentPage - jumpSize);
        await this.loadLeaderboard();
    }

    /**
     * 10페이지 앞으로 이동
     */
    async next10Pages() {
        const jumpSize = GameConfig?.leaderboard?.pagination?.jumpSize || 10;
        this.currentPage = Math.min(this.totalPages, this.currentPage + jumpSize);
        await this.loadLeaderboard();
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
            let daysText = I18nHelper.getText('leaderboard.days_ago') || '{days}d ago';
            return daysText.replace('{days}', diffDays);
        }

        // 7일 이후는 날짜 표시
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    /**
     * 검색 실행
     */
    async handleSearch() {
        const searchInput = this.modal?.querySelector('#leaderboard-search-input');
        if (!searchInput) return;

        const query = searchInput.value.trim();

        // 빈 문자열이면 초기화와 동일한 동작
        if (!query) {
            await this.handleClearSearch();
            return;
        }

        this.searchQuery = query;
        this.isSearchMode = true;
        this.currentPage = 1;

        // 초기화 버튼 표시
        const clearBtn = this.modal?.querySelector('#leaderboard-clear-search-btn');
        if (clearBtn) {
            clearBtn.classList.remove('hidden');
        }

        await this.loadLeaderboard();
    }

    /**
     * 검색 초기화
     */
    async handleClearSearch() {
        this.searchQuery = null;
        this.isSearchMode = false;
        this.currentPage = 1;

        // 입력 필드 초기화
        const searchInput = this.modal?.querySelector('#leaderboard-search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        // 초기화 버튼 숨김
        const clearBtn = this.modal?.querySelector('#leaderboard-clear-search-btn');
        if (clearBtn) {
            clearBtn.classList.add('hidden');
        }

        await this.loadLeaderboard();
    }

    /**
     * 순위 포맷팅 (1000+ → k, m, b 단위)
     * @param {number} rank - 순위
     * @returns {string} 포맷된 순위
     */
    formatRank(rank) {
        const config = GameConfig?.leaderboard?.rankAbbreviation;
        const billions = config?.billions || 1000000000;
        const millions = config?.millions || 1000000;
        const thousands = config?.thousands || 1000;
        const decimals = config?.decimalPlaces || 2;

        if (rank >= billions) {
            return (rank / billions).toFixed(decimals).replace(/\.00$/, '').replace(/0$/, '') + 'b';
        } else if (rank >= millions) {
            return (rank / millions).toFixed(decimals).replace(/\.00$/, '').replace(/0$/, '') + 'm';
        } else if (rank >= thousands) {
            return (rank / thousands).toFixed(decimals).replace(/\.00$/, '').replace(/0$/, '') + 'k';
        }
        return rank.toString();
    }

    /**
     * 문자 길이 계산 (전각 문자는 2, 반각 문자는 1로 카운트)
     * @param {string} text - 계산할 텍스트
     * @returns {number} 계산된 길이
     */
    calculateTextLength(text) {
        let length = 0;
        // 전각 문자 범위 정규식
        // 한글 완성형(AC00-D7A3), 한글 자모(3130-318F, FFA0-FFDC),
        // 히라가나/카타카나(3040-30FF, 31F0-31FF),
        // 한자(4E00-9FFF), 전각 영문/숫자/기호(FF00-FFEF)
        const fullWidthRegex = /[\uAC00-\uD7A3\u3130-\u318F\uFFA0-\uFFDC\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uFF00-\uFFEF]/;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (fullWidthRegex.test(char)) {
                length += 2;  // 전각 문자는 2로 카운트
            } else {
                length += 1;  // 반각 문자는 1로 카운트
            }
        }
        return length;
    }

    /**
     * 검색 입력 유효성 검사 (실시간)
     */
    validateSearchInput() {
        const searchInput = this.modal?.querySelector('#leaderboard-search-input');
        if (!searchInput) return;

        const currentLength = this.calculateTextLength(searchInput.value);
        const maxLength = 20; // 플레이어 이름과 동일한 20 (영어 기준 20자)

        // 길이 초과 시 마지막 문자 제거
        if (currentLength > maxLength) {
            let text = searchInput.value;
            const fullWidthRegex = /[\uAC00-\uD7A3\u3130-\u318F\uFFA0-\uFFDC\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uFF00-\uFFEF]/;
            let calcLength = 0;
            let validText = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charLength = fullWidthRegex.test(char) ? 2 : 1;

                if (calcLength + charLength <= maxLength) {
                    validText += char;
                    calcLength += charLength;
                } else {
                    break;
                }
            }

            searchInput.value = validText;
        }
    }

    /**
     * 검색 결과 표시 업데이트
     * @param {number} totalCount - 총 검색 결과 수
     */
    updateSearchIndicator(totalCount) {
        if (!this.isSearchMode) return;

        const pageInfo = this.modal?.querySelector('.leaderboard-page-info');
        if (!pageInfo) return;

        // 검색 결과 수 표시 (템플릿 변수 치환)
        let searchText = I18nHelper.getText('leaderboard.search_results') || '검색 결과: {count}건';
        searchText = searchText.replace('{count}', totalCount);

        // 원래 페이지 정보에 검색 결과 추가
        const originalText = `${this.currentPage} / ${this.totalPages}`;
        pageInfo.textContent = `${originalText} (${searchText})`;

        // 검색 결과 없음 처리
        if (totalCount === 0) {
            const tbody = this.modal?.querySelector('.leaderboard-table tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">${I18nHelper.getText('leaderboard.no_search_results') || '검색 결과가 없습니다'}</td></tr>`;
            }
        }
    }
}

// 전역 객체로 등록
window.LeaderboardModal = LeaderboardModal;
