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
   - **Modular structure**: Organized into `js/core/`, `js/ui/`, `js/entities/`, `js/utils/`, `js/screens/`, `css/`
   - Canvas-based rendering with 60fps game loops
   - Mobile-responsive with touch event support

3. **Shared JavaScript Systems**:
   - **i18n system** (`js/i18n.js`): Dynamic language switching with JSON translations
   - **Configuration system** (`js/config.js`): Centralized settings management

### Current Games
- **Barista Game** (`games/barista-game/`): Timing-based coffee pouring game
- **Card Battle Game** (`games/card-battle-game/`): 턴제 자동 카드 배틀 게임 [FULLY WORKING ✅]
  - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀👊) + 상성 관계
  - 완전한 다국어 지원 (한국어, 영어, 일본어)
  - 모듈화된 아키텍처: Core, UI, Entities, Utils, Screens 분리
  - Canvas + DOM 하이브리드 UI (HP바, 상태이상 표시 등)
  - 논리적 좌표계 기반 크로스 플랫폼 호환성

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

3. **Canvas 좌표계 일관성 (크로스 플랫폼 대응)**:
   - ❌ `canvas.width`, `canvas.height` 직접 사용 금지 (브라우저별/디스플레이별 실제 픽셀 크기 상이)
   - ✅ `GameConfig.canvas.width`, `GameConfig.canvas.height` 사용 필수 (논리적 좌표계)
   - ✅ 모든 UI 위치를 논리적 좌표계 기준으로 계산 (비율 기반 배치)
   - ✅ 예: `x = GameConfig.canvas.width * 0.5` (중앙), `y = GameConfig.canvas.height * 0.25` (상단 1/4)

## Key Configuration Files

- `js/config.js`: Site settings, game registry, UI config
- `js/gameRegistry.js`: Dynamic game card generation
- `js/lang/*.json`: Multi-language translations (ko, en, ja)
- `games/{game-name}/js/config/gameConfig.js`: Game-specific settings

## Development Guidelines

### Adding New Games
1. Create folder in `games/` with kebab-case naming
2. **Must add game card to main `index.html`** - games are NOT auto-discovered
3. **Modular structure**: Organize code into `js/core/`, `js/ui/`, `js/entities/`, `js/utils/`, `js/screens/`
4. Include mobile touch support and "back to main" button
5. Maintain independence - no cross-game dependencies

### File Organization Rules
- **Game folders only in `games/`** - never elsewhere
- **Modular structure**: `js/core/` (logic), `js/ui/` (rendering), `js/entities/` (data), `js/utils/` (helpers), `js/screens/` (screens)
- **Language files**: `js/lang/{lang}.json` for i18n translations
- **Game-specific assets**: `games/{game-name}/assets/`
- **CSS organization**: `css/components.css` for additional styling

### Translation & Internationalization
- Use `data-i18n` attributes for translatable text
- Add new translations to all language files (`ko.json`, `en.json`, `ja.json`)
- Language switching is handled by the i18n system automatically

### Code Style Patterns
- **ES6+ Modules**: Import/export pattern으로 모듈화
- **Configuration-driven development**: 모든 설정값은 config 파일에서 관리
- **Dynamic positioning**: measureText(), getBoundingClientRect() 활용한 동적 배치
- **Manager Pattern**: GameManager, CardManager, UIManager 등 역할별 관리자 클래스
- **Separation of Concerns**: Core logic, UI rendering, entities, utilities 분리
- Consistent event handling with `addEventListener`

## Card Battle Game - Recent Updates (2025-09-19)

### 대규모 리팩토링 완료 ✅
- **모듈화 아키텍처**: 22개 파일을 기능별로 분리하여 유지보수성 향상
- **Canvas + DOM 하이브리드**: Canvas 게임 로직 + DOM HP바/상태이상 UI
- **논리적 좌표계**: GameConfig 기반 비율 계산으로 크로스 플랫폼 호환성 확보
- **Manager Pattern**: Core 로직과 UI 렌더링 완전 분리
- **Utils 시스템**: 재사용 가능한 TextRenderer, ColorUtils, TimerManager 등

### 모듈 구조 예시
```javascript
// Core Systems
js/core/GameManager.js     // 게임 상태 및 화면 전환 관리
js/core/BattleSystem.js    // 전투 로직 및 규칙 처리
js/core/CardManager.js     // 카드 데이터 및 선택 관리

// UI Systems
js/ui/Renderer.js          // Canvas 렌더링 총괄
js/ui/UIManager.js         // DOM UI 요소 관리
js/ui/HPBarSystem.js       // HP바 및 방어력 표시

// Configuration
js/config/gameConfig.js    // 게임 설정 (canvas 크기, 속성 시스템 등)
js/config/cardDatabase.js  // 카드 데이터베이스

// Utilities
js/utils/TextRenderer.js   // 텍스트 렌더링 최적화
js/utils/ColorUtils.js     // 색상 처리 유틸리티
```

### 핵심 개발 원칙
- **논리적 좌표계**: GameConfig 기준 논리적 크기로 모든 디스플레이에서 일관성 확보
- **비율 기반 배치**: 절대값 대신 `width * 0.5`, `height * 0.25` 등 비율로 UI 배치
- **하이브리드 UI**: Canvas (게임 로직) + DOM (HP바, 상태이상) 조합
- **모듈별 분리**: 각 기능별로 독립적 모듈화하여 유지보수성 극대화
- **설정 기반 개발**: 모든 UI 위치값을 GameConfig에서 관리

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