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

- **Card Battle Game** (`games/card-battle-game/`): 턴제 자동 카드 배틀 게임 [FULLY WORKING ✅]:
  - 완전한 턴 기반 자동 전투 시스템
  - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀⭐) + 상성 관계 (1.5x/0.5x)
  - **반응형 Canvas 시스템**: 모든 화면 크기에서 완벽 중앙 정렬
  - **동적 UI 정렬**: 텍스트 측정 기반 실시간 중앙 정렬
  - Canvas + DOM 하이브리드 렌더링 시스템
  - 메인 메뉴, 카드 갤러리, 카드 선택 화면 완료
  - 완전한 애니메이션 시스템 (피격 효과, 상태이상, 카드 발동)
  - **완전한 입력 지원**: 마우스/터치/키보드 모든 입력 방식
  - 모바일 터치 지원 및 게임 속도 조절 (1x/2x/3x)
  - 메인 사이트 통합 완료 (config.js + 언어 파일)
  - **2025-09-17 주요 개선**: UI 중앙 정렬 문제 근본 해결, 하드코딩 완전 제거

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
- **Configuration-driven development**: 모든 설정값은 config 파일에서 관리
- **Dynamic positioning**: measureText(), getBoundingClientRect() 활용한 동적 배치
- **Responsive Canvas**: updateCanvasSize() 메서드로 반응형 처리
- Consistent event handling with `addEventListener`
- CSS Grid for game cards layout
- BEM-style CSS naming where applicable

### 🔴 필수 기술 원칙:
1. **절대 하드코딩 금지**: 모든 픽셀값, 색상, 크기는 설정 파일에서
2. **반응형 우선**: 모든 화면 크기에서 완벽 작동
3. **동적 계산**: UI 요소 위치는 실시간 측정 후 계산
4. **설정 기반**: gameConfig.js 중심의 아키텍처

The project emphasizes **configuration-driven architecture**, Korean-first localization, **responsive design**, and **dynamic UI positioning** for smooth 60fps gaming experiences across all screen sizes.

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

### 🔴 절대 하드코딩 금지 원칙 (NEVER HARDCODE!)
**이 원칙을 위반하면 안 됩니다. 모든 개발에서 최우선 적용:**

1. **UI 위치값 하드코딩 금지**:
   - ❌ `x = 640`, `y = 280` 같은 고정 픽셀값 사용 금지
   - ✅ `canvas.width / 2`, `config.startY + index * config.itemHeight` 사용
   - ✅ 텍스트 크기 측정 후 동적 중앙 정렬 계산

2. **설정값 하드코딩 금지**:
   - ❌ 코드 내부에 직접 숫자, 색상, 크기 작성 금지
   - ✅ 모든 값은 `gameConfig.js` 또는 설정 파일에서 가져오기
   - ✅ `GameConfig.mainMenu.iconSize`, `GameConfig.colors.primary` 사용

3. **UI 레이아웃 하드코딩 금지**:
   - ❌ 고정 오프셋 (`iconX: -100`, `textX: 20`) 사용 금지
   - ✅ 콘텐츠 크기 실측정 후 동적 중앙 정렬
   - ✅ `measureText()`, `getBoundingClientRect()` 활용

4. **반응형 대응 필수**:
   - ❌ 하나의 화면 크기만 고려한 고정 레이아웃 금지
   - ✅ 모든 화면 크기에서 작동하는 비율 기반 계산
   - ✅ Canvas resize 이벤트 처리

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

## 🎴 Card Battle Game - Fully Completed System

### 완전 구현 완료 상태 ✅
**최종 업데이트**: 2025-09-17 - 모든 시스템 완료 및 UI 문제 해결

### 📅 2025-09-17 주요 업데이트

#### 1. **완전한 다국어 지원 완료** ✅
- **11개 카드 모두 번역 완료**: 한국어, 영어, 일본어
- **초기 상태**: EN/JA는 2개 카드만 번역되어 있었음 (random_bash, heavy_strike)
- **추가 번역**: 9개 카드 완전 번역 추가
- **카드 구성**:
  - 공격 카드: 5장 (random_bash, heavy_strike, shield_bash, concussion, counter_attack)
  - 방어 카드: 5장 (raise_shield, wear_armor, crouch, large_shield, thorn_armor)
  - 상태이상 카드: 1장 (taunt)
- **번역 파일**: `js/lang/ko.json`, `js/lang/en.json`, `js/lang/ja.json`

#### 2. **레터박스 렌더링 시스템 구현** ✅
해상도별 UI 위치 틀어짐 문제를 완전히 해결했습니다.

**구현 위치**: `games/card-battle-game/js/core/GameManager.js`

```javascript
// updateCanvasSize() 메서드 - 레터박스 방식으로 완전 개선
updateCanvasSize() {
    // 기본 게임 비율 (16:9) 유지
    const gameAspectRatio = GameConfig.canvas.width / GameConfig.canvas.height;

    // 레터박스 크기 계산
    if (containerAspectRatio > gameAspectRatio) {
        displayHeight = Math.min(containerHeight * 0.9, 800); // 최대 높이 제한
        displayWidth = displayHeight * gameAspectRatio;
    } else {
        displayWidth = Math.min(containerWidth * 0.9, 1200); // 최대 너비 제한
        displayHeight = displayWidth / gameAspectRatio;
    }

    // 레터박스 오프셋 계산 (중앙 정렬)
    this.letterboxOffset = {
        x: (containerWidth - displayWidth) / 2,
        y: (containerHeight - displayHeight) / 2
    };
}
```

#### 3. **정확한 좌표 변환 시스템** ✅
```javascript
// 레터박스를 고려한 정밀한 좌표 계산
getCanvasCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) / this.displayScale.x;
    const canvasY = (event.clientY - rect.top) / this.displayScale.y;

    // Canvas 경계 내부인지 확인
    const isInBounds = canvasX >= 0 && canvasX <= GameConfig.canvas.width &&
                      canvasY >= 0 && canvasY <= GameConfig.canvas.height;

    return { x: canvasX, y: canvasY, inBounds: isInBounds };
}

// 모든 입력 이벤트에서 inBounds 체크 적용
if (coords.inBounds && this.currentScreen && this.currentScreen.handlePointerInput) {
    this.currentScreen.handlePointerInput(coords.x, coords.y, this.canvas);
}
```

#### 4. **CSS 레터박스 스타일링** ✅
```css
.game-container {
    background: #000000; /* 레터박스를 위한 검은 배경 */
}

#gameCanvas {
    position: relative;
    margin: auto;        /* 자동 중앙 정렬 */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); /* 향상된 그림자 */
}
```

#### 5. **해상도 테스트 완료** ✅
모든 해상도에서 완벽한 UI 위치 정렬 확인:
- **모바일**: 375x667, 414x896 - UI 완벽 중앙 정렬
- **태블릿**: 768x1024, 1024x768 - 레터박스 적용 완벽
- **데스크톱**: 1920x1080, 1366x768 - 최적 크기로 표시

### 🎯 해결된 핵심 문제
1. **해상도별 UI 위치 틀어짐** → 레터박스 방식으로 완전 해결
2. **터치/마우스 입력 부정확** → 정밀한 좌표 변환으로 해결
3. **번역 누락** → 11개 카드 전체 3개 언어 완전 번역

### 완전히 구현된 시스템들:
1. **게임 설정 시스템**:
   - 5개 속성 시스템 (불🔥, 물💧, 전기⚡, 독☠️, 노멀⭐)
   - 속성 상성 관계 (강점 1.5배, 약점 0.5배)
   - 상태이상 시스템 (도발, 기절, 마비, 화상, 중독)

2. **카드 시스템**:
   - Card 클래스 및 완전한 카드 데이터베이스
   - 3개 카드 완전 구현: bash, random_bash, heavy_strike
   - 동적 효과 함수 시스템 (멀티 히트, 명중률 계산)
   - 완전한 i18n 지원 (한국어, 영어, 일본어)

3. **UI/렌더링 시스템**:
   - Canvas + DOM 하이브리드 렌더링
   - **반응형 Canvas 시스템** (어떤 화면 크기든 완벽 중앙 정렬)
   - 메인 메뉴 동적 중앙 정렬 (하드코딩 완전 제거)
   - 카드 갤러리 (이모지 렌더링, 카드 인스턴스 기반)

4. **입력 시스템**:
   - 완전한 마우스/터치/키보드 지원
   - 좌표 변환 및 반응형 입력 처리

5. **전투 시스템**:
   - 턴 기반 자동 전투
   - 속성 상성 및 상태이상 처리
   - 게임 속도 조절 (1x/2x/3x)

### 🔴 핵심 아키텍처 원칙:
- **절대 하드코딩 금지**: 모든 설정값은 gameConfig.js에서 관리
- **동적 위치 계산**: UI 요소들은 실시간 측정 및 계산으로 배치
- **반응형 설계**: Canvas 크기 변경 시 자동 적응
- **Configuration-First**: 설정 기반 개발 우선

### 🚀 2025-09-17 이전 주요 UI/UX 개선 사항:

#### 0. 카드 갤러리 UI 문제 완전 해결 ✅
**문제**: 메인 메뉴 "카드 갤러리"와 "모든 카드 보기" 버튼이 다른 결과를 보여주는 중복 구현 문제
**해결**:
- Canvas 렌더링 CardGallery 클래스 제거, DOM 모달로 통일
- CardManager.getAllCardsForGallery()가 Card 인스턴스 반환하도록 수정
- createCardGalleryElement()에서 Card 인스턴스 메서드 활용 (getDisplayName, getDisplayDescription, getEmoji 등)
- CSS card-preview 중복 스타일 제거, gallery-card로 통합
- GameManager에서 gallery 화면 전환 로직 제거, DOM 모달 방식으로 통일
- 'g' 키와 메뉴 버튼 모두 동일한 DOM 모달 사용
**결과**: 모든 카드 갤러리 접근 방법이 동일한 깔끔한 UI 제공

#### 1. 반응형 Canvas 시스템 구현
```javascript
// GameManager.js의 updateCanvasSize() 메서드
- 컨테이너 크기에 맞춰 Canvas 동적 리사이즈
- 16:9 비율 유지하면서 최적 크기 계산
- displayScale 계산으로 입력 좌표 변환
- window.resize 이벤트 실시간 처리
```

#### 2. 완전 동적 중앙 정렬 시스템
```javascript
// MainMenu.js의 renderMenuItem() 개선
- ctx.measureText()로 텍스트 실제 크기 측정
- 아이콘 + 텍스트 전체 너비 계산
- 콘텐츠 중앙 배치를 위한 동적 X 좌표 계산
- 하드코딩된 오프셋 완전 제거
```

#### 3. CSS 및 Canvas 최적화
```css
#gameCanvas {
    object-fit: contain;        // 비율 유지
    image-rendering: crisp-edges; // 픽셀 선명도
    display: block;             // 정확한 정렬
}
```

#### 4. 설정 기반 아키텍처 강화
```javascript
// gameConfig.js 개선
mainMenu: {
    centerAligned: true,        // 동적 중앙 정렬 활성화
    // 고정 위치값 제거, 동적 계산으로 대체
}
```

### 핵심 파일 구조:
```
games/card-battle-game/
├── js/config/gameConfig.js     # 모든 설정값 중앙 관리 (하드코딩 금지)
├── js/core/GameManager.js      # 반응형 Canvas 시스템
├── js/screens/MainMenu.js      # 동적 중앙 정렬 시스템
└── style.css                   # object-fit 최적화
```

## 🛠️ 핵심 기술 가이드라인

### 0. **UI 구현 통일성 원칙** ⭐
```javascript
// ❌ 잘못된 방법 - 같은 기능에 다른 구현 방식 사용
MainMenu: Canvas 렌더링으로 카드 갤러리
UIManager: DOM 모달로 카드 갤러리

// ✅ 올바른 방법 - 통일된 구현 방식 사용
모든 카드 갤러리 접근: DOM 모달로 통일
- MainMenu.openCardGallery() → UIManager.showCardGallery()
- 'g' 키 → UIManager.showCardGallery()
- "모든 카드 보기" 버튼 → UIManager.showCardGallery()

// 중복 구현 방지 원칙
- 같은 기능은 반드시 같은 결과를 보여줘야 함
- UI 컴포넌트는 한 가지 방식으로만 구현
- Canvas vs DOM 선택 시 일관성 유지
```

### 1. **Card 인스턴스 메서드 사용 원칙**
```javascript
// ❌ 잘못된 방법 - 직접 프로퍼티 접근
const name = card.name;
const emoji = card.emoji;

// ✅ 올바른 방법 - 인스턴스 메서드 사용
const name = card.getDisplayName();
const description = card.getDisplayDescription();
const emoji = card.getEmoji();

// CardDatabase에서 가져온 객체는 반드시 Card 인스턴스로 변환
const cardData = CardDatabase.getCard('bash');
const cardInstance = new Card(cardData);
```

### 2. **좌표 변환 시스템**
```javascript
// GameManager.js의 좌표 변환 메서드 활용
handlePointerInput(event) {
    const coords = this.getCanvasCoordinates(event);
    // coords.x, coords.y는 Canvas 논리적 좌표 (1280x720 기준)

    // displayScale을 고려한 정확한 좌표 변환
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
}
```

### 3. **i18n 키 구조 패턴**
```javascript
// 카드 이름/설명 키 구조
"auto_battle_card_game.ui.cards.random_bash.name": "마구때리기"
"auto_battle_card_game.ui.cards.random_bash.description": "상대에게 3~5회 연속공격"

// 동적 효과 함수에서 사용
card.nameKey = 'auto_battle_card_game.ui.cards.random_bash.name';
card.descriptionKey = 'auto_battle_card_game.ui.cards.random_bash.description';

// 전투 메시지 키 구조
"auto_battle_card_game.ui.multi_hit_damage": "연속공격 데미지"
"auto_battle_card_game.ui.miss": "빗나감!"
```

### 4. **메모리 관리 주의사항**
```javascript
// Canvas 작업 시 항상 save/restore 사용
renderMenuItem(ctx, item, x, y) {
    ctx.save();
    // ... 렌더링 작업
    ctx.restore(); // 필수!
}

// 이벤트 리스너 정리 메서드 구현
cleanup() {
    this.eventListeners.forEach(([element, event, handler]) => {
        element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
}

// 화면 전환 시 리소스 정리
switchScreen(newScreen) {
    if (this.currentScreen && this.currentScreen.cleanup) {
        this.currentScreen.cleanup();
    }
    this.currentScreen = newScreen;
}
```

### 5. **디버깅 및 문제해결 팁**
```javascript
// Canvas 렌더링 문제 디버깅
console.log(`Canvas 크기: ${canvas.width}x${canvas.height}`);
console.log(`표시 크기: ${canvas.style.width} x ${canvas.style.height}`);
console.log(`중앙 좌표: ${canvas.width/2}, ${canvas.height/2}`);

// i18n 문제 체크
if (typeof getI18nText !== 'function') {
    console.warn('i18n 시스템이 로드되지 않음');
    return fallbackText;
}

// 입력 좌표 변환 검증
console.log(`마우스 이벤트: (${event.clientX}, ${event.clientY})`);
console.log(`Canvas 좌표: (${canvasX}, ${canvasY})`);
console.log(`스케일 비율: ${this.displayScale.x}`);

// Card 인스턴스 검증
if (!(card instanceof Card)) {
    console.error('Card 인스턴스가 아닙니다:', card);
    return;
}
```

### 6. **성능 최적화 원칙**
```javascript
// requestAnimationFrame 활용
gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
}

// Canvas 업데이트 최소화
if (this.needsRedraw) {
    this.render();
    this.needsRedraw = false;
}

// 이벤트 핸들러 최적화
const throttledResize = throttle(() => this.handleResize(), 100);
window.addEventListener('resize', throttledResize);
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.


      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.