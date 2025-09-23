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
        this.scrollY = 0;  // 스크롤 위치

        // 팝업 상태
        this.showCardPopup = false;
        this.selectedCardForPopup = null;
        this.popupAnimation = {
            progress: 0,
            startTime: 0,
            isShowing: false,
            isHiding: false
        };

        // 클릭 애니메이션 상태
        this.clickAnimations = new Map(); // 카드 인덱스별 클릭 애니메이션

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

        // 통일된 카드 렌더러
        this.cardRenderer = new CardRenderer();

        // DOM 카드 렌더러 (갤러리와 동일한 스타일)
        this.domCardRenderer = new DOMCardRenderer();
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
                const cardInstance = CardDatabase.createCardInstance(cardId);
                return cardInstance;
            }).filter(Boolean);
        } else {
            // 폴백: 공격 카드만 필터링하고 Card 인스턴스 생성
            const attackCards = CardDatabase.getAllCards().filter(card => card.type === 'attack');
            this.availableCards = attackCards.map(cardData => new Card(cardData));
        }


        if (this.availableCards.length === 0) {
        }

        this.selectedCards = [];
        this.currentIndex = 0;
        this.scrollY = 0;  // 스크롤 초기화
        this.showCardPopup = false;
        this.selectedCardForPopup = null;
        this.clickAnimations.clear();
        this.startRevealAnimation();

        // DOM 기반 카드 갤러리 생성 (갤러리와 동일한 스타일)
        this.populateCardSelectionDOM();
    }

    // 보상 카드 선택 설정
    setupRewardSelection(rewardCards) {
        this.selectionType = 'reward';
        this.maxSelections = 1;
        this.minSelections = 1;
        this.availableCards = rewardCards;
        this.selectedCards = [];
        this.currentIndex = 0;
        this.scrollY = 0;  // 스크롤 초기화
        this.showCardPopup = false;
        this.selectedCardForPopup = null;
        this.clickAnimations.clear();
        this.startRevealAnimation();

        // DOM 기반 카드 갤러리 생성 (갤러리와 동일한 스타일)
        this.populateCardSelectionDOM();
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
        this.scrollY = 0;  // 스크롤 초기화
        this.showCardPopup = false;
        this.selectedCardForPopup = null;
        this.clickAnimations.clear();
        this.startRevealAnimation();

        // DOM 기반 카드 갤러리 생성 (갤러리와 동일한 스타일)
        this.populateCardSelectionDOM();
    }

    // 공개 애니메이션 시작 (비활성화)
    startRevealAnimation() {
        this.revealAnimation.started = false;
        this.revealAnimation.progress = 1;
        this.revealAnimation.startTime = Date.now();
    }

    // DOM 기반 카드 선택 그리드 생성 (UIManager의 방식과 동일)
    populateCardSelectionDOM() {
        const container = document.getElementById('card-selection-grid');
        if (!container) return;

        container.innerHTML = '';

        this.availableCards.forEach((card, index) => {
            const cardElement = this.createCardSelectionElement(card, index);
            container.appendChild(cardElement);
        });
    }

    // 선택 카드 요소 생성 (UIManager.createCardGalleryElement와 동일 방식)
    createCardSelectionElement(card, index) {
        // 갤러리 카드 크기 (gameConfig에서 가져오기)
        const cardSize = GameConfig.cardSizes.preview;

        // 통일된 카드 렌더러로 카드 생성
        const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: this.selectedCards.includes(card),
            isHighlighted: false,
            isNextActive: false,
            opacity: 1
        });

        // 갤러리 카드 스타일 적용 (CSS 클래스는 동일하게 유지)
        cardElement.className = 'card-selection-item';

        // 선택 상태 표시
        if (this.selectedCards.includes(card)) {
            cardElement.classList.add('selected');
        }

        // 클릭 이벤트 핸들러
        cardElement.addEventListener('click', () => {
            this.handleCardClick(index);
        });

        return cardElement;
    }

    // 카드 클릭 처리
    handleCardClick(index) {
        if (index < 0 || index >= this.availableCards.length) return;

        const card = this.availableCards[index];

        if (this.selectedCards.includes(card)) {
            // 선택 해제
            this.selectedCards = this.selectedCards.filter(c => c !== card);
        } else {
            // 새로 선택
            if (this.selectedCards.length < this.maxSelections) {
                this.selectedCards.push(card);
            } else if (this.maxSelections === 1) {
                // 단일 선택 모드: 기존 선택 교체
                this.selectedCards = [card];
            }
        }

        // DOM 업데이트
        this.updateSelectionDOM();
    }

    // 선택 상태 DOM 업데이트
    updateSelectionDOM() {
        const container = document.getElementById('card-selection-grid');
        if (!container) return;

        const cardElements = container.querySelectorAll('.card-selection-item');

        cardElements.forEach((element, index) => {
            const card = this.availableCards[index];
            if (this.selectedCards.includes(card)) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        });
    }

    // 카드 선택 화면 렌더링
    render(ctx, canvas) {
        this.renderBackground(ctx, canvas);
        this.renderTitle(ctx, canvas);
        this.renderAvailableCards(ctx, canvas);

        if (this.showConfirmation) {
            this.renderConfirmation(ctx, canvas);
        }

        if (this.showCardPopup) {
            this.renderCardPopup(ctx, canvas);
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
        ctx.fillRect(0, 0, GameConfig.canvas.width, GameConfig.canvas.height);

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
        for (let x = 0; x < GameConfig.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GameConfig.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < GameConfig.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GameConfig.canvas.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 제목 렌더링 (동적 중앙 정렬)
    renderTitle(ctx, canvas) {
        const titleKeys = {
            initial: 'auto_battle_card_game.ui.card_selection.initial_title',
            reward: 'auto_battle_card_game.ui.card_selection.reward_title',
            replacement: 'auto_battle_card_game.ui.card_selection.replacement_title'
        };

        ctx.save();

        // 설정값 사용
        const config = GameConfig.cardSelection;
        const centerX = GameConfig.canvas.width / 2;
        const titleY = config.title.y;
        const progressY = config.progress.y;

        // 메인 제목
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${config.title.fontSize}px Arial`;
        ctx.textAlign = 'center';

        const titleKey = titleKeys[this.selectionType];
        const title = (typeof getI18nText === 'function' && titleKey) ?
            getI18nText(titleKey) || 'Select Card' : 'Select Card';

        // 제목 그림자 효과
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(title, centerX + config.title.shadowOffset, titleY + config.title.shadowOffset);

        // 메인 제목
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(title, centerX, titleY);

        ctx.restore();
    }

    // 안내 메시지 렌더링 (동적 중앙 정렬)
    renderInstructions(ctx, canvas) {
        const instructions = this.getInstructions();

        ctx.save();

        // 설정값 사용
        const config = GameConfig.cardSelection.instructions;
        const centerX = GameConfig.canvas.width / 2;

        ctx.fillStyle = '#ccc';
        ctx.font = `${config.fontSize}px Arial`;
        ctx.textAlign = 'center';

        instructions.forEach((instruction, index) => {
            const y = config.startY + index * config.lineHeight;
            ctx.fillText(instruction, centerX, y);
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
            ctx.fillText('Loading cards...', GameConfig.canvas.width / 2, GameConfig.canvas.height / 2);
            ctx.restore();
            return;
        }

        // 설정값 사용
        const config = GameConfig.cardSelection.cards;
        const scrollConfig = GameConfig.cardSelection.scroll;
        const startY = config.startY;
        const cardWidth = config.width;
        const cardHeight = config.height;
        const spacing = config.spacing;
        const rowSpacing = config.rowSpacing;
        const cols = Math.min(this.availableCards.length, config.maxCols);
        const totalWidth = cols * spacing - (spacing - cardWidth);
        const centerX = GameConfig.canvas.width / 2;
        const startX = centerX - totalWidth / 2;

        // 뷰포트 클리핑 설정
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, startY, GameConfig.canvas.width, scrollConfig.viewportHeight);
        ctx.clip();

        this.availableCards.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacing;
            const y = startY + row * (cardHeight + rowSpacing) - this.scrollY;

            // 뷰포트 밖의 카드는 렌더링 생략 (성능 최적화)
            if (y + cardHeight < startY || y > startY + scrollConfig.viewportHeight) {
                return;
            }

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

        ctx.restore();
    }

    // 선택 가능한 카드 렌더링
    renderSelectableCard(ctx, card, x, y, width, height, options) {
        const { isSelected, isHighlighted, revealProgress, index } = options;

        ctx.save();

        // 클릭 애니메이션 적용
        const clickAnim = this.clickAnimations.get(index);
        let scale = 1;
        if (clickAnim && clickAnim.active) {
            scale = this.getClickAnimationScale(clickAnim);

            // 카드 중심점 기준으로 스케일 적용
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);
        }

        // 통일된 카드 렌더러 사용
        this.cardRenderer.renderCard(ctx, card, x, y, width, height, {
            isSelected,
            isHighlighted,
            opacity: 1
        });

        // 선택 표시
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(x, y, width, height);

            // 체크마크
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', x + width - 20, y + 25);
        }

        ctx.restore();
    }

    // 선택된 카드들 렌더링
    renderSelectedCards(ctx, canvas) {
        if (this.selectedCards.length === 0) return;

        const startY = GameConfig.canvas.height - 120;
        const cardWidth = 80;
        const cardHeight = 110;
        const spacing = 90;
        const totalWidth = this.selectedCards.length * spacing - (spacing - cardWidth);
        const startX = (GameConfig.canvas.width - totalWidth) / 2;

        ctx.save();

        // 선택된 카드 영역 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, startY - 20, GameConfig.canvas.width, 140);

        // 라벨
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Selected Cards', GameConfig.canvas.width / 2, startY - 5);

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
        // 통일된 카드 렌더러 사용
        this.cardRenderer.renderCard(ctx, card, x, y, width, height, {
            isSelected: false,
            isHighlighted: false,
            opacity: 1
        });
    }

    // 선택 상태 렌더링
    renderSelectionStatus(ctx, canvas) {
        const y = GameConfig.canvas.height - 60;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';

        // 진행 상황
        const current = this.selectedCards.length;
        const max = this.maxSelections;
        const min = this.minSelections;

        let statusText = `Selected: ${current}/${max}`;
        if (min > 0 && current < min) {
            statusText += ` (최소 ${min}장 필요)`;
            ctx.fillStyle = '#ff6b6b';
        } else if (current >= min) {
            statusText += ' (완료 가능)';
            ctx.fillStyle = '#4caf50';
        }

        ctx.fillText(statusText, GameConfig.canvas.width / 2, y);

        // 제약 조건 검사
        const violations = this.checkConstraintViolations();
        if (violations.length > 0) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            violations.forEach((violation, index) => {
                ctx.fillText(violation, GameConfig.canvas.width / 2, y + 20 + index * 15);
            });
        }

        ctx.restore();
    }

    // 확인 대화상자 렌더링
    renderConfirmation(ctx, canvas) {
        const config = GameConfig.cardSelection.confirmationModal;

        ctx.save();

        // 배경 오버레이
        ctx.fillStyle = config.background.overlay;
        ctx.fillRect(0, 0, GameConfig.canvas.width, GameConfig.canvas.height);

        // 모달 위치 계산 (중앙 정렬)
        const modalWidth = config.size.width;
        const modalHeight = config.size.height;
        const x = (GameConfig.canvas.width - modalWidth) / 2;
        const y = (GameConfig.canvas.height - modalHeight) / 2;

        // 모달 배경
        ctx.fillStyle = config.background.modal;
        this.roundRect(ctx, x, y, modalWidth, modalHeight, config.size.borderRadius);
        ctx.fill();

        // 모달 테두리
        ctx.strokeStyle = config.background.borderColor;
        ctx.lineWidth = config.background.borderWidth;
        this.roundRect(ctx, x, y, modalWidth, modalHeight, config.size.borderRadius);
        ctx.stroke();

        // 제목
        ctx.fillStyle = config.title.color;
        ctx.font = `bold ${config.title.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Complete selection?', x + modalWidth/2, y + config.title.y);

        // 선택된 카드 수
        ctx.font = `${config.description.fontSize}px Arial`;
        ctx.fillStyle = config.description.color;
        ctx.fillText(`${this.selectedCards.length}장의 카드가 선택되었습니다.`, x + modalWidth/2, y + config.description.y);

        // 버튼들
        const buttonConfig = config.buttons;
        const buttonY = y + buttonConfig.y;
        const totalButtonWidth = buttonConfig.width * 2 + buttonConfig.spacing;
        const buttonStartX = x + (modalWidth - totalButtonWidth) / 2;

        // 확인 버튼
        const confirmX = buttonStartX;
        ctx.fillStyle = buttonConfig.confirm.color;
        this.roundRect(ctx, confirmX, buttonY, buttonConfig.width, buttonConfig.height, buttonConfig.borderRadius);
        ctx.fill();

        ctx.fillStyle = buttonConfig.confirm.textColor;
        ctx.font = `bold ${buttonConfig.fontSize}px Arial`;
        ctx.fillText(buttonConfig.confirm.text, confirmX + buttonConfig.width/2, buttonY + buttonConfig.height/2 + 6);

        // 취소 버튼
        const cancelX = buttonStartX + buttonConfig.width + buttonConfig.spacing;
        ctx.fillStyle = buttonConfig.cancel.color;
        this.roundRect(ctx, cancelX, buttonY, buttonConfig.width, buttonConfig.height, buttonConfig.borderRadius);
        ctx.fill();

        ctx.fillStyle = buttonConfig.cancel.textColor;
        ctx.fillText(buttonConfig.cancel.text, cancelX + buttonConfig.width/2, buttonY + buttonConfig.height/2 + 6);

        ctx.restore();
    }

    // 카드 확대 팝업 렌더링
    renderCardPopup(ctx, canvas) {
        if (!this.selectedCardForPopup) return;

        const config = GameConfig.cardSelection.popup;

        ctx.save();

        // 애니메이션 진행도 계산
        const animProgress = this.getPopupAnimationProgress();
        const scale = this.easeOutQuart(animProgress);
        const opacity = animProgress;

        // 오버레이 배경
        ctx.fillStyle = config.background.overlay;
        ctx.globalAlpha = opacity * 0.7;
        ctx.fillRect(0, 0, GameConfig.canvas.width, GameConfig.canvas.height);

        // 팝업 위치 계산 (중앙 정렬)
        const popupWidth = config.size.width;
        const popupHeight = config.size.height;
        const popupX = (GameConfig.canvas.width - popupWidth) / 2;
        const popupY = (GameConfig.canvas.height - popupHeight) / 2;

        // 팝업 중심점 계산
        const centerX = popupX + popupWidth / 2;
        const centerY = popupY + popupHeight / 2;

        // 팝업 스케일 애니메이션 적용 (중심점 기준)
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.globalAlpha = opacity;

        // 팝업 배경 (실제 위치에 그리기)
        ctx.fillStyle = config.background.modal;
        this.roundRect(ctx, popupX, popupY, popupWidth, popupHeight, config.size.borderRadius);
        ctx.fill();

        // 팝업 테두리 (실제 위치에 그리기)
        ctx.strokeStyle = config.background.borderColor;
        ctx.lineWidth = config.background.borderWidth;
        this.roundRect(ctx, popupX, popupY, popupWidth, popupHeight, config.size.borderRadius);
        ctx.stroke();

        // 팝업 제목 (실제 위치 기준)
        ctx.fillStyle = config.title.color;
        ctx.font = `bold ${config.title.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(config.title.text, centerX, popupY + config.title.y);

        // 카드 렌더링 (팝업 중앙에 크게)
        const cardX = popupX + (popupWidth - config.card.width) / 2;
        const cardY = popupY + config.card.y;

        this.cardRenderer.renderCard(ctx, this.selectedCardForPopup,
            cardX, cardY, config.card.width, config.card.height, {
                isSelected: false,
                isHighlighted: true,
                opacity: 1
            });

        // 버튼들 렌더링 (실제 팝업 위치 전달)
        this.renderPopupButtons(ctx, config, popupX, popupY);

        ctx.restore();
    }

    // 팝업 버튼들 렌더링
    renderPopupButtons(ctx, config, popupX, popupY) {
        const buttonConfig = config.buttons;
        const popupWidth = config.size.width;

        // 버튼 위치 계산 (팝업 내에서 중앙 정렬, 절대 좌표)
        const totalButtonWidth = buttonConfig.width * 2 + buttonConfig.spacing;
        const startX = popupX + (popupWidth - totalButtonWidth) / 2;
        const buttonY = popupY + buttonConfig.y;

        // 선택 버튼 (절대 좌표)
        const selectX = startX;
        ctx.fillStyle = buttonConfig.select.color;
        this.roundRect(ctx, selectX, buttonY, buttonConfig.width, buttonConfig.height, buttonConfig.borderRadius);
        ctx.fill();

        ctx.fillStyle = buttonConfig.select.textColor;
        ctx.font = `bold ${buttonConfig.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(buttonConfig.select.text, selectX + buttonConfig.width / 2, buttonY + buttonConfig.height / 2 + 6);

        // 취소 버튼 (절대 좌표)
        const cancelX = startX + buttonConfig.width + buttonConfig.spacing;
        ctx.fillStyle = buttonConfig.cancel.color;
        this.roundRect(ctx, cancelX, buttonY, buttonConfig.width, buttonConfig.height, buttonConfig.borderRadius);
        ctx.fill();

        ctx.fillStyle = buttonConfig.cancel.textColor;
        ctx.fillText(buttonConfig.cancel.text, cancelX + buttonConfig.width / 2, buttonY + buttonConfig.height / 2 + 6);
    }

    // 입력 처리 (키보드 네비게이션 제거, 클릭 전용)
    handleInput(key) {
        // 키보드 입력 무시 - 클릭으로만 선택 가능
        return;
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

    // 카드 선택/해제 토글 (간소화 - 클릭으로만 사용)
    toggleCardSelection() {
        // 키보드 네비게이션 제거로 이 메서드는 더 이상 사용되지 않음
        // 클릭 처리는 handlePointerInput에서 직접 처리
        return;
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
                violations.push('At least 1 attack card required');
            }
        }

        // 같은 타입 제한
        const typeCount = {};
        selectedCardData.forEach(card => {
            typeCount[card.type] = (typeCount[card.type] || 0) + 1;
        });

        Object.entries(typeCount).forEach(([type, count]) => {
            if (count > this.constraints.maxSameType) {
                violations.push(`Maximum ${this.constraints.maxSameType} cards of same type allowed`);
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

    // 카드 공개 진행도 가져오기 (애니메이션 비활성화)
    getCardRevealProgress(index) {
        return 1; // 항상 완전히 표시
    }

    // 안내 메시지 가져오기
    getInstructions() {
        // 새로운 안내 메시지만 표시
        const instructions = [];

        if (this.selectionType === 'initial') {
            instructions.push('Select attack cards to start the game!');
        } else if (this.selectionType === 'reward') {
            instructions.push('Select a reward card for your victory.');
        } else if (this.selectionType === 'replacement') {
            instructions.push('Select a card to replace. You can also skip.');
        }

        return instructions;
    }

    // 애니메이션 업데이트
    updateAnimations() {
        const now = Date.now();

        // 공개 애니메이션 업데이트
        if (this.revealAnimation.started) {
            const elapsed = now - this.revealAnimation.startTime;
            const totalDuration = this.revealAnimation.duration + (this.availableCards.length * 200);

            if (elapsed >= totalDuration) {
                this.revealAnimation.started = false;
            }
        }

        // 클릭 애니메이션 업데이트
        this.clickAnimations.forEach((anim, index) => {
            if (anim.active) {
                const elapsed = now - anim.startTime;
                const config = GameConfig.cardSelection.clickEffect;

                if (elapsed >= config.duration) {
                    anim.active = false;
                    anim.progress = 1;
                } else {
                    anim.progress = elapsed / config.duration;
                }
            }
        });

        // 팝업 애니메이션 업데이트
        if (this.popupAnimation.isShowing || this.popupAnimation.isHiding) {
            const elapsed = now - this.popupAnimation.startTime;
            const config = GameConfig.cardSelection.popup;

            if (elapsed >= config.animation.duration) {
                if (this.popupAnimation.isShowing) {
                    this.popupAnimation.isShowing = false;
                    this.popupAnimation.progress = 1;
                } else if (this.popupAnimation.isHiding) {
                    this.popupAnimation.isHiding = false;
                    this.showCardPopup = false;
                    this.selectedCardForPopup = null;
                    this.popupAnimation.progress = 0;
                }
            } else {
                const progress = elapsed / config.animation.duration;
                this.popupAnimation.progress = this.popupAnimation.isHiding ? 1 - progress : progress;
            }
        }
    }

    // 마우스/터치 입력 처리
    handlePointerInput(x, y, canvas) {
        if (this.showConfirmation) {
            this.handleConfirmationPointerInput(x, y, canvas);
            return;
        }

        if (this.showCardPopup) {
            this.handleCardPopupInput(x, y, canvas);
            return;
        }

        // 카드 클릭 체크 (설정값 사용)
        const config = GameConfig.cardSelection.cards;
        const startY = config.startY;
        const cardWidth = config.width;
        const cardHeight = config.height;
        const spacing = config.spacing;
        const rowSpacing = config.rowSpacing;
        const cols = Math.min(this.availableCards.length, config.maxCols);
        const totalWidth = cols * spacing - (spacing - cardWidth);
        const centerX = GameConfig.canvas.width / 2;
        const startX = centerX - totalWidth / 2;

        this.availableCards.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const cardX = startX + col * spacing;
            const cardY = startY + row * (cardHeight + rowSpacing) - this.scrollY;

            if (x >= cardX && x <= cardX + cardWidth &&
                y >= cardY && y <= cardY + cardHeight) {
                this.currentIndex = index;

                // 클릭 애니메이션 시작
                this.startClickAnimation(index);

                // 초기 카드 선택 모드일 때는 팝업으로 확인
                if (this.selectionType === 'initial') {
                    this.showCardPopupForSelection(card);
                } else {
                    // 다른 모드에서는 기존 로직
                    setTimeout(() => {
                        this.toggleCardSelection();
                    }, GameConfig.cardSelection.clickEffect.duration);
                }
            }
        });
    }

    // 휠 입력 처리 (스크롤)
    handleWheelInput(deltaY) {
        const scrollConfig = GameConfig.cardSelection.scroll;
        const config = GameConfig.cardSelection.cards;

        // 총 행 수 계산
        const cols = Math.min(this.availableCards.length, config.maxCols);
        const totalRows = Math.ceil(this.availableCards.length / cols);
        const maxScrollY = Math.max(0, (totalRows * (config.height + config.rowSpacing)) - scrollConfig.viewportHeight);

        // 스크롤 위치 업데이트
        this.scrollY += deltaY > 0 ? scrollConfig.speed : -scrollConfig.speed;
        this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY));
    }

    // 확인 대화상자 포인터 입력 처리
    handleConfirmationPointerInput(x, y, canvas) {
        const config = GameConfig.cardSelection.confirmationModal;

        // 모달 위치 계산 (중앙 정렬)
        const modalWidth = config.size.width;
        const modalHeight = config.size.height;
        const modalX = (GameConfig.canvas.width - modalWidth) / 2;
        const modalY = (GameConfig.canvas.height - modalHeight) / 2;

        const buttonConfig = config.buttons;
        const buttonY = modalY + buttonConfig.y;
        const totalButtonWidth = buttonConfig.width * 2 + buttonConfig.spacing;
        const buttonStartX = modalX + (modalWidth - totalButtonWidth) / 2;

        // 확인 버튼
        const confirmX = buttonStartX;
        if (x >= confirmX && x <= confirmX + buttonConfig.width &&
            y >= buttonY && y <= buttonY + buttonConfig.height) {
            this.finalizeSelection();
        }

        // 취소 버튼
        const cancelX = buttonStartX + buttonConfig.width + buttonConfig.spacing;
        if (x >= cancelX && x <= cancelX + buttonConfig.width &&
            y >= buttonY && y <= buttonY + buttonConfig.height) {
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

    // 클릭 애니메이션 시작
    startClickAnimation(index) {
        this.clickAnimations.set(index, {
            active: true,
            startTime: Date.now(),
            progress: 0
        });
    }

    // 클릭 애니메이션 스케일 계산
    getClickAnimationScale(clickAnim) {
        const config = GameConfig.cardSelection.clickEffect;
        const progress = clickAnim.progress;

        if (progress <= config.phases.expand) {
            // 확대 단계
            const expandProgress = progress / config.phases.expand;
            return 1 + (config.scaleMax - 1) * expandProgress;
        } else {
            // 축소 단계
            const contractProgress = (progress - config.phases.expand) / config.phases.contract;
            const currentScale = config.scaleMax + (config.scaleMin - config.scaleMax) * contractProgress;
            return Math.max(config.scaleMin, currentScale);
        }
    }

    // 카드 선택 팝업 표시
    showCardPopupForSelection(card) {
        setTimeout(() => {
            this.selectedCardForPopup = card;
            this.showCardPopup = true;
            this.popupAnimation.isShowing = true;
            this.popupAnimation.isHiding = false;
            this.popupAnimation.startTime = Date.now();
            this.popupAnimation.progress = 0;
        }, GameConfig.cardSelection.clickEffect.duration);
    }

    // 팝업 애니메이션 진행도 계산
    getPopupAnimationProgress() {
        return Math.max(0, Math.min(1, this.popupAnimation.progress));
    }

    // 이징 함수 - easeOutQuart
    easeOutQuart(t) {
        return 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t);
    }

    // 카드 팝업 입력 처리
    handleCardPopupInput(x, y, canvas) {
        const config = GameConfig.cardSelection.popup;

        // 팝업 위치 계산
        const popupWidth = config.size.width;
        const popupHeight = config.size.height;
        const popupX = (GameConfig.canvas.width - popupWidth) / 2;
        const popupY = (GameConfig.canvas.height - popupHeight) / 2;

        const buttonConfig = config.buttons;
        const totalButtonWidth = buttonConfig.width * 2 + buttonConfig.spacing;
        const startX = popupX + (popupWidth - totalButtonWidth) / 2;
        const buttonY = popupY + buttonConfig.y;

        // 선택 버튼 클릭 체크
        const selectX = startX;
        if (x >= selectX && x <= selectX + buttonConfig.width &&
            y >= buttonY && y <= buttonY + buttonConfig.height) {
            this.confirmCardSelection();
            return;
        }

        // 취소 버튼 클릭 체크
        const cancelX = startX + buttonConfig.width + buttonConfig.spacing;
        if (x >= cancelX && x <= cancelX + buttonConfig.width &&
            y >= buttonY && y <= buttonY + buttonConfig.height) {
            this.cancelCardPopup();
            return;
        }

        // 팝업 외부 클릭 시 취소
        if (x < popupX || x > popupX + popupWidth ||
            y < popupY || y > popupY + popupHeight) {
            this.cancelCardPopup();
        }
    }

    // 카드 선택 확인
    confirmCardSelection() {
        if (this.selectedCardForPopup && this.selectionType === 'initial') {
            this.selectedCards = [this.selectedCardForPopup.id];
            this.hideCardPopup();
            // 약간의 지연 후 게임 시작
            setTimeout(() => {
                this.finalizeSelection();
            }, 200);
        }
    }

    // 카드 팝업 취소
    cancelCardPopup() {
        this.hideCardPopup();
    }

    // 카드 팝업 숨기기
    hideCardPopup() {
        this.popupAnimation.isShowing = false;
        this.popupAnimation.isHiding = true;
        this.popupAnimation.startTime = Date.now();
    }

    // 정리
    cleanup() {
        this.cardAnimations.clear();
        this.clickAnimations.clear();
        this.revealAnimation.started = false;
        this.showCardPopup = false;
        this.selectedCardForPopup = null;
    }
}

// 전역 객체로 등록
window.CardSelection = CardSelection;