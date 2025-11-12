# Supabase 리더보드 설정 가이드

## 300만 위 제한 자동 삭제 설정

리더보드에서 상위 300만 위까지만 유지하고, 그 이하 순위는 자동으로 삭제하는 데이터베이스 트리거를 설정합니다.

### 1. Supabase 대시보드 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. SQL 코드 실행

#### 📋 복사할 코드 (여기서부터 👇)

**아래 `CREATE`부터 마지막 세미콜론 `;`까지 전체를 복사하세요:**

```sql
CREATE OR REPLACE FUNCTION cleanup_old_leaderboard_entries()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM leaderboard
    WHERE id NOT IN (
        SELECT id FROM leaderboard
        ORDER BY
            is_game_complete DESC,
            final_stage DESC,
            total_turns ASC,
            total_damage_dealt ASC,
            total_damage_received DESC
        LIMIT 3000000
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_leaderboard ON leaderboard;

CREATE TRIGGER trigger_cleanup_leaderboard
AFTER INSERT ON leaderboard
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_old_leaderboard_entries();
```

**👆 여기까지 복사**

---

#### 🔧 실행 방법

1. **위 SQL 코드 전체 복사** (첫 번째 `CREATE`부터 마지막 `;`까지)
2. **Supabase SQL Editor**에 붙여넣기
3. **Run** 버튼 클릭

#### ⚠️ 경고 메시지가 나타납니다 (정상입니다!)

다음과 같은 경고가 표시됩니다:

```
Potential issue detected with your query
Query has destructive operation
```

**👉 이것은 정상입니다!** DELETE 문이 포함되어 있어서 나타나는 경고입니다.

**"Run this query" 버튼을 클릭하세요.** ✅

---

### 3. 실행 결과 확인

SQL 실행이 성공하면 다음 메시지가 표시됩니다:

```
Success. No rows returned
```

또는

```
Success
```

### 4. 동작 원리

#### **트리거 실행 시점**
- 새로운 기록이 `leaderboard` 테이블에 삽입될 때마다 자동 실행
- `FOR EACH STATEMENT` 방식으로 효율적 처리 (대량 삽입 시에도 1회만 실행)

#### **정렬 기준 (5단계)**
1. **게임 완료 여부** (`is_game_complete`): 완료 > 미완료
2. **최종 스테이지** (`final_stage`): 높을수록 상위
3. **총 턴수** (`total_turns`): 적을수록 상위
4. **가한 피해** (`total_damage_dealt`): 적을수록 상위
5. **받은 피해** (`total_damage_received`): 많을수록 상위

#### **삭제 대상**
- 상위 300만 위 이외의 모든 기록
- 매 삽입 시마다 자동으로 정리됨

### 5. 성능 최적화 (권장)

300만 건의 데이터를 정렬하는 것은 시간이 걸릴 수 있습니다. 아래 인덱스를 추가하면 쿼리 속도가 크게 향상됩니다.

```sql
-- 5단계 정렬을 위한 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking
ON leaderboard (
    is_game_complete DESC,
    final_stage DESC,
    total_turns ASC,
    total_damage_dealt ASC,
    total_damage_received DESC
);
```

### 6. 테스트

트리거가 제대로 작동하는지 확인하려면:

1. **SQL Editor**에서 다음 쿼리 실행:
```sql
-- 현재 레코드 수 확인
SELECT COUNT(*) as total_records FROM leaderboard;
```

2. 게임에서 새 기록 제출

3. 다시 레코드 수 확인하여 300만 위를 초과하지 않는지 확인

### 7. 문제 해결

#### 트리거가 작동하지 않는 경우

1. **트리거 존재 확인**:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_cleanup_leaderboard';
```

2. **함수 존재 확인**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'cleanup_old_leaderboard_entries';
```

3. **트리거 재생성**:
   - 위 Step 1-2의 SQL 코드를 다시 실행

#### 인덱스가 생성되었는지 확인

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'leaderboard';
```

### 8. 주의사항

⚠️ **트리거는 데이터베이스 레벨에서 실행됩니다**
- RLS (Row Level Security) 정책과 무관하게 작동
- 클라이언트 코드 변경 불필요
- 서버 재시작 불필요

⚠️ **대량 삽입 시 성능**
- `FOR EACH STATEMENT` 방식으로 효율적 처리
- 1000개 삽입해도 트리거는 1번만 실행

⚠️ **백업 권장**
- 중요한 데이터가 있다면 트리거 설정 전 백업 추천
- Supabase 대시보드 > Database > Backups 에서 수동 백업 가능

---

## GameConfig 설정 (참고용)

클라이언트 코드의 `GameConfig`에는 다음 설정이 추가되었습니다:

```javascript
// js/config/gameConfig.js
leaderboard: {
    pageSize: 20,
    maxRank: 3000000,           // 최대 300만 위까지 유지
    pagination: {
        jumpSize: 10            // 10페이지 단위 이동
    }
}
```

이 설정은 **클라이언트 UI 표시용**이며, 실제 데이터 삭제는 **Supabase 트리거**에서 처리됩니다.

---

## 추가 정보

### 리더보드 데이터 크기
- **1인당 데이터**: 약 142 bytes (데이터 + 인덱스)
- **300만명 총 용량**: 약 426 MB
- **Supabase 무료 플랜**: 500 MB (기본 오버헤드 약 26MB 포함)

### 순위 표시
- 클라이언트에서는 페이지네이션으로 20개씩 표시
- [맨처음] [←10] [이전] x/x [다음] [10→] [맨끝] 버튼 지원
- 3개 언어 지원 (한국어, 영어, 일본어)

---

**설정 완료!** 이제 리더보드가 자동으로 상위 300만 위까지만 유지됩니다. 🎉
