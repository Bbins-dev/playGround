-- ============================================
-- app_version 테이블 보안 강화 정책
-- ============================================
--
-- 목적: anon 사용자(클라이언트)가 버전 정보를 수정하지 못하도록 명시적으로 차단
--
-- 배경:
-- - RLS 활성화 시 명시적 허용 정책이 없으면 기본적으로 거부되지만,
-- - 방어적 프로그래밍 차원에서 명시적 거부 정책을 추가
-- - service_role 키는 RLS를 무시하므로 update-version.js에서만 UPDATE 가능
--
-- 참고:
-- - anon key: 클라이언트에서 사용 (읽기 전용)
-- - service_role key: 서버에서만 사용 (.env 파일, Git 제외)
-- ============================================

-- 1. UPDATE 거부: anon 사용자는 버전 정보를 변경할 수 없음
DROP POLICY IF EXISTS "Deny UPDATE for anon users" ON app_version;
CREATE POLICY "Deny UPDATE for anon users"
ON app_version FOR UPDATE
TO anon
USING (false);  -- 항상 거부

-- 2. INSERT 거부: anon 사용자는 새 버전 레코드를 추가할 수 없음
DROP POLICY IF EXISTS "Deny INSERT for anon users" ON app_version;
CREATE POLICY "Deny INSERT for anon users"
ON app_version FOR INSERT
TO anon
WITH CHECK (false);  -- 항상 거부

-- 3. DELETE 거부: anon 사용자는 버전 레코드를 삭제할 수 없음
DROP POLICY IF EXISTS "Deny DELETE for anon users" ON app_version;
CREATE POLICY "Deny DELETE for anon users"
ON app_version FOR DELETE
TO anon
USING (false);  -- 항상 거부

-- 4. 기존 SELECT 정책 확인 (이미 존재하므로 생성하지 않음)
-- CREATE POLICY "Enable read access for all users"
-- ON app_version FOR SELECT
-- TO public
-- USING (true);

-- ============================================
-- 검증 쿼리
-- ============================================
-- SELECT 정책 확인
-- SELECT * FROM app_version;  -- ✅ anon key로 실행 가능

-- UPDATE 정책 확인 (실행하면 에러 발생해야 함)
-- UPDATE app_version SET version = '999.999.999' WHERE id = 1;  -- ❌ anon key로 실행 불가능

-- ============================================
-- 보안 요약
-- ============================================
-- ✅ 클라이언트 (anon key): SELECT만 가능
-- ✅ 서버 (service_role key): 모든 작업 가능 (RLS 무시)
-- ✅ .env 파일: .gitignore로 Git 노출 차단
-- ✅ 해커가 브라우저 콘솔에서 시도해도 UPDATE 불가능
-- ============================================
