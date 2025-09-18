// 메인 메뉴 화면 관리

class MainMenu {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // DOM 요소 참조
        this.menuContainer = null;
        this.menuButtons = {};

        // 메뉴 상태
        this.currentSelection = 0;
        this.menuItems = [
            {
                text: 'start-game',
                action: () => this.startNewGame(),
                icon: '⚔️',
                id: 'start-game-btn'
            },
            {
                text: 'game-tutorial',
                action: () => this.showGameTutorial(),
                icon: '📚',
                id: 'game-tutorial-btn'
            },
            {
                text: 'card-gallery',
                action: () => this.openCardGallery(),
                icon: '🃏',
                id: 'card-gallery-menu-btn'
            },
            {
                text: 'settings',
                action: () => this.openSettings(),
                icon: '⚙️',
                id: 'settings-btn'
            },
            {
                text: 'back-to-main',
                action: () => { window.location.href = '../../index.html'; },
                icon: '🏠',
                id: 'back-to-main-menu-btn'
            }
        ];

        // DOM 요소 초기화
        this.initializeDOMElements();

        // 저장된 게임 체크
        this.checkSavedGame();

        // 애니메이션 상태 (제목용)
        this.titleAnimation = {
            offset: 0,
            speed: 0.02
        };

        // 렌더링 최적화
        this.needsRedraw = true;
        this.lastRenderTime = 0;

    }

    // DOM 요소 초기화
    initializeDOMElements() {
        this.menuContainer = document.getElementById('main-menu-buttons');

        // 각 메뉴 버튼 참조 저장 및 이벤트 리스너 추가
        this.menuItems.forEach((item, index) => {
            const button = document.getElementById(item.id);
            if (button) {
                this.menuButtons[item.text] = button;

                // 클릭 이벤트 리스너 추가
                button.addEventListener('click', () => {
                    this.currentSelection = index;
                    this.selectCurrent();
                });

                // 키보드 포커스 이벤트 추가
                button.addEventListener('focus', () => {
                    this.currentSelection = index;
                    this.updateButtonSelection();
                });
            }
        });
    }

    // 메뉴 표시
    show() {
        if (this.menuContainer) {
            this.menuContainer.classList.remove('hidden');
            this.updateButtonSelection();
        }
    }

    // 메뉴 숨기기
    hide() {
        if (this.menuContainer) {
            this.menuContainer.classList.add('hidden');
        }
    }

    // 버튼 선택 상태 업데이트
    updateButtonSelection() {
        Object.values(this.menuButtons).forEach((button, index) => {
            if (index === this.currentSelection) {
                button.classList.add('selected');
                button.style.borderColor = '#f39c12';
                button.style.background = 'linear-gradient(135deg, rgba(52, 152, 219, 0.4), rgba(52, 152, 219, 0.2))';
            } else {
                button.classList.remove('selected');
                button.style.borderColor = '#3498db';
                button.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))';
            }
        });
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

    // 메뉴 렌더링 (최적화)
    render(ctx, canvas) {
        const currentTime = performance.now();

        // 애니메이션 업데이트 (항상 실행)
        this.updateAnimations();

        // 렌더링이 필요하거나 16ms 이상 지났을 때만 렌더링 (60fps 제한)
        if (!this.needsRedraw && (currentTime - this.lastRenderTime < 16)) {
            return;
        }

        this.renderBackground(ctx, canvas);
        this.renderTitle(ctx, canvas);
        // Canvas 메뉴 렌더링 비활성화 - DOM 버튼 사용
        // this.renderMenuItems(ctx, canvas);
        this.renderInstructions(ctx, canvas);

        this.needsRedraw = false;
        this.lastRenderTime = currentTime;
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
        const centerX = GameConfig.canvas.width / 2; // 버튼과 동일한 고정 중앙점 사용
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


        // 부제목 (더 밝게)
        ctx.fillStyle = '#E0E0E0';
        ctx.font = `bold ${subtitleConfig.size}px Arial`;
        const gameDescription = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.subtitle') || '턴 기반 자동 전투 카드 게임!' : '턴 기반 자동 전투 카드 게임!';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        const subtitleY = titleY + subtitleConfig.offsetY;
        ctx.strokeText(gameDescription, centerX, subtitleY);
        ctx.fillText(gameDescription, centerX, subtitleY);

        ctx.restore();
    }

    // 메뉴 아이템 렌더링
    renderMenuItems(ctx, canvas) {
        const config = GameConfig.mainMenu.menuItems;
        // 고정 크기 중앙점 (1247 / 2 = 623.5)
        const centerX = GameConfig.canvas.width / 2;

        this.menuItems.forEach((item, index) => {
            const y = config.startY + index * config.itemHeight;
            const isSelected = index === this.currentSelection;
            const isDisabled = item.disabled;

            this.renderMenuItem(ctx, item, centerX, y, isSelected, isDisabled);
        });
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
                window.location.href = '../../index.html';
                break;
        }
    }

    // 이전 메뉴 선택
    selectPrevious() {
        do {
            this.currentSelection = (this.currentSelection - 1 + this.menuItems.length) % this.menuItems.length;
        } while (this.menuItems[this.currentSelection].disabled);

        this.updateButtonSelection();
        this.focusCurrentButton();
        this.playNavigationSound();
    }

    // 다음 메뉴 선택
    selectNext() {
        do {
            this.currentSelection = (this.currentSelection + 1) % this.menuItems.length;
        } while (this.menuItems[this.currentSelection].disabled);

        this.updateButtonSelection();
        this.focusCurrentButton();
        this.playNavigationSound();
    }

    // 현재 선택된 버튼에 포커스
    focusCurrentButton() {
        const currentItem = this.menuItems[this.currentSelection];
        const button = this.menuButtons[currentItem.text];
        if (button) {
            button.focus();
        }
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
        console.log('MainMenu: 새 게임 시작 요청');

        // 저장된 속도 설정 적용
        const savedSpeed = parseInt(localStorage.getItem('cardBattle_gameSpeed') || '1');
        if (this.gameManager) {
            this.gameManager.setGameSpeed(savedSpeed);
        }

        // GameManager의 startNewGame() 메서드 호출
        if (this.gameManager && this.gameManager.startNewGame) {
            this.gameManager.startNewGame();
        } else {
            console.error('GameManager의 startNewGame() 메서드를 찾을 수 없습니다');
            // 폴백: 기존 방식으로 시작
            if (this.gameManager.cardSelection) {
                this.gameManager.cardSelection.setupInitialSelection();
                this.gameManager.switchScreen('cardSelection');
            } else {
                this.gameManager.initializeNewGame();
                this.gameManager.switchScreen('battle');
            }
        }
    }

    // 게임 계속하기
    continueGame() {

        try {
            const savedData = localStorage.getItem('cardBattleGame_save');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                this.gameManager.loadGameData(gameData);
                this.gameManager.switchScreen('battle');
            } else {
                this.startNewGame();
            }
        } catch (error) {
            this.startNewGame();
        }
    }

    // 게임 설명 표시
    showGameTutorial() {
        const tutorialText = this.getGameTutorialText();

        // 간단한 alert로 일단 표시 (나중에 모달로 개선 가능)
        alert(tutorialText);
    }

    // 게임 설명 텍스트 가져오기
    getGameTutorialText() {
        const lines = [
            this.getLocalizedText('tutorial-line1'),
            this.getLocalizedText('tutorial-line2'),
            this.getLocalizedText('tutorial-line3'),
            this.getLocalizedText('tutorial-line4'),
            this.getLocalizedText('tutorial-line5')
        ];

        return lines.join('\n\n');
    }

    // 카드 갤러리 열기
    openCardGallery() {

        // DOM 모달로 갤러리 표시 (통일된 방식)
        if (this.gameManager.uiManager) {
            this.gameManager.uiManager.showCardGallery();
        } else {
        }
    }

    // 설정 열기
    openSettings() {

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


    // 현지화 텍스트 가져오기
    getLocalizedText(key) {
        // i18n 키 매핑
        const i18nKeys = {
            'start-game': 'auto_battle_card_game.ui.start_game',
            'game-tutorial': 'auto_battle_card_game.ui.game_tutorial',
            'card-gallery': 'auto_battle_card_game.ui.card_gallery',
            'settings': 'auto_battle_card_game.ui.settings',
            'back-to-main': 'auto_battle_card_game.ui.back_to_main',
            'tutorial-line1': 'auto_battle_card_game.tutorial.line1',
            'tutorial-line2': 'auto_battle_card_game.tutorial.line2',
            'tutorial-line3': 'auto_battle_card_game.tutorial.line3',
            'tutorial-line4': 'auto_battle_card_game.tutorial.line4',
            'tutorial-line5': 'auto_battle_card_game.tutorial.line5'
        };

        // 백업 번역
        const fallbackTranslations = {
            'start-game': '게임 시작',
            'game-tutorial': '게임 설명',
            'card-gallery': '카드 갤러리',
            'settings': '설정',
            'back-to-main': '메인으로',
            'tutorial-line1': '공격카드 중 하나를 선택하여 게임을 시작하세요!',
            'tutorial-line2': '카드는 손패 왼쪽부터 자동으로 발동됩니다!',
            'tutorial-line3': '각 스테이지 클리어 시 랜덤으로 등장하는 세개의 카드 중에 하나를 선택하여 손패 왼쪽에 가져옵니다!',
            'tutorial-line4': '최대 손패 카드는 10장입니다! 스테이지 클리어시 카드를 선택하여 추가, 손패의 카드와 교체, 다음 스테이지로 스킵 중에 선택 가능합니다!',
            'tutorial-line5': '몇 스테이지까지 갈 수 있을까요! 당신의 운을 시험해보세요!'
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
    }
}

// 전역 객체로 등록
window.MainMenu = MainMenu;