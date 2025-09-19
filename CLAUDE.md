# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔴 Critical Server Rules (MEMORIZE!)

**ALWAYS serve games from their specific directory:**
- ✅ **Card Battle Game**: `npx serve games/card-battle-game -p 3000`
- ✅ **Barista Game**: `npx serve games/barista-game -p 3000`
- ❌ **WRONG**: `npx serve` from project root (loads wrong page)

**Server URL verification**:
- Game must load at `localhost:3000` showing the actual game interface
- If homepage loads instead, stop server and restart from correct directory

## Common Development Commands

- **Run games**: Always serve from specific game directory (see Critical Server Rules above)
- **No build process**: Direct HTML/CSS/JS files - no compilation needed
- **Testing**: Manual testing in browsers, verify defeat/victory modals work

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

### 🔴 Configuration-Driven Development (NO HARDCODING!)

**핵심 원칙: 모든 값은 config에서 관리**
- ❌ 직접 숫자/색상/크기 작성 금지: `x = 640`, `fontSize = '24px'`
- ✅ Config 기반: `GameConfig.canvas.width * 0.5`, `config.ui.fontSize`
- ✅ 동적 계산: `measureText()` → 중앙 정렬

**Canvas 좌표계: GameConfig 필수 사용**
- ❌ `canvas.width/height` 직접 사용 금지 (디스플레이별 차이)
- ✅ `GameConfig.canvas.width/height` 논리적 좌표계 사용
- ✅ 비율 기반 배치: `width * 0.5` (중앙), `height * 0.25` (상단 1/4)

## Key Configuration Files

- `js/config.js`: Site settings, game registry, UI config
- `js/gameRegistry.js`: Dynamic game card generation
- `js/lang/*.json`: Multi-language translations (ko, en, ja)
- `games/{game-name}/js/config/gameConfig.js`: Game-specific settings


## Development Standards

### Code Organization
- **Game structure**: `games/{name}/` → modular JS folders (`core/`, `ui/`, `entities/`, `utils/`)
- **Must add to main `index.html`**: Games NOT auto-discovered
- **Manager pattern**: GameManager, UIManager 등 역할별 클래스 분리

### UI Control Standards
- **CSS .hidden class**: `display: none !important` 정의 필수
- **JavaScript visibility**: `element.classList.add/remove('hidden')` 사용
- ❌ `style.display` 직접 조작 금지

### I18n & Mobile
- **data-i18n attributes**: 번역 가능한 텍스트에 적용
- **Touch support**: 모든 게임에 터치 이벤트 구현 필수

## Card Battle Game Architecture

**모듈 구조**: 22개 파일을 기능별 분리 → 유지보수성 극대화
- **Core**: GameManager, BattleSystem, CardManager (게임 로직)
- **UI**: Renderer, UIManager, HPBarSystem (렌더링 + DOM)
- **Config**: gameConfig.js, cardDatabase.js (설정 중앙화)
- **Utils**: TextRenderer, ColorUtils, TimerManager (재사용)

**핵심 원칙**: Canvas 게임 로직 + DOM UI 하이브리드, GameConfig 논리 좌표계

## Project Workflow Essentials

1. **Configuration first**: Config 파일 수정 → 개별 파일 수정 금지
2. **Test defeat/victory modals**: 패배/승리 화면 정상 작동 확인 필수
3. **Mobile touch events**: 터치 지원 + 반응형 레이아웃 검증
4. **Dynamic over static**: 생성된 컨텐츠 우선, 정적 HTML 지양

**Remember: Configuration-driven development for maximum maintainability**