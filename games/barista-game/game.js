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
        
        // 입력 매니저 초기화
        this.inputManager = new InputManager(this.canvas, this);
        
        // 시각적 효과 매니저 초기화
        this.visualEffects = new VisualEffects(this.ctx);
        
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
        
        // InputManager가 모든 입력 이벤트를 처리합니다
        console.log('입력 이벤트는 InputManager에서 처리됩니다.');
        
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
        
        // 입력 매니저 초기화
        this.inputManager.reset();
        
        // 시각적 효과 초기화
        this.visualEffects.reset();
        
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
        this.currentCup.holdStartTime = performance.now();
        
        // 홀드 사운드 시작
        this.soundManager.startHold();
        
        console.log('홀드 시작');
    }
    
    handleEnd(holdDuration = null) {
        if (this.gameState !== 'playing' || !this.isHolding || !this.currentCup) return;
        
        this.isHolding = false;
        
        // holdDuration이 제공되지 않은 경우 계산
        if (holdDuration === null) {
            holdDuration = (performance.now() - this.currentCup.holdStartTime) / 1000;
        }
        
        // 사운드 정지
        this.soundManager.endHold();
        
        // 결과 계산
        const result = this.calculateResult(holdDuration);
        this.processResult(result);
        
        console.log(`홀드 종료: ${holdDuration.toFixed(3)}초, 결과: ${result}`);
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
        
        // 시각적 피드백 표시
        this.visualEffects.showResultFeedback(result, this.currentCup);
        
        // 컵 결과 저장
        this.currentCup.result = result;
        this.currentCup.isComplete = true;
        
        // 컵 퇴장 애니메이션 시작
        this.visualEffects.animateCupExit(this.currentCup, () => {
            // 애니메이션 완료 후 새 컵 생성
            this.generateNewCup();
        });
        
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
        
        // 홀드 중인 경우 타이밍 구간 체크 (InputManager에서 실시간 시간 가져오기)
        if (this.isHolding && this.currentCup) {
            const holdDuration = this.inputManager.getCurrentHoldDuration();
            this.checkTimingZone(holdDuration);
            
            // 커피 채우기 애니메이션
            this.currentCup.fillLevel = Math.min(1, holdDuration / this.currentCup.config.timing[1]);
        }
        
        // 시각적 효과 업데이트
        this.visualEffects.update();
        
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
            // 합격 구간 방울 효과
            this.visualEffects.createSplashEffect(this.currentCup, 1.0);
        } else if (holdDuration >= perfect[0] && holdDuration <= perfect[1]) {
            zone = 'perfect';
            // 완벽한 타이밍 방울 효과
            this.visualEffects.createSplashEffect(this.currentCup, 2.0);
        } else if (holdDuration > timing[1]) {
            zone = 'overflow';
            // 넘침 방울 효과
            this.visualEffects.createSplashEffect(this.currentCup, 3.0);
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
        
        // 컵 위치 업데이트
        cup.x = cupX;
        cup.y = cupY;
        cup.width = 80;
        cup.height = 120;
        
        // 회전 및 투명도 효과 적용
        this.ctx.save();
        
        // 회전 효과
        if (cup.rotation) {
            this.ctx.translate(cupX, cupY);
            this.ctx.rotate(cup.rotation);
            this.ctx.translate(-cupX, -cupY);
        }
        
        // 투명도 효과
        if (cup.alpha !== undefined) {
            this.ctx.globalAlpha = cup.alpha;
        }
        
        // 컵 그리기
        this.ctx.fillStyle = cup.config.color;
        this.ctx.fillRect(cupX - 40, cupY - 60, 80, 120);
        
        // 컵 테두리
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(cupX - 40, cupY - 60, 80, 120);
        
        this.ctx.restore();
        
        // 커피 채우기 효과
        if (cup.fillLevel > 0) {
            this.visualEffects.renderCoffeeFill(cup, cup.fillLevel);
        }
        
        // 컵 라벨
        this.ctx.fillStyle = '#654321';
        this.ctx.font = '16px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(cup.config.name, cupX, cupY + 80);
        
        // 파티클 효과 렌더링
        this.visualEffects.renderParticles();
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
        // 커피 흐름 애니메이션
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
        const streamLength = 80;
        
        // 흐름 그라데이션
        const gradient = this.ctx.createLinearGradient(
            faucetX, faucetY, 
            faucetX, faucetY + streamLength
        );
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        // 흐름 그리기
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            faucetX - streamWidth / 2, 
            faucetY, 
            streamWidth, 
            streamLength
        );
        
        // 흐름 중앙 하이라이트
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(
            faucetX - streamWidth / 4, 
            faucetY, 
            streamWidth / 2, 
            streamLength
        );
        
        // 물방울 효과 추가
        this.createStreamDroplets(faucetX, faucetY + streamLength);
    }
    
    /**
     * 흐름 물방울 효과
     */
    createStreamDroplets(faucetX, faucetY) {
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
     * 방울 색상 결정
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
     * 컵 퇴장 애니메이션
     */
    animateCupExit(cup, callback) {
        const startX = cup.x;
        const startY = cup.y;
        const targetX = this.ctx.canvas.width + 100;
        const duration = 1000; // 1초
        const startTime = performance.now();
        
        // 애니메이션 객체 생성
        const animation = {
            id: Date.now(),
            startTime,
            duration,
            startX,
            startY,
            targetX,
            cup,
            callback,
            type: 'cupExit'
        };
        
        this.animations.push(animation);
        this.effectStats.animationsPlayed++;
        
        console.log('컵 퇴장 애니메이션 시작');
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
            
            if (animation.type === 'cupExit') {
                // 컵 위치 업데이트
                animation.cup.x = animation.startX + (animation.targetX - animation.startX) * easeProgress;
                
                // 회전 효과
                animation.cup.rotation = progress * Math.PI * 0.5;
                
                // 투명도 효과
                animation.cup.alpha = 1 - progress * 0.5;
            }
            
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
                message = 'PERFECT!';
                size = 24;
                this.createSuccessParticles(cup);
                break;
            case 'success':
                color = '#4CAF50';
                message = 'SUCCESS!';
                size = 20;
                break;
            case 'tooEarly':
                color = '#FF9800';
                message = 'TOO EARLY';
                size = 18;
                break;
            case 'overflow':
                color = '#F44336';
                message = 'OVERFLOW!';
                size = 20;
                this.createOverflowEffect(cup);
                break;
        }
        
        // 텍스트 애니메이션
        this.createTextAnimation(message, cup.x, cup.y - 50, color, size);
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
            duration: 1500,
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
                    const offsetY = progress * 50;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.fillStyle = animation.color;
                    this.ctx.font = `bold ${animation.size}px Inter`;
                    this.ctx.textAlign = 'center';
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
        this.renderTextAnimations();
        
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
        
        console.log('InputManager 이벤트 리스너 설정 완료');
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
     * 마우스 시작 이벤트 처리
     */
    handleMouseStart(event) {
        event.preventDefault();
        this.inputStats.totalInputs++;
        this.inputStats.mouseInputs++;
        
        const startTime = performance.now();
        this.startHold(startTime);
        this.recordResponseTime(startTime);
        
        console.log('마우스 홀드 시작');
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
        event.preventDefault();
        
        const currentTime = performance.now();
        
        // 터치 중복 방지
        if (currentTime - this.lastTouchTime < this.touchCooldown) {
            console.log('터치 중복 방지');
            return;
        }
        
        this.inputStats.totalInputs++;
        this.inputStats.touchInputs++;
        this.lastTouchTime = currentTime;
        
        // 첫 번째 터치만 처리
        if (event.touches.length === 1) {
            this.startHold(currentTime);
            this.recordResponseTime(currentTime);
            console.log('터치 홀드 시작');
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
     * 키보드 시작 이벤트 처리 (접근성)
     */
    handleKeyDown(event) {
        // 스페이스바 또는 엔터키
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            const startTime = performance.now();
            this.startHold(startTime);
            console.log('키보드 홀드 시작');
        }
    }
    
    /**
     * 키보드 종료 이벤트 처리 (접근성)
     */
    handleKeyUp(event) {
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            this.endHold();
            console.log('키보드 홀드 종료');
        }
    }
    
    /**
     * 홀드 시작 처리
     */
    startHold(startTime) {
        if (this.isHolding || this.game.gameState !== 'playing' || !this.game.currentCup) {
            return;
        }
        
        this.isHolding = true;
        this.holdStartTime = startTime;
        
        // 게임 인스턴스의 홀드 시작 메서드 호출
        this.game.handleStart();
    }
    
    /**
     * 홀드 종료 처리
     */
    endHold() {
        if (!this.isHolding || this.game.gameState !== 'playing' || !this.game.currentCup) {
            return;
        }
        
        this.isHolding = false;
        const holdDuration = this.getHoldDuration();
        
        // 게임 인스턴스의 홀드 종료 메서드 호출
        this.game.handleEnd(holdDuration);
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
    
    // InputManager 디버그 함수들
    window.getInputStats = () => {
        return window.baristaGame.inputManager.getInputStats();
    };
    
    window.debugInput = () => {
        window.baristaGame.inputManager.debugInfo();
    };
    
    // VisualEffects 디버그 함수들
    window.getVisualStats = () => {
        return window.baristaGame.visualEffects.getEffectStats();
    };
    
    window.debugVisual = () => {
        const stats = window.baristaGame.visualEffects.getEffectStats();
        console.log('=== VisualEffects 디버그 정보 ===');
        console.log(`생성된 파티클: ${stats.particlesCreated}`);
        console.log(`재생된 애니메이션: ${stats.animationsPlayed}`);
        console.log(`총 효과: ${stats.totalEffects}`);
        console.log(`활성 파티클: ${stats.activeParticles}`);
        console.log(`활성 애니메이션: ${stats.activeAnimations}`);
        console.log('===============================');
    };
    
    // 개발 모드에서 사용 가능한 함수들 로그
    console.log('🔧 개발 모드: 사용 가능한 함수들');
    console.log('addNewCupType(id, timing, perfect, options) - 새 컵 타입 추가');
    console.log('getCupStats() - 컵 생성 통계 조회');
    console.log('getAllCupTypes() - 모든 컵 타입 조회');
    console.log('getInputStats() - 입력 통계 조회');
    console.log('debugInput() - 입력 매니저 디버그 정보');
    console.log('getVisualStats() - 시각적 효과 통계 조회');
    console.log('debugVisual() - 시각적 효과 디버그 정보');
    console.log('예시: addNewCupType("D", [4.0, 5.0], [4.9, 5.0], {name: "Mega Cup", difficulty: "hard"})');
});
