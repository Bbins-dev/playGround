// 텍스트 렌더링 통합 유틸리티
class TextRenderer {
    // 아웃라인이 있는 텍스트 그리기 (모든 중복 제거)
    static drawTextWithOutline(ctx, text, x, y, fillColor = '#FFFFFF', outlineColor = '#000000', outlineWidth = 2) {
        ctx.save();

        // 아웃라인 그리기
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        // 텍스트 채우기
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);

        ctx.restore();
    }

    // 텍스트 크기 측정
    static measureText(ctx, text, fontSize, fontFamily = 'Arial') {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        ctx.restore();
        return {
            width: metrics.width,
            height: fontSize * 1.2 // 근사치
        };
    }

    // 중앙 정렬 텍스트 그리기
    static drawCenteredText(ctx, text, centerX, y, fontSize, fontFamily = 'Arial', fillColor = '#FFFFFF', outlineColor = '#000000', outlineWidth = 2) {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.drawTextWithOutline(ctx, text, centerX, y, fillColor, outlineColor, outlineWidth);

        ctx.restore();
    }

    // 텍스트 줄바꿈 처리
    static wrapText(ctx, text, maxWidth, fontSize, fontFamily = 'Arial') {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;

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

        ctx.restore();
        return lines;
    }

    // 다중 라인 텍스트 그리기
    static drawMultiLineText(ctx, lines, x, y, lineHeight, fontSize, fontFamily = 'Arial', fillColor = '#FFFFFF', outlineColor = '#000000', outlineWidth = 2, alignment = 'left') {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = alignment;
        ctx.textBaseline = 'top';

        lines.forEach((line, index) => {
            const currentY = y + (index * lineHeight);
            this.drawTextWithOutline(ctx, line, x, currentY, fillColor, outlineColor, outlineWidth);
        });

        ctx.restore();
    }

    // 텍스트가 영역에 맞도록 크기 조정
    static fitTextToBox(ctx, text, maxWidth, maxHeight, initialFontSize, fontFamily = 'Arial') {
        let fontSize = initialFontSize;
        let textMetrics;

        do {
            ctx.save();
            ctx.font = `${fontSize}px ${fontFamily}`;
            textMetrics = ctx.measureText(text);
            ctx.restore();

            if (textMetrics.width <= maxWidth && fontSize <= maxHeight) {
                break;
            }
            fontSize--;
        } while (fontSize > 8);

        return Math.max(fontSize, 8);
    }

    // 말줄임(...) 처리
    static truncateText(ctx, text, maxWidth, fontSize, fontFamily = 'Arial') {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;

        if (ctx.measureText(text).width <= maxWidth) {
            ctx.restore();
            return text;
        }

        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }

        ctx.restore();
        return truncated + '...';
    }

    // 그림자가 있는 텍스트 그리기
    static drawTextWithShadow(ctx, text, x, y, fontSize, fontFamily = 'Arial', fillColor = '#FFFFFF', shadowColor = '#000000', shadowOffset = 2) {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;

        // 그림자 그리기
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowOffset, y + shadowOffset);

        // 텍스트 그리기
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);

        ctx.restore();
    }

    // CSS 텍스트 아웃라인 스타일 생성 (DOM용)
    static getTextOutlineStyle(outlineWidth = 1, outlineColor = '#000000') {
        const offsets = [
            [-outlineWidth, -outlineWidth],
            [0, -outlineWidth],
            [outlineWidth, -outlineWidth],
            [-outlineWidth, 0],
            [outlineWidth, 0],
            [-outlineWidth, outlineWidth],
            [0, outlineWidth],
            [outlineWidth, outlineWidth]
        ];

        const shadows = offsets.map(([x, y]) => `${x}px ${y}px 0 ${outlineColor}`);
        return `text-shadow: ${shadows.join(', ')};`;
    }
}

window.TextRenderer = TextRenderer;