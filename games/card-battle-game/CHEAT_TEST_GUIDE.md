# 🔒 치트 방지 시스템 테스트 가이드

## 📋 테스트 개요
이 문서는 게임의 치트 방지 시스템이 올바르게 작동하는지 검증하기 위한 테스트 가이드입니다.

## 🧪 테스트 환경 설정

1. 게임 서버 실행:
   ```bash
   cd games/card-battle-game
   npx serve -p 3000
   ```

2. 브라우저에서 `http://localhost:3000` 열기

3. 브라우저 개발자 도구 열기 (F12 또는 Cmd+Option+I)

4. Console 탭 이동

---

## 🎯 테스트 시나리오

### ✅ Test 1: 무한 다시뽑기 방지

**목적**: `rerollsRemaining`을 WeakMap으로 보호하여 직접 접근 차단

**테스트 절차**:
1. 게임 시작 → 스테이지 클리어
2. 승리 모달에서 카드 보상 화면 진입
3. 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 접근 시도 (실패해야 정상)
   window.gameManager.victoryDefeatModal.rerollsRemaining = 999
   ```

**예상 결과**:
- `undefined` 또는 아무 효과 없음 (WeakMap으로 보호되어 직접 접근 불가)
- 다시뽑기 버튼 클릭 시 여전히 1회만 가능

**검증 방법**:
```javascript
// 실제 값 확인 (undefined 반환)
console.log(window.gameManager.victoryDefeatModal.rerollsRemaining)
// undefined

// Getter로만 접근 가능
console.log(window.gameManager.victoryDefeatModal.getRerollsRemaining())
// 정상적인 숫자 반환 (0 or 1)
```

---

### ✅ Test 2: HP 조작 방지

**목적**: 플레이어/적 HP 범위 검증으로 비정상 값 감지

**테스트 절차**:
1. 게임 전투 중에 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ HP 조작 시도
   window.gameManager.player.hp = 9999
   ```

2. 2초 대기 (무결성 검사 주기)

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED] 게임 무결성 위반:` 메시지 출력
- 자동으로 메인 메뉴로 복귀 (안전 상태 복원)

**검증 로그**:
```
[CHEAT DETECTED] 게임 무결성 위반: ["Player HP 비정상: 9999 (최대: 150)"]
게임을 안전한 상태로 복원 중...
```

---

### ✅ Test 3: 손패 크기 초과 방지

**목적**: 손패 크기 제한 검증

**테스트 절차**:
1. 게임 전투 중에 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 손패 무한 추가 시도
   for (let i = 0; i < 20; i++) {
       window.gameManager.player.hand.push(CardDatabase.createCardInstance('bash'))
   }
   ```

2. 2초 대기

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED]` 메시지
- 손패 크기 초과 경고 후 메인 메뉴로 복귀

**검증 로그**:
```
[CHEAT DETECTED] 게임 무결성 위반: ["손패 크기 초과: 20 (최대: 15)"]
```

---

### ✅ Test 4: 스테이지 스킵 방지

**목적**: 스테이지 번호 검증

**테스트 절차**:
1. 게임 중에 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 스테이지 조작 시도
   window.gameManager.currentStage = 999
   ```

2. 2초 대기

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED]` 메시지
- 스테이지 번호 비정상 경고 후 메인 메뉴로 복귀

**검증 로그**:
```
[CHEAT DETECTED] 게임 무결성 위반: ["스테이지 번호 비정상: 999 (범위: 1-100)"]
```

---

### ✅ Test 5: 버튼 강제 활성화 방지 (DOM 무결성)

**목적**: DOM 조작 시도를 감지하고 자동 복구

**테스트 절차**:
1. 게임 시작 → 스테이지 클리어
2. 승리 모달에서 다시뽑기 1회 사용 (남은 횟수 0)
3. 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 버튼 강제 활성화 시도
   document.getElementById('victory-reroll').disabled = false
   document.getElementById('victory-reroll').classList.remove('disabled')
   ```

4. 1초 대기 (DOM 검사 주기)

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED] Re-roll 버튼 상태 복구 시도` 메시지
- 버튼이 자동으로 다시 비활성화됨

**검증 방법**:
```javascript
// 버튼 상태 확인
console.log(document.getElementById('victory-reroll').disabled)
// true (자동 복구됨)
```

---

### ✅ Test 6: GameConfig/CardDatabase 변조 방지

**목적**: Deep Freeze로 설정 데이터 보호

**테스트 절차**:
1. 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ GameConfig 변조 시도
   GameConfig.player.maxHP = 9999

   // ❌ CardDatabase 변조 시도
   CardDatabase.cards.bash.power = 9999
   ```

**예상 결과**:
- 변경 시도가 무시됨 (strict mode에서는 에러 발생)
- 값이 변경되지 않음

**검증 방법**:
```javascript
console.log(GameConfig.player.maxHP)
// 원래 값 그대로 (100)

console.log(CardDatabase.cards.bash.power)
// 원래 값 그대로 (8)

// Frozen 확인
console.log(Object.isFrozen(GameConfig))
// true
```

---

### ✅ Test 7: 버프 수치 조작 방지

**목적**: 비정상적인 버프 수치 감지

**테스트 절차**:
1. 게임 전투 중에 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 버프 수치 조작 시도
   window.gameManager.player.strength = 999
   ```

2. 2초 대기

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED]` 메시지
- 버프 수치 비정상 경고 후 메인 메뉴로 복귀

**검증 로그**:
```
[CHEAT DETECTED] 게임 무결성 위반: ["버프 수치 비정상 (strength): 999 (최대: 100)"]
```

---

### ✅ Test 8: 전투 상태 조작 방지

**목적**: 전투 상태 논리 검증

**테스트 절차**:
1. 게임 전투 중에 콘솔에서 다음 명령어 입력:
   ```javascript
   // ❌ 전투 강제 종료 시도
   window.gameManager.battleSystem.battlePhase = 'ended'
   ```

2. 2초 대기

**예상 결과**:
- 콘솔에 `[CHEAT DETECTED]` 메시지
- 전투 상태 비정상 경고 후 메인 메뉴로 복귀

**검증 로그**:
```
[CHEAT DETECTED] 게임 무결성 위반: ["전투 상태 비정상: 양측 모두 생존 중인데 전투 종료됨"]
```

---

## 📊 테스트 체크리스트

- [ ] Test 1: 무한 다시뽑기 방지 ✅
- [ ] Test 2: HP 조작 방지 ✅
- [ ] Test 3: 손패 크기 초과 방지 ✅
- [ ] Test 4: 스테이지 스킵 방지 ✅
- [ ] Test 5: 버튼 강제 활성화 방지 ✅
- [ ] Test 6: GameConfig/CardDatabase 변조 방지 ✅
- [ ] Test 7: 버프 수치 조작 방지 ✅
- [ ] Test 8: 전투 상태 조작 방지 ✅

---

## 🔧 설정 조정

### 보안 강도 조절

GameConfig에서 보안 설정 조절 가능:

```javascript
// js/config/gameConfig.js

security: {
    integrityCheckInterval: 2000,       // 무결성 검사 주기 (ms)
    domCheckInterval: 1000,             // DOM 검사 주기 (ms)
    maxHPTolerance: 50,                 // HP 초과 허용치
    maxHandSizeTolerance: 5,            // 손패 크기 허용치
    maxBuffValue: 100,                  // 최대 버프 수치
    maxStageNumber: 100,                // 최대 스테이지 번호
    enableIntegrityCheck: true          // 검사 활성화 여부
}
```

---

## ⚠️ 주의사항

1. **코드 수정 시**: 소스코드 수정은 정상 동작 - 치트 방지 시스템은 런타임 조작만 차단
2. **개발 테스트**: 보안 기능이 개발에 방해되지 않도록 설계됨
3. **완전한 보안**: 클라이언트 게임의 한계로 완전 차단은 불가능 - 진입 장벽 상향이 목표
4. **성능 영향**: 주기적 검사로 인한 성능 영향은 미미함 (2초/1초 주기)

---

## 🎉 성공 기준

모든 테스트 케이스에서:
- ✅ 치트 시도가 감지됨
- ✅ 적절한 경고 메시지 출력
- ✅ 자동 복구 또는 안전 상태 복원
- ✅ 게임 플레이에 영향 없음

---

## 📝 테스트 완료 후

모든 테스트 통과 시:
1. 체크리스트 완료 표시
2. 발견된 이슈 기록 (있다면)
3. git commit으로 변경사항 저장

```bash
git add .
git commit -m "feat: 치트 방지 시스템 구현 및 검증 완료

- Deep Freeze로 GameConfig/CardDatabase 보호
- 무결성 검사 강화 (HP, 손패, 버프, 스테이지)
- WeakMap으로 rerollsRemaining 보호
- DOM 무결성 검사 추가 (버튼 상태 자동 복구)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```
