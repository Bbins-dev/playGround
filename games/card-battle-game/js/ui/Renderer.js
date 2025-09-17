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
    }

    // 초기화
    initialize() {
        this.setupCanvas();
        console.log('🎨 렌더러 초기화 완료');
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

        // 카드 배경
        this.drawCardBackground(card, x, y, size, isNextActive);

        // 카드 속성 표시
        this.drawCardElement(card, x, y, size);

        // 카드 이름
        this.drawCardName(card, x, y, size);

        // 카드 스탯
        this.drawCardStats(card, x, y, size);

        // 카드 테두리
        this.drawCardBorder(card, x, y, size, isNextActive);

        // 플레이어 카드인 경우 상세 정보
        if (isPlayer && this.options.showCardDetails) {
            this.drawCardDetails(card, x, y, size);
        }
    }

    // 카드 배경 그리기
    drawCardBackground(card, x, y, size, isActive = false) {
        const elementConfig = GameConfig.elements[card.element];

        // 배경 색상
        let bgColor = elementConfig ? elementConfig.color : '#666';
        if (isActive) {
            bgColor = this.lightenColor(bgColor, 0.3);
        }

        // 카드 배경
        this.ctx.fillStyle = bgColor;
        this.roundRect(x, y, size.width, size.height, 8);
        this.ctx.fill();

        // 그라데이션 오버레이
        const gradient = this.ctx.createLinearGradient(x, y, x, y + size.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

        this.ctx.fillStyle = gradient;
        this.roundRect(x, y, size.width, size.height, 8);
        this.ctx.fill();
    }

    // 카드 속성 이모지 표시
    drawCardElement(card, x, y, size) {
        const elementConfig = GameConfig.elements[card.element];
        if (!elementConfig) return;

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(
            elementConfig.emoji,
            x + size.width / 2,
            y + 25
        );
    }

    // 카드 이름 표시
    drawCardName(card, x, y, size) {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';

        // 텍스트가 길면 줄임
        let name = card.name;
        if (name.length > 8) {
            name = name.substring(0, 7) + '...';
        }

        this.ctx.fillText(name, x + size.width / 2, y + 50);
    }

    // 카드 스탯 표시
    drawCardStats(card, x, y, size) {
        const statY = y + size.height - 25;

        // 공격력
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⚔${card.power}`, x + 5, statY);

        // 명중률
        this.ctx.fillStyle = '#4caf50';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`🎯${card.accuracy}%`, x + size.width - 5, statY);
    }

    // 카드 테두리
    drawCardBorder(card, x, y, size, isActive = false) {
        this.ctx.strokeStyle = isActive ? '#ffd700' : '#fff';
        this.ctx.lineWidth = isActive ? 3 : 1;
        this.roundRect(x, y, size.width, size.height, 8);
        this.ctx.stroke();
    }

    // 카드 상세 정보 (플레이어만)
    drawCardDetails(card, x, y, size) {
        // 카드 타입 표시
        const typeConfig = GameConfig.cardTypes[card.type];
        if (typeConfig) {
            this.ctx.font = '8px Arial';
            this.ctx.fillStyle = '#ccc';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                typeConfig.name,
                x + size.width / 2,
                y + 70
            );
        }
    }

    // 전투 상태 표시
    renderBattleStatus(battleSystem) {
        const info = battleSystem.getBattleInfo();

        // 중앙 영역에 턴 정보 표시
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        if (info.phase === 'cardActivation') {
            this.drawBattlePhase('카드 발동 중...', centerX, centerY);
        } else if (info.phase === 'turnTransition') {
            const playerName = info.currentTurn === 'player' ? '나의 턴' : '적의 턴';
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
        // 제목
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('카드 배틀', this.width / 2, this.height / 2 - 50);

        // 시작 버튼 (임시)
        this.ctx.font = '18px Arial';
        this.ctx.fillText('게임 시작', this.width / 2, this.height / 2 + 20);
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

    // 색상 밝게 하기
    lightenColor(color, factor) {
        // 간단한 색상 조정 (실제로는 더 정교한 알고리즘 필요)
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));

        return `rgb(${newR}, ${newG}, ${newB})`;
    }

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