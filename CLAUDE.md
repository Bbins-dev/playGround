# CLAUDE.md - Card Battle Game Development Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔴 절대 규칙 (CRITICAL - 반드시 준수!)

### 🚨 NO HARDCODING - Configuration-Driven Development
**모든 수치는 GameConfig에서 관리 - 예외 없음!**

❌ **금지된 하드코딩 패턴들**:
```javascript
// 색상, 크기, 위치, 폰트 하드코딩 금지
color: '#FF6B6B'                             // ❌
color: GameConfig.colors.effects.burn        // ✅

canvas.width = 750;                          // ❌
canvas.width = GameConfig.canvas.width;      // ✅

ctx.font = '20px Arial';                     // ❌
ctx.font = `${GameConfig.fonts.sizes.large}px ${GameConfig.fonts.families.main}`; // ✅

await this.wait(300);                        // ❌
await this.wait(GameConfig.timing.cards.repeatDelay); // ✅
```

❌ **CSS 하드코딩도 금지**:
```css
/* 절대 금지 */
.card { width: 260px; font-size: 16px; color: #fff; }

/* 올바른 방식 - CSS 변수 사용 */
.card {
    width: var(--card-preview-width);
    font-size: var(--font-size-medium);
    color: var(--color-text-primary);
}
```

**✅ Configuration-Driven 시스템**:
```
GameConfig.js (colors, fonts, timing, gameRules, etc.)
    ↓
GameManager.syncCSSVariables()
    ↓
CSS Variables (자동 동기화)
    ↓
모든 UI 즉시 반영
```

### 🎯 템플릿 기반 동적 메시지
**모든 동적 텍스트는 GameConfig.fallbackTranslations 또는 언어팩 사용**
- 하드코딩 금지: `'게임 시작'` → `GameConfig.fallbackTranslations['start-game']`
- 상태 메시지: `EffectSystem.showEffectMessage()` 사용

### 🎮 서버 실행 규칙
```bash
cd games/card-battle-game && npx serve -p 3000  # ✅ 항상 게임 디렉토리에서
npx serve                                       # ❌ 루트에서 실행 금지
```

### 🌐 브라우저 테스트 규칙
- ❌ Claude가 임의로 브라우저 테스트 금지
- ✅ 사용자 **직접 요청** 시에만 Playwright 도구 사용
- ✅ 구현 완료 후 "테스트해보세요" 안내만 제공

## 🏗️ GameConfig 구조 (핵심 섹션들)

### Master Systems (Single Source of Truth)
- **constants**: 매직넘버 제거 (scales, opacity, multipliers, limits, probabilities)
- **masterColors**: 모든 색상의 단일 소스 (UI, 상태, 효과, 원소별)
- **masterFonts**: 모든 폰트 설정의 단일 소스 (families, sizes, weights)
- **masterTiming**: 모든 타이밍의 단일 소스 (카드, UI, 전투, 렌더링)

### 필수 섹션들
- **canvas**: 화면 크기 (750×1200)
- **colors**: masterColors 참조하는 getter 함수들
- **fonts**: masterFonts 참조하는 getter 함수들
- **timing**: masterTiming 참조하는 getter 함수들
- **gameRules**: enemy, combat, randomRanges 로직 상수
- **cardEffects**: 카드 효과 시스템 설정 (selfDamage, damage, statusEffect)
- **fallbackTranslations**: 언어팩 실패 시 안전 장치
- **cssVariables**: spacing, borderRadius, shadows, blur

### 자동 CSS 동기화
GameManager.syncCSSVariables()가 모든 GameConfig 값을 CSS 변수로 자동 변환:
- `GameConfig.colors.ui.primary` → `--color-primary`
- `GameConfig.fonts.sizes.large` → `--font-size-large`
- `GameConfig.timing.ui.fadeIn` → `--timing-fade-in`

## ⚠️ 핵심 주의사항

### 1. 순환 참조 방지
```javascript
// ❌ 객체 생성 중 자기 참조 금지
viewport: {
    minScale: GameConfig.constants.scales.min  // ❌ 초기화 에러
}

// ✅ Getter 함수로 런타임 참조
elements: {
    fire: {
        get color() { return GameConfig.masterColors.elements.fire; }
    }
}
```

### 2. 좌표 변환
```javascript
// ❌ 직접 계산 금지
const rect = canvas.getBoundingClientRect();
const x = (event.clientX - rect.left) / scale;

// ✅ 중앙화된 유틸리티 사용
const coords = CanvasUtils.getCanvasCoordinates(event, canvas);
```

### 3. 상태이상 턴 처리 순서 (BattleSystem.endTurn)
1. 즉시 해제 (도발, 기절)
2. 독/화상 데미지 → 전투종료체크
3. 상태이상 턴수 차감
4. UI 업데이트

**⚠️ 순서 변경 시 0턴 상태이상이 화면에 남는 버그 발생**

### 4. 안전한 접근 방식 (Optional Chaining) ⚠️
- **필수**: GameConfig 접근 시 항상 `GameConfig?.section?.property || defaultValue` 사용
- **카드 effect 함수**: 설정값 접근 시 반드시 기본값 제공
- **에러 방지**: try-catch 블록에서 에러 로깅 추가
- **초기화 타이밍 문제 해결**: 동적으로 추가된 설정값도 안전하게 접근

## 🎮 게임 시스템 특성

### 5속성 상성 체계
불🔥 → 독☠️ → 전기⚡ → 물💧 → 불🔥 + 노멀👊

### 자해 데미지 처리 시스템
**카드 실행 순서**: 발동 연출 → 자해 데미지 적용 (명중 여부 무관) → 명중 체크 → 카드 효과
- `selfDamage` 속성만 추가하면 자동 처리
- 자해 데미지는 항상 적용 (Miss여도 HP 차감됨)
- **HP 즉시 반영**: preprocessSelfDamage에서 `hpBarSystem.updateHP()` 즉시 호출
- **중복 방지**: `selfDamageProcessed` 플래그로 processCardResult에서 중복 업데이트 방지
- **표시 방식**: `-10` 형태로만 표시 (텍스트 메시지 없음)

### 중요 규칙들
- **DOM + Canvas 하이브리드**: 게임 로직은 Canvas, UI는 DOM
- **3개 언어 필수 지원**: 한국어(ko.json), 영어(en.json), 일본어(ja.json) 모두 업데이트
- **이중 명중률 체크 금지**: Card.js에서만 처리
- **퍼센트 계산**: 곱셈 방식만 사용 `value * (1 - percent/100)`
- **중앙 통계**: 모든 대미지는 `GameManager.recordDamage()`로만 기록
- **즉시 효과 HP 반영**: 자해/화상/독 등은 효과 발생 즉시 `hpBarSystem.updateHP()` 호출

### GameConfig 접근 규칙
- **안전한 접근 필수**: `GameConfig?.section?.subsection?.property || defaultValue` 사용
- **하드코딩 대신 설정 추가**: 새 기능 추가 시 먼저 GameConfig에 설정값 정의
- **카드 효과 설정**: `cardEffects` 섹션에 카드별 설정 추가 (예: thornArmor.strengthGain)

### 버프/UI 즉시 반영 규칙 ⚠️
- **버프 획득 시 라벨 즉시 업데이트**: `hpBarSystem.updateBuffs(user, isPlayer)` 필수 호출
- **방어 카드 버프**: processDefenseResult에서 버프 처리 후 updateBuffs 호출
- **버프 카드**: processBuffResult에서도 동일하게 처리
- **상태 변경 즉시 반영**: 버프, 디버프, 상태이상 적용 시 관련 UI 즉시 업데이트

### 카드 타입별 메시지 처리
- **defense 타입 카드**: processDefenseResult() → showDefenseGainMessage() (🛡️ 방어력 +N)
- **buff 타입 방어력 증가**: processBuffResult()에서 defenseGain 체크 → showDefenseGainMessage() 직접 호출
- **버프 라벨 vs 즉시 효과**: 지속 버프는 showBuffEffect(), 즉시 방어력 증가는 showDefenseGainMessage()

## 🚀 Quick Development

### 개발 시작
```bash
cd games/card-battle-game && npx serve -p 3000
```

### 새 기능 추가 워크플로우
1. **Master Systems 확인**: constants, masterColors, masterFonts, masterTiming에서 재사용 가능한 값 찾기
2. **기존 설정 재사용**: 새 매직넘버 생성 대신 기존 master 값 활용
3. **필요시만 추가**: master에 없는 경우에만 새 설정값 정의
4. **Getter 함수 사용**: 다른 섹션 참조 시 getter로 순환참조 방지
5. **CSS 변수 활용**: syncCSSVariables()가 자동으로 CSS에 반영
6. **Templates 사용**: 동적 메시지는 fallbackTranslations 또는 언어팩에
7. **Utils 재사용**: CanvasUtils, TextRenderer, ColorUtils 적극 활용

### 제거된 레거시 시스템들
- **handOverlap**: 카드 겹침 설정 (중복 제거됨)
- **defenseUI.bar**: 방어 UI 바 설정 (사용되지 않음)
- **processSelfDamage**: CardDatabase의 레거시 함수 (preprocessSelfDamage로 대체)

### 핵심 파일 위치
- **설정**: `js/config/gameConfig.js` (단일 진실의 원천)
- **언어**: `js/lang/ko.json`, `js/lang/en.json`, `js/lang/ja.json` (3개 언어 필수)
- **시스템**: `js/core/GameManager.js` (CSS 동기화 담당)
- **유틸**: `js/utils/` (좌표변환, 텍스트렌더링, 색상처리)

### 🌐 다국어 지원 규칙
- **필수 언어 3개**: 한국어(ko), 영어(en), 일본어(ja)
- **신규 기능 추가 시**: 3개 언어팩 모두 업데이트 필수
- **언어 파일 경로**:
  - `js/lang/ko.json` - 한국어
  - `js/lang/en.json` - 영어
  - `js/lang/ja.json` - 일본어
- **빠뜨리지 말 것**: 하나라도 누락 시 다국어 지원 실패

**Remember: Configuration-driven development for maximum maintainability - 하드코딩은 절대 금지!**