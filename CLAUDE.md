# CLAUDE.md - Card Battle Game Development Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔴 절대 규칙 (CRITICAL - 반드시 준수!)

### 🚨 NO HARDCODING - Configuration-Driven Development
**모든 수치는 GameConfig에서 관리 - 예외 없음!**

❌ **금지된 하드코딩 패턴들**:
```javascript
// 위치값 하드코딩 금지
const position = { x: 640, y: 600 };           // ❌
const position = GameConfig.ui.playerHand;     // ✅

// 크기값 하드코딩 금지
canvas.width = 750;                           // ❌
canvas.width = GameConfig.canvas.width;       // ✅

// 색상값 하드코딩 금지
color: '#FF6B6B'                             // ❌
color: GameConfig.elements.fire.color        // ✅
```

❌ **CSS 하드코딩도 금지**:
```css
/* 절대 금지 */
.card { width: 260px; height: 364px; }

/* 올바른 방식 */
.card {
    width: var(--card-preview-width);
    height: var(--card-preview-height);
}
```

**✅ Configuration-Driven 시스템**:
```
GameConfig.js (단일 진실의 원천)
    ↓
GameManager.syncCSSVariables()
    ↓
CSS Variables (--canvas-width, --card-preview-width)
    ↓
모든 UI 자동 동기화
```

### 🎯 템플릿 기반 동적 메시지
**모든 동적 텍스트는 템플릿 사용 - 코드 수정 금지!**
- 언어팩 `templates` 섹션: `{name}에 걸렸습니다!`, `{name} +{value}`
- 상태 메시지: `EffectSystem.showEffectMessage()` 사용
- 새 효과 추가 시: GameConfig만 수정 (코드 변경 불필요)

### 🎮 서버 실행 규칙
**반드시 게임 디렉토리에서 실행**:
- ✅ `cd games/card-battle-game && npx serve -p 3000`
- ❌ `npx serve` (프로젝트 루트에서 실행 시 잘못된 페이지 로드)

### 🌐 브라우저 테스트 규칙
**Claude는 스스로 브라우저 테스트를 하지 않음**:
- ❌ Claude가 임의로 브라우저 열기/테스트/스크린샷 촬영 금지
- ✅ 사용자가 **직접 요청**하면 `mcp__microsoft-playwright-mcp__*` 도구 사용 가능
- ✅ 구현 완료 후 사용자에게 "테스트해보세요" 안내만 전달
- ✅ 서버 실행 상태 확인까지만 담당

## ⚠️ 자주 하는 실수들 (방금도 이런 실수 있었음!)

### 1. 좌표 변환 직접 계산
```javascript
// ❌ 절대 금지 - 중복 코드!
const rect = canvas.getBoundingClientRect();
const x = (event.clientX - rect.left) / scale;

// ✅ 중앙화된 유틸리티 사용
const coords = CanvasUtils.getCanvasCoordinates(event, canvas);
```

### 2. Canvas 크기 직접 사용
```javascript
// ❌ 레티나 디스플레이 문제 발생
gradient.addColorStop(0, 0, 0, canvas.height);

// ✅ 논리적 좌표계 사용
gradient.addColorStop(0, 0, 0, GameConfig.canvas.height);
```

### 3. 명중률 체크 (게임 로직 오류 방지)
```javascript
// ❌ 확률 오차 발생 (80%가 64%로 변경)
if (roll > accuracy) return false;

// ✅ 정확한 확률 계산
if (roll >= accuracy) return false;
```

### 4. 상태이상 턴 종료 처리 순서
**BattleSystem.js endTurn() 순서 - 변경 금지!**
1. 즉시 해제 (도발, 기절)
2. 독/화상 데미지 → 전투종료체크
3. 상태이상 턴수 차감
4. UI 업데이트

**⚠️ UI를 차감 전에 업데이트하면 0턴 상태이상이 화면에 남음**

## 🏗️ 핵심 Architecture

### Canvas 시스템: 750×1200 (세로형)
- **논리적 좌표계**: GameConfig.canvas.width/height 사용
- **레티나 대응**: CanvasUtils.getCanvasCoordinates() 필수
- **CSS 동기화**: updateCanvasSize()가 자동으로 CSS 변수 설정

### 모듈 구조 (22개 파일)
- **Core**: GameManager, BattleSystem, CardManager
- **UI**: Renderer, UIManager, HPBarSystem
- **Config**: gameConfig.js, cardDatabase.js
- **Utils**: CanvasUtils, TextRenderer, ColorUtils

### DOM 모달 패턴
- HTML 정의 → JavaScript 클래스 → UIManager 통합
- Canvas 모달 절대 금지 (DOM만 사용)

### 카드 디자인 시스템 (통일된 렌더링)
- **단일 설정 소스**: `GameConfig.cardStyle` 수정 → 모든 카드에 즉시 적용
- **CardRenderer**: Canvas 기반 (손패, 승리모달, 확대이미지)
- **DOMCardRenderer**: DOM 기반 (갤러리, 선택창, 디테일모달)
- **실시간 참조**: 캐시 없이 `get style() { return GameConfig.cardStyle; }`

## 📁 핵심 파일들

### 설정 파일
- `games/card-battle-game/js/config/gameConfig.js` - **모든 설정의 중심**
- `games/card-battle-game/js/config/cardDatabase.js` - 카드 데이터
- `games/card-battle-game/js/lang/*.json` - 다국어 지원

### 시스템 파일
- `js/core/GameManager.js` - CSS 변수 동기화, 중앙 통계 시스템
- `js/utils/CanvasUtils.js` - 좌표 변환 중앙화
- `js/ui/Renderer.js` - Canvas 렌더링

## 🎮 Card Battle Game 특성

### 게임 시스템
- **5속성 상성**: 불🔥 → 독☠️ → 전기⚡ → 물💧 → 불🔥 + 노멀👊
- **DOM + Canvas 하이브리드**: 게임 로직은 Canvas, UI는 DOM
- **완전 다국어**: 한국어, 영어, 일본어 (templates 시스템)

### 중요 규칙
- **URL 경로**: `games/card-battle-game/` (trailing slash 필수)
- **스테이지 전환**: HP/상태이상 초기화, gameStats는 유지
- **이중 명중률 체크 금지**: Card.js에서만 처리
- **자해 카드**: `CardDatabase.processSelfDamage()` 공통 유틸리티 사용 (즉사 체크 자동화)
- **속성 면역**: 불속성만 화상 면역, 물속성은 화상에 걸림
- **퍼센트 감소 계산**: 반드시 곱셈 방식 사용 `value * (1 - percent/100)` (뺄셈 금지 ❌ `value - percent`)
- **중앙 통계 시스템**: 모든 대미지는 `GameManager.recordDamage()`로만 기록 (방어력 포함)
- **버프 메시지 시스템**: `EffectSystem.showBuffEffect(type, target, value)` 자동 위치 결정

## 🚀 Quick Development

### 개발 시작
```bash
cd games/card-battle-game && npx serve -p 3000
```

### 설정 변경 시
1. `gameConfig.js`만 수정
2. 자동으로 CSS 변수 동기화
3. 모든 UI 즉시 반영

### 새 기능 추가 시
1. **Configuration first**: GameConfig 먼저 정의
2. **Templates 사용**: 동적 메시지는 언어팩에
3. **Utils 활용**: CanvasUtils, TextRenderer 등 재사용

**Remember: Configuration-driven development for maximum maintainability - 하드코딩은 절대 금지!**