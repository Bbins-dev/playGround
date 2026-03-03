// BinBox Games - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    if (window.PlayGroundConfig?.utils.isDevelopment()) {
        console.log('🎮 BinBox Games 웹사이트가 로드되었습니다!');
    }
    
    // 초기화
    initializeApp();
});

/**
 * 앱 초기화
 */
let _appInitialized = false;
async function initializeApp() {
    if (_appInitialized) return;
    _appInitialized = true;
    // i18n 시스템 먼저 초기화 (번역이 gameRegistry보다 우선)
    if (window.i18n) {
        const storageKey = window.PlayGroundConfig?.site.languageStorageKey || 'selectedLanguage';
        const defaultLang = window.PlayGroundConfig?.site.defaultLanguage || 'ko';
        const savedLang = localStorage.getItem(storageKey) || defaultLang;
        await window.i18n.init(savedLang, 'js/lang/');
        // 언어 선택기 UI를 현재 언어로 업데이트
        window.i18n.updateLanguageSelectors(savedLang);
    }

    // 게임 레지스트리 초기화
    if (window.gameRegistry) {
        gameRegistry.init();
    }

    // 게임 카드가 생성된 후 번역 재적용
    if (window.i18n) {
        window.i18n.applyTranslations();
    }

    // 애니메이션 효과 추가
    addAnimationEffects();

    // 광고 영역 설정
    setupAds();

}

/**
 * 애니메이션 효과를 추가합니다
 */
function addAnimationEffects() {
    // 페이지 로드 시 페이드인 효과
    const elements = document.querySelectorAll('.game-card');
    
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
 * 광고 영역 설정
 */
function setupAds() {
    if (!window.PlayGroundConfig?.ads.enabled) return;
    
    // 사이드바 광고에 랜덤 광고 삽입
    insertRandomAds();
}

/**
 * 랜덤 광고 삽입
 */
function insertRandomAds() {
    const config = window.PlayGroundConfig;
    if (!config?.ads.enabled) return;
    
    const adSlots = [
        config.ads.slots.leftSidebar,
        config.ads.slots.rightSidebar
    ];
    
    adSlots.forEach(adConfig => {
        if (!adConfig) return;
        
        const adElement = document.querySelector(`[data-ad-slot="${adConfig.position}"]`);
        if (adElement) {
            // 실제 AdSense 코드로 교체 예정
            adElement.innerHTML = `
                <span class="ad-label" data-i18n="ads.advertisement">광고</span>
                <div class="ad-content">${adConfig.size}</div>
            `;
        }
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
window.BinBoxGamesUtils = Utils;

// 개발 모드에서 추가 정보 표시
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 개발 모드: BinBox Games 유틸리티가 전역 객체에 추가되었습니다.');
    console.log('사용법: BinBoxGamesUtils.getRandomColor()');
    console.log('게임 추가: addGame({id: "new-game", title: "새 게임", ...})');
}
