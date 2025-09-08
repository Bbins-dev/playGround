#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYGROUND_ROOT = path.join(__dirname, "..");

class PlaygroundMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "playground-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 리소스 목록 제공
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];
      
      try {
        // 게임 목록 조회
        const gamesDir = path.join(PLAYGROUND_ROOT, "games");
        const games = await fs.readdir(gamesDir, { withFileTypes: true });
        
        for (const game of games) {
          if (game.isDirectory()) {
            resources.push({
              uri: `playground://games/${game.name}`,
              name: `Game: ${game.name}`,
              description: `PlayGround game: ${game.name}`,
              mimeType: "application/json",
            });
          }
        }

        // 메인 페이지 정보
        resources.push({
          uri: "playground://main",
          name: "Main Page",
          description: "PlayGround main page information",
          mimeType: "application/json",
        });

        // 언어 파일들
        const langDir = path.join(PLAYGROUND_ROOT, "js", "lang");
        const langFiles = await fs.readdir(langDir);
        
        for (const langFile of langFiles) {
          if (langFile.endsWith('.json')) {
            const lang = langFile.replace('.json', '');
            resources.push({
              uri: `playground://lang/${lang}`,
              name: `Language: ${lang}`,
              description: `Translations for ${lang}`,
              mimeType: "application/json",
            });
          }
        }

      } catch (error) {
        console.error("Error listing resources:", error);
      }

      return { resources };
    });

    // 리소스 읽기
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const [, , type, name] = uri.split("/");

      try {
        let content;
        
        if (type === "games" && name) {
          // 게임 정보 제공
          const gameDir = path.join(PLAYGROUND_ROOT, "games", name);
          const gameInfo = await this.getGameInfo(gameDir);
          content = JSON.stringify(gameInfo, null, 2);
          
        } else if (type === "lang" && name) {
          // 언어 파일 내용 제공
          const langFile = path.join(PLAYGROUND_ROOT, "js", "lang", `${name}.json`);
          content = await fs.readFile(langFile, "utf-8");
          
        } else if (uri === "playground://main") {
          // 메인 페이지 정보 제공
          const mainInfo = await this.getMainPageInfo();
          content = JSON.stringify(mainInfo, null, 2);
          
        } else {
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: content,
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error.message}`);
      }
    });

    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create_game",
            description: "Create a new game in the PlayGround",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Game name (kebab-case)",
                },
                title: {
                  type: "string",
                  description: "Game display title",
                },
                description: {
                  type: "string",
                  description: "Game description",
                },
                icon: {
                  type: "string",
                  description: "Game icon emoji",
                },
                genre: {
                  type: "string",
                  description: "Game genre",
                },
              },
              required: ["name", "title", "description", "icon", "genre"],
            },
          },
          {
            name: "update_main_page",
            description: "Update main page game list",
            inputSchema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["add_game", "remove_game"],
                  description: "Action to perform",
                },
                gameData: {
                  type: "object",
                  description: "Game data for adding to main page",
                },
              },
              required: ["action"],
            },
          },
        ],
      };
    });

    // 도구 실행
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_game":
            return await this.createGame(args);
          case "update_main_page":
            return await this.updateMainPage(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async getGameInfo(gameDir) {
    try {
      const readmePath = path.join(gameDir, "README.md");
      const indexPath = path.join(gameDir, "index.html");
      const gamePath = path.join(gameDir, "game.js");
      
      const gameInfo = {
        name: path.basename(gameDir),
        files: {},
        exists: true,
      };

      // README.md 읽기
      try {
        gameInfo.files.readme = await fs.readFile(readmePath, "utf-8");
      } catch (e) {
        gameInfo.files.readme = null;
      }

      // index.html 읽기
      try {
        gameInfo.files.index = await fs.readFile(indexPath, "utf-8");
      } catch (e) {
        gameInfo.files.index = null;
      }

      // game.js 첫 50줄 읽기
      try {
        const gameJs = await fs.readFile(gamePath, "utf-8");
        gameInfo.files.gameJs = gameJs.split('\n').slice(0, 50).join('\n');
      } catch (e) {
        gameInfo.files.gameJs = null;
      }

      return gameInfo;
    } catch (error) {
      return {
        name: path.basename(gameDir),
        exists: false,
        error: error.message,
      };
    }
  }

  async getMainPageInfo() {
    try {
      const indexPath = path.join(PLAYGROUND_ROOT, "index.html");
      const mainJs = path.join(PLAYGROUND_ROOT, "js", "main.js");
      
      const indexContent = await fs.readFile(indexPath, "utf-8");
      const mainJsContent = await fs.readFile(mainJs, "utf-8");
      
      // 게임 카드 파싱
      const gameCardRegex = /<div class="game-card"[\s\S]*?<\/div>(?=\s*<div class="game-card"|$)/g;
      const gameCards = indexContent.match(gameCardRegex) || [];
      
      return {
        gameCards: gameCards.length,
        hasI18nSupport: indexContent.includes('data-i18n'),
        hasSearchFunction: indexContent.includes('gameSearch'),
        mainJsLineCount: mainJsContent.split('\n').length,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async createGame(args) {
    const { name, title, description, icon, genre } = args;
    const gameDir = path.join(PLAYGROUND_ROOT, "games", name);

    try {
      // 게임 디렉토리 생성
      await fs.mkdir(gameDir, { recursive: true });
      await fs.mkdir(path.join(gameDir, "assets"), { recursive: true });

      // 기본 파일들 생성
      await this.createGameFiles(gameDir, { name, title, description, icon, genre });

      return {
        content: [
          {
            type: "text",
            text: `게임 '${title}' (${name})이 성공적으로 생성되었습니다.\n\n생성된 파일:\n- ${name}/index.html\n- ${name}/style.css\n- ${name}/game.js\n- ${name}/README.md\n- ${name}/assets/\n\n다음 단계: 메인 페이지에 게임 카드를 추가하세요.`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `게임 생성 실패: ${error.message}`);
    }
  }

  async createGameFiles(gameDir, gameData) {
    const { name, title, description, icon, genre } = gameData;

    // index.html 생성
    const indexHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - PlayGround</title>
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
        <a href="../../index.html">← 메인으로 돌아가기</a>
    </div>
    
    <script src="game.js"></script>
</body>
</html>`;

    // style.css 생성
    const styleCss = `body {
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

.back-btn a:hover {
    background: rgba(255,255,255,0.3);
}

#startBtn {
    padding: 10px 20px;
    font-size: 16px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

#startBtn:hover {
    background: #005a99;
}`;

    // game.js 생성
    const gameJs = `// ${title} - 게임 로직

class ${title.replace(/[^a-zA-Z0-9]/g, '')}Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isRunning = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 모바일 터치 지원
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // 터치 처리 로직
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
        
        // 간단한 텍스트 표시
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('${title}', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(\`점수: \${this.score}\`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }
}

// 게임 시작
new ${title.replace(/[^a-zA-Z0-9]/g, '')}Game();`;

    // README.md 생성
    const readmeMd = `# ${icon} ${title}

${description}

## 🎮 게임 방법

[게임 방법 설명]

## 🛠️ 기술 스택

- HTML5 Canvas
- JavaScript (ES6+)
- CSS3

## 📱 모바일 지원

- 터치 이벤트 지원
- 반응형 디자인

---

**즐거운 게임 되세요! ${icon}**`;

    // 파일들 저장
    await fs.writeFile(path.join(gameDir, "index.html"), indexHtml);
    await fs.writeFile(path.join(gameDir, "style.css"), styleCss);
    await fs.writeFile(path.join(gameDir, "game.js"), gameJs);
    await fs.writeFile(path.join(gameDir, "README.md"), readmeMd);
  }

  async updateMainPage(args) {
    // 메인 페이지 업데이트 로직 (향후 구현)
    return {
      content: [
        {
          type: "text",
          text: "메인 페이지 업데이트 기능은 아직 구현되지 않았습니다.",
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PlayGround MCP Server running on stdio");
  }
}

// 서버 실행
const server = new PlaygroundMCPServer();
server.run().catch(console.error);