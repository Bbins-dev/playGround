# 버전 관리 가이드

## 🔢 버전 업데이트 방법

### ✅ 권장 방법: npm 스크립트 사용

버전을 업데이트할 때는 **항상 npm 스크립트**를 사용하세요:

```bash
# 패치 버전 업데이트 (0.3.18 → 0.3.19)
npm run bump

# 마이너 버전 업데이트 (0.3.18 → 0.4.0)
npm run bump:minor

# 메이저 버전 업데이트 (0.3.18 → 1.0.0)
npm run bump:major
```

### 🔄 자동으로 업데이트되는 파일

위 명령을 실행하면 다음 파일들이 **자동으로** 업데이트됩니다:

1. **package.json** - `version` 필드
2. **js/config/gameConfig.js** - `versionInfo.number` 필드
3. **index.html** - 모든 스크립트 태그의 `?v=` 쿼리 파라미터 (34개)
4. **Git 커밋** - 자동으로 커밋 생성
5. **Git 태그** - 버전 태그 자동 생성

### ❌ 하지 말아야 할 것

**절대로 package.json을 수동으로 편집하지 마세요!**

```bash
# ❌ 이렇게 하지 마세요:
# package.json을 열어서 "version": "0.3.19"로 변경

# ✅ 대신 이렇게 하세요:
npm run bump
```

수동으로 변경하면:
- index.html의 스크립트 버전이 업데이트되지 않음
- gameConfig.js의 버전이 업데이트되지 않음
- 브라우저 캐시 문제 발생
- Git 태그가 생성되지 않음

### 🛠️ 수동 동기화 (긴급 상황)

만약 실수로 수동 편집했다면:

```bash
# 버전 동기화
npm run sync-version

# 변경사항 커밋
git add .
git commit -m "chore: sync version to X.X.X"
```

### 🌐 브라우저 캐시 문제 해결

버전 업데이트 후 변경사항이 반영되지 않으면:

1. **강력 새로고침**:
   - Windows/Linux: `Ctrl + Shift + R` 또는 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **캐시 완전 삭제**:
   - Chrome: `F12` → Network 탭 → "Disable cache" 체크
   - 또는 개발자 도구에서 새로고침 버튼 길게 눌러 "Empty Cache and Hard Reload" 선택

3. **확인 방법**:
   - F12 개발자 도구 열기
   - Network 탭에서 `.js?v=` 확인
   - 올바른 버전 번호가 표시되는지 확인

### 📋 버전 관리 체크리스트

새 버전 배포 시:

- [ ] `npm run bump` 실행 (또는 bump:minor, bump:major)
- [ ] 자동 커밋 확인 (`git log -1`)
- [ ] 자동 태그 확인 (`git tag`)
- [ ] 원격 저장소에 푸시 확인 (자동 실행됨)
- [ ] 브라우저 강력 새로고침
- [ ] 개발자 도구에서 버전 확인

### 🔍 버전 확인 방법

현재 버전 확인:

```bash
# package.json 버전
node -p "require('./package.json').version"

# gameConfig.js 버전
grep "number:" js/config/gameConfig.js

# index.html 스크립트 버전
grep -o "v=[0-9.]*" index.html | head -1
```

모든 파일의 버전이 일치해야 합니다!

### 💡 트러블슈팅

**Q: 버전을 변경했는데 브라우저에서 구버전이 로드됩니다.**
A:
1. `npm run sync-version`으로 동기화 확인
2. 서버 재시작 (`npx serve -p 3000`)
3. 브라우저 강력 새로고침 (`Ctrl+Shift+R`)

**Q: npm run bump 실행 시 에러가 발생합니다.**
A:
1. `git status`로 변경사항 확인
2. 커밋되지 않은 변경사항이 있으면 먼저 커밋
3. 깨끗한 working tree에서 다시 실행

**Q: postversion 훅이 실행되지 않습니다.**
A:
1. npm 7.0 이상 버전 사용 확인: `npm --version`
2. package.json의 scripts 섹션 확인
3. Git 원격 저장소 설정 확인: `git remote -v`

---

**기억하세요**: `npm run bump`만 사용하면 모든 것이 자동으로 처리됩니다! 🚀
