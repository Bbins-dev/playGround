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

    // 메뉴 표시
    show() {
        console.log('📋 메인 메뉴 표시');
        // 메뉴가 이미 렌더링되고 있으므로 추가 작업 불필요
    }

    // 메뉴 숨기기
    hide() {
        console.log('📋 메인 메뉴 숨김');
        // 메뉴 숨김 처리
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
        // 밝은 그라데이션 배경으로 변경
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2E4057');  // 더 밝은 블루
        gradient.addColorStop(0.5, '#48729B'); // 밝은 파란색
        gradient.addColorStop(1, '#5D8AA8');   // 하늘색

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 배경 패턴
        this.renderBackgroundPattern(ctx, canvas);
    }

    // 배경 패턴 (카드 모티브)
    renderBackgroundPattern(ctx, canvas) {
        const config = GameConfig.mainMenu.background.pattern;

        // 설정에서 비활성화된 경우 패턴을 렌더링하지 않음
        if (!config.enabled) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = config.opacity;

        const cardSize = config.cardSize;
        const spacing = config.spacing;

        for (let x = -cardSize.width; x < canvas.width + cardSize.width; x += spacing) {
            for (let y = -cardSize.height; y < canvas.height + cardSize.height; y += spacing) {
                const offsetX = (y / spacing) % 2 === 0 ? 0 : spacing / 2;

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;

                // 카드 모양
                this.roundRect(ctx, x + offsetX, y, cardSize.width, cardSize.height, 8);
                ctx.stroke();

                // 카드 내부 장식
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🃏', x + offsetX + cardSize.width/2, y + cardSize.height/2);
            }
        }

        ctx.restore();
    }

    // 제목 렌더링
    renderTitle(ctx, canvas) {
        const config = GameConfig.mainMenu.title;
        const subtitleConfig = GameConfig.mainMenu.subtitle;
        const centerX = canvas.width / 2;
        const titleY = config.y;

        // 제목 그림자 (더 진하게)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = `bold ${config.size}px Arial`;
        ctx.textAlign = 'center';
        const gameTitle = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.title') || '자동전투 카드게임' : '자동전투 카드게임';
        ctx.fillText(gameTitle, centerX + config.shadowOffset, titleY + config.shadowOffset);

        // 메인 제목 (더 밝고 크게)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(gameTitle, centerX, titleY);
        ctx.fillText(gameTitle, centerX, titleY);

        // 제목 장식 - 제목 길이에 따라 동적 배치
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Arial';

        // 제목 텍스트의 실제 너비 측정
        const titleMetrics = ctx.measureText(gameTitle);
        const titleWidth = titleMetrics.width;

        // 제목 양옆에 적절한 간격으로 이모지 배치
        const iconOffset = titleWidth / 2 + 60; // 제목 반폭 + 여유 공간
        ctx.fillText('⚔️', centerX - iconOffset, titleY);
        ctx.fillText('🛡️', centerX + iconOffset, titleY);

        // 부제목 (더 밝게)
        ctx.fillStyle = '#E0E0E0';
        ctx.font = `bold ${subtitleConfig.size}px Arial`;
        const gameDescription = '턴 기반 자동 전투 카드 게임!';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        const subtitleY = titleY + subtitleConfig.offsetY;
        ctx.strokeText(gameDescription, centerX, subtitleY);
        ctx.fillText(gameDescription, centerX, subtitleY);

        ctx.restore();
    }

    // 메뉴 아이템 렌더링
    renderMenuItems(ctx, canvas) {
        console.log(`📋 renderMenuItems 시작 - ${this.menuItems.length}개 아이템`);

        const config = GameConfig.mainMenu.menuItems;
        // 고정 크기 중앙점 (1247 / 2 = 623.5)
        const centerX = GameConfig.canvas.width / 2;

        console.log(`📐 메뉴 설정: startY=${config.startY}, itemHeight=${config.itemHeight}, centerX=${centerX}`);
        console.log(`📐 Canvas 논리적 크기: ${GameConfig.canvas.width}x${GameConfig.canvas.height}`);
        console.log(`📐 Canvas 물리적 크기: ${canvas.width}x${canvas.height}`);

        this.menuItems.forEach((item, index) => {
            const y = config.startY + index * config.itemHeight;
            const isSelected = index === this.currentSelection;
            const isDisabled = item.disabled;

            console.log(`📋 메뉴 아이템 ${index}: ${item.text}, y=${y}, selected=${isSelected}, disabled=${isDisabled}`);

            this.renderMenuItem(ctx, item, centerX, y, isSelected, isDisabled);
        });

        console.log('✅ renderMenuItems 완료');
    }

    // 개별 메뉴 아이템 렌더링
    renderMenuItem(ctx, item, x, y, isSelected, isDisabled) {
        const config = GameConfig.mainMenu.menuItems;

        ctx.save();

        // 배경 (더 진하고 뚜렷하게)
        if (!isDisabled) {
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';  // 더 진하게
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;  // 더 두껍게
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';  // 더 진하게
                ctx.strokeStyle = '#CCCCCC';
                ctx.lineWidth = 2;
            }
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
        }

        this.roundRect(ctx, x - config.width/2, y - config.height/2, config.width, config.height, 12);
        ctx.fill();
        ctx.stroke();

        // 아이콘 및 텍스트의 절대적 중앙 정렬을 위한 계산
        const iconTextGap = 20; // 아이콘과 텍스트 사이 간격

        // i18n 키를 실제 텍스트로 변환
        const text = this.getLocalizedText(item.text);

        // 텍스트 크기 측정
        const fontSize = isSelected ? config.textSize.selected : config.textSize.normal;
        ctx.font = `bold ${fontSize}px Arial`;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;

        // 아이콘 + 텍스트 전체 너비 계산
        const totalContentWidth = config.iconSize + iconTextGap + textWidth;

        // 전체 콘텐츠를 중앙에 배치하기 위한 시작 X 좌표
        const contentStartX = x - totalContentWidth / 2;

        // 아이콘 위치 (절대 중앙 정렬)
        const iconX = contentStartX + config.iconSize / 2;

        // 텍스트 위치 (절대 중앙 정렬)
        const textX = contentStartX + config.iconSize + iconTextGap + textWidth / 2;

        // 아이콘 렌더링
        ctx.font = `${config.iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isDisabled ? '#888' : (isSelected ? '#FFD700' : '#FFFFFF');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(item.icon, iconX, y + 8);
        ctx.fillText(item.icon, iconX, y + 8);

        // 텍스트 렌더링
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isDisabled ? '#888' : (isSelected ? '#FFD700' : '#FFFFFF');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(text, textX, y + 5);
        ctx.fillText(text, textX, y + 5);

        // 선택 표시기 (왼쪽 끝에 배치)
        if (isSelected && !isDisabled) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            const selectorX = x - config.width/2 + 20; // 메뉴 아이템 박스 왼쪽 가장자리에서 20px 안쪽
            ctx.strokeText('▶', selectorX, y + 5);
            ctx.fillText('▶', selectorX, y + 5);
        }

        ctx.restore();
    }

    // 조작 방법 안내
    renderInstructions(ctx, canvas) {
        const config = GameConfig.mainMenu.instructions;
        const instructions = [
            '↑↓: 메뉴 이동',
            'Enter/Space: 선택',
            'ESC: 뒤로가기'
        ];

        ctx.save();
        ctx.fillStyle = '#888';
        ctx.font = `${config.fontSize}px Arial`;
        ctx.textAlign = 'center';

        const startY = canvas.height + config.startY;
        instructions.forEach((instruction, index) => {
            ctx.fillText(instruction, canvas.width / 2, startY + index * config.lineHeight);
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
        if (this.gameManager.cardSelection) {
            // 카드 선택 화면 초기화
            this.gameManager.cardSelection.setupInitialSelection();
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

        // DOM 모달로 갤러리 표시 (통일된 방식)
        if (this.gameManager.uiManager) {
            this.gameManager.uiManager.showCardGallery();
        } else {
            console.warn('UIManager를 찾을 수 없습니다');
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
        // i18n 키 매핑
        const i18nKeys = {
            'start-game': 'auto_battle_card_game.ui.start_game',
            'continue-game': 'auto_battle_card_game.ui.continue_game',
            'card-gallery': 'auto_battle_card_game.ui.card_gallery',
            'settings': 'auto_battle_card_game.ui.settings',
            'back-to-main': 'auto_battle_card_game.ui.back_to_main'
        };

        // 백업 번역
        const fallbackTranslations = {
            'start-game': '새 게임',
            'continue-game': '계속하기',
            'card-gallery': '카드 갤러리',
            'settings': '설정',
            'back-to-main': '메인으로'
        };

        const i18nKey = i18nKeys[key];
        if (i18nKey && typeof getI18nText === 'function') {
            return getI18nText(i18nKey) || fallbackTranslations[key] || key;
        }

        return fallbackTranslations[key] || key;
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
        const config = GameConfig.mainMenu.menuItems;
        const centerX = canvas.width / 2;

        // 메뉴 아이템 클릭 체크
        this.menuItems.forEach((item, index) => {
            const itemY = config.startY + index * config.itemHeight;

            if (x >= centerX - config.width/2 && x <= centerX + config.width/2 &&
                y >= itemY - config.height/2 && y <= itemY + config.height/2) {

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