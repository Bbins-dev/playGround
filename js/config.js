// BinBox Games - 중앙화된 설정 관리
const PlayGroundConfig = {
    // 사이트 기본 설정
    site: {
        defaultLanguage: 'ko',
        supportedLanguages: ['ko', 'en', 'ja'],
        languageStorageKey: 'selectedLanguage',
        gamesStorageKey: 'binbox-games'
    },
    
    // 게임 레지스트리 - 새 게임은 여기에만 추가하면 됨
    games: [
        {
            id: 'barista-game',
            path: 'games/barista-game/',
            icon: '☕',
            genre: 'timing',
            difficulty: 'easy',
            status: 'active',
            featured: true
        },
        {
            id: 'auto-battle-card-game',
            path: 'games/card-battle-game/',
            icon: '⚔️',
            genre: 'strategy',
            difficulty: 'medium',
            status: 'active',
            featured: true
        }
        // 새 게임은 여기에 추가
    ],
    
    // 예정된 게임들
    upcomingGames: [
        {
            id: 'game2',
            icon: '🎯',
            genre: 'tbd',
            difficulty: 'medium',
            status: 'coming-soon'
        },
        {
            id: 'game3',
            icon: '🚀',
            genre: 'tbd',
            difficulty: 'hard',
            status: 'coming-soon'
        }
    ],
    
    // UI 설정
    ui: {
        // 검색 기능
        search: {
            debounceDelay: 300,
            searchFields: ['title', 'description', 'genre']
        },
        
        // 애니메이션 설정
        animations: {
            cardDelay: 100,
            fadeInDuration: 600,
            scrollDebounce: 16 // ~60fps
        },
        
        // 반응형 breakpoints
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        }
    },
    
    // 광고 설정 (Google AdSense 자동 광고 사용으로 비활성화)
    ads: {
        enabled: false, // Placeholder 광고 비활성화 - Google AdSense 자동 광고가 처리함
        slots: {
            leftSidebar: { size: '728x90', position: 'left-sidebar' },
            rightSidebar: { size: '728x90', position: 'right-sidebar' },
            gameContent: { size: '300x250', position: 'game-content' }
        },
        insertAfterCard: 2 // 3번째 카드 뒤에 광고 삽입
    },
    
    // 성능 설정
    performance: {
        lazyLoad: true,
        prefetchGames: false,
        cacheLanguages: true
    },
    
    // 개발 설정
    development: {
        enableConsoleLog: ['localhost', '127.0.0.1'].includes(window.location.hostname),
        enableDebugMode: false
    }
};

// 설정 유틸리티 함수들
PlayGroundConfig.utils = {
    // 게임 정보 가져오기
    getGameInfo: function(gameId) {
        const allGames = [...PlayGroundConfig.games, ...PlayGroundConfig.upcomingGames];
        return allGames.find(game => game.id === gameId);
    },
    
    // 활성화된 게임들만 가져오기
    getActiveGames: function() {
        return PlayGroundConfig.games.filter(game => game.status === 'active');
    },
    
    // 게임 URL 생성
    getGameUrl: function(gameId) {
        const game = this.getGameInfo(gameId);
        return game && game.path ? game.path : null;
    },
    
    // 현재 환경이 개발 환경인지 확인
    isDevelopment: function() {
        return PlayGroundConfig.development.enableConsoleLog;
    },
    
    // 반응형 breakpoint 확인
    isMobile: function() {
        return window.innerWidth <= PlayGroundConfig.ui.breakpoints.mobile;
    },
    
    isTablet: function() {
        return window.innerWidth <= PlayGroundConfig.ui.breakpoints.tablet && 
               window.innerWidth > PlayGroundConfig.ui.breakpoints.mobile;
    },
    
    isDesktop: function() {
        return window.innerWidth > PlayGroundConfig.ui.breakpoints.tablet;
    }
};

// 전역 객체로 등록
window.PlayGroundConfig = PlayGroundConfig;

// 개발 모드에서 콘솔 정보 출력
if (PlayGroundConfig.utils.isDevelopment()) {
    console.log('🔧 BinBox Games 설정이 로드되었습니다.');
    console.log('설정 접근: window.PlayGroundConfig');
}