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
        this.drawBackground(gameState);

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
    drawBackground(gameState) {
        // 턴에 따른 배경색 결정
        let backgroundConfig = GameConfig.turnBackgrounds.player; // 기본값: 플레이어 턴

        // 전투 중일 때만 턴별 배경색 적용
        if (gameState && gameState.phase === 'battle' && gameState.battleSystem && gameState.battleSystem.currentTurn) {
            backgroundConfig = GameConfig.turnBackgrounds[gameState.battleSystem.currentTurn];
        }

        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        backgroundConfig.gradientStops.forEach(stop => {
            gradient.addColorStop(stop.position, stop.color);
        });

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
            let turnText;
            if (info.currentTurn === 'player') {
                // 플레이어 턴의 경우 플레이어 이름을 포함한 템플릿 사용
                const playerTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.player_turn_template') || '{name}의 턴';
                const playerName = info.player ? info.player.name : (I18nHelper.getText('auto_battle_card_game.ui.default_player_name') || '플레이어');
                turnText = playerTurnTemplate.replace('{name}', playerName);
            } else {
                // 적 턴의 경우 적 이름을 포함한 템플릿 사용
                const enemyTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.enemy_turn_template') || '{name}의 턴';
                const enemyName = info.enemy ? info.enemy.name : '적';
                turnText = enemyTurnTemplate.replace('{name}', enemyName);
            }
            this.drawBattlePhase(turnText, centerX, centerY);
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
}

// 전역 객체로 등록
window.Renderer = Renderer;