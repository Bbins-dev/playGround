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
   - Ad placement system (sidebars + game content)
   - Local storage for game data management

2. **Individual Games** (in `games/` folder):
   - Each game is completely independent
   - Standard structure: `index.html`, `style.css`, `game.js`, `assets/`
   - Canvas-based rendering with 60fps game loops
   - Mobile-responsive with touch event support

3. **Shared JavaScript Systems**:
   - **i18n system** (`js/i18n.js`): Dynamic language switching with JSON translations
   - **Utils & Storage** (`js/main.js`): Local storage wrapper, animations, game management

### Game Implementation Pattern
All games follow the class-based pattern:
```javascript
class GameName {
    constructor() { /* Canvas setup, event binding */ }
    init() { /* Game initialization */ }
    gameLoop() { /* requestAnimationFrame loop */ }
    update() { /* Game logic */ }
    render() { /* Canvas drawing */ }
}
```

### Current Games
- **Barista Game** (`games/barista-game/`): Complex timing-based coffee pouring game with:
  - Multiple cup types with different timing windows
  - Sound system with Web Audio API
  - Visual effects system for droplets/animations
  - Mobile optimization with touch events
  - Score validation/security system

- **Card Battle Game** (`games/card-battle-game/`): 턴제 자동 카드 배틀 게임 [COMPLETED ✅]:
  - 완전한 턴 기반 자동 전투 시스템
  - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀⭐) + 상성 관계 (1.5x/0.5x)
  - Canvas + DOM 하이브리드 렌더링 시스템
  - 메인 메뉴, 카드 갤러리, 카드 선택 화면 완료
  - 완전한 애니메이션 시스템 (피격 효과, 상태이상, 카드 발동)
  - 모바일 터치 지원 및 게임 속도 조절 (1x/2x/3x)
  - 메인 사이트 통합 완료 (config.js + 언어 파일)

## Key Development Guidelines

### Adding New Games
1. Create folder in `games/` with kebab-case naming
2. Follow the template structure in `games/README.md`
3. **Must add game card to main `index.html`** - games are NOT auto-discovered
4. Include mobile touch support and "back to main" button
5. Maintain independence - no cross-game dependencies

### File Organization Rules
- **Game folders only in `games/`** - never elsewhere
- **Language files**: `js/lang/{lang}.json` for i18n translations
- **Shared assets**: `assets/` folder for common resources
- **Game-specific assets**: `games/{game-name}/assets/`

### Mobile & Performance Considerations
- All games must support touch events
- Canvas games should use `requestAnimationFrame`
- Responsive design with mobile-first approach
- Local storage for persistence and game data

### Translation & Internationalization
- Use `data-i18n` attributes for translatable text
- Add new translations to all language files (`ko.json`, `en.json`, `ja.json`)
- Language switching is handled by the i18n system automatically

### Code Style Patterns
- ES6+ classes for game logic
- Consistent event handling with `addEventListener`
- CSS Grid for game cards layout
- BEM-style CSS naming where applicable

The project emphasizes modularity (each game is independent), Korean-first localization, mobile responsiveness, and performance optimization for smooth 60fps gaming experiences.

## ⚠️ Critical URL Path Rules (MEMORIZE!)

**ALWAYS use trailing slashes for directory links in HTML:**
- ✅ CORRECT: `games/barista-game/` (with slash)
- ❌ WRONG: `games/barista-game` (without slash)

**Why this matters:**
- Without trailing slash: Browser treats URL as a file, so relative paths like `./style.css` resolve incorrectly (e.g., `/games/style.css` instead of `/games/barista-game/style.css`)
- With trailing slash: Browser treats URL as directory, so relative paths resolve correctly

**Example of the problem:**
- Link: `games/barista-game` (no slash)
- Browser URL: `http://localhost:8000/games/barista-game`
- `./style.css` resolves to: `http://localhost:8000/games/style.css` ❌ 404 Error

**Solution:**
- Link: `games/barista-game/` (with slash)
- Browser URL: `http://localhost:8000/games/barista-game/`
- `./style.css` resolves to: `http://localhost:8000/games/barista-game/style.css` ✅ Success

**Always check for this pattern when adding new games or fixing navigation issues.**

## 🔧 Configuration-Driven Architecture (CRITICAL!)

### Centralized Configuration System
- **Never hard-code values** - always use `js/config.js` for all settings
- **Dynamic game registry** - games auto-generated from configuration, not manual HTML
- **Centralized i18n** - all translations managed through `js/lang/*.json` files
- **Component-based CSS** - reusable styles in `css/components.css`

### Key Configuration Files:
- `js/config.js`: Site settings, game registry, UI config, performance settings
- `js/gameRegistry.js`: Dynamic game card generation and management
- `css/components.css`: Shared component styles (buttons, language selectors, etc.)
- `js/i18n.js`: Multi-language system with automatic homepage/game sync

### Language System Architecture:
- **Automatic sync**: Homepage ↔ Game language settings stay synchronized
- **Storage-driven**: Uses `localStorage` with configurable key names
- **Path-aware**: Automatically detects homepage vs game context for relative paths
- **Consistent styling**: All language selectors use unified dark theme with hover effects

### UI Consistency Rules:
- **Language selectors**: Always use dark semi-transparent background with white text
- **Game controls**: Position language dropdown at `top: 0px, right: 20px` in games
- **Combo displays**: Number first, then text ("5 콤보!" not "콤보 5")
- **Mobile-responsive**: All components must work on touch devices

### Recent Major Refactoring (2025-01):
- Eliminated 400+ lines of duplicate/hard-coded content
- Implemented dynamic game card generation
- Unified language selector styling across all pages
- Fixed homepage-game language synchronization issues
- Improved mobile UI positioning and touch responsiveness

### Development Workflow:
1. **Always check configuration first** - modify `config.js`, not individual files
2. **Test language switching** - verify sync between homepage and games
3. **Mobile testing** - ensure touch events and responsive layout work
4. **Dynamic content** - prefer generated content over static HTML

**REMEMBER: This project prioritizes maintainability through configuration-driven development!**

## 🎴 Card Battle Game Development Progress

### Current Status (Branch: feature/card-battle-game)
**Phase Completed:** 기본 구조 및 핵심 클래스 구현
**Next Phase:** 전투 시스템 + UI 렌더링 구현

### 구현 완료된 부분:
1. **프로젝트 구조**: 체계적인 폴더 구조와 기본 파일들
2. **게임 설정**:
   - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀⭐)
   - 속성 상성 관계 (강점 1.5배, 약점 0.5배)
   - 상태이상 시스템 (도발, 기절, 마비, 화상, 중독)
3. **카드 시스템**:
   - Card 클래스 및 카드 데이터베이스
   - 마구때리기 카드 구현 (노멀 속성, 공격력 3)
4. **캐릭터 시스템**:
   - Player 클래스 (최대 손패 10장, HP 관리, 상태이상)
   - Enemy 클래스 (최대 손패 20장, 스테이지별 특성)
5. **게임 매니저**: 전체 게임 플로우 및 상태 관리

### 다음 구현 예정:
1. **전투 시스템** (`js/core/BattleSystem.js`)
2. **Canvas 렌더링** (`js/ui/Renderer.js`)
3. **UI 관리** (`js/ui/UIManager.js`, `js/ui/AnimationManager.js`)
4. **화면들** (`js/screens/MainMenu.js`, `CardGallery.js`, `CardSelection.js`)
5. **메인 config.js에 게임 등록**

### 게임 핵심 메커니즘:
- **자동 전투**: 손패 왼쪽부터 순차적으로 카드 발동
- **카드 순서**: 플레이어가 카드 배치 순서를 전략적으로 구성
- **속성 상성**: 공격 시 상성에 따른 데미지 배율 적용
- **방어 속성**: 손패에서 가장 많은 속성으로 자동 결정
- **스테이지 진행**: 승리 시 3장 중 카드 선택/교체/스킵
- **무한 진행**: 카드는 소모되지 않고 매 턴 반복 발동

### 개발 재개 시 체크리스트:
1. `git checkout feature/card-battle-game`
2. 브랜치 상태 확인: `git status`
3. 다음 할 일: BattleSystem.js 구현부터 시작
4. 테스트: 마구때리기 카드로 기본 전투 테스트

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.


      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.