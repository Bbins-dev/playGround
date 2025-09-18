# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

Since this is a pure client-side web project, development is straightforward:

- **Run locally**: Open `index.html` in a web browser or use a local server like `python -m http.server` or `npx serve`
- **No build process**: Direct HTML/CSS/JS files - no compilation needed
- **No testing framework**: Manual testing in different browsers/devices

## Project Architecture & Structure

### High-Level Architecture
This is a **Korean hyper-casual mini web games collection** - a single-page application that serves as a hub for individual HTML5 canvas games. The main page (`index.html`) acts as a game launcher with multi-language support.

### Core Systems

1. **Main Hub** (`index.html`):
   - Game cards grid with search functionality
   - Multi-language i18n system (Korean, English, Japanese)
   - Local storage for game data management

2. **Individual Games** (in `games/` folder):
   - Each game is completely independent
   - Standard structure: `index.html`, `style.css`, `game.js`, `assets/`
   - Canvas-based rendering with 60fps game loops
   - Mobile-responsive with touch event support

3. **Shared JavaScript Systems**:
   - **i18n system** (`js/i18n.js`): Dynamic language switching with JSON translations
   - **Configuration system** (`js/config.js`): Centralized settings management

### Current Games
- **Barista Game** (`games/barista-game/`): Timing-based coffee pouring game
- **Card Battle Game** (`games/card-battle-game/`): 턴제 자동 카드 배틀 게임 [FULLY WORKING ✅]
  - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀⭐) + 상성 관계
  - 완전한 다국어 지원 (한국어, 영어, 일본어)
  - 반응형 Canvas 시스템 및 동적 UI 중앙 정렬
  - 메인 메뉴, 카드 선택, 카드 갤러리, 전투 화면 완료

## Critical Development Rules

### ⚠️ URL Path Rules (MEMORIZE!)
**ALWAYS use trailing slashes for directory links in HTML:**
- ✅ CORRECT: `games/barista-game/` (with slash)
- ❌ WRONG: `games/barista-game` (without slash)

Without trailing slash, relative paths like `./style.css` resolve incorrectly.

### 🔴 Configuration-Driven Architecture (NEVER HARDCODE!)
**모든 개발에서 최우선 적용:**

1. **UI 위치값 하드코딩 금지**:
   - ❌ `x = 640`, `y = 280` 같은 고정 픽셀값 사용 금지
   - ✅ `GameConfig.canvas.width / 2`, `config.startY + index * config.itemHeight` 사용
   - ✅ 텍스트 크기 측정 후 동적 중앙 정렬 계산

2. **설정값 하드코딩 금지**:
   - ❌ 코드 내부에 직접 숫자, 색상, 크기 작성 금지
   - ✅ 모든 값은 `gameConfig.js` 또는 설정 파일에서 가져오기

3. **Canvas 좌표계 일관성 (레티나 디스플레이 대응)**:
   - ❌ `canvas.width`, `canvas.height` 직접 사용 금지 (실제 픽셀 크기)
   - ✅ `GameConfig.canvas.width`, `GameConfig.canvas.height` 사용 필수 (논리적 크기)
   - ✅ 모든 팝업, UI 위치 계산을 GameConfig 기준으로 통일

## Key Configuration Files

- `js/config.js`: Site settings, game registry, UI config
- `js/gameRegistry.js`: Dynamic game card generation
- `js/lang/*.json`: Multi-language translations (ko, en, ja)
- `games/{game-name}/js/config/gameConfig.js`: Game-specific settings

## Development Guidelines

### Adding New Games
1. Create folder in `games/` with kebab-case naming
2. **Must add game card to main `index.html`** - games are NOT auto-discovered
3. Include mobile touch support and "back to main" button
4. Maintain independence - no cross-game dependencies

### File Organization Rules
- **Game folders only in `games/`** - never elsewhere
- **Language files**: `js/lang/{lang}.json` for i18n translations
- **Game-specific assets**: `games/{game-name}/assets/`

### Translation & Internationalization
- Use `data-i18n` attributes for translatable text
- Add new translations to all language files (`ko.json`, `en.json`, `ja.json`)
- Language switching is handled by the i18n system automatically

### Code Style Patterns
- ES6+ classes for game logic
- **Configuration-driven development**: 모든 설정값은 config 파일에서 관리
- **Dynamic positioning**: measureText(), getBoundingClientRect() 활용한 동적 배치
- **Responsive Canvas**: updateCanvasSize() 메서드로 반응형 처리
- Consistent event handling with `addEventListener`

## Card Battle Game - Recent Updates (2025-09-18)

### 완성된 시스템들 ✅
- **카드 선택 화면**: 동적 중앙 정렬 시스템 완료
- **다국어 지원**: 11개 카드 모두 3개 언어 완전 번역
- **반응형 Canvas**: 모든 해상도에서 UI 완벽 정렬
- **설정 기반 UI**: gameConfig.cardSelection으로 모든 레이아웃 관리

### gameConfig 구조 예시
```javascript
// games/card-battle-game/js/config/gameConfig.js
cardSelection: {
    title: {
        y: 50,              // 제목 Y 위치
        fontSize: 28,       // 제목 폰트 크기
        shadowOffset: 2     // 그림자 오프셋
    },
    instructions: {
        startY: 100,        // 안내 메시지 시작 Y 위치
        lineHeight: 18,     // 줄 간격
        fontSize: 14        // 폰트 크기
    },
    cards: {
        startY: 180,        // 카드 그리드 시작 Y 위치
        width: 140,         // 카드 너비
        height: 190,        // 카드 높이
        spacing: 160,       // 카드 간격
        maxCols: 5          // 최대 열 수
    }
}
```

### UI 일관성 원칙
- 모든 화면에서 `GameConfig.canvas.width / 2` 사용하여 중앙 정렬 (레티나 디스플레이 대응)
- measureText()로 텍스트 크기 측정 후 동적 배치
- 설정값 변경만으로 전체 레이아웃 조정 가능

## Mobile & Performance Considerations
- All games must support touch events
- Canvas games should use `requestAnimationFrame`
- Responsive design with mobile-first approach
- Local storage for persistence and game data

## Project Workflow
1. **Always check configuration first** - modify config files, not individual files
2. **Test language switching** - verify sync between homepage and games
3. **Mobile testing** - ensure touch events and responsive layout work
4. **Dynamic content** - prefer generated content over static HTML

**REMEMBER: This project prioritizes maintainability through configuration-driven development!**