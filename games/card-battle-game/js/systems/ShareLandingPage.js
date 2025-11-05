/**
 * ShareLandingPage - 공유 링크 랜딩 페이지 처리
 * URL 파라미터 감지 및 손패 이미지 표시
 */
class ShareLandingPage {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.shareSystem = null;
        this.imageGenerator = null;

        // 모달 요소
        this.landingModal = null;
        this.landingCanvas = null;
        this.playButton = null;

        // 초기화
        this.initialize();
    }

    /**
     * 초기화
     */
    initialize() {
        // 즉시 URL 파라미터 체크
        const urlParams = new URLSearchParams(window.location.search);
        const shareParam = urlParams.get('share');
        const langParam = urlParams.get('lang');

        console.log('[ShareLandingPage] initialize() 호출, shareParam:', shareParam ? 'exists' : 'none');

        // 언어 감지 및 설정 (최초 1회만 적용)
        const hasAppliedUrlLang = sessionStorage.getItem('urlLangApplied');
        if (langParam && !hasAppliedUrlLang && ['ko', 'en', 'ja'].includes(langParam)) {
            console.log('[ShareLandingPage] URL 언어 파라미터 적용:', langParam);
            localStorage.setItem('selectedLanguage', langParam);
            sessionStorage.setItem('urlLangApplied', 'true');
            if (window.i18n) {
                window.i18n.setLanguage(langParam);
            }
        }

        if (shareParam) {
            console.log('[ShareLandingPage] 공유 링크 감지:', shareParam.substring(0, 20) + '...');

            // 즉시 랜딩 페이지 표시 (의존성 없이)
            this.showLandingPageImmediate();

            // 게임 시작 화면 숨김
            this.hideGameStartScreen();

            // 비동기로 이미지 렌더링 (의존성 대기)
            this.waitForDependencies(shareParam);
        } else {
            console.log('[ShareLandingPage] 공유 파라미터 없음 - 초기화 중단');
        }
    }

    /**
     * 게임 시작 화면 숨김
     */
    hideGameStartScreen() {
        console.log('[ShareLandingPage] hideGameStartScreen() 호출');

        // 로딩 화면 완전히 숨김 (z-index가 10000으로 매우 높음)
        const loadingScreen = document.getElementById('loading-screen');
        console.log('[ShareLandingPage] loading-screen 요소:', loadingScreen ? 'found' : 'NOT FOUND');

        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.pointerEvents = 'none';
            loadingScreen.style.zIndex = '-1';
            console.log('[ShareLandingPage] 로딩 화면 완전히 숨김 - 스타일 적용 완료');
        }

        // 시작 버튼도 숨김
        const startButton = document.getElementById('start-button');
        console.log('[ShareLandingPage] start-button 요소:', startButton ? 'found' : 'NOT FOUND');

        if (startButton) {
            startButton.style.display = 'none';
            console.log('[ShareLandingPage] 게임 시작 버튼 숨김');
        }
    }

    /**
     * 랜딩 페이지 즉시 표시 (의존성 없이)
     */
    showLandingPageImmediate() {
        // 모달 요소 가져오기
        this.landingModal = document.getElementById('share-landing-modal');
        this.landingCanvas = document.getElementById('landing-canvas');
        this.playButton = document.getElementById('landing-play-button');

        if (!this.landingModal || !this.landingCanvas || !this.playButton) {
            console.error('[ShareLandingPage] 랜딩 모달 요소를 찾을 수 없습니다.');
            return;
        }

        // 플레이 버튼 이벤트 설정
        this.setupPlayButton();

        // 모달 즉시 표시 + z-index 강제 설정 (로딩 화면보다 위)
        this.landingModal.classList.remove('hidden');
        this.landingModal.style.zIndex = '10001'; // 로딩 화면(10000)보다 높게

        // Canvas에 로딩 메시지 표시
        this.showLoadingMessage();

        console.log('[ShareLandingPage] 랜딩 페이지 즉시 표시 완료 (z-index: 10001)');
    }

    /**
     * Canvas에 로딩 메시지 표시
     */
    showLoadingMessage() {
        if (!this.landingCanvas) return;

        const ctx = this.landingCanvas.getContext('2d');
        // GameConfig에서 캔버스 크기 가져오기
        const dimensions = GameConfig?.sharing?.landingPage?.dimensions || { width: 1200, height: 1000 };
        const width = dimensions.width;
        const height = dimensions.height;

        this.landingCanvas.width = width;
        this.landingCanvas.height = height;

        // CSS 스타일은 화면에 맞게 축소 (비율 유지)
        const maxWidth = GameConfig?.sharing?.landingPage?.imageMaxWidth || 600;
        const scale = Math.min(1, maxWidth / width);
        const displayWidth = width * scale;
        const displayHeight = height * scale;

        this.landingCanvas.style.width = `${displayWidth}px`;
        this.landingCanvas.style.height = `${displayHeight}px`;

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // 로딩 텍스트 (큰 폰트)
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const loadingText = I18nHelper?.getText('auto_battle_card_game.ui.share_image_loading_message') || '🎮 Loading hand image...';
        ctx.fillText(loadingText, width / 2, height / 2);
    }

    /**
     * 의존성 대기 후 이미지 렌더링 (ShareSystem, ShareImageGenerator)
     * @param {string} shareParam - Base64 인코딩된 공유 데이터
     */
    async waitForDependencies(shareParam) {
        const maxWait = 5000; // 5초
        const interval = 100;
        let waited = 0;

        console.log('[ShareLandingPage] 의존성 대기 시작...');

        const checkDependencies = () => {
            // ShareSystem이 없으면 직접 생성
            if (!this.shareSystem && window.ShareSystem) {
                console.log('[ShareLandingPage] ShareSystem 직접 생성...');
                this.shareSystem = new ShareSystem(this.gameManager);
            }

            // CardRenderer와 i18n이 준비되면 ImageGenerator 초기화
            if (this.shareSystem && !this.imageGenerator) {
                const cardRenderer = this.gameManager?.cardRenderer;
                const i18nSystem = window.i18nSystem;

                if (cardRenderer && i18nSystem) {
                    console.log('[ShareLandingPage] ImageGenerator 초기화...');
                    this.shareSystem.setImageGenerator(cardRenderer, i18nSystem);
                    this.imageGenerator = this.shareSystem.imageGenerator;
                }
            }

            // 디버그 로그
            if (waited % 500 === 0) {
                console.log(`[ShareLandingPage] 의존성 체크 (${waited}ms):`, {
                    gameManager: !!this.gameManager,
                    cardRenderer: !!this.gameManager?.cardRenderer,
                    i18nSystem: !!window.i18nSystem,
                    shareSystem: !!this.shareSystem,
                    imageGenerator: !!this.imageGenerator
                });
            }

            if (this.shareSystem && this.imageGenerator) {
                // 의존성 준비 완료 - 이미지 렌더링
                console.log('[ShareLandingPage] 의존성 준비 완료! 이미지 렌더링 시작');
                this.handleShareLink(shareParam);
                return true;
            }

            waited += interval;
            if (waited >= maxWait) {
                console.error('[ShareLandingPage] 의존성 대기 시간 초과 (5초)');
                console.error('[ShareLandingPage] 현재 상태:', {
                    gameManager: !!this.gameManager,
                    cardRenderer: !!this.gameManager?.cardRenderer,
                    i18nSystem: !!window.i18nSystem,
                    shareSystem: !!this.shareSystem,
                    imageGenerator: !!this.imageGenerator
                });
                // Fallback: 이미지 없이 진행
                this.updateTitle('battle'); // 기본 타이틀
                this.showErrorMessage();
                return true;
            }

            setTimeout(checkDependencies, interval);
            return false;
        };

        checkDependencies();
    }

    /**
     * 이미지 로딩 실패 메시지 표시
     */
    showErrorMessage() {
        if (!this.landingCanvas) return;

        const ctx = this.landingCanvas.getContext('2d');
        const width = 600;
        const height = 400;

        this.landingCanvas.width = width;
        this.landingCanvas.height = height;
        this.landingCanvas.style.width = `${width}px`;
        this.landingCanvas.style.height = `${height}px`;

        // 배경
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // 에러 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const errorTitle = I18nHelper?.getText('auto_battle_card_game.ui.share_image_load_failed_title') || '⚠️ Image Load Failed';
        ctx.fillText(errorTitle, width / 2, height / 2 - 20);
        ctx.font = '18px Arial';
        const errorMessage = I18nHelper?.getText('auto_battle_card_game.ui.share_image_load_failed_message') || 'Click the button below to start the game';
        ctx.fillText(errorMessage, width / 2, height / 2 + 20);
    }

    /**
     * 공유 링크 처리 (이미지 렌더링)
     * @param {string} encoded - Base64 인코딩된 공유 데이터
     */
    async handleShareLink(encoded) {
        if (!this.shareSystem) {
            console.error('[ShareLandingPage] ShareSystem이 초기화되지 않았습니다.');
            return;
        }

        // 데이터 디코딩
        const shareData = this.shareSystem.decodeShareData(encoded);

        if (!shareData) {
            console.error('[ShareLandingPage] 공유 데이터 디코딩 실패');
            return;
        }

        console.log('[ShareLandingPage] 디코딩된 데이터:', shareData);

        // 카드 ID → 카드 객체 변환
        const cards = this.reconstructCards(shareData.cardIds);

        // 손패 이미지 생성 및 렌더링
        await this.renderHandImage(cards, shareData);

        // 타이틀 업데이트
        this.updateTitle(shareData.type);

        console.log('[ShareLandingPage] 이미지 렌더링 완료');
    }

    /**
     * 카드 ID 배열 → 카드 객체 배열 변환
     * @param {Array<string>} cardIds - 카드 ID 배열
     * @returns {Array<Object>} 카드 객체 배열
     */
    reconstructCards(cardIds) {
        if (!cardIds || cardIds.length === 0) {
            console.warn('[ShareLandingPage] 카드 ID가 없습니다.');
            return [];
        }

        // CardDatabase에서 카드 정보 조회
        const cards = cardIds.map(cardId => {
            const cardData = window.CardDatabase?.getCard(cardId);
            if (!cardData) {
                console.warn(`[ShareLandingPage] 카드를 찾을 수 없음: ${cardId}`);
                return null;
            }
            return { ...cardData, id: cardId };
        }).filter(card => card !== null);

        console.log(`[ShareLandingPage] ${cards.length}개 카드 복원 완료`);
        return cards;
    }

    /**
     * 손패 이미지 렌더링
     * @param {Array<Object>} cards - 카드 배열
     * @param {Object} shareData - 공유 데이터
     */
    async renderHandImage(cards, shareData) {
        if (!this.imageGenerator || !this.landingCanvas) {
            console.error('[ShareLandingPage] ImageGenerator 또는 Canvas가 없습니다.');
            return;
        }

        try {
            // ShareImageGenerator를 사용하여 손패 이미지 생성
            let imageBlob = null;

            if (shareData.type === 'victory') {
                imageBlob = await this.imageGenerator.generateVictoryImage(
                    shareData.stage,
                    cards,
                    shareData.element
                );
            } else if (shareData.type === 'defeat' || shareData.type === 'complete') {
                imageBlob = await this.imageGenerator.generateDefeatImage(
                    shareData.stage,
                    shareData.stats || {},
                    cards,
                    shareData.element
                );
            } else if (shareData.type === 'battle') {
                // 배틀 중 공유 (게임 상태 정보 필요)
                imageBlob = await this.imageGenerator.generateHandImage(cards, {
                    stage: shareData.stage,
                    element: shareData.element
                });
            }

            if (!imageBlob) {
                console.error('[ShareLandingPage] 이미지 생성 실패');
                return;
            }

            // Blob → Image → Canvas 렌더링
            const img = new Image();
            const url = URL.createObjectURL(imageBlob);

            img.onload = () => {
                // 캔버스는 원본 크기로 설정 (고해상도 유지)
                this.landingCanvas.width = img.width;
                this.landingCanvas.height = img.height;

                // CSS 스타일은 화면에 맞게 축소 (비율 유지)
                const maxWidth = GameConfig?.sharing?.landingPage?.imageMaxWidth || 600;
                const scale = Math.min(1, maxWidth / img.width);
                const displayWidth = img.width * scale;
                const displayHeight = img.height * scale;

                // width와 height를 모두 명시 (Flexbox의 강제 크기 조정 방지)
                this.landingCanvas.style.width = `${displayWidth}px`;
                this.landingCanvas.style.height = `${displayHeight}px`;

                // 이미지 그리기 (원본 크기 그대로)
                const ctx = this.landingCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // 메모리 해제
                URL.revokeObjectURL(url);

                console.log('[ShareLandingPage] 이미지 렌더링 완료:', img.width, 'x', img.height, '→ 표시:', displayWidth, 'x', displayHeight);
            };

            img.onerror = () => {
                console.error('[ShareLandingPage] 이미지 로드 실패');
                URL.revokeObjectURL(url);
            };

            img.src = url;
        } catch (error) {
            console.error('[ShareLandingPage] 이미지 렌더링 에러:', error);
        }
    }

    /**
     * 플레이 버튼 설정
     */
    setupPlayButton() {
        if (!this.playButton) return;

        // 기존 이벤트 제거
        const newButton = this.playButton.cloneNode(true);
        this.playButton.parentNode.replaceChild(newButton, this.playButton);
        this.playButton = newButton;

        // 클릭 이벤트
        this.playButton.addEventListener('click', () => {
            this.handlePlayButtonClick();
        });
    }

    /**
     * 플레이 버튼 클릭 처리
     */
    handlePlayButtonClick() {
        // 사운드 재생
        if (this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(
                GameConfig?.audio?.uiSounds?.buttonClick || 'click'
            );
        }

        // 현재 언어 가져오기
        const currentLang = localStorage.getItem('selectedLanguage') || window.i18n?.currentLanguage || 'ko';

        // URL 파라미터 제거하고 메인 게임으로 이동 (언어는 유지)
        const baseUrl = GameConfig?.sharing?.baseUrl || window.location.origin + window.location.pathname;

        // 같은 도메인이면 파라미터만 제거하고 언어 파라미터 추가
        if (window.location.origin === new URL(baseUrl).origin) {
            window.location.href = `${window.location.pathname}?lang=${currentLang}`;
        } else {
            // 다른 도메인이면 baseUrl로 이동 (언어 파라미터 포함)
            window.location.href = `${baseUrl}?lang=${currentLang}`;
        }
    }

    /**
     * 타이틀 업데이트
     * @param {string} type - 공유 타입 ('victory', 'defeat', 'complete', 'battle')
     */
    updateTitle(type) {
        const titleElement = document.getElementById('landing-title');
        if (!titleElement) return;

        const titleKey = `auto_battle_card_game.ui.share_landing_title_${type}`;
        const fallbackKey = 'auto_battle_card_game.ui.share_landing_title';

        let titleText = I18nHelper?.getText(titleKey);
        if (!titleText) {
            titleText = I18nHelper?.getText(fallbackKey) || '공유된 손패';
        }

        titleElement.textContent = titleText;
    }

    /**
     * 랜딩 모달 닫기 (외부 호출용)
     */
    hideLandingModal() {
        if (this.landingModal) {
            this.landingModal.classList.add('hidden');
        }
    }
}

// 전역 객체로 등록
window.ShareLandingPage = ShareLandingPage;
