// 효과 및 애니메이션 시스템 관리

class EffectSystem {
    constructor() {
        this.effectsContainer = document.getElementById('effects-container');
        this.numbersContainer = document.getElementById('numbers-container');

        // 현재 진행 중인 효과들 추적
        this.activeEffects = new Map();

        // 현재 표시 중인 메시지들의 위치 추적 (겹침 방지)
        this.activeMessages = [];

        // AudioSystem 참조 (GameManager/BattleSystem에서 주입)
        this.audioSystem = null;
    }

    // 피격 효과 (고전 게임 스타일)
    async showHitEffect(targetPosition, element, damage = 0, effectiveness = 1.0) {
        // Step 1: 속성별 색상 플래시 + 사운드
        if (element && element !== 'normal') {
            // 속성 플래시 사운드 재생 (비동기 - 시각 효과와 동시 진행)
            if (this.audioSystem) {
                this.audioSystem.playElementFlashSFX(element);
            }
            await this.showElementFlash(element);
        }

        // Step 2: 피격 깜빡임 효과
        await this.showHitBlink(targetPosition);

        // Step 3: 대미지 숫자 표시 + 사운드 (속성 상성에 따른 스타일 적용)
        if (damage > 0) {
            // 데미지 타입별 사운드 재생
            if (this.audioSystem) {
                this.audioSystem.playDamageSFX(effectiveness);
            }

            let damageType = 'damage';
            if (effectiveness > 1.0) {
                damageType = 'strong'; // 1.5배 데미지
            } else if (effectiveness < 1.0) {
                damageType = 'weak';   // 0.5배 데미지
            }

            // 피격 데미지는 상태이상 메시지와 겹치지 않도록 위쪽에 표시 (Configuration-Driven)
            const offsetY = GameConfig.cardSelection.damageNumber.positionOffset.damageFromStatus;
            const damagePosition = {
                x: targetPosition.x,
                y: targetPosition.y + offsetY  // 음수 값으로 위로 올림
            };

            this.showDamageNumber(damage, damagePosition, damageType);
        }
    }

    // 속성별 색상 플래시
    showElementFlash(element) {
        return new Promise((resolve) => {
            const elementConfig = GameConfig.elements[element];
            if (!elementConfig) {
                resolve();
                return;
            }

            const flash = document.createElement('div');
            flash.className = 'hit-flash';
            flash.style.backgroundColor = elementConfig.color;

            document.body.appendChild(flash);

            setTimeout(() => {
                flash.remove();
                resolve();
            }, 300);
        });
    }

    // 피격 깜빡임 (고전 게임 스타일)
    showHitBlink(targetPosition) {
        return new Promise((resolve) => {
            // 타겟 영역의 요소들 찾기
            const isPlayerHit = targetPosition.y > window.innerHeight / 2;
            const targetElements = [];

            if (isPlayerHit) {
                // 플레이어 영역
                targetElements.push(document.getElementById('player-hp-bar'));
                // 플레이어 손패 영역도 깜빡임 (Canvas 기반이므로 나중에 구현)
            } else {
                // 적 영역
                targetElements.push(document.getElementById('enemy-hp-bar'));
                // 적 손패 영역도 깜빡임 (Canvas 기반이므로 나중에 구현)
            }

            // 깜빡임 애니메이션 적용
            targetElements.forEach(element => {
                if (element) {
                    element.style.animation = 'hitBlink 0.4s ease-out';
                }
            });

            setTimeout(() => {
                targetElements.forEach(element => {
                    if (element) {
                        element.style.animation = '';
                    }
                });
                resolve();
            }, 400);
        });
    }

    // 버프/디버프/회복 효과 표시
    showStatusEffect(type, targetPosition, power = 0) {
        const effectConfig = this.getEffectConfig(type);
        if (!effectConfig) return;

        // 효과 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = `effect-overlay ${type}`;
        overlay.style.left = (targetPosition.x - 50) + 'px'; // 중앙 정렬
        overlay.style.top = (targetPosition.y - 20) + 'px';

        // 아이콘과 텍스트
        overlay.innerHTML = `
            <span class="icon">${effectConfig.icon}</span>
            <span class="text">${effectConfig.text}</span>
        `;

        this.effectsContainer.appendChild(overlay);

        // 숫자 표시 (파워가 있는 경우)
        if (power > 0) {
            // 일반적인 buff/debuff는 기본 표시 유지 (템플릿 시스템은 특정 버프/상태이상용)
            this.showDamageNumber(power, targetPosition, type);
        }

        // 애니메이션 완료 후 제거
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 800);
    }

    // 효과 설정 가져오기
    getEffectConfig(type) {
        const configs = {
            buff: {
                icon: '↑',
                text: I18nHelper.getText('auto_battle_card_game.card_types.buff') || '버프',
                color: '#2ECC71'
            },
            debuff: {
                icon: '↓',
                text: I18nHelper.getText('auto_battle_card_game.card_types.debuff') || '디버프',
                color: '#E74C3C'
            },
            heal: {
                icon: '♥',
                text: I18nHelper.getText('auto_battle_card_game.ui.heal') || '회복',
                color: '#2ECC71'
            }
        };

        return configs[type];
    }

    // 템플릿 기반 효과 메시지 표시 (async - 읽기 시간 포함)
    async showEffectMessage(effectType, position, templateType, value = 0) {
        // GameConfig에서 효과 설정 가져오기
        const config = GameConfig.statusEffects[effectType] || GameConfig.buffs[effectType];
        if (!config) {
            console.warn(`Effect config not found for type: ${effectType}`);
            return;
        }

        // 이름 생성 (이모티콘 + 다국어 이름)
        const localizedName = config.nameKey ? I18nHelper.getText(config.nameKey) : config.name;
        const fullName = `${config.emoji} ${localizedName}`;

        // 템플릿 가져오기 및 변수 치환
        let template = I18nHelper.getText(`auto_battle_card_game.ui.templates.${templateType}`);
        if (!template) {
            console.warn(`Template not found: ${templateType}`);
            template = fullName; // fallback
        }

        let message = template
            .replace('{name}', fullName)
            .replace('{value}', value);

        // 메시지 타입 결정: 상태이상은 status 존, 버프는 buff 존
        const messageTypeForZone = GameConfig.statusEffects[effectType] ? 'status' : 'buff';

        // 상태이상 획득 사운드 재생 (버프는 showBuffEffect에서 재생)
        if (GameConfig.statusEffects[effectType] && this.audioSystem) {
            const sfxKey = GameConfig?.audio?.battleSounds?.messageEffects?.statusGain;
            if (sfxKey) {
                this.audioSystem.playSFX(sfxKey);
            }
        }

        // 숫자 표시 (존 정보를 위해 타입 전달)
        await this.showDamageNumber(0, position, messageTypeForZone, message);
    }

    // 방어력 획득 메시지 표시 (템플릿 기반, async - 읽기 시간 포함)
    async showDefenseGainMessage(position, value, metadata = {}) {
        // 방어력 획득 사운드 재생
        const sfxKey = GameConfig?.audio?.battleSounds?.effects?.defenseGain;
        if (sfxKey && this.audioSystem) {
            this.audioSystem.playSFX(sfxKey);
        }

        let template = I18nHelper.getText('auto_battle_card_game.ui.templates.defense_gained');
        if (!template) {
            console.warn('Defense gained template not found');
            template = '🛡️ Defense +{value}'; // fallback
        }

        let message = template.replace('{value}', value);
        await this.showDamageNumber(0, position, 'shield', message, metadata);
    }

    // 메시지 타입 자동 판별
    getMessageType(customText, type) {
        // MISS와 조건 실패 메시지는 항상 중앙 영역에 표시
        if (type === 'miss' || type === 'conditionFailed') {
            return 'damage';
        }

        // 상태이상 대미지 타입들은 status 존에 표시
        if (type === 'poison' || type === 'burn') {
            return 'status';
        }

        // 타입이 명시적으로 status나 buff인 경우 우선 적용
        if (type === 'status' || type === 'buff') {
            return type;
        }

        if (customText) {
            // 상태이상 이모지 체크
            if (customText.match(/[🔥☠️⚡💨❄️🌪️]/)) {
                return 'status';
            }
            // 버프/강화 관련 체크
            if (customText.includes('STR') || customText.includes('DEF') ||
                customText.includes('💪') || customText.includes('🛡️') ||
                customText.includes('방어력') || customText.includes('힘')) {
                return 'buff';
            }
        }
        // 기본값은 중앙 존
        return 'damage';
    }

    // 충돌 감지 (기존 메시지와 최소 거리 유지)
    checkCollision(newPosition, minDistance = 100) {
        for (const activeMsg of this.activeMessages) {
            const dx = newPosition.x - activeMsg.x;
            const dy = newPosition.y - activeMsg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                return true; // 충돌 감지
            }
        }
        return false; // 충돌 없음
    }

    // 존별 랜덤 위치 생성 (충돌 방지 포함)
    getRandomPositionInZone(zoneType, basePosition) {
        const zones = GameConfig.cardSelection.damageNumber.messageZones;
        const zone = zones[zoneType] || zones.damage;

        let attempts = 0;
        let position;
        const maxAttempts = 10; // 최대 시도 횟수

        do {
            const randomX = Math.random() * (zone.xRange[1] - zone.xRange[0]) + zone.xRange[0];
            const randomY = Math.random() * (zone.yRange[1] - zone.yRange[0]) + zone.yRange[0];

            position = {
                x: basePosition.x + randomX,
                y: basePosition.y + randomY
            };

            attempts++;
        } while (this.checkCollision(position) && attempts < maxAttempts);

        return position;
    }

    // 대미지/회복/효과 숫자 표시 (async - 읽기 시간 포함)
    // metadata: { isPlayerTarget: boolean } - BattleSystem에서 명시적으로 타겟 정보 전달
    async showDamageNumber(amount, position, type = 'damage', customText = null, metadata = {}) {
        const numberElement = document.createElement('div');
        let className = 'damage-number';

        // 메시지 타입 결정
        const messageType = this.getMessageType(customText, type);

        // Configuration-Driven 색상 시스템 - 하드코딩 제거
        // GameConfig.masterColors.messageTypes에서 색상 가져오기
        const messageColor = GameConfig?.masterColors?.messageTypes?.[type] || GameConfig?.masterColors?.messageTypes?.damage;

        // 커스텀 텍스트가 있으면 우선 사용
        if (customText) {
            numberElement.textContent = customText;
        } else {
            // 타입별 텍스트 설정
            switch (type) {
                case 'miss':
                    numberElement.textContent = I18nHelper.getText('auto_battle_card_game.ui.miss');
                    break;
                case 'conditionFailed':
                    numberElement.textContent = I18nHelper.getText('auto_battle_card_game.ui.condition_failed');
                    break;
                case 'zero':
                    numberElement.textContent = '0';
                    break;
                case 'strong':
                case 'weak':
                case 'selfDamage':
                    numberElement.textContent = `-${amount}`;
                    break;
                case 'heal':
                    numberElement.textContent = `+${amount}`;
                    break;
                case 'poison':
                    numberElement.textContent = `☠️-${amount}`;
                    break;
                case 'burn':
                    numberElement.textContent = `🔥-${amount}`;
                    break;
                case 'shield':
                case 'defense':
                    numberElement.textContent = `+${amount}`;
                    break;
                default:
                    numberElement.textContent = `-${amount}`;
            }
        }

        // 메시지 타입별 사운드 재생 (Configuration-Driven)
        if (this.audioSystem) {
            const soundMap = GameConfig?.audio?.battleSounds?.messageEffects;
            if (soundMap) {
                let sfxKey = null;

                switch (type) {
                    case 'miss':
                        sfxKey = soundMap.miss;
                        break;
                    case 'heal':
                        sfxKey = soundMap.heal;
                        break;
                    case 'conditionFailed':
                        sfxKey = soundMap.failed;
                        break;
                }

                if (sfxKey) {
                    this.audioSystem.playSFX(sfxKey);
                }
            }
        }

        // 기본 클래스만 설정 (색상은 CSS 변수로 동적 적용)
        numberElement.className = className;

        // Configuration-Driven 색상 적용 - CSS 변수 사용
        const cssVarName = `--color-message-${type}`;
        numberElement.style.color = `var(${cssVarName}, ${messageColor})`;

        // 존 기반 위치 계산 시스템 (근본 해결: 좌표 계산 제거, 명시적 플래그 사용)
        const config = GameConfig.cardSelection.damageNumber;

        // Step 1: 영역 판단 - BattleSystem에서 전달한 명시적 플래그 우선 사용
        // Fallback: 실제 화면 높이 기준 (스케일링 고려)
        // ⚠️ 주의: position.y는 getBoundingClientRect()의 스케일링 후 좌표
        //         window.innerHeight는 실제 뷰포트 높이
        const isPlayerArea = metadata?.isPlayerTarget ?? (position.y > window.innerHeight / 2);

        // 기본 위치 계산
        const centerX = GameConfig.canvas.width / 2;
        let targetY;

        // MISS와 조건 실패 메시지는 화면 Y축 중앙에 표시
        if (type === 'miss' || type === 'conditionFailed') {
            targetY = GameConfig.canvas.height / 2;
        } else {
            // Step 2: GameConfig 기반으로 정확한 메시지 표시 위치 계산
            // - 플레이어 영역 (하단) → 0.75 위치 (900px)
            // - 적 영역 (상단) → 0.25 위치 (300px)
            targetY = isPlayerArea ?
                GameConfig.canvas.height * config.position.playerY :
                GameConfig.canvas.height * config.position.enemyY;
        }

        // Step 3: 재계산된 targetY를 기준으로 basePosition 설정
        const basePosition = { x: centerX, y: targetY };

        // 메시지 타입에 따른 존별 랜덤 위치 생성
        let finalPosition = this.getRandomPositionInZone(messageType, basePosition);

        // 상태이상 메시지는 피격 대미지와 겹치지 않도록 위치 조정
        if (messageType === 'status' && customText) {
            const offsetY = GameConfig.cardSelection.damageNumber.positionOffset.statusDamageFromApplied;
            finalPosition = {
                x: finalPosition.x,
                y: finalPosition.y + offsetY  // 음수 값으로 위로 올림
            };
        }

        // 고정 폰트 크기 설정 (GameConfig 기반)
        const fontSize = GameConfig.cardSelection.damageNumber.fontSize;
        numberElement.style.fontSize = fontSize + 'px';

        // 커스텀 텍스트가 있는 모든 메시지는 화면 경계 체크 (Configuration-Driven)
        if (customText) {
            // 텍스트 너비 측정을 위해 임시로 DOM에 추가
            numberElement.style.visibility = 'hidden';
            this.numbersContainer.appendChild(numberElement);
            const textWidth = numberElement.offsetWidth;
            numberElement.remove();
            numberElement.style.visibility = 'visible';

            // GameConfig에서 여백 설정 가져오기 (안전한 접근)
            const margins = GameConfig?.cardSelection?.damageNumber?.textMargins || { left: 20, right: 20 };

            // 텍스트 끝이 화면 밖으로 나가지 않도록 조정 (오른쪽 경계)
            const textEndX = finalPosition.x + textWidth;
            let adjustedX = finalPosition.x;

            // 텍스트 끝이 화면 밖으로 나가면 왼쪽으로 이동
            if (textEndX > GameConfig.canvas.width - margins.right) {
                adjustedX = GameConfig.canvas.width - textWidth - margins.right;
            }

            // 왼쪽 경계도 체크 (음수 방지)
            adjustedX = Math.max(margins.left, adjustedX);

            numberElement.style.left = adjustedX + 'px';
        } else {
            numberElement.style.left = finalPosition.x + 'px';
        }

        numberElement.style.top = finalPosition.y + 'px';

        // z-index 우선순위 적용 (Configuration-Driven)
        const zIndexPriority = GameConfig.cardSelection.damageNumber.zIndexPriority;
        let zIndex = zIndexPriority.default;

        // 실제 대미지 숫자는 최상위에 표시
        if (type === 'damage' || type === 'strong' || type === 'weak' || type === 'selfDamage') {
            zIndex = zIndexPriority.damage;
        } else if (type === 'heal') {
            zIndex = zIndexPriority.heal;
        } else if (messageType === 'status') {
            zIndex = zIndexPriority.status;
        } else if (messageType === 'buff') {
            zIndex = zIndexPriority.buff;
        } else if (customText && (customText.includes('🛡️') || customText.includes('방어력'))) {
            zIndex = zIndexPriority.defense;
        }

        numberElement.style.zIndex = zIndex;

        // 활성 메시지 목록에 추가 (겹침 방지를 위해)
        const messageInfo = {
            x: finalPosition.x,
            y: finalPosition.y,
            element: numberElement
        };
        this.activeMessages.push(messageInfo);

        this.numbersContainer.appendChild(numberElement);

        // 애니메이션 완료 후 제거 (config 기반 지속시간)
        setTimeout(() => {
            if (numberElement.parentNode) {
                numberElement.remove();
            }
            // activeMessages에서도 제거
            const index = this.activeMessages.findIndex(msg => msg.element === numberElement);
            if (index !== -1) {
                this.activeMessages.splice(index, 1);
            }
        }, config.animation.duration);

        // 템플릿 기반 통합 읽기 시간 대기 (Configuration-Driven, 게임 속도 적용)
        const adjustedReadDelay = window.TimerManager ?
            window.TimerManager.applyGameSpeed(config.animation.readDelay) : config.animation.readDelay;
        await new Promise(resolve => setTimeout(resolve, adjustedReadDelay));
    }


    // 카드 발동 효과 (중앙 확대) - 통일된 DOMCardRenderer 사용
    showCardActivation(card, duration = 2000) {
        return new Promise((resolve) => {
            // DOMCardRenderer 인스턴스 생성
            if (!this.domCardRenderer) {
                this.domCardRenderer = new DOMCardRenderer();
            }

            // 확대 카드 크기 (gameConfig에서 가져오기)
            const cardSize = GameConfig.cardSizes.enlarged;

            // 통일된 카드 렌더러로 카드 생성
            const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
                isSelected: false,
                isHighlighted: false, // 확대 카드는 기본 색상 유지
                isNextActive: false,
                opacity: 1,
                context: 'runtime' // 카드 발동 시 실시간 스탯 반영
            });

            // 오버레이 컨테이너 생성
            const cardOverlay = document.createElement('div');
            cardOverlay.className = 'card-activation-overlay';
            cardOverlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: ${GameConfig.zIndexLayers.cardActivation};
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                animation: cardZoomIn 0.05s ease-out;
            `;

            // 통일된 카드를 오버레이에 추가
            cardOverlay.appendChild(cardElement);
            const gameContainer = document.querySelector('.game-container');
            gameContainer.appendChild(cardOverlay);

            // 게임 속도 적용 (TimerManager 사용)
            const adjustedDuration = window.TimerManager ?
                window.TimerManager.applyGameSpeed(duration) : duration;

            // 지속 시간 후 제거
            setTimeout(() => {
                cardOverlay.style.animation = 'cardZoomOut 0.05s ease-in forwards';
                setTimeout(() => {
                    if (cardOverlay.parentNode) {
                        cardOverlay.remove();
                    }
                    resolve();
                }, 50);
            }, adjustedDuration);
        });
    }

    // 위치 계산 헬퍼 함수들
    getPlayerPosition() {
        const playerBar = document.getElementById('player-hp-bar');
        const rect = playerBar.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    getEnemyPosition() {
        const enemyBar = document.getElementById('enemy-hp-bar');
        const rect = enemyBar.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // 버프 효과 표시 - 자동으로 올바른 위치 결정 (Configuration-Driven)
    async showBuffEffect(buffType, target, value) {
        // ===== Configuration-Driven 버프 적용 시스템 =====
        // 1. 실제 버프를 target에 적용
        // 2. 이펙트 메시지 표시
        // 3. UI 업데이트
        // 이렇게 하면 카드는 xxxGain만 반환하면 됨 (addXxxBuff 직접 호출 불필요)

        // 버프 적용 (Configuration-Driven 매핑)
        // ★ 특수 케이스: sulfur와 coating은 카드에서 이미 addXxxBuff() 호출
        //    (정화 정보를 반환받아야 하므로 카드에서 직접 호출)
        //    따라서 여기서는 스킵
        const skipBuffApplication = (buffType === 'sulfur' || buffType === 'coating');

        if (!skipBuffApplication) {
            const buffMethodMap = {
                strength: 'addStrength',  // ✅ 수정: Player.addStrength(amount) 메서드 사용
                enhance: 'addEnhanceBuff',
                focus: 'addFocusBuff',
                speed: 'addSpeedBuff',
                scent: 'addScentBuff',
                sharpen: 'addSharpenBuff',
                hotWind: 'addHotWindBuff',
                lithium: 'addLithiumBuff',
                breath: 'addBreathBuff',
                mass: 'addMassBuff',
                torrent: 'addTorrentBuff',
                absorption: 'addAbsorptionBuff',
                lightSpeed: 'addLightSpeedBuff',
                superConductivity: 'addSuperConductivityBuff',
                static: 'addStaticBuff',
                pack: 'addPackBuff',
                propagation: 'addPropagationBuff',
                poisonNeedle: 'addPoisonNeedleBuff'
            };

            const methodName = buffMethodMap[buffType];
            if (methodName && typeof target[methodName] === 'function') {
                target[methodName](value);
            } else {
                console.warn(`[EffectSystem] Unknown buff type or missing method: ${buffType}`);
            }
        }

        // target이 player인지 enemy인지 자동 판단하여 올바른 위치에 표시
        const position = this.getTargetPosition(target);

        // 버프 획득 사운드 재생
        const sfxKey = GameConfig?.audio?.battleSounds?.effects?.buffGain;
        if (sfxKey && this.audioSystem) {
            this.audioSystem.playSFX(sfxKey);
        }

        // GameConfig에서 버프 설정 가져오기 (안전한 접근 방식)
        const buffConfig = GameConfig?.buffs?.[buffType];

        // durationType에 따라 템플릿 선택
        let templateType = 'buff_gained'; // 기본값 (intensity-based)
        if (buffConfig?.durationType === 'duration') {
            templateType = 'buff_gained_turns'; // 턴 추가 방식
        }
        // 'special'이나 'intensity'는 기본값 사용

        await this.showEffectMessage(buffType, position, templateType, value);
    }

    // 타겟 위치 자동 결정 (하드코딩 제거)
    getTargetPosition(target) {
        if (!target) {
            // 기본값: 플레이어 위치
            return this.getPlayerPosition();
        }

        // BattleSystem의 player/enemy 참조 확인
        // window.battleSystem이나 전역 게임 인스턴스 활용
        if (window.gameManager && window.gameManager.battleSystem) {
            const battleSystem = window.gameManager.battleSystem;
            if (target === battleSystem.player) {
                return this.getPlayerPosition();
            } else if (target === battleSystem.enemy) {
                return this.getEnemyPosition();
            }
        }

        // Fallback: name 기반 판별 (기존 로직 유지)
        if (target.isPlayer || (typeof target.name === 'string' && target.name.includes('Player'))) {
            return this.getPlayerPosition();
        } else {
            return this.getEnemyPosition();
        }
    }

    // 모든 효과 즉시 정리
    clearAllEffects() {
        this.effectsContainer.innerHTML = '';
        this.numbersContainer.innerHTML = '';
        this.activeEffects.clear();
        this.activeMessages = []; // 메시지 목록도 초기화
    }

    // 복합 효과 (여러 효과 조합)
    async showCombinedEffect(effects) {
        const promises = effects.map(effect => {
            switch (effect.type) {
                case 'hit':
                    return this.showHitEffect(effect.position, effect.element, effect.damage);
                case 'status':
                    this.showStatusEffect(effect.statusType, effect.position, effect.power);
                    return Promise.resolve();
                case 'card':
                    return this.showCardActivation(effect.card, effect.duration);
                default:
                    return Promise.resolve();
            }
        });

        await Promise.all(promises);
    }

    // 자해 데미지 전용 애니메이션 (Configuration-Driven, 다국어 지원)
    async showSelfDamageAnimation(position, damage) {
        // GameConfig 안전한 접근 방식
        const config = GameConfig?.cardEffects?.selfDamage || {
            timing: {
                animationDelay: 300     // 기본값
            },
            visual: {
                damageColor: '#E67E22', // 기본값 (화상 색상)
                textKey: 'auto_battle_card_game.ui.templates.self_damage'
            }
        };

        // 다국어 메시지 가져오기 (fallback 지원)
        let message = null;
        try {
            // I18nHelper가 있으면 사용, 없으면 fallback
            if (typeof I18nHelper !== 'undefined') {
                message = I18nHelper.getText(config.visual.textKey);
            }
            if (!message) {
                message = GameConfig.fallbackTranslations[config.visual.textKey];
            }
            if (!message) {
                message = '자신에게 {damage} 데미지!'; // 최종 fallback
            }

            // 템플릿 변수 치환
            message = message.replace('{damage}', damage);
        } catch (error) {
            message = `자신에게 ${damage} 데미지!`; // 에러 시 기본값
        }

        // 자해 데미지 시각 효과 (Configuration-Driven 색상)
        await this.showSelfDamageFlash(config.visual.damageColor, config.timing.animationDelay);

        // 자해 데미지 숫자 표시 (특별한 스타일링)
        this.showDamageNumber(damage, position, 'selfDamage', message);

        // 설정된 지연시간만큼 대기
        await this.wait(config.timing.animationDelay);
    }

    // 자해 데미지 플래시 효과 (Configuration-Driven)
    showSelfDamageFlash(color, animationDelay = 300) {
        return new Promise((resolve) => {
            const flash = document.createElement('div');
            flash.className = 'self-damage-flash';
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: ${color};
                opacity: 0.3;
                z-index: 9999;
                pointer-events: none;
                animation: selfDamageFlash ${animationDelay}ms ease-out;
            `;

            document.body.appendChild(flash);

            // 애니메이션 완료 후 제거
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.remove();
                }
                resolve();
            }, animationDelay);
        });
    }

    // 대기 함수 (유틸리티)
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 화면 흔들림 효과 (큰 데미지 시)
     * @param {number} intensity - 흔들림 강도 (1.0 = 기본, 2.0 = 2배)
     * @param {number} gameSpeed - 게임 속도 배수 (1 = 보통, 2 = 빠름, 5 = 매우빠름)
     */
    showScreenShake(intensity = 1.0, gameSpeed = 1) {
        const gameWrapper = document.querySelector('.game-wrapper');
        if (!gameWrapper) return;

        // 이미 흔들리고 있으면 기존 애니메이션 즉시 종료하고 새로 시작
        if (gameWrapper.classList.contains('screen-shake')) {
            gameWrapper.classList.remove('screen-shake');
            // 즉시 리플로우 강제 (애니메이션 재시작을 위해)
            void gameWrapper.offsetWidth;
        }

        // 흔들림 강도에 따라 CSS 변수 설정
        const shakeDistance = 10 * Math.min(intensity, 3.0); // 최대 30px
        gameWrapper.style.setProperty('--shake-distance', `${shakeDistance}px`);

        // 게임 속도에 따라 애니메이션 duration 조절 (Configuration-Driven)
        const speedMapping = GameConfig?.timing?.combat?.screenShakeBySpeed || {
            0.5: 600,
            1: 300,
            2: 180,
            5: 120
        };

        // 게임 속도에 해당하는 duration 찾기, 없으면 기본 계산
        const adjustedDuration = speedMapping[gameSpeed] ||
            (GameConfig?.timing?.combat?.screenShake || 300) / Math.max(gameSpeed, 0.5);

        gameWrapper.style.setProperty('--shake-duration', `${adjustedDuration}ms`);

        // 화면 흔들림 클래스 추가
        gameWrapper.classList.add('screen-shake');

        // 애니메이션 종료 후 클래스 제거
        setTimeout(() => {
            gameWrapper.classList.remove('screen-shake');
            gameWrapper.style.removeProperty('--shake-distance');
            gameWrapper.style.removeProperty('--shake-duration');
        }, adjustedDuration);
    }
}

// CSS 애니메이션 추가 (동적으로)
const style = document.createElement('style');
style.textContent = `
    @keyframes cardZoomIn {
        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    @keyframes cardZoomOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
    }

    @keyframes selfDamageFlash {
        0% { opacity: 0; }
        50% { opacity: 0.3; }
        100% { opacity: 0; }
    }

    @keyframes screenShake {
        0%, 100% { transform: translate3d(0, 0, 0); }
        10% { transform: translate3d(calc(var(--shake-distance, 10px) * -1), calc(var(--shake-distance, 10px) * 1), 0); }
        20% { transform: translate3d(calc(var(--shake-distance, 10px) * 1), calc(var(--shake-distance, 10px) * -1), 0); }
        30% { transform: translate3d(calc(var(--shake-distance, 10px) * -0.8), calc(var(--shake-distance, 10px) * 0.8), 0); }
        40% { transform: translate3d(calc(var(--shake-distance, 10px) * 0.8), calc(var(--shake-distance, 10px) * -0.8), 0); }
        50% { transform: translate3d(calc(var(--shake-distance, 10px) * -0.6), calc(var(--shake-distance, 10px) * 0.6), 0); }
        60% { transform: translate3d(calc(var(--shake-distance, 10px) * 0.6), calc(var(--shake-distance, 10px) * -0.6), 0); }
        70% { transform: translate3d(calc(var(--shake-distance, 10px) * -0.4), calc(var(--shake-distance, 10px) * 0.4), 0); }
        80% { transform: translate3d(calc(var(--shake-distance, 10px) * 0.4), calc(var(--shake-distance, 10px) * -0.4), 0); }
        90% { transform: translate3d(calc(var(--shake-distance, 10px) * -0.2), calc(var(--shake-distance, 10px) * 0.2), 0); }
    }

    .screen-shake {
        animation: screenShake var(--shake-duration, 0.3s) ease-in-out;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }
`;
document.head.appendChild(style);

// 전역 객체로 등록
window.EffectSystem = EffectSystem;