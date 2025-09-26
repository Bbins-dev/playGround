// Canvas 렌더링 시스템 - 게임 보드 및 카드 시각화

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GameConfig.canvas.width;
        this.height = GameConfig.canvas.height;

        // 렌더링 영역 정의 (GameConfig UI 위치 기반)
        const handAreaHeight = GameConfig.cardSizes.hand.height * GameConfig.handLayout.rows +
                              GameConfig.cardSizes.hand.height * GameConfig.handLayout.rowSpacing;

        this.areas = {
            // 적 손패 영역 (GameConfig.ui.enemyHand 기반)
            enemyHand: {
                x: 50,
                y: GameConfig.ui.enemyHand.y - handAreaHeight / 2,  // 중앙 기준으로 계산
                width: this.width - 100,
                height: handAreaHeight,
                maxCards: GameConfig.handLayout.cardsPerRow * GameConfig.handLayout.rows
            },
            // 플레이어 손패 영역 (GameConfig.ui.playerHand 기반)
            playerHand: {
                x: 50,
                y: GameConfig.ui.playerHand.y - handAreaHeight / 2,  // 중앙 기준으로 계산
                width: this.width - 100,
                height: handAreaHeight,
                maxCards: GameConfig.handLayout.cardsPerRow * GameConfig.handLayout.rows
            },
            // 중앙 전투 영역
            battlefield: {
                x: 50,
                y: GameConfig.ui.enemyHand.y + handAreaHeight / 2 + 20,
                width: this.width - 100,
                height: GameConfig.ui.playerHand.y - GameConfig.ui.enemyHand.y - handAreaHeight - 40
            }
        };

        // 카드 크기 설정 (GameConfig 사용)
        this.cardSizes = GameConfig.cardSizes;

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

        // 잔상 효과를 위한 추적 변수 (인덱스 기반)
        this.lastActivatedCardIndex = -1;
        this.lastActivatedPlayer = null; // 'player' 또는 'enemy'
        this.lastActivatedTime = null;
    }

    // 초기화
    initialize() {
        this.setupCanvas();
    }

    // 캔버스 설정
    setupCanvas() {
        // 고해상도 디스플레이 지원 - GameConfig 기반
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = GameConfig.canvas.width * dpr;
        this.canvas.height = GameConfig.canvas.height * dpr;

        // 변환 상태 리셋 후 DPR 스케일 적용
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
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
        // 영역 위치 재계산 (GameConfig 변경사항 반영)
        this.updateAreas();

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
        if (gameState && gameState.phase === 'battle' && gameState.battleSystem) {
            // displayTurn이 있으면 우선 사용, 없으면 currentTurn 사용 (하위호환성)
            const turnForDisplay = gameState.battleSystem.displayTurn || gameState.battleSystem.currentTurn;
            if (turnForDisplay) {
                backgroundConfig = GameConfig.turnBackgrounds[turnForDisplay];
            }
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
        this.renderHand(enemy, this.areas.enemyHand, false, battleSystem);

        // 플레이어 손패 렌더링
        this.renderHand(player, this.areas.playerHand, true, battleSystem);

        // 전투 상태 표시
        if (battleSystem) {
            this.renderBattleStatus(battleSystem);
        }
    }

    // 손패 영역 배경 그리기
    drawHandAreaBackground(player, area) {
        const config = GameConfig.ui.handAreaBackground;
        if (!config.enabled) return;

        // 현재 방어 속성 가져오기
        const defenseElement = player.defenseElement || 'normal';
        const elementConfig = GameConfig.elements[defenseElement];
        if (!elementConfig) return;

        const baseColor = elementConfig.color;

        this.ctx.save();

        if (config.gradientEnabled) {
            // 그라데이션 배경
            const gradient = this.ctx.createLinearGradient(
                area.x, area.y,
                area.x, area.y + area.height
            );

            // 상단은 더 투명하게, 하단은 더 진하게
            gradient.addColorStop(0, this.hexToRgba(baseColor, config.gradientOpacity.start));
            gradient.addColorStop(1, this.hexToRgba(baseColor, config.gradientOpacity.end));

            this.ctx.fillStyle = gradient;
        } else {
            // 단색 배경
            this.ctx.fillStyle = this.hexToRgba(baseColor, config.opacity);
        }

        // 둥근 모서리 배경 그리기
        this.roundRect(area.x, area.y, area.width, area.height, config.borderRadius);
        this.ctx.fill();

        this.ctx.restore();
    }

    // Hex 색상을 RGBA로 변환하는 헬퍼 메소드
    hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(255, 255, 255, ${alpha})`;

        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 손패 렌더링 - 두 줄 레이아웃
    renderHand(player, area, isPlayer = true, battleSystem = null) {
        if (!player.hand || player.hand.length === 0) return;

        // 손패 영역 배경 그리기
        this.drawHandAreaBackground(player, area);

        const cardCount = player.hand.length;
        const cardSize = this.cardSizes.hand;
        const layout = GameConfig.handLayout;

        // 현재 활성 카드 추적 및 잔상 효과 (클래스 레벨에서 관리)
        this.updateCardActivationState(player, isPlayer, battleSystem);

        // 두 줄 레이아웃 계산
        const cardsPerRow = layout.cardsPerRow;
        let rowCount;
        if (isPlayer) {
            // 플레이어: 5장 이하는 1줄, 6장 이상은 2줄
            rowCount = cardCount <= 5 ? 1 : 2;
        } else {
            // 적: 기존 로직 유지
            rowCount = Math.min(layout.rows, Math.ceil(cardCount / cardsPerRow));
        }
        const rowSpacing = cardSize.height * layout.rowSpacing;

        // 전체 영역 크기
        const totalHeight = (cardSize.height * rowCount) + (rowSpacing * (rowCount - 1));
        const startY = area.y + (area.height - totalHeight) / 2;

        // 각 카드별 줄 배치 결정 및 렌더링
        player.hand.forEach((card, globalIndex) => {
            let targetRow, cardIndexInRow;

            if (isPlayer) {
                // 플레이어: 5장 이하는 row 0만 사용, 6장 이상은 새 카드가 윗줄로
                if (cardCount <= 5) {
                    targetRow = 0;
                    cardIndexInRow = globalIndex;
                } else {
                    const newCardsCount = cardCount - 5;
                    if (globalIndex < newCardsCount) {
                        targetRow = 0;
                        cardIndexInRow = globalIndex;
                    } else {
                        targetRow = 1;
                        cardIndexInRow = globalIndex - newCardsCount;
                    }
                }
            } else {
                // 적: 0-4는 윗줄(row 0), 5-9는 아랫줄(row 1)
                if (globalIndex < cardsPerRow) {
                    targetRow = 0;
                    cardIndexInRow = globalIndex;
                } else {
                    targetRow = 1;
                    cardIndexInRow = globalIndex - cardsPerRow;
                }
            }

            // 현재 줄에 있는 총 카드 수 계산
            let cardsInTargetRow;
            if (isPlayer) {
                if (cardCount <= 5) {
                    cardsInTargetRow = cardCount; // 모든 카드가 row 0에
                } else {
                    const newCardsCount = cardCount - 5;
                    cardsInTargetRow = targetRow === 0 ? newCardsCount : 5;
                }
            } else {
                cardsInTargetRow = targetRow === 0 ?
                    Math.min(cardCount, cardsPerRow) :
                    Math.max(0, cardCount - cardsPerRow);
            }

            if (cardsInTargetRow === 0) return;

            // 줄 내 카드 간격 계산
            const totalCardWidth = cardsInTargetRow * cardSize.width;
            const totalSpacing = (cardsInTargetRow - 1) * layout.cardSpacing;
            const totalWidth = totalCardWidth + totalSpacing;
            const startX = area.x + (area.width - totalWidth) / 2;

            // 카드 위치 계산
            const cardX = startX + cardIndexInRow * (cardSize.width + layout.cardSpacing);
            const currentY = startY + targetRow * (cardSize.height + rowSpacing);

            // 현재 발동 중인 카드 하이라이트
            const isNextActive = this.options.highlightNextCard &&
                                battleSystem &&
                                battleSystem.activatingCard === card;

            // 잔상 효과 확인
            const { isFadingOut, fadeStartTime } = this.getCardFadeState(globalIndex, isPlayer);

            this.renderCard(card, cardX, currentY, cardSize, {
                isPlayer,
                isNextActive: isNextActive || isFadingOut,
                isFadingOut,
                fadeStartTime,
                index: globalIndex,
                context: 'hand'  // 손패 카드임을 명시
            });
        });
    }

    // 카드 활성화 상태 업데이트
    updateCardActivationState(player, isPlayer, battleSystem) {
        const currentActivatingCard = battleSystem ? battleSystem.activatingCard : null;
        const playerType = isPlayer ? 'player' : 'enemy';

        if (currentActivatingCard) {
            // 현재 활성화 중인 카드의 인덱스 찾기
            const cardIndex = player.hand.findIndex(card => card === currentActivatingCard);

            if (cardIndex !== -1 &&
                (this.lastActivatedCardIndex !== cardIndex || this.lastActivatedPlayer !== playerType)) {
                // 새로운 카드가 활성화됨
                this.lastActivatedCardIndex = cardIndex;
                this.lastActivatedPlayer = playerType;
                this.lastActivatedTime = null; // 새 카드 활성화 시 타이머 리셋
            }
        } else if (this.lastActivatedCardIndex !== -1 &&
                   this.lastActivatedPlayer === playerType &&
                   this.lastActivatedTime === null) {
            // 카드 활성화가 끝남 - 잔상 타이머 시작 (한 번만)
            this.lastActivatedTime = Date.now();
        }
    }

    // 카드 페이드 상태 가져오기
    getCardFadeState(cardIndex, isPlayer) {
        const playerType = isPlayer ? 'player' : 'enemy';

        if (this.lastActivatedCardIndex === cardIndex &&
            this.lastActivatedPlayer === playerType &&
            this.lastActivatedTime) {

            const elapsed = Date.now() - this.lastActivatedTime;
            const fadeoutDuration = GameConfig.cardStyle.activeCardGlow.fadeoutDuration;

            if (elapsed < fadeoutDuration) {
                return {
                    isFadingOut: true,
                    fadeStartTime: this.lastActivatedTime
                };
            } else {
                // 잔상 효과 종료
                this.lastActivatedCardIndex = -1;
                this.lastActivatedPlayer = null;
                this.lastActivatedTime = null;
            }
        }

        return {
            isFadingOut: false,
            fadeStartTime: null
        };
    }

    // 개별 카드 렌더링
    renderCard(card, x, y, size, options = {}) {
        const {
            isPlayer = true,
            isNextActive = false,
            isFadingOut = false,
            fadeStartTime = null,
            index = 0,
            context = 'default'
        } = options;

        // 통일된 카드 렌더러 사용
        this.cardRenderer.renderCard(this.ctx, card, x, y, size.width, size.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive,
            isFadingOut,
            fadeStartTime,
            context // options에서 전달받은 context 사용
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
                const enemyName = info.enemy ? info.enemy.name : (I18nHelper.getText('auto_battle_card_game.ui.default_enemy_name') || '적');
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
                isNextActive: isSelected,
                context: 'default' // 카드 선택 화면은 기본값
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
            isNextActive: true,
            context: 'runtime' // 카드 이동 애니메이션도 실시간 스탯
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

    // 영역 위치 업데이트 (GameConfig 변경사항 반영)
    updateAreas() {
        const handAreaHeight = GameConfig.cardSizes.hand.height * GameConfig.handLayout.rows +
                              GameConfig.cardSizes.hand.height * GameConfig.handLayout.rowSpacing;

        // GameConfig.ui 값 기반으로 위치 재계산
        this.areas.enemyHand.y = GameConfig.ui.enemyHand.y - handAreaHeight / 2;
        this.areas.playerHand.y = GameConfig.ui.playerHand.y - handAreaHeight / 2;
        this.areas.battlefield.y = GameConfig.ui.enemyHand.y + handAreaHeight / 2 + 20;
        this.areas.battlefield.height = GameConfig.ui.playerHand.y - GameConfig.ui.enemyHand.y - handAreaHeight - 40;
    }

    // 화면 크기 조정
    resize(width, height) {
        this.width = GameConfig.canvas.width;
        this.height = GameConfig.canvas.height;
        this.canvas.width = GameConfig.canvas.width;
        this.canvas.height = GameConfig.canvas.height;

        // 너비 관련 영역 조정
        this.areas.enemyHand.x = 50;
        this.areas.enemyHand.width = width - 100;
        this.areas.playerHand.x = 50;
        this.areas.playerHand.width = width - 100;
        this.areas.battlefield.x = 50;
        this.areas.battlefield.width = width - 100;

        // 위치 재계산 (공통 로직 사용)
        this.updateAreas();

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