// 카드 갤러리 화면 관리

class CardGallery {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 갤러리 상태
        this.allCards = [];
        this.filteredCards = [];
        this.currentPage = 0;
        this.cardsPerPage = 12;
        this.selectedCardIndex = 0;

        // 필터 설정
        this.filters = {
            type: 'all', // 'all', 'attack', 'defense', 'status', 'buff', 'debuff', 'special'
            element: 'all', // 'all', 'fire', 'water', 'electric', 'poison', 'normal'
            search: ''
        };

        // UI 상태
        this.showDetails = false;
        this.detailCard = null;

        // 애니메이션 상태
        this.scrollOffset = 0;
        this.targetScrollOffset = 0;
        this.cardAnimations = new Map();

        this.initialize();
    }

    // 초기화
    initialize() {
        this.loadAllCards();
        this.applyFilters();
        console.log('🎴 카드 갤러리 초기화 완료');
    }

    // 모든 카드 로드
    loadAllCards() {
        if (this.gameManager.cardManager) {
            this.allCards = this.gameManager.cardManager.getAllCardsForGallery();
        } else {
            // CardDatabase에서 직접 로드
            this.allCards = CardDatabase.getAllCards().map(cardData => ({
                ...cardData,
                element: GameConfig.elements[cardData.element],
                type: GameConfig.cardTypes[cardData.type]
            }));
        }

        console.log(`📚 총 ${this.allCards.length}장의 카드 로드됨`);
    }

    // 필터 적용
    applyFilters() {
        this.filteredCards = this.allCards.filter(card => {
            // 타입 필터
            if (this.filters.type !== 'all' && card.type !== this.filters.type) {
                return false;
            }

            // 속성 필터
            if (this.filters.element !== 'all' && card.element !== this.filters.element) {
                return false;
            }

            // 검색 필터
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const cardName = card.name.toLowerCase();
                const cardDesc = card.description.toLowerCase();

                if (!cardName.includes(searchTerm) && !cardDesc.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        // 페이지 리셋
        this.currentPage = 0;
        this.selectedCardIndex = 0;

        console.log(`🔍 필터링 결과: ${this.filteredCards.length}장`);
    }

    // 갤러리 렌더링
    render(ctx, canvas) {
        this.renderBackground(ctx, canvas);
        this.renderHeader(ctx, canvas);
        this.renderFilters(ctx, canvas);
        this.renderCardGrid(ctx, canvas);
        this.renderPagination(ctx, canvas);
        this.renderInstructions(ctx, canvas);

        if (this.showDetails && this.detailCard) {
            this.renderCardDetails(ctx, canvas);
        }

        this.updateAnimations();
    }

    // 배경 렌더링
    renderBackground(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 헤더 렌더링
    renderHeader(ctx, canvas) {
        ctx.save();

        // 제목
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🃏 카드 갤러리', canvas.width / 2, 50);

        // 카드 수 정보
        ctx.fillStyle = '#ccc';
        ctx.font = '16px Arial';
        const totalText = `총 ${this.filteredCards.length}장`;
        const pageText = this.getTotalPages() > 1 ?
            ` (${this.currentPage + 1}/${this.getTotalPages()} 페이지)` : '';
        ctx.fillText(totalText + pageText, canvas.width / 2, 75);

        ctx.restore();
    }

    // 필터 렌더링
    renderFilters(ctx, canvas) {
        const startY = 100;
        const centerX = canvas.width / 2;

        ctx.save();

        // 타입 필터
        this.renderFilterSection(ctx, '타입:', this.getTypeFilters(),
                                centerX - 200, startY, this.filters.type);

        // 속성 필터
        this.renderFilterSection(ctx, '속성:', this.getElementFilters(),
                                centerX + 50, startY, this.filters.element);

        ctx.restore();
    }

    // 필터 섹션 렌더링
    renderFilterSection(ctx, label, options, x, y, currentValue) {
        // 라벨
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, x, y);

        // 옵션들
        options.forEach((option, index) => {
            const optionX = x + index * 80;
            const optionY = y + 25;
            const isSelected = option.value === currentValue;

            // 배경
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fillRect(optionX - 5, optionY - 15, 70, 25);
            }

            // 텍스트
            ctx.fillStyle = isSelected ? '#ffd700' : '#ccc';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(option.label, optionX + 30, optionY);
        });
    }

    // 카드 그리드 렌더링
    renderCardGrid(ctx, canvas) {
        const startX = 100;
        const startY = 180;
        const cardWidth = 120;
        const cardHeight = 160;
        const cols = 8;
        const spacingX = (canvas.width - 200) / cols;
        const spacingY = 180;

        const startIndex = this.currentPage * this.cardsPerPage;
        const endIndex = Math.min(startIndex + this.cardsPerPage, this.filteredCards.length);

        for (let i = startIndex; i < endIndex; i++) {
            const card = this.filteredCards[i];
            const gridIndex = i - startIndex;
            const col = gridIndex % cols;
            const row = Math.floor(gridIndex / cols);

            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            const isSelected = i === this.selectedCardIndex;

            this.renderCard(ctx, card, x, y, cardWidth, cardHeight, isSelected);
        }
    }

    // 개별 카드 렌더링
    renderCard(ctx, card, x, y, width, height, isSelected) {
        ctx.save();

        // 선택 표시
        if (isSelected) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
        }

        // 카드 배경
        const elementColor = card.element?.color || '#666';
        ctx.fillStyle = elementColor;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.fill();

        // 카드 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.stroke();

        // 속성 아이콘
        if (card.element?.emoji) {
            ctx.font = '24px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(card.element.emoji, x + width/2, y + 30);
        }

        // 카드 이름
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';

        let name = card.name;
        if (name.length > 8) {
            name = name.substring(0, 7) + '...';
        }
        ctx.fillText(name, x + width/2, y + 55);

        // 카드 타입
        if (card.type?.name) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ddd';
            ctx.fillText(card.type.name, x + width/2, y + 75);
        }

        // 스탯
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`⚔${card.power}`, x + 5, y + height - 25);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#4caf50';
        ctx.fillText(`🎯${card.accuracy}%`, x + width - 5, y + height - 25);

        // 설명 (축약)
        if (card.description) {
            ctx.font = '8px Arial';
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';

            let desc = card.description;
            if (desc.length > 15) {
                desc = desc.substring(0, 14) + '...';
            }
            ctx.fillText(desc, x + width/2, y + height - 8);
        }

        ctx.restore();
    }

    // 페이지네이션 렌더링
    renderPagination(ctx, canvas) {
        const totalPages = this.getTotalPages();
        if (totalPages <= 1) return;

        const y = canvas.height - 60;
        const centerX = canvas.width / 2;

        ctx.save();

        // 페이지 표시
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.currentPage + 1} / ${totalPages}`, centerX, y);

        // 이전/다음 버튼
        ctx.fillStyle = this.currentPage > 0 ? '#ffd700' : '#666';
        ctx.fillText('◀ 이전', centerX - 80, y);

        ctx.fillStyle = this.currentPage < totalPages - 1 ? '#ffd700' : '#666';
        ctx.fillText('다음 ▶', centerX + 80, y);

        ctx.restore();
    }

    // 조작 방법 안내
    renderInstructions(ctx, canvas) {
        const instructions = [
            '방향키: 카드 선택', 'Enter: 상세보기', 'F: 필터', 'ESC: 뒤로가기'
        ];

        ctx.save();
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        const startY = canvas.height - 25;
        const spacing = canvas.width / instructions.length;

        instructions.forEach((instruction, index) => {
            ctx.fillText(instruction, spacing * (index + 0.5), startY);
        });

        ctx.restore();
    }

    // 카드 상세 정보 렌더링
    renderCardDetails(ctx, canvas) {
        if (!this.detailCard) return;

        const modalWidth = 400;
        const modalHeight = 500;
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

        // 카드 상세 내용 렌더링
        this.renderDetailedCard(ctx, this.detailCard, x + 20, y + 20, modalWidth - 40, modalHeight - 40);

        ctx.restore();
    }

    // 상세 카드 정보 렌더링
    renderDetailedCard(ctx, card, x, y, width, height) {
        ctx.save();

        // 카드 이름
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, x + width/2, y + 30);

        // 속성과 타입
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffd700';
        const elementText = card.element?.emoji ? `${card.element.emoji} ${card.element.name || card.element}` : card.element;
        const typeText = card.type?.name || card.type;
        ctx.fillText(`${elementText} | ${typeText}`, x + width/2, y + 60);

        // 스탯
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`⚔ 공격력: ${card.power}`, x + 20, y + 100);

        ctx.fillStyle = '#4caf50';
        ctx.fillText(`🎯 명중률: ${card.accuracy}%`, x + 20, y + 130);

        // 설명
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('📋 설명:', x + 20, y + 170);

        // 설명 텍스트 (여러 줄)
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ccc';
        const lines = this.wrapText(ctx, card.description, width - 40);
        lines.forEach((line, index) => {
            ctx.fillText(line, x + 20, y + 200 + index * 20);
        });

        // 효과 정보 (만약 있다면)
        if (card.effects && card.effects.length > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('⚡ 효과:', x + 20, y + 280);

            ctx.font = '14px Arial';
            ctx.fillStyle = '#8cc8ff';
            card.effects.forEach((effect, index) => {
                ctx.fillText(`• ${effect}`, x + 20, y + 310 + index * 20);
            });
        }

        // 닫기 안내
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESC 또는 Enter로 닫기', x + width/2, y + height - 20);

        ctx.restore();
    }

    // 입력 처리
    handleInput(key) {
        if (this.showDetails) {
            this.handleDetailInput(key);
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
                this.showCardDetails();
                break;
            case 'f':
            case 'F':
                this.toggleFilters();
                break;
            case 'PageUp':
                this.previousPage();
                break;
            case 'PageDown':
                this.nextPage();
                break;
            case 'Escape':
                this.exitGallery();
                break;
        }
    }

    // 상세보기 입력 처리
    handleDetailInput(key) {
        if (key === 'Escape' || key === 'Enter') {
            this.hideCardDetails();
        }
    }

    // 이전 카드 선택
    selectPrevious() {
        if (this.selectedCardIndex > 0) {
            this.selectedCardIndex--;
            this.checkPageNavigation();
        }
    }

    // 다음 카드 선택
    selectNext() {
        if (this.selectedCardIndex < this.filteredCards.length - 1) {
            this.selectedCardIndex++;
            this.checkPageNavigation();
        }
    }

    // 위쪽 카드 선택
    selectUp() {
        const cols = 8;
        const newIndex = this.selectedCardIndex - cols;
        if (newIndex >= 0) {
            this.selectedCardIndex = newIndex;
            this.checkPageNavigation();
        }
    }

    // 아래쪽 카드 선택
    selectDown() {
        const cols = 8;
        const newIndex = this.selectedCardIndex + cols;
        if (newIndex < this.filteredCards.length) {
            this.selectedCardIndex = newIndex;
            this.checkPageNavigation();
        }
    }

    // 페이지 내비게이션 체크
    checkPageNavigation() {
        const targetPage = Math.floor(this.selectedCardIndex / this.cardsPerPage);
        if (targetPage !== this.currentPage) {
            this.currentPage = targetPage;
        }
    }

    // 이전 페이지
    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.selectedCardIndex = this.currentPage * this.cardsPerPage;
        }
    }

    // 다음 페이지
    nextPage() {
        const totalPages = this.getTotalPages();
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.selectedCardIndex = this.currentPage * this.cardsPerPage;
        }
    }

    // 카드 상세보기 표시
    showCardDetails() {
        if (this.filteredCards[this.selectedCardIndex]) {
            this.detailCard = this.filteredCards[this.selectedCardIndex];
            this.showDetails = true;
        }
    }

    // 카드 상세보기 숨기기
    hideCardDetails() {
        this.showDetails = false;
        this.detailCard = null;
    }

    // 필터 토글
    toggleFilters() {
        // 간단한 필터 변경 (실제로는 UI로 구현)
        console.log('🔍 필터 변경');
    }

    // 갤러리 종료
    exitGallery() {
        this.gameManager.switchScreen('menu');
    }

    // 총 페이지 수
    getTotalPages() {
        return Math.ceil(this.filteredCards.length / this.cardsPerPage);
    }

    // 타입 필터 옵션
    getTypeFilters() {
        return [
            { label: '전체', value: 'all' },
            { label: '공격', value: 'attack' },
            { label: '방어', value: 'defense' },
            { label: '버프', value: 'buff' },
            { label: '디버프', value: 'debuff' }
        ];
    }

    // 속성 필터 옵션
    getElementFilters() {
        return [
            { label: '전체', value: 'all' },
            { label: '🔥', value: 'fire' },
            { label: '💧', value: 'water' },
            { label: '⚡', value: 'electric' },
            { label: '☠', value: 'poison' }
        ];
    }

    // 텍스트 줄바꿈
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

    // 애니메이션 업데이트
    updateAnimations() {
        // 스크롤 애니메이션
        const diff = this.targetScrollOffset - this.scrollOffset;
        if (Math.abs(diff) > 0.1) {
            this.scrollOffset += diff * 0.1;
        }
    }

    // 마우스/터치 입력 처리
    handlePointerInput(x, y, canvas) {
        if (this.showDetails) {
            this.hideCardDetails();
            return;
        }

        // 카드 클릭 체크
        const startX = 100;
        const startY = 180;
        const cols = 8;
        const spacingX = (canvas.width - 200) / cols;
        const spacingY = 180;
        const cardWidth = 120;
        const cardHeight = 160;

        const startIndex = this.currentPage * this.cardsPerPage;
        const endIndex = Math.min(startIndex + this.cardsPerPage, this.filteredCards.length);

        for (let i = startIndex; i < endIndex; i++) {
            const gridIndex = i - startIndex;
            const col = gridIndex % cols;
            const row = Math.floor(gridIndex / cols);

            const cardX = startX + col * spacingX;
            const cardY = startY + row * spacingY;

            if (x >= cardX && x <= cardX + cardWidth &&
                y >= cardY && y <= cardY + cardHeight) {
                this.selectedCardIndex = i;
                this.showCardDetails();
                break;
            }
        }
    }

    // 유틸리티 함수들
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

    // 정리
    cleanup() {
        this.cardAnimations.clear();
        console.log('🧹 카드 갤러리 정리 완료');
    }
}

// 전역 객체로 등록
window.CardGallery = CardGallery;