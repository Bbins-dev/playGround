// 통일된 카드 렌더링 시스템 - 모든 카드 표시를 일관되게 처리

class CardRenderer {
    constructor() {
        this.style = GameConfig.cardStyle;
    }

    // 메인 카드 렌더링 메서드
    renderCard(ctx, card, x, y, width, height, options = {}) {
        const {
            isSelected = false,
            isHighlighted = false,
            isNextActive = false,
            opacity = 1
        } = options;

        ctx.save();
        ctx.globalAlpha = opacity;

        // 카드 배경 그리기
        this.drawCardBackground(ctx, card, x, y, width, height, isHighlighted || isNextActive);

        // 카드 테두리 그리기
        this.drawCardBorder(ctx, card, x, y, width, height, isSelected, isNextActive);

        // 카드 내용 그리기
        this.drawCardContent(ctx, card, x, y, width, height);

        // 속성 라벨 그리기 (카드 내용 위에 오버레이)
        this.drawElementLabel(ctx, card, x, y, width, height);

        ctx.restore();
    }

    // 카드 배경 그리기
    drawCardBackground(ctx, card, x, y, width, height, isActive = false) {
        const elementConfig = GameConfig.elements[card.element];
        let bgColor = elementConfig ? elementConfig.color : '#666';

        // 활성화 상태일 때 밝게
        if (isActive) {
            bgColor = this.lightenColor(bgColor, 0.3);
        }

        // 카드 배경
        ctx.fillStyle = bgColor;
        this.roundRect(ctx, x, y, width, height, this.style.borderRadius);
        ctx.fill();

        // 그라데이션 오버레이 (갤러리 스타일과 동일)
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

        ctx.fillStyle = gradient;
        this.roundRect(ctx, x, y, width, height, this.style.borderRadius);
        ctx.fill();
    }

    // 카드 테두리 그리기
    drawCardBorder(ctx, card, x, y, width, height, isSelected = false, isActive = false) {
        ctx.strokeStyle = isActive ? '#ffd700' : (isSelected ? '#f39c12' : this.style.borderColor);
        ctx.lineWidth = isActive ? 3 : this.style.borderWidth;
        this.roundRect(ctx, x, y, width, height, this.style.borderRadius);
        ctx.stroke();
    }

    // 카드 내용 그리기
    drawCardContent(ctx, card, x, y, width, height) {
        // 폰트 크기 계산
        const emojiSize = Math.floor(height * this.style.fontRatio.emoji);
        const nameSize = Math.floor(height * this.style.fontRatio.name);
        const typeSize = Math.floor(height * this.style.fontRatio.type);
        const statsSize = Math.floor(height * this.style.fontRatio.stats);
        const descSize = Math.floor(height * this.style.fontRatio.description);

        // 위치 계산
        const centerX = x + width / 2;
        const emojiY = y + height * this.style.layout.emoji.y;
        const nameY = y + height * this.style.layout.name.y;
        const typeY = y + height * this.style.layout.type.y;
        const statsY = y + height * this.style.layout.stats.y;
        const descY = y + height * this.style.layout.description.y;

        // 속성 이모지
        this.drawElementEmoji(ctx, card, centerX, emojiY, emojiSize);

        // 카드 이름
        this.drawCardName(ctx, card, centerX, nameY, nameSize, width);

        // 카드 타입
        this.drawCardType(ctx, card, centerX, typeY, typeSize);

        // 스탯 정보
        this.drawCardStats(ctx, card, x, y, width, height, statsSize);

        // 카드 설명 (손패, 선택화면, 확대화면에서 표시)
        if (width >= 100) {
            this.drawCardDescription(ctx, card, x, y, width, height, descSize);
        }

    }

    // 속성 이모지 그리기
    drawElementEmoji(ctx, card, x, y, fontSize) {
        const elementConfig = GameConfig.elements[card.element];
        if (!elementConfig?.emoji) return;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.drawTextWithOutline(ctx, elementConfig.emoji, x, y);
    }

    // 카드 이름 그리기 (개선된 동적 크기 조절)
    drawCardName(ctx, card, x, y, fontSize, width) {
        let name;
        if (card.getDisplayName) {
            name = card.getDisplayName();
        } else if (card.name) {
            name = card.name;
        } else if (card.nameKey && typeof getI18nText === 'function') {
            name = getI18nText(card.nameKey);
        }
        if (!name) return;

        const config = this.style.cardName;
        const maxWidth = width * config.maxWidthRatio;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';

        if (config.dynamicSizing) {
            // 동적 폰트 크기 조절
            let adjustedFontSize = fontSize;
            let lines = [];

            // 먼저 기본 폰트 크기로 시도
            ctx.font = `bold ${adjustedFontSize}px Arial`;

            // 텍스트가 한 줄에 들어가는지 확인
            if (ctx.measureText(name).width <= maxWidth) {
                // 한 줄에 들어감
                lines = [name];
            } else {
                // 두 줄로 나누어야 함
                const words = name.split(' ');
                if (words.length > 1) {
                    // 단어별로 나누기 시도
                    const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                    const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');
                    lines = [firstLine, secondLine];
                } else {
                    // 긴 단어를 강제로 나누기
                    const mid = Math.ceil(name.length / 2);
                    lines = [name.substring(0, mid), name.substring(mid)];
                }

                // 두 줄 모두 너비에 맞는지 확인하고 폰트 크기 조절
                const maxLineWidth = Math.max(
                    ctx.measureText(lines[0]).width,
                    ctx.measureText(lines[1]).width
                );

                if (maxLineWidth > maxWidth) {
                    // 폰트 크기를 줄여야 함
                    const minFontSize = width * config.minFontRatio;
                    const scaleFactor = maxWidth / maxLineWidth;
                    adjustedFontSize = Math.max(minFontSize, adjustedFontSize * scaleFactor);
                    ctx.font = `bold ${adjustedFontSize}px Arial`;
                }
            }

            // 텍스트 그리기
            if (lines.length === 1) {
                this.drawTextWithOutline(ctx, lines[0], x, y);
            } else {
                // 두 줄로 그리기
                const lineHeight = adjustedFontSize * config.lineSpacing;
                const startY = y - lineHeight / 2;

                lines.forEach((line, index) => {
                    const lineY = startY + index * lineHeight;
                    this.drawTextWithOutline(ctx, line, x, lineY);
                });
            }
        } else {
            // 기존 방식 (줄임표 사용)
            let displayName = name;
            if (ctx.measureText(displayName).width > maxWidth) {
                while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }

            ctx.font = `bold ${fontSize}px Arial`;
            this.drawTextWithOutline(ctx, displayName, x, y);
        }
    }

    // 카드 타입 그리기
    drawCardType(ctx, card, x, y, fontSize) {
        const typeConfig = GameConfig.cardTypes[card.type];
        if (!typeConfig) return;

        // i18n 적용
        const typeName = typeConfig?.nameKey && typeof getI18nText === 'function'
            ? getI18nText(typeConfig.nameKey) || typeConfig.name
            : typeConfig?.name || card.type;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.drawTextWithOutline(ctx, typeName, x, y);
    }

    // 스탯 정보 그리기
    drawCardStats(ctx, card, x, y, width, height, fontSize) {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textBaseline = 'middle';

        const leftX = x + 10;
        const centerX = x + width / 2;
        const rightX = x + width - 10;
        const statsY = y + height * this.style.layout.stats.y;

        // 공격력 (좌측)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        this.drawTextWithOutline(ctx, `💪${card.power}`, leftX, statsY);

        // 발동횟수 (중앙)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        const activationCount = card.getDisplayActivationCount ? card.getDisplayActivationCount() : card.activationCount;
        this.drawTextWithOutline(ctx, `🔄${activationCount}`, centerX, statsY);

        // 명중률 (우측)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        this.drawTextWithOutline(ctx, `🎯${card.accuracy}%`, rightX, statsY);
    }

    // 카드 설명 그리기
    drawCardDescription(ctx, card, x, y, width, height, fontSize) {
        let description;
        if (card.getDisplayDescription) {
            description = card.getDisplayDescription();
        } else if (card.description) {
            description = card.description;
        } else if (card.descriptionKey && typeof getI18nText === 'function') {
            description = getI18nText(card.descriptionKey);
        }
        if (!description) return;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const maxWidth = width - 20;
        const lineHeight = fontSize * 1.2;
        const maxLines = 3;
        const startY = y + height * this.style.layout.description.y;

        const lines = this.wrapText(ctx, description, maxWidth);
        const displayLines = lines.slice(0, maxLines);

        displayLines.forEach((line, index) => {
            const lineY = startY + index * lineHeight;
            this.drawTextWithOutline(ctx, line, x + width / 2, lineY);
        });
    }

    // 카드 비용 그리기
    drawCardCost(ctx, card, x, y, fontSize) {
        if (!card.cost && card.cost !== 0) return;

        // 원형 배경
        ctx.fillStyle = 'rgba(241, 196, 15, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();

        // 비용 숫자
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.cost.toString(), x, y);
    }

    // 외곽선이 있는 텍스트 그리기
    drawTextWithOutline(ctx, text, x, y) {
        // fillStyle 색상 백업
        const originalFillStyle = ctx.fillStyle;

        if (this.style.textOutline.enabled) {
            // 외곽선 (Canvas에서만 3배 두껍게)
            ctx.strokeStyle = this.style.textOutline.color;
            ctx.lineWidth = this.style.textOutline.width * 3;
            ctx.strokeText(text, x, y);
        }

        // 메인 텍스트 (색상 복원)
        ctx.fillStyle = originalFillStyle;
        ctx.fillText(text, x, y);
    }

    // 텍스트 줄바꿈 처리
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
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

    // 둥근 사각형 그리기
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

    // 속성 라벨 그리기
    drawElementLabel(ctx, card, x, y, width, height) {
        const elementConfig = GameConfig.elements[card.element];
        if (!elementConfig) return;

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
        ctx.font = `bold ${fontSize}px Arial`;

        // 텍스트 크기 측정
        const textMetrics = ctx.measureText(elementName);
        const textWidth = textMetrics.width;

        // 라벨 크기 계산
        const labelWidth = textWidth + config.padding.x * 2;
        const labelHeight = fontSize + config.padding.y * 2;

        // 라벨 위치 계산 (카드 좌상단)
        const labelX = x + width * config.position.x;
        const labelY = y + height * config.position.y;

        // 배경색 계산 (속성색을 어둡게)
        const backgroundColor = this.darkenColor(elementConfig.color, config.darkenFactor);

        ctx.save();

        // 라벨 배경 그리기
        ctx.fillStyle = backgroundColor;
        ctx.globalAlpha = config.backgroundOpacity;
        this.roundRect(ctx, labelX, labelY, labelWidth, labelHeight, config.borderRadius);
        ctx.fill();

        // 텍스트 그리기
        ctx.globalAlpha = 1;
        ctx.fillStyle = config.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = labelX + labelWidth / 2;
        const textY = labelY + labelHeight / 2;

        if (config.textOutline.enabled) {
            // 외곽선
            ctx.strokeStyle = config.textOutline.color;
            ctx.lineWidth = config.textOutline.width;
            ctx.strokeText(elementName, textX, textY);
        }

        // 메인 텍스트
        ctx.fillText(elementName, textX, textY);

        ctx.restore();
    }

    // 색상 어둡게 하기
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

    // 색상 밝게 하기
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
window.CardRenderer = CardRenderer;