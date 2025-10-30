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
        // ShareSystem 참조 대기
        this.waitForDependencies();
    }

    /**
     * 의존성 대기 (ShareSystem, ShareImageGenerator)
     */
    async waitForDependencies() {
        const maxWait = 5000; // 5초
        const interval = 100;
        let waited = 0;

        const checkDependencies = () => {
            this.shareSystem = this.gameManager?.shareSystem;
            this.imageGenerator = this.shareSystem?.imageGenerator;

            if (this.shareSystem && this.imageGenerator) {
                // 의존성 준비 완료
                this.checkForShareParams();
                return true;
            }

            waited += interval;
            if (waited >= maxWait) {
                console.warn('[ShareLandingPage] 의존성 대기 시간 초과');
                // Fallback: 파라미터 체크만 진행
                this.checkForShareParams();
                return true;
            }

            setTimeout(checkDependencies, interval);
            return false;
        };

        checkDependencies();
    }

    /**
     * URL 파라미터에서 'share' 감지
     */
    checkForShareParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareParam = urlParams.get('share');

        if (shareParam) {
            console.log('[ShareLandingPage] 공유 링크 감지:', shareParam);
            this.handleShareLink(shareParam);
        }
    }

    /**
     * 공유 링크 처리
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

        // 랜딩 페이지 표시
        await this.showLandingPage(shareData);
    }

    /**
     * 랜딩 페이지 표시
     * @param {Object} shareData - { type, stage, element, cardIds, stats }
     */
    async showLandingPage(shareData) {
        // 모달 요소 가져오기
        this.landingModal = document.getElementById('share-landing-modal');
        this.landingCanvas = document.getElementById('landing-canvas');
        this.playButton = document.getElementById('landing-play-button');

        if (!this.landingModal || !this.landingCanvas || !this.playButton) {
            console.error('[ShareLandingPage] 랜딩 모달 요소를 찾을 수 없습니다.');
            return;
        }

        // 카드 ID → 카드 객체 변환
        const cards = this.reconstructCards(shareData.cardIds);

        // 손패 이미지 생성 및 렌더링
        await this.renderHandImage(cards, shareData);

        // 플레이 버튼 이벤트 설정
        this.setupPlayButton();

        // 모달 표시
        this.landingModal.classList.remove('hidden');

        // 타이틀 업데이트
        this.updateTitle(shareData.type);

        console.log('[ShareLandingPage] 랜딩 페이지 표시 완료');
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
            const cardData = CardDatabase?.[cardId];
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
                // Canvas 크기 조정
                const maxWidth = GameConfig?.sharing?.landingPage?.imageMaxWidth || 600;
                const aspectRatio = img.height / img.width;
                const canvasWidth = Math.min(img.width, maxWidth);
                const canvasHeight = canvasWidth * aspectRatio;

                this.landingCanvas.width = canvasWidth;
                this.landingCanvas.height = canvasHeight;

                // Canvas 스타일 설정 (CSS 크기)
                this.landingCanvas.style.width = `${canvasWidth}px`;
                this.landingCanvas.style.height = `${canvasHeight}px`;

                // 이미지 그리기
                const ctx = this.landingCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                // 메모리 해제
                URL.revokeObjectURL(url);

                console.log('[ShareLandingPage] 이미지 렌더링 완료');
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

        // URL 파라미터 제거하고 메인 게임으로 이동
        const baseUrl = GameConfig?.sharing?.baseUrl || window.location.origin + window.location.pathname;

        // 같은 도메인이면 파라미터만 제거
        if (window.location.origin === new URL(baseUrl).origin) {
            window.location.href = window.location.pathname;
        } else {
            // 다른 도메인이면 baseUrl로 이동
            window.location.href = baseUrl;
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
