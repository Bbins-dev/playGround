// 카드 선택 화면 관리

class CardSelection {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 선택 상태
        this.selectionType = 'initial'; // 'initial' | 'reward' | 'replacement'
        this.availableCards = [];
        this.selectedCards = [];
        this.maxSelections = 3;
        this.minSelections = 1;

        // UI 상태
        this.currentIndex = 0;
        this.showConfirmation = false;

        // 애니메이션 상태
        this.cardAnimations = new Map();
        this.revealAnimation = {
            progress: 0,
            duration: 2000,
            started: false
        };

        // 선택 제한
        this.constraints = {
            mustHaveAttack: true, // 공격 카드 최소 1장 필요
            maxSameType: 2,       // 같은 타입 최대 2장
            maxSameElement: 3     // 같은 속성 최대 3장
        };

    }

    // 초기 카드 선택 설정
    setupInitialSelection() {
        this.selectionType = 'initial';
        this.maxSelections = 1; // 공격 카드 1장만 선택
        this.minSelections = 1;

        // CardDatabase 상태 확인
        const allCards = CardDatabase.getAllCards();

        // 초기 선택 가능한 카드들 (모든 공격 카드)
        if (this.gameManager.cardManager) {
            const attackCardIds = this.gameManager.cardManager.getInitialAttackCards();

            this.availableCards = attackCardIds.map(cardId => {
                const cardData = CardDatabase.getCard(cardId);
                return cardData;
            }).filter(Boolean);
        } else {
            // 폴백: 공격 카드만 필터링
            const attackCards = CardDatabase.getAllCards().filter(card => card.type === 'attack');
            this.availableCards = attackCards;
        }


        if (this.availableCards.length === 0) {
        }

        this.selectedCards = [];
        this.currentIndex = 0;
        this.startRevealAnimation();
    }

    // 보상 카드 선택 설정
    setupRewardSelection(rewardCards) {
        this.selectionType = 'reward';
        this.maxSelections = 1;
        this.minSelections = 1;
        this.availableCards = rewardCards;
        this.selectedCards = [];
        this.currentIndex = 0;
        this.startRevealAnimation();
    }

    // 카드 교체 선택 설정
    setupReplacementSelection(replaceableCards, newCards) {
        this.selectionType = 'replacement';
        this.maxSelections = 1;
        this.minSelections = 0;
        this.availableCards = newCards;
        this.replaceableCards = replaceableCards;
        this.selectedCards = [];
        this.currentIndex = 0;
        this.startRevealAnimation();
    }

    // 공개 애니메이션 시작
    startRevealAnimation() {
        this.revealAnimation.started = true;
        this.revealAnimation.progress = 0;
        this.revealAnimation.startTime = Date.now();
    }

    // 카드 선택 화면 렌더링
    render(ctx, canvas) {
        this.renderBackground(ctx, canvas);
        this.renderTitle(ctx, canvas);
        this.renderInstructions(ctx, canvas);
        this.renderAvailableCards(ctx, canvas);
        this.renderSelectedCards(ctx, canvas);
        this.renderSelectionStatus(ctx, canvas);

        if (this.showConfirmation) {
            this.renderConfirmation(ctx, canvas);
        }

        this.updateAnimations();
    }

    // 배경 렌더링
    renderBackground(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 선택 테이블 느낌의 배경 패턴
        this.renderTablePattern(ctx, canvas);
    }

    // 테이블 패턴 배경
    renderTablePattern(ctx, canvas) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        // 격자 패턴
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 제목 렌더링
    renderTitle(ctx, canvas) {
        const titleKeys = {
            initial: 'auto_battle_card_game.ui.card_selection.initial_title',
            reward: 'auto_battle_card_game.ui.card_selection.reward_title',
            replacement: 'auto_battle_card_game.ui.card_selection.replacement_title'
        };

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';

        const titleKey = titleKeys[this.selectionType];
        const title = (typeof getI18nText === 'function' && titleKey) ?
            getI18nText(titleKey) || '카드 선택' : '카드 선택';
        ctx.fillText(title, canvas.width / 2, 50);

        // 선택 진행상황
        const selectedText = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.ui.card_selection.selected_count') || '선택됨' : '선택됨';
        const progressText = `${this.selectedCards.length} / ${this.maxSelections} ${selectedText}`;
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText(progressText, canvas.width / 2, 75);

        ctx.restore();
    }

    // 안내 메시지 렌더링
    renderInstructions(ctx, canvas) {
        const instructions = this.getInstructions();

        ctx.save();
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';

        instructions.forEach((instruction, index) => {
            ctx.fillText(instruction, canvas.width / 2, 100 + index * 18);
        });

        ctx.restore();
    }

    // 선택 가능한 카드들 렌더링
    renderAvailableCards(ctx, canvas) {

        if (!this.availableCards || this.availableCards.length === 0) {
            // 카드가 없을 때 메시지 표시
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('카드를 로드 중...', canvas.width / 2, canvas.height / 2);
            ctx.restore();
            return;
        }

        const startY = 180;
        const cardWidth = 140;
        const cardHeight = 190;
        const spacing = 160;
        const cols = Math.min(this.availableCards.length, 5);
        const totalWidth = cols * spacing - (spacing - cardWidth);
        const startX = (canvas.width - totalWidth) / 2;


        this.availableCards.forEach((card, index) => {

            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacing;
            const y = startY + row * (cardHeight + 30);

            const isSelected = this.selectedCards.includes(card.id);
            const isHighlighted = index === this.currentIndex;
            const revealProgress = this.getCardRevealProgress(index);


            this.renderSelectableCard(ctx, card, x, y, cardWidth, cardHeight, {
                isSelected,
                isHighlighted,
                revealProgress,
                index
            });
        });

    }

    // 선택 가능한 카드 렌더링
    renderSelectableCard(ctx, card, x, y, width, height, options) {
        const { isSelected, isHighlighted, revealProgress, index } = options;

        ctx.save();

        // 카드 공개 애니메이션
        if (revealProgress < 1) {
            ctx.globalAlpha = revealProgress;
            const scale = 0.5 + revealProgress * 0.5;
            ctx.translate(x + width/2, y + height/2);
            ctx.scale(scale, scale);
            ctx.translate(-width/2, -height/2);
        } else {
            ctx.translate(x, y);
        }

        // 하이라이트 효과
        if (isHighlighted) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(-5, -5, width + 10, height + 10);
        }

        // 선택 표시
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(0, 0, width, height);

            // 체크마크
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✓', width - 20, 25);
        }

        // 카드 배경
        const elementConfig = GameConfig.elements[card.element];
        const bgColor = elementConfig?.color || '#666';

        ctx.fillStyle = bgColor;
        this.roundRect(ctx, 0, 0, width, height, 12);
        ctx.fill();

        // 카드 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 0, 0, width, height, 12);
        ctx.stroke();

        // 속성 아이콘
        if (elementConfig?.emoji) {
            ctx.font = '32px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(elementConfig.emoji, width/2, 40);
        }

        // 카드 이름 (i18n 지원)
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';

        let name = this.getCardDisplayName(card);
        if (name.length > 10) {
            name = name.substring(0, 9) + '...';
        }
        ctx.fillText(name, width/2, 70);

        // 카드 타입
        const typeConfig = GameConfig.cardTypes[card.type];
        if (typeConfig) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ddd';
            ctx.fillText(typeConfig.name, width/2, 90);
        }

        // 스탯
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`⚔ ${card.power}`, 10, height - 60);

        ctx.fillStyle = '#4caf50';
        ctx.fillText(`🎯 ${card.accuracy}%`, 10, height - 40);

        // 설명 (i18n 지원)
        const description = this.getCardDisplayDescription(card);
        if (description) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';

            const lines = this.wrapText(ctx, description, width - 20);
            lines.slice(0, 3).forEach((line, lineIndex) => {
                ctx.fillText(line, width/2, height - 25 + lineIndex * 12);
            });
        }

        ctx.restore();
    }

    // 선택된 카드들 렌더링
    renderSelectedCards(ctx, canvas) {
        if (this.selectedCards.length === 0) return;

        const startY = canvas.height - 120;
        const cardWidth = 80;
        const cardHeight = 110;
        const spacing = 90;
        const totalWidth = this.selectedCards.length * spacing - (spacing - cardWidth);
        const startX = (canvas.width - totalWidth) / 2;

        ctx.save();

        // 선택된 카드 영역 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, startY - 20, canvas.width, 140);

        // 라벨
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('선택된 카드', canvas.width / 2, startY - 5);

        // 선택된 카드들
        this.selectedCards.forEach((cardId, index) => {
            const card = this.availableCards.find(c => c.id === cardId);
            if (!card) return;

            const x = startX + index * spacing;
            const y = startY + 10;

            this.renderMiniCard(ctx, card, x, y, cardWidth, cardHeight);
        });

        ctx.restore();
    }

    // 미니 카드 렌더링
    renderMiniCard(ctx, card, x, y, width, height) {
        const elementConfig = GameConfig.elements[card.element];

        // 배경
        ctx.fillStyle = elementConfig?.color || '#666';
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.stroke();

        // 속성 아이콘
        if (elementConfig?.emoji) {
            ctx.font = '20px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(elementConfig.emoji, x + width/2, y + 25);
        }

        // 이름
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        let name = this.getCardDisplayName(card);
        if (name && name.length > 6) {
            name = name.substring(0, 5) + '...';
        }
        ctx.fillText(name || 'Unknown', x + width/2, y + 45);

        // 스탯
        ctx.font = '8px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`⚔${card.power}`, x + 5, y + height - 15);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#4caf50';
        ctx.fillText(`🎯${card.accuracy}%`, x + width - 5, y + height - 15);
    }

    // 선택 상태 렌더링
    renderSelectionStatus(ctx, canvas) {
        const y = canvas.height - 60;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';

        // 진행 상황
        const current = this.selectedCards.length;
        const max = this.maxSelections;
        const min = this.minSelections;

        let statusText = `선택: ${current}/${max}`;
        if (min > 0 && current < min) {
            statusText += ` (최소 ${min}장 필요)`;
            ctx.fillStyle = '#ff6b6b';
        } else if (current >= min) {
            statusText += ' (완료 가능)';
            ctx.fillStyle = '#4caf50';
        }

        ctx.fillText(statusText, canvas.width / 2, y);

        // 제약 조건 검사
        const violations = this.checkConstraintViolations();
        if (violations.length > 0) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            violations.forEach((violation, index) => {
                ctx.fillText(violation, canvas.width / 2, y + 20 + index * 15);
            });
        }

        ctx.restore();
    }

    // 확인 대화상자 렌더링
    renderConfirmation(ctx, canvas) {
        const modalWidth = 400;
        const modalHeight = 200;
        const x = (canvas.width - modalWidth) / 2;
        const y = (canvas.height - modalHeight) / 2;

        ctx.save();

        // 배경 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 모달 배경
        ctx.fillStyle = '#2a2a3e';
        this.roundRect(ctx, x, y, modalWidth, modalHeight, 15);
        ctx.fill();

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, modalWidth, modalHeight, 15);
        ctx.stroke();

        // 제목
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('선택을 완료하시겠습니까?', x + modalWidth/2, y + 50);

        // 선택된 카드 수
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText(`${this.selectedCards.length}장의 카드가 선택되었습니다.`, x + modalWidth/2, y + 80);

        // 버튼들
        const buttonY = y + modalHeight - 50;
        const buttonWidth = 100;
        const buttonHeight = 30;

        // 확인 버튼
        ctx.fillStyle = '#4caf50';
        this.roundRect(ctx, x + modalWidth/2 - buttonWidth - 10, buttonY, buttonWidth, buttonHeight, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('확인', x + modalWidth/2 - buttonWidth/2 - 10, buttonY + 20);

        // 취소 버튼
        ctx.fillStyle = '#666';
        this.roundRect(ctx, x + modalWidth/2 + 10, buttonY, buttonWidth, buttonHeight, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillText('취소', x + modalWidth/2 + buttonWidth/2 + 10, buttonY + 20);

        ctx.restore();
    }

    // 입력 처리
    handleInput(key) {
        if (this.showConfirmation) {
            this.handleConfirmationInput(key);
            return;
        }

        switch (key) {
            case 'ArrowLeft':
                this.selectPrevious();
                break;
            case 'ArrowRight':
                this.selectNext();
                break;
            case 'ArrowUp':
                this.selectUp();
                break;
            case 'ArrowDown':
                this.selectDown();
                break;
            case 'Enter':
            case ' ':
                this.toggleCardSelection();
                break;
            case 'c':
            case 'C':
                this.confirmSelection();
                break;
            case 'Escape':
                this.cancelSelection();
                break;
        }
    }

    // 확인 대화상자 입력 처리
    handleConfirmationInput(key) {
        switch (key) {
            case 'Enter':
            case 'y':
            case 'Y':
                this.finalizeSelection();
                break;
            case 'Escape':
            case 'n':
            case 'N':
                this.showConfirmation = false;
                break;
        }
    }

    // 카드 선택/해제 토글
    toggleCardSelection() {
        const card = this.availableCards[this.currentIndex];
        if (!card) return;

        const cardId = card.id;
        const isSelected = this.selectedCards.includes(cardId);

        if (isSelected) {
            // 선택 해제
            this.selectedCards = this.selectedCards.filter(id => id !== cardId);
        } else {
            // 선택
            if (this.selectedCards.length < this.maxSelections) {
                this.selectedCards.push(cardId);
            }
        }
    }

    // 선택 확인
    confirmSelection() {
        if (this.canConfirmSelection()) {
            this.showConfirmation = true;
        }
    }

    // 선택 완료
    finalizeSelection() {
        if (!this.canConfirmSelection()) return;


        // 게임 매니저에 선택 결과 전달
        if (this.selectionType === 'initial') {
            this.gameManager.setInitialCards(this.selectedCards);
        } else if (this.selectionType === 'reward') {
            this.gameManager.addRewardCard(this.selectedCards[0]);
        } else if (this.selectionType === 'replacement') {
            this.gameManager.replaceCard(this.selectedCards[0]);
        }

        // 다음 화면으로 이동
        this.gameManager.switchScreen('battle');
    }

    // 선택 취소
    cancelSelection() {
        if (this.selectionType === 'initial') {
            this.gameManager.switchScreen('menu');
        } else {
            // 보상이나 교체는 건너뛰기
            this.gameManager.skipCardSelection();
        }
    }

    // 선택 가능 여부 확인
    canConfirmSelection() {
        const current = this.selectedCards.length;
        const min = this.minSelections;
        const violations = this.checkConstraintViolations();

        return current >= min && violations.length === 0;
    }

    // 제약 조건 위반 검사
    checkConstraintViolations() {
        const violations = [];
        const selectedCardData = this.selectedCards.map(id =>
            this.availableCards.find(card => card.id === id)
        ).filter(Boolean);

        // 공격 카드 필수
        if (this.constraints.mustHaveAttack) {
            const attackCards = selectedCardData.filter(card => card.type === 'attack');
            if (attackCards.length === 0) {
                violations.push('공격 카드가 최소 1장 필요합니다');
            }
        }

        // 같은 타입 제한
        const typeCount = {};
        selectedCardData.forEach(card => {
            typeCount[card.type] = (typeCount[card.type] || 0) + 1;
        });

        Object.entries(typeCount).forEach(([type, count]) => {
            if (count > this.constraints.maxSameType) {
                violations.push(`같은 타입 카드는 최대 ${this.constraints.maxSameType}장까지 가능`);
            }
        });

        return violations;
    }

    // 내비게이션 함수들
    selectPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    selectNext() {
        if (this.currentIndex < this.availableCards.length - 1) {
            this.currentIndex++;
        }
    }

    selectUp() {
        const cols = 5;
        const newIndex = this.currentIndex - cols;
        if (newIndex >= 0) {
            this.currentIndex = newIndex;
        }
    }

    selectDown() {
        const cols = 5;
        const newIndex = this.currentIndex + cols;
        if (newIndex < this.availableCards.length) {
            this.currentIndex = newIndex;
        }
    }

    // 카드 공개 진행도 가져오기
    getCardRevealProgress(index) {
        if (!this.revealAnimation.started) return 1;

        const elapsed = Date.now() - this.revealAnimation.startTime;
        const delay = index * 200; // 카드별 200ms 딜레이
        const progress = Math.max(0, (elapsed - delay) / 800); // 800ms 애니메이션

        return Math.min(1, progress);
    }

    // 안내 메시지 가져오기
    getInstructions() {
        const base = [
            '방향키로 카드 선택, Enter로 선택/해제',
            'C키 또는 Enter로 완료, ESC로 취소'
        ];

        if (this.selectionType === 'initial') {
            base.unshift('시작할 공격 카드를 선택하세요.');
        } else if (this.selectionType === 'reward') {
            base.unshift('승리 보상으로 받을 카드를 선택하세요.');
        } else if (this.selectionType === 'replacement') {
            base.unshift('교체할 카드를 선택하세요. 건너뛸 수도 있습니다.');
        }

        return base;
    }

    // 애니메이션 업데이트
    updateAnimations() {
        // 공개 애니메이션 업데이트
        if (this.revealAnimation.started) {
            const elapsed = Date.now() - this.revealAnimation.startTime;
            const totalDuration = this.revealAnimation.duration + (this.availableCards.length * 200);

            if (elapsed >= totalDuration) {
                this.revealAnimation.started = false;
            }
        }
    }

    // 마우스/터치 입력 처리
    handlePointerInput(x, y, canvas) {
        if (this.showConfirmation) {
            this.handleConfirmationPointerInput(x, y, canvas);
            return;
        }

        // 카드 클릭 체크
        const startY = 180;
        const cardWidth = 140;
        const cardHeight = 190;
        const spacing = 160;
        const cols = Math.min(this.availableCards.length, 5);
        const totalWidth = cols * spacing - (spacing - cardWidth);
        const startX = (canvas.width - totalWidth) / 2;

        this.availableCards.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const cardX = startX + col * spacing;
            const cardY = startY + row * (cardHeight + 30);

            if (x >= cardX && x <= cardX + cardWidth &&
                y >= cardY && y <= cardY + cardHeight) {
                this.currentIndex = index;
                this.toggleCardSelection();
            }
        });
    }

    // 확인 대화상자 포인터 입력 처리
    handleConfirmationPointerInput(x, y, canvas) {
        const modalWidth = 400;
        const modalHeight = 200;
        const modalX = (canvas.width - modalWidth) / 2;
        const modalY = (canvas.height - modalHeight) / 2;

        const buttonY = modalY + modalHeight - 50;
        const buttonWidth = 100;
        const buttonHeight = 30;

        // 확인 버튼
        const confirmX = modalX + modalWidth/2 - buttonWidth - 10;
        if (x >= confirmX && x <= confirmX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.finalizeSelection();
        }

        // 취소 버튼
        const cancelX = modalX + modalWidth/2 + 10;
        if (x >= cancelX && x <= cancelX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.showConfirmation = false;
        }
    }

    // 유틸리티 함수들
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 카드 표시 이름 가져오기 (i18n 지원)
    getCardDisplayName(card) {
        if (card.nameKey && typeof getI18nText === 'function') {
            return getI18nText(card.nameKey) || card.name || card.id;
        }
        return card.name || card.id;
    }

    // 카드 표시 설명 가져오기 (i18n 지원)
    getCardDisplayDescription(card) {
        if (card.descriptionKey && typeof getI18nText === 'function') {
            return getI18nText(card.descriptionKey) || card.description || '';
        }
        return card.description || '';
    }

    // 정리
    cleanup() {
        this.cardAnimations.clear();
        this.revealAnimation.started = false;
    }
}

// 전역 객체로 등록
window.CardSelection = CardSelection;