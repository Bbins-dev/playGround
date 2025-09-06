// PlayGround - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 PlayGround 웹사이트가 로드되었습니다!');
    
    // 초기화
    initializeApp();
});

/**
 * 앱 초기화
 */
function initializeApp() {
    // 애니메이션 효과 추가
    addAnimationEffects();
    
    // 게임 카드 설정
    setupGameCards();
    
    // 검색 기능 설정
    setupSearch();
    
    // 광고 영역 설정
    setupAds();
    
    // 스크롤 효과
    setupScrollEffects();
    
    // 게임 데이터 초기화
    initializeGameData();
}

/**
 * 애니메이션 효과를 추가합니다
 */
function addAnimationEffects() {
    // 페이지 로드 시 페이드인 효과
    const elements = document.querySelectorAll('.game-card, .info-item');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * 게임 카드 설정
 */
function setupGameCards() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        // 카드 클릭 이벤트 (향후 게임 추가 시 사용)
        card.addEventListener('click', function() {
            if (!this.classList.contains('coming-soon')) {
                // 게임 실행 로직 (향후 구현)
                console.log('게임 실행:', this.querySelector('h4').textContent);
            }
        });
        
        // 마우스 진입 시 효과
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('coming-soon')) {
                this.style.transform = 'translateY(-4px)';
            }
        });
        
        // 마우스 이탈 시 효과
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('coming-soon')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
}

/**
 * 검색 기능 설정
 */
function setupSearch() {
    const searchInput = document.getElementById('gameSearch');
    const gamesContainer = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const gameCards = gamesContainer.querySelectorAll('.game-card');
            let visibleCount = 0;
            
            gameCards.forEach(card => {
                const gameTitle = card.querySelector('h4').textContent.toLowerCase();
                const gameDescription = card.querySelector('.game-description').textContent.toLowerCase();
                const gameGenre = card.querySelector('.game-meta').textContent.toLowerCase();
                
                const isMatch = gameTitle.includes(searchTerm) || 
                               gameDescription.includes(searchTerm) || 
                               gameGenre.includes(searchTerm);
                
                if (isMatch || searchTerm === '') {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // 검색 결과가 없을 때 메시지 표시
            if (visibleCount === 0 && searchTerm !== '') {
                noResults.style.display = 'block';
                gamesContainer.style.display = 'none';
            } else {
                noResults.style.display = 'none';
                gamesContainer.style.display = 'grid';
            }
        });
    }
}

/**
 * 광고 영역 설정
 */
function setupAds() {
    // 사이드바 광고에 랜덤 광고 삽입
    insertRandomAds();
    
    // 게임 카드 사이에 광고 삽입
    insertGameAds();
}

/**
 * 랜덤 광고 삽입
 */
function insertRandomAds() {
    const adSlots = [
        { slot: 'left-sidebar', size: '728x90' },
        { slot: 'right-sidebar', size: '728x90' }
    ];
    
    adSlots.forEach(ad => {
        const adElement = document.querySelector(`[data-ad-slot="${ad.slot}"]`);
        if (adElement) {
            // 실제 AdSense 코드로 교체 예정
            adElement.innerHTML = `
                <span class="ad-label">광고</span>
                <div class="ad-content">${ad.size}</div>
            `;
        }
    });
}

/**
 * 게임 카드 사이에 광고 삽입
 */
function insertGameAds() {
    const gamesContainer = document.getElementById('gamesContainer');
    if (gamesContainer) {
        const gameCards = gamesContainer.querySelectorAll('.game-card');
        
        // 3번째 게임 카드 뒤에 광고 삽입
        if (gameCards.length >= 3) {
            const adCard = createAdCard('300x250');
            gameCards[2].insertAdjacentElement('afterend', adCard);
        }
    }
}

/**
 * 광고 카드 생성
 */
function createAdCard(size) {
    const adCard = document.createElement('div');
    adCard.className = 'game-card ad-card';
    adCard.innerHTML = `
        <div class="ad-placeholder" data-ad-slot="game-content">
            <span class="ad-label">광고</span>
            <div class="ad-content">${size}</div>
        </div>
    `;
    return adCard;
}

/**
 * 게임 데이터 초기화
 */
function initializeGameData() {
    // 게임 데이터를 로컬 스토리지에서 불러오거나 기본값 설정
    const gameData = Utils.storage.get('playground-games', []);
    
    if (gameData.length === 0) {
        // 기본 게임 데이터 설정
        const defaultGames = [
            {
                id: 'game-1',
                title: '첫 번째 게임',
                description: '곧 추가될 예정입니다!',
                genre: '퍼즐',
                difficulty: 'easy',
                icon: '🎲',
                status: 'coming-soon'
            },
            {
                id: 'game-2',
                title: '두 번째 게임',
                description: '곧 추가될 예정입니다!',
                genre: '액션',
                difficulty: 'medium',
                icon: '🎯',
                status: 'coming-soon'
            },
            {
                id: 'game-3',
                title: '세 번째 게임',
                description: '곧 추가될 예정입니다!',
                genre: '퍼즐',
                difficulty: 'hard',
                icon: '🚀',
                status: 'coming-soon'
            }
        ];
        
        Utils.storage.set('playground-games', defaultGames);
    }
}

/**
 * 스크롤 효과 설정
 */
function setupScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.info-item');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

/**
 * 게임 추가 함수 (향후 사용)
 */
function addGame(gameData) {
    const gamesContainer = document.getElementById('gamesContainer');
    
    if (gamesContainer) {
        const gameCard = document.createElement('div');
        gameCard.className = `game-card ${gameData.status || ''}`;
        gameCard.setAttribute('data-genre', gameData.genre);
        gameCard.setAttribute('data-difficulty', gameData.difficulty);
        
        gameCard.innerHTML = `
            <div class="game-thumbnail">
                <div class="game-icon">${gameData.icon}</div>
            </div>
            <div class="game-info">
                <h4>${gameData.title}</h4>
                <p class="game-description">${gameData.description}</p>
                <div class="game-meta">
                    <span class="genre">장르</span>: ${gameData.genre}
                </div>
            </div>
            <button class="btn ${gameData.status === 'coming-soon' ? 'btn-disabled' : ''}" 
                    ${gameData.status === 'coming-soon' ? 'disabled' : ''} 
                    onclick="launchGame('${gameData.id}')">
                ${gameData.status === 'coming-soon' ? '준비 중' : '게임 시작'}
            </button>
        `;
        
        gamesContainer.appendChild(gameCard);
        
        // 애니메이션 효과
        gameCard.style.opacity = '0';
        gameCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            gameCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            gameCard.style.opacity = '1';
            gameCard.style.transform = 'translateY(0)';
        }, 100);
        
        // 게임 데이터 저장
        const existingGames = Utils.storage.get('playground-games', []);
        existingGames.push(gameData);
        Utils.storage.set('playground-games', existingGames);
    }
}

/**
 * 게임 실행 함수
 */
function launchGame(gameId) {
    console.log(`게임 실행: ${gameId}`);
    
    // 게임 데이터에서 해당 게임 찾기
    const games = Utils.storage.get('playground-games', []);
    const game = games.find(g => g.id === gameId);
    
    if (game && game.status !== 'coming-soon') {
        // 게임 페이지로 이동
        window.location.href = `games/${gameId}/index.html`;
    } else {
        console.log('게임이 아직 준비되지 않았습니다.');
    }
}

/**
 * 게임 정렬 함수
 */
function sortGames(sortBy = 'popularity') {
    const gamesContainer = document.getElementById('gamesContainer');
    const gameCards = Array.from(gamesContainer.querySelectorAll('.game-card:not(.ad-card)'));
    
    gameCards.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.querySelector('h4').textContent.localeCompare(b.querySelector('h4').textContent);
            case 'genre':
                return a.getAttribute('data-genre').localeCompare(b.getAttribute('data-genre'));
            case 'difficulty':
                const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                return difficultyOrder[a.getAttribute('data-difficulty')] - difficultyOrder[b.getAttribute('data-difficulty')];
            default:
                return 0; // popularity - 기본 순서 유지
        }
    });
    
    // 정렬된 카드들을 다시 배치
    gameCards.forEach(card => {
        gamesContainer.appendChild(card);
    });
}

/**
 * 유틸리티 함수들
 */
const Utils = {
    // 랜덤 색상 생성
    getRandomColor: function() {
        const colors = ['#007acc', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 숫자 포맷팅
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // 디바운스 함수
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 로컬 스토리지 관리
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('로컬 스토리지 저장 실패:', e);
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('로컬 스토리지 읽기 실패:', e);
                return defaultValue;
            }
        }
    }
};

// 전역 객체에 유틸리티 추가
window.PlayGroundUtils = Utils;

// 개발 모드에서 추가 정보 표시
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 개발 모드: PlayGround 유틸리티가 전역 객체에 추가되었습니다.');
    console.log('사용법: PlayGroundUtils.getRandomColor()');
    console.log('게임 추가: addGame({id: "new-game", title: "새 게임", ...})');
}
