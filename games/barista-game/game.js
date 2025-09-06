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
        this.score = 0;
        this.highScore = 0;
        this.currentCup = null;
        
        // 컵 시스템 초기화
        this.cupSystem = new CupSystem();
        
        // 사운드 매니저
        this.soundManager = new SoundManager();
        
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
    
    setupCanvas() {
        // 캔버스 크기 설정
        this.canvas.width = Math.min(800, window.innerWidth - 40);
        this.canvas.height = Math.min(600, window.innerHeight - 40);
        
        // 캔버스 중심점 계산
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    bindEvents() {
        // 게임 시작 버튼
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 재시작 버튼
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleStart();
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.handleEnd();
        });
        
        // 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        }, { passive: false });
        
        // 윈도우 리사이즈
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.gameTime = this.maxTime;
        this.lives = 3;
        this.score = 0;
        this.combo = 0;
        this.currentCup = null;
        this.isHolding = false;
        
        // 컵 시스템 통계 초기화
        this.cupSystem.reset();
        
        document.getElementById('startScreen').style.display = 'none';
        this.updateUI();
        
        // 첫 번째 컵 생성
        this.generateNewCup();
    }
    
    restartGame() {
        this.gameState = 'start';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
    }
    
    generateNewCup() {
        if (this.gameState !== 'playing') return;
        
        // CupSystem을 사용하여 새 컵 생성
        this.currentCup = this.cupSystem.generateRandomCup(true); // 이전 컵과 다른 타입 선택
    }
    
    handleStart() {
        if (this.gameState !== 'playing' || this.isHolding || !this.currentCup) return;
        
        this.isHolding = true;
        this.currentCup.holdStartTime = Date.now();
        
        // 홀드 사운드 시작
        this.soundManager.startHold();
        
        console.log('홀드 시작');
    }
    
    handleEnd() {
        if (this.gameState !== 'playing' || !this.isHolding || !this.currentCup) return;
        
        this.isHolding = false;
        const holdDuration = (Date.now() - this.currentCup.holdStartTime) / 1000;
        
        // 사운드 정지
        this.soundManager.endHold();
        
        // 결과 계산
        const result = this.calculateResult(holdDuration);
        this.processResult(result);
        
        console.log(`홀드 종료: ${holdDuration.toFixed(2)}초, 결과: ${result}`);
    }
    
    calculateResult(holdDuration) {
        // CupSystem을 사용하여 결과 계산
        return this.cupSystem.calculateResult(this.currentCup, holdDuration);
    }
    
    processResult(result) {
        // CupSystem을 사용하여 점수와 시간 변경량 계산
        const scoreGain = this.cupSystem.calculateScore(this.currentCup, result, this.combo || 0);
        const timeChange = this.cupSystem.calculateTimeChange(result);
        
        // 점수 업데이트
        this.score += scoreGain;
        
        // 시간 업데이트
        this.gameTime = Math.max(0, this.gameTime + timeChange);
        
        // 콤보 시스템 (완벽한 타이밍만)
        if (result === 'perfect') {
            this.combo = (this.combo || 0) + 1;
        } else {
            this.combo = 0;
        }
        
        // 생명 감소 (넘침 시에만)
        if (result === 'overflow') {
            this.lives--;
        }
        
        // 사운드 재생
        this.soundManager.playReleaseSound(result);
        
        // 컵 결과 저장
        this.currentCup.result = result;
        this.currentCup.isComplete = true;
        
        // 컵 퇴장 애니메이션 시작
        this.animateCupExit();
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 체크
        if (this.lives <= 0 || this.gameTime <= 0) {
            this.gameOver();
        } else {
            // 새 컵 생성 (약간의 지연 후)
            setTimeout(() => {
                this.generateNewCup();
            }, 1000);
        }
    }
    
    animateCupExit() {
        // 컵 퇴장 애니메이션 로직 (나중에 구현)
        console.log('컵 퇴장 애니메이션');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // 최고 점수 업데이트
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // 게임 오버 화면 표시
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').style.display = 'block';
    }
    
    updateUI() {
        // 하트 업데이트
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`heart${i}`);
            if (i <= this.lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        }
        
        // 시간 바 업데이트
        const timeFill = document.getElementById('timeFill');
        const timePercentage = (this.gameTime / this.maxTime) * 100;
        timeFill.style.width = `${Math.max(0, Math.min(100, timePercentage))}%`;
    }
    
    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('barista-high-score') || '0');
    }
    
    saveHighScore() {
        localStorage.setItem('barista-high-score', this.highScore.toString());
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // 게임 시간 업데이트
        this.gameTime -= deltaTime / 1000;
        
        // 홀드 중인 경우 타이밍 구간 체크
        if (this.isHolding && this.currentCup) {
            const holdDuration = (Date.now() - this.currentCup.holdStartTime) / 1000;
            this.checkTimingZone(holdDuration);
        }
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 체크
        if (this.gameTime <= 0) {
            this.gameOver();
        }
    }
    
    checkTimingZone(holdDuration) {
        const { timing, perfect } = this.currentCup.config;
        let zone = 'basic';
        
        if (holdDuration >= timing[0] && holdDuration < perfect[0]) {
            zone = 'passing';
        } else if (holdDuration >= perfect[0] && holdDuration <= perfect[1]) {
            zone = 'perfect';
        } else if (holdDuration > timing[1]) {
            zone = 'overflow';
        }
        
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
        // 배경
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 현재 컵 렌더링
        if (this.currentCup) {
            this.renderCup(this.currentCup);
        }
        
        // 수도꼭지 렌더링
        this.renderFaucet();
        
        // 커피 흐름 렌더링 (홀드 중일 때)
        if (this.isHolding) {
            this.renderCoffeeFlow();
        }
    }
    
    renderCup(cup) {
        const cupX = this.centerX;
        const cupY = this.centerY + 50;
        
        // 컵 그리기
        this.ctx.fillStyle = cup.config.color;
        this.ctx.fillRect(cupX - 40, cupY - 60, 80, 120);
        
        // 컵 테두리
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(cupX - 40, cupY - 60, 80, 120);
        
        // 컵 라벨
        this.ctx.fillStyle = '#654321';
        this.ctx.font = '16px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(cup.config.name, cupX, cupY + 80);
    }
    
    renderFaucet() {
        const faucetX = this.centerX;
        const faucetY = this.centerY - 100;
        
        // 수도꼭지
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(faucetX - 20, faucetY - 20, 40, 40);
        
        // 수도꼭지 테두리
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(faucetX - 20, faucetY - 20, 40, 40);
    }
    
    renderCoffeeFlow() {
        // 커피 흐름 애니메이션 (나중에 구현)
        const faucetX = this.centerX;
        const faucetY = this.centerY - 80;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(faucetX - 3, faucetY, 6, 30);
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

// 사운드 매니저 클래스
class SoundManager {
    constructor() {
        this.currentHoldSound = null;
        this.isHolding = false;
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API를 지원하지 않는 브라우저입니다.');
        }
    }
    
    startHold() {
        this.isHolding = true;
        this.playHoldSound('basic');
    }
    
    updateTimingZone(zone) {
        if (!this.isHolding) return;
        
        this.playHoldSound(zone);
    }
    
    playHoldSound(type) {
        // 실제 사운드 파일이 없으므로 콘솔 로그로 대체
        console.log(`홀드 사운드 재생: ${type}`);
        
        // 나중에 실제 오디오 파일로 교체
        switch (type) {
            case 'basic':
                console.log('기본 홀드 사운드');
                break;
            case 'passing':
                console.log('합격 구간 사운드');
                break;
            case 'perfect':
                console.log('완벽한 타이밍 사운드');
                break;
            case 'overflow':
                console.log('넘침 사운드');
                break;
        }
    }
    
    endHold() {
        this.isHolding = false;
        this.stopAllHoldSounds();
    }
    
    stopAllHoldSounds() {
        console.log('모든 홀드 사운드 정지');
    }
    
    playReleaseSound(result) {
        console.log(`릴리즈 사운드 재생: ${result}`);
        
        switch (result) {
            case 'early':
                console.log('빠른 릴리즈 사운드');
                break;
            case 'success':
                console.log('성공 사운드');
                break;
            case 'perfect':
                console.log('완벽한 타이밍 성공 사운드');
                break;
            case 'overflow':
                console.log('넘침 릴리즈 사운드');
                break;
        }
    }
}

// 컵 시스템 클래스
class CupSystem {
    constructor() {
        // 기본 컵 타입 설정
        this.cupTypes = {
            A: { 
                timing: [2.0, 2.5], 
                perfect: [2.4, 2.5],
                name: 'Small Cup',
                color: '#8B4513',
                difficulty: 'easy',
                points: { success: 10, perfect: 20 }
            },
            B: { 
                timing: [1.0, 1.5], 
                perfect: [1.4, 1.5],
                name: 'Medium Cup',
                color: '#D2691E',
                difficulty: 'medium',
                points: { success: 15, perfect: 30 }
            },
            C: { 
                timing: [3.5, 4.0], 
                perfect: [3.9, 4.0],
                name: 'Large Cup',
                color: '#654321',
                difficulty: 'hard',
                points: { success: 20, perfect: 40 }
            }
        };
        
        // 컵 생성 통계
        this.generationStats = {
            totalGenerated: 0,
            typeCount: {},
            lastGeneratedType: null
        };
        
        // 랜덤 시드 (일관된 테스트를 위해)
        this.randomSeed = Date.now();
    }
    
    /**
     * 랜덤 컵 생성
     * @param {boolean} avoidRepeat - 이전 컵과 같은 타입 피하기
     * @returns {Object} 생성된 컵 객체
     */
    generateRandomCup(avoidRepeat = true) {
        const availableTypes = Object.keys(this.cupTypes);
        let selectedType;
        
        if (avoidRepeat && availableTypes.length > 1) {
            // 이전 컵과 다른 타입 선택
            const filteredTypes = availableTypes.filter(type => 
                type !== this.generationStats.lastGeneratedType
            );
            selectedType = this.getRandomElement(filteredTypes);
        } else {
            selectedType = this.getRandomElement(availableTypes);
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
            perfectTimingBonus: 0.1, // 완벽한 타이밍 구간 길이
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
     * 새로운 컵 타입 추가
     * @param {string} id - 컵 타입 ID
     * @param {Array} timing - 합격 타이밍 구간 [시작, 끝]
     * @param {Array} perfect - 완벽한 타이밍 구간 [시작, 끝]
     * @param {Object} options - 추가 옵션
     */
    addNewCupType(id, timing, perfect, options = {}) {
        // 타이밍 구간 검증
        if (!this.validateTimingRange(timing, perfect)) {
            throw new Error(`잘못된 타이밍 구간: ${id}`);
        }
        
        const defaultOptions = {
            name: `${id} Cup`,
            color: this.generateRandomColor(),
            difficulty: 'medium',
            points: { success: 10, perfect: 20 }
        };
        
        this.cupTypes[id] = {
            timing,
            perfect,
            ...defaultOptions,
            ...options
        };
        
        console.log(`새 컵 타입 추가됨: ${id}`);
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
     * 타이밍 구간 검증
     * @param {Array} timing - 합격 타이밍 구간
     * @param {Array} perfect - 완벽한 타이밍 구간
     * @returns {boolean} 유효성 여부
     */
    validateTimingRange(timing, perfect) {
        // 기본 검증
        if (!Array.isArray(timing) || !Array.isArray(perfect)) return false;
        if (timing.length !== 2 || perfect.length !== 2) return false;
        
        const [timingStart, timingEnd] = timing;
        const [perfectStart, perfectEnd] = perfect;
        
        // 범위 검증
        if (timingStart >= timingEnd) return false;
        if (perfectStart >= perfectEnd) return false;
        
        // 완벽한 타이밍이 합격 타이밍 내에 있는지 확인
        if (perfectStart < timingStart || perfectEnd > timingEnd) return false;
        
        // 완벽한 타이밍이 합격 타이밍의 마지막 0.1초 구간인지 확인
        const perfectDuration = perfectEnd - perfectStart;
        const expectedPerfectDuration = 0.1;
        
        if (Math.abs(perfectDuration - expectedPerfectDuration) > 0.01) {
            console.warn(`완벽한 타이밍 구간이 0.1초가 아닙니다: ${perfectDuration}초`);
        }
        
        return true;
    }
    
    /**
     * 컵의 결과 계산
     * @param {Object} cup - 컵 객체
     * @param {number} holdDuration - 홀드 지속 시간 (초)
     * @returns {string} 결과 ('tooEarly', 'success', 'perfect', 'overflow')
     */
    calculateResult(cup, holdDuration) {
        const { timing, perfect } = cup.config;
        
        if (holdDuration < timing[0]) {
            return 'tooEarly';
        } else if (holdDuration >= timing[0] && holdDuration <= timing[1]) {
            if (holdDuration >= perfect[0] && holdDuration <= perfect[1]) {
                return 'perfect';
            } else {
                return 'success';
            }
        } else {
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
    window.baristaGame = new BaristaGame();
    
    // 개발자 콘솔용 전역 함수들
    window.addNewCupType = (id, timing, perfect, options = {}) => {
        window.baristaGame.cupSystem.addNewCupType(id, timing, perfect, options);
        console.log(`새 컵 타입 추가됨: ${id}`);
    };
    
    window.getCupStats = () => {
        return window.baristaGame.cupSystem.getGenerationStats();
    };
    
    window.getAllCupTypes = () => {
        return window.baristaGame.cupSystem.getAllCupTypes();
    };
    
    // 개발 모드에서 사용 가능한 함수들 로그
    console.log('🔧 개발 모드: 사용 가능한 함수들');
    console.log('addNewCupType(id, timing, perfect, options) - 새 컵 타입 추가');
    console.log('getCupStats() - 컵 생성 통계 조회');
    console.log('getAllCupTypes() - 모든 컵 타입 조회');
    console.log('예시: addNewCupType("D", [4.0, 5.0], [4.9, 5.0], {name: "Mega Cup", difficulty: "hard"})');
});
