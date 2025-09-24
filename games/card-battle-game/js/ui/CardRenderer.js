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
            isFadingOut = false,
            fadeStartTime = null,
            context = 'default'
        } = options;

        ctx.save();

        // 카드 배경 그리기
        this.drawCardBackground(ctx, card, x, y, width, height, isHighlighted || isNextActive, context);

        // 카드 테두리 그리기
        this.drawCardBorder(ctx, card, x, y, width, height, isSelected, isNextActive, isFadingOut, fadeStartTime);

        // 카드 내용 그리기
        this.drawCardContent(ctx, card, x, y, width, height, context);

        // 속성 라벨 그리기 (카드 내용 위에 오버레이)
        this.drawElementLabel(ctx, card, x, y, width, height);

        ctx.restore();
    }

    // 카드 배경 그리기
    drawCardBackground(ctx, card, x, y, width, height, isActive = false, context = 'default') {
        const elementConfig = GameConfig.elements[card.element];
        let bgColor = elementConfig ? elementConfig.color : '#666';

        // 활성화 상태일 때 색상 조정 (context에 따라 다르게)
        if (isActive) {
            if (context === 'runtime' && !this.style.cardColors.enlargedHighlight) {
                // 확대 카드는 기본 색상 유지 (runtime context인데 enlargedHighlight가 false)
                // bgColor 변경 없음
            } else {
                // 손패 카드는 약간만 밝게
                bgColor = ColorUtils.lighten(bgColor, this.style.cardColors.handHighlightFactor);
            }
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
    drawCardBorder(ctx, card, x, y, width, height, isSelected = false, isActive = false, isFadingOut = false, fadeStartTime = null) {
        if (isActive) {
            // 활성 카드 글로우 효과 (현재 발동중 또는 잔상)
            this.drawActiveCardGlow(ctx, x, y, width, height, isFadingOut, fadeStartTime);
        } else {
            // 일반 테두리
            ctx.strokeStyle = isSelected ? '#f39c12' : this.style.borderColor;
            ctx.lineWidth = this.style.borderWidth;
            this.roundRect(ctx, x, y, width, height, this.style.borderRadius);
            ctx.stroke();
        }
    }

    // 활성 카드 글로우 효과 그리기
    drawActiveCardGlow(ctx, x, y, width, height, isFadingOut = false, fadeStartTime = null) {
        const glowConfig = this.style.activeCardGlow;

        ctx.save();

        // 페이드아웃 강도 계산
        let fadeIntensity = 1;
        if (isFadingOut && fadeStartTime) {
            // 잔상 시작 시간으로부터 경과 시간 계산
            const elapsed = Date.now() - fadeStartTime;
            const progress = Math.min(elapsed / glowConfig.fadeoutDuration, 1);
            fadeIntensity = 1 - progress;
        }

        // 펄스 효과 계산 (잔상일 때는 펄스 없음)
        let pulseIntensity = 1;
        if (!isFadingOut) {
            const time = Date.now();
            const pulseTime = (time % glowConfig.pulseSpeed) / glowConfig.pulseSpeed;
            pulseIntensity = 0.6 + 0.4 * (Math.sin(pulseTime * Math.PI * 2) * 0.5 + 0.5);
        }

        const finalIntensity = pulseIntensity * fadeIntensity;

        // 외부 글로우 (가장 넓고 약함)
        for (let i = glowConfig.glowRadius; i > 0; i -= 2) {
            const opacity = (glowConfig.glowIntensity * finalIntensity * (glowConfig.glowRadius - i)) / glowConfig.glowRadius * 0.15;
            ctx.strokeStyle = `rgba(255, 68, 68, ${opacity})`;
            ctx.lineWidth = 2;
            this.roundRect(ctx, x - i, y - i, width + i * 2, height + i * 2, this.style.borderRadius + i);
            ctx.stroke();
        }

        // 중간 글로우 (보조 색상)
        ctx.strokeStyle = `rgba(255, 102, 102, ${0.6 * finalIntensity})`;
        ctx.lineWidth = 3;
        this.roundRect(ctx, x - 2, y - 2, width + 4, height + 4, this.style.borderRadius + 2);
        ctx.stroke();

        // 내부 테두리 (메인 색상, 가장 강함)
        ctx.strokeStyle = `rgba(255, 68, 68, ${0.9 * finalIntensity})`;
        ctx.lineWidth = glowConfig.borderWidth;
        this.roundRect(ctx, x, y, width, height, this.style.borderRadius);
        ctx.stroke();

        ctx.restore();
    }

    // 카드 내용 그리기
    drawCardContent(ctx, card, x, y, width, height, context = 'default') {
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
        this.drawCardStats(ctx, card, x, y, width, height, statsSize, context);

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

    // 스탯 정보 그리기 (context 기반 동적 표시)
    drawCardStats(ctx, card, x, y, width, height, fontSize, context = 'default') {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';

        const statsY = y + height * this.style.layout.stats.y;
        const leftX = x + 15;
        const centerX = x + width / 2;
        const rightX = x + width - 15;

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
        const alignments = ['left', 'center', 'right'];
        const positions = [leftX, centerX, rightX];

        statConfig.definitions.forEach((def, index) => {
            if (index >= positions.length) return;

            // 조건부 표시 체크
            if (def.showCondition && !def.showCondition(card, context)) {
                return;
            }

            let value = stats[def.key];
            let emoji = def.emoji;

            // 타입별 이모지 오버라이드
            if (def.key === 'power' && typeEmojiConfig.power) {
                emoji = typeEmojiConfig.power;
            } else if (def.key === 'accuracy' && typeEmojiConfig.accuracy) {
                emoji = typeEmojiConfig.accuracy;
            }

            ctx.textAlign = alignments[index];

            // 특별 처리 (상태이상 카드 턴 표시)
            if (def.key === 'power' && card.type === 'status' && card.activationCount > 1) {
                this.drawTextWithOutline(ctx, `${emoji}${card.activationCount}턴`, positions[index], statsY);
            } else {
                // 포맷팅 적용
                const formattedValue = def.format ? def.format(value, card) : value;
                this.drawTextWithOutline(ctx, `${emoji}${formattedValue}`, positions[index], statsY);
            }
        });
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

        // 카드 크기에 따른 maxLines 동적 조정
        let maxLines = 3;
        if (width >= 360) { // victoryDetail 크기
            maxLines = 8;
        } else if (width >= 240) { // preview/victory 크기
            maxLines = 5;
        } else if (width >= 150) { // victory 크기
            maxLines = 4;
        }

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

        // 속성명 가져오기 (안전한 다국어 지원)
        let elementName = elementConfig.name || card.element;

        // 언어별 속성명 매핑 (안전한 방식)
        const langSelect = document.getElementById('languageSelect');
        const currentLang = langSelect ? langSelect.value : 'ko';

        const elementNames = {
            ko: { fire: '불', water: '물', electric: '전기', poison: '독', normal: '노멀', special: '특수' },
            en: { fire: 'Fire', water: 'Water', electric: 'Electric', poison: 'Poison', normal: 'Normal', special: 'Special' },
            ja: { fire: '火', water: '水', electric: '電기', poison: '毒', normal: 'ノーマル', special: '特別' }
        };

        if (elementNames[currentLang] && elementNames[currentLang][card.element]) {
            elementName = elementNames[currentLang][card.element];
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