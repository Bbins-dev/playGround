// HP 바 시스템 관리

class HPBarSystem {
    constructor() {
        // HP 바 요소들
        this.playerHPBar = document.getElementById('player-hp-bar');
        this.enemyHPBar = document.getElementById('enemy-hp-bar');

        // HP 바 내부 요소들
        this.playerFill = this.playerHPBar.querySelector('.hp-bar-fill');
        this.playerNumber = this.playerHPBar.querySelector('.hp-number');
        this.playerName = this.playerHPBar.querySelector('.entity-name');
        this.playerDefenseInfo = this.playerHPBar.querySelector('.defense-info');
        this.playerStatus = this.playerHPBar.querySelector('.hp-info .status-effects');

        this.enemyFill = this.enemyHPBar.querySelector('.hp-bar-fill');
        this.enemyNumber = this.enemyHPBar.querySelector('.hp-number');
        this.enemyName = this.enemyHPBar.querySelector('.entity-name');
        this.enemyDefenseInfo = this.enemyHPBar.querySelector('.defense-info');
        this.enemyStatus = this.enemyHPBar.querySelector('.hp-info .status-effects');

        // 방어력 오버레이 요소들
        this.playerDefenseOverlay = this.playerHPBar.querySelector('.defense-overlay');
        this.playerDefenseNumber = this.playerHPBar.querySelector('.defense-number-overlay');
        this.playerDefenseElement = document.getElementById('player-defense-element');

        this.enemyDefenseOverlay = this.enemyHPBar.querySelector('.defense-overlay');
        this.enemyDefenseNumber = this.enemyHPBar.querySelector('.defense-number-overlay');
        this.enemyDefenseElement = document.getElementById('enemy-defense-element');

        // 방어속성 배지 래퍼들
        this.playerBadgeWrapper = document.querySelector('.defense-badge-wrapper.badge-above');
        this.enemyBadgeWrapper = document.querySelector('.defense-badge-wrapper.badge-below');

        // 새로운 효과 컨테이너들
        this.playerEffectsContainer = document.getElementById('player-effects-container');
        this.playerStatusGrid = document.getElementById('player-status-effects-grid');
        this.playerBuffsGrid = document.getElementById('player-buffs-grid');

        this.enemyEffectsContainer = document.getElementById('enemy-effects-container');
        this.enemyStatusGrid = document.getElementById('enemy-status-effects-grid');
        this.enemyBuffsGrid = document.getElementById('enemy-buffs-grid');

        // 애니메이션 상태 추적
        this.animating = {
            player: false,
            enemy: false
        };

        // CSS 변수 동기화 초기화
        this.syncCSSVariables();
    }

    // CSS 변수 동기화 메서드
    syncCSSVariables() {
        if (!GameConfig.battleHUD) return;

        const root = document.documentElement;

        // HP 바 설정
        if (GameConfig.battleHUD.hpBar) {
            root.style.setProperty('--hp-bar-height', `${GameConfig.battleHUD.hpBar.height}px`);
            root.style.setProperty('--hp-bar-font-size', `${GameConfig.battleHUD.hpBar.fontSize}px`);
            root.style.setProperty('--hp-number-font-size', `${GameConfig.battleHUD.hpBar.numberFontSize}px`);
        }

        // 상태이상 설정
        if (GameConfig.battleHUD.statusEffects) {
            const statusConfig = GameConfig.battleHUD.statusEffects;
            root.style.setProperty('--effect-columns', statusConfig.columns);
            root.style.setProperty('--effect-spacing', `${statusConfig.spacing}px`);
            root.style.setProperty('--effect-vertical-spacing', `${statusConfig.verticalSpacing}px`);
            root.style.setProperty('--effect-icon-size', `${statusConfig.iconSize}px`);
            root.style.setProperty('--effect-font-size', `${statusConfig.fontSize}px`);
        }

        // 버프 설정 (상태이상과 동일한 값 사용)
        if (GameConfig.battleHUD.buffs) {
            // 버프는 상태이상과 동일한 CSS 변수 사용
        }
    }

    // HP 바 업데이트 (Promise 반환으로 수정)
    async updateHP(player, isPlayer = true) {
        const targetElements = isPlayer ? {
            fill: this.playerFill,
            number: this.playerNumber,
            key: 'player'
        } : {
            fill: this.enemyFill,
            number: this.enemyNumber,
            key: 'enemy'
        };

        const percentage = (player.hp / player.maxHP) * 100;

        // 애니메이션 상태 설정
        this.animating[targetElements.key] = true;

        // HP 바 애니메이션
        targetElements.fill.style.width = percentage + '%';

        // HP 바 색상 변경 (체력에 따라)
        if (percentage > 60) {
            targetElements.fill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
        } else if (percentage > 30) {
            targetElements.fill.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
        } else {
            targetElements.fill.style.background = 'linear-gradient(90deg, #E74C3C, #C0392B)';
        }

        // HP 숫자 카운트 애니메이션 완료까지 대기
        await this.animateHPNumber(targetElements.number, player.hp, player.maxHP);

        // 애니메이션 상태 해제
        this.animating[targetElements.key] = false;
    }

    // HP 숫자 카운트 애니메이션 (Promise 반환으로 수정)
    // HP 숫자 카운트 애니메이션 (배터리 최적화: RAF 사용)
    animateHPNumber(element, targetHP, maxHP) {
        const currentText = element.textContent;
        const currentHP = parseInt(currentText.split('/')[0]);

        if (currentHP === targetHP) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const duration = GameConfig?.masterTiming?.ui?.hpAnimation || 300; // GameConfig 참조, 기본값 300ms
            const steps = 10; // 20 → 10단계로 축소 (배터리 절약 + 빠른 애니메이션)
            const startTime = performance.now();
            const hpDiff = targetHP - currentHP;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const step = Math.floor(progress * steps);

                const newHP = Math.round(currentHP + (hpDiff * progress));
                element.textContent = `${newHP}/${maxHP}`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = `${targetHP}/${maxHP}`;
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // 방어력 숫자 카운트 애니메이션 (배터리 최적화: RAF 사용)
    animateDefenseNumber(element, targetDefense) {
        const currentText = element.textContent;
        const currentDefense = parseInt(currentText.replace('🛡️', '')) || 0;

        if (currentDefense === targetDefense) {
            element.textContent = `🛡️${targetDefense}`;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const duration = GameConfig?.masterTiming?.ui?.defenseAnimation || 300; // GameConfig 참조, 기본값 300ms
            const steps = 10; // 20 → 10단계로 축소 (배터리 절약)
            const startTime = performance.now();
            const defenseDiff = targetDefense - currentDefense;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const step = Math.floor(progress * steps);

                const newDefense = Math.round(currentDefense + (defenseDiff * progress));
                element.textContent = `🛡️${newDefense}`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = `🛡️${targetDefense}`;
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // Configuration-Driven 버프 엘리먼트 생성 헬퍼
    _createBuffElement(buffsContainer, effectsContainer, buffType, value, isPlayer) {
        const buffConfig = GameConfig.buffs[buffType];
        if (!buffConfig) {
            console.warn(`HPBarSystem._createBuffElement: 알 수 없는 버프 타입: ${buffType}`);
            return;
        }

        // 버프가 있는 경우 컨테이너 활성화
        effectsContainer.classList.add('active');

        const buffElement = document.createElement('div');
        buffElement.className = 'buff-label';

        // 다국어 지원 - I18nHelper 사용
        const buffName = buffConfig.nameKey ?
            I18nHelper.getText(buffConfig.nameKey) || buffConfig.name :
            buffConfig.name;

        // Configuration-Driven 값 표시 결정
        let displayText = `${buffConfig.emoji} ${buffName}`;
        if (buffConfig.display?.showValue && value !== undefined) {
            // format 패턴 사용: '({value})', '+{value}', '×{value}'
            const format = buffConfig.display.format || '';
            if (format.includes('{value}')) {
                const formattedValue = format.replace('{value}', value);
                displayText += formattedValue;
            } else {
                // fallback: format에 {value} 플레이스홀더가 없는 경우
                console.warn(`HPBarSystem._createBuffElement: ${buffType}의 format에 {value} 플레이스홀더가 없습니다.`);
                displayText += ` ${value}`;  // 기본 형식으로 표시
            }
        }

        buffElement.innerHTML = displayText;

        // 버프별 색상 적용
        buffElement.style.borderColor = buffConfig.color;
        buffElement.style.background = `linear-gradient(135deg, ${buffConfig.color}, ${buffConfig.color}CC)`;

        // 클릭 이벤트 추가 (툴팁 모달 표시)
        buffElement.style.cursor = 'pointer';
        buffElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.BuffStatusTooltipModal) {
                window.BuffStatusTooltipModal.show('buff', buffType);
            }
        });

        // Flexbox column-reverse/column으로 방향 제어
        // 플레이어: column-reverse로 아래→위 자동 처리
        // 적: column으로 위→아래 자동 처리
        buffsContainer.appendChild(buffElement);
    }

    // 상태이상 표시 업데이트 (새로운 그리드 시스템)
    updateStatusEffects(player, isPlayer = true) {
        const statusContainer = isPlayer ? this.playerStatusGrid : this.enemyStatusGrid;
        const effectsContainer = isPlayer ? this.playerEffectsContainer : this.enemyEffectsContainer;

        // 기존 상태이상 클리어
        statusContainer.innerHTML = '';

        // 플레이어 상태이상에 대한 화면 테두리 효과 (통합 노랑색 - 경고)
        if (isPlayer && player.statusEffects.length > 0) {
            this.showScreenBorderEffect('#F39C12');
        } else if (isPlayer) {
            this.clearScreenBorderEffect();
        }

        // 상태이상이 있는 경우 컨테이너 활성화, 없으면 비활성화
        if (player.statusEffects.length > 0) {
            effectsContainer.classList.add('active');
        } else {
            // 상태이상이 없고 버프도 없으면 컨테이너 숨김
            const buffsContainer = isPlayer ? this.playerBuffsGrid : this.enemyBuffsGrid;
            if (!buffsContainer.children.length) {
                effectsContainer.classList.remove('active');
            }
        }

        // 새 상태이상들 추가
        player.statusEffects.forEach((effect, index) => {
            const statusConfig = GameConfig.statusEffects[effect.type];
            if (!statusConfig) return;

            const statusElement = document.createElement('div');
            statusElement.className = 'status-label';

            // 지속 턴수 또는 배수 표시
            let countdownHtml = '';
            const instantReleaseStatuses = ['frozen', 'stun', 'taunt', 'oblivion'];

            // 발화: 스택 기반 배수 표시 (×3, ×9, ×27...)
            if (effect.type === 'ignition' && effect.stacks) {
                const multiplier = Math.pow(GameConfig?.statusEffects?.ignition?.stackMultiplier || 3, effect.stacks);
                countdownHtml = `×${multiplier}`;
            }
            // 다른 상태이상: 기존 턴수 표시
            else if (effect.turnsLeft && effect.turnsLeft > 0 && !instantReleaseStatuses.includes(effect.type)) {
                countdownHtml = `(${effect.turnsLeft})`;
            }

            const statusName = statusConfig.nameKey && typeof I18nHelper !== 'undefined' ?
                I18nHelper.getText(statusConfig.nameKey) || statusConfig.name :
                statusConfig.name;

            statusElement.innerHTML = `${statusConfig.emoji} ${statusName}${countdownHtml}`;

            // 상태이상별 색상 적용 (GameConfig 데이터 활용)
            statusElement.style.borderColor = statusConfig.color;
            statusElement.style.background = `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}CC)`;

            // 클릭 이벤트 추가 (툴팁 모달 표시)
            statusElement.style.cursor = 'pointer';
            statusElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.BuffStatusTooltipModal) {
                    window.BuffStatusTooltipModal.show('status', effect.type);
                }
            });

            statusContainer.appendChild(statusElement);
        });
    }

    // 버프 표시 업데이트 (새로운 그리드 시스템)
    updateBuffs(player, isPlayer = true) {
        const buffsContainer = isPlayer ? this.playerBuffsGrid : this.enemyBuffsGrid;
        const effectsContainer = isPlayer ? this.playerEffectsContainer : this.enemyEffectsContainer;

        // 기존 버프 라벨 제거
        buffsContainer.innerHTML = '';

        // 힘 버프 표시 (사슬 상태이상 무시 - 버프 값 직접 체크)
        if (player.strength > 0) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'strength',
                player.strength,
                isPlayer
            );
        }

        // 강화 버프 표시
        if (player.hasEnhanceBuff && player.hasEnhanceBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'enhance',
                player.enhanceTurns,
                isPlayer
            );
        }

        // 집중 버프 표시
        if (player.hasFocusBuff && player.hasFocusBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'focus',
                player.focusTurns,
                isPlayer
            );
        }

        // 고속 버프 표시
        if (player.hasSpeedBuff && player.hasSpeedBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'speed',
                player.speedBonus,
                isPlayer
            );
        }

        // 냄새 버프 표시
        if (player.hasScentBuff && player.hasScentBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'scent',
                player.scentBonus,
                isPlayer
            );
        }

        // 벼리기 버프 표시 (showValue: false - 턴 표시 없음)
        if (player.hasSharpenBuff && player.hasSharpenBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'sharpen',
                player.sharpenTurns,
                isPlayer
            );
        }

        // 마음 버프 표시 (showValue: false - 턴 표시 없음)
        if (player.hasMindBuff && player.hasMindBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'mind',
                player.mindTurns,
                isPlayer
            );
        }

        // 열풍 버프 표시
        if (player.hasHotWindBuff && player.hasHotWindBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'hotWind',
                player.hotWindTurns,
                isPlayer
            );
        }

        // Li⁺ 버프 표시
        if (player.hasLithiumBuff && player.hasLithiumBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'lithium',
                player.lithiumTurns,
                isPlayer
            );
        }

        // 호흡 버프 표시 (showValue: false - 턴 표시 없음)
        if (player.hasBreathBuff && player.hasBreathBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'breath',
                player.breathTurns,
                isPlayer
            );
        }

        // 질량 버프 표시
        if (player.hasMassBuff && player.hasMassBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'mass',
                player.massBonus,
                isPlayer
            );
        }

        // 급류 버프 표시
        if (player.hasTorrentBuff && player.hasTorrentBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'torrent',
                player.torrentBonus,
                isPlayer
            );
        }

        // 흡수 버프 표시
        if (player.hasAbsorptionBuff && player.hasAbsorptionBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'absorption',
                player.absorptionBonus,
                isPlayer
            );
        }

        // 광속 버프 표시
        if (player.hasLightSpeedBuff && player.hasLightSpeedBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'lightSpeed',
                player.lightSpeedBonus,
                isPlayer
            );
        }

        // 초전도 버프 표시 (showValue: false - 턴 표시 없음)
        if (player.hasSuperConductivityBuff && player.hasSuperConductivityBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'superConductivity',
                player.superConductivityTurns,
                isPlayer
            );
        }

        // 정전기 버프 표시 (showValue: true - 턴수 표시)
        if (player.hasStaticBuff && player.hasStaticBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'static',
                player.staticTurns,
                isPlayer
            );
        }

        // 팩 버프 표시
        if (player.hasPackBuff && player.hasPackBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'pack',
                player.packBonus,
                isPlayer
            );
        }

        // 연쇄 버프 표시
        if (player.hasPropagationBuff && player.hasPropagationBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'propagation',
                player.propagationBonus,
                isPlayer
            );
        }

        // 독침 버프 표시
        if (player.hasPoisonNeedleBuff && player.hasPoisonNeedleBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'poisonNeedle',
                player.poisonNeedleTurns,
                isPlayer
            );
        }

        // 유황 버프 표시
        if (player.hasSulfurBuff && player.hasSulfurBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'sulfur',
                player.sulfurTurns,
                isPlayer
            );
        }

        // 코팅 버프 표시
        if (player.hasCoatingBuff && player.hasCoatingBuff()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'coating',
                player.coatingTurns,
                isPlayer
            );
        }

        // 우비 버프 표시 (스택 기반 - 턴이 아님!)
        if (player.hasRaincoatProtection && player.hasRaincoatProtection()) {
            this._createBuffElement(
                buffsContainer,
                effectsContainer,
                'raincoat',
                player.raincoatStacks,
                isPlayer
            );
        }

        // 버프가 없고 상태이상도 없으면 컨테이너 숨김
        const statusContainer = isPlayer ? this.playerStatusGrid : this.enemyStatusGrid;
        if (!buffsContainer.children.length && !statusContainer.children.length) {
            effectsContainer.classList.remove('active');
        }
    }

    // 방어력 오버레이 업데이트 (Promise 반환으로 수정)
    async updateDefense(player, isPlayer = true) {
        const targetElements = isPlayer ? {
            overlay: this.playerDefenseOverlay,
            number: this.playerDefenseNumber,
            defenseInfo: this.playerDefenseInfo,
            key: isPlayer ? 'player' : 'enemy'
        } : {
            overlay: this.enemyDefenseOverlay,
            number: this.enemyDefenseNumber,
            defenseInfo: this.enemyDefenseInfo,
            key: isPlayer ? 'player' : 'enemy'
        };

        if (player.defense > 0) {
            // 방어력 오버레이 표시 및 크기 조정
            // 최대 HP까지는 100% 비율로 표시, 그 이상은 100%로 고정
            const maxHP = player.maxHP;
            const percentage = Math.min((player.defense / maxHP) * 100, 100);

            // 방어력 게이지 애니메이션 (부드럽게 증가)
            targetElements.overlay.style.width = percentage + '%';

            // 방어력이 maxHP와 같거나 클 때 최대 효과 적용
            if (player.defense >= maxHP) {
                targetElements.overlay.classList.add('max-defense');
            } else {
                targetElements.overlay.classList.remove('max-defense');
            }

            // 방어력 정보 표시
            targetElements.defenseInfo.classList.remove('hidden');

            // 방어력 숫자 카운트 애니메이션 완료까지 대기
            await this.animateDefenseNumber(targetElements.number, player.defense);
        } else {
            // 방어력이 0일 때 숨김
            targetElements.overlay.style.width = '0%';
            targetElements.overlay.classList.remove('max-defense');
            targetElements.defenseInfo.classList.add('hidden');
        }

        // 가시 정보 업데이트 (버프 라벨로 표시)
        this.updateBuffs(player, isPlayer);
    }

    // 방어속성 배지 업데이트
    updateDefenseElementBadge(player, isPlayer = true) {
        const defenseElementBadge = isPlayer ? this.playerDefenseElement : this.enemyDefenseElement;

        if (!defenseElementBadge) return;

        // 현재 방어속성 가져오기 (player.defenseElement)
        const defenseElement = player.defenseElement || 'normal';
        const elementConfig = GameConfig.elements[defenseElement];

        if (!elementConfig) return;

        // 이모지와 텍스트 요소 찾기
        const emojiElement = defenseElementBadge.querySelector('.badge-emoji');
        const textElement = defenseElementBadge.querySelector('.badge-text');

        if (emojiElement && textElement) {
            // 이모지 업데이트
            emojiElement.textContent = elementConfig.emoji;

            // 텍스트 업데이트 (i18n 지원)
            const i18nHelper = window.I18nHelper?.instance || new window.I18nHelper();
            const elementNameKey = `auto_battle_card_game.ui.elements.${defenseElement}`;
            const elementName = i18nHelper.getText(elementNameKey);
            textElement.textContent = elementName;
        }

        // 기존 속성 클래스 제거
        defenseElementBadge.classList.remove('fire', 'water', 'electric', 'poison', 'normal');

        // 새 속성 클래스 추가
        defenseElementBadge.classList.add(defenseElement);

        // 클릭 이벤트 추가 (툴팁 모달 표시)
        defenseElementBadge.style.cursor = 'pointer';
        // 기존 이벤트 리스너 제거 (중복 방지)
        const oldClickHandler = defenseElementBadge._clickHandler;
        if (oldClickHandler) {
            defenseElementBadge.removeEventListener('click', oldClickHandler);
        }
        // 새 이벤트 리스너 추가
        const newClickHandler = (e) => {
            e.stopPropagation();
            if (window.BuffStatusTooltipModal) {
                window.BuffStatusTooltipModal.show('defenseElement', defenseElement);
            }
        };
        defenseElementBadge.addEventListener('click', newClickHandler);
        defenseElementBadge._clickHandler = newClickHandler; // 참조 저장
    }

    // 방어력 감소 애니메이션 (배터리 최적화: RAF 사용)
    animateDefenseDecrease(player, isPlayer = true) {
        const targetElements = isPlayer ? {
            overlay: this.playerDefenseOverlay,
            number: this.playerDefenseNumber,
            defenseInfo: this.playerDefenseInfo
        } : {
            overlay: this.enemyDefenseOverlay,
            number: this.enemyDefenseNumber,
            defenseInfo: this.enemyDefenseInfo
        };

        const initialDefense = player.defense;

        // 방어력이 없으면 애니메이션하지 않음
        if (initialDefense <= 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const duration = GameConfig?.masterTiming?.ui?.defenseShatter || 300; // GameConfig 참조, 기본값 300ms
            const steps = 10; // 20 → 10단계로 축소 (배터리 절약)
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentDefense = Math.max(0, Math.round(initialDefense * (1 - progress)));

                // 방어력 오버레이 크기 조정
                const maxHP = player.maxHP;
                const percentage = Math.min((currentDefense / maxHP) * 100, 100);
                targetElements.overlay.style.width = percentage + '%';

                // 방어력 숫자 업데이트
                if (currentDefense > 0) {
                    targetElements.number.textContent = `🛡️${currentDefense}`;
                } else {
                    targetElements.defenseInfo.classList.add('hidden');
                    targetElements.overlay.style.width = '0%';
                    targetElements.overlay.classList.remove('max-defense');
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // 방어력 깨지는 애니메이션
    showDefenseBreakEffect(isPlayer = true) {
        const defenseOverlay = isPlayer ? this.playerDefenseOverlay : this.enemyDefenseOverlay;

        defenseOverlay.classList.add('shatter-animation');
        setTimeout(() => {
            defenseOverlay.classList.remove('shatter-animation');
        }, 400); // gameConfig의 애니메이션 시간과 일치
    }

    // 화면 테두리 효과
    showScreenBorderEffect(color) {
        const gameContainer = document.querySelector('.game-container');

        gameContainer.style.borderColor = color;
        gameContainer.style.borderWidth = '8px';  // 적당한 두께로 조정
        gameContainer.style.borderStyle = 'solid';
    }

    // 화면 테두리 효과 제거
    clearScreenBorderEffect() {
        const gameContainer = document.querySelector('.game-container');

        gameContainer.style.borderColor = '';
        gameContainer.style.borderWidth = '';
        gameContainer.style.borderStyle = '';
    }

    // 턴 인디케이터 표시 (턴 시작 시에만)
    showTurnIndicator(playerName, isPlayerTurn = true) {
        const container = document.getElementById('turn-indicator-container');
        if (!container) {
            console.warn('[HPBarSystem] 턴 인디케이터 컨테이너를 찾을 수 없습니다');
            return;
        }

        // 기존 인디케이터 재사용 또는 생성
        let indicator = container.querySelector('.turn-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'turn-indicator';
            container.appendChild(indicator);
        }

        // 텍스트 및 색상 업데이트
        const config = GameConfig?.battleHUD?.turnIndicator?.message;
        if (isPlayerTurn) {
            // 플레이어 턴
            const playerTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.player_turn_template') || '{name}의 턴';
            const turnText = playerTurnTemplate.replace('{name}', playerName);
            indicator.textContent = turnText;
            indicator.style.color = config?.playerColor || '#2ECC71';
        } else {
            // 적 턴
            const enemyTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.enemy_turn_template') || '{name}의 턴';
            const turnText = enemyTurnTemplate.replace('{name}', playerName);
            indicator.textContent = turnText;
            indicator.style.color = config?.enemyColor || '#E74C3C';
        }

        // 표시 (visible 클래스 추가)
        indicator.classList.add('visible');

        // 턴 전환 애니메이션 트리거 (약간의 크기 변화)
        indicator.classList.remove('turn-change');
        void indicator.offsetWidth; // 리플로우 강제 (애니메이션 재시작)
        indicator.classList.add('turn-change');
    }

    // 턴 인디케이터 숨기기 (스테이지 종료/시작 시)
    hideTurnIndicator() {
        const container = document.getElementById('turn-indicator-container');
        if (!container) return;

        const indicator = container.querySelector('.turn-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }

    // 전체 플레이어 정보 업데이트 (통합 메서드)
    async updatePlayerInfo(player, enemy) {
        // HP 업데이트
        await this.updateHP(player, true);
        await this.updateHP(enemy, false);

        // 이름 업데이트
        this.updateNames(player, enemy);

        // 방어력 업데이트
        await this.updateDefense(player, true);
        await this.updateDefense(enemy, false);

        // 상태이상 업데이트
        this.updateStatusEffects(player, true);
        this.updateStatusEffects(enemy, false);

        // 버프 업데이트
        this.updateBuffs(player, true);
        this.updateBuffs(enemy, false);

        // 방어속성 배지 업데이트
        this.updateDefenseElementBadge(player, true);
        this.updateDefenseElementBadge(enemy, false);
    }

    // 데미지 적용 후 순차 업데이트 (방어력 → HP 순서 보장)
    async updateAfterDamage(player, isPlayer = true) {
        // Configuration-Driven: 타이밍 설정 사용
        const timing = GameConfig?.timing?.ui?.damageSequence || {
            defenseFirst: true,
            delayBetween: 200
        };

        if (timing.defenseFirst) {
            // 1. 방어력 먼저 업데이트 (애니메이션 완료까지 대기)
            await this.updateDefense(player, isPlayer);

            // 2. 짧은 딜레이 (시각적 구분)
            if (timing.delayBetween > 0) {
                await new Promise(resolve => setTimeout(resolve, timing.delayBetween));
            }

            // 3. HP 업데이트 (애니메이션 완료까지 대기)
            await this.updateHP(player, isPlayer);
        } else {
            // fallback: 기존 동시 업데이트
            await Promise.all([
                this.updateDefense(player, isPlayer),
                this.updateHP(player, isPlayer)
            ]);
        }

        // 4. 상태이상과 이름은 즉시 업데이트 (시각적 우선순위 낮음)
        this.updateStatusEffects(player, isPlayer);
        this.updateBuffs(player, isPlayer);

        // 5. 방어속성 배지 업데이트
        this.updateDefenseElementBadge(player, isPlayer);
    }

    // 이름 업데이트
    updateNames(player, enemy) {
        if (this.playerName && player.name) {
            this.playerName.textContent = player.name;
        }
        if (this.enemyName && enemy.name) {
            this.enemyName.textContent = enemy.name;
        }
    }

    // 대미지 숫자 표시 (강화 버전)
    showDamageNumber(amount, position, type = 'damage', isCritical = false) {
        const container = document.getElementById('numbers-container');

        const numberElement = document.createElement('div');
        let className = `damage-number ${type}-number`;
        if (isCritical) className += ' critical-number';

        numberElement.className = className;

        // 텍스트 설정
        switch (type) {
            case 'damage':
                numberElement.textContent = `-${amount}`;
                break;
            case 'heal':
                numberElement.textContent = `+${amount}`;
                break;
            case 'shield':
                numberElement.textContent = `🛡️+${amount}`;
                break;
            case 'poison':
                numberElement.textContent = `☠️${amount}`;
                break;
            default:
                numberElement.textContent = amount;
        }

        // 위치 설정 (약간의 랜덤 오프셋 추가)
        const randomX = (Math.random() - 0.5) * 40;
        const randomY = (Math.random() - 0.5) * 20;
        numberElement.style.left = (position.x + randomX) + 'px';
        numberElement.style.top = (position.y + randomY) + 'px';

        container.appendChild(numberElement);

        // 애니메이션 완료 후 제거
        setTimeout(() => {
            if (numberElement.parentNode) {
                numberElement.remove();
            }
        }, GameConfig.battleHUD.damageNumbers.duration);
    }

    // 화면 플래시 효과
    showScreenFlash(type = 'damage') {
        if (!GameConfig.battleHUD.screenEffects.flash.enabled) return;

        const flashElement = document.createElement('div');
        flashElement.className = `screen-flash ${type}`;
        flashElement.style.opacity = '0.5';

        document.body.appendChild(flashElement);

        // 플래시 효과
        setTimeout(() => {
            flashElement.style.opacity = '0';
        }, 50);

        // 제거
        setTimeout(() => {
            if (flashElement.parentNode) {
                flashElement.remove();
            }
        }, 200);
    }

    // 화면 흔들림 효과
    showScreenShake() {
        if (!GameConfig.battleHUD.screenEffects.shake.enabled) return;

        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('shake');

        setTimeout(() => {
            gameContainer.classList.remove('shake');
        }, GameConfig.battleHUD.screenEffects.shake.duration);
    }

    // 피격 위치 계산
    getHitPosition(isPlayer = true) {
        const rect = isPlayer ?
            this.playerHPBar.getBoundingClientRect() :
            this.enemyHPBar.getBoundingClientRect();

        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // HP 바 표시/숨김
    show() {
        this.playerHPBar.style.display = 'flex';
        this.enemyHPBar.style.display = 'flex';
        // 방어속성 배지도 함께 표시
        if (this.playerBadgeWrapper) this.playerBadgeWrapper.style.display = 'block';
        if (this.enemyBadgeWrapper) this.enemyBadgeWrapper.style.display = 'block';
        // 효과 컨테이너들의 display 속성 초기화 (CSS active 클래스에 맡김)
        if (this.playerEffectsContainer) this.playerEffectsContainer.style.display = '';
        if (this.enemyEffectsContainer) this.enemyEffectsContainer.style.display = '';
    }

    hide() {
        this.playerHPBar.style.display = 'none';
        this.enemyHPBar.style.display = 'none';
        // 방어속성 배지도 함께 숨김
        if (this.playerBadgeWrapper) this.playerBadgeWrapper.style.display = 'none';
        if (this.enemyBadgeWrapper) this.enemyBadgeWrapper.style.display = 'none';
        // 효과 컨테이너들도 함께 숨김
        if (this.playerEffectsContainer) this.playerEffectsContainer.style.display = 'none';
        if (this.enemyEffectsContainer) this.enemyEffectsContainer.style.display = 'none';
    }

    // 초기화
    reset() {
        // HP 바를 100%로 리셋 (이제 10/10으로 변경)
        this.playerFill.style.width = '100%';
        this.enemyFill.style.width = '100%';

        // 숫자 리셋 (10/10으로 변경)
        this.playerNumber.textContent = '10/10';
        this.enemyNumber.textContent = '10/10';

        // 방어력 오버레이 리셋
        if (this.playerDefenseOverlay) {
            this.playerDefenseOverlay.style.width = '0%';
            this.playerDefenseOverlay.classList.remove('max-defense');
            this.playerDefenseInfo.classList.add('hidden');
        }
        if (this.enemyDefenseOverlay) {
            this.enemyDefenseOverlay.style.width = '0%';
            this.enemyDefenseOverlay.classList.remove('max-defense');
            this.enemyDefenseInfo.classList.add('hidden');
        }

        // 효과 컨테이너들 클리어 및 숨김
        if (this.playerStatusGrid) this.playerStatusGrid.innerHTML = '';
        if (this.playerBuffsGrid) this.playerBuffsGrid.innerHTML = '';
        if (this.enemyStatusGrid) this.enemyStatusGrid.innerHTML = '';
        if (this.enemyBuffsGrid) this.enemyBuffsGrid.innerHTML = '';

        if (this.playerEffectsContainer) this.playerEffectsContainer.classList.remove('active');
        if (this.enemyEffectsContainer) this.enemyEffectsContainer.classList.remove('active');

        // 화면 테두리 효과 제거
        this.clearScreenBorderEffect();

        // 색상 리셋
        this.playerFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
        this.enemyFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';

        // 방어속성 배지 리셋 (normal로)
        if (this.playerDefenseElement) {
            const emojiElement = this.playerDefenseElement.querySelector('.badge-emoji');
            const textElement = this.playerDefenseElement.querySelector('.badge-text');
            if (emojiElement && textElement) {
                emojiElement.textContent = '👊';
                const i18nHelper = window.I18nHelper?.instance || new window.I18nHelper();
                const elementName = i18nHelper.getText('auto_battle_card_game.ui.elements.normal');
                textElement.textContent = elementName;
            }
            this.playerDefenseElement.classList.remove('fire', 'water', 'electric', 'poison');
            this.playerDefenseElement.classList.add('normal');
        }
        if (this.enemyDefenseElement) {
            const emojiElement = this.enemyDefenseElement.querySelector('.badge-emoji');
            const textElement = this.enemyDefenseElement.querySelector('.badge-text');
            if (emojiElement && textElement) {
                emojiElement.textContent = '👊';
                const i18nHelper = window.I18nHelper?.instance || new window.I18nHelper();
                const elementName = i18nHelper.getText('auto_battle_card_game.ui.elements.normal');
                textElement.textContent = elementName;
            }
            this.enemyDefenseElement.classList.remove('fire', 'water', 'electric', 'poison');
            this.enemyDefenseElement.classList.add('normal');
        }
    }
}

// 전역 객체로 등록
window.HPBarSystem = HPBarSystem;