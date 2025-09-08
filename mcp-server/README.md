# PlayGround MCP Server

PlayGround 게임 컬렉션을 위한 Model Context Protocol (MCP) 서버입니다.

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
cd mcp-server
npm install
```

### 2. 서버 실행
```bash
npm start
# 또는 개발 모드로
npm run dev
```

## 🔧 Claude Code 연결

### 1. Claude Code에서 MCP 서버 설정
Claude Code의 설정에서 MCP 서버를 추가하세요:

```json
{
  "mcpServers": {
    "playground-server": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "cwd": "/Users/your-username/Documents/GitHub/playGround"
    }
  }
}
```

### 2. 프로젝트 루트의 mcp-server.json 사용
또는 프로젝트 루트에 있는 `mcp-server.json` 설정 파일을 사용할 수 있습니다.

## 📋 제공하는 기능

### Resources (리소스)
- `playground://main` - 메인 페이지 정보
- `playground://games/{game-name}` - 개별 게임 정보
- `playground://lang/{language}` - 언어 번역 파일

### Tools (도구)
- `create_game` - 새 게임 생성
- `update_main_page` - 메인 페이지 업데이트

## 🎮 사용 예시

### 새 게임 생성
```javascript
// MCP 클라이언트에서
await callTool("create_game", {
  name: "snake-game",
  title: "스네이크 게임",
  description: "클래식 스네이크 게임을 즐겨보세요!",
  icon: "🐍",
  genre: "아케이드"
});
```

### 게임 정보 조회
```javascript
// 바리스타 게임 정보 조회
const gameInfo = await readResource("playground://games/barista-game");
```

### 언어 파일 조회
```javascript
// 한국어 번역 파일 조회
const koTranslations = await readResource("playground://lang/ko");
```

## 🛠️ 개발 정보

### 프로젝트 구조
```
mcp-server/
├── index.js          # 메인 MCP 서버
├── package.json       # 의존성 및 스크립트
└── README.md         # 이 파일
```

### 주요 기능
- **게임 정보 제공**: 각 게임의 README, 소스 코드 미리보기
- **리소스 관리**: 게임 파일, 언어 파일 접근
- **게임 생성**: 템플릿 기반 새 게임 스캐폴딩
- **메인 페이지 연동**: 게임 목록 관리

### 기술 스택
- Node.js 18+
- @modelcontextprotocol/sdk
- ES Modules

## 🔍 디버깅

### 로그 확인
서버 실행 시 stderr로 디버그 정보가 출력됩니다:
```bash
node index.js 2> debug.log
```

### 일반적인 문제
1. **경로 오류**: `cwd` 설정이 올바른 프로젝트 루트를 가리키는지 확인
2. **권한 문제**: Node.js가 프로젝트 파일에 접근할 수 있는지 확인
3. **포트 충돌**: 다른 MCP 서버와 충돌하지 않는지 확인

## 📝 라이선스

MIT License - 자유롭게 사용하세요!