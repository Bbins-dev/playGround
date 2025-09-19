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
            bgColor = ColorUtils.lighten(bgColor, 0.3);
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

        // 카드 종류 이모지
        this.drawTypeEmoji(ctx, card, centerX, emojiY, emojiSize);

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

    // 카드 종류 이모지 그리기
    drawTypeEmoji(ctx, card, x, y, fontSize) {
        const typeConfig = GameConfig.cardTypes[card.type];
        if (!typeConfig?.emoji) return;

        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.drawTextWithOutline(ctx, typeConfig.emoji, x, y);
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

        const leftX = x + 15;
        const centerX = x + width / 2;
        const rightX = x + width - 15;
        const statsY = y + height * this.style.layout.stats.y;

        // 카드 타입별 이모티콘 가져오기
        const cardType = GameConfig.cardTypes[card.type] || GameConfig.cardTypes.attack;
        const powerEmoji = cardType.statEmojis ? cardType.statEmojis.power : '💪';
        const accuracyEmoji = cardType.statEmojis ? cardType.statEmojis.accuracy : '🎯';

        // 주 스탯 (좌측) - 타입별 처리
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        if (card.type === 'status' && card.power === 0) {
            // 상태이상 카드에서 주 스탯이 없는 경우 (도발 등)
            // 주 스탯 표시 안 함
        } else if (card.type === 'status' && card.activationCount > 1) {
            // 상태이상 카드에서 턴 기반인 경우
            this.drawTextWithOutline(ctx, `${powerEmoji}${card.activationCount}턴`, leftX, statsY);
        } else {
            // 일반적인 경우 (공격력, 방어력, 버프/디버프 수치)
            this.drawTextWithOutline(ctx, `${powerEmoji}${card.power}`, leftX, statsY);
        }

        // 발동횟수 (중앙)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        const activationCount = card.getDisplayActivationCount ? card.getDisplayActivationCount() : card.activationCount;
        this.drawTextWithOutline(ctx, `🔄${activationCount}`, centerX, statsY);

        // 발동률 (우측)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        this.drawTextWithOutline(ctx, `${accuracyEmoji}${card.accuracy}%`, rightX, statsY);
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

        const maxWidth = width * 0.85;
        const lineHeight = fontSize * 1.2;
        const maxLines = 3;
        const startY = y + height * this.style.layout.description.y;

        const lines = this.wrapText(ctx, description, maxWidth);
        let displayLines = lines.slice(0, maxLines);

        // 텍스트가 잘렸을 때 말줄임표 추가
        if (lines.length > maxLines) {
            const lastLine = displayLines[maxLines - 1];
            const ellipsis = '...';

            // 마지막 줄에 말줄임표를 추가할 공간이 있는지 확인
            const testText = lastLine + ellipsis;
            if (ctx.measureText(testText).width <= maxWidth) {
                displayLines[maxLines - 1] = testText;
            } else {
                // 공간이 없으면 텍스트를 줄이고 말줄임표 추가
                let trimmedLine = lastLine;
                while (ctx.measureText(trimmedLine + ellipsis).width > maxWidth && trimmedLine.length > 0) {
                    trimmedLine = trimmedLine.slice(0, -1);
                }
                displayLines[maxLines - 1] = trimmedLine + ellipsis;
            }
        }

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

    // 외곽선이 있는 텍스트 그리기 - TextRenderer 사용
    drawTextWithOutline(ctx, text, x, y) {
        const fillColor = ctx.fillStyle;
        const outlineColor = this.style.textOutline.color;
        const outlineWidth = this.style.textOutline.width * 3; // Canvas에서만 3배 두껍게

        TextRenderer.drawTextWithOutline(ctx, text, x, y, fillColor, outlineColor, outlineWidth);
    }

    // 텍스트 줄바꿈 처리 (다국어 지원)
    wrapText(ctx, text, maxWidth) {
        // 일본어/중국어 문자 포함 여부 체크
        const hasAsianChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);

        if (hasAsianChars) {
            // 아시아 언어의 경우 문자 단위로 줄바꿈
            return this.wrapAsianText(ctx, text, maxWidth);
        } else {
            // 영어/기타 언어는 단어 단위로 줄바꿈
            return this.wrapWesternText(ctx, text, maxWidth);
        }
    }

    // 서구 언어 텍스트 줄바꿈 (기존 방식)
    wrapWesternText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;

                // 단어가 너무 긴 경우 강제 줄바꿈
                if (ctx.measureText(currentLine).width > maxWidth) {
                    const brokenWord = this.breakLongWord(ctx, currentLine, maxWidth);
                    lines.push(...brokenWord.slice(0, -1));
                    currentLine = brokenWord[brokenWord.length - 1];
                }
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // 아시아 언어 텍스트 줄바꿈 (문자 단위)
    wrapAsianText(ctx, text, maxWidth) {
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // 긴 단어 강제 줄바꿈
    breakLongWord(ctx, word, maxWidth) {
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
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
        const backgroundColor = ColorUtils.darken(elementConfig.color, config.darkenFactor);

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

    // 색상 조작 메서드들은 ColorUtils로 대체됨
}

// 전역 객체로 등록
window.CardRenderer = CardRenderer;