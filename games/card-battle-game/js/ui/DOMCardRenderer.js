// DOM 기반 카드 렌더러 - CardRenderer와 완전히 동일한 시각적 스타일을 DOM으로 구현

class DOMCardRenderer {
    constructor() {
        this.style = GameConfig.cardStyle;
    }

    // 메인 카드 DOM 요소 생성
    createCard(card, width, height, options = {}) {
        const {
            isSelected = false,
            isHighlighted = false,
            isNextActive = false,
            opacity = 1
        } = options;

        const cardElement = document.createElement('div');
        cardElement.className = 'dom-card';

        // 카드 기본 스타일
        this.applyCardStyles(cardElement, card, width, height, isSelected, isHighlighted || isNextActive, opacity);

        // 카드 내용 생성
        const content = this.createCardContent(card, width, height);
        cardElement.appendChild(content);

        return cardElement;
    }

    // 카드 기본 스타일 적용 (CardRenderer.drawCardBackground + drawCardBorder와 동일)
    applyCardStyles(element, card, width, height, isSelected, isActive, opacity) {
        const elementConfig = GameConfig.elements[card.element];
        let bgColor = elementConfig ? elementConfig.color : '#666';

        // 활성화 상태일 때 밝게 (CardRenderer.lightenColor와 동일 로직)
        if (isActive) {
            bgColor = this.lightenColor(bgColor, 0.3);
        }

        // CardRenderer의 roundRect + gradient와 동일한 스타일
        element.style.cssText = `
            position: relative;
            width: ${width}px;
            height: ${height}px;
            background: ${bgColor};
            border-radius: ${this.style.borderRadius}px;
            border: ${isActive ? 3 : this.style.borderWidth}px solid ${isActive ? '#ffd700' : (isSelected ? '#f39c12' : this.style.borderColor)};
            opacity: ${opacity};
            overflow: hidden;
            box-sizing: border-box;
        `;

        // 그라데이션 오버레이 (CardRenderer와 동일)
        const gradientOverlay = document.createElement('div');
        gradientOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%);
            border-radius: ${this.style.borderRadius}px;
            pointer-events: none;
        `;
        element.appendChild(gradientOverlay);
    }

    // 카드 내용 생성 (CardRenderer.drawCardContent와 동일)
    createCardContent(card, width, height) {
        const content = document.createElement('div');
        content.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            z-index: 1;
        `;

        // 폰트 크기 계산 (CardRenderer와 동일)
        const emojiSize = Math.floor(height * this.style.fontRatio.emoji);
        const nameSize = Math.floor(height * this.style.fontRatio.name);
        const typeSize = Math.floor(height * this.style.fontRatio.type);
        const statsSize = Math.floor(height * this.style.fontRatio.stats);
        const descSize = Math.floor(height * this.style.fontRatio.description);

        // 속성 이모지
        content.appendChild(this.createElementEmoji(card, emojiSize, height));

        // 카드 이름
        content.appendChild(this.createCardName(card, nameSize, height));

        // 카드 타입
        content.appendChild(this.createCardType(card, typeSize, height));

        // 스탯 정보
        content.appendChild(this.createCardStats(card, width, height, statsSize));

        // 카드 설명 (일정 크기 이상일 때만)
        if (width >= 100) {
            content.appendChild(this.createCardDescription(card, width, height, descSize));
        }

        // 카드 비용 (우상단)
        content.appendChild(this.createCardCost(card, height));

        return content;
    }

    // 속성 이모지 (CardRenderer.drawElementEmoji와 동일)
    createElementEmoji(card, fontSize, cardHeight) {
        const elementConfig = GameConfig.elements[card.element];
        if (!elementConfig?.emoji) return document.createTextNode('');

        const emoji = document.createElement('div');
        const y = cardHeight * this.style.layout.emoji.y;

        emoji.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: ${fontSize}px;
            font-family: Arial;
            text-align: center;
            ${this.getTextOutlineStyle()}
        `;
        emoji.textContent = elementConfig.emoji;

        return emoji;
    }

    // 카드 이름 (CardRenderer.drawCardName과 동일)
    createCardName(card, fontSize, cardHeight) {
        const name = card.getDisplayName ? card.getDisplayName() : card.name;
        if (!name) return document.createTextNode('');

        const nameElement = document.createElement('div');
        const y = cardHeight * this.style.layout.name.y;

        // 이름이 너무 길면 줄임 (CardRenderer와 동일 로직)
        let displayName = name;
        const maxWidth = 120;
        // DOM에서는 정확한 측정이 어려우므로 글자 수로 대략 계산
        if (displayName.length > 8) {
            displayName = displayName.substring(0, 8) + '...';
        }

        nameElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: ${fontSize}px;
            font-family: Arial;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
            ${this.getTextOutlineStyle()}
        `;
        nameElement.textContent = displayName;

        return nameElement;
    }

    // 카드 타입 (CardRenderer.drawCardType과 동일)
    createCardType(card, fontSize, cardHeight) {
        const typeConfig = GameConfig.cardTypes[card.type];
        if (!typeConfig) return document.createTextNode('');

        // i18n 적용 (CardRenderer와 동일 로직)
        const typeName = typeConfig?.nameKey && typeof getI18nText === 'function'
            ? getI18nText(typeConfig.nameKey) || typeConfig.name
            : typeConfig?.name || card.type;

        const typeElement = document.createElement('div');
        const y = cardHeight * this.style.layout.type.y;

        typeElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: ${fontSize}px;
            font-family: Arial;
            text-align: center;
            white-space: nowrap;
            ${this.getTextOutlineStyle()}
        `;
        typeElement.textContent = typeName;

        return typeElement;
    }

    // 스탯 정보 (CardRenderer.drawCardStats와 동일)
    createCardStats(card, width, height, fontSize) {
        const statsContainer = document.createElement('div');
        const y = height * this.style.layout.stats.y;

        statsContainer.style.cssText = `
            position: absolute;
            left: 0;
            top: ${y}px;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
            font-size: ${fontSize}px;
            font-family: Arial;
            font-weight: bold;
        `;

        // 공격력 (좌측)
        const powerElement = document.createElement('span');
        powerElement.style.cssText = `
            color: #ffeb3b;
            ${this.getTextOutlineStyle()}
        `;
        powerElement.textContent = `⚔${card.power}`;

        // 명중률 (우측)
        const accuracyElement = document.createElement('span');
        accuracyElement.style.cssText = `
            color: #4caf50;
            ${this.getTextOutlineStyle()}
        `;
        accuracyElement.textContent = `🎯${card.accuracy}%`;

        statsContainer.appendChild(powerElement);
        statsContainer.appendChild(accuracyElement);

        return statsContainer;
    }

    // 카드 설명 (CardRenderer.drawCardDescription과 동일)
    createCardDescription(card, width, height, fontSize) {
        const description = card.getDisplayDescription ? card.getDisplayDescription() : card.description;
        if (!description) return document.createTextNode('');

        const descElement = document.createElement('div');
        const y = height * this.style.layout.description.y;

        descElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${y}px;
            transform: translateX(-50%);
            width: ${width - 20}px;
            font-size: ${fontSize}px;
            font-family: Arial;
            text-align: center;
            line-height: ${fontSize * 1.2}px;
            max-height: ${fontSize * 1.2 * 3}px;
            overflow: hidden;
            ${this.getTextOutlineStyle()}
        `;
        descElement.textContent = description;

        return descElement;
    }

    // 카드 비용 (CardRenderer.drawCardCost와 동일)
    createCardCost(card, cardHeight) {
        if (!card.cost && card.cost !== 0) return document.createTextNode('');

        const costElement = document.createElement('div');
        const fontSize = Math.floor(cardHeight * 0.08);

        costElement.style.cssText = `
            position: absolute;
            top: 18px;
            right: 18px;
            width: 18px;
            height: 18px;
            background: rgba(241, 196, 15, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${fontSize}px;
            font-family: Arial;
            font-weight: bold;
            color: #2c3e50;
        `;
        costElement.textContent = card.cost.toString();

        return costElement;
    }

    // 텍스트 외곽선 스타일 (CardRenderer.drawTextWithOutline과 동일)
    getTextOutlineStyle() {
        if (!this.style.textOutline.enabled) {
            return 'color: #fff;';
        }

        return `
            color: #fff;
            text-shadow:
                -${this.style.textOutline.width}px -${this.style.textOutline.width}px 0 ${this.style.textOutline.color},
                ${this.style.textOutline.width}px -${this.style.textOutline.width}px 0 ${this.style.textOutline.color},
                -${this.style.textOutline.width}px ${this.style.textOutline.width}px 0 ${this.style.textOutline.color},
                ${this.style.textOutline.width}px ${this.style.textOutline.width}px 0 ${this.style.textOutline.color};
        `;
    }

    // 색상 밝게 하기 (CardRenderer.lightenColor와 동일)
    lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);

            const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
            const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
            const newB = Math.min(255, Math.floor(b + (255 - b) * factor));

            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
}

// 전역 객체로 등록
window.DOMCardRenderer = DOMCardRenderer;