/**
 * ShareSystem - 게임 공유 시스템
 * Native Share API (모바일) + SNS 공유 (Twitter, Facebook) + URL 복사
 */
class ShareSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.config = GameConfig?.sharing || {};

        // 모달 요소들
        this.shareModal = null;
        this.shareModalContent = null;
        this.platformButtons = {};

        // 현재 공유 데이터
        this.currentShareData = null;

        // 공유 진행 상태 (중복 호출 방지)
        this.isSharing = false;

        // ShareImageGenerator 초기화 (나중에 설정)
        this.imageGenerator = null;

        // 초기화
        this.initializeShareModal();
        this.initializeEventListeners();
    }

    /**
     * ShareImageGenerator 설정 (GameManager에서 호출)
     * @param {CardRenderer} cardRenderer
     * @param {Object} i18n
     */
    setImageGenerator(cardRenderer, i18n) {
        if (!this.imageGenerator && window.ShareImageGenerator) {
            this.imageGenerator = new ShareImageGenerator(cardRenderer, GameConfig, i18n);
            console.log('[ShareSystem] ShareImageGenerator initialized');
        }
    }

    /**
     * 공유 모달 초기화
     */
    initializeShareModal() {
        this.shareModal = document.getElementById('share-modal');
        this.shareModalContent = document.querySelector('#share-modal .modal-content');

        // 플랫폼 버튼들
        this.platformButtons = {
            twitter: document.getElementById('share-twitter'),
            facebook: document.getElementById('share-facebook'),
            discord: document.getElementById('share-discord'),
            copy: document.getElementById('share-copy'),
            cancel: document.getElementById('share-cancel')
        };
    }

    /**
     * 이벤트 리스너 초기화
     */
    initializeEventListeners() {
        // Twitter 공유
        if (this.platformButtons.twitter) {
            this.platformButtons.twitter.addEventListener('click', () => {
                this.shareToTwitter();
            });
        }

        // Facebook 공유
        if (this.platformButtons.facebook) {
            this.platformButtons.facebook.addEventListener('click', () => {
                this.shareToFacebook();
            });
        }

        // Discord 공유 (미구현)
        if (this.platformButtons.discord) {
            this.platformButtons.discord.addEventListener('click', () => {
                this.shareToDiscord();
            });
        }

        // URL 복사
        if (this.platformButtons.copy) {
            this.platformButtons.copy.addEventListener('click', () => {
                this.copyToClipboard();
            });
        }

        // 취소
        if (this.platformButtons.cancel) {
            this.platformButtons.cancel.addEventListener('click', () => {
                this.hideShareModal();
            });
        }

        // 모달 외부 클릭 시 닫기
        if (this.shareModal) {
            this.shareModal.addEventListener('click', (e) => {
                if (e.target === this.shareModal) {
                    this.hideShareModal();
                }
            });
        }
    }

    /**
     * 공유 처리 (메인 함수)
     * @param {string} type - 공유 타입 ('victory', 'defeat', 'complete')
     * @param {Object} gameStats - 게임 통계 데이터
     */
    async share(type, gameStats) {
        if (!this.config.enabled) {
            console.warn('[ShareSystem] 공유 기능이 비활성화되어 있습니다.');
            return;
        }

        // 공유 데이터 생성
        this.currentShareData = this.createShareData(type, gameStats);

        // 모바일 환경에서 Native Share API 사용 가능 시
        if (this.isMobile() && this.config.platforms?.native?.enabled) {
            const success = await this.tryNativeShare();
            if (success) return; // Native Share 성공 시 종료
        }

        // PC 또는 Native Share 실패 시 플랫폼 선택 모달 표시
        this.showShareModal();
    }

    /**
     * 공유 데이터 생성
     * @param {string} type - 공유 타입
     * @param {Object} gameStats - 게임 통계
     * @returns {Object} 공유 데이터
     */
    createShareData(type, gameStats) {
        const currentLang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';

        // 속성 이름 가져오기
        const elementName = this.getElementName(gameStats.element || 'normal', currentLang);

        // 플레이 스타일 번역
        const playStyleKey = `auto_battle_card_game.ui.play_style_${gameStats.style || 'balanced'}`;
        const playStyle = I18nHelper?.getText(playStyleKey) || gameStats.style || 'balanced';

        // URL 생성
        const shareUrl = this.generateShareUrl(type, gameStats);

        // 메시지 생성
        const message = this.generateShareMessage(type, {
            stage: gameStats.stage || 1,
            element: elementName,
            style: playStyle,
            damage: gameStats.damage || 0,
            turns: gameStats.turns || 0
        }, currentLang);

        // 제목 생성
        const title = this.generateShareTitle(type, gameStats, currentLang);

        return {
            type,
            title,
            message,
            url: shareUrl,
            fullText: `${message}\n${shareUrl}`,
            gameStats
        };
    }

    /**
     * 속성 이름 가져오기 (다국어)
     * @param {string} element - 속성
     * @param {string} lang - 언어 코드
     * @returns {string} 속성 이름
     */
    getElementName(element, lang) {
        const elementConfig = GameConfig?.elements?.[element];
        if (elementConfig && elementConfig.elementNames) {
            return elementConfig.elementNames[lang] || elementConfig.elementNames['ko'] || element;
        }
        return element;
    }

    /**
     * 공유 제목 생성 (i18n 사용)
     * @param {string} type - 공유 타입
     * @param {Object} gameStats - 게임 통계
     * @param {string} lang - 언어 코드
     * @returns {string} 제목
     */
    generateShareTitle(type, gameStats, lang) {
        // i18n 키 매핑
        const i18nKeys = {
            victory: 'auto_battle_card_game.ui.share_victory_title',
            defeat: 'auto_battle_card_game.ui.share_defeat_title',
            complete: 'auto_battle_card_game.ui.share_complete_title',
            battle: 'auto_battle_card_game.ui.share_battle_title'
        };

        // 기본값 매핑
        const fallbacks = {
            victory: '🎉 Stage Clear!',
            defeat: '⚔️ My Record',
            complete: '🏆 Game Complete!',
            battle: '🃏 Current Battle'
        };

        const i18nKey = i18nKeys[type];
        const fallback = fallbacks[type] || 'Card Battle Game';

        return I18nHelper?.getText(i18nKey) || fallback;
    }

    /**
     * 공유 메시지 생성 (템플릿 치환)
     * @param {string} type - 공유 타입
     * @param {Object} data - 치환 데이터
     * @param {string} lang - 언어 코드
     * @returns {string} 메시지
     */
    generateShareMessage(type, data, lang) {
        const template = this.config.messageTemplates?.[type]?.[lang] ||
                         this.config.messageTemplates?.[type]?.['ko'] ||
                         '';

        // 템플릿 변수 치환
        let message = template;
        Object.keys(data).forEach(key => {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key]);
        });

        return message;
    }

    /**
     * 공유 URL 생성
     * @param {string} type - 공유 타입
     * @param {Object} gameStats - 게임 통계
     * @returns {string} 공유 URL
     */
    generateShareUrl(type, gameStats) {
        // 설정에서 baseUrl 가져오기 (없으면 현재 URL 사용)
        const baseUrl = this.config.baseUrl || (window.location.origin + window.location.pathname);

        // 단순 URL 모드 (파라미터 없이 기본 URL만)
        if (this.config.useSimpleUrl) {
            return baseUrl;
        }

        if (!this.config.urlParams?.enabled) {
            return baseUrl;
        }

        // URL 파라미터 생성
        const params = new URLSearchParams();
        const paramNames = this.config.urlParams.paramNames || {};

        // 공유 타입
        params.set(paramNames.share || 's', type);

        // 스테이지
        if (gameStats.stage) {
            params.set(paramNames.stage || 'st', gameStats.stage);
        }

        // 플레이어 이름
        if (gameStats.player) {
            params.set(paramNames.player || 'p', encodeURIComponent(gameStats.player));
        }

        // 속성
        if (gameStats.element) {
            params.set(paramNames.element || 'e', gameStats.element);
        }

        // 플레이 스타일
        if (gameStats.style) {
            params.set(paramNames.style || 'ps', gameStats.style);
        }

        // 대미지
        if (gameStats.damage) {
            params.set(paramNames.damage || 'dm', gameStats.damage);
        }

        // 턴 수
        if (gameStats.turns) {
            params.set(paramNames.turns || 't', gameStats.turns);
        }

        // 덱 구성 (압축)
        if (gameStats.deck && Array.isArray(gameStats.deck)) {
            const deckString = gameStats.deck.join(',');
            if (this.config.urlParams.compress) {
                // Base64 인코딩 (압축)
                try {
                    const compressed = btoa(deckString);
                    params.set(paramNames.deck || 'd', compressed);
                } catch (e) {
                    console.warn('[ShareSystem] 덱 압축 실패:', e);
                    params.set(paramNames.deck || 'd', deckString);
                }
            } else {
                params.set(paramNames.deck || 'd', deckString);
            }
        }

        const fullUrl = `${baseUrl}?${params.toString()}`;

        // URL 길이 체크
        if (fullUrl.length > (this.config.urlParams.maxLength || 2000)) {
            console.warn('[ShareSystem] URL이 너무 깁니다. 덱 정보를 제외합니다.');
            params.delete(paramNames.deck || 'd');
            return `${baseUrl}?${params.toString()}`;
        }

        return fullUrl;
    }

    /**
     * Native Share API 시도 (모바일)
     * @returns {Promise<boolean>} 성공 여부
     */
    async tryNativeShare() {
        if (!navigator.share) {
            console.log('[ShareSystem] Native Share API를 지원하지 않습니다.');
            return false;
        }

        if (!this.currentShareData) {
            console.error('[ShareSystem] 공유 데이터가 없습니다.');
            return false;
        }

        try {
            await navigator.share({
                title: this.currentShareData.title,
                text: this.currentShareData.message,
                url: this.currentShareData.url
            });

            console.log('[ShareSystem] Native Share 성공');

            // 성공 메시지 표시 (선택)
            if (this.config.platforms?.clipboard?.showToast) {
                this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_success') || '🎉 공유 완료!', 'success');
            }

            return true;
        } catch (error) {
            // 사용자가 취소한 경우 (AbortError)
            if (error.name === 'AbortError') {
                console.log('[ShareSystem] 사용자가 공유를 취소했습니다.');
                return true; // 취소도 "성공"으로 처리 (모달 표시하지 않음)
            }

            console.warn('[ShareSystem] Native Share 실패:', error);

            // Fallback: 클립보드 복사
            if (this.config.platforms?.native?.fallbackToClipboard) {
                return await this.copyToClipboardDirect();
            }

            return false;
        }
    }

    /**
     * Twitter 공유
     */
    shareToTwitter() {
        if (!this.config.platforms?.twitter?.enabled || !this.currentShareData) return;

        const twitterConfig = this.config.platforms.twitter;
        const params = new URLSearchParams();

        // 텍스트 (메시지 + URL)
        params.set('text', this.currentShareData.fullText);

        // 해시태그
        if (twitterConfig.hashtags && twitterConfig.hashtags.length > 0) {
            params.set('hashtags', twitterConfig.hashtags.join(','));
        }

        // via (트위터 계정)
        if (twitterConfig.via) {
            params.set('via', twitterConfig.via);
        }

        // related (관련 계정)
        if (twitterConfig.related) {
            params.set('related', twitterConfig.related);
        }

        const twitterUrl = `${twitterConfig.baseUrl}?${params.toString()}`;

        // 새 창으로 열기
        window.open(twitterUrl, '_blank', 'width=550,height=420');

        console.log('[ShareSystem] Twitter 공유 시도');
        this.hideShareModal();
    }

    /**
     * Facebook 공유
     */
    shareToFacebook() {
        if (!this.config.platforms?.facebook?.enabled || !this.currentShareData) return;

        const facebookConfig = this.config.platforms.facebook;
        const params = new URLSearchParams();

        // URL
        params.set('u', this.currentShareData.url);

        // App ID (선택)
        if (facebookConfig.appId) {
            params.set('app_id', facebookConfig.appId);
        }

        const facebookUrl = `${facebookConfig.baseUrl}?${params.toString()}`;

        // 새 창으로 열기
        window.open(facebookUrl, '_blank', 'width=550,height=420');

        console.log('[ShareSystem] Facebook 공유 시도');
        this.hideShareModal();
    }

    /**
     * Discord 공유 (미구현)
     */
    shareToDiscord() {
        console.warn('[ShareSystem] Discord 공유는 아직 구현되지 않았습니다.');
        const message = I18nHelper?.getText('auto_battle_card_game.ui.share_discord_coming_soon') || 'Discord sharing coming soon!';
        this.showToast(message, 'info');
    }

    /**
     * URL 클립보드 복사
     */
    async copyToClipboard() {
        const success = await this.copyToClipboardDirect();
        if (success) {
            this.hideShareModal();
        }
    }

    /**
     * URL 클립보드 복사 (직접 호출)
     * @returns {Promise<boolean>} 성공 여부
     */
    async copyToClipboardDirect() {
        if (!this.currentShareData) {
            console.error('[ShareSystem] 공유 데이터가 없습니다.');
            return false;
        }

        try {
            await navigator.clipboard.writeText(this.currentShareData.url);
            console.log('[ShareSystem] URL 복사 성공');

            // 토스트 메시지
            if (this.config.platforms?.clipboard?.showToast) {
                this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_copied') || '🔗 링크가 복사되었어요!', 'success');
            }

            return true;
        } catch (error) {
            console.error('[ShareSystem] URL 복사 실패:', error);
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_failed') || '❌ 복사에 실패했어요.', 'error');
            return false;
        }
    }

    /**
     * 공유 모달 표시
     */
    showShareModal() {
        if (!this.shareModal) {
            console.error('[ShareSystem] 공유 모달이 없습니다.');
            return;
        }

        // 플랫폼 버튼 활성화/비활성화
        this.updatePlatformButtons();

        // 모달 표시
        this.shareModal.classList.remove('hidden');

        // 버튼 클릭 사운드 재생
        if (this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
        }
    }

    /**
     * 공유 모달 숨김
     */
    hideShareModal() {
        if (this.shareModal) {
            this.shareModal.classList.add('hidden');
        }

        // 버튼 클릭 사운드 재생
        if (this.gameManager?.audioSystem) {
            this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
        }
    }

    /**
     * 플랫폼 버튼 활성화/비활성화 업데이트
     */
    updatePlatformButtons() {
        // Twitter
        if (this.platformButtons.twitter) {
            const enabled = this.config.platforms?.twitter?.enabled || false;
            this.platformButtons.twitter.style.display = enabled ? 'flex' : 'none';
        }

        // Facebook
        if (this.platformButtons.facebook) {
            const enabled = this.config.platforms?.facebook?.enabled || false;
            this.platformButtons.facebook.style.display = enabled ? 'flex' : 'none';
        }

        // Discord
        if (this.platformButtons.discord) {
            const enabled = this.config.platforms?.discord?.enabled || false;
            this.platformButtons.discord.style.display = enabled ? 'flex' : 'none';
        }

        // URL 복사는 항상 표시
        if (this.platformButtons.copy) {
            this.platformButtons.copy.style.display = 'flex';
        }
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지 내용
     * @param {string} type - 메시지 타입 ('success', 'error', 'info')
     */
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.share-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 토스트 요소 생성
        const toast = document.createElement('div');
        toast.className = `share-toast share-toast-${type}`;
        toast.textContent = message;

        // 스타일 적용
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
        toast.style.color = 'white';
        toast.style.fontSize = '16px';
        toast.style.fontWeight = 'bold';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        toast.style.zIndex = '10000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';

        // DOM에 추가
        document.body.appendChild(toast);

        // 페이드 인 애니메이션
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        // 자동 제거
        const duration = this.config.platforms?.clipboard?.toastDuration || 2000;
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 모바일 환경 감지
     * @returns {boolean} 모바일 여부
     */
    isMobile() {
        // User Agent 기반 감지
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

        // 터치 지원 여부
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // 화면 크기
        const smallScreen = window.innerWidth <= 768;

        return mobileRegex.test(userAgent.toLowerCase()) || (hasTouch && smallScreen);
    }

    /**
     * Open Graph 메타태그 업데이트 (동적 공유 최적화)
     * @param {Object} shareData - 공유 데이터
     */
    updateOpenGraphTags(shareData) {
        if (!this.config.openGraph?.enabled) return;

        // 기존 OG 태그 제거
        const existingTags = document.querySelectorAll('meta[property^="og:"]');
        existingTags.forEach(tag => tag.remove());

        // 새 OG 태그 생성
        const ogTags = {
            'og:title': shareData.title || this.config.openGraph.defaultTitle,
            'og:description': shareData.message || this.config.openGraph.defaultDescription,
            'og:url': shareData.url,
            'og:type': this.config.openGraph.type || 'website',
            'og:site_name': this.config.openGraph.siteName || 'Card Battle Game'
        };

        // 이미지 (기본 이미지)
        if (this.config.openGraph.defaultImage) {
            ogTags['og:image'] = window.location.origin + this.config.openGraph.defaultImage;
        }

        // DOM에 추가
        Object.entries(ogTags).forEach(([property, content]) => {
            const meta = document.createElement('meta');
            meta.setAttribute('property', property);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
        });

        console.log('[ShareSystem] Open Graph 태그 업데이트 완료');
    }

    /**
     * 이미지와 함께 공유 (Native Share API with files)
     * @param {Blob} imageBlob - 공유할 이미지 Blob
     * @param {string} title - 공유 제목
     * @param {string} text - 공유 텍스트
     * @param {string} url - 공유 URL
     * @returns {Promise<boolean>}
     */
    async shareWithImage(imageBlob, title, text, url) {
        // 중복 호출 방지
        if (this.isSharing) {
            console.warn('[ShareSystem] 이미 공유 진행 중입니다.');
            return false;
        }

        if (!navigator.share || !navigator.canShare) {
            console.log('[ShareSystem] Native Share API를 지원하지 않습니다.');
            // Fallback: 이미지 다운로드 + URL 복사
            if (this.imageGenerator) {
                this.imageGenerator.downloadImage(imageBlob, 'card-battle-share.png');
            }
            await this.copyToClipboardDirect(url);
            return false;
        }

        try {
            this.isSharing = true;

            const file = new File([imageBlob], 'card-battle-share.png', { type: 'image/png' });

            // 텍스트에 URL 포함 (파일 공유 시 text만 인식되는 플랫폼 대응)
            const fullText = text.includes(url) ? text : `${text}\n\n${url}`;
            const shareData = { files: [file], text: fullText };

            // 파일 공유 지원 확인
            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                console.log('[ShareSystem] 이미지 공유 성공');

                // 이미지 공유 후 텍스트를 클립보드에 자동 복사
                await this.copyTextToClipboard(fullText);

                return true;
            } else {
                console.log('[ShareSystem] 파일 공유를 지원하지 않습니다.');
                // Fallback: 텍스트만 공유
                await navigator.share({ title, text: fullText });
                return true;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[ShareSystem] 사용자가 공유를 취소했습니다.');
                return false;
            }
            console.error('[ShareSystem] 공유 실패:', error);
            // Fallback: 이미지 다운로드
            if (this.imageGenerator) {
                this.imageGenerator.downloadImage(imageBlob, 'card-battle-share.png');
            }
            return false;
        } finally {
            this.isSharing = false;
        }
    }

    /**
     * 현재 손패 공유 (배틀 중)
     * @param {Array} cards - 현재 손패
     * @param {Object} gameState - { stage, playerHP, playerMaxHP, enemyHP, enemyMaxHP, element }
     */
    async shareHandImage(cards, gameState) {
        if (!this.imageGenerator) {
            console.error('[ShareSystem] ShareImageGenerator가 초기화되지 않았습니다.');
            return;
        }

        try {
            // 로딩 표시
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_generating_image') || '이미지 생성 중...', 'info');

            // 이미지 생성
            const imageBlob = await this.imageGenerator.generateHandImage(cards, gameState);

            // 현재 언어 가져오기
            const lang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';

            // 속성 이름 다국어 처리
            const elementName = this.getElementName(gameState.element || 'normal', lang);

            // GameConfig 'battle' 템플릿 사용하여 메시지 생성
            const message = this.generateShareMessage('battle', {
                stage: gameState.stage || 1,
                element: elementName
            }, lang);

            // i18n 타이틀 사용
            const title = I18nHelper?.getText('auto_battle_card_game.ui.share_battle_title') || '🃏 Current Battle';
            const url = this.config.baseUrl || 'https://binboxgames.com/games/card-battle-game/';

            // 공유 실행
            await this.shareWithImage(imageBlob, title, message, url);
        } catch (error) {
            console.error('[ShareSystem] 손패 이미지 공유 실패:', error);
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_failed') || '❌ 공유 실패', 'error');
        }
    }

    /**
     * 승리 이미지 공유 (기존 공유 개선)
     * @param {number} stage
     * @param {Array} cards
     * @param {string} element
     */
    async shareVictoryImage(stage, cards, element) {
        if (!this.imageGenerator) {
            console.error('[ShareSystem] ShareImageGenerator가 초기화되지 않았습니다.');
            return;
        }

        try {
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_generating_image') || '이미지 생성 중...', 'info');

            const imageBlob = await this.imageGenerator.generateVictoryImage(stage, cards, element);

            // 현재 언어 가져오기
            const lang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';

            // 속성 이름 다국어 처리
            const elementName = this.getElementName(element, lang);

            // GameConfig 템플릿 사용하여 메시지 생성
            const message = this.generateShareMessage('victory', {
                stage: stage,
                element: elementName
            }, lang);

            // i18n 타이틀 사용
            const title = I18nHelper?.getText('auto_battle_card_game.ui.share_victory_title') || '🎉 Stage Clear!';
            const url = this.config.baseUrl || 'https://binboxgames.com/games/card-battle-game/';

            await this.shareWithImage(imageBlob, title, message, url);
        } catch (error) {
            console.error('[ShareSystem] 승리 이미지 공유 실패:', error);
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_failed') || '❌ 공유 실패', 'error');
        }
    }

    /**
     * 패배/완료 이미지 공유 (기존 공유 개선)
     * @param {number} stage - 도달 스테이지
     * @param {Object} stats - 게임 통계 {totalDamageDealt, totalTurns, playStyle, isGameComplete, etc.}
     * @param {Array} cards - 최종 손패
     * @param {string} element - 덱 속성
     */
    async shareDefeatImage(stage, stats, cards, element) {
        if (!this.imageGenerator) {
            console.error('[ShareSystem] ShareImageGenerator가 초기화되지 않았습니다.');
            return;
        }

        try {
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_generating_image') || '이미지 생성 중...', 'info');

            const imageBlob = await this.imageGenerator.generateDefeatImage(stage, stats, cards, element);

            // 현재 언어 가져오기
            const lang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';

            // 게임 클리어 여부에 따라 공유 타입 결정
            const type = stats?.isGameComplete ? 'complete' : 'defeat';

            // 속성 이름 다국어 처리
            const elementName = this.getElementName(element, lang);

            // 플레이 스타일 다국어 처리
            const playStyleKey = `auto_battle_card_game.ui.play_style_${stats?.playStyle || 'balanced'}`;
            const playStyleText = I18nHelper?.getText(playStyleKey) || stats?.playStyle || 'Balanced';

            // GameConfig 템플릿 사용하여 메시지 생성
            const message = this.generateShareMessage(type, {
                stage: stage,
                element: elementName,
                style: playStyleText,
                damage: stats?.totalDamageDealt || 0,
                turns: stats?.totalTurns || 0
            }, lang);

            // 게임 클리어 여부에 따라 타이틀 결정
            const titleKey = type === 'complete' ? 'auto_battle_card_game.ui.share_complete_title' : 'auto_battle_card_game.ui.share_defeat_title';
            const title = I18nHelper?.getText(titleKey) || (type === 'complete' ? '🏆 Game Complete!' : '⚔️ My Record');
            const url = this.config.baseUrl || 'https://binboxgames.com/games/card-battle-game/';

            await this.shareWithImage(imageBlob, title, message, url);
        } catch (error) {
            console.error('[ShareSystem] 패배 이미지 공유 실패:', error);
            this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_failed') || '❌ 공유 실패', 'error');
        }
    }

    /**
     * URL 직접 클립보드 복사 (헬퍼 메서드)
     * @param {string} url
     */
    async copyToClipboardDirect(url) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_copied') || '🔗 링크 복사 완료!', 'success');
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast(I18nHelper?.getText('auto_battle_card_game.ui.share_copied') || '🔗 링크 복사 완료!', 'success');
            }
        } catch (error) {
            console.error('[ShareSystem] 클립보드 복사 실패:', error);
        }
    }

    /**
     * 텍스트를 클립보드에 복사 (이미지 공유 후 자동 호출)
     * @param {string} text - 복사할 텍스트
     */
    async copyTextToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);

                const message = I18nHelper?.getText('auto_battle_card_game.ui.share_text_copied')
                    || '📋 메시지가 복사되었습니다! 붙여넣기로 추가하세요';

                this.showToast(message, 'success');
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                const message = I18nHelper?.getText('auto_battle_card_game.ui.share_text_copied')
                    || '📋 메시지가 복사되었습니다! 붙여넣기로 추가하세요';

                this.showToast(message, 'success');
            }
        } catch (error) {
            console.warn('[ShareSystem] 클립보드 복사 실패 (무시):', error);
            // 조용히 실패 - 사용자에게 에러 표시 안함
        }
    }
}

// 전역 객체로 등록
window.ShareSystem = ShareSystem;
