// Canvas 렌더링 시스템 - 게임 보드 및 카드 시각화

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 렌더링 영역 정의
        this.areas = {
            // 적 손패 영역 (상단)
            enemyHand: {
                x: 50,
                y: 50,
                width: this.width - 100,
                height: 120,
                maxCards: 20
            },
            // 플레이어 손패 영역 (하단)
            playerHand: {
                x: 50,
                y: this.height - 170,
                width: this.width - 100,
                height: 120,
                maxCards: 10
            },
            // 중앙 전투 영역
            battlefield: {
                x: 50,
                y: 200,
                width: this.width - 100,
                height: this.height - 400
            }
        };

        // 카드 크기 설정
        this.cardSizes = {
            hand: { width: 80, height: 110 },
            active: { width: 120, height: 165 }
        };

        // 애니메이션 상태
        this.animations = new Map();

        // 렌더링 옵션
        this.options = {
            cardSpacing: 10,
            showCardDetails: true,
            highlightNextCard: true
        };

        // 통일된 카드 렌더러
        this.cardRenderer = new CardRenderer();
    }

    // 초기화
    initialize() {
        this.setupCanvas();
    }

    // 캔버스 설정
    setupCanvas() {
        // 고해상도 디스플레이 지원
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        // 캔버스 스타일
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        // 텍스트 렌더링 최적화
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
    }

    // 메인 렌더링
    render(gameState) {
        this.clearCanvas();
        this.drawBackground();

        if (gameState.phase === 'battle') {
            this.renderBattleMode(gameState);
        } else if (gameState.phase === 'menu') {
            this.renderMenuMode(gameState);
        } else if (gameState.phase === 'cardSelection') {
            this.renderCardSelection(gameState);
        } else if (gameState.phase === 'gameOver') {
            // gameOver일 때는 배경만 그리고 모달 렌더링은 UIManager에서 처리
            return;
        }

        this.processAnimations();
    }

    // 배경 그리기
    drawBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 영역 구분선
        this.drawAreaBorders();
    }

    // 영역 경계선 그리기
    drawAreaBorders() {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // 적 영역
        this.ctx.strokeRect(
            this.areas.enemyHand.x,
            this.areas.enemyHand.y,
            this.areas.enemyHand.width,
            this.areas.enemyHand.height
        );

        // 플레이어 영역
        this.ctx.strokeRect(
            this.areas.playerHand.x,
            this.areas.playerHand.y,
            this.areas.playerHand.width,
            this.areas.playerHand.height
        );

        this.ctx.setLineDash([]);
    }

    // 전투 모드 렌더링
    renderBattleMode(gameState) {
        const { player, enemy, battleSystem } = gameState;

        // 적 손패 렌더링
        this.renderHand(enemy, this.areas.enemyHand, false);

        // 플레이어 손패 렌더링
        this.renderHand(player, this.areas.playerHand, true);

        // 전투 상태 표시
        if (battleSystem) {
            this.renderBattleStatus(battleSystem);
        }
    }

    // 손패 렌더링
    renderHand(player, area, isPlayer = true) {
        if (!player.hand || player.hand.length === 0) return;

        const cardCount = player.hand.length;
        const maxCards = area.maxCards;
        const cardSize = this.cardSizes.hand;

        // 카드 간격 계산
        const totalCardWidth = cardCount * cardSize.width;
        const totalSpacing = (cardCount - 1) * this.options.cardSpacing;
        const totalWidth = totalCardWidth + totalSpacing;

        // 시작 위치 계산 (중앙 정렬)
        const startX = area.x + (area.width - totalWidth) / 2;
        const startY = area.y + (area.height - cardSize.height) / 2;

        // 각 카드 렌더링
        player.hand.forEach((card, index) => {
            const cardX = startX + index * (cardSize.width + this.options.cardSpacing);
            const cardY = startY;

            // 다음 발동 카드 하이라이트
            const isNextActive = this.options.highlightNextCard &&
                                index === 0 &&
                                this.isCardActivatable(card, player);

            this.renderCard(card, cardX, cardY, cardSize, {
                isPlayer,
                isNextActive,
                index
            });
        });
    }

    // 개별 카드 렌더링
    renderCard(card, x, y, size, options = {}) {
        const { isPlayer = true, isNextActive = false, index = 0 } = options;

        // 통일된 카드 렌더러 사용
        this.cardRenderer.renderCard(this.ctx, card, x, y, size.width, size.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive,
            opacity: 1
        });
    }

    // 개별 카드 그리기 메서드들은 CardRenderer로 통합되어 제거됨

    // 전투 상태 표시
    renderBattleStatus(battleSystem) {
        const info = battleSystem.getBattleInfo();

        // 중앙 영역에 턴 정보 표시
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        if (info.phase === 'cardActivation') {
            const text = I18nHelper.getText('auto_battle_card_game.ui.card_activating') || '카드 발동 중...';
            this.drawBattlePhase(text, centerX, centerY);
        } else if (info.phase === 'turnTransition') {
            const playerTurnText = I18nHelper.getText('auto_battle_card_game.ui.player_turn') || '나의 턴';
            const enemyTurnText = I18nHelper.getText('auto_battle_card_game.ui.enemy_turn') || '적의 턴';
            const playerName = info.currentTurn === 'player' ? playerTurnText : enemyTurnText;
            this.drawBattlePhase(playerName, centerX, centerY);
        }
    }

    // 전투 단계 표시
    drawBattlePhase(text, x, y) {
        // 배경
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = this.ctx.measureText(text).width;
        this.roundRect(x - textWidth/2 - 20, y - 15, textWidth + 40, 30, 15);
        this.ctx.fill();

        // 텍스트
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }

    // 카드 선택 화면 렌더링
    renderCardSelection(gameState) {
        const { availableCards = [], selectedCards = [] } = gameState;

        // 제목
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('카드를 선택하세요', this.width / 2, 50);

        // 카드 그리드
        this.renderCardGrid(availableCards, selectedCards);
    }

    // 카드 그리드 렌더링
    renderCardGrid(cards, selectedCards = []) {
        const cols = 5;
        const cardSize = this.cardSizes.active;
        const spacing = 20;
        const startX = (this.width - (cols * cardSize.width + (cols - 1) * spacing)) / 2;
        const startY = 100;

        cards.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardSize.width + spacing);
            const y = startY + row * (cardSize.height + spacing);

            const isSelected = selectedCards.includes(card.id);

            this.renderCard(card, x, y, cardSize, {
                isPlayer: true,
                isNextActive: isSelected
            });
        });
    }

    // 메뉴 모드 렌더링
    renderMenuMode(gameState) {
        // MainMenu 인스턴스가 있으면 렌더링 호출
        if (gameState.currentScreen && typeof gameState.currentScreen.render === 'function') {
            gameState.currentScreen.render(this.ctx, this.canvas);
        }
    }

    // 애니메이션 추가
    addAnimation(id, animation) {
        this.animations.set(id, {
            ...animation,
            startTime: Date.now()
        });
    }

    // 애니메이션 처리
    processAnimations() {
        const currentTime = Date.now();

        this.animations.forEach((anim, id) => {
            const elapsed = currentTime - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);

            if (anim.type === 'cardMove') {
                this.animateCardMove(anim, progress);
            } else if (anim.type === 'cardHighlight') {
                this.animateCardHighlight(anim, progress);
            }

            if (progress >= 1) {
                this.animations.delete(id);
                if (anim.onComplete) {
                    anim.onComplete();
                }
            }
        });
    }

    // 카드 이동 애니메이션
    animateCardMove(anim, progress) {
        const { from, to, card } = anim;
        const easeProgress = this.easeInOutQuad(progress);

        const x = from.x + (to.x - from.x) * easeProgress;
        const y = from.y + (to.y - from.y) * easeProgress;

        this.renderCard(card, x, y, this.cardSizes.hand, {
            isPlayer: true,
            isNextActive: true
        });
    }

    // 카드 하이라이트 애니메이션
    animateCardHighlight(anim, progress) {
        // 펄스 효과
        const intensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        // 구현은 개별 카드 렌더링에서 처리
    }

    // 캔버스 클리어
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // 유틸리티 함수들

    // 둥근 사각형 그리기
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    // 색상 처리는 CardRenderer로 통합됨

    // 이징 함수
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // 카드 발동 가능 여부 확인
    isCardActivatable(card, player) {
        // 플레이어의 발동 가능한 카드 중 첫 번째인지 확인
        const activatableCards = player.getActivatableCards();
        return activatableCards.length > 0 && activatableCards[0] === card;
    }

    // 마우스/터치 좌표를 카드 인덱스로 변환
    getCardIndexFromPosition(x, y, area, cardCount) {
        if (x < area.x || x > area.x + area.width ||
            y < area.y || y > area.y + area.height) {
            return -1;
        }

        const cardSize = this.cardSizes.hand;
        const totalCardWidth = cardCount * cardSize.width;
        const totalSpacing = (cardCount - 1) * this.options.cardSpacing;
        const totalWidth = totalCardWidth + totalSpacing;
        const startX = area.x + (area.width - totalWidth) / 2;

        const relativeX = x - startX;
        const cardIndex = Math.floor(relativeX / (cardSize.width + this.options.cardSpacing));

        return cardIndex >= 0 && cardIndex < cardCount ? cardIndex : -1;
    }

    // 화면 크기 조정
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        // 영역 재계산
        this.areas.enemyHand.width = width - 100;
        this.areas.playerHand.y = height - 170;
        this.areas.playerHand.width = width - 100;
        this.areas.battlefield.width = width - 100;
        this.areas.battlefield.height = height - 400;

        this.setupCanvas();
    }

    // 디버그 정보 표시
    drawDebugInfo(gameState) {
        if (!gameState.debug) return;

        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#0f0';
        this.ctx.textAlign = 'left';

        let y = 20;
        const debugInfo = [
            `Phase: ${gameState.phase}`,
            `Animations: ${this.animations.size}`,
            `Player Cards: ${gameState.player?.hand?.length || 0}`,
            `Enemy Cards: ${gameState.enemy?.hand?.length || 0}`
        ];

        debugInfo.forEach(info => {
            this.ctx.fillText(info, 10, y);
            y += 15;
        });
    }

    // 글래스모피즘 모달 렌더링 (승리/패배 팝업)
    renderModal(modalConfig, options = {}) {
        const {
            type,      // 'victory' 또는 'defeat'
            alpha = 1.0,
            stage = 1,
            animationTime = 0,  // 애니메이션 시간 (ms)
            gameStats = null,   // 게임 통계 (패배 시)
            finalHand = null,   // 최종 손패 (패배 시)
            buttonHovered = false  // 버튼 호버 상태
        } = options;

        if (!modalConfig || !type) {
            return;
        }

        const config = modalConfig.modal;
        const typeConfig = modalConfig[type];

        // 비율 기반 모달 크기 계산
        let modalWidth, modalHeight, borderRadius;

        if (type === 'defeat' && typeConfig.layout) {
            modalWidth = GameConfig.canvas.width * typeConfig.layout.modal.widthRatio;
            modalHeight = GameConfig.canvas.height * typeConfig.layout.modal.heightRatio;
            borderRadius = typeConfig.layout.modal.borderRadius;
        } else {
            modalWidth = config.size.width;
            modalHeight = config.size.height;
            borderRadius = config.size.borderRadius;
        }

        // 모달 중앙 위치 계산
        const modalX = (GameConfig.canvas.width - modalWidth) / 2;
        const modalY = (GameConfig.canvas.height - modalHeight) / 2;

        // 배경 오버레이 (글래스모피즘 블러 효과)
        this.drawGlassmorphismOverlay(alpha, config.background.overlay);

        // 글래스모피즘 모달 배경
        this.drawGlassmorphismModal(
            modalX, modalY,
            modalWidth, modalHeight,
            borderRadius,
            typeConfig, alpha
        );

        // 파티클 효과 (승리 시)
        if (type === 'victory' && typeConfig.particles.enabled) {
            this.drawParticles(modalX, modalY, config.size.width, config.size.height, typeConfig.particles, animationTime);
        }

        // 애니메이션 아이콘 렌더링
        this.drawAnimatedIcon(
            modalX + modalWidth / 2,
            modalY + typeConfig.icon.y,
            typeConfig.icon,
            animationTime,
            alpha
        );

        // 글로우 효과가 있는 제목 렌더링
        const titleKey = `auto_battle_card_game.ui.battle_result.${type}_title`;
        const titleText = window.getI18nText ? window.getI18nText(titleKey) :
                         (type === 'victory' ? 'Victory!' : 'Defeat');

        this.drawTextWithGlow(
            titleText,
            modalX + modalWidth / 2,
            modalY + typeConfig.title.y,
            typeConfig.title,
            typeConfig.colors.title,
            typeConfig.colors.glow,
            alpha
        );

        // 메시지 렌더링
        if (type === 'victory') {
            const messageKey = 'auto_battle_card_game.ui.battle_result.victory_message';
            const messageText = window.getI18nText ?
                               window.getI18nText(messageKey).replace('{stage}', stage) :
                               `Stage ${stage} Clear!`;

            this.drawTextWithGlow(
                messageText,
                modalX + modalWidth / 2,
                modalY + typeConfig.message.y,
                typeConfig.message,
                typeConfig.colors.message,
                null, // 메시지는 글로우 없이
                alpha
            );
        } else {
            // 패배 메시지와 부제목
            const messageKey = 'auto_battle_card_game.ui.battle_result.defeat_message';
            const subtitleKey = 'auto_battle_card_game.ui.battle_result.defeat_subtitle';

            const messageText = window.getI18nText ? window.getI18nText(messageKey) : 'Unfortunately defeated';
            const subtitleText = window.getI18nText ? window.getI18nText(subtitleKey) : 'Try again!';

            this.drawTextWithGlow(
                messageText,
                modalX + modalWidth / 2,
                modalY + typeConfig.message.y,
                typeConfig.message,
                typeConfig.colors.message,
                null,
                alpha
            );

            // 부제목은 별도 설정으로 렌더링
            this.drawTextWithGlow(
                subtitleText,
                modalX + modalWidth / 2,
                modalY + typeConfig.subtitle.y,
                typeConfig.subtitle,
                typeConfig.colors.message,
                null,
                alpha
            );

            // 패배 화면 추가 요소들 (통계, 손패, 버튼)
            if (alpha >= 0.8) { // 모달이 충분히 나타났을 때만 표시
                // 최종 손패 렌더링
                if (finalHand && finalHand.length > 0) {
                    this.renderFinalHand(finalHand, typeConfig);
                }

                // 게임 통계 렌더링
                if (gameStats) {
                    this.renderGameStats(gameStats, typeConfig);
                }

                // 두 개의 버튼 렌더링 (재시작, 메인메뉴)
                this.renderDefeatButtons(typeConfig, options.buttonHoveredType);
            }
        }
    }

    // 글래스모피즘 오버레이 배경
    drawGlassmorphismOverlay(alpha, overlayColor) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.8;
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(0, 0, GameConfig.canvas.width, GameConfig.canvas.height);
        this.ctx.restore();
    }

    // 글래스모피즘 모달 배경
    drawGlassmorphismModal(x, y, width, height, borderRadius, typeConfig, alpha) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // 그라디언트 배경 (글래스모피즘)
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, typeConfig.colors.gradient.start);
        gradient.addColorStop(1, typeConfig.colors.gradient.end);

        // 메인 배경
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, width, height, borderRadius);
        this.ctx.fill();

        // 글래스 효과 오버레이
        this.ctx.fillStyle = typeConfig.colors.background;
        this.drawRoundedRect(x, y, width, height, borderRadius);
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = typeConfig.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 내부 하이라이트 (글래스 효과)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        this.drawRoundedRect(x + 1, y + 1, width - 2, height - 2, borderRadius - 1);
        this.ctx.stroke();

        this.ctx.restore();
    }

    // 파티클 효과
    drawParticles(modalX, modalY, modalWidth, modalHeight, particleConfig, animationTime) {
        if (!particleConfig.enabled) return;

        this.ctx.save();

        const time = animationTime * 0.001; // 초 단위로 변환
        const particleCount = particleConfig.count;

        for (let i = 0; i < particleCount; i++) {
            // 각 파티클의 고유한 시드
            const seed = i / particleCount;
            const phase = seed * Math.PI * 2;

            // 파티클 위치 계산 (원형 분산)
            const radius = 100 + Math.sin(time * 2 + phase) * 50;
            const angle = time * 0.5 + phase;
            const x = modalX + modalWidth / 2 + Math.cos(angle) * radius;
            const y = modalY + modalHeight / 2 + Math.sin(angle) * radius * 0.6;

            // 파티클 크기와 색상
            const size = particleConfig.size.min +
                        Math.sin(time * 3 + phase) * (particleConfig.size.max - particleConfig.size.min);
            const colorIndex = Math.floor(seed * particleConfig.colors.length);
            const color = particleConfig.colors[colorIndex];

            // 파티클 투명도 (페이드 효과)
            const lifetime = (time + phase) % (particleConfig.lifetime * 0.001);
            const fadeTime = particleConfig.lifetime * 0.001 * 0.3;
            let particleAlpha = 1;

            if (lifetime < fadeTime) {
                particleAlpha = lifetime / fadeTime;
            } else if (lifetime > particleConfig.lifetime * 0.001 - fadeTime) {
                particleAlpha = (particleConfig.lifetime * 0.001 - lifetime) / fadeTime;
            }

            // 파티클 렌더링
            this.ctx.globalAlpha = particleAlpha * 0.8;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // 글로우 효과
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = size * 2;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.restore();
    }

    // 애니메이션 아이콘
    drawAnimatedIcon(x, y, iconConfig, animationTime, alpha) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        const time = animationTime * 0.001;

        // 애니메이션 적용
        if (iconConfig.animation) {
            this.ctx.translate(x, y);

            if (iconConfig.animation.type === 'rotate') {
                const rotation = (time * 2 * Math.PI) / (iconConfig.animation.duration * 0.001);
                this.ctx.rotate(rotation);
            } else if (iconConfig.animation.type === 'shake') {
                const shakeX = Math.sin(time * 10) * iconConfig.animation.intensity;
                const shakeY = Math.cos(time * 10) * iconConfig.animation.intensity;
                this.ctx.translate(shakeX, shakeY);
            }

            this.ctx.translate(-x, -y);
        }

        // 아이콘 렌더링
        this.ctx.font = `${iconConfig.fontSize}px Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 글로우 효과
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText(iconConfig.emoji, x, y);
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    // 글로우 효과가 있는 텍스트
    drawTextWithGlow(text, x, y, textConfig, textColor, glowConfig, alpha) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // 폰트 설정
        const fontWeight = textConfig.fontWeight || 'bold';
        const fontSize = textConfig.fontSize;
        this.ctx.font = `${fontWeight} ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = textColor;

        // 글로우 효과 (제목만)
        if (glowConfig) {
            this.ctx.shadowColor = glowConfig.color;
            this.ctx.shadowBlur = glowConfig.blur;
            for (let i = 0; i < glowConfig.spread; i++) {
                this.ctx.fillText(text, x, y);
            }
        }

        // 텍스트 쉐도우 (설정에 있는 경우)
        if (textConfig.textShadow) {
            this.ctx.shadowColor = textConfig.textShadow.color;
            this.ctx.shadowBlur = textConfig.textShadow.blur;
        }

        // 메인 텍스트
        this.ctx.fillText(text, x, y);

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    // 둥근 사각형 그리기 유틸리티
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    // 미니 카드 렌더링 (패배 화면용)
    renderMiniCard(card, x, y, scale = 0.35) {
        if (!card) return;

        const width = 80 * scale;
        const height = 110 * scale;
        const fontSize = 10 * scale;
        const smallFontSize = 8 * scale;

        // 카드 배경
        this.ctx.save();

        // 카드 테두리와 배경
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.strokeStyle = ColorUtils.getElementColor(card.element);
        this.ctx.lineWidth = 1;
        this.roundRect(x, y, width, height, 4);
        this.ctx.fill();
        this.ctx.stroke();

        // 속성 아이콘 (작은 크기)
        this.ctx.font = `${fontSize * 1.2}px Arial`;
        this.ctx.fillStyle = ColorUtils.getElementColor(card.element);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.getElementIcon(card.element),
            x + width / 2,
            y + fontSize * 1.8
        );

        // 카드 이름 (작은 폰트)
        this.ctx.font = `${smallFontSize}px Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';

        const name = card.name || card.id;
        const maxWidth = width - 4;
        const truncatedName = this.truncateText(name, maxWidth, smallFontSize);

        this.ctx.fillText(
            truncatedName,
            x + width / 2,
            y + height - smallFontSize
        );

        this.ctx.restore();
    }

    // 텍스트 자르기 유틸리티
    truncateText(text, maxWidth, fontSize) {
        this.ctx.font = `${fontSize}px Arial`;
        if (this.ctx.measureText(text).width <= maxWidth) {
            return text;
        }

        for (let i = text.length - 1; i > 0; i--) {
            const truncated = text.substring(0, i) + '...';
            if (this.ctx.measureText(truncated).width <= maxWidth) {
                return truncated;
            }
        }
        return '...';
    }

    // 최종 손패 렌더링 (패배 화면용)
    renderFinalHand(cards, config) {
        if (!cards || cards.length === 0) return;

        const layout = config.layout.handDisplay;
        const modal = config.layout.modal;

        // 비율 기반 계산
        const modalWidth = GameConfig.canvas.width * modal.widthRatio;
        const modalHeight = GameConfig.canvas.height * modal.heightRatio;
        const modalX = (GameConfig.canvas.width - modalWidth) / 2;
        const modalY = (GameConfig.canvas.height - modalHeight) / 2;

        const spacing = modalWidth * layout.spacingRatio;
        const y = modalY + (modalHeight * layout.startYRatio);
        const startX = modalX + (modalWidth / 2) - ((cards.length * spacing) / 2);

        // 제목
        this.ctx.save();
        this.ctx.font = `${modalHeight * 0.025}px Arial`;
        this.ctx.fillStyle = config.colors.stats;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.final_hand'),
            GameConfig.canvas.width / 2,
            y - modalHeight * 0.03
        );

        // 카드들 렌더링
        cards.forEach((card, index) => {
            const x = startX + (index * spacing);
            this.renderMiniCard(card, x, y, layout.cardScale);
        });

        this.ctx.restore();
    }

    // 미니 카드 렌더링 (패배 화면 최종 손패용)
    renderMiniCard(card, x, y, scale = 0.35) {
        if (!card) return;

        this.ctx.save();

        // 카드 크기 계산
        const cardWidth = GameConfig.cardSizes.battle.width * scale;
        const cardHeight = GameConfig.cardSizes.battle.height * scale;

        // 카드 배경
        const element = GameConfig.elements[card.element];
        const gradient = this.ctx.createLinearGradient(x, y, x, y + cardHeight);
        gradient.addColorStop(0, element.color);
        gradient.addColorStop(1, ColorUtils.darkenColor(element.color, 0.3));

        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = element.color;
        this.ctx.lineWidth = 1;
        this.roundRect(x, y, cardWidth, cardHeight, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // 카드 이름 (축약)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.round(12 * scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        const shortName = card.name.length > 6 ? card.name.substring(0, 5) + '...' : card.name;
        this.ctx.fillText(shortName, x + cardWidth/2, y + 3);

        // 속성 아이콘
        this.ctx.font = `${Math.round(16 * scale)}px Arial`;
        this.ctx.fillText(element.icon, x + cardWidth/2, y + cardHeight/2 - 8);

        // 공격력 표시 (오른쪽 하단)
        if (card.attack !== undefined) {
            this.ctx.font = `bold ${Math.round(10 * scale)}px Arial`;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(card.attack, x + cardWidth - 3, y + cardHeight - 2);
        }

        this.ctx.restore();
    }

    // 게임 통계 렌더링 (패배 화면용)
    renderGameStats(gameStats, config) {
        if (!gameStats) return;

        const layout = config.layout.stats;
        const modal = config.layout.modal;

        // 비율 기반 계산
        const modalWidth = GameConfig.canvas.width * modal.widthRatio;
        const modalHeight = GameConfig.canvas.height * modal.heightRatio;
        const modalX = (GameConfig.canvas.width - modalWidth) / 2;
        const modalY = (GameConfig.canvas.height - modalHeight) / 2;

        let currentY = modalY + (modalHeight * layout.startYRatio);

        this.ctx.save();
        this.ctx.textAlign = 'left';

        // 비율 기반 좌표 계산
        const leftColumnX = modalX + (modalWidth * layout.leftColumnRatio);
        const rightColumnX = modalX + (modalWidth * layout.rightColumnRatio);

        // 기본 통계 (왼쪽 열)
        this.renderStatsColumn([
            {
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.stage_reached'),
                value: `${gameStats.finalStage}`,
                isValue: true
            },
            {
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.turns_survived'),
                value: `${gameStats.totalTurns}`,
                isValue: true
            },
            {
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.total_damage_dealt'),
                value: `${gameStats.totalDamageDealt}`,
                isValue: true
            },
            {
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.total_defense_built'),
                value: `${gameStats.totalDefenseBuilt}`,
                isValue: true
            }
        ], leftColumnX, currentY, config);

        // 유머 통계 (오른쪽 열)
        const humorStats = this.generateHumorStats(gameStats);
        this.renderStatsColumn(humorStats, rightColumnX, currentY, config, true);

        this.ctx.restore();
    }

    // 통계 열 렌더링
    renderStatsColumn(stats, x, startY, config, isHumor = false) {
        const layout = config.layout.stats;
        const modal = config.layout.modal;
        const modalHeight = GameConfig.canvas.height * modal.heightRatio;

        const fontSize = modalHeight * (isHumor ? layout.humorFontSizeRatio : layout.fontSizeRatio);
        const spacing = modalHeight * layout.spacingRatio;

        stats.forEach((stat, index) => {
            const y = startY + (index * spacing);

            this.ctx.font = `${Math.round(fontSize)}px Arial`;

            // 라벨
            this.ctx.fillStyle = isHumor ? config.colors.humor : config.colors.stats;
            this.ctx.fillText(stat.label, x, y);

            // 값 (있는 경우)
            if (stat.value !== undefined) {
                const modal = config.layout.modal;
                const modalWidth = GameConfig.canvas.width * modal.widthRatio;
                this.ctx.fillStyle = stat.isValue ? config.colors.statValue : config.colors.stats;
                this.ctx.fillText(stat.value, x + modalWidth * 0.25, y);
            }
        });
    }

    // 유머 통계 생성
    generateHumorStats(gameStats) {
        const stats = [];

        // 플레이 스타일
        const playStyle = this.getPlayStyleText(gameStats);
        stats.push({
            label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.play_style'),
            value: playStyle
        });

        // 사망 원인
        const deathCause = this.getDeathCauseText(gameStats.deathCause);
        stats.push({
            label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.death_cause'),
            value: deathCause
        });

        // MVP 카드
        const mvp = this.getMVPText(gameStats);
        if (mvp) {
            stats.push({
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.mvp_card'),
                value: mvp
            });
        }

        // 가장 게으른 카드
        if (gameStats.laziestCard) {
            const usage = gameStats.cardUsageStats.get(gameStats.laziestCard) || 0;
            stats.push({
                label: I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.lazy_card'),
                value: `${gameStats.laziestCard} (${usage}번)`
            });
        }

        // 가장 많이 사용한 속성
        if (gameStats.mostUsedElement) {
            const elementNames = {
                fire: '불', water: '물', electric: '전기',
                poison: '독', normal: '노멀'
            };
            const elementName = elementNames[gameStats.mostUsedElement] || gameStats.mostUsedElement;
            stats.push({
                label: '선호 속성',
                value: `${elementName} 속성`
            });
        }

        // 미스 횟수가 많을 때
        if (gameStats.missCount > 3) {
            stats.push({
                label: '운이 없었다면...',
                value: `${gameStats.missCount}번 빗나감`
            });
        }

        return stats;
    }

    // 플레이 스타일 텍스트
    getPlayStyleText(gameStats) {
        // 플레이 스타일은 이미 GameManager에서 계산됨
        const playStyle = gameStats.playStyle;

        switch (playStyle) {
            case 'defensive': return '🛡️ 신중한 수비수';
            case 'aggressive': return '⚔️ 무모한 돌격대장';
            case 'unlucky': return '😅 운이 없는 전사';
            case 'balanced':
            default: return '⚖️ 균형잡힌 전략가';
        }
    }

    // 사망 원인 텍스트
    getDeathCauseText(cause) {
        switch(cause) {
            case 'burn': return '🔥 뜨거운 최후';
            case 'poison': return '🤢 서서히 스며든 패배';
            case 'normal_attack': return '😅 화려하지 못한 최후';
            default: return '❓ 미스터리한 최후';
        }
    }

    // MVP 카드 텍스트
    getMVPText(gameStats) {
        // MVP 카드는 이미 GameManager에서 계산됨
        const mvpCard = gameStats.mvpCard;

        if (mvpCard && gameStats.cardUsageStats) {
            const usage = gameStats.cardUsageStats.get(mvpCard) || 0;
            return `${mvpCard} (${usage}번)`;
        }

        return null;
    }

    // 확인 버튼 렌더링
    renderConfirmButton(config, isHovered = false) {
        const button = config.layout.confirmButton;
        const colors = config.colors.button;

        const x = (GameConfig.canvas.width - button.width) / 2;
        const y = button.y;

        this.ctx.save();

        // 버튼 배경 (글래스모피즘)
        this.ctx.fillStyle = isHovered ? colors.hover : colors.background;
        this.ctx.strokeStyle = colors.border;
        this.ctx.lineWidth = 1;
        this.roundRect(x, y, button.width, button.height, button.borderRadius);
        this.ctx.fill();
        this.ctx.stroke();

        // 버튼 텍스트
        this.ctx.font = `${button.fontSize}px Arial`;
        this.ctx.fillStyle = colors.text;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            I18nHelper.getText('auto_battle_card_game.ui.defeat_stats.confirm_button'),
            x + button.width / 2,
            y + button.height / 2
        );

        this.ctx.restore();

        // 버튼 영역 반환 (클릭 감지용)
        return {
            x: x,
            y: y,
            width: button.width,
            height: button.height
        };
    }

    // 패배 화면 두 개 버튼 렌더링 (재시작, 메인메뉴)
    renderDefeatButtons(config, hoveredType = null) {
        const buttons = config.layout.buttons;
        const modal = config.layout.modal;

        // 비율 기반 계산
        const modalWidth = GameConfig.canvas.width * modal.widthRatio;
        const modalHeight = GameConfig.canvas.height * modal.heightRatio;
        const modalX = (GameConfig.canvas.width - modalWidth) / 2;
        const modalY = (GameConfig.canvas.height - modalHeight) / 2;

        const buttonWidth = modalWidth * buttons.widthRatio;
        const buttonHeight = modalHeight * buttons.heightRatio;
        const buttonY = modalY + (modalHeight * buttons.yRatio);
        const fontSize = Math.round(modalHeight * buttons.fontSizeRatio);

        this.ctx.save();

        // 재시작 버튼
        const restartX = modalX + (modalWidth * buttons.restart.xRatio) - (buttonWidth / 2);
        const restartY = buttonY;
        const restartHovered = hoveredType === 'restart';

        this.ctx.fillStyle = restartHovered ? buttons.restart.hover : buttons.restart.background;
        this.ctx.strokeStyle = buttons.restart.border;
        this.ctx.lineWidth = 2;

        this.roundRect(restartX, restartY, buttonWidth, buttonHeight, buttons.borderRadius);
        this.ctx.fill();
        this.ctx.stroke();

        // 재시작 버튼 텍스트
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = config.colors.button.text;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            window.getI18nText ? window.getI18nText('auto_battle_card_game.ui.battle_result.restart_button') : '재시작',
            restartX + buttonWidth / 2,
            restartY + buttonHeight / 2
        );

        // 메인메뉴 버튼
        const mainMenuX = modalX + (modalWidth * buttons.mainMenu.xRatio) - (buttonWidth / 2);
        const mainMenuY = buttonY;
        const mainMenuHovered = hoveredType === 'mainMenu';

        this.ctx.fillStyle = mainMenuHovered ? buttons.mainMenu.hover : buttons.mainMenu.background;
        this.ctx.strokeStyle = buttons.mainMenu.border;

        this.roundRect(mainMenuX, mainMenuY, buttonWidth, buttonHeight, buttons.borderRadius);
        this.ctx.fill();
        this.ctx.stroke();

        // 메인메뉴 버튼 텍스트
        this.ctx.fillText(
            window.getI18nText ? window.getI18nText('auto_battle_card_game.ui.battle_result.main_menu_button') : '메인메뉴',
            mainMenuX + buttonWidth / 2,
            mainMenuY + buttonHeight / 2
        );

        this.ctx.restore();

        // 버튼 영역들 반환 (클릭 감지용)
        return {
            restart: {
                x: restartX,
                y: restartY,
                width: buttonWidth,
                height: buttonHeight
            },
            mainMenu: {
                x: mainMenuX,
                y: mainMenuY,
                width: buttonWidth,
                height: buttonHeight
            }
        };
    }
}

// 전역 객체로 등록
window.Renderer = Renderer;