# 다국어 SEO 배포 가이드

## 🎯 완료된 작업

✅ `index.html` - 템플릿 마커 추가
✅ `functions/_middleware.js` - 동적 메타태그 주입 로직
✅ `functions/meta-data.js` - 언어별 메타데이터 설정

---

## 🚀 배포 방법

### 1단계: Wrangler CLI 설치 (최초 1회만)

```bash
npm install -g wrangler
```

### 2단계: 로컬 테스트 (선택사항)

```bash
cd /Users/bobin/Documents/GitHub/playGround/games/card-battle-game

# Wrangler Pages 개발 서버 실행
npx wrangler pages dev . --port 8788
```

**테스트 URL**:
- 한국어: http://localhost:8788/?lang=ko
- 영어: http://localhost:8788/?lang=en
- 일본어: http://localhost:8788/?lang=ja

**확인사항**:
- 페이지 소스 보기 (Cmd+Option+U)
- `<html lang="ko">` → 각 언어 확인
- `<meta name="description">` → 각 언어 설명 확인
- `<title>` → 각 언어 제목 확인

---

### 3단계: Git Push & Cloudflare Pages 자동 배포

```bash
# 변경사항 커밋
git add .
git commit -m "feat: Add dynamic multilingual SEO meta tags with Cloudflare Workers"
git push origin main
```

**Cloudflare Pages가 자동으로**:
1. 새 커밋 감지
2. 빌드 실행
3. `/functions` 디렉토리 자동 인식
4. Cloudflare Workers 함수 배포
5. 자동으로 배포 완료!

---

### 4단계: 배포 확인

#### A. Cloudflare Dashboard에서 확인
1. https://dash.cloudflare.com 접속
2. Pages 프로젝트 선택
3. "Functions" 탭 확인 → `_middleware` 함수 표시되어야 함

#### B. 실제 URL 테스트
```
한국어: https://binboxgames.com/games/card-battle-game/?lang=ko
영어:   https://binboxgames.com/games/card-battle-game/?lang=en
일본어: https://binboxgames.com/games/card-battle-game/?lang=ja
```

**확인 방법**:
1. 각 URL 접속
2. 페이지 소스 보기 (Cmd+Option+U / Ctrl+U)
3. `{{LANG}}`, `{{DESCRIPTION}}` 같은 템플릿 마커가 **사라지고 실제 값**으로 바뀌어야 함

**예시 (한국어)**:
```html
✅ 정상: <html lang="ko">
✅ 정상: <meta name="description" content="자동전투 카드대전! 전략적 덱 빌딩...">
❌ 비정상: <html lang="{{LANG}}">
❌ 비정상: <meta name="description" content="{{DESCRIPTION}}">
```

---

## 🔍 검색엔진 테스트

### Google Search Console 제출
1. https://search.google.com/search-console 접속
2. "Sitemaps" 메뉴
3. `https://binboxgames.com/games/card-battle-game/sitemap.xml` 제출
4. 2-4주 후 검색 결과 확인

### 검색 결과 시뮬레이션
**Rich Results Test** (Google):
```
https://search.google.com/test/rich-results
```
각 언어 URL 입력:
- `https://binboxgames.com/games/card-battle-game/?lang=ko`
- `https://binboxgames.com/games/card-battle-game/?lang=en`
- `https://binboxgames.com/games/card-battle-game/?lang=ja`

---

## 🧪 메타태그 확인 도구

### 1. 브라우저 개발자 도구
```
Cmd+Option+U (Mac) / Ctrl+U (Windows)
→ 페이지 소스 보기
→ <head> 섹션의 메타태그 확인
```

### 2. Facebook Debugger (OG 태그)
```
https://developers.facebook.com/tools/debug/
```
각 언어 URL 입력하여 OG 태그 확인

### 3. Twitter Card Validator
```
https://cards-dev.twitter.com/validator
```
Twitter Card 메타태그 확인

---

## ⚠️ 주의사항

### 1. 로컬 개발 시
**일반 `npx serve`는 Cloudflare Workers를 실행 안 함!**

```bash
# ❌ 템플릿 마커가 그대로 보임
npx serve -p 3000

# ✅ Workers 실행, 메타태그 정상 작동
npx wrangler pages dev . --port 8788
```

### 2. 캐시 초기화
배포 후에도 이전 HTML이 보이면:
```bash
# 브라우저 강제 새로고침
Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

### 3. Functions 디렉토리 위치
**반드시 프로젝트 루트에 `/functions` 폴더**가 있어야 합니다:
```
/games/card-battle-game/
├── functions/         ← 여기!
│   ├── _middleware.js
│   └── meta-data.js
├── index.html
└── js/
```

---

## 📊 예상 효과

### Before (JavaScript 의존)
- 검색엔진이 JavaScript 실행 대기 필요
- 일본어 검색 → 한국어 제목 표시될 수 있음
- 인덱싱 느림 (수 주)

### After (Cloudflare Workers)
- 검색엔진이 HTML 즉시 읽음
- 각 언어로 정확한 제목/설명 표시
- 빠른 인덱싱 (수 일)

---

## 🆘 문제 해결

### Q1. "{{LANG}}" 템플릿이 그대로 보여요!
**원인**: Cloudflare Workers가 실행 안됨
**해결**:
1. Cloudflare Dashboard → Pages → Functions 탭 확인
2. `_middleware` 함수가 보이는지 확인
3. 배포 로그 확인: "Functions deployed successfully"

### Q2. 로컬에서 테스트가 안 돼요!
**원인**: `npx serve`는 Workers 미지원
**해결**: `npx wrangler pages dev . --port 8788` 사용

### Q3. 언어 변경이 안 돼요!
**원인**: URL 파라미터 누락
**확인**: URL에 `?lang=en`이 있는지 확인

---

## ✅ 최종 체크리스트

배포 전:
- [ ] `functions/_middleware.js` 존재
- [ ] `functions/meta-data.js` 존재
- [ ] `index.html`에 템플릿 마커 ({{LANG}}, {{DESCRIPTION}} 등)

배포 후:
- [ ] Cloudflare Dashboard에서 Functions 활성화 확인
- [ ] 각 언어 URL 접속하여 메타태그 확인
- [ ] 페이지 소스에서 템플릿 마커 사라짐 확인
- [ ] Google Search Console에 sitemap.xml 제출

---

## 📞 지원

문제가 발생하면:
1. Cloudflare Pages 배포 로그 확인
2. 브라우저 콘솔에서 에러 확인
3. `/functions/_middleware.js` 코드 재확인

**성공 메시지**:
```
✅ Functions deployed: 1 function
✅ _middleware.js → Active
```
