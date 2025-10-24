# 버전 자동 동기화 시스템

## 📋 개요

`gameConfig.js`의 버전 번호를 변경하면 자동으로 `index.html`의 캐시 버스팅 쿼리 스트링을 업데이트하는 시스템입니다.

## 🚀 사용법

### 1. 버전 업데이트 시

```bash
# 1. gameConfig.js에서 버전 수정
# versionInfo.number: '0.1.2' → '0.1.3'

# 2. 자동 동기화 실행
npm run sync-version

# 또는
node update-version.js
```

### 2. npm version 명령어 사용 (권장)

```bash
# Patch 버전 증가 (0.1.2 → 0.1.3)
npm version patch

# Minor 버전 증가 (0.1.2 → 0.2.0)
npm version minor

# Major 버전 증가 (0.1.2 → 1.0.0)
npm version major
```

**주의**: `npm version` 명령어는 `package.json`의 버전만 증가시킵니다.
`gameConfig.js`의 버전도 수동으로 업데이트해야 합니다.

## 📂 파일 구조

```
card-battle-game/
├── js/config/gameConfig.js      # 버전의 단일 진실의 원천
├── index.html                    # 캐시 버스팅 쿼리 스트링
├── update-version.js             # 자동 동기화 스크립트
├── package.json                  # npm 스크립트 정의
└── VERSION-SYNC-README.md        # 이 파일
```

## ⚙️ 작동 원리

1. **gameConfig.js** - 버전의 단일 진실의 원천
   ```javascript
   versionInfo: {
       number: '0.1.2',
       stage: 'early_access_beta'
   }
   ```

2. **update-version.js** - 자동 동기화 스크립트
   - `gameConfig.js`에서 버전 읽기
   - `index.html`의 `?v=` 쿼리 스트링 자동 업데이트

3. **index.html** - 캐시 버스팅
   ```html
   <script src="js/config/gameConfig.js?v=0.1.2"></script>
   ```

## 🔄 워크플로우

### 새 버전 배포 시

```bash
# 1. gameConfig.js 버전 수정
# versionInfo.number: '0.1.2' → '0.1.3'

# 2. 버전 동기화
npm run sync-version

# 3. Git 커밋
git add js/config/gameConfig.js index.html package.json
git commit -m "chore: bump version to 0.1.3"

# 4. 푸시
git push origin main
```

## ✨ 이점

- **자동화**: 버전 하나만 변경하면 자동 동기화
- **일관성**: 버전 불일치 방지
- **캐시 관리**: 브라우저 캐시 자동 무효화
- **Configuration-driven**: 프로젝트 규칙 준수

## 🛠️ 트러블슈팅

### 스크립트 실행 권한 오류
```bash
chmod +x update-version.js
```

### Node.js 없음
```bash
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
sudo apt install nodejs npm
```

## 📝 주의사항

- `gameConfig.js`의 `versionInfo.number`만 수정하세요
- `index.html`의 버전은 스크립트로만 수정하세요
- 매번 버전 변경 후 `npm run sync-version` 실행 필수
