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

## ⚡ 핵심 체크리스트 (빠뜨리지 말 것!)

### 🎯 버프/상태이상 적용 시 (필수!)
- [ ] **버프 획득** → `hpBarSystem.updateBuffs(user, isPlayer)` 호출
- [ ] **상태이상 적용** → `hpBarSystem.updateStatusEffects(target, isEnemy)` 호출
- [ ] **방어력 변경** → `hpBarSystem.updateHP(unit, isPlayer)` 호출
- [ ] **즉시 효과(독/화상/자해)** → `hpBarSystem.updateHP()` 즉시 호출

**처리 위치**:
- `processDefenseResult()` → 버프 처리 후 `updateBuffs()` 호출
- `processBuffResult()` → 버프 처리 후 `updateBuffs()` 호출
- `tryApplyStatusEffect()` → 자동 처리 (통합 시스템 사용 시)

### 💪 신규 버프 카드 추가 시 (4단계 필수!)
1. **CardDatabase** - effect 함수에서 `xxxGain` 반환 (예: `lithiumGain: 1`)
2. **BattleSystem.processBuffResult()** - `xxxGain` 처리 추가 (`showBuffEffect` 호출)
3. **HPBarSystem.updateBuffs()** - 버프 라벨 렌더링 블록 추가
4. **Player.updateRuntimeCardStats()** - 곱셈 버프인 경우 `buffedPower` 계산 추가

**주의**: CardDatabase에서 `updateBuffs()` 직접 호출 금지 (BattleSystem이 자동 처리)

### 🌐 다국어 필수 업데이트
- [ ] **3개 언어팩 모두 업데이트**: ko.json, en.json, ja.json
- [ ] **언어팩 키 통일**: 모든 언어에서 동일한 키 사용
- [ ] **빠뜨림 방지**: 하나라도 누락 시 다국어 지원 실패

### 📝 카드 설명 작성 시
- [ ] **인라인 라벨 사용**: 버프/상태이상/속성 언급 시 마커 사용
  - 버프: `{buff:strength}` → 💪 힘
  - 상태이상: `{status:burn}` → 🔥 화상
  - 카드타입: `{cardType:attack}` → ⚔️ 공격
  - 방어력: `{defense}` → 🛡️ 방어력
  - 체력: `{hp}` → ❤️ 체력
  - 속성: `{fire}`, `{water}`, `{electric}`, `{poison}`, `{normal}` → 🔥 불, 💧 물, ⚡ 전기, ☠️ 독, 👊 노멀
- [ ] **3개 언어팩에 모두 마커 적용**: 마커는 언어 독립적
- [ ] **단어 경계 주의**: "불굴의" 같은 복합어에는 마커 적용 안됨 (마커 기반 시스템, 자동 치환 아님)

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

### 3. 안전한 접근 방식 (Optional Chaining) ⚠️
- **필수**: GameConfig 접근 시 항상 `GameConfig?.section?.property || defaultValue` 사용
- **카드 effect 함수**: 설정값 접근 시 반드시 기본값 제공
- **에러 방지**: try-catch 블록에서 에러 로깅 추가
- **초기화 타이밍 문제 해결**: 동적으로 추가된 설정값도 안전하게 접근

### 4. JavaScript 네이밍 규칙
- **타입 이름**: camelCase 필수 (`conditionFailed`, `selfDamage`)
- **i18n 키**: snake_case 유지 (`auto_battle_card_game.ui.condition_failed`)
- **GameConfig 속성**: camelCase (`messageTypes.conditionFailed`)
- **타입 vs i18n 키**: 별개의 개념 - 타입은 코드 레벨, i18n은 텍스트 레벨
- **신규 타입 추가 시**: 하드코딩 추가 대신 코드의 타입 이름을 camelCase로 통일

## 🎮 게임 시스템 규칙

### 🎨 카드 이미지 & 렌더링

#### 카드 이미지 통합 관리
**모든 카드 시각적 요소는 GameConfig.cardStyle에서 중앙 관리**

- **통합 렌더링 시스템**: CardRenderer (Canvas) / DOMCardRenderer (DOM) 모두 동일한 설정 참조
- **실시간 스타일 동기화**: getter 패턴으로 캐시 없이 실시간 GameConfig 참조
- **카드 구성 요소 설정**:
  - `fontRatio`: 카드 높이 대비 각 요소 크기 비율
  - `layout`: 각 요소의 위치 비율
  - `elementLabel/elementEmoji`: 속성 표시 설정
  - `activeCardGlow`: 활성 카드 효과
  - `cardColors`: 상태별 색상 변경 규칙

**카드 렌더링 수정 시 필수 확인**:
1. GameConfig.cardStyle에서 설정값 정의
2. CardRenderer와 DOMCardRenderer 둘 다 수정
3. CSS 변수로 자동 동기화되는지 확인

#### 📝 인라인 라벨 시스템 (DescriptionParser)
**카드 설명에 버프/상태이상/카드타입/방어력 언급 시 시각적 라벨 자동 렌더링**

**마커 문법**: `{buff:strength}` `{status:burn}` `{cardType:attack}` `{defense}` `{hp}` `{fire}` 등
- 언어팩 마커 → GameConfig 조회 → 자동 렌더링 (라벨, 툴팁, HPBar)

**신규 요소 추가 시 필수 체크**:
1. **GameConfig 정의**: buffs/statusEffects/elements에 emoji, color, nameKey 추가
2. **언어팩 3개 업데이트**: ko.json, en.json, ja.json (이름, 설명)
3. **카드 설명에 마커 추가**: `"{buff:myBuff} 2를 얻습니다"` (3개 언어 모두)
4. **자동 작동 확인**: 인라인 라벨, 툴팁 모달, HPBar 표시

**핵심 파일**: DescriptionParser.js, CardRenderer.js, DOMCardRenderer.js, BuffStatusTooltipModal.js

### ⚔️ 전투 & 효과 시스템

#### 🔄 통합 상태이상 시스템 (Configuration-Driven)
**모든 상태이상 카드는 통합 시스템 사용 - 하드코딩 금지!**

**❌ 레거시 방식 (금지)**:
```javascript
// 9줄 하드코딩 - 면역 메시지 없음
let burned = false;
const burnRoll = Math.random() * 100;
if (burnRoll < this.burnChance) {
    const result = target.addStatusEffect('burn', 15, 1);
    burned = result.success;
}
return { burned, statusType: burned ? 'burn' : null };
```

**✅ 통합 방식 (필수)**:
```javascript
// 5줄 설정 기반 - 면역/중복/성공 자동 메시지
return {
    statusEffect: {
        type: 'burn',
        chance: this.burnChance,  // ⚠️ this.xxxChance 사용 (하드코딩 금지)
        power: GameConfig.statusEffects.burn.defaultPercent,
        duration: 1
    }
};
```

**핵심 원칙**:
1. **`chance`는 항상 `this.xxxChance` 사용**: 하드코딩(100, 50 등) 금지
2. **카드 정의에 xxxChance 속성 추가**: `burnChance: 100`, `stunChance: 40`
3. **BattleSystem.tryApplyStatusEffect()가 자동 처리**: 확률체크 + 면역체크 + 메시지 표시
4. **면역 시 자동 메시지**: `"🔥 화상 면역!"` (사용자 피드백 보장)

**statusEffect 구조**:
```javascript
{
    type: 'burn' | 'stun' | 'poisoned' | 'paralysis' | 'taunt' | 'sand' | 'insult' | 'slow' | 'chains',
    chance: this.xxxChance,  // 카드 속성 참조 (필수!)
    power: GameConfig.statusEffects.xxx.defaultPercent || null,
    duration: 1  // 턴 수
}
```

**적용 카드 목록 (14개)**:
- **공격 카드**: concussion, flame_throw, smog, fireball, karura_strike, flame_burst, flame_ascension
- **상태이상 카드**: taunt, push_back, sand_throw, hot_breath, insult, net_throw, oil_pour, chains_of_fire, lava_prison, powder_keg

#### 🔄 상태이상 턴 처리 순서 (BattleSystem.endTurn)
**⚠️ 순서 변경 시 0턴 상태이상이 화면에 남는 버그 발생**

1. 즉시 해제 (도발, 기절)
2. 독/화상 데미지 → 전투종료체크
3. 상태이상 턴수 차감
4. UI 업데이트

#### 💉 자해 데미지 처리 시스템
**카드 실행 순서**: 발동 연출 → 자해 데미지 적용 (명중 여부 무관) → 명중 체크 → 카드 효과

- `selfDamage` 속성만 추가하면 자동 처리
- 자해 데미지는 항상 적용 (Miss여도 HP 차감됨)
- **HP 즉시 반영**: preprocessSelfDamage에서 `hpBarSystem.updateHP()` 즉시 호출
- **중복 방지**: `selfDamageProcessed` 플래그로 processCardResult에서 중복 업데이트 방지
- **표시 방식**: `-10` 형태로만 표시 (텍스트 메시지 없음)

#### 💬 카드 타입별 메시지 처리
- **defense 타입 카드**: processDefenseResult() → showDefenseGainMessage() (🛡️ 방어력 +N)
- **buff 타입 방어력 증가**: processBuffResult()에서 defenseGain 체크 → showDefenseGainMessage() 직접 호출
- **버프 라벨 vs 즉시 효과**: 지속 버프는 showBuffEffect(), 즉시 방어력 증가는 showDefenseGainMessage()

#### 🔥 5속성 상성 체계
불🔥 → 독☠️ → 전기⚡ → 물💧 → 불🔥 + 노멀👊

### 🔊 오디오 시스템 (Configuration-Driven Audio)
**모든 오디오는 GameConfig.audio에서 중앙 관리 - 하드코딩 금지!**

#### 핵심 원칙
- **경로 하드코딩 금지**: 모든 BGM/SFX 경로는 `GameConfig.audio.bgm/sfx`에 정의
- **UI 이벤트 매핑**: `GameConfig.audio.uiSounds`에서 이벤트별 SFX 관리
- **안전한 호출**: Optional Chaining + 폴백값 필수

#### ❌ 잘못된 패턴
```javascript
audio.src = 'assets/audio/bgm/main_menu.mp3';  // ❌ 경로 하드코딩
this.audioSystem.playSFX('click');             // ❌ 직접 키 하드코딩
```

#### ✅ 올바른 패턴
```javascript
// BGM 재생
this.audioSystem.playBGM('mainMenu', true, true);

// SFX 재생 (UI 이벤트)
this.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');

// SFX 재생 (직접 키 사용)
this.audioSystem.playSFX('attackHit');
```

#### 주요 기능
- **BGM 스택 관리**: 카드 갤러리 등에서 이전 BGM 자동 복원
  - `pauseAndSaveBGM()` → 현재 BGM 일시정지 및 저장
  - `restorePreviousBGM()` → 이전 BGM 복원
- **자동 BGM 선택**: `getBattleBGM(stage)` - 스테이지별 일반/보스 BGM 자동 선택
- **페이드 효과**: 모든 BGM 전환에 페이드 인/아웃 적용
- **프리로딩**: 게임 시작 시 모든 오디오 파일 사전 로딩

#### GameConfig.audio 구조
- **bgm**: BGM 파일 경로 (mainMenu, normalBattle, bossBattle, victoryModal, gameOver, cardGallery)
- **sfx**: 효과음 파일 경로 (attack, defense, buff, UI sounds)
- **volume**: 볼륨 설정 (master, bgm, sfx)
- **fade**: 페이드 효과 타이밍 (duration, crossfade)
- **uiSounds**: UI 이벤트별 SFX 매핑 (buttonClick, nameModal, victoryModal 등)
- **bossStage**: 보스 스테이지 판정 규칙 (interval: 10의 배수)

#### 신규 UI에 사운드 추가 시
1. GameConfig.audio.sfx에 SFX 파일 경로 추가
2. GameConfig.audio.uiSounds에 이벤트 매핑 추가 (선택)
3. UI 컴포넌트에서 `playSFX()` 호출

### 📋 중요 규칙 모음
- **3개 언어 필수 지원**: 한국어(ko.json), 영어(en.json), 일본어(ja.json) 모두 업데이트
- **이중 명중률 체크 금지**: Card.js에서만 처리
- **퍼센트 계산**: 곱셈 방식만 사용 `value * (1 - percent/100)`
- **중앙 통계**: 모든 대미지는 `GameManager.recordDamage()`로만 기록
- **즉시 효과 HP 반영**: 자해/화상/독 등은 효과 발생 즉시 `hpBarSystem.updateHP()` 호출

### ⚙️ GameConfig 접근 규칙
- **안전한 접근 필수**: `GameConfig?.section?.subsection?.property || defaultValue` 사용
- **하드코딩 대신 설정 추가**: 새 기능 추가 시 먼저 GameConfig에 설정값 정의
- **카드 효과 설정**: `cardEffects` 섹션에 카드별 설정 추가 (예: thornArmor.strengthGain)

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