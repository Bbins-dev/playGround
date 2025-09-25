// Canvas 유틸리티 - 공통 캔버스 작업들
class CanvasUtils {
    // 마우스/터치 좌표를 캔버스 좌표로 변환 (GameConfig 기반, 완전 기능)
    static getCanvasCoordinates(event, canvas, displayScale = { x: 1, y: 1 }) {
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;

        // 마우스 또는 터치 이벤트 처리
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // 디스플레이 스케일 고려한 좌표 계산
        const canvasX = (clientX - rect.left) / displayScale.x;
        const canvasY = (clientY - rect.top) / displayScale.y;

        // Canvas 경계 내부인지 확인
        const isInBounds = canvasX >= 0 && canvasX <= GameConfig.canvas.width &&
                          canvasY >= 0 && canvasY <= GameConfig.canvas.height;

        return {
            x: Math.max(0, Math.min(GameConfig.canvas.width, canvasX)),
            y: Math.max(0, Math.min(GameConfig.canvas.height, canvasY)),
            inBounds: isInBounds
        };
    }

    // 캔버스 크기를 GameConfig에 맞게 조정
    static updateCanvasSize(canvas, gameConfig) {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const aspectRatio = gameConfig.canvas.width / gameConfig.canvas.height;

        let displayWidth, displayHeight;

        if (containerWidth / containerHeight > aspectRatio) {
            displayHeight = containerHeight;
            displayWidth = displayHeight * aspectRatio;
        } else {
            displayWidth = containerWidth;
            displayHeight = displayWidth / aspectRatio;
        }

        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = gameConfig.canvas.width;
        canvas.height = gameConfig.canvas.height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        return { displayWidth, displayHeight };
    }

    // 사각형 영역 체크
    static isPointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }

    // 원형 영역 체크
    static isPointInCircle(point, center, radius) {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    // 색상 헥스값을 RGBA로 변환
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 색상 밝기 조정
    static adjustBrightness(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }

    // 그라데이션 생성
    static createGradient(ctx, x1, y1, x2, y2, colorStops) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        return gradient;
    }

    // 반투명 오버레이 그리기
    static drawOverlay(ctx, width, height, color = 'rgba(0, 0, 0, 0.5)') {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    // 둥근 사각형 그리기
    static drawRoundedRect(ctx, x, y, width, height, radius) {
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
}

window.CanvasUtils = CanvasUtils;