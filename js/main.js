// PlayGround - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 PlayGround 웹사이트가 로드되었습니다!');
    
    // 애니메이션 효과 추가
    addAnimationEffects();
    
    // 게임 카드 호버 효과
    setupGameCards();
    
    // 스크롤 효과
    setupScrollEffects();
});

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
                this.style.transform = 'translateY(-10px) scale(1.02)';
            }
        });
        
        // 마우스 이탈 시 효과
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('coming-soon')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
}

/**
 * 스크롤 효과 설정
 */
function setupScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero, .info-item');
        
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
    const gamesContainer = document.querySelector('.games-container');
    
    if (gamesContainer) {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <div class="game-icon">${gameData.icon}</div>
            <h4>${gameData.title}</h4>
            <p>${gameData.description}</p>
            <button class="btn" onclick="launchGame('${gameData.id}')">게임 시작</button>
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
    }
}

/**
 * 게임 실행 함수 (향후 사용)
 */
function launchGame(gameId) {
    console.log(`게임 실행: ${gameId}`);
    // 여기에 게임 실행 로직을 구현할 예정
    // 예: 새 창에서 게임 열기, 게임 페이지로 이동 등
}

/**
 * 유틸리티 함수들
 */
const Utils = {
    // 랜덤 색상 생성
    getRandomColor: function() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 숫자 포맷팅
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
}
