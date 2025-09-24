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
            opacity = 1,
            context = 'default'
        } = options;

        const cardElement = document.createElement('div');
        cardElement.className = 'dom-card';

        // 카드 기본 스타일
        this.applyCardStyles(cardElement, card, width, height, isSelected, isHighlighted || isNextActive, opacity);

        // 카드 내용 생성
        const content = this.createCardContent(card, width, height, context);
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
    createCardContent(card, width, height, context = 'default') {
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

        // 카드 종류 이모지
        content.appendChild(this.createTypeEmoji(card, emojiSize, height));

        // 카드 이름
        content.appendChild(this.createCardName(card, nameSize, height, width));

        // 카드 타입
        content.appendChild(this.createCardType(card, typeSize, height));

        // 스탯 정보
        content.appendChild(this.createCardStats(card, width, height, statsSize, context));

        // 카드 설명 (일정 크기 이상일 때만)
        if (width >= 100) {
            content.appendChild(this.createCardDescription(card, width, height, descSize));
        }

        // 속성 라벨 (오버레이로 추가)
        content.appendChild(this.createElementLabel(card, width, height));

        return content;
    }

    // 카드 종류 이모지 (CardRenderer.drawTypeEmoji와 동일)
    createTypeEmoji(card, fontSize, cardHeight) {
        const typeConfig = GameConfig.cardTypes[card.type];
        if (!typeConfig?.emoji) return document.createTextNode('');

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
        emoji.textContent = typeConfig.emoji;

        return emoji;
    }

    // 카드 이름 (개선된 동적 크기 조절)
    createCardName(card, fontSize, cardHeight, cardWidth) {
        let name;
        if (card.getDisplayName) {
            name = card.getDisplayName();
        } else if (card.name) {
            name = card.name;
        } else if (card.nameKey && typeof getI18nText === 'function') {
            name = getI18nText(card.nameKey);
        }
        if (!name) return document.createTextNode('');

        const config = this.style.cardName;
        const y = cardHeight * this.style.layout.name.y;

        const nameElement = document.createElement('div');

        if (config.dynamicSizing) {
            // 동적 크기 조절 (간단한 버전)
            let adjustedFontSize = fontSize;
            let lines = [];

            // 긴 이름을 두 줄로 나누기
            const maxLength = Math.ceil(cardWidth / (fontSize * 0.6)); // 대략적인 계산
            if (name.length > maxLength) {
                const words = name.split(' ');
                if (words.length > 1) {
                    // 단어별로 나누기
                    const mid = Math.ceil(words.length / 2);
                    lines = [
                        words.slice(0, mid).join(' '),
                        words.slice(mid).join(' ')
                    ];
                } else {
                    // 긴 단어를 강제로 나누기
                    const mid = Math.ceil(name.length / 2);
                    lines = [name.substring(0, mid), name.substring(mid)];
                }

                // 폰트 크기 조절
                adjustedFontSize = Math.max(
                    cardHeight * config.minFontRatio,
                    fontSize * 0.9 // 약간 줄임
                );
            } else {
                lines = [name];
            }

            nameElement.style.cssText = `
                position: absolute;
                left: 50%;
                top: ${y}px;
                transform: translate(-50%, -50%);
                font-size: ${adjustedFontSize}px;
                font-family: Arial;
                font-weight: bold;
                text-align: center;
                line-height: ${config.lineSpacing};
                width: ${cardWidth * config.maxWidthRatio}px;
                ${this.getTextOutlineStyle()}
            `;

            nameElement.innerHTML = lines.join('<br>');
        } else {
            // 기존 방식 (줄임표)
            let displayName = name;
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
        }

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

    // 스탯 정보 (context 기반 동적 표시)
    createCardStats(card, width, height, fontSize, context = 'default') {
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
            align-items: center;
            padding: 0 15px;
            font-size: ${fontSize}px;
            font-family: Arial;
            font-weight: bold;
        `;

        // 카드의 현재 스탯 가져오기 (context에 따라 다름)
        const stats = card.getDisplayStats ? card.getDisplayStats(context) : {
            power: card.power,
            accuracy: card.accuracy,
            activation: card.activationCount
        };

        // GameConfig에서 스탯 표시 설정 가져오기
        const statConfig = GameConfig.statDisplay;
        const typeEmojiConfig = statConfig.typeStatEmojis[card.type] || statConfig.typeStatEmojis.attack;

        // 스탯 정의에 따라 동적으로 스탯 표시
        statConfig.definitions.forEach((def, index) => {
            const element = document.createElement('span');
            element.style.cssText = `
                color: #fff;
                ${this.getTextOutlineStyle()}
            `;

            let value = stats[def.key];
            let emoji = def.emoji;

            // 타입별 이모지 오버라이드
            if (def.key === 'power' && typeEmojiConfig.power) {
                emoji = typeEmojiConfig.power;
            } else if (def.key === 'accuracy' && typeEmojiConfig.accuracy) {
                emoji = typeEmojiConfig.accuracy;
            }

            // 조건부 표시 체크
            if (def.showCondition && !def.showCondition(card, context)) {
                element.style.display = 'none';
                statsContainer.appendChild(element);
                return;
            }

            // 특별 처리 (상태이상 카드 턴 표시)
            if (def.key === 'power' && card.type === 'status' && card.activationCount > 1) {
                element.textContent = `${emoji}${card.activationCount}턴`;
            } else {
                // 포맷팅 적용
                const formattedValue = def.format ? def.format(value, card) : value;
                element.textContent = `${emoji}${formattedValue}`;
            }

            statsContainer.appendChild(element);
        });

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

    // 텍스트 외곽선 스타일 - TextRenderer 사용
    getTextOutlineStyle() {
        if (!this.style.textOutline.enabled) {
            return 'color: #fff;';
        }

        return `
            color: #fff;
            ${TextRenderer.getTextOutlineStyle(this.style.textOutline.width, this.style.textOutline.color)}
        `;
    }

    // 속성 라벨 생성 (CardRenderer.drawElementLabel과 동일)
    createElementLabel(card, width, height) {
        const elementConfig = GameConfig.elements[card.element];
        if (!elementConfig) return document.createTextNode('');

        const config = this.style.elementLabel;

        // 속성명 가져오기 (간단한 다국어 지원)
        let elementName = elementConfig.name || card.element;

        // 현재 언어가 영어인 경우 영어 속성명 사용
        const langSelect = document.getElementById('languageSelect');
        if (langSelect && langSelect.value === 'en') {
            const englishNames = {
                'fire': 'Fire',
                'water': 'Water',
                'electric': 'Electric',
                'poison': 'Poison',
                'normal': 'Normal'
            };
            elementName = englishNames[card.element] || elementName;
        } else if (langSelect && langSelect.value === 'ja') {
            const japaneseNames = {
                'fire': '火',
                'water': '水',
                'electric': '電気',
                'poison': '毒',
                'normal': 'ノーマル'
            };
            elementName = japaneseNames[card.element] || elementName;
        }

        // 폰트 크기 계산
        const fontSize = Math.floor(height * config.fontSize);

        // 배경색 계산 (속성색을 어둡게)
        const backgroundColor = this.darkenColor(elementConfig.color, config.darkenFactor);

        // 라벨 위치 계산 (카드 좌상단)
        const labelX = width * config.position.x;
        const labelY = height * config.position.y;

        const labelElement = document.createElement('div');
        labelElement.style.cssText = `
            position: absolute;
            left: ${labelX}px;
            top: ${labelY}px;
            background-color: ${backgroundColor};
            opacity: ${config.backgroundOpacity};
            padding: ${config.padding.y}px ${config.padding.x}px;
            border-radius: ${config.borderRadius}px;
            font-size: ${fontSize}px;
            font-family: Arial;
            font-weight: bold;
            color: ${config.textColor};
            text-align: center;
            white-space: nowrap;
            z-index: 10;
            ${config.textOutline.enabled ? `
                text-shadow:
                    -${config.textOutline.width}px -${config.textOutline.width}px 0 ${config.textOutline.color},
                    ${config.textOutline.width}px -${config.textOutline.width}px 0 ${config.textOutline.color},
                    -${config.textOutline.width}px ${config.textOutline.width}px 0 ${config.textOutline.color},
                    ${config.textOutline.width}px ${config.textOutline.width}px 0 ${config.textOutline.color};
            ` : ''}
        `;
        labelElement.textContent = elementName;

        return labelElement;
    }

    // 색상 어둡게 하기 (CardRenderer.darkenColor와 동일)
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);

            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));

            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
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