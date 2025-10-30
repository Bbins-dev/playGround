/**
 * ShareImageGenerator.js
 *
 * Canvas 기반 공유 이미지 생성 시스템
 * - 손패, 승리, 패배, 덱 공유 이미지 생성
 * - CardRenderer 재사용으로 일관된 카드 표현
 * - SNS 최적화 (1200×630px)
 */

class ShareImageGenerator {
    /**
     * @param {CardRenderer} cardRenderer - 카드 렌더링 시스템
     * @param {Object} gameConfig - GameConfig.sharing.imageGeneration
     * @param {Object} i18n - 다국어 시스템
     */
    constructor(cardRenderer, gameConfig, i18n) {
        this.cardRenderer = cardRenderer;
        this.config = gameConfig?.sharing?.imageGeneration || {};
        this.i18n = i18n;

        // 설정 안전성 체크
        if (!this.config.enabled) {
            console.warn('[ShareImageGenerator] Image generation is disabled in config');
        }
    }

    /**
     * 손패 공유 이미지 생성 (배틀 중 공유)
     * @param {Array} cards - 현재 손패 카드 배열 (최대 5장)
     * @param {Object} gameState - { stage, playerHP, playerMaxHP, enemyHP, enemyMaxHP, element }
     * @returns {Promise<Blob>} PNG 이미지 Blob
     */
    async generateHandImage(cards, gameState) {
        const layout = this.config?.layouts?.hand || {};
        if (!layout.enabled) {
            throw new Error('Hand image generation is disabled');
        }

        // 캔버스 생성
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // 배경 렌더링 (속성별 그라디언트)
        this.renderBackground(ctx, canvas, gameState.element || 'normal');

        // 타이틀 렌더링
        const titleY = layout.titleY ?? 50;
        this.renderTitle(ctx, canvas, this.i18n?.t('auto_battle_card_game.ui.share_hand_title') || '🃏 My Hand', titleY);

        // 스테이지 정보 렌더링
        const subtitle = `Stage ${gameState.stage || '?'}`;
        const subtitleY = layout.subtitleY ?? 115;
        this.renderSubtitle(ctx, canvas, subtitle, subtitleY);

        // 카드 렌더링 (중앙 배치)
        const visibleCards = cards.slice(0, layout.maxCards || 5);
        const cardStartY = layout.cardStartY ?? 150;
        await this.renderCards(ctx, canvas, visibleCards, {
            columns: layout.columns || 3,
            spacing: layout.cardSpacing || 15,
            startY: cardStartY
        });

        // HP 오버레이 렌더링
        if (layout.showOverlay && gameState.playerHP !== undefined) {
            this.renderHPOverlay(ctx, canvas, {
                playerHP: gameState.playerHP,
                playerMaxHP: gameState.playerMaxHP ?? 100,
                playerName: gameState.playerName || 'Player',
                enemyHP: gameState.enemyHP,
                enemyMaxHP: gameState.enemyMaxHP ?? 100,
                enemyName: gameState.enemyName || 'Enemy'
            });
        }

        // URL 렌더링 (하단)
        this.renderFooter(ctx, canvas, 'hand');

        // Blob 변환
        return await this.canvasToBlob(canvas);
    }

    /**
     * 승리 공유 이미지 생성
     * @param {number} stage - 클리어한 스테이지
     * @param {Array} cards - 대표 카드 (최대 3장)
     * @param {string} element - 속성
     * @returns {Promise<Blob>}
     */
    async generateVictoryImage(stage, cards, element) {
        const layout = this.config?.layouts?.victory || {};
        if (!layout.enabled) {
            throw new Error('Victory image generation is disabled');
        }

        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // 배경
        this.renderBackground(ctx, canvas, element || 'normal');

        // 승리 뱃지
        if (layout.showBadge) {
            this.renderBadge(ctx, canvas, layout.badgeText || '🎉 CLEAR!');
        }

        // 스테이지 정보 (뱃지와 겹치지 않도록 y=90)
        let title = this.i18n?.t('auto_battle_card_game.ui.stage_cleared') || 'Stage {stage} Clear!';
        title = title.replace('{stage}', stage);
        this.renderTitle(ctx, canvas, title, 90);

        // 카드 렌더링
        const visibleCards = cards.slice(0, layout.maxCards || 3);
        await this.renderCards(ctx, canvas, visibleCards, {
            columns: layout.columns || 3,
            spacing: layout.cardSpacing || 20,
            startY: 180
        });

        // Footer
        this.renderFooter(ctx, canvas, 'victory');

        return await this.canvasToBlob(canvas);
    }

    /**
     * 패배 공유 이미지 생성
     * @param {number} stage - 도달한 스테이지
     * @param {Object} stats - { damage, turns, style }
     * @param {Array} cards - 최종 덱 대표 카드
     * @param {string} element - 속성
     * @returns {Promise<Blob>}
     */
    async generateDefeatImage(stage, stats, cards, element) {
        const layout = this.config?.layouts?.defeat || {};
        if (!layout.enabled) {
            throw new Error('Defeat image generation is disabled');
        }

        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // 배경
        this.renderBackground(ctx, canvas, element || 'normal');

        // 타이틀
        let title = this.i18n?.t('auto_battle_card_game.ui.stage_reached_template') || 'Reached Stage {stage}';
        title = title.replace('{stage}', stage);
        this.renderTitle(ctx, canvas, title);

        // 통계 정보
        if (layout.showStats) {
            this.renderStats(ctx, canvas, stats, 90);
        }

        // 카드 렌더링
        const visibleCards = cards.slice(0, layout.maxCards || 3);
        await this.renderCards(ctx, canvas, visibleCards, {
            columns: layout.columns || 3,
            spacing: layout.cardSpacing || 20,
            startY: 200
        });

        // Footer
        this.renderFooter(ctx, canvas, 'defeat');

        return await this.canvasToBlob(canvas);
    }

    /**
     * 덱 전체 공유 이미지 생성
     * @param {Array} cards - 전체 덱 (10장)
     * @param {string} element - 속성
     * @returns {Promise<Blob>}
     */
    async generateDeckImage(cards, element) {
        const layout = this.config?.layouts?.deck || {};
        if (!layout.enabled) {
            throw new Error('Deck image generation is disabled');
        }

        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // 배경
        this.renderBackground(ctx, canvas, element || 'normal');

        // 타이틀
        const elementName = element ? element.charAt(0).toUpperCase() + element.slice(1) : 'Normal';
        this.renderTitle(ctx, canvas, `🃏 ${elementName} Deck`);

        // 카드 렌더링 (2×5 그리드)
        const visibleCards = cards.slice(0, layout.maxCards || 10);
        await this.renderCards(ctx, canvas, visibleCards, {
            columns: layout.columns || 5,
            spacing: layout.cardSpacing || 10,
            startY: 120
        });

        // Footer
        this.renderFooter(ctx, canvas, 'deck');

        return await this.canvasToBlob(canvas);
    }

    // ==================== Helper Methods ====================

    /**
     * 캔버스 생성
     * @returns {HTMLCanvasElement}
     */
    createCanvas() {
        const width = this.config?.dimensions?.width || 1200;
        const height = this.config?.dimensions?.height || 630;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    /**
     * 배경 렌더링 (속성별 그라디언트)
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {string} element
     */
    renderBackground(ctx, canvas, element) {
        const bgColors = this.config?.elementBackgrounds?.[element] || {
            start: '#1a1a2e',
            end: '#16213e'
        };

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, bgColors.start);
        gradient.addColorStop(1, bgColors.end);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * 타이틀 텍스트 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {string} text
     * @param {number} y
     */
    renderTitle(ctx, canvas, text, y = 50) {
        const fontSize = this.config?.overlay?.fontSize?.title || 36;
        const color = this.config?.overlay?.textColor || '#ffffff';

        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(text, canvas.width / 2, y);
        ctx.shadowBlur = 0; // Reset shadow
    }

    /**
     * 서브타이틀 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {string} text
     * @param {number} y
     */
    renderSubtitle(ctx, canvas, text, y) {
        const fontSize = this.config?.overlay?.fontSize?.subtitle || 24;
        const color = this.config?.overlay?.textColor || '#ffffff';

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(text, canvas.width / 2, y);
    }

    /**
     * 카드 그리드 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {Array} cards
     * @param {Object} options - { columns, spacing, startY }
     */
    async renderCards(ctx, canvas, cards, options = {}) {
        const { columns = 3, spacing = 15, startY = 150 } = options;
        const cardWidth = this.config?.dimensions?.cardWidth || 150;
        const cardHeight = this.config?.dimensions?.cardHeight || 210;

        const rows = Math.ceil(cards.length / columns);
        const totalWidth = columns * cardWidth + (columns - 1) * spacing;
        const totalHeight = rows * cardHeight + (rows - 1) * spacing;

        const startX = (canvas.width - totalWidth) / 2;
        const gridStartY = startY;

        for (let i = 0; i < cards.length; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);

            const x = startX + col * (cardWidth + spacing);
            const y = gridStartY + row * (cardHeight + spacing);

            // CardRenderer 사용
            this.cardRenderer.renderCard(ctx, cards[i], x, y, cardWidth, cardHeight, {
                isSelected: false,
                showCost: true,
                showPower: true
            });
        }
    }

    /**
     * HP 오버레이 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {Object} hpData
     */
    renderHPOverlay(ctx, canvas, hpData) {
        const y = canvas.height - 80;
        const fontSize = this.config?.overlay?.fontSize?.info || 18;
        const color = this.config?.overlay?.textColor || '#ffffff';
        const bgColor = this.config?.overlay?.backgroundColor || 'rgba(0, 0, 0, 0.7)';

        // 배경
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, y - 10, canvas.width, 60);

        // HP 텍스트
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerY = y + 20;
        const leftX = canvas.width / 3;
        const rightX = (canvas.width / 3) * 2;

        ctx.fillText(`${hpData.playerName || 'Player'}: ${hpData.playerHP}/${hpData.playerMaxHP}`, leftX, centerY);
        ctx.fillText(`${hpData.enemyName || 'Enemy'}: ${hpData.enemyHP}/${hpData.enemyMaxHP}`, rightX, centerY);
    }

    /**
     * 승리 뱃지 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {string} text
     */
    renderBadge(ctx, canvas, text) {
        const x = canvas.width / 2;
        const y = 30;
        const fontSize = 42;

        // Configuration-Driven: Badge 색상
        const badgeColor = this.config?.badgeColor || '#FFD700';
        const shadowColor = this.config?.badgeShadowColor || 'rgba(0, 0, 0, 0.8)';
        const shadowBlur = this.config?.badgeShadowBlur || 15;

        ctx.fillStyle = badgeColor;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
    }

    /**
     * 통계 정보 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {Object} stats - { damage, turns, style }
     * @param {number} y
     */
    renderStats(ctx, canvas, stats, y) {
        const fontSize = this.config?.overlay?.fontSize?.info || 18;
        const color = this.config?.overlay?.textColor || '#ffffff';

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = [
            `Damage: ${stats.damage || 0}`,
            `Turns: ${stats.turns || 0}`,
            `Style: ${stats.style || 'Unknown'}`
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, y + i * 28);
        });
    }

    /**
     * Footer 텍스트 렌더링
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {string} type - 공유 타입 ('hand', 'victory', 'defeat', 'deck')
     */
    renderFooter(ctx, canvas, type) {
        const fontSize = this.config?.overlay?.fontSize?.info || 18;
        const color = this.config?.overlay?.textColor || '#ffffff';

        // 다국어 Footer 텍스트 가져오기
        const currentLang = window.i18n?.currentLanguage || localStorage.getItem('selectedLanguage') || 'ko';
        const footerTexts = this.config?.footerTexts?.[type];
        const text = footerTexts?.[currentLang] || footerTexts?.['ko'] || 'binboxgames.com';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height - 20);
    }

    /**
     * Canvas를 Blob으로 변환
     * @param {HTMLCanvasElement} canvas
     * @returns {Promise<Blob>}
     */
    canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            const format = this.config?.format || 'png';
            const quality = this.config?.quality || 0.85;
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

            try {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to convert canvas to blob'));
                        }
                    },
                    mimeType,
                    quality
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 이미지를 파일로 다운로드
     * @param {Blob} blob
     * @param {string} filename
     */
    downloadImage(blob, filename = 'card-battle-share.png') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 전역 등록
if (typeof window !== 'undefined') {
    window.ShareImageGenerator = ShareImageGenerator;
}
