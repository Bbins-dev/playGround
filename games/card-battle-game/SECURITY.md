# 🔒 보안 가이드 - 자동 버전 업데이트 시스템

## 📋 보안 개요

이 프로젝트의 자동 버전 업데이트 시스템은 **다층 보안 구조**를 통해 무단 접근과 조작을 방지합니다.

---

## 🛡️ 보안 계층 구조

### 1. 키 분리 전략 (Key Separation)

#### anon key (공개 키)
- **위치**: `js/config/gameConfig.js`
- **용도**: 클라이언트(브라우저)에서 사용
- **권한**: **읽기 전용** (SELECT만 가능)
- **노출**: Git에 포함 (공개 가능)

```javascript
// gameConfig.js
leaderboard: {
    supabaseUrl: 'https://yexxudclxvqmwbjjpxsx.supabase.co',
    supabaseAnonKey: 'eyJhbGc...',  // 공개 키 (읽기 전용)
}
```

#### service_role key (비밀 키)
- **위치**: `.env` 파일 (Git 제외)
- **용도**: 서버측 스크립트(`update-version.js`)에서만 사용
- **권한**: **모든 작업 가능** (RLS 무시)
- **노출**: ❌ **절대 Git에 커밋되지 않음**

```bash
# .env (Git 제외)
SUPABASE_SERVICE_KEY=eyJhbGc...  # 비밀 키 (관리자 권한)
```

---

### 2. Row Level Security (RLS) 정책

#### 읽기 허용 정책
```sql
-- 모든 사용자(public)에게 읽기 권한 허용
CREATE POLICY "Enable read access for all users"
ON app_version FOR SELECT
TO public
USING (true);
```

#### 쓰기 거부 정책 (방어적 보안)
```sql
-- anon 사용자는 UPDATE 불가능
CREATE POLICY "Deny UPDATE for anon users"
ON app_version FOR UPDATE
TO anon
USING (false);

-- anon 사용자는 INSERT 불가능
CREATE POLICY "Deny INSERT for anon users"
ON app_version FOR INSERT
TO anon
WITH CHECK (false);

-- anon 사용자는 DELETE 불가능
CREATE POLICY "Deny DELETE for anon users"
ON app_version FOR DELETE
TO anon
USING (false);
```

**효과**:
- ✅ anon key로는 SELECT만 가능
- ❌ UPDATE/INSERT/DELETE 모두 차단
- ✅ service_role key는 RLS를 무시하므로 모든 작업 가능

---

### 3. 클라이언트 코드 안전성

#### VersionChecker.js (읽기 전용)
```javascript
async checkVersion() {
    // SELECT만 수행 (읽기 전용)
    const { data, error } = await this.supabase
        .from('app_version')
        .select('version')  // ✅ SELECT만
        .limit(1)
        .single();

    // 버전 비교 후 새로고침만
    if (latestVersion !== this.currentVersion) {
        window.location.reload(true);
    }
}
```

**보안 특징**:
- ✅ UPDATE/INSERT/DELETE 코드 없음
- ✅ 해커가 브라우저 콘솔에서 코드를 수정해도 anon key로는 쓰기 불가능
- ✅ 최악의 경우 사용자 자신의 브라우저만 새로고침 (서버 무결성 유지)

---

### 4. 환경 변수 보호

#### .gitignore
```bash
# 환경 변수 및 시크릿
.env
.env.*
*.secret
*.secrets
config.local.*
```

**효과**:
- ✅ service_role key가 Git에 노출되지 않음
- ✅ GitHub, 공개 저장소에 비밀 키 유출 방지

#### .env.example (템플릿)
```bash
# .env.example (Git 포함 가능)
SUPABASE_URL=https://yexxudclxvqmwbjjpxsx.supabase.co
SUPABASE_SERVICE_KEY=여기에_service_role_키를_붙여넣으세요
```

**용도**:
- 다른 개발자에게 필요한 환경 변수 구조 공유
- 실제 키는 포함하지 않음

---

## 🎯 공격 시나리오 분석

### 시나리오 1: 해커가 브라우저 콘솔에서 버전 변경 시도

**공격 코드 예시**:
```javascript
// 브라우저 콘솔에서 시도
const supabase = window._supabaseInstance;
await supabase.from('app_version').update({ version: '999.999.999' }).eq('id', 1);
```

**결과**: ❌ **실패**
```
Error: new row violates row-level security policy for table "app_version"
```

**이유**: anon key는 UPDATE 권한이 없음

---

### 시나리오 2: 해커가 anon key를 탈취

**공격 시도**:
```bash
curl -X PATCH 'https://yexxudclxvqmwbjjpxsx.supabase.co/rest/v1/app_version?id=eq.1' \
  -H "apikey: <탈취한_anon_key>" \
  -H "Authorization: Bearer <탈취한_anon_key>" \
  -d '{"version": "999.999.999"}'
```

**결과**: ❌ **실패**
```json
{"code":"42501","message":"new row violates row-level security policy"}
```

**이유**: RLS 정책이 anon 역할의 UPDATE를 차단

---

### 시나리오 3: 해커가 service_role key를 탈취 (최악의 경우)

**결과**: ⚠️ **성공 (모든 권한 획득)**

**방어 방법**:
1. ✅ `.env` 파일을 절대 Git에 커밋하지 않음
2. ✅ 서버 환경에서만 사용 (클라이언트 노출 금지)
3. ✅ 정기적으로 키 교체 (Supabase 대시보드에서 가능)
4. ✅ Supabase 프로젝트 접근 로그 모니터링

---

## ✅ 보안 체크리스트

개발자가 준수해야 할 보안 원칙:

### 개발 단계
- [ ] `.env` 파일 생성 후 즉시 `.gitignore` 확인
- [ ] service_role key는 서버측 스크립트에만 사용
- [ ] anon key는 클라이언트 코드에만 사용
- [ ] 클라이언트 코드에 UPDATE/INSERT/DELETE 로직 추가 금지

### 배포 단계
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] `git log --all --full-history -- .env` 실행하여 과거 이력 확인
- [ ] Supabase RLS 정책이 활성화되어 있는지 확인

### 유지보수 단계
- [ ] 정기적으로 Supabase 접근 로그 확인
- [ ] 의심스러운 활동 발견 시 즉시 키 교체
- [ ] 팀원 퇴사 시 service_role key 교체

---

## 🔍 보안 검증 방법

### 1. RLS 정책 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM pg_policies WHERE tablename = 'app_version';
```

**예상 결과**: 4개의 정책
- `Enable read access for all users` (SELECT 허용)
- `Deny UPDATE for anon users` (UPDATE 거부)
- `Deny INSERT for anon users` (INSERT 거부)
- `Deny DELETE for anon users` (DELETE 거부)

### 2. anon key로 UPDATE 시도 (실패해야 정상)
```javascript
// 브라우저 콘솔에서 테스트
const { data, error } = await window._supabaseInstance
    .from('app_version')
    .update({ version: '999.999.999' })
    .eq('id', 1);

console.log(error);  // RLS 에러 발생해야 정상
```

### 3. .env 파일 Git 이력 확인
```bash
# .env가 한 번도 커밋되지 않았어야 함
git log --all --full-history -- .env
```

**예상 결과**: `fatal: ambiguous argument '.env': unknown revision`

---

## 📚 참고 자료

### Supabase 보안 문서
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API Keys](https://supabase.com/docs/guides/api#api-keys)
- [Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)

### 프로젝트 파일
- `.sqlscripts/app_version_security_hardening.sql` - RLS 정책 SQL
- `js/systems/VersionChecker.js` - 클라이언트 버전 체크 로직
- `update-version.js` - 서버측 버전 업데이트 로직

---

## 🚨 보안 사고 대응

### service_role key 유출 시
1. **즉시 Supabase 대시보드 접속**
2. **Settings > API > Reset service_role key**
3. **로컬 `.env` 파일 업데이트**
4. **팀원들에게 새 키 공유 (안전한 채널 사용)**
5. **Supabase Logs에서 의심스러운 활동 확인**

### anon key 노출 시
- ✅ **문제 없음** (공개 키이므로 원래 노출 가능)
- ℹ️ RLS 정책이 쓰기를 차단하므로 안전

---

## 💡 추가 보안 권장사항

### 1. IP 화이트리스트 (선택사항)
Supabase Dashboard > Settings > Database > Restrictions
- 특정 IP에서만 service_role 접근 허용

### 2. 키 교체 주기
- 권장: 6개월마다 service_role key 교체
- 팀원 변동 시 즉시 교체

### 3. 모니터링
- Supabase Logs에서 비정상적인 UPDATE 시도 확인
- Rate limiting 설정 (Supabase 유료 플랜)

---

**최종 업데이트**: 2025-11-14
**버전**: 1.0.0
**작성자**: Card Battle Game Development Team
