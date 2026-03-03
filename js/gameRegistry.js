// 동적 게임 레지스트리 시스템
class GameRegistry {
    constructor() {
        this.gamesContainer = null;
        this.noResultsElement = null;
        this.searchInput = null;
        this.config = window.PlayGroundConfig;
    }

    /**
     * 게임 레지스트리 초기화
     */
    init() {
        this.gamesContainer = document.getElementById('gamesContainer');
        this.noResultsElement = document.getElementById('noResults');
        this.searchInput = document.getElementById('gameSearch');
        
        if (!this.gamesContainer) return;
        
        // 기존 게임 카드들 제거 (HTML에서 하드코딩된 것들)
        this.clearExistingCards();
        
        // 설정에서 게임 정보를 가져와 동적으로 생성
        this.generateGameCards();
        
        // 검색 기능 설정
        this.setupSearch();
        
        // 광고 삽입
        this.insertAds();
    }

    /**
     * 기존 하드코딩된 게임 카드들 제거
     */
    clearExistingCards() {
        if (this.gamesContainer) {
            this.gamesContainer.innerHTML = '';
        }
    }

    /**
     * 설정에서 게임 정보를 가져와 동적으로 카드 생성
     */
    generateGameCards() {
        if (!this.config) {
            console.warn('PlayGroundConfig not found');
            return;
        }

        // 활성 게임들 추가
        this.config.games.forEach((game, index) => {
            this.createGameCard(game, index);
        });

        // 예정된 게임들 추가
        this.config.upcomingGames.forEach((game, index) => {
            this.createGameCard(game, this.config.games.length + index);
        });
    }

    /**
     * 개별 게임 카드 생성
     */
    createGameCard(gameData, index) {
        const card = document.createElement('div');
        card.className = `game-card ${gameData.status === 'coming-soon' ? 'coming-soon' : ''}`;
        card.setAttribute('data-genre', gameData.genre);
        card.setAttribute('data-difficulty', gameData.difficulty || 'medium');
        card.setAttribute('data-game-id', gameData.id);

        // i18n 키 생성
        const i18nKey = gameData.status === 'coming-soon' ?
            `upcoming_games.${gameData.id}` :
            `${gameData.id.replace(/-/g, '_')}`;

        card.innerHTML = `
            <div class="game-thumbnail">
                <div class="game-icon">${gameData.icon}</div>
            </div>
            <div class="game-info">
                <h4 data-i18n="${i18nKey}.title">${this.getDefaultTitle(gameData)}</h4>
                <p class="game-description" data-i18n="${i18nKey}.description">${this.getDefaultDescription(gameData)}</p>
                <div class="game-meta">
                    <span class="genre" data-i18n="game_info.genre">장르</span>: 
                    <span data-i18n="genre_names.${gameData.genre}">${this.getGenreName(gameData.genre)}</span>
                </div>
            </div>
            <button class="btn ${gameData.status === 'coming-soon' ? 'btn-disabled' : ''}"
                    ${gameData.status === 'coming-soon' ? 'disabled' : ''}
                    data-i18n="games.play_button">
                ${gameData.status === 'coming-soon' ? '곧 추가될 예정입니다!' : '게임 시작'}
            </button>
        `;

        // 클릭 이벤트 바인딩 (inline onclick 대체)
        if (gameData.status !== 'coming-soon') {
            const btn = card.querySelector('.btn');
            btn.addEventListener('click', () => this.launchGame(gameData.id));
        }

        // 애니메이션 효과 추가
        this.addCardAnimation(card, index);

        this.gamesContainer.appendChild(card);
    }

    /**
     * 기본 제목 가져오기
     */
    getDefaultTitle(gameData) {
        const titles = {
            'barista-game': 'Barista Game',
            'auto-battle-card-game': 'Auto Battle Card Dual',
            'game2': '세 번째 게임',
            'game3': '네 번째 게임'
        };
        return titles[gameData.id] || gameData.id;
    }

    /**
     * 기본 설명 가져오기
     */
    getDefaultDescription(gameData) {
        if (gameData.status === 'coming-soon') {
            return '곧 추가될 예정입니다!';
        }
        
        const descriptions = {
            'barista-game': 'Hold to pour coffee and release at perfect timing for high combos!',
            'auto-battle-card-game': 'Turn-based auto battle card game!'
        };
        return descriptions[gameData.id] || '새로운 게임입니다!';
    }

    /**
     * 장르명 가져오기
     */
    getGenreName(genre) {
        const genreNames = {
            timing: '타이밍',
            strategy: '전략',
            action: '액션',
            puzzle: '퍼즐',
            tbd: '미정'
        };
        return genreNames[genre] || genre;
    }

    /**
     * 카드 애니메이션 효과 추가
     */
    addCardAnimation(card, index) {
        const delay = this.config?.ui.animations.cardDelay || 100;
        const duration = this.config?.ui.animations.fadeInDuration || 600;
        
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * delay);
    }

    /**
     * 검색 기능 설정
     */
    setupSearch() {
        if (!this.searchInput) return;

        const debounceDelay = this.config?.ui.search.debounceDelay || 300;
        let timeoutId;

        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.performSearch(e.target.value);
            }, debounceDelay);
        });
    }

    /**
     * 검색 실행
     */
    performSearch(searchTerm) {
        const cards = this.gamesContainer.querySelectorAll('.game-card:not(.ad-card)');
        const searchFields = this.config?.ui.search.searchFields || ['title', 'description', 'genre'];
        let visibleCount = 0;

        cards.forEach(card => {
            let isMatch = false;
            
            if (!searchTerm.trim()) {
                isMatch = true;
            } else {
                const searchLower = searchTerm.toLowerCase();
                
                // 검색 필드별로 매칭 확인
                if (searchFields.includes('title')) {
                    const title = card.querySelector('h4')?.textContent?.toLowerCase() || '';
                    if (title.includes(searchLower)) isMatch = true;
                }
                
                if (searchFields.includes('description')) {
                    const description = card.querySelector('.game-description')?.textContent?.toLowerCase() || '';
                    if (description.includes(searchLower)) isMatch = true;
                }
                
                if (searchFields.includes('genre')) {
                    const genre = card.querySelector('.game-meta')?.textContent?.toLowerCase() || '';
                    if (genre.includes(searchLower)) isMatch = true;
                }
            }
            
            if (isMatch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // 검색 결과 처리
        this.handleSearchResults(visibleCount, searchTerm);
    }

    /**
     * 검색 결과 처리
     */
    handleSearchResults(visibleCount, searchTerm) {
        if (visibleCount === 0 && searchTerm.trim()) {
            if (this.noResultsElement) this.noResultsElement.style.display = 'block';
            if (this.gamesContainer) this.gamesContainer.style.display = 'none';
        } else {
            if (this.noResultsElement) this.noResultsElement.style.display = 'none';
            if (this.gamesContainer) this.gamesContainer.style.display = 'grid';
        }
    }

    /**
     * 광고 삽입
     */
    insertAds() {
        if (!this.config?.ads.enabled) return;

        const cards = this.gamesContainer.querySelectorAll('.game-card:not(.ad-card)');
        const insertAfter = this.config.ads.insertAfterCard;

        if (cards.length > insertAfter) {
            const adCard = this.createAdCard();
            cards[insertAfter].insertAdjacentElement('afterend', adCard);
        }
    }

    /**
     * 광고 카드 생성
     */
    createAdCard() {
        const adConfig = this.config?.ads.slots.gameContent;
        const adCard = document.createElement('div');
        adCard.className = 'game-card ad-card';
        
        adCard.innerHTML = `
            <div class="ad-placeholder" data-ad-slot="${adConfig?.position || 'game-content'}">
                <span class="ad-label" data-i18n="ads.advertisement">광고</span>
                <div class="ad-content">${adConfig?.size || '300x250'}</div>
            </div>
        `;
        
        return adCard;
    }

    /**
     * 게임 실행
     */
    launchGame(gameId) {
        const game = this.config.utils.getGameInfo(gameId);

        if (!game) {
            console.error(`게임을 찾을 수 없습니다: ${gameId}`);
            return;
        }

        if (game.status === 'coming-soon') {
            console.log('게임이 아직 준비되지 않았습니다.');
            return;
        }

        let gameUrl = this.config.utils.getGameUrl(gameId);
        if (gameUrl) {
            // Trailing slash 확인 및 추가 (CSS 경로 해결을 위해 필수)
            if (!gameUrl.endsWith('/')) {
                gameUrl += '/';
            }
            window.location.href = gameUrl;
        } else {
            console.error(`게임 URL을 찾을 수 없습니다: ${gameId}`);
        }
    }

    /**
     * 새 게임 추가 (동적으로)
     */
    addGame(gameData) {
        // 설정에 게임 추가
        this.config.games.push(gameData);
        
        // 카드 생성
        const index = this.gamesContainer.children.length;
        this.createGameCard(gameData, index);
        
        // i18n 재적용 (새 카드에 번역 적용)
        if (window.i18n) {
            window.i18n.applyTranslations();
        }
        
        console.log(`새 게임이 추가되었습니다: ${gameData.id}`);
    }

    /**
     * 게임 제거
     */
    removeGame(gameId) {
        // 설정에서 게임 제거
        this.config.games = this.config.games.filter(game => game.id !== gameId);
        
        // DOM에서 카드 제거
        const card = this.gamesContainer.querySelector(`[data-game-id="${gameId}"]`);
        if (card) {
            card.remove();
        }
        
        console.log(`게임이 제거되었습니다: ${gameId}`);
    }
}

// 전역 인스턴스 생성
const gameRegistry = new GameRegistry();

// 전역 객체로 등록
window.gameRegistry = gameRegistry;

// 개발 모드에서 콘솔 정보 출력
if (window.PlayGroundConfig?.utils.isDevelopment()) {
    console.log('🎮 게임 레지스트리가 로드되었습니다.');
    console.log('사용법: gameRegistry.addGame({id: "new-game", ...})');
}