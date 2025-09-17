// 메인 메뉴 화면 관리

class MainMenu {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 메뉴 상태
        this.currentSelection = 0;
        this.menuItems = [
            {
                text: 'start-game',
                action: () => this.startNewGame(),
                icon: '⚔️'
            },
            {
                text: 'continue-game',
                action: () => this.continueGame(),
                icon: '📖',
                disabled: true // 저장된 게임이 있을 때만 활성화
            },
            {
                text: 'card-gallery',
                action: () => this.openCardGallery(),
                icon: '🃏'
            },
            {
                text: 'settings',
                action: () => this.openSettings(),
                icon: '⚙️'
            },
            {
                text: 'back-to-main',
                action: () => this.backToMain(),
                icon: '🏠'
            }
        ];

        // 저장된 게임 체크
        this.checkSavedGame();

        // 애니메이션 상태
        this.titleAnimation = {
            offset: 0,
            speed: 0.02
        };

        console.log('📋 메인 메뉴 초기화 완료');
    }

    // 저장된 게임 확인
    checkSavedGame() {
        const savedGame = localStorage.getItem('cardBattleGame_save');
        if (savedGame) {
            const continueItem = this.menuItems.find(item => item.text === 'continue-game');
            if (continueItem) {
                continueItem.disabled = false;
            }
        }
    }

    // 메뉴 렌더링
    render(ctx, canvas) {
        this.renderBackground(ctx, canvas);
        this.renderTitle(ctx, canvas);
        this.renderMenuItems(ctx, canvas);
        this.renderInstructions(ctx, canvas);
        this.updateAnimations();
    }

    // 배경 렌더링
    renderBackground(ctx, canvas) {
        // 어두운 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 배경 패턴
        this.renderBackgroundPattern(ctx, canvas);
    }

    // 배경 패턴 (카드 모티브)
    renderBackgroundPattern(ctx, canvas) {
        ctx.save();
        ctx.globalAlpha = 0.1;

        const cardWidth = 60;
        const cardHeight = 80;
        const spacing = 100;

        for (let x = -cardWidth; x < canvas.width + cardWidth; x += spacing) {
            for (let y = -cardHeight; y < canvas.height + cardHeight; y += spacing) {
                const offsetX = (y / spacing) % 2 === 0 ? 0 : spacing / 2;

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;

                // 카드 모양
                this.roundRect(ctx, x + offsetX, y, cardWidth, cardHeight, 8);
                ctx.stroke();

                // 카드 내부 장식
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🃏', x + offsetX + cardWidth/2, y + cardHeight/2);
            }
        }

        ctx.restore();
    }

    // 제목 렌더링
    renderTitle(ctx, canvas) {
        const centerX = canvas.width / 2;
        const titleY = 150;

        // 제목 그림자
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('카드 배틀', centerX + 3, titleY + 3);

        // 메인 제목
        ctx.fillStyle = '#fff';
        ctx.fillText('카드 배틀', centerX, titleY);

        // 제목 장식
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('⚔️', centerX - 120, titleY);
        ctx.fillText('🛡️', centerX + 120, titleY);

        // 부제목
        ctx.fillStyle = '#ccc';
        ctx.font = '18px Arial';
        ctx.fillText('턴 기반 자동 전투 카드 게임', centerX, titleY + 50);

        ctx.restore();
    }

    // 메뉴 아이템 렌더링
    renderMenuItems(ctx, canvas) {
        const centerX = canvas.width / 2;
        const startY = 280;
        const itemHeight = 60;

        this.menuItems.forEach((item, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === this.currentSelection;
            const isDisabled = item.disabled;

            this.renderMenuItem(ctx, item, centerX, y, isSelected, isDisabled);
        });
    }

    // 개별 메뉴 아이템 렌더링
    renderMenuItem(ctx, item, x, y, isSelected, isDisabled) {
        const width = 300;
        const height = 45;

        ctx.save();

        // 배경
        if (!isDisabled) {
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
            }
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
        }

        this.roundRect(ctx, x - width/2, y - height/2, width, height, 10);
        ctx.fill();
        ctx.stroke();

        // 아이콘
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = isDisabled ? '#666' : (isSelected ? '#ffd700' : '#fff');
        ctx.fillText(item.icon, x - 80, y + 8);

        // 텍스트
        ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
        ctx.fillStyle = isDisabled ? '#666' : (isSelected ? '#ffd700' : '#fff');

        // i18n 키를 실제 텍스트로 변환
        const text = this.getLocalizedText(item.text);
        ctx.fillText(text, x + 20, y + 5);

        // 선택 표시기
        if (isSelected && !isDisabled) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '20px Arial';
            ctx.fillText('▶', x - 140, y + 5);
        }

        ctx.restore();
    }

    // 조작 방법 안내
    renderInstructions(ctx, canvas) {
        const instructions = [
            '↑↓: 메뉴 이동',
            'Enter/Space: 선택',
            'ESC: 뒤로가기'
        ];

        ctx.save();
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';

        const startY = canvas.height - 80;
        instructions.forEach((instruction, index) => {
            ctx.fillText(instruction, canvas.width / 2, startY + index * 20);
        });

        ctx.restore();
    }

    // 애니메이션 업데이트
    updateAnimations() {
        this.titleAnimation.offset += this.titleAnimation.speed;
        if (this.titleAnimation.offset > Math.PI * 2) {
            this.titleAnimation.offset = 0;
        }
    }

    // 입력 처리
    handleInput(key) {
        switch (key) {
            case 'ArrowUp':
                this.selectPrevious();
                break;
            case 'ArrowDown':
                this.selectNext();
                break;
            case 'Enter':
            case ' ':
                this.selectCurrent();
                break;
            case 'Escape':
                this.backToMain();
                break;
        }
    }

    // 이전 메뉴 선택
    selectPrevious() {
        do {
            this.currentSelection = (this.currentSelection - 1 + this.menuItems.length) % this.menuItems.length;
        } while (this.menuItems[this.currentSelection].disabled);

        this.playNavigationSound();
    }

    // 다음 메뉴 선택
    selectNext() {
        do {
            this.currentSelection = (this.currentSelection + 1) % this.menuItems.length;
        } while (this.menuItems[this.currentSelection].disabled);

        this.playNavigationSound();
    }

    // 현재 메뉴 선택
    selectCurrent() {
        const item = this.menuItems[this.currentSelection];
        if (!item.disabled && item.action) {
            this.playSelectSound();
            item.action();
        }
    }

    // 새 게임 시작
    startNewGame() {
        console.log('🎮 새 게임 시작');

        // 초기 카드 선택 화면으로 이동
        if (this.gameManager.cardSelectionScreen) {
            this.gameManager.switchScreen('cardSelection');
        } else {
            // 카드 선택 없이 바로 시작
            this.gameManager.initializeNewGame();
            this.gameManager.switchScreen('battle');
        }
    }

    // 게임 계속하기
    continueGame() {
        console.log('📖 게임 계속하기');

        try {
            const savedData = localStorage.getItem('cardBattleGame_save');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                this.gameManager.loadGameData(gameData);
                this.gameManager.switchScreen('battle');
            } else {
                console.warn('저장된 게임을 찾을 수 없습니다');
                this.startNewGame();
            }
        } catch (error) {
            console.error('게임 로드 실패:', error);
            this.startNewGame();
        }
    }

    // 카드 갤러리 열기
    openCardGallery() {
        console.log('🃏 카드 갤러리 열기');

        if (this.gameManager.cardGalleryScreen) {
            this.gameManager.switchScreen('gallery');
        } else {
            // DOM 모달로 갤러리 표시
            if (this.gameManager.uiManager) {
                this.gameManager.uiManager.showCardGallery();
            }
        }
    }

    // 설정 열기
    openSettings() {
        console.log('⚙️ 설정 열기');

        // 간단한 설정 메뉴 구현
        this.showSettingsDialog();
    }

    // 설정 대화상자 표시
    showSettingsDialog() {
        const settings = {
            gameSpeed: parseInt(localStorage.getItem('cardBattle_gameSpeed') || '1'),
            soundEnabled: localStorage.getItem('cardBattle_soundEnabled') !== 'false',
            language: localStorage.getItem('cardBattle_language') || 'ko'
        };

        // 간단한 프롬프트로 설정 변경
        const newSpeed = prompt(`게임 속도 (1-3): 현재 ${settings.gameSpeed}`, settings.gameSpeed);
        if (newSpeed && !isNaN(newSpeed)) {
            const speed = Math.max(1, Math.min(3, parseInt(newSpeed)));
            localStorage.setItem('cardBattle_gameSpeed', speed.toString());

            if (this.gameManager.battleSystem) {
                this.gameManager.battleSystem.setGameSpeed(speed);
            }
        }
    }

    // 메인 페이지로 돌아가기
    backToMain() {
        if (confirm('메인 페이지로 돌아가시겠습니까?')) {
            window.location.href = '../../index.html';
        }
    }

    // 현지화 텍스트 가져오기
    getLocalizedText(key) {
        const translations = {
            'start-game': '새 게임',
            'continue-game': '계속하기',
            'card-gallery': '카드 갤러리',
            'settings': '설정',
            'back-to-main': '메인으로'
        };

        return translations[key] || key;
    }

    // 사운드 재생
    playNavigationSound() {
        // 네비게이션 사운드 재생
        if (this.gameManager.soundManager && this.gameManager.soundManager.isEnabled()) {
            // this.gameManager.soundManager.playUISound('navigate');
        }
    }

    playSelectSound() {
        // 선택 사운드 재생
        if (this.gameManager.soundManager && this.gameManager.soundManager.isEnabled()) {
            // this.gameManager.soundManager.playUISound('select');
        }
    }

    // 유틸리티: 둥근 사각형
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 마우스/터치 입력 처리
    handlePointerInput(x, y, canvas) {
        const centerX = canvas.width / 2;
        const startY = 280;
        const itemHeight = 60;
        const itemWidth = 300;
        const itemHeightBox = 45;

        // 메뉴 아이템 클릭 체크
        this.menuItems.forEach((item, index) => {
            const itemY = startY + index * itemHeight;

            if (x >= centerX - itemWidth/2 && x <= centerX + itemWidth/2 &&
                y >= itemY - itemHeightBox/2 && y <= itemY + itemHeightBox/2) {

                if (!item.disabled) {
                    this.currentSelection = index;
                    this.selectCurrent();
                }
            }
        });
    }

    // 정리
    cleanup() {
        // 이벤트 리스너 정리 등
        console.log('🧹 메인 메뉴 정리 완료');
    }
}

// 전역 객체로 등록
window.MainMenu = MainMenu;