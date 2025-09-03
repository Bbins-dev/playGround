# 🎮 게임 추가 가이드

이 폴더에 새로운 하이퍼캐주얼 미니 게임들을 추가할 수 있습니다.

## 📁 게임 폴더 구조

각 게임은 다음과 같은 구조로 만들어주세요:

```
games/
├── game-name/           # 게임 폴더명 (영문, 소문자, 하이픈 사용)
│   ├── index.html      # 게임 메인 페이지
│   ├── style.css       # 게임 전용 스타일
│   ├── game.js         # 게임 로직
│   ├── assets/         # 게임 리소스 (이미지, 사운드 등)
│   └── README.md       # 게임 설명
```

## 🎯 게임 추가 단계

### 1. 게임 폴더 생성
```bash
mkdir games/your-game-name
```

### 2. 기본 파일들 생성
- `index.html` - 게임 HTML 구조
- `style.css` - 게임 스타일
- `game.js` - 게임 로직
- `README.md` - 게임 설명

### 3. 메인 페이지에 게임 링크 추가
`../index.html`의 게임 목록에 새 게임을 추가하세요.

## 📋 게임 템플릿

### HTML 템플릿
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>게임명 - PlayGround</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <canvas id="gameCanvas"></canvas>
        <div class="ui">
            <div class="score">점수: <span id="score">0</span></div>
            <button id="startBtn">게임 시작</button>
        </div>
    </div>
    
    <div class="back-btn">
        <a href="../index.html">← 메인으로 돌아가기</a>
    </div>
    
    <script src="game.js"></script>
</body>
</html>
```

### CSS 템플릿
```css
body {
    margin: 0;
    padding: 0;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: Arial, sans-serif;
}

.game-container {
    text-align: center;
}

#gameCanvas {
    border: 2px solid #fff;
    background: #111;
}

.ui {
    margin-top: 20px;
    color: #fff;
}

.back-btn {
    position: fixed;
    top: 20px;
    left: 20px;
}

.back-btn a {
    color: #fff;
    text-decoration: none;
    padding: 10px 15px;
    background: rgba(255,255,255,0.2);
    border-radius: 5px;
}
```

### JavaScript 템플릿
```javascript
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isRunning = false;
        
        this.init();
    }
    
    init() {
        // 게임 초기화
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // 캔버스 설정
        this.canvas.width = 800;
        this.canvas.height = 600;
    }
    
    bindEvents() {
        // 이벤트 바인딩
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    startGame() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 게임 로직 업데이트
    }
    
    render() {
        // 화면 렌더링
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 게임 시작
new Game();
```

## 🔧 게임 개발 팁

1. **성능 최적화**: `requestAnimationFrame` 사용
2. **반응형 디자인**: 다양한 화면 크기 지원
3. **사용자 경험**: 직관적인 컨트롤과 피드백
4. **코드 구조**: 클래스 기반으로 깔끔하게 구성
5. **에러 처리**: 예외 상황에 대한 적절한 처리

## 📱 모바일 지원

모바일에서도 잘 작동하도록 터치 이벤트를 지원하세요:

```javascript
// 터치 이벤트 지원
this.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // 터치 처리
});
```

## 🎨 게임 아이콘

게임을 대표하는 이모지를 선택하여 메인 페이지에 표시하세요:
- 🎲 보드게임류
- 🎯 슈팅류  
- 🚀 액션류
- 🧩 퍼즐류
- 🏃 러닝류
- 🎵 리듬류

---

**즐거운 게임 개발 되세요! 🎉**
