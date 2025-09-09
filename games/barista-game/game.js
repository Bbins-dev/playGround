// 바리스타 게임 - 메인 게임 로직

class BaristaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 상태
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.isHolding = false;
        this.gameStartTime = 0;
        this.gameTime = 120; // 2분 (120초)
        this.maxTime = 120;
        this.lives = 3;
        
        // 스코어 보안 강화
        this._score = 0;
        this._highScore = 0;
        this._scoreHash = this.generateScoreHash(0);
        this._highScoreHash = this.generateScoreHash(0);
        this._scoreValidationFailed = false; // 무한 루프 방지
        this._highScoreValidationFailed = false; // 무한 루프 방지
        
        // 컵 큐 시스템
        this.cupQueue = [];
        this.activeCupIndex = 2; // 가운데 위치 (인덱스 2)가 작업 컵
        this.cupPositions = [-300, -150, 0, 150, 300]; // 5개 위치 (왼쪽 2개, 중앙 1개, 오른쪽 2개) - 간격 증가
        
        // 컵 시스템 초기화
        this.cupSystem = new CupSystem();
        
        // 입력 매니저 초기화
        this.inputManager = new InputManager(this.canvas, this);
        
        // 시각적 효과 매니저 초기화
        this.visualEffects = new VisualEffects(this.ctx);
        
        // UI 매니저 초기화
        this.uiManager = new UIManager();
        
        // 사운드 매니저
        this.soundManager = new SoundManager();
        
        // 모바일 최적화 매니저
        this.mobileOptimizer = new MobileOptimizer(this);
        
        // 애니메이션
        this.animationId = null;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.loadHighScore();
        this.gameLoop();
    }

    /**
     * 현재 작업 중인 컵 반환
     */
    getCurrentCup() {
        // activeCupIndex(2)는 화면 중앙 위치를 의미
        // positionIndex가 2인 컵을 찾아서 반환
        const activeCup = this.cupQueue.find(cup => cup && cup.positionIndex === this.activeCupIndex);
        return activeCup || null;
    }

    /**
     * 컵 큐에서 위치 업데이트
     */
    updateCupPositions() {
        for (let i = 0; i < this.cupQueue.length; i++) {
            if (this.cupQueue[i]) {
                const cup = this.cupQueue[i];
                // positionIndex가 없으면 배열 인덱스 사용
                const posIndex = cup.positionIndex !== undefined ? cup.positionIndex : i;
                
                // 위치 인덱스에 따른 X 좌표 계산
                if (posIndex < this.cupPositions.length) {
                    cup.x = this.centerX + this.cupPositions[posIndex];
                } else {
                    // 화면 밖 위치 (오른쪽으로 계속 이동)
                    cup.x = this.centerX + this.cupPositions[this.cupPositions.length - 1] + 
                            (posIndex - this.cupPositions.length + 1) * 100;
                }
                
                // 바닥 위치 유지: 모든 컵의 바닥이 같은 라인에 오도록 Y 위치 조정
                const baseBottomY = this.centerY + 160; // 기준 바닥 Y 위치 
                const cupHeight = cup.config.height;
                cup.y = baseBottomY - cupHeight / 2; // 컵의 중심이 바닥에서 높이/2만큼 위에 오도록
            }
        }
    }

    /**
     * 새 컵을 큐의 끝에 추가
     */
    addNewCupToQueue() {
        const newCup = this.cupSystem.generateRandomCup(true);
        if (newCup) {
            newCup.lastTimingZone = 'basic';
            // positionIndex 설정 (큐에서의 위치)
            newCup.positionIndex = this.cupQueue.length;
            this.cupQueue.push(newCup);
            this.updateCupPositions();
            console.log('✅ 새 컵을 큐에 추가:', newCup.type);
        }
        return newCup;
    }

    /**
     * 컵 큐 초기화 (게임 시작 시 여러 컵 미리 생성)
     */
    initializeCupQueue() {
        this.cupQueue = [];
        
        // 5개 위치에 컵 배치 (처음 2개는 대기, 가운데 1개는 작업용, 마지막 2개는 빈 공간)
        for (let i = 0; i < 3; i++) {
            this.addNewCupToQueue();
        }
        
        console.log('✅ 컵 큐 초기화 완료, 컵 개수:', this.cupQueue.length);
    }

    /**
     * 컵 완료 시 큐 이동 (완료된 컵을 포함해 모든 컵이 한 칸씩 오른쪽으로)
     */
    advanceCupQueue() {
        const currentCup = this.getCurrentCup();
        if (currentCup) {
            // 완료된 컵에 상태 표시
            currentCup.isCompleted = true;
            console.log('✅ 컵 완료 표시:', currentCup.type);
        }
        
        // 모든 컵을 한 칸씩 오른쪽으로 이동 (인덱스는 그대로, 위치만 변경)
        for (let i = 0; i < this.cupQueue.length; i++) {
            if (this.cupQueue[i]) {
                // 각 컵의 위치 인덱스를 1씩 증가 (오른쪽으로 이동)
                this.cupQueue[i].positionIndex = (this.cupQueue[i].positionIndex || i) + 1;
            }
        }
        
        // 새 컵을 왼쪽 끝에 추가 (위치 인덱스 0)
        const newCup = this.cupSystem.generateRandomCup(true);
        if (newCup) {
            newCup.lastTimingZone = 'basic';
            newCup.positionIndex = 0; // 가장 왼쪽 위치
            this.cupQueue.unshift(newCup); // 배열 앞쪽에 추가
            console.log('✅ 새 컵을 왼쪽에 추가:', newCup.type);
        }
        
        // 화면 밖으로 나간 컵들 제거 (위치 인덱스가 5 이상인 컵)
        this.cupQueue = this.cupQueue.filter((cup, index) => {
            if (cup.positionIndex >= 5) {
                console.log('🗑️ 화면 밖으로 나간 컵 제거:', cup.type);
                return false;
            }
            return true;
        });
        
        // activeCupIndex 조정 (중앙 위치는 항상 인덱스 2)
        this.activeCupIndex = 2;
        
        // 위치 즉시 업데이트
        this.updateCupPositions();
        
        console.log('✅ 컵 큐 이동 완료, 현재 컵 개수:', this.cupQueue.length);
    }
    
    /**
     * 스코어 해시 생성 (보안용) - 강화된 버전
     */
    generateScoreHash(score) {
        // 동적 시크릿 생성 (게임 시작 시간 기반)
        const dynamicSecret = this.gameStartTime ? this.gameStartTime.toString() : Date.now().toString();
        const staticSecret = String.fromCharCode(98,97,114,105,115,116,97); // 'barista' 인코딩
        const combinedSecret = dynamicSecret + staticSecret + (score * 7).toString();
        
        // 더 복잡한 해시 알고리즘
        let hash1 = 0, hash2 = 0;
        for (let i = 0; i < combinedSecret.length; i++) {
            const char = combinedSecret.charCodeAt(i);
            hash1 = ((hash1 << 5) - hash1) + char;
            hash2 = ((hash2 << 3) + hash2) ^ char;
            hash1 = hash1 & hash1; // 32bit 정수로 변환
            hash2 = hash2 & hash2;
        }
        
        // 두 해시를 조합하여 더 복잡한 해시 생성
        const finalHash = (hash1 ^ hash2) + score * 13;
        return Math.abs(finalHash).toString(36); // 36진법으로 변환
    }
    
    /**
     * 스코어 검증
     */
    validateScore(score, hash) {
        return this.generateScoreHash(score) === hash;
    }
    
    /**
     * 보안된 스코어 설정
     */
    setScore(newScore) {
        // 콘솔 호출 감지 (스택 트레이스 분석)
        const stack = new Error().stack;
        const isConsoleCall = !stack || stack.includes('eval') || stack.includes('<anonymous>');
        
        if (isConsoleCall && this.gameState === 'playing') {
            console.warn('🚫 콘솔을 통한 점수 조작이 감지되었습니다.');
            this._scoreValidationFailed = true;
            return false;
        }
        
        console.log('📝 setScore 호출됨:', newScore);
        console.log('  - 이전 점수:', this._score);
        
        if (typeof newScore !== 'number' || newScore < 0 || !Number.isInteger(newScore)) {
            console.warn('⚠️ 잘못된 스코어 값:', newScore);
            return false;
        }
        
        // 스코어 증가량 검증 (한 번에 너무 많이 증가하는 것 방지)
        const maxIncrease = 1000;
        if (newScore - this._score > maxIncrease) {
            console.warn('⚠️ 스코어 증가량이 비정상적으로 큽니다:', newScore - this._score);
            return false;
        }
        
        this._score = newScore;
        this._scoreHash = this.generateScoreHash(newScore);
        console.log('  - 점수 설정 완료:', this._score);
        console.log('  - 해시 생성 완료:', this._scoreHash);
        
        return true;
    }
    
    /**
     * 보안된 스코어 증가
     */
    addScore(points) {
        console.log('🔢 addScore 호출됨:', points);
        console.log('  - 현재 점수:', this._score);
        
        if (typeof points !== 'number' || points < 0 || !Number.isInteger(points)) {
            console.warn('⚠️ 잘못된 점수 값:', points);
            return false;
        }
        
        const newScore = this._score + points;
        console.log('  - 새 점수:', newScore);
        
        const result = this.setScore(newScore);
        console.log('  - setScore 결과:', result);
        console.log('  - 최종 점수:', this._score);
        
        return result;
    }
    
    /**
     * 보안된 스코어 조회
     */
    getScore() {
        // 검증 실패 상태에서는 로그를 줄임
        if (!this._scoreValidationFailed) {
            console.log('📊 getScore 호출됨');
            console.log('  - 현재 _score:', this._score);
            console.log('  - 현재 _scoreHash:', this._scoreHash);
            console.log('  - 검증 실패 플래그:', this._scoreValidationFailed);
        }
        
        // 무한 루프 방지: 이미 검증 실패한 경우 재검증하지 않음
        if (this._scoreValidationFailed) {
            return this._score;
        }
        
        const isValid = this.validateScore(this._score, this._scoreHash);
        console.log('  - 스코어 검증 결과:', isValid);
        
        if (!isValid) {
            console.error('🚨 스코어 무결성 검증 실패! 스코어가 조작되었을 수 있습니다.');
            this._score = 0;
            this._scoreHash = this.generateScoreHash(0);
            this._scoreValidationFailed = true; // 무한 루프 방지
            console.log('  - 스코어를 0으로 리셋');
        }
        
        console.log('  - 최종 반환 점수:', this._score);
        return this._score;
    }
    
    /**
     * 보안된 최고 점수 설정
     */
    setHighScore(newHighScore) {
        if (typeof newHighScore !== 'number' || newHighScore < 0 || !Number.isInteger(newHighScore)) {
            console.warn('⚠️ 잘못된 최고 점수 값:', newHighScore);
            return false;
        }
        
        this._highScore = newHighScore;
        this._highScoreHash = this.generateScoreHash(newHighScore);
        return true;
    }
    
    /**
     * 보안된 최고 점수 조회
     */
    getHighScore() {
        // 무한 루프 방지: 이미 검증 실패한 경우 재검증하지 않음
        if (this._highScoreValidationFailed) {
            return this._highScore;
        }
        
        if (!this.validateScore(this._highScore, this._highScoreHash)) {
            console.error('🚨 최고 점수 무결성 검증 실패! 최고 점수가 조작되었을 수 있습니다.');
            this._highScore = 0;
            this._highScoreHash = this.generateScoreHash(0);
            this._highScoreValidationFailed = true; // 무한 루프 방지
        }
        return this._highScore;
    }
    
    setupCanvas() {
        // 모바일 최적화된 캔버스 크기 설정
        this.setupResponsiveCanvas();
        
        // 캔버스 중심점 계산
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    /**
     * 반응형 캔버스 크기 설정
     */
    setupResponsiveCanvas() {
        const isMobile = this.isMobileDevice();
        const isTablet = this.isTabletDevice();
        
        if (isMobile) {
            // 모바일: 전체 화면 활용
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
        } else if (isTablet) {
            // 태블릿: 중간 크기
            this.canvas.width = Math.min(1024, window.innerWidth - 20);
            this.canvas.height = Math.min(768, window.innerHeight - 20);
            this.canvas.style.width = `${this.canvas.width}px`;
            this.canvas.style.height = `${this.canvas.height}px`;
        } else {
            // 데스크톱: 고정 크기
            this.canvas.width = Math.min(800, window.innerWidth - 40);
            this.canvas.height = Math.min(600, window.innerHeight - 40);
            this.canvas.style.width = `${this.canvas.width}px`;
            this.canvas.style.height = `${this.canvas.height}px`;
        }
        
        // 캔버스 스타일 최적화
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.border = 'none';
        this.canvas.style.background = '#1a1a1a';
        
        console.log(`캔버스 크기 설정: ${this.canvas.width}x${this.canvas.height} (${isMobile ? '모바일' : isTablet ? '태블릿' : '데스크톱'})`);
    }
    
    /**
     * 모바일 디바이스 감지
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth <= 768;
    }
    
    /**
     * 태블릿 디바이스 감지
     */
    isTabletDevice() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    
    /**
     * 화면 크기 변경 처리
     */
    handleResize() {
        this.setupCanvas();
        this.resizeGame();
    }
    
    /**
     * 게임 요소 크기 조정
     */
    resizeGame() {
        // 게임 요소들의 크기를 새로운 캔버스 크기에 맞게 조정
        this.updateCupPositions();
        
        // UI 매니저에 크기 변경 알림
        if (this.uiManager && this.uiManager.handleResize) {
            this.uiManager.handleResize(this.canvas.width, this.canvas.height);
        }
        
        console.log('게임 요소 크기 조정 완료');
    }
    
    /**
     * UI 상태 제어 (게임 상태에 따른 클릭 이벤트 제어)
     */
    updateUIMode(mode) {
        const uiOverlay = document.querySelector('.ui-overlay');
        if (uiOverlay) {
            // 기존 클래스 제거
            uiOverlay.classList.remove('menu-mode', 'game-mode');
            // 새 클래스 추가
            if (mode === 'menu') {
                uiOverlay.classList.add('menu-mode');
            } else if (mode === 'game') {
                uiOverlay.classList.add('game-mode');
            }
        }
    }

    bindEvents() {
        // 게임 시작 버튼
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 재시작 버튼
        document.getElementById('restartBtn').addEventListener('click', async () => {
            await this.restartGame();
        });
        
        // InputManager가 모든 입력 이벤트를 처리합니다
        console.log('입력 이벤트는 InputManager에서 처리됩니다.');
        
        // 윈도우 리사이즈 (디바운싱 적용)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // 오리엔테이션 변경 (모바일)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });
    }
    
    startGame() {
        console.log('🎮 게임 시작 - 초기화 시작');
        
        this.gameState = 'playing';
        this.updateUIMode('game'); // 게임 모드로 UI 변경
        this.gameStartTime = Date.now();
        this.gameTime = this.maxTime;
        this.lives = 3;
        this.setScore(0);
        this.combo = 0;
        this.maxCombo = 0;
        this.cupQueue = [];
        this.activeCupIndex = 2;
        this.isHolding = false;
        
        console.log('✅ 게임 상태 설정 완료:', this.gameState);
        
        // 게임 통계 초기화
        this.gameStats = {
            totalCups: 0,
            perfectCups: 0,
            successCups: 0,
            failedCups: 0,
            totalPlayTime: 0,
            startTime: Date.now()
        };
        
        // 컵 시스템 통계 초기화
        this.cupSystem.reset();
        console.log('✅ 컵 시스템 초기화 완료');
        
        // 입력 매니저 초기화
        this.inputManager.reset();
        console.log('✅ 입력 매니저 초기화 완료');
        
        // 시각적 효과 초기화
        this.visualEffects.reset();
        console.log('✅ 시각적 효과 초기화 완료');
        
        // 사운드 매니저 초기화 (비동기 처리)
        this.soundManager.reset();
        console.log('✅ 사운드 매니저 초기화 완료 (사운드 로딩은 백그라운드에서 진행)');
        
        // UI 매니저 초기화
        this.uiManager.reset();
        console.log('✅ UI 매니저 초기화 완료');
        
        // 시작 화면 숨기기
        this.uiManager.hideStartScreen();
        this.updateUI();
        console.log('✅ UI 업데이트 완료');
        
        // 첫 번째 컵 생성
        this.generateNewCup();
        console.log('✅ 첫 번째 컵 생성 완료:', this.getCurrentCup() ? '성공' : '실패');
        
        // 게임 시작 후 상태 확인
        console.log('🔍 게임 시작 후 상태 확인:');
        console.log('  - gameState:', this.gameState);
        console.log('  - currentCup:', this.getCurrentCup() ? this.getCurrentCup().type : 'null');
        console.log('  - isHolding:', this.isHolding);
        console.log('  - inputManager:', this.inputManager ? '존재' : 'null');
        
        console.log('🎮 게임 시작 - 모든 초기화 완료');
    }
    
    async restartGame() {
        console.log('🔄 게임 다시 시작 - 초기화 시작');
        
        // 게임 상태를 start로 설정
        this.gameState = 'start';
        this.updateUIMode('menu'); // 메뉴 모드로 UI 변경
        
        // 모든 게임 변수 초기화
        this.gameStartTime = 0;
        this.gameTime = this.maxTime;
        this.lives = 3;
        this.setScore(0);
        this.combo = 0;
        this.maxCombo = 0;
        this.cupQueue = [];
        this.activeCupIndex = 2;
        this.isHolding = false;
        
        // 게임 통계 초기화
        this.gameStats = {
            totalCups: 0,
            perfectCups: 0,
            successCups: 0,
            failedCups: 0,
            totalPlayTime: 0,
            startTime: Date.now()
        };
        
        console.log('✅ 게임 변수 초기화 완료');
        
        // 모든 매니저들 초기화
        this.cupSystem.reset();
        console.log('✅ 컵 시스템 초기화 완료');
        
        this.inputManager.reset();
        console.log('✅ 입력 매니저 초기화 완료');
        
        this.visualEffects.reset();
        console.log('✅ 시각적 효과 초기화 완료');
        
        await this.soundManager.reset();
        console.log('✅ 사운드 매니저 초기화 완료');
        
        this.uiManager.reset();
        console.log('✅ UI 매니저 초기화 완료');
        
        // UI 상태 초기화
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        console.log('✅ UI 상태 초기화 완료');
        
        // 게임 루프가 계속 실행되고 있는지 확인
        if (!this.animationId) {
            console.log('🔄 게임 루프 재시작');
            this.gameLoop();
        }
        
        // 게임 상태 확인
        console.log('🔍 게임 재시작 후 상태 확인:');
        console.log('  - gameState:', this.gameState);
        console.log('  - currentCup:', this.currentCup ? this.currentCup.type : 'null');
        console.log('  - isHolding:', this.isHolding);
        console.log('  - inputManager:', this.inputManager ? '존재' : 'null');
        
        console.log('🎮 게임 다시 시작 - 모든 초기화 완료');
    }
    
    generateNewCup() {
        if (this.gameState !== 'playing') {
            console.log('❌ 컵 생성 실패 - 게임 상태가 playing이 아님:', this.gameState);
            return;
        }
        
        console.log('🔄 새 컵 생성 시작...');
        
        // 게임 시작 시에는 큐 초기화, 그 외에는 큐 이동
        if (this.cupQueue.length === 0) {
            this.initializeCupQueue();
        } else {
            this.advanceCupQueue();
        }
    }
    
    handleStart() {
        console.log('🎮 game.handleStart() 호출됨');
        console.log('  - gameState:', this.gameState);
        console.log('  - isHolding:', this.isHolding);
        console.log('  - currentCup:', this.getCurrentCup() ? '존재' : 'null');
        
        // 조건 체크를 더 유연하게 수정
        if (this.gameState !== 'playing') {
            console.log('❌ game.handleStart() 실패 - 게임 상태가 playing이 아님:', this.gameState);
            return false;
        }
        
        if (!this.getCurrentCup()) {
            console.log('❌ game.handleStart() 실패 - currentCup이 null');
            return false;
        }
        
        // 이미 홀드 중인 경우 중복 방지
        if (this.isHolding) {
            console.log('⚠️ game.handleStart() - 이미 홀드 중이므로 무시');
            return false;
        }
        
        console.log('✅ game.handleStart() 조건 만족 - 홀드 시작');
        
        this.isHolding = true;
        this.getCurrentCup().holdStartTime = performance.now();
        
        // 홀드 사운드 시작
        this.soundManager.startHold();
        
        console.log('✅ 게임 홀드 시작 완료');
        return true;
    }
    
    handleEnd(holdDuration = null) {
        console.log('🎮 game.handleEnd() 호출됨');
        console.log('  - gameState:', this.gameState);
        console.log('  - isHolding:', this.isHolding);
        console.log('  - currentCup:', this.getCurrentCup() ? '존재' : 'null');
        
        if (this.gameState !== 'playing' || !this.isHolding || !this.getCurrentCup()) {
            console.log('❌ game.handleEnd() 실패 - 조건 불만족');
            return false;
        }
        
        this.isHolding = false;
        
        // holdDuration이 제공되지 않은 경우 계산
        if (holdDuration === null) {
            holdDuration = (performance.now() - this.getCurrentCup().holdStartTime) / 1000;
        }
        
        console.log(`홀드 지속 시간: ${holdDuration.toFixed(3)}초`);
        
        // 사운드 정지
        this.soundManager.endHold();
        
        // 완벽 타이밍 배경 효과 즉시 복구
        this.visualEffects.updatePerfectTimingBackground(false);
        
        // 지속적인 스플래시 효과 타이밍 리셋
        this.visualEffects.lastSplashTime = 0;
        
        // 결과 계산
        const result = this.calculateResult(holdDuration);
        console.log(`계산된 결과: ${result}`);
        
        this.processResult(result);
        
        console.log(`✅ 홀드 종료 완료: ${holdDuration.toFixed(3)}초, 결과: ${result}`);
        return true;
    }
    
    calculateResult(holdDuration) {
        console.log('🔍 calculateResult 호출됨');
        console.log('  - holdDuration:', holdDuration.toFixed(3), '초');
        console.log('  - currentCup:', this.getCurrentCup() ? this.getCurrentCup().type : 'null');
        
        if (this.getCurrentCup()) {
            console.log('  - cup.timing:', this.getCurrentCup().config.timing);
            console.log('  - cup.perfect:', this.getCurrentCup().config.perfect);
        }
        
        // CupSystem을 사용하여 결과 계산
        const result = this.cupSystem.calculateResult(this.getCurrentCup(), holdDuration);
        console.log('  - 계산된 결과:', result);
        
        return result;
    }
    
    processResult(result) {
        // 게임 통계 업데이트
        this.gameStats.totalCups++;
        
        // 결과별 상세 처리
        switch (result) {
            case 'tooEarly':
                this.processTooEarly();
                break;
            case 'success':
                this.processSuccess();
                break;
            case 'perfect':
                this.processPerfect();
                break;
            case 'overflow':
                this.processOverflow();
                break;
        }
        
        // 최대 콤보 업데이트
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 사운드 재생
        this.soundManager.playReleaseSound(result);
        
        // 시각적 피드백 표시
        this.visualEffects.showResultFeedback(result, this.getCurrentCup());
        
        // 컵 결과 저장
        this.getCurrentCup().result = result;
        this.getCurrentCup().isComplete = true;
        
        // 즉시 큐 이동 (애니메이션 제거)
        this.generateNewCup();
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 체크
        this.checkGameOver();
        
        // 게임 통계 로깅
        this.logGameStats(result);
    }
    
    /**
     * 게임 오버 체크
     */
    checkGameOver() {
        if (this.isGameOver()) {
            this.gameOver();
        }
    }
    
    /**
     * 게임 오버 조건 상세 체크
     */
    isGameOver() {
        const livesOver = this.lives <= 0;
        const timeOver = this.gameTime <= 0;
        
        if (livesOver || timeOver) {
            console.log('🔍 게임 오버 조건 체크:');
            console.log('  - lives:', this.lives, '(소진:', livesOver, ')');
            console.log('  - time:', this.gameTime.toFixed(1), '(소진:', timeOver, ')');
        }
        
        return livesOver || timeOver;
    }
    
    /**
     * 게임 오버 사유 반환
     */
    getGameOverReason() {
        if (this.lives <= 0) {
            console.log('💔 게임 오버 사유: 생명 소진');
            return 'lives'; // 생명 소진
        } else if (this.gameTime <= 0) {
            console.log('⏰ 게임 오버 사유: 시간 소진');
            return 'time'; // 시간 소진
        }
        return null;
    }
    
    /**
     * 너무 빠른 릴리즈 처리
     */
    processTooEarly() {
        // 콤보 리셋
        this.combo = 0;
        
        // 시간 감소 (10초)
        this.gameTime = Math.max(0, this.gameTime - 10);
        
        // 통계 업데이트
        this.gameStats.failedCups++;
        
        console.log(`❌ 너무 빠른 릴리즈: 시간 -10초, 콤보 리셋`);
        console.log(`  - 현재 시간: ${this.gameTime.toFixed(1)}초`);
        console.log(`  - 현재 콤보: ${this.combo}`);
    }
    
    /**
     * 성공 처리
     */
    processSuccess() {
        // 기본 점수 (10점)
        const baseScore = 10;
        console.log('🎯 processSuccess 시작 - 점수 추가 시도:', baseScore);
        
        const scoreResult = this.addScore(baseScore);
        console.log('  - addScore 결과:', scoreResult);
        console.log('  - 현재 총 점수:', this.getScore());
        
        // 콤보 유지 (성공도 콤보에 포함)
        this.combo++;
        
        // 성공 시에는 시간 패널티 없음 (시간 유지)
        // this.gameTime = Math.max(0, this.gameTime - 10); // 제거됨
        
        // 통계 업데이트
        this.gameStats.successCups++;
        
        console.log(`✅ 성공: +${baseScore}점, 콤보 ${this.combo}, 시간 유지, 최종 점수: ${this.getScore()}`);
        console.log(`  - 현재 시간: ${this.gameTime.toFixed(1)}초`);
        console.log(`  - 현재 콤보: ${this.combo}`);
    }
    
    /**
     * 완벽한 타이밍 처리
     */
    processPerfect() {
        // 기본 점수 (20점) + 콤보 보너스
        const baseScore = 20;
        const comboBonus = this.combo * 10; // 콤보당 10점 추가
        const totalScore = baseScore + comboBonus;
        
        console.log('🌟 processPerfect 시작 - 점수 추가 시도:', totalScore);
        console.log('  - 기본 점수:', baseScore);
        console.log('  - 콤보 보너스:', comboBonus);
        
        const scoreResult = this.addScore(totalScore);
        console.log('  - addScore 결과:', scoreResult);
        console.log('  - 현재 총 점수:', this.getScore());
        
        // 콤보 증가
        this.combo++;
        
        // 시간 연장 (2초)
        this.gameTime += 2;
        
        // 통계 업데이트
        this.gameStats.perfectCups++;
        
        console.log(`🌟 완벽한 타이밍: +${totalScore}점 (기본 ${baseScore} + 콤보 ${comboBonus}), 콤보 ${this.combo}, 시간 +2초, 최종 점수: ${this.getScore()}`);
        console.log(`  - 현재 시간: ${this.gameTime.toFixed(1)}초`);
        console.log(`  - 현재 콤보: ${this.combo}`);
    }
    
    /**
     * 넘침 처리
     */
    processOverflow() {
        // 콤보 리셋
        this.combo = 0;
        
        // 생명 감소
        this.lives--;
        
        // 시간 패널티 없음 (넘침 구간에서는 시간 변화 없음)
        // this.gameTime = Math.max(0, this.gameTime - 10);
        
        // 통계 업데이트
        this.gameStats.failedCups++;
        
        console.log(`💥 넘침: 생명 -1, 시간 변화 없음, 콤보 리셋`);
        console.log(`  - 현재 생명: ${this.lives}`);
        console.log(`  - 현재 시간: ${this.gameTime.toFixed(1)}초`);
        console.log(`  - 현재 콤보: ${this.combo}`);
    }
    
    /**
     * 게임 통계 로깅
     */
    logGameStats(result) {
        const accuracy = this.gameStats.totalCups > 0 
            ? ((this.gameStats.successCups + this.gameStats.perfectCups) / this.gameStats.totalCups * 100).toFixed(1)
            : 0;
        
        const perfectRate = this.gameStats.totalCups > 0 
            ? (this.gameStats.perfectCups / this.gameStats.totalCups * 100).toFixed(1)
            : 0;
        
        console.log(`게임 통계: 총 ${this.gameStats.totalCups}개 컵, 정확도 ${accuracy}%, 완벽률 ${perfectRate}%, 최대 콤보 ${this.maxCombo}`);
    }
    
    animateCupExit() {
        // 컵 퇴장 애니메이션 로직 (나중에 구현)
        console.log('컵 퇴장 애니메이션');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.updateUIMode('menu'); // 메뉴 모드로 UI 변경 (게임 오버 화면 클릭 허용)
        
        // 최고 점수 업데이트
        const currentScore = this.getScore();
        const currentHighScore = this.getHighScore();
        if (currentScore > currentHighScore) {
            this.setHighScore(currentScore);
            this.saveHighScore();
        }
        
        // 게임 통계 완료
        this.gameStats.totalPlayTime = Date.now() - this.gameStats.startTime;
        
        // 최종 통계 계산
        const finalStats = this.calculateFinalStats();
        
        // 게임 오버 화면 표시 (UIManager 사용)
        this.uiManager.showGameOver(this.getScore(), this.getHighScore());
        
        // 최종 통계 로깅
        this.logFinalStats(finalStats);
    }
    
    /**
     * 최종 게임 통계 계산
     */
    calculateFinalStats() {
        const accuracy = this.gameStats.totalCups > 0 
            ? ((this.gameStats.successCups + this.gameStats.perfectCups) / this.gameStats.totalCups * 100)
            : 0;
        
        const perfectRate = this.gameStats.totalCups > 0 
            ? (this.gameStats.perfectCups / this.gameStats.totalCups * 100)
            : 0;
        
        const avgScorePerCup = this.gameStats.totalCups > 0 
            ? (this.getScore() / this.gameStats.totalCups)
            : 0;
        
        const gameOverReason = this.getGameOverReason();
        
        return {
            finalScore: this.getScore(),
            highScore: this.getHighScore(),
            maxCombo: this.maxCombo,
            accuracy: accuracy,
            perfectRate: perfectRate,
            avgScorePerCup: avgScorePerCup,
            totalCups: this.gameStats.totalCups,
            perfectCups: this.gameStats.perfectCups,
            successCups: this.gameStats.successCups,
            failedCups: this.gameStats.failedCups,
            totalPlayTime: this.gameStats.totalPlayTime,
            gameOverReason: gameOverReason
        };
    }
    
    /**
     * 최종 통계 로깅
     */
    logFinalStats(stats) {
        console.log('=== 게임 종료 통계 ===');
        console.log(`최종 점수: ${stats.finalScore.toLocaleString()}`);
        console.log(`최고 점수: ${stats.highScore.toLocaleString()}`);
        console.log(`최대 콤보: ${stats.maxCombo}`);
        console.log(`정확도: ${stats.accuracy.toFixed(1)}%`);
        console.log(`완벽률: ${stats.perfectRate.toFixed(1)}%`);
        console.log(`컵당 평균 점수: ${stats.avgScorePerCup.toFixed(1)}`);
        console.log(`총 컵 수: ${stats.totalCups}`);
        console.log(`완벽한 컵: ${stats.perfectCups}`);
        console.log(`성공한 컵: ${stats.successCups}`);
        console.log(`실패한 컵: ${stats.failedCups}`);
        console.log(`총 플레이 시간: ${(stats.totalPlayTime / 1000).toFixed(1)}초`);
        console.log(`게임 오버 사유: ${stats.gameOverReason === 'lives' ? '생명 소진' : '시간 소진'}`);
        console.log('======================');
    }
    
    updateUI() {
        // UIManager를 통한 UI 업데이트
        this.uiManager.updateUI(this);
    }
    
    loadHighScore() {
        try {
            const savedScore = parseInt(localStorage.getItem('barista-high-score') || '0');
            const savedHash = localStorage.getItem('barista-high-score-hash') || '';
            
            // 저장된 최고점수의 무결성 검증
            if (savedScore > 0 && savedHash) {
                const expectedHash = this.generateScoreHash(savedScore);
                if (expectedHash === savedHash) {
                    this.setHighScore(savedScore);
                    console.log('✅ 저장된 최고점수 검증 완료:', savedScore);
                } else {
                    console.warn('⚠️ 저장된 최고점수가 조작된 것으로 의심됩니다. 초기화합니다.');
                    this.setHighScore(0);
                    this.saveHighScore();
                }
            } else {
                this.setHighScore(savedScore);
            }
        } catch (error) {
            console.error('최고점수 로드 중 오류:', error);
            this.setHighScore(0);
        }
    }

    saveHighScore() {
        try {
            const highScore = this.getHighScore();
            const highScoreHash = this.generateScoreHash(highScore);
            
            localStorage.setItem('barista-high-score', highScore.toString());
            localStorage.setItem('barista-high-score-hash', highScoreHash);
            console.log('💾 최고점수 저장 완료:', highScore);
        } catch (error) {
            console.error('최고점수 저장 중 오류:', error);
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') {
            // 게임이 'playing' 상태가 아닐 때는 시간 감소하지 않음
            return;
        }
        
        // 게임 시간 업데이트 (playing 상태일 때만)
        this.gameTime -= deltaTime / 1000;
        
        // 시간이 음수가 되지 않도록 보정
        if (this.gameTime < 0) {
            this.gameTime = 0;
        }
        
        // 홀드 중인 경우 타이밍 구간 체크 (InputManager에서 실시간 시간 가져오기)
        if (this.isHolding && this.getCurrentCup()) {
            const holdDuration = this.inputManager.getCurrentHoldDuration();
            this.checkTimingZone(holdDuration);
            
            // 커피 채우기 애니메이션
            this.getCurrentCup().fillLevel = Math.min(1, holdDuration / this.getCurrentCup().config.maxTime);
        }
        
        // 시각적 효과 업데이트
        this.visualEffects.update();
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 체크 (시간 소진)
        if (this.gameTime <= 0) {
            console.log('⏰ 게임 시간 소진 - 게임 오버');
            this.gameOver();
        }
    }
    
    checkTimingZone(holdDuration) {
        const { maxTime } = this.getCurrentCup().config;
        const zone = this.cupSystem.getCurrentZone(holdDuration, maxTime);
        let previousZone = this.getCurrentCup().lastTimingZone || 'basic';
        
        // 타이밍 구간별 시각 효과
        if (zone === 'passing') {
            // 합격 타이밍 구간에서 지속적인 물방울 효과 (조금 튀다가 점점 많이 튐)
            this.visualEffects.createContinuousSplashEffect(this.getCurrentCup(), 'passing', holdDuration, maxTime);
        } else if (zone === 'perfect') {
            // 완벽한 타이밍 구간에서 특별한 배경 효과 + 강화된 물방울 효과
            this.visualEffects.createContinuousSplashEffect(this.getCurrentCup(), 'perfect', holdDuration, maxTime);
            this.visualEffects.updatePerfectTimingBackground(true);
        } else if (zone === 'overflow') {
            // 넘침 구간에서 많은 양의 지속적인 물방울 효과
            this.visualEffects.createContinuousSplashEffect(this.getCurrentCup(), 'overflow', holdDuration, maxTime);
            this.visualEffects.updatePerfectTimingBackground(false);
        } else {
            // basic 구간에서는 배경 효과 해제
            this.visualEffects.updatePerfectTimingBackground(false);
        }
        
        // 현재 구간 저장
        this.getCurrentCup().lastTimingZone = zone;
        
        this.soundManager.updateTimingZone(zone);
    }
    
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'start') {
            this.renderStartScreen();
        } else if (this.gameState === 'playing') {
            this.renderGame();
        } else if (this.gameState === 'gameOver') {
            this.renderGameOver();
        }
    }
    
    renderStartScreen() {
        // 시작 화면은 HTML로 처리
    }
    
    renderGame() {
        // 기본 배경
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 완벽한 타이밍 배경 효과 (배경 위에 오버레이)
        this.visualEffects.renderPerfectTimingBackground();
        
        // 커피 흐름 렌더링 (홀드 중일 때) - 컵보다 먼저 렌더링해서 컵 뒤에 숨겨지게 함
        if (this.isHolding) {
            this.renderCoffeeFlow();
        }
        
        // 모든 큐의 컵 렌더링 - 물줄기를 가리도록 나중에 렌더링
        this.renderAllCups();
        
        // 수도꼭지 렌더링 - 맨 마지막에 렌더링해서 가장 앞에 보이게 함
        this.renderFaucet();
        
        // 텍스트 애니메이션 렌더링 - 모든 요소 위에 표시
        this.visualEffects.renderTextAnimations();
    }

    /**
     * 모든 큐의 컵 렌더링
     */
    renderAllCups() {
        for (let i = 0; i < this.cupQueue.length; i++) {
            const cup = this.cupQueue[i];
            if (cup) {
                // 작업 중인 컵인지 확인
                const isActiveCup = (i === this.activeCupIndex);
                this.renderCup(cup, isActiveCup);
            }
        }
    }
    
    renderCup(cup, isActiveCup = false) {
        // 컵의 실제 위치 사용 (큐 위치에서 계산된 값)
        const cupX = cup.x;
        const cupY = cup.y;
        
        // 컵 타입별 크기 설정 (바닥 위치 유지를 위해 높이에 따라 Y 위치 조정)
        const cupConfig = cup.config;
        cup.width = cupConfig.width;
        cup.height = cupConfig.height;
        
        // 회전 및 투명도 효과 적용
        this.ctx.save();
        
        // 회전 효과
        if (cup.rotation) {
            this.ctx.translate(cupX, cupY);
            this.ctx.rotate(cup.rotation);
            this.ctx.translate(-cupX, -cupY);
        }
        
        // 투명도 효과 (비활성 컵은 반투명, 완료된 컵은 더 투명)
        if (cup.alpha !== undefined) {
            this.ctx.globalAlpha = cup.alpha;
        } else if (cup.isCompleted) {
            this.ctx.globalAlpha = 0.25; // 완료된 컵은 더 투명하게 (25%)
        } else if (!isActiveCup) {
            this.ctx.globalAlpha = 0.6; // 비활성 컵은 투명도 60%
        }
        
        // 컵 그리기 (각 컵 타입별 크기 사용)
        this.ctx.fillStyle = cup.config.color;
        this.ctx.fillRect(cupX - cup.width/2, cupY - cup.height/2, cup.width, cup.height);
        
        // 컵 테두리
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(cupX - cup.width/2, cupY - cup.height/2, cup.width, cup.height);
        
        this.ctx.restore();
        
        // 커피 채우기 효과 (사용자에게 보이지 않음)
        // fillLevel 계산은 게임 로직용으로 유지하되 시각적 표시는 제거
        // if (cup.fillLevel > 0) {
        //     this.visualEffects.renderCoffeeFill(cup, cup.fillLevel);
        // }
        
        // 컵 라벨 제거 - 컵 이름 표시하지 않음
        
        // 완료된 컵에 체크마크 표시
        if (cup.isCompleted) {
            this.ctx.fillStyle = '#4CAF50'; // 녹색 체크마크
            this.ctx.font = '24px Inter';
            this.ctx.fillText('✓', cupX, cupY - 20);
        }
        
        // 파티클 효과 렌더링
        this.visualEffects.renderParticles();
    }
    
    renderFaucet() {
        const faucetX = this.centerX;
        const faucetY = this.centerY - 100; // 수도꼭지는 원래 위치 유지
        
        // 수도꼭지
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(faucetX - 20, faucetY - 20, 40, 40);
        
        // 수도꼭지 테두리
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(faucetX - 20, faucetY - 20, 40, 40);
    }
    
    renderCoffeeFlow() {
        // 커피 흐름 애니메이션 (수도꼭지에서 컵으로)
        this.visualEffects.renderCoffeeStream(this.centerX, this.centerY - 80);
    }
    
    renderGameOver() {
        // 게임 오버 화면은 HTML로 처리
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// UI 관리 클래스
class UIManager {
    constructor() {
        // DOM 요소 참조
        this.hearts = document.querySelectorAll('.heart');
        this.timeFill = document.getElementById('timeFill');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScore = document.getElementById('finalScore');
        this.highScore = document.getElementById('highScore');
        this.startScreen = document.getElementById('startScreen');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // UI 상태 추적
        this.uiStats = {
            heartAnimations: 0,
            timeBarUpdates: 0,
            gameOverShows: 0,
            totalUpdates: 0
        };
        
        // 이전 상태 저장 (애니메이션 최적화용)
        this.previousState = {
            lives: 3,
            gameTime: 120,
            score: 0
        };
        
        this.initializeUI();
        
        // 초기 상태: 시작 화면이 보이므로 오버레이 클릭 활성화
        this.setOverlayPointerEvents(true);
    }
    
    /**
     * UI 초기화
     */
    initializeUI() {
        // 하트 초기화
        this.hearts.forEach((heart, index) => {
            heart.style.transition = 'all 0.3s ease';
            heart.style.transform = 'scale(1)';
        });
        
        // 시간 바 초기화
        this.timeFill.style.transition = 'width 0.1s linear';
        this.timeFill.style.width = '100%';
        
        // 게임 오버 화면 초기화
        this.gameOverScreen.style.transition = 'all 0.3s ease';
        this.gameOverScreen.style.opacity = '0';
        this.gameOverScreen.style.transform = 'scale(0.8)';
        
        console.log('UIManager 초기화 완료');
    }
    
    /**
     * 실시간 UI 업데이트
     */
    updateUI(game) {
        this.uiStats.totalUpdates++;
        
        // 하트 업데이트
        this.updateLives(game.lives);
        
        // 시간 바 업데이트
        this.updateTimeBar(game.gameTime, game.maxTime);
        
        // 이전 상태 업데이트
        this.previousState = {
            lives: game.lives,
            gameTime: game.gameTime,
            score: game.getScore()
        };
    }
    
    /**
     * 하트 (기회) 업데이트
     */
    updateLives(lives) {
        this.hearts.forEach((heart, index) => {
            const heartNumber = index + 1;
            
            if (heartNumber <= lives) {
                // 하트 활성화
                if (heart.classList.contains('lost')) {
                    heart.classList.remove('lost');
                    heart.style.opacity = '1';
                    heart.style.transform = 'scale(1)';
                }
            } else {
                // 하트 비활성화
                if (!heart.classList.contains('lost')) {
                    this.animateHeartLoss(heart);
                }
            }
        });
    }
    
    /**
     * 하트 손실 애니메이션
     */
    animateHeartLoss(heart) {
        heart.classList.add('lost');
        
        // 애니메이션 효과
        heart.style.transform = 'scale(1.3)';
        heart.style.opacity = '0.7';
        
        setTimeout(() => {
            heart.style.transform = 'scale(1)';
            heart.style.opacity = '0.3';
        }, 150);
        
        // 추가 효과: 하트 깜빡임
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            heart.style.opacity = heart.style.opacity === '0.3' ? '0.1' : '0.3';
            blinkCount++;
            
            if (blinkCount >= 6) { // 3번 깜빡임
                clearInterval(blinkInterval);
                heart.style.opacity = '0.3';
            }
        }, 100);
        
        this.uiStats.heartAnimations++;
    }
    
    /**
     * 시간 바 업데이트
     */
    updateTimeBar(currentTime, maxTime) {
        const percentage = Math.max(0, Math.min(100, (currentTime / maxTime) * 100));
        
        // 기본 시간 바 업데이트
        this.timeFill.style.width = `${percentage}%`;
        
        // 시간 연장 효과 (완벽한 타이밍으로 시간이 늘어날 때)
        if (currentTime > maxTime) {
            this.handleTimeExtension(currentTime, maxTime);
        }
        
        // 시간 바 색상 변화 (시간이 적을 때 빨간색으로)
        this.updateTimeBarColor(percentage);
        
        this.uiStats.timeBarUpdates++;
    }
    
    /**
     * 시간 연장 효과 처리
     */
    handleTimeExtension(currentTime, maxTime) {
        const overflowPercentage = ((currentTime - maxTime) / maxTime) * 100;
        const extendedWidth = Math.min(150, 100 + overflowPercentage * 0.5); // 최대 150%
        
        this.timeFill.style.width = `${extendedWidth}%`;
        
        // 시간 연장 시 특별한 색상 효과
        this.timeFill.style.background = 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)';
        
        // 펄스 효과
        this.timeFill.style.animation = 'pulse 0.5s ease-in-out';
        
        setTimeout(() => {
            this.timeFill.style.animation = '';
        }, 500);
    }
    
    /**
     * 시간 바 색상 업데이트
     */
    updateTimeBarColor(percentage) {
        if (percentage > 50) {
            // 충분한 시간 - 파란색 그라데이션
            this.timeFill.style.background = 'linear-gradient(90deg, #4ECDC4 0%, #45B7D1 50%, #96CEB4 100%)';
        } else if (percentage > 25) {
            // 시간 부족 - 노란색 그라데이션
            this.timeFill.style.background = 'linear-gradient(90deg, #FFEAA7 0%, #FDCB6E 50%, #E17055 100%)';
        } else {
            // 위험 - 빨간색 그라데이션
            this.timeFill.style.background = 'linear-gradient(90deg, #FF6B6B 0%, #FF5252 50%, #E53E3E 100%)';
            
            // 위험 시 깜빡임 효과
            if (percentage > 0) {
                this.timeFill.style.animation = 'danger-blink 0.3s ease-in-out infinite';
            }
        }
    }
    
    /**
     * 게임 오버 화면 표시
     */
    showGameOver(finalScore, highScore) {
        this.finalScore.textContent = finalScore.toLocaleString();
        this.highScore.textContent = highScore.toLocaleString();
        
        // 게임 오버 화면 표시 시 오버레이 클릭 활성화 (UI 클릭 허용)
        this.setOverlayPointerEvents(true);
        
        // 화면 표시
        this.gameOverScreen.style.display = 'block';
        
        // 페이드인 애니메이션
        requestAnimationFrame(() => {
            this.gameOverScreen.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.gameOverScreen.style.opacity = '1';
            this.gameOverScreen.style.transform = 'scale(1)';
        });
        
        // 점수 카운트업 애니메이션
        this.animateScoreCountup(this.finalScore, 0, finalScore, 1000);
        
        this.uiStats.gameOverShows++;
        
        console.log('게임 오버 화면 표시');
    }
    
    /**
     * 점수 카운트업 애니메이션
     */
    animateScoreCountup(element, start, end, duration) {
        const startTime = performance.now();
        
        const updateScore = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 이징 함수 (easeOut)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentScore = Math.floor(start + (end - start) * easeProgress);
            
            element.textContent = currentScore.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateScore);
            } else {
                element.textContent = end.toLocaleString();
            }
        };
        
        requestAnimationFrame(updateScore);
    }
    
    /**
     * 게임 시작 화면 숨기기
     */
    hideStartScreen() {
        this.startScreen.style.transition = 'all 0.3s ease';
        this.startScreen.style.opacity = '0';
        this.startScreen.style.transform = 'scale(0.9)';
        
        // 게임 시작 시 오버레이 클릭 비활성화 (캔버스 클릭 허용)
        this.setOverlayPointerEvents(false);
        
        setTimeout(() => {
            this.startScreen.style.display = 'none';
        }, 300);
    }
    
    /**
     * 게임 오버 화면 숨기기
     */
    hideGameOverScreen() {
        this.gameOverScreen.style.transition = 'all 0.3s ease';
        this.gameOverScreen.style.opacity = '0';
        this.gameOverScreen.style.transform = 'scale(0.8)';
        
        // 게임 오버 화면 숨길 때 오버레이 클릭 활성화 (UI 클릭 허용)
        this.setOverlayPointerEvents(true);
        
        setTimeout(() => {
            this.gameOverScreen.style.display = 'none';
        }, 300);
    }
    
    /**
     * 오버레이 포인터 이벤트 제어
     * @param {boolean} enable - true면 UI 클릭 허용, false면 캔버스 클릭 허용
     */
    setOverlayPointerEvents(enable) {
        const overlay = document.querySelector('.ui-overlay');
        if (overlay) {
            overlay.style.pointerEvents = enable ? 'auto' : 'none';
            console.log(`오버레이 포인터 이벤트: ${enable ? '활성화' : '비활성화'}`);
        }
    }

    /**
     * 성능 최적화
     */
    optimizeForPerformance() {
        console.log('UIManager 성능 최적화 실행...');
        
        // 애니메이션 효과 단순화
        this.hearts.forEach(heart => {
            heart.style.transition = 'opacity 0.1s ease';
        });
        
        // 시간 바 애니메이션 단순화
        this.timeFill.style.transition = 'width 0.2s linear';
        
        // 게임 오버 화면 애니메이션 단순화
        this.gameOverScreen.style.transition = 'opacity 0.2s ease';
        
        console.log('UIManager 성능 최적화 완료');
    }
    
    /**
     * UI 상태 초기화
     */
    reset() {
        // 하트 초기화
        this.hearts.forEach(heart => {
            heart.classList.remove('lost');
            heart.style.opacity = '1';
            heart.style.transform = 'scale(1)';
            heart.style.animation = '';
        });
        
        // 시간 바 초기화
        this.timeFill.style.width = '100%';
        this.timeFill.style.background = 'linear-gradient(90deg, #4ECDC4 0%, #45B7D1 50%, #96CEB4 100%)';
        this.timeFill.style.animation = '';
        
        // 게임 오버 화면 숨기기
        this.hideGameOverScreen();

        // 시작 화면 표시 상태 복구 (재시작 시 검은 화면 방지)
        this.startScreen.style.display = 'block';
        this.startScreen.style.opacity = '1';
        this.startScreen.style.transform = 'scale(1)';
        
        // 통계 초기화
        this.uiStats = {
            heartAnimations: 0,
            timeBarUpdates: 0,
            gameOverShows: 0,
            totalUpdates: 0
        };
        
        console.log('UIManager 초기화 완료');
    }
    
    /**
     * UI 통계 조회
     */
    getUIStats() {
        return {
            ...this.uiStats,
            currentLives: this.hearts.length - document.querySelectorAll('.heart.lost').length,
            timeBarWidth: this.timeFill.style.width
        };
    }
    
    /**
     * 디버그 정보 출력
     */
    debugInfo() {
        const stats = this.getUIStats();
        console.log('=== UIManager 디버그 정보 ===');
        console.log(`총 UI 업데이트: ${stats.totalUpdates}`);
        console.log(`하트 애니메이션: ${stats.heartAnimations}`);
        console.log(`시간 바 업데이트: ${stats.timeBarUpdates}`);
        console.log(`게임 오버 표시: ${stats.gameOverShows}`);
        console.log(`현재 생명: ${stats.currentLives}`);
        console.log(`시간 바 너비: ${stats.timeBarWidth}`);
        console.log('===============================');
    }
}

// 사운드 매니저 클래스
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.currentHoldSound = null;
        this.isHolding = false;
        this.isInitialized = false;
        this.masterVolume = 0.4;
        this.volumeSettings = {
            hold: 0.3,
            release: 0.5,
            ambient: 0.2
        };
        
        // 사운드 통계
        this.soundStats = {
            soundsLoaded: 0,
            soundsPlayed: 0,
            holdSoundsPlayed: 0,
            releaseSoundsPlayed: 0
        };
        
        this.initializeAudioContext();
        // 사운드 로딩을 비동기로 처리하여 게임 시작을 막지 않음
        this.loadSounds().catch(error => {
            console.warn('⚠️ 사운드 로딩 실패, 게임은 계속 진행됩니다:', error);
        });
    }
    
    /**
     * 오디오 컨텍스트 초기화
     */
    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 사용자 상호작용 후 오디오 컨텍스트 활성화
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isInitialized = true;
            console.log('오디오 컨텍스트 초기화 완료');
        } catch (error) {
            console.error('오디오 컨텍스트 초기화 실패:', error);
            this.createFallbackSystem();
        }
    }
    
    /**
     * 폴백 시스템 (오디오 파일이 없을 때)
     */
    createFallbackSystem() {
        console.log('폴백 사운드 시스템 활성화');
        this.isInitialized = false;
    }
    
    /**
     * 사운드 파일 로딩
     */
    async loadSounds() {
        const soundFiles = {
            'hold-basic': 'assets/sounds/hold-basic.mp3',
            'hold-passing': 'assets/sounds/hold-passing.mp3',
            'hold-perfect': 'assets/sounds/hold-perfect.mp3',
            'hold-overflow': 'assets/sounds/hold-overflow.mp3',
            'release-early': 'assets/sounds/release-early.mp3',
            'release-success': 'assets/sounds/release-success.mp3',
            'release-perfect': 'assets/sounds/release-perfect.mp3',
            'release-overflow': 'assets/sounds/release-overflow.mp3'
        };
        
        console.log('🔊 사운드 파일 로딩 시작...');
        
        for (const [key, url] of Object.entries(soundFiles)) {
            await this.loadSound(key, url);
        }
        
        console.log(`✅ 사운드 로딩 완료: ${this.soundStats.soundsLoaded}/${Object.keys(soundFiles).length}`);
        
        // 사운드 파일이 없어도 게임은 계속 진행
        if (this.soundStats.soundsLoaded === 0) {
            console.log('⚠️ 사운드 파일이 없습니다. 게임은 계속 진행됩니다.');
        }
    }
    
    /**
     * 개별 사운드 로딩
     */
    async loadSound(name, url) {
        if (!this.isInitialized) {
            console.warn(`오디오 컨텍스트가 초기화되지 않음: ${name}`);
            return;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.sounds[name] = await this.audioContext.decodeAudioData(arrayBuffer);
            this.soundStats.soundsLoaded++;
            console.log(`사운드 로딩 완료: ${name}`);
        } catch (error) {
            console.warn(`사운드 로딩 실패: ${name}`, error);
            // 폴백으로 프로그래밍 방식 사운드 생성
            this.createFallbackSound(name);
        }
    }
    
    /**
     * 폴백 사운드 생성 (프로그래밍 방식)
     */
    createFallbackSound(name) {
        if (!this.isInitialized) return;
        
        try {
            const duration = 0.5; // 0.5초
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
            const data = buffer.getChannelData(0);
            
            // 사운드 타입별 주파수 설정
            let frequency = 440; // 기본 A4
            switch (name) {
                case 'hold-basic':
                    frequency = 262; // 낮은 톤
                    break;
                case 'hold-passing':
                    frequency = 330; // 중간 톤
                    break;
                case 'hold-perfect':
                    frequency = 392; // 높은 톤
                    break;
                case 'hold-overflow':
                    frequency = 180; // 매우 낮은 톤
                    break;
                case 'release-early':
                    frequency = 208; // 실패 톤
                    break;
                case 'release-success':
                    frequency = 524; // 성공 톤 (C5)
                    break;
                case 'release-perfect':
                    frequency = 659; // 완벽 톤 (E5)
                    break;
                case 'release-overflow':
                    frequency = 150; // 넘침 톤
                    break;
            }
            
            // 사인파 생성
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.15;
                
                // 페이드 아웃 효과
                if (name.includes('release')) {
                    data[i] *= (1 - i / data.length);
                }
            }
            
            this.sounds[name] = buffer;
            this.soundStats.soundsLoaded++;
            console.log(`폴백 사운드 생성: ${name} (${frequency}Hz)`);
        } catch (error) {
            console.error(`폴백 사운드 생성 실패: ${name}`, error);
        }
    }
    
    
    /**
     * 홀드 사운드 재생 (기존 사운드가 있으면 먼저 정지)
     */
    playHoldSound(type) {
        // 사운드가 없어도 게임은 계속 진행
        if (!this.isInitialized) {
            console.log(`🔇 사운드 없음: 홀드 사운드 ${type} (게임 계속 진행)`);
            return;
        }
        
        // 기존 홀드 사운드가 있으면 먼저 정지
        this.stopCurrentHoldSound();
        
        const soundKey = `hold-${type}`;
        const sound = this.sounds[soundKey];
        
        if (sound) {
            try {
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                source.buffer = sound;
                source.loop = true; // 모든 홀드 사운드를 루프로
                
                // 볼륨 설정
                gainNode.gain.value = this.masterVolume * this.volumeSettings.hold;
                
                // 연결
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                source.start();
                this.currentHoldSound = source;
                this.soundStats.holdSoundsPlayed++;
                
                console.log(`홀드 사운드 재생: ${type}`);
            } catch (error) {
                console.error(`홀드 사운드 재생 실패: ${type}`, error);
            }
        } else {
            // 사운드 파일이 없으면 지속적인 홀드 사운드 생성
            this.currentHoldSound = this.createContinuousHoldSound(type);
            console.log(`지속적인 홀드 사운드 시작: ${type}`);
        }
    }
    
    /**
     * 현재 홀드 사운드 정지
     */
    stopCurrentHoldSound() {
        if (this.currentHoldSound) {
            try {
                this.currentHoldSound.stop();
            } catch (error) {
                // 이미 정지된 사운드
            }
            this.currentHoldSound = null;
        }
    }
    
    /**
     * 홀드 시작
     */
    startHold() {
        console.log('🎵 startHold 호출됨');
        this.isHolding = true;
        // 기본 홀드 사운드로 시작
        this.playHoldSound('basic');
        console.log('✅ 홀드 사운드 시작됨 (basic)');
    }

    /**
     * 타이밍 구간 변화 처리
     */
    updateTimingZone(zone) {
        if (!this.isHolding) return;
        
        console.log(`🔄 updateTimingZone 호출됨: ${zone}`);
        
        // 타이밍 구간에 따라 적절한 홀드 사운드로 변경
        const soundType = zone === 'perfect' ? 'perfect' : 
                         zone === 'passing' ? 'passing' : 
                         zone === 'overflow' ? 'overflow' : 'basic';
        
        // 현재 홀드 사운드가 있으면서 changeFrequency 기능이 있다면 사용
        if (this.currentHoldSound && this.currentHoldSound.changeFrequency) {
            console.log(`  - 주파수 변경: ${soundType}`);
            this.currentHoldSound.changeFrequency(soundType);
        } else {
            // 그렇지 않으면 새로운 홀드 사운드로 교체
            console.log(`  - 홀드 사운드 교체: ${soundType}`);
            this.playHoldSound(soundType);
        }
        
        console.log(`✅ 타이밍 구간 변화: ${zone} -> ${soundType} 사운드`);
    }

    /**
     * 홀드 종료
     */
    endHold() {
        this.isHolding = false;
        this.stopCurrentHoldSound();
        console.log('홀드 사운드 종료');
    }
    
    /**
     * 모든 홀드 사운드 정지
     */
    stopAllHoldSounds() {
        this.stopCurrentHoldSound();
        console.log('모든 홀드 사운드 정지');
    }
    
    /**
     * 릴리즈 사운드 재생
     */
    playReleaseSound(result) {
        if (!this.isInitialized) {
            console.log(`폴백: 릴리즈 사운드 ${result}`);
            return;
        }
        
        const soundKey = `release-${result}`;
        const sound = this.sounds[soundKey];
        
        if (sound) {
            try {
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                source.buffer = sound;
                
                // 볼륨 설정
                gainNode.gain.value = this.masterVolume * this.volumeSettings.release;
                
                // 연결
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                source.start();
                this.soundStats.releaseSoundsPlayed++;
                this.soundStats.soundsPlayed++;
                
                console.log(`릴리즈 사운드 재생: ${result}`);
            } catch (error) {
                console.error(`릴리즈 사운드 재생 실패: ${result}`, error);
            }
        } else {
            // 사운드 파일이 없으면 기본 beep 소리 생성
            this.playBeepSound(result, false);
        }
    }
    
    /**
     * 지속적인 홀드 사운드 생성
     */
    createContinuousHoldSound(type) {
        if (!this.isInitialized) return null;
        
        try {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            // 타입별 주파수 설정
            const frequencies = {
                basic: { main: 392, harmony: 523 },      // G4 + C5
                passing: { main: 523, harmony: 659 },    // C5 + E5 (합격 구간)
                perfect: { main: 784, harmony: 988 }     // G5 + B5 (완벽 구간, 높은 톤)
            };
            
            const freq = frequencies[type] || frequencies.basic;
            
            oscillator1.frequency.value = freq.main;
            oscillator1.type = 'sine';
            oscillator2.frequency.value = freq.harmony;
            oscillator2.type = 'triangle';
            
            // 필터 설정
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 3000;
            filterNode.Q.value = 1;
            
            // 볼륨 설정
            const baseVolume = this.masterVolume * this.volumeSettings.hold * 0.25;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(baseVolume, this.audioContext.currentTime + 0.1);
            
            // 하모니 게인
            const harmonyGain = this.audioContext.createGain();
            harmonyGain.gain.value = 0.1;
            
            // 연결
            oscillator1.connect(filterNode);
            oscillator2.connect(harmonyGain);
            harmonyGain.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 재생 시작 (무한 지속)
            oscillator1.start();
            oscillator2.start();
            
            return {
                oscillator1,
                oscillator2,
                gainNode,
                filterNode,
                harmonyGain,
                stop: () => {
                    try {
                        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                        setTimeout(() => {
                            oscillator1.stop();
                            oscillator2.stop();
                        }, 150);
                    } catch(e) {}
                },
                changeFrequency: (newType) => {
                    const newFreq = frequencies[newType] || frequencies.basic;
                    console.log(`🎵 주파수 변경: ${newType} -> ${newFreq.main}Hz, ${newFreq.harmony}Hz`);
                    
                    try {
                        // 더 빠른 전환으로 즉각적인 변화 느낌
                        oscillator1.frequency.exponentialRampToValueAtTime(newFreq.main, this.audioContext.currentTime + 0.05);
                        oscillator2.frequency.exponentialRampToValueAtTime(newFreq.harmony, this.audioContext.currentTime + 0.05);
                        console.log(`✅ 주파수 변경 완료`);
                    } catch (error) {
                        console.error(`❌ 주파수 변경 실패:`, error);
                    }
                }
            };
            
        } catch (error) {
            console.error('지속 홀드 사운드 생성 실패:', error);
            return null;
        }
    }

    /**
     * 릴리즈 사운드 생성 (부드러운 버전)
     */
    playBeepSound(type, isHold) {
        if (!this.isInitialized) return;
        if (isHold) return; // 홀드는 별도 처리
        
        try {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            // 릴리즈 사운드 주파수 (더 부드럽고 기분 좋게)
            const frequencies = {
                early: { main: 330, harmony: 392 },      // E4 + G4 (아쉬움)
                success: { main: 523, harmony: 659 },    // C5 + E5 (딩~ 부드러운 성공음)
                perfect: { main: 784, harmony: 1047 },   // G5 + C6 (아주 좋은 완벽음)
                overflow: { main: 196, harmony: 233 }    // G3 + Bb3 (경고)
            };
            
            const freq = frequencies[type] || frequencies.success;
            
            oscillator1.frequency.value = freq.main;
            oscillator1.type = 'sine';
            oscillator2.frequency.value = freq.harmony;
            oscillator2.type = 'triangle';
            
            // 부드러운 필터
            filterNode.type = 'lowpass';
            filterNode.frequency.value = type === 'perfect' ? 4000 : 2500;
            filterNode.Q.value = 0.7;
            
            // 볼륨 설정 (타입별 차별화)
            let baseVolume;
            if (type === 'perfect') {
                baseVolume = this.masterVolume * 0.4; // 완벽은 더 크게
            } else if (type === 'success') {
                baseVolume = this.masterVolume * 0.25; // 성공은 부드럽게
            } else {
                baseVolume = this.masterVolume * 0.2;
            }
            
            // 부드러운 페이드 인
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(baseVolume, this.audioContext.currentTime + 0.02);
            
            // 지속시간 (perfect는 더 길게)
            const duration = type === 'perfect' ? 0.6 : type === 'success' ? 0.4 : 0.25;
            
            // 자연스러운 페이드 아웃 (딩~ 효과)
            gainNode.gain.exponentialRampToValueAtTime(baseVolume * 0.7, this.audioContext.currentTime + duration * 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            // 하모니 설정
            const harmonyGain = this.audioContext.createGain();
            harmonyGain.gain.value = type === 'perfect' ? 0.2 : 0.1;
            
            // 연결
            oscillator1.connect(filterNode);
            oscillator2.connect(harmonyGain);
            harmonyGain.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator1.start();
            oscillator2.start();
            oscillator1.stop(this.audioContext.currentTime + duration);
            oscillator2.stop(this.audioContext.currentTime + duration);
            
            console.log(`부드러운 릴리즈 사운드: ${type}`);
            
        } catch (error) {
            console.error('릴리즈 사운드 생성 실패:', error);
        }
    }

    /**
     * 볼륨 설정
     */
    setVolume(category, volume) {
        if (category === 'master') {
            this.masterVolume = Math.max(0, Math.min(1, volume));
        } else if (this.volumeSettings[category] !== undefined) {
            this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
        }
        
        console.log(`볼륨 설정: ${category} = ${volume}`);
    }
    
    /**
     * 사운드 통계 조회
     */
    getSoundStats() {
        return {
            ...this.soundStats,
            isInitialized: this.isInitialized,
            masterVolume: this.masterVolume,
            volumeSettings: { ...this.volumeSettings }
        };
    }
    
    /**
     * 성능 최적화
     */
    optimizeForPerformance() {
        console.log('SoundManager 성능 최적화 실행...');
        
        // 마스터 볼륨 감소
        this.masterVolume = Math.max(0.3, this.masterVolume * 0.8);
        
        // 볼륨 설정 최적화
        this.volumeSettings.hold = Math.max(0.2, this.volumeSettings.hold * 0.7);
        this.volumeSettings.release = Math.max(0.3, this.volumeSettings.release * 0.8);
        this.volumeSettings.ambient = Math.max(0.1, this.volumeSettings.ambient * 0.5);
        
        // 현재 홀드 사운드 정지
        this.stopAllHoldSounds();
        
        console.log('SoundManager 성능 최적화 완료');
    }
    
    /**
     * 사운드 매니저 초기화
     */
    async reset() {
        this.stopAllHoldSounds();
        this.isHolding = false;
        this.soundStats = {
            soundsLoaded: 0,
            soundsPlayed: 0,
            holdSoundsPlayed: 0,
            releaseSoundsPlayed: 0
        };
        
        // 오디오 컨텍스트 상태 확인 및 재활성화
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('🔊 오디오 컨텍스트 재활성화 완료');
            } catch (error) {
                console.error('오디오 컨텍스트 재활성화 실패:', error);
            }
        }
        
        console.log('SoundManager 초기화 완료');
    }
    
    /**
     * 디버그 정보 출력
     */
    debugInfo() {
        const stats = this.getSoundStats();
        console.log('=== SoundManager 디버그 정보 ===');
        console.log(`초기화 상태: ${stats.isInitialized ? '완료' : '실패'}`);
        console.log(`로딩된 사운드: ${stats.soundsLoaded}`);
        console.log(`총 재생 횟수: ${stats.soundsPlayed}`);
        console.log(`홀드 사운드: ${stats.holdSoundsPlayed}`);
        console.log(`릴리즈 사운드: ${stats.releaseSoundsPlayed}`);
        console.log(`마스터 볼륨: ${stats.masterVolume}`);
        console.log(`현재 홀드 상태: ${this.isHolding ? '활성' : '비활성'}`);
        console.log('===============================');
    }
}

// 시각적 효과 관리 클래스
class VisualEffects {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.animations = [];
        this.effectStats = {
            particlesCreated: 0,
            animationsPlayed: 0,
            totalEffects: 0
        };
        
        // 성능 최적화 설정
        this.maxParticles = 100;
        this.particleLifetime = 2000; // 2초
        this.animationFrame = 0;
        
        // 지속적인 스플래시 효과를 위한 타이밍 제어
        this.lastSplashTime = 0;
        
        // 완벽한 타이밍 배경 효과
        this.perfectTimingActive = false;
        this.backgroundTransition = 0; // 0-1 사이의 값
    }
    
    /**
     * 커피 채우기 렌더링
     */
    renderCoffeeFill(cup, fillLevel) {
        const x = cup.x - cup.width / 2;
        const y = cup.y - cup.height / 2;
        const width = cup.width;
        const height = cup.height;
        
        // 채워진 높이 계산
        const fillHeight = height * fillLevel;
        const fillY = y + height - fillHeight;
        
        // 커피 그라데이션 생성
        const gradient = this.ctx.createLinearGradient(x, fillY, x, y + height);
        gradient.addColorStop(0, '#8B4513'); // 밝은 갈색
        gradient.addColorStop(0.5, '#654321'); // 중간 갈색
        gradient.addColorStop(1, '#3E2723'); // 어두운 갈색
        
        // 커피 채우기 그리기
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, fillY, width, fillHeight);
        
        // 커피 표면 파도 효과
        if (fillLevel > 0.1) {
            this.renderCoffeeSurface(x, fillY, width, fillLevel);
        }
        
        // 채워진 영역 테두리
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, fillY, width, fillHeight);
    }
    
    /**
     * 커피 표면 파도 효과
     */
    renderCoffeeSurface(x, y, width, fillLevel) {
        const time = Date.now() * 0.005;
        const waveHeight = 2 + Math.sin(time) * 1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        // 파도 곡선 그리기
        for (let i = 0; i <= width; i += 5) {
            const wave = Math.sin((i / width) * Math.PI * 2 + time) * waveHeight;
            this.ctx.lineTo(x + i, y + wave);
        }
        
        this.ctx.strokeStyle = '#8D6E63';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * 커피 흐름 렌더링
     */
    renderCoffeeStream(faucetX, faucetY) {
        const streamWidth = 6;
        const streamLength = 200; // 컵 안으로 충분히 들어가도록 길이 증가
        
        // 물줄기 끝으로 갈수록 약간 좁아지는 효과
        const endWidth = streamWidth * 0.8;
        
        // 흐름 그라데이션 - 더 어둡게 해서 컵 안에서 자연스럽게 보이게
        const gradient = this.ctx.createLinearGradient(
            faucetX, faucetY, 
            faucetX, faucetY + streamLength
        );
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.7, '#654321');
        gradient.addColorStop(1, '#4A2C17'); // 끝부분을 더 어둡게
        
        // 메인 물줄기 그리기 - 테이퍼링 효과
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(faucetX - streamWidth / 2, faucetY);
        this.ctx.lineTo(faucetX + streamWidth / 2, faucetY);
        this.ctx.lineTo(faucetX + endWidth / 2, faucetY + streamLength);
        this.ctx.lineTo(faucetX - endWidth / 2, faucetY + streamLength);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 흐름 중앙 하이라이트 - 더 자연스러운 광택 효과
        const highlightGradient = this.ctx.createLinearGradient(
            faucetX, faucetY, 
            faucetX, faucetY + streamLength
        );
        highlightGradient.addColorStop(0, '#A0522D');
        highlightGradient.addColorStop(0.5, '#8B4513');
        highlightGradient.addColorStop(1, 'rgba(139, 69, 19, 0.8)'); // 끝부분 투명도 적용
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(faucetX - streamWidth / 4, faucetY);
        this.ctx.lineTo(faucetX + streamWidth / 4, faucetY);
        this.ctx.lineTo(faucetX + endWidth / 4, faucetY + streamLength);
        this.ctx.lineTo(faucetX - endWidth / 4, faucetY + streamLength);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 물방울 효과를 컵 안쪽에 생성
        this.createStreamDroplets(faucetX, faucetY + streamLength);
    }
    
    /**
     * 흐름 물방울 효과 (기본 홀드 시에는 비활성화)
     */
    createStreamDroplets(faucetX, faucetY) {
        // 기본 홀드 시에는 물방울 이펙트 생성하지 않음
        // (컵 안에 잘 담기고 있으므로 불필요)
        return;
        
        if (Math.random() < 0.3) { // 30% 확률로 물방울 생성
            this.particles.push({
                x: faucetX + (Math.random() - 0.5) * 4,
                y: faucetY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: 2 + Math.random() * 2,
                size: 1 + Math.random() * 2,
                color: '#8B4513',
                life: 1.0,
                maxLife: 1.0,
                type: 'droplet'
            });
        }
    }
    
    /**
     * 방울 튀기기 효과 생성
     */
    createSplashEffect(cup, intensity) {
        const particleCount = Math.min(intensity * 15, 30); // 최대 30개
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 2 + Math.random() * intensity * 3;
            
            this.particles.push({
                x: cup.x + (Math.random() - 0.5) * cup.width * 0.8,
                y: cup.y - cup.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 2,
                size: 1 + Math.random() * 3,
                color: this.getSplashColor(intensity),
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5,
                type: 'splash',
                gravity: 0.1
            });
        }
        
        this.effectStats.particlesCreated += particleCount;
        this.effectStats.totalEffects++;
    }
    
    /**
     * 완벽한 타이밍 배경 효과 업데이트
     */
    updatePerfectTimingBackground(active) {
        this.perfectTimingActive = active;
    }
    
    /**
     * 완벽한 타이밍 배경 렌더링
     */
    renderPerfectTimingBackground() {
        if (this.perfectTimingActive) {
            // 배경 전환 애니메이션 (즉시 변화)
            this.backgroundTransition = 1;
        } else {
            this.backgroundTransition = 0;
        }
        
        if (this.backgroundTransition > 0) {
            // 황금빛 오버레이 효과
            const alpha = this.backgroundTransition * 0.6; // 최대 60% 투명도
            const gradient = this.ctx.createRadialGradient(
                this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, 0,
                this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, Math.max(this.ctx.canvas.width, this.ctx.canvas.height)
            );
            
            gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);  // 황금색 중심
            gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.5})`); // 오렌지색 중간
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`); // 가장자리는 투명
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

    /**
     * 지속적인 방울 튀기기 효과 생성 (새로운 타이밍 시스템)
     */
    createContinuousSplashEffect(cup, zone, holdDuration, maxTime) {
        const currentTime = Date.now();
        
        // 지속적인 효과를 위한 간격 제어
        if (!this.lastSplashTime) this.lastSplashTime = currentTime;
        let splashInterval;
        let intensity;
        let particleCount;
        
        const zones = this.getTimingZonesForSplash(maxTime);
        
        switch (zone) {
            case 'passing':
                // 합격 타이밍: 조금 튀다가 점점 많이 튐
                const passingProgress = (holdDuration - zones.passing) / (zones.passingEnd - zones.passing);
                splashInterval = 200 - (passingProgress * 100); // 200ms에서 100ms로 점점 빨라짐
                intensity = 0.5 + (passingProgress * 1.0); // 강도도 점점 증가
                particleCount = Math.floor(5 + (passingProgress * 10)); // 5-15개
                break;
                
            case 'perfect':
                // 완벽한 타이밍: 대폭 강화된 효과 (40개/30ms)
                splashInterval = 30; // 매우 빠른 간격
                intensity = 4.0; // 최대 강도
                particleCount = 40; // 많은 양
                break;
                
            case 'overflow':
                // 넘침: 많은 양의 물방울
                splashInterval = 100; // 빠른 간격
                intensity = 3.0; // 높은 강도
                particleCount = 25; // 많은 양
                break;
                
            default:
                return; // basic 구간에서는 효과 없음
        }
        
        // 간격에 따른 효과 생성
        if (currentTime - this.lastSplashTime >= splashInterval) {
            this.createTimedSplashEffect(cup, zone, intensity, particleCount);
            this.lastSplashTime = currentTime;
        }
    }
    
    /**
     * 스플래시 효과용 타이밍 구간 계산
     */
    getTimingZonesForSplash(maxTime) {
        return {
            passing: maxTime - 0.8,
            passingEnd: maxTime - 0.2,
            perfect: maxTime - 0.2,
            perfectEnd: maxTime,
            overflow: maxTime
        };
    }
    
    /**
     * 타이밍별 특화된 스플래시 효과 생성
     */
    createTimedSplashEffect(cup, zone, intensity, particleCount) {
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            let speed, size, spread, life;
            
            if (zone === 'perfect') {
                // 완벽한 타이밍: 최대 스플래시 거리와 크기
                speed = 4 + Math.random() * intensity * 3; // 더 빠른 속도
                size = 2 + Math.random() * (intensity * 2); // 더 큰 크기
                spread = cup.width * 1.2; // 더 넓은 퍼짐
                life = 1.5 + Math.random() * 1.0; // 더 긴 생명
            } else {
                speed = 2 + Math.random() * intensity * 2;
                size = 1 + Math.random() * (intensity * 1.5);
                spread = cup.width * 0.8;
                life = 1.0 + Math.random() * 0.5;
            }
            
            this.particles.push({
                x: cup.x + (Math.random() - 0.5) * spread,
                y: cup.y - cup.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 3,
                size: size,
                color: this.getZoneSplashColor(zone, intensity),
                life: 1.0,
                maxLife: life,
                type: 'splash',
                gravity: zone === 'perfect' ? 0.05 : 0.1, // 완벽한 타이밍은 더 부드럽게 떨어짐
                zone: zone // 구간 정보 추가
            });
        }
        
        this.effectStats.particlesCreated += particleCount;
        this.effectStats.totalEffects++;
    }
    
    /**
     * 구간별 방울 색상 결정
     */
    getZoneSplashColor(zone, intensity) {
        switch (zone) {
            case 'passing':
                // 합격 타이밍: 중간 갈색 계열
                return '#A0522D';
                
            case 'perfect':
                // 완벽한 타이밍: 특별한 황금 갈색
                return '#DAA520';
                
            case 'overflow':
                // 넘침: 진한 갈색
                return '#654321';
                
            default:
                return '#D2691E'; // 기본 - 밝은 갈색
        }
    }

    /**
     * 방울 색상 결정 (기존 메서드 유지)
     */
    getSplashColor(intensity) {
        if (intensity >= 2.5) {
            return '#8B4513'; // 완벽한 타이밍 - 진한 갈색
        } else if (intensity >= 1.5) {
            return '#A0522D'; // 합격 - 중간 갈색
        } else {
            return '#D2691E'; // 기본 - 밝은 갈색
        }
    }
    
    /**
     * 파티클 렌더링 및 업데이트
     */
    renderParticles() {
        const currentTime = Date.now();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 파티클 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 중력 적용
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            
            // 생명 감소
            particle.life -= 1 / 60; // 60fps 기준
            
            // 파티클 렌더링
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                
                // 파티클 모양에 따른 렌더링
                if (particle.type === 'droplet') {
                    // 물방울 모양
                    this.ctx.beginPath();
                    this.ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // 원형 파티클
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            } else {
                // 생명이 끝난 파티클 제거
                this.particles.splice(i, 1);
            }
        }
    }
    
    
    /**
     * 애니메이션 업데이트
     */
    updateAnimations() {
        const currentTime = performance.now();
        
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            // 이징 함수 적용 (easeOut)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // 컵 애니메이션은 제거됨 - 다른 애니메이션만 처리
            
            // 애니메이션 완료 체크
            if (progress >= 1) {
                if (animation.callback) {
                    animation.callback();
                }
                this.animations.splice(i, 1);
            }
        }
    }
    
    /**
     * 성공/실패 시각적 피드백
     */
    showResultFeedback(result, cup) {
        let color, message, size;
        
        switch (result) {
            case 'perfect':
                color = '#FFD700';
                message = 'PERFECT!!';
                size = 48;
                this.createSuccessParticles(cup);
                break;
            case 'success':
                color = '#4CAF50';
                message = 'GOOD!!';
                size = 40;
                break;
            case 'tooEarly':
                color = '#FF9800';
                message = 'TOO EARLY!!';
                size = 36;
                break;
            case 'overflow':
                color = '#F44336';
                message = 'TOO LATE... -❤️';
                size = 40;
                this.createOverflowEffect(cup);
                break;
        }
        
        // 텍스트 애니메이션 - 화면 중앙 상단에 표시
        if (this.ctx && this.ctx.canvas) {
            const textX = this.ctx.canvas.width / 2;
            const textY = 150;  // 상단에서 150px 아래
            this.createTextAnimation(message, textX, textY, color, size);
        } else {
            console.error('Canvas context not available for text animation');
        }
    }
    
    /**
     * 성공 파티클 효과
     */
    createSuccessParticles(cup) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 3 + Math.random() * 2;
            
            this.particles.push({
                x: cup.x,
                y: cup.y - cup.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: '#FFD700',
                life: 1.0,
                maxLife: 1.0,
                type: 'success',
                gravity: -0.05 // 위로 올라가는 효과
            });
        }
    }
    
    /**
     * 넘침 효과
     */
    createOverflowEffect(cup) {
        // 큰 물방울 효과
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: cup.x + (Math.random() - 0.5) * cup.width,
                y: cup.y + cup.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3,
                size: 3 + Math.random() * 4,
                color: '#8B4513',
                life: 1.0,
                maxLife: 1.5,
                type: 'overflow',
                gravity: 0.2
            });
        }
    }
    
    /**
     * 텍스트 애니메이션
     */
    createTextAnimation(text, x, y, color, size) {
        const animation = {
            id: Date.now(),
            startTime: performance.now(),
            duration: 1200,
            text,
            x,
            y,
            color,
            size,
            alpha: 1.0,
            type: 'text'
        };
        
        this.animations.push(animation);
    }
    
    /**
     * 텍스트 애니메이션 렌더링
     */
    renderTextAnimations() {
        for (const animation of this.animations) {
            if (animation.type === 'text') {
                const elapsed = performance.now() - animation.startTime;
                const progress = elapsed / animation.duration;
                
                if (progress < 1) {
                    const alpha = 1 - progress;
                    const offsetY = progress * 100;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.font = `bold ${animation.size}px Arial, sans-serif`;
                    this.ctx.textAlign = 'center';
                    
                    // 텍스트 아웃라인 (검은색)
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeText(animation.text, animation.x, animation.y - offsetY);
                    
                    // 텍스트 채우기 (원래 색상)
                    this.ctx.fillStyle = animation.color;
                    this.ctx.fillText(animation.text, animation.x, animation.y - offsetY);
                    this.ctx.restore();
                }
            }
        }
    }
    
    /**
     * 모든 시각적 효과 업데이트
     */
    update() {
        this.updateAnimations();
        
        // 파티클 개수 제한
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }
    
    /**
     * 효과 통계 조회
     */
    getEffectStats() {
        return {
            ...this.effectStats,
            activeParticles: this.particles.length,
            activeAnimations: this.animations.length
        };
    }
    
    /**
     * 성능 최적화
     */
    optimizeForPerformance() {
        console.log('VisualEffects 성능 최적화 실행...');
        
        // 파티클 개수 제한
        this.maxParticles = Math.min(this.maxParticles, 50);
        
        // 파티클 생명주기 단축
        this.particleLifetime = Math.min(this.particleLifetime, 1000);
        
        // 활성 파티클 정리
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
        
        // 애니메이션 정리
        if (this.animations.length > 10) {
            this.animations = this.animations.slice(-10);
        }
        
        console.log('VisualEffects 성능 최적화 완료');
    }
    
    /**
     * 모든 효과 초기화
     */
    reset() {
        this.particles = [];
        this.animations = [];
        this.effectStats = {
            particlesCreated: 0,
            animationsPlayed: 0,
            totalEffects: 0
        };
        
        console.log('VisualEffects 초기화 완료');
    }
}

// 입력 관리 클래스
class InputManager {
    constructor(canvas, gameInstance) {
        this.canvas = canvas;
        this.game = gameInstance;
        this.isHolding = false;
        this.holdStartTime = 0;
        this.lastTouchTime = 0;
        this.touchCooldown = 100; // 터치 중복 방지 (100ms)
        
        // 성능 측정을 위한 변수들
        this.inputStats = {
            totalInputs: 0,
            mouseInputs: 0,
            touchInputs: 0,
            averageResponseTime: 0,
            lastResponseTime: 0
        };
        
        this.setupEvents();
        this.setupMobileOptimizations();
        
        console.log('🔍 InputManager 초기화 완료:');
        console.log('  - canvas:', this.canvas ? '존재' : 'null');
        console.log('  - game:', this.game ? '존재' : 'null');
        console.log('  - isHolding:', this.isHolding);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEvents() {
        // 마우스 이벤트 (데스크톱)
        this.canvas.addEventListener('mousedown', this.handleMouseStart.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseEnd.bind(this)); // 마우스가 캔버스 밖으로 나갔을 때
        
        // 터치 이벤트 (모바일 최적화)
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { 
            passive: false,
            capture: false
        });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { 
            passive: false,
            capture: false
        });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { 
            passive: false,
            capture: false
        });
        
        // 키보드 이벤트 (접근성)
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        console.log('✅ InputManager 이벤트 리스너 설정 완료');
        console.log('  - 마우스 이벤트: mousedown, mouseup, mouseleave');
        console.log('  - 터치 이벤트: touchstart, touchend, touchcancel');
        console.log('  - 키보드 이벤트: keydown, keyup');
    }
    
    /**
     * 모바일 최적화 설정
     */
    setupMobileOptimizations() {
        // 터치 액션 설정
        this.canvas.style.touchAction = 'none';
        
        // 뷰포트 메타 태그 확인 및 설정
        this.ensureViewportMeta();
        
        // 디바이스 방향 변경 대응
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // 성능 모니터링
        this.setupPerformanceMonitoring();
    }
    
    /**
     * 뷰포트 메타 태그 확인
     */
    ensureViewportMeta() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
            console.log('뷰포트 메타 태그 추가됨');
        }
    }
    
    /**
     * 마우스 시작 이벤트 처리 (주 입력 방식)
     */
    handleMouseStart(event) {
        console.log('🖱️ 마우스 시작 이벤트 감지 - 주 입력 방식');
        
        event.preventDefault();
        this.inputStats.totalInputs++;
        this.inputStats.mouseInputs++;
        
        const startTime = performance.now();
        console.log('🔄 마우스로 startHold 호출 시도...');
        this.startHold(startTime);
        this.recordResponseTime(startTime);
        
        console.log('✅ 마우스 홀드 시작 처리 완료');
    }
    
    /**
     * 마우스 종료 이벤트 처리
     */
    handleMouseEnd(event) {
        event.preventDefault();
        this.endHold();
        console.log('마우스 홀드 종료');
    }
    
    /**
     * 터치 시작 이벤트 처리
     */
    handleTouchStart(event) {
        console.log('👆 터치 시작 이벤트 감지, 터치 개수:', event.touches.length);
        
        event.preventDefault();
        
        const currentTime = performance.now();
        
        // 터치 중복 방지
        if (currentTime - this.lastTouchTime < this.touchCooldown) {
            console.log('⚠️ 터치 중복 방지 - 쿨다운 중');
            return;
        }
        
        this.inputStats.totalInputs++;
        this.inputStats.touchInputs++;
        this.lastTouchTime = currentTime;
        
        // 첫 번째 터치만 처리
        if (event.touches.length === 1) {
            console.log('🔄 startHold 호출 시도...');
            this.startHold(currentTime);
            this.recordResponseTime(currentTime);
            console.log('✅ 터치 홀드 시작 처리 완료');
        } else {
            console.log('⚠️ 다중 터치 감지 - 무시됨');
        }
    }
    
    /**
     * 터치 종료 이벤트 처리
     */
    handleTouchEnd(event) {
        event.preventDefault();
        
        // 터치가 완전히 끝났을 때만 처리
        if (event.touches.length === 0) {
            this.endHold();
            console.log('터치 홀드 종료');
        }
    }
    
    /**
     * 키보드 시작 이벤트 처리 (게임 제어용)
     */
    handleKeyDown(event) {
        // 키보드는 게임 제어용으로만 사용 (홀드 시작은 마우스/터치로만)
        if (event.code === 'Escape') {
            // ESC 키로 게임 일시정지 등 게임 제어 기능
            console.log('게임 제어 키 감지:', event.code);
        }
    }
    
    /**
     * 키보드 종료 이벤트 처리 (게임 제어용)
     */
    handleKeyUp(event) {
        // 키보드는 게임 제어용으로만 사용 (홀드 종료는 마우스/터치로만)
        if (event.code === 'Escape') {
            console.log('게임 제어 키 해제:', event.code);
        }
    }
    
    /**
     * 홀드 시작 처리
     */
    startHold(startTime) {
        console.log('🔍 startHold 호출됨 - 조건 확인 중...');
        console.log('  - isHolding:', this.isHolding);
        console.log('  - gameState:', this.game.gameState);
        console.log('  - currentCup:', this.game.getCurrentCup() ? '존재' : 'null');
        
        if (this.isHolding) {
            console.log('❌ 홀드 시작 실패 - 이미 홀드 중');
            return false;
        }
        
        if (this.game.gameState !== 'playing') {
            console.log('❌ 홀드 시작 실패 - 게임 상태가 playing이 아님:', this.game.gameState);
            return false;
        }
        
        if (!this.game.getCurrentCup()) {
            console.log('❌ 홀드 시작 실패 - currentCup이 null');
            return false;
        }
        
        console.log('✅ 모든 조건 만족 - 홀드 시작 진행');
        
        this.isHolding = true;
        this.holdStartTime = startTime;
        
        console.log('🔄 game.handleStart() 호출 중...');
        // 게임 인스턴스의 홀드 시작 메서드 호출
        const success = this.game.handleStart();
        
        if (success) {
            console.log('✅ startHold 완료 - 게임 홀드 시작 성공');
            return true;
        } else {
            console.log('❌ startHold 실패 - 게임 홀드 시작 실패');
            this.isHolding = false; // 실패 시 상태 롤백
            return false;
        }
    }
    
    /**
     * 홀드 종료 처리
     */
    endHold() {
        console.log('🔍 endHold 호출됨 - 조건 확인 중...');
        console.log('  - isHolding:', this.isHolding);
        console.log('  - gameState:', this.game.gameState);
        console.log('  - currentCup:', this.game.getCurrentCup() ? '존재' : 'null');
        
        if (!this.isHolding || this.game.gameState !== 'playing' || !this.game.getCurrentCup()) {
            console.log('❌ endHold 실패 - 조건 불만족');
            return false;
        }
        
        const holdDuration = this.getHoldDuration();
        this.isHolding = false;
        
        console.log(`홀드 지속 시간: ${holdDuration.toFixed(3)}초`);
        
        // 게임 인스턴스의 홀드 종료 메서드 호출
        const success = this.game.handleEnd(holdDuration);
        
        if (success) {
            console.log('✅ endHold 완료 - 게임 홀드 종료 성공');
            return true;
        } else {
            console.log('❌ endHold 실패 - 게임 홀드 종료 실패');
            return false;
        }
    }
    
    /**
     * 홀드 지속 시간 계산 (정밀한 타이밍)
     */
    getHoldDuration() {
        if (!this.isHolding) {
            return 0;
        }
        return (performance.now() - this.holdStartTime) / 1000;
    }
    
    /**
     * 실시간 홀드 시간 반환 (게임 루프에서 사용)
     */
    getCurrentHoldDuration() {
        if (!this.isHolding) {
            return 0;
        }
        return (performance.now() - this.holdStartTime) / 1000;
    }
    
    /**
     * 응답 시간 기록
     */
    recordResponseTime(startTime) {
        const responseTime = performance.now() - startTime;
        this.inputStats.lastResponseTime = responseTime;
        
        // 평균 응답 시간 계산
        const total = this.inputStats.totalInputs;
        this.inputStats.averageResponseTime = 
            ((this.inputStats.averageResponseTime * (total - 1)) + responseTime) / total;
    }
    
    /**
     * 디바이스 방향 변경 처리
     */
    handleOrientationChange() {
        console.log('디바이스 방향 변경 감지');
        
        // 캔버스 크기 재설정
        this.game.setupCanvas();
        
        // 현재 홀드 상태 유지
        if (this.isHolding) {
            console.log('방향 변경 중 홀드 상태 유지');
        }
    }
    
    /**
     * 성능 모니터링 설정
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 50) {
                    console.warn(`성능 경고: FPS ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }
    
    /**
     * 입력 통계 조회
     */
    getInputStats() {
        return {
            ...this.inputStats,
            mousePercentage: this.inputStats.totalInputs > 0 ? 
                (this.inputStats.mouseInputs / this.inputStats.totalInputs * 100).toFixed(1) : 0,
            touchPercentage: this.inputStats.totalInputs > 0 ? 
                (this.inputStats.touchInputs / this.inputStats.totalInputs * 100).toFixed(1) : 0
        };
    }
    
    /**
     * 입력 매니저 초기화 (게임 재시작 시)
     */
    reset() {
        this.isHolding = false;
        this.holdStartTime = 0;
        this.lastTouchTime = 0;
        
        this.inputStats = {
            totalInputs: 0,
            mouseInputs: 0,
            touchInputs: 0,
            averageResponseTime: 0,
            lastResponseTime: 0
        };
        
        // 이벤트 리스너 재설정
        this.setupEvents();
        
        console.log('InputManager 초기화 완료');
    }
    
    /**
     * 디버그 정보 출력
     */
    debugInfo() {
        const stats = this.getInputStats();
        console.log('=== InputManager 디버그 정보 ===');
        console.log(`총 입력: ${stats.totalInputs}`);
        console.log(`마우스: ${stats.mouseInputs} (${stats.mousePercentage}%)`);
        console.log(`터치: ${stats.touchInputs} (${stats.touchPercentage}%)`);
        console.log(`평균 응답 시간: ${stats.averageResponseTime.toFixed(2)}ms`);
        console.log(`마지막 응답 시간: ${stats.lastResponseTime.toFixed(2)}ms`);
        console.log(`현재 홀드 상태: ${this.isHolding ? '활성' : '비활성'}`);
        if (this.isHolding) {
            console.log(`홀드 시간: ${this.getHoldDuration().toFixed(3)}초`);
        }
        console.log('===============================');
    }
}

// 컵 시스템 클래스
class CupSystem {
    constructor() {
        // 기본 컵 타입 설정 (새로운 단순화된 타이밍 시스템)
        this.cupTypes = {
            A: { 
                maxTime: 1.0,  // 에스프레소 컵
                name: 'Espresso Cup',
                color: '#FF6B6B',  // 밝은 빨강
                difficulty: 'easy',
                points: { success: 10, perfect: 20 },
                width: 35,    // 매우 작은 컵
                height: 55
            },
            B: { 
                maxTime: 1.357,
                name: 'Small Mug',
                color: '#4ECDC4',  // 청록색
                difficulty: 'easy',
                points: { success: 10, perfect: 20 },
                width: 50,
                height: 75
            },
            C: { 
                maxTime: 1.714,
                name: 'Tea Cup',
                color: '#45B7D1',  // 밝은 파랑
                difficulty: 'medium',
                points: { success: 10, perfect: 20 },
                width: 65,
                height: 95
            },
            D: { 
                maxTime: 2.071,
                name: 'Coffee Mug',
                color: '#96CEB4',  // 민트 그린
                difficulty: 'medium',
                points: { success: 10, perfect: 20 },
                width: 80,
                height: 115
            },
            E: { 
                maxTime: 2.428,
                name: 'Medium Mug',
                color: '#FFEAA7',  // 밝은 노랑
                difficulty: 'medium',
                points: { success: 10, perfect: 20 },
                width: 95,
                height: 135
            },
            F: { 
                maxTime: 2.785,
                name: 'Large Mug',
                color: '#DDA0DD',  // 연보라
                difficulty: 'hard',
                points: { success: 10, perfect: 20 },
                width: 100,
                height: 145
            },
            G: { 
                maxTime: 3.142,
                name: 'Travel Mug',
                color: '#F8A5C2',  // 연분홍
                difficulty: 'hard',
                points: { success: 10, perfect: 20 },
                width: 115,
                height: 165
            },
            H: { 
                maxTime: 3.5,  // 가장 큰 컵
                name: 'Jumbo Mug',
                color: '#FA8072',  // 샐몬 색
                difficulty: 'hard',
                points: { success: 10, perfect: 20 },
                width: 130,   // 가장 큰 컵 (150px 간격에 안전하게)
                height: 185
            }
        };
        
        // 컵 생성 통계
        this.generationStats = {
            totalGenerated: 0,
            typeCount: {},
            lastGeneratedType: null
        };
    }
    
    /**
     * 새로운 타이밍 시스템: maxTime 기준으로 타이밍 구간 계산
     */
    getTimingZones(maxTime) {
        return {
            passing: maxTime - 0.8,    // 합격 타이밍 시작: 최대시간 - 0.8초
            passingEnd: maxTime - 0.2, // 합격 타이밍 끝: 최대시간 - 0.2초
            perfect: maxTime - 0.2,    // 완벽 타이밍 시작: 최대시간 - 0.2초
            perfectEnd: maxTime,       // 완벽 타이밍 끝: 최대시간
            overflow: maxTime          // 넘침 타이밍: 최대시간 초과
        };
    }
    
    /**
     * 홀드 시간에 따른 현재 타이밍 구간 반환
     */
    getCurrentZone(holdDuration, maxTime) {
        const zones = this.getTimingZones(maxTime);
        
        if (holdDuration < zones.passing) {
            return 'basic';
        } else if (holdDuration >= zones.passing && holdDuration < zones.passingEnd) {
            return 'passing';
        } else if (holdDuration >= zones.perfect && holdDuration < zones.perfectEnd) {
            return 'perfect';
        } else {
            return 'overflow';
        }
    }
    
    /**
     * 균등 분배를 고려한 타입 선택 (확장성 있는 랜덤 시스템)
     * @param {Array} availableTypes - 선택 가능한 컵 타입들
     * @returns {string} 선택된 컵 타입
     */
    selectBalancedType(availableTypes) {
        if (availableTypes.length === 1) {
            return availableTypes[0];
        }
        
        // 각 타입의 선택 횟수 계산
        const typeCounts = availableTypes.map(type => ({
            type,
            count: this.generationStats.typeCount[type] || 0
        }));
        
        // 가장 적게 선택된 횟수 찾기
        const minCount = Math.min(...typeCounts.map(item => item.count));
        
        // 가장 적게 선택된 타입들만 필터링
        const leastUsedTypes = typeCounts
            .filter(item => item.count === minCount)
            .map(item => item.type);
        
        // 가장 적게 사용된 타입들 중에서 랜덤 선택
        return this.getRandomElement(leastUsedTypes);
    }

    /**
     * 랜덤 컵 생성
     * @param {boolean} avoidRepeat - 이전 컵과 같은 타입 피하기
     * @returns {Object} 생성된 컵 객체
     */
    generateRandomCup(avoidRepeat = true) {
        const availableTypes = Object.keys(this.cupTypes);
        let selectedType;
        
        // 완전 랜덤 시스템: 모든 타입이 균등하게 출현하도록 개선
        if (availableTypes.length <= 1) {
            selectedType = availableTypes[0];
        } else if (avoidRepeat && this.generationStats.lastGeneratedType) {
            // 이전 컵과 다른 타입들 중에서 가장 적게 선택된 타입 우선 선택
            const filteredTypes = availableTypes.filter(type => 
                type !== this.generationStats.lastGeneratedType
            );
            selectedType = this.selectBalancedType(filteredTypes);
        } else {
            // 전체 타입 중에서 균등 분배를 고려하여 선택
            selectedType = this.selectBalancedType(availableTypes);
        }
        
        const cupConfig = this.cupTypes[selectedType];
        const cup = {
            id: `cup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: selectedType,
            config: cupConfig,
            startTime: Date.now(),
            holdStartTime: null,
            fillLevel: 0,
            isComplete: false,
            result: null,
            // 추가 속성들
            perfectTimingBonus: 0.2, // 완벽한 타이밍 구간 길이
            visualEffects: {
                splashIntensity: 1.0,
                fillAnimation: true,
                exitAnimation: true
            }
        };
        
        // 통계 업데이트
        this.generationStats.totalGenerated++;
        this.generationStats.typeCount[selectedType] = (this.generationStats.typeCount[selectedType] || 0) + 1;
        this.generationStats.lastGeneratedType = selectedType;
        
        console.log(`새 컵 생성: ${cupConfig.name} (${selectedType})`);
        return cup;
    }
    
    /**
     * 새로운 컵 타입 추가 (새로운 단순화된 시스템)
     * @param {string} id - 컵 타입 ID
     * @param {number} maxTime - 컵의 최대 시간 (넘침 기준)
     * @param {Object} options - 추가 옵션
     */
    addNewCupType(id, maxTime, options = {}) {
        // maxTime 검증
        if (typeof maxTime !== 'number' || maxTime <= 1.0) {
            throw new Error(`잘못된 maxTime 값: ${maxTime} (1.0초 이상이어야 함)`);
        }
        
        const defaultOptions = {
            name: `${id} Cup`,
            color: this.generateRandomColor(),
            difficulty: 'medium',
            points: { success: 10, perfect: 20 }
        };
        
        this.cupTypes[id] = {
            maxTime,
            ...defaultOptions,
            ...options
        };
        
        const zones = this.getTimingZones(maxTime);
        console.log(`새 컵 타입 추가됨: ${id} (maxTime: ${maxTime}초)`);
        console.log(`  - 합격 타이밍: ${zones.passing}초부터`);
        console.log(`  - 완벽 타이밍: ${zones.perfect}초부터`);
        console.log(`  - 넘침 타이밍: ${zones.overflow}초부터`);
    }
    
    /**
     * 컵 타입 제거
     * @param {string} id - 컵 타입 ID
     */
    removeCupType(id) {
        if (this.cupTypes[id]) {
            delete this.cupTypes[id];
            console.log(`컵 타입 제거됨: ${id}`);
        } else {
            console.warn(`존재하지 않는 컵 타입: ${id}`);
        }
    }
    
    /**
     * 컵의 결과 계산
     * @param {Object} cup - 컵 객체
     * @param {number} holdDuration - 홀드 지속 시간 (초)
     * @returns {string} 결과 ('tooEarly', 'success', 'perfect', 'overflow')
     */
    calculateResult(cup, holdDuration) {
        console.log('🔍 CupSystem.calculateResult 호출됨 (새로운 타이밍 시스템)');
        console.log('  - cup.type:', cup ? cup.type : 'null');
        console.log('  - holdDuration:', holdDuration.toFixed(3), '초');
        
        if (!cup || !cup.config) {
            console.log('❌ 컵 또는 컵 설정이 없음');
            return 'tooEarly';
        }
        
        const { maxTime } = cup.config;
        const zones = this.getTimingZones(maxTime);
        
        console.log('  - maxTime:', maxTime);
        console.log('  - zones:', zones);
        
        // 이펙트와 판정 동기화를 위한 미세 조정 버퍼 (0.05초)
        const timingBuffer = 0.05;
        const adjustedPassingStart = zones.passing - timingBuffer;
        
        if (holdDuration < adjustedPassingStart) {
            console.log(`  - 결과: tooEarly (${holdDuration.toFixed(3)} < ${adjustedPassingStart.toFixed(3)})`);
            return 'tooEarly';
        } else if (holdDuration >= adjustedPassingStart && holdDuration < zones.overflow) {
            if (holdDuration >= zones.perfect) {
                console.log(`  - 결과: perfect (${zones.perfect} <= ${holdDuration.toFixed(3)} < ${zones.overflow})`);
                return 'perfect';
            } else {
                console.log(`  - 결과: success (${adjustedPassingStart.toFixed(3)} <= ${holdDuration.toFixed(3)} < ${zones.perfect})`);
                return 'success';
            }
        } else {
            console.log(`  - 결과: overflow (${holdDuration.toFixed(3)} >= ${zones.overflow})`);
            return 'overflow';
        }
    }
    
    /**
     * 결과에 따른 점수 계산
     * @param {Object} cup - 컵 객체
     * @param {string} result - 결과
     * @param {number} combo - 현재 콤보 수
     * @returns {number} 획득 점수
     */
    calculateScore(cup, result, combo = 0) {
        const { points } = cup.config;
        let baseScore = 0;
        
        switch (result) {
            case 'success':
                baseScore = points.success;
                break;
            case 'perfect':
                baseScore = points.perfect;
                break;
            default:
                return 0;
        }
        
        // 콤보 보너스 (완벽한 타이밍만)
        if (result === 'perfect' && combo > 0) {
            baseScore += combo * 10;
        }
        
        return baseScore;
    }
    
    /**
     * 결과에 따른 시간 변경량 계산
     * @param {string} result - 결과
     * @returns {number} 시간 변경량 (초)
     */
    calculateTimeChange(result) {
        switch (result) {
            case 'success':
            case 'perfect':
                return 2; // +2초
            case 'tooEarly':
            case 'overflow':
                return -10; // -10초
            default:
                return 0;
        }
    }
    
    /**
     * 컵 타입별 통계 조회
     * @returns {Object} 통계 정보
     */
    getGenerationStats() {
        const total = this.generationStats.totalGenerated;
        const stats = {};
        
        for (const [type, count] of Object.entries(this.generationStats.typeCount)) {
            stats[type] = {
                count,
                percentage: total > 0 ? (count / total * 100).toFixed(1) : 0,
                config: this.cupTypes[type]
            };
        }
        
        return {
            total,
            lastType: this.generationStats.lastGeneratedType,
            typeStats: stats
        };
    }
    
    /**
     * 모든 컵 타입 목록 조회
     * @returns {Object} 컵 타입 정보
     */
    getAllCupTypes() {
        return { ...this.cupTypes };
    }
    
    /**
     * 난이도별 컵 타입 조회
     * @param {string} difficulty - 난이도 ('easy', 'medium', 'hard')
     * @returns {Array} 해당 난이도의 컵 타입들
     */
    getCupTypesByDifficulty(difficulty) {
        return Object.entries(this.cupTypes)
            .filter(([id, config]) => config.difficulty === difficulty)
            .map(([id, config]) => ({ id, ...config }));
    }
    
    /**
     * 랜덤 요소 선택
     * @param {Array} array - 선택할 배열
     * @returns {*} 선택된 요소
     */
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * 랜덤 색상 생성
     * @returns {string} 색상 코드
     */
    generateRandomColor() {
        const colors = ['#8B4513', '#D2691E', '#654321', '#A0522D', '#CD853F', '#DEB887'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * 컵 시스템 초기화 (테스트용)
     */
    reset() {
        this.generationStats = {
            totalGenerated: 0,
            typeCount: {},
            lastGeneratedType: null
        };
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    const gameInstance = new BaristaGame();
    
    // 보안 강화: 제한된 인터페이스만 전역에 노출
    window.baristaGame = Object.freeze({
        // 읽기 전용 속성들만 노출
        get gameState() { return gameInstance.gameState; },
        get lives() { return gameInstance.lives; },
        get gameTime() { return gameInstance.gameTime; },
        get combo() { return gameInstance.combo; },
        
        // 안전한 메서드들만 노출 (점수 조작 불가능한 것들)
        getScore: () => gameInstance.getScore(),
        getHighScore: () => gameInstance.getHighScore(),
        
        // 게임 제어 (콘솔에서 게임 재시작 등은 허용)
        restartGame: () => gameInstance.restartGame(),
        
        // 개발/디버그용 - 점수에 영향 없는 정보만
        getGameStats: () => gameInstance.gameStats,
        getFinalStats: () => gameInstance.calculateFinalStats(),
        
        // 점수 관련 메서드들은 보안 검증을 거친 후에만 동작
        _secureReference: gameInstance // 내부 참조 (직접 사용 금지)
    });
    
    // 개발자 콘솔용 전역 함수들 (안전한 것들만)
    window.addNewCupType = (id, maxTime, options = {}) => {
        gameInstance.cupSystem.addNewCupType(id, maxTime, options);
        console.log(`새 컵 타입 추가됨: ${id}`);
    };
    
    window.getCupStats = () => {
        return gameInstance.cupSystem.getGenerationStats();
    };
    
    window.getAllCupTypes = () => {
        return gameInstance.cupSystem.getAllCupTypes();
    };
    
    // InputManager 디버그 함수들
    window.getInputStats = () => {
        return gameInstance.inputManager.getInputStats();
    };
    
    window.debugInput = () => {
        gameInstance.inputManager.debugInfo();
    };
    
    // VisualEffects 디버그 함수들
    window.getVisualStats = () => {
        return gameInstance.visualEffects.getEffectStats();
    };
    
    window.debugVisual = () => {
        const stats = gameInstance.visualEffects.getEffectStats();
        console.log('=== VisualEffects 디버그 정보 ===');
        console.log(`생성된 파티클: ${stats.particlesCreated}`);
        console.log(`재생된 애니메이션: ${stats.animationsPlayed}`);
        console.log(`총 효과: ${stats.totalEffects}`);
        console.log(`활성 파티클: ${stats.activeParticles}`);
        console.log(`활성 애니메이션: ${stats.activeAnimations}`);
        console.log('===============================');
    };
    
    // SoundManager 디버그 함수들
    window.getSoundStats = () => {
        return gameInstance.soundManager.getSoundStats();
    };
    
    window.debugSound = () => {
        gameInstance.soundManager.debugInfo();
    };
    
    window.setSoundVolume = (category, volume) => {
        gameInstance.soundManager.setVolume(category, volume);
    };
    
    // UIManager 디버그 함수들
    window.getUIStats = () => {
        return gameInstance.uiManager.getUIStats();
    };
    
    window.debugUI = () => {
        gameInstance.uiManager.debugInfo();
    };
    
    // 게임 로직 디버그 함수들
    window.getGameStats = () => {
        return gameInstance.gameStats;
    };
    
    window.getFinalStats = () => {
        return gameInstance.calculateFinalStats();
    };
    
    window.debugGameLogic = () => {
        const stats = gameInstance.gameStats;
        console.log('=== 게임 로직 디버그 정보 ===');
        console.log(`현재 점수: ${gameInstance.score}`);
        console.log(`현재 콤보: ${gameInstance.combo}`);
        console.log(`최대 콤보: ${gameInstance.maxCombo}`);
        console.log(`생명: ${gameInstance.lives}`);
        console.log(`게임 시간: ${gameInstance.gameTime.toFixed(1)}초`);
        console.log(`총 컵 수: ${stats.totalCups}`);
        console.log(`완벽한 컵: ${stats.perfectCups}`);
        console.log(`성공한 컵: ${stats.successCups}`);
        console.log(`실패한 컵: ${stats.failedCups}`);
        console.log(`게임 상태: ${gameInstance.gameState}`);
        console.log('===============================');
    };
    
    // 개발 모드에서 사용 가능한 함수들 로그
    console.log('🔧 개발 모드: 사용 가능한 함수들');
    console.log('addNewCupType(id, maxTime, options) - 새 컵 타입 추가');
    console.log('getCupStats() - 컵 생성 통계 조회');
    console.log('getAllCupTypes() - 모든 컵 타입 조회');
    console.log('getInputStats() - 입력 통계 조회');
    console.log('debugInput() - 입력 매니저 디버그 정보');
    console.log('getVisualStats() - 시각적 효과 통계 조회');
    console.log('debugVisual() - 시각적 효과 디버그 정보');
    console.log('getSoundStats() - 사운드 통계 조회');
    console.log('debugSound() - 사운드 디버그 정보');
    console.log('setSoundVolume(category, volume) - 사운드 볼륨 설정');
    console.log('getUIStats() - UI 통계 조회');
    console.log('debugUI() - UI 디버그 정보');
    console.log('getGameStats() - 게임 통계 조회');
    console.log('getFinalStats() - 최종 통계 조회');
    console.log('debugGameLogic() - 게임 로직 디버그 정보');
    console.log('getMobileStats() - 모바일 최적화 통계 조회');
    console.log('debugMobile() - 모바일 디버그 정보');
    console.log('예시: addNewCupType("D", 5.0, {name: "Mega Cup", difficulty: "hard"})');
});

/**
 * 모바일 최적화 매니저 클래스
 */
class MobileOptimizer {
    constructor(game) {
        this.game = game;
        this.touchStartTime = 0;
        this.lastTouchTime = 0;
        this.performanceStats = {
            frameCount: 0,
            lastTime: 0,
            avgFPS: 60,
            minFPS: 60,
            maxFPS: 60
        };
        this.optimizationSettings = {
            enableTouchOptimization: true,
            enablePerformanceMonitoring: true,
            enableBatteryOptimization: true,
            targetFPS: 60
        };
        
        this.setupMobileOptimizations();
    }
    
    /**
     * 모바일 최적화 설정
     */
    setupMobileOptimizations() {
        console.log('모바일 최적화 설정 시작...');
        
        // 터치 최적화
        this.optimizeTouchEvents();
        
        // 뷰포트 메타 태그 확인
        this.ensureViewportMeta();
        
        // 성능 모니터링
        if (this.optimizationSettings.enablePerformanceMonitoring) {
            this.setupPerformanceMonitoring();
        }
        
        // 배터리 최적화
        if (this.optimizationSettings.enableBatteryOptimization) {
            this.setupBatteryOptimization();
        }
        
        // 터치 영역 확대
        this.expandTouchArea();
        
        console.log('모바일 최적화 설정 완료');
    }
    
    /**
     * 터치 이벤트 최적화 (스타일 설정만)
     */
    optimizeTouchEvents() {
        const canvas = this.game.canvas;
        
        // 터치 액션 최적화 (스타일 설정만)
        canvas.style.touchAction = 'none';
        canvas.style.webkitTouchCallout = 'none';
        canvas.style.webkitUserSelect = 'none';
        canvas.style.userSelect = 'none';
        
        console.log('터치 스타일 최적화 완료 - 이벤트 리스너는 InputManager에서 처리');
    }
    
    /**
     * 뷰포트 메타 태그 확인 및 설정
     */
    ensureViewportMeta() {
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        // 모바일 최적화된 뷰포트 설정
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        console.log('뷰포트 메타 태그 설정 완료');
    }
    
    /**
     * 성능 모니터링 설정
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // 성능 통계 업데이트
                this.performanceStats.avgFPS = fps;
                this.performanceStats.minFPS = Math.min(this.performanceStats.minFPS, fps);
                this.performanceStats.maxFPS = Math.max(this.performanceStats.maxFPS, fps);
                
                // 성능 경고
                if (fps < 50) {
                    console.warn(`성능 경고: FPS ${fps} (목표: ${this.optimizationSettings.targetFPS})`);
                    this.optimizePerformance();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.optimizationSettings.enablePerformanceMonitoring) {
                requestAnimationFrame(monitor);
            }
        };
        
        monitor();
        console.log('성능 모니터링 시작');
    }
    
    /**
     * 성능 최적화 실행
     */
    optimizePerformance() {
        console.log('성능 최적화 실행...');
        
        // 시각적 효과 최적화
        if (this.game.visualEffects) {
            this.game.visualEffects.optimizeForPerformance();
        }
        
        // 사운드 최적화
        if (this.game.soundManager) {
            this.game.soundManager.optimizeForPerformance();
        }
        
        // UI 최적화
        if (this.game.uiManager) {
            this.game.uiManager.optimizeForPerformance();
        }
        
        console.log('성능 최적화 완료');
    }
    
    /**
     * 배터리 최적화 설정
     */
    setupBatteryOptimization() {
        // 배터리 API 지원 확인
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                this.batteryOptimization(battery);
            });
        }
        
        // 페이지 가시성 API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseOptimizations();
            } else {
                this.resumeOptimizations();
            }
        });
        
        console.log('배터리 최적화 설정 완료');
    }
    
    /**
     * 배터리 최적화 실행
     */
    batteryOptimization(battery) {
        // 배터리 잔량이 낮을 때 최적화
        if (battery.level < 0.2) {
            console.log('배터리 잔량 부족 - 최적화 모드 활성화');
            this.optimizationSettings.targetFPS = 30;
            this.optimizationSettings.enableBatteryOptimization = true;
        }
        
        // 배터리 충전 상태에 따른 최적화
        if (battery.charging) {
            this.optimizationSettings.targetFPS = 60;
        }
    }
    
    /**
     * 터치 영역 확대
     */
    expandTouchArea() {
        const canvas = this.game.canvas;
        const touchArea = document.createElement('div');
        
        touchArea.style.position = 'absolute';
        touchArea.style.top = '0';
        touchArea.style.left = '0';
        touchArea.style.width = '100%';
        touchArea.style.height = '100%';
        touchArea.style.zIndex = '1';
        touchArea.style.background = 'transparent';
        touchArea.style.pointerEvents = 'none'; // 이벤트를 캔버스로 통과시키기
        
        // 터치 영역을 캔버스 부모에 추가
        canvas.parentNode.appendChild(touchArea);
        
        console.log('터치 영역 확대 완료 (pointer-events: none 적용)');
    }
    
    /**
     * 최적화 일시정지
     */
    pauseOptimizations() {
        this.optimizationSettings.enablePerformanceMonitoring = false;
        console.log('모바일 최적화 일시정지');
    }
    
    /**
     * 최적화 재개
     */
    resumeOptimizations() {
        this.optimizationSettings.enablePerformanceMonitoring = true;
        this.setupPerformanceMonitoring();
        console.log('모바일 최적화 재개');
    }
    
    /**
     * 모바일 통계 조회
     */
    getMobileStats() {
        return {
            performance: this.performanceStats,
            settings: this.optimizationSettings,
            deviceInfo: {
                isMobile: this.game.isMobileDevice(),
                isTablet: this.game.isTabletDevice(),
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                userAgent: navigator.userAgent
            },
            touchStats: {
                touchStartTime: this.touchStartTime,
                lastTouchTime: this.lastTouchTime,
                touchCooldown: 100
            }
        };
    }
    
    /**
     * 모바일 디버그 정보
     */
    debugInfo() {
        const stats = this.getMobileStats();
        console.log('=== 모바일 최적화 디버그 정보 ===');
        console.log(`평균 FPS: ${stats.performance.avgFPS}`);
        console.log(`최소 FPS: ${stats.performance.minFPS}`);
        console.log(`최대 FPS: ${stats.performance.maxFPS}`);
        console.log(`디바이스: ${stats.deviceInfo.isMobile ? '모바일' : stats.deviceInfo.isTablet ? '태블릿' : '데스크톱'}`);
        console.log(`화면 크기: ${stats.deviceInfo.screenWidth}x${stats.deviceInfo.screenHeight}`);
        console.log(`성능 모니터링: ${stats.settings.enablePerformanceMonitoring ? '활성화' : '비활성화'}`);
        console.log(`배터리 최적화: ${stats.settings.enableBatteryOptimization ? '활성화' : '비활성화'}`);
        console.log(`목표 FPS: ${stats.settings.targetFPS}`);
        console.log('=====================================');
    }
}

// 모바일 최적화 디버그 함수들
window.getMobileStats = () => {
    return gameInstance.mobileOptimizer.getMobileStats();
};

window.debugMobile = () => {
    gameInstance.mobileOptimizer.debugInfo();
};
