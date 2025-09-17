// 카드 배틀 게임 메인 진입점

let gameManager;

// DOM이 로드되면 게임 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎴 카드 배틀 게임을 시작합니다.');

    // i18n 시스템 초기화
    if (typeof initializeI18n === 'function') {
        initializeI18n();
    }

    // 게임 매니저 생성 및 초기화
    gameManager = new GameManager();
    gameManager.init();

    // 언어 변경 이벤트 리스너
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            if (typeof changeLanguage === 'function') {
                changeLanguage(this.value);
            }
        });
    }

    // 뒤로가기 버튼
    const backButton = document.getElementById('back-to-main');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '../../index.html';
        });
    }

    console.log('✅ 게임 초기화 완료');
});

// 게임 종료 시 리소스 정리
window.addEventListener('beforeunload', function() {
    if (gameManager) {
        gameManager.destroy();
    }
});

// 에러 핸들링
window.addEventListener('error', function(event) {
    console.error('🚨 게임 에러:', event.error);
    // 에러 발생 시 메인 메뉴로 복구
    if (gameManager) {
        gameManager.showMainMenu();
    }
});