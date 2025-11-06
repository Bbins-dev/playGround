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
                text: 'back-to-homepage',
                action: () => { window.location.href = '../../'; },
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

                // 기존 이벤트 리스너 제거 (중복 방지)
                button.removeEventListener('click', button._mainMenuClickHandler);
                button.removeEventListener('focus', button._mainMenuFocusHandler);

                // 클릭 이벤트 리스너 추가
                button._mainMenuClickHandler = () => {
                    // 버튼 클릭 사운드 재생
                    if (this.gameManager?.audioSystem) {
                        this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                    }
                    this.currentSelection = index;
                    this.selectCurrent();
                };
                button.addEventListener('click', button._mainMenuClickHandler);

                // 키보드 포커스 이벤트 추가
                button._mainMenuFocusHandler = () => {
                    this.currentSelection = index;
                    this.updateButtonSelection();
                };
                button.addEventListener('focus', button._mainMenuFocusHandler);
            }
        });
    }

    // 메뉴 표시
    show() {
        if (this.menuContainer) {
            this.menuContainer.classList.remove('hidden');
            this.menuContainer.style.display = 'flex'; // 명시적으로 표시
            this.updateButtonSelection();
        }
        // 렌더링 강제 요청
        this.needsRedraw = true;
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
                button.style.borderColor = GameConfig.colors?.ui?.primaryHover || '#f39c12';
                button.style.background = `linear-gradient(135deg, rgba(52, 152, 219, 0.4), rgba(52, 152, 219, 0.2))`;
            } else {
                button.classList.remove('selected');
                button.style.borderColor = GameConfig.colors?.ui?.primary || '#3498db';
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

        // 렌더링이 필요하거나 설정된 시간 이상 지났을 때만 렌더링 (60fps 제한)
        if (!this.needsRedraw && (currentTime - this.lastRenderTime < (GameConfig.timing?.rendering?.throttle || 16))) {
            return;
        }
        this.renderBackground(ctx, canvas);
        this.renderTitle(ctx, canvas);
        this.renderVersionInfo(ctx, canvas);   // 버전 정보 렌더링
        // Canvas 메뉴 렌더링 비활성화 - DOM 버튼 사용
        // this.renderMenuItems(ctx, canvas);
        // this.renderInstructions(ctx, canvas); // 조작 안내 메시지 비활성화
        this.renderContactInfo(ctx, canvas);   // 연락처 정보 렌더링 (볼륨 안내 + 비즈니스 이메일)
        this.renderCredits(ctx, canvas);       // 제작자 정보 렌더링

        this.needsRedraw = false;
        this.lastRenderTime = currentTime;
    }

    // 배경 렌더링
    renderBackground(ctx, canvas) {
        // GameConfig에서 색상 가져오기 (안전성 검사 포함)
        const gradient = ctx.createLinearGradient(0, 0, 0, GameConfig.canvas.height);
        gradient.addColorStop(0, GameConfig.colors?.ui?.background?.gradient?.start || '#2E4057');
        gradient.addColorStop(0.5, GameConfig.colors?.ui?.background?.gradient?.middle || '#48729B');
        gradient.addColorStop(1, GameConfig.colors?.ui?.background?.gradient?.end || '#5D8AA8');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GameConfig.canvas.width, GameConfig.canvas.height);

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

        for (let x = -cardSize.width; x < GameConfig.canvas.width + cardSize.width; x += spacing) {
            for (let y = -cardSize.height; y < GameConfig.canvas.height + cardSize.height; y += spacing) {
                const offsetX = (y / spacing) % 2 === 0 ? 0 : spacing / 2;

                ctx.strokeStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';
                ctx.lineWidth = 1;

                // 카드 모양
                this.roundRect(ctx, x + offsetX, y, cardSize.width, cardSize.height, 8);
                ctx.stroke();

                // 카드 내부 장식
                ctx.fillStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';
                ctx.font = `${GameConfig.fonts?.sizes?.large || 20}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
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

        // 제목 문자열 가져오기
        const gameTitle = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.title') || '자동전투 카드대전' : '자동전투 카드대전';

        // 두 줄로 나누기
        const titleLines = gameTitle.split('\n');
        const lineHeight = config.size + 10; // 줄 간격

        ctx.save();
        ctx.font = `bold ${config.size}px Arial`;
        ctx.textAlign = 'center';

        // 제목 그림자 (더 진하게)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        titleLines.forEach((line, index) => {
            const lineY = titleY + (index - (titleLines.length - 1) / 2) * lineHeight;
            ctx.fillText(line, centerX + config.shadowOffset, lineY + config.shadowOffset);
        });

        // 메인 제목 (더 밝고 크게)
        ctx.fillStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';
        ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
        ctx.lineWidth = 2;
        titleLines.forEach((line, index) => {
            const lineY = titleY + (index - (titleLines.length - 1) / 2) * lineHeight;
            ctx.strokeText(line, centerX, lineY);
            ctx.fillText(line, centerX, lineY);
        });


        // 부제목 (5속성 색상 적용)
        ctx.font = `${GameConfig.fonts?.weights?.bold || 'bold'} ${subtitleConfig.size}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        const gameDescription = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.subtitle') || '5속성 자동전투 카드게임' : '5속성 자동전투 카드게임';
        const subtitleY = titleY + subtitleConfig.offsetY;

        // 속성별 색상 배열 (순서: fire, water, electric, poison, normal)
        const elementColors = ['fire', 'water', 'electric', 'poison', 'normal'];

        // "|"로 분리하여 각 단어에 색상 적용
        if (gameDescription.includes('|')) {
            const words = gameDescription.split('|');
            ctx.textAlign = 'center';

            // 현재 언어 확인 (일본어는 띄어쓰기 없음)
            const currentLang = window.i18n?.currentLanguage || 'ko';
            const separator = (currentLang === 'ja') ? '' : ' ';

            // 전체 텍스트 길이 계산
            const fullText = words.join(separator);
            const fullWidth = ctx.measureText(fullText).width;
            let currentX = centerX - fullWidth / 2;

            words.forEach((word, index) => {
                const elementType = elementColors[index] || 'normal';
                const color = GameConfig.elements?.[elementType]?.color || '#E0E0E0';

                // 단어 렌더링
                ctx.fillStyle = color;
                ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
                ctx.lineWidth = 1;

                const wordWidth = ctx.measureText(word).width;
                ctx.textAlign = 'left';
                ctx.strokeText(word, currentX, subtitleY);
                ctx.fillText(word, currentX, subtitleY);

                // 다음 단어 위치 계산 (언어별 띄어쓰기 적용)
                currentX += wordWidth;
                if (separator && index < words.length - 1) {
                    currentX += ctx.measureText(separator).width;
                }
            });
        } else {
            // 구분자가 없으면 기본 렌더링
            ctx.textAlign = 'center';
            ctx.fillStyle = GameConfig.colors?.ui?.text?.secondary || '#E0E0E0';
            ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
            ctx.lineWidth = 1;
            ctx.strokeText(gameDescription, centerX, subtitleY);
            ctx.fillText(gameDescription, centerX, subtitleY);
        }

        ctx.restore();
    }

    // 버전 정보 렌더링
    renderVersionInfo(ctx, canvas) {
        const config = GameConfig.mainMenu.versionDisplay;
        const titleConfig = GameConfig.mainMenu.title;
        const centerX = GameConfig.canvas.width / 2;
        const versionY = titleConfig.y + config.offsetY;

        // 버전 단계 문자열 가져오기 (i18n)
        const versionStage = (typeof getI18nText === 'function') ?
            getI18nText(`auto_battle_card_game.version.${GameConfig.versionInfo.stage}`) || 'Early Access Beta' : 'Early Access Beta';

        // 버전 텍스트: "Early Access Beta v0.1.0"
        const versionText = `${versionStage} v${GameConfig.versionInfo.number}`;

        ctx.save();
        ctx.font = `${config.size}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';  // secondary → primary (더 밝게)
        ctx.globalAlpha = config.opacity;

        ctx.fillText(versionText, centerX, versionY);

        ctx.restore();
    }

    // 제작자 정보 렌더링
    renderCredits(ctx, canvas) {
        const config = GameConfig.mainMenu.creditsDisplay;
        const centerX = GameConfig.canvas.width / 2;
        const creditsY = GameConfig.canvas.height + config.offsetY;

        // 제작자 텍스트 가져오기 (i18n 템플릿 사용)
        let creditsTemplate = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.credits.text') || '© {year} {company}' : '© {year} {company}';

        // 템플릿 변수 치환
        const creditsText = creditsTemplate
            .replace('{year}', GameConfig.credits.year)
            .replace('{company}', GameConfig.credits.company);

        ctx.save();
        ctx.font = `${GameConfig.fonts?.weights?.bold || 'bold'} ${config.size}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';  // secondary → primary (더 밝게)
        ctx.globalAlpha = config.opacity;

        ctx.fillText(creditsText, centerX, creditsY);

        ctx.restore();
    }

    // 연락처 정보 렌더링 (볼륨 안내 + 비즈니스 이메일)
    renderContactInfo(ctx, canvas) {
        const contactConfig = GameConfig?.mainMenu?.contactInfo;
        if (!contactConfig?.enabled) return;

        const centerX = GameConfig.canvas.width / 2;
        const creditsConfig = GameConfig.mainMenu.creditsDisplay;
        const creditsY = GameConfig.canvas.height + creditsConfig.offsetY;
        const lineSpacing = contactConfig.position.lineSpacing;

        // i18n 텍스트 가져오기
        const noticeText = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.main_menu.volume_mute_notice') || '' : '';
        const businessLabel = (typeof getI18nText === 'function') ?
            getI18nText('auto_battle_card_game.main_menu.business_contact') || 'Business Contact Email' : 'Business Contact Email';
        const emailText = contactConfig.email;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = GameConfig.colors?.ui?.text?.primary || '#FFFFFF';
        ctx.globalAlpha = contactConfig.style.opacity;

        // === 안내 문구 렌더링 (독립적인 위치 - 훨씬 위쪽) ===
        const noticeStartY = creditsY - contactConfig.position.noticeOffsetY;
        ctx.font = `${GameConfig.fonts?.weights?.normal || 'normal'} ${contactConfig.style.noticeFontSize}px ${GameConfig.fonts?.families?.main || 'Arial'}`;

        // 자동 줄바꿈 로직 (언어별 처리)
        const maxWidth = contactConfig.style.noticeMaxWidth || 700;
        const noticeLines = [];
        const currentLang = window.i18n?.currentLanguage || 'en';

        if (currentLang === 'ja') {
            // 일본어: 글자 단위 줄바꿈 (띄어쓰기 없음)
            let currentLine = '';
            for (let i = 0; i < noticeText.length; i++) {
                const char = noticeText[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    noticeLines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) noticeLines.push(currentLine);
        } else {
            // 한국어/영어: 단어 단위 줄바꿈 (공백 기준)
            const words = noticeText.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    noticeLines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) noticeLines.push(currentLine);
        }

        // 안내 문구 여러 줄 렌더링
        let noticeY = noticeStartY;
        for (const line of noticeLines) {
            ctx.fillText(line, centerX, noticeY);
            noticeY += lineSpacing;
        }

        // === 비즈니스 정보 렌더링 (독립적인 위치 - 저작권 바로 위, 원래 위치) ===
        const businessStartY = creditsY - contactConfig.position.businessOffsetY;

        // 비즈니스 연락 레이블
        ctx.font = `${GameConfig.fonts?.weights?.bold || 'bold'} ${contactConfig.style.labelFontSize}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.fillText(businessLabel, centerX, businessStartY);

        // 이메일 주소
        ctx.font = `${GameConfig.fonts?.weights?.normal || 'normal'} ${contactConfig.style.emailFontSize}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.fillText(emailText, centerX, businessStartY + lineSpacing);

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
                ctx.strokeStyle = GameConfig.colors?.ui?.selection?.selected || '#FFD700';
                ctx.lineWidth = 3;  // 더 두껍게
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';  // 더 진하게
                ctx.strokeStyle = GameConfig.colors?.ui?.selection?.hover || '#CCCCCC';
                ctx.lineWidth = 2;
            }
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.strokeStyle = GameConfig.colors?.ui?.selection?.border || '#666666';
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
        ctx.font = `${config.iconSize}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isDisabled ? (GameConfig.colors?.ui?.text?.disabled || '#888888') : (isSelected ? (GameConfig.colors?.ui?.selection?.selected || '#FFD700') : (GameConfig.colors?.ui?.text?.primary || '#FFFFFF'));
        ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(item.icon, iconX, y + 8);
        ctx.fillText(item.icon, iconX, y + 8);

        // 텍스트 렌더링
        ctx.font = `${GameConfig.fonts?.weights?.bold || 'bold'} ${fontSize}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isDisabled ? (GameConfig.colors?.ui?.text?.disabled || '#888888') : (isSelected ? (GameConfig.colors?.ui?.selection?.selected || '#FFD700') : (GameConfig.colors?.ui?.text?.primary || '#FFFFFF'));
        ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(text, textX, y + 5);
        ctx.fillText(text, textX, y + 5);

        // 선택 표시기 (왼쪽 끝에 배치)
        if (isSelected && !isDisabled) {
            ctx.fillStyle = GameConfig.colors?.ui?.selection?.selected || '#FFD700';
            ctx.font = `${GameConfig.fonts?.weights?.bold || 'bold'} ${GameConfig.fonts?.sizes?.xlarge || 24}px ${GameConfig.fonts?.families?.main || 'Arial'}`;
            ctx.strokeStyle = GameConfig.colors?.ui?.text?.outline || '#000000';
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

        const startY = GameConfig.canvas.height + config.startY;
        instructions.forEach((instruction, index) => {
            ctx.fillText(instruction, GameConfig.canvas.width / 2, startY + index * config.lineHeight);
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

    // 입력 처리 - 키보드 내비게이션 비활성화
    handleInput(key) {
        // 키보드 내비게이션 기능 비활성화
        // 마우스나 터치만 사용하도록 제한
        return;
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
        // Prevent double-click execution
        if (this._startingGame) return;
        this._startingGame = true;

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

        // Reset debounce flag after 500ms
        setTimeout(() => { this._startingGame = false; }, 500);
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
        const modal = document.getElementById('game-tutorial-modal');
        const closeBtn = document.getElementById('close-tutorial');

        if (modal) {
            modal.classList.remove('hidden');

            // 모달이 열릴 때 i18n 적용 (새로 추가된 요소들을 위해)
            if (typeof applyTutorialTranslations === 'function') {
                // 짧은 지연 후 번역 적용 (DOM 렌더링 완료 후)
                setTimeout(() => {
                    applyTutorialTranslations();
                    // 추가로 속성 이름들을 강제로 업데이트
                    this.forceUpdateElementNames();
                }, 100);
            }

            // 닫기 버튼 이벤트 (한 번만 등록)
            if (closeBtn && !closeBtn._tutorialHandler) {
                closeBtn._tutorialHandler = () => {
                    // 버튼 클릭 사운드 재생
                    if (this.gameManager?.audioSystem) {
                        this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                    }
                    modal.classList.add('hidden');
                };
                closeBtn.addEventListener('click', closeBtn._tutorialHandler);
            }

            // ESC 키로 닫기 (비활성화)
            // const handleEsc = (e) => {
            //     if (e.key === 'Escape') {
            //         modal.classList.add('hidden');
            //         document.removeEventListener('keydown', handleEsc);
            //     }
            // };
            // document.addEventListener('keydown', handleEsc);
        }
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



    // 현지화 텍스트 가져오기
    getLocalizedText(key) {
        // i18n 키 매핑
        const i18nKeys = {
            'start-game': 'auto_battle_card_game.ui.start_game',
            'game-tutorial': 'auto_battle_card_game.ui.game_tutorial',
            'card-gallery': 'auto_battle_card_game.ui.card_gallery',
            'back-to-main': 'auto_battle_card_game.ui.back_to_main',
            'tutorial-line1': 'auto_battle_card_game.tutorial.line1',
            'tutorial-line2': 'auto_battle_card_game.tutorial.line2',
            'tutorial-line3': 'auto_battle_card_game.tutorial.line3',
            'tutorial-line4': 'auto_battle_card_game.tutorial.line4',
            'tutorial-line5': 'auto_battle_card_game.tutorial.line5'
        };

        const i18nKey = i18nKeys[key];
        if (i18nKey && typeof getI18nText === 'function') {
            return getI18nText(i18nKey) || GameConfig.fallbackTranslations?.[key] || key;
        }

        return GameConfig.fallbackTranslations?.[key] || key;
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
        const centerX = GameConfig.canvas.width / 2;

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

    // 속성 이름들을 강제로 업데이트하는 메서드
    forceUpdateElementNames() {
        if (!window.i18nSystem) return;

        const elementNames = {
            'fire': window.i18nSystem.getTranslation('auto_battle_card_game.elements.fire'),
            'water': window.i18nSystem.getTranslation('auto_battle_card_game.elements.water'),
            'electric': window.i18nSystem.getTranslation('auto_battle_card_game.elements.electric'),
            'poison': window.i18nSystem.getTranslation('auto_battle_card_game.elements.poison')
        };

        const strongText = window.i18nSystem.getTranslation('auto_battle_card_game.tutorial.strong');

        // 모든 속성 이름 요소들을 찾아서 업데이트
        document.querySelectorAll('[data-i18n="auto_battle_card_game.elements.fire"]').forEach(el => {
            if (elementNames.fire) el.textContent = elementNames.fire;
        });
        document.querySelectorAll('[data-i18n="auto_battle_card_game.elements.water"]').forEach(el => {
            if (elementNames.water) el.textContent = elementNames.water;
        });
        document.querySelectorAll('[data-i18n="auto_battle_card_game.elements.electric"]').forEach(el => {
            if (elementNames.electric) el.textContent = elementNames.electric;
        });
        document.querySelectorAll('[data-i18n="auto_battle_card_game.elements.poison"]').forEach(el => {
            if (elementNames.poison) el.textContent = elementNames.poison;
        });
        document.querySelectorAll('[data-i18n="auto_battle_card_game.tutorial.strong"]').forEach(el => {
            if (strongText) el.textContent = strongText;
        });
    }

    // 정리
    cleanup() {
        // 이벤트 리스너 정리 등
    }
}

// 전역 객체로 등록
window.MainMenu = MainMenu;