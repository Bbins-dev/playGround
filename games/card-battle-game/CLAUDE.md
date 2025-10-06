# Card Battle Game - Development Rules

## 🔴 핵심 원칙

### 1. Configuration-Driven (하드코딩 금지!)
**모든 설정값은 GameConfig에서 관리**

```javascript
// ❌ 금지
color: '#FF6B6B', await this.wait(300), canvas.width = 750

// ✅ 필수
color: GameConfig.colors.effects.burn
await this.wait(GameConfig.timing.cards.delay)
canvas.width = GameConfig.canvas.width
```

**CSS도 변수 사용**: `width: var(--card-width)`

### 2. 다국어 필수 (3개 언어)
- **ko.json, en.json, ja.json** 모두 업데이트
- 마커 사용: `{buff:strength}`, `{status:burn}`, `{fire}`
- 언어팩 키: `snake_case`, 코드: `camelCase`

### 3. 안전한 코딩
```javascript
// Optional Chaining + 기본값 필수
const value = GameConfig?.section?.property || defaultValue;

// 상태 검증: turnsLeft 체크 필수
hasStatusEffect(type) {
    return this.statusEffects.some(e => e.type === type && e.turnsLeft > 0);
}
```

## ⚡ 필수 체크리스트

### 버프/상태이상 적용 시
- [ ] 버프 획득 → `hpBarSystem.updateBuffs(user, isPlayer)`
- [ ] 상태이상 → `hpBarSystem.updateStatusEffects(target, isEnemy)`
- [ ] 즉시 효과 → `hpBarSystem.updateHP()` 즉시 호출

### 신규 버프 추가 (4단계)
1. `CardDatabase`: effect에서 `xxxGain` 반환
2. `BattleSystem.processBuffResult()`: xxxGain 처리
3. `HPBarSystem.updateBuffs()`: 버프 라벨 렌더링
4. `Player.updateRuntimeCardStats()`: 곱셈 버프 계산

### 신규 카드 추가
- [ ] 3개 언어팩 업데이트 (이름, 설명)
- [ ] 마커 적용: `{buff:xxx}`, `{status:xxx}`
- [ ] xxxChance 속성 정의 (하드코딩 금지)
- [ ] statusEffect 구조 사용 (통합 시스템)

## 🎮 게임 시스템

### 통합 상태이상 시스템
```javascript
// ✅ 올바른 방식
return {
    statusEffect: {
        type: 'burn',
        chance: this.burnChance,  // 카드 속성 참조
        power: GameConfig.statusEffects.burn.defaultPercent,
        duration: 1
    }
};
```
- 확률/면역/중복 자동 메시지
- `BattleSystem.tryApplyStatusEffect()` 자동 처리

### 오디오 시스템
```javascript
// BGM/SFX 경로 하드코딩 금지
this.audioSystem.playBGM('mainMenu', true, true);
this.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
```

### 카드 렌더링
- `GameConfig.cardStyle`에서 중앙 관리
- CardRenderer + DOMCardRenderer 동시 수정
- 마커 시스템: DescriptionParser.js

### 5속성 상성
불🔥 → 독☠️ → 전기⚡ → 물💧 → 불🔥 + 노멀👊

## 🏗️ GameConfig 구조

### Master Systems (단일 진실의 원천)
- `constants`: scales, opacity, multipliers, probabilities
- `masterColors`: 모든 색상
- `masterFonts`: 모든 폰트
- `masterTiming`: 모든 타이밍

### 주요 섹션
- `canvas`, `colors`, `fonts`, `timing`, `gameRules`
- `cardEffects`: 카드별 설정
- `statusEffects`: 상태이상 정의
- `buffs`: 버프 정의
- `audio`: BGM/SFX 경로

### 자동 CSS 동기화
`GameManager.syncCSSVariables()` → CSS 변수 자동 생성

## ⚠️ 주의사항

### 순환 참조 방지
```javascript
// ❌ 초기화 중 자기 참조
viewport: { minScale: GameConfig.constants.scales.min }

// ✅ Getter 함수 사용
get minScale() { return GameConfig.constants.scales.min; }
```

### 좌표 변환
```javascript
// ✅ 유틸리티 사용
const coords = CanvasUtils.getCanvasCoordinates(event, canvas);
```

### 턴 처리 순서 (변경 금지!)
1. 즉시 해제 (도발, 기절, 얼음)
2. 독/화상 데미지 → 전투종료체크
3. 상태이상 턴수 차감
4. UI 업데이트

## 🚀 Quick Reference

### 서버 실행
```bash
cd games/card-battle-game && npx serve -p 3000
```

### 핵심 파일
- **설정**: `js/config/gameConfig.js`
- **언어**: `js/lang/{ko,en,ja}.json`
- **시스템**: `js/core/BattleSystem.js`, `GameManager.js`
- **UI**: `js/ui/HPBarSystem.js`, `EffectSystem.js`

### 새 기능 추가 워크플로우
1. Master Systems에서 재사용 가능한 값 찾기
2. 필요시 GameConfig에 설정 추가
3. Getter 함수로 순환참조 방지
4. 3개 언어팩 업데이트
5. CSS 변수 활용

**Remember: Configuration-driven, 3-language support, safe coding**
