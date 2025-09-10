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