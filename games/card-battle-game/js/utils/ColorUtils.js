// 색상 조작 유틸리티 - 중복 제거
class ColorUtils {
    // 색상 밝기 조정
    static adjustBrightness(color, amount) {
        // 헥스 색상인 경우
        if (color.startsWith('#')) {
            const num = parseInt(color.replace('#', ''), 16);
            const r = Math.min(255, Math.max(0, (num >> 16) + amount));
            const g = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amount));
            const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
            return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
        }

        // RGB/RGBA 색상인 경우
        if (color.startsWith('rgb')) {
            const matches = color.match(/\d+/g);
            if (matches) {
                const r = Math.min(255, Math.max(0, parseInt(matches[0]) + amount));
                const g = Math.min(255, Math.max(0, parseInt(matches[1]) + amount));
                const b = Math.min(255, Math.max(0, parseInt(matches[2]) + amount));
                const a = matches[3] ? parseFloat(matches[3]) : 1;
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
        }

        return color;
    }

    // 색상 밝게 만들기 (lightenColor)
    static lighten(color, factor = 0.2) {
        const amount = Math.round(255 * factor);
        return this.adjustBrightness(color, amount);
    }

    // 색상 어둡게 만들기 (darkenColor)
    static darken(color, factor = 0.2) {
        const amount = -Math.round(255 * factor);
        return this.adjustBrightness(color, amount);
    }

    // 헥스 색상을 RGBA로 변환
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // RGBA 색상에서 알파값 변경
    static setAlpha(color, alpha) {
        if (color.startsWith('#')) {
            return this.hexToRgba(color, alpha);
        }

        if (color.startsWith('rgb')) {
            const matches = color.match(/\d+(\.\d+)?/g);
            if (matches && matches.length >= 3) {
                const r = parseInt(matches[0]);
                const g = parseInt(matches[1]);
                const b = parseInt(matches[2]);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
        }

        return color;
    }

    // 색상 믹스 (두 색상을 ratio 비율로 섞기)
    static mix(color1, color2, ratio = 0.5) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
        const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
        const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // 헥스 색상을 RGB 객체로 변환 (내부 헬퍼)
    static hexToRgb(hex) {
        if (!hex.startsWith('#')) return null;

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // 색상의 밝기 계산 (0-1 범위)
    static getBrightness(color) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return 0.5;

        // 가중 평균으로 밝기 계산
        return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
    }

    // 색상에 적합한 텍스트 색상 반환 (대비 고려)
    static getContrastColor(backgroundColor) {
        const brightness = this.getBrightness(backgroundColor);
        return brightness > 0.5 ? '#000000' : '#FFFFFF';
    }

    // 그라데이션 CSS 생성
    static createLinearGradient(direction, ...colors) {
        return `linear-gradient(${direction}, ${colors.join(', ')})`;
    }

    // 색상 유효성 검사
    static isValidColor(color) {
        const div = document.createElement('div');
        div.style.color = color;
        return div.style.color !== '';
    }

    // 속성별 기본 색상 가져오기
    static getElementColor(element) {
        const elementConfig = GameConfig.elements[element];
        return elementConfig ? elementConfig.color : '#666666';
    }

    // 속성별 어두운 색상 (배경용)
    static getElementDarkColor(element, factor = 0.3) {
        const baseColor = this.getElementColor(element);
        return this.darken(baseColor, factor);
    }

    // 속성별 밝은 색상 (강조용)
    static getElementLightColor(element, factor = 0.3) {
        const baseColor = this.getElementColor(element);
        return this.lighten(baseColor, factor);
    }
}

window.ColorUtils = ColorUtils;