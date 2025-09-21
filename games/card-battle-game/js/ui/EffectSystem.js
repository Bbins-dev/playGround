// 효과 및 애니메이션 시스템 관리

class EffectSystem {
    constructor() {
        this.effectsContainer = document.getElementById('effects-container');
        this.numbersContainer = document.getElementById('numbers-container');

        // 현재 진행 중인 효과들 추적
        this.activeEffects = new Map();
    }

    // 피격 효과 (고전 게임 스타일)
    async showHitEffect(targetPosition, element, damage = 0) {
        // Step 1: 속성별 색상 플래시
        if (element && element !== 'normal') {
            await this.showElementFlash(element);
        }

        // Step 2: 피격 깜빡임 효과
        await this.showHitBlink(targetPosition);

        // Step 3: 대미지 숫자 표시 (동시에)
        if (damage > 0) {
            this.showDamageNumber(damage, targetPosition, 'damage');
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

    // 대미지/회복/효과 숫자 표시
    showDamageNumber(amount, position, type = 'damage') {
        const numberElement = document.createElement('div');
        let className = 'damage-number';

        switch (type) {
            case 'heal':
                className += ' heal-number';
                numberElement.textContent = `+${amount}`;
                break;
            case 'buff':
                className += ' buff-number';
                numberElement.textContent = `+${amount}`;
                break;
            case 'debuff':
                className += ' debuff-number';
                numberElement.textContent = `-${amount}`;
                break;
            case 'defense-gain':
                className += ' defense-number';
                numberElement.textContent = `${amount}`;
                break;
            case 'miss':
                className += ' miss-number';
                // I18nHelper 사용하여 빗나감 텍스트 설정
                numberElement.textContent = I18nHelper.getText('auto_battle_card_game.ui.miss');
                break;
            case 'zero':
                className += ' zero-number';
                numberElement.textContent = '0';
                break;
            case 'stun':
                className += ' stun-number';
                numberElement.textContent = I18nHelper.getText('auto_battle_card_game.ui.stunned') || '기절함!';
                break;
            case 'taunt':
                className += ' taunt-number';
                numberElement.textContent = I18nHelper.getText('auto_battle_card_game.ui.taunted') || '도발됨!';
                break;
            default:
                numberElement.textContent = `-${amount}`;
        }

        numberElement.className = className;

        // 새로운 위치 계산 시스템 (gameConfig 기반)
        const config = GameConfig.cardSelection.damageNumber;
        const isPlayerDamage = position.y > GameConfig.canvas.height / 2;

        // 전투 영역 중앙 기준으로 위치 계산
        const centerX = GameConfig.canvas.width / 2;
        const targetY = isPlayerDamage ?
            GameConfig.canvas.height * config.position.playerY :
            GameConfig.canvas.height * config.position.enemyY;

        // 랜덤 분산 적용
        const randomX = (Math.random() - 0.5) * config.position.randomX * 2; // -60 ~ +60px
        const randomY = (Math.random() - 0.5) * config.position.randomY * 2; // -20 ~ +20px

        numberElement.style.left = (centerX + randomX) + 'px';
        numberElement.style.top = (targetY + randomY) + 'px';

        // 반응형 폰트 크기 설정
        const fontSize = this.getResponsiveFontSize();
        numberElement.style.fontSize = fontSize + 'px';

        this.numbersContainer.appendChild(numberElement);

        // 애니메이션 완료 후 제거 (config 기반 지속시간)
        setTimeout(() => {
            if (numberElement.parentNode) {
                numberElement.remove();
            }
        }, config.animation.duration);
    }

    // 반응형 폰트 크기 계산
    getResponsiveFontSize() {
        const config = GameConfig.cardSelection.damageNumber.fontSize;
        const screenWidth = window.innerWidth;

        if (screenWidth <= 768) {
            return config.mobile;
        } else if (screenWidth <= 1024) {
            return config.medium;
        } else {
            return config.large;
        }
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
                isHighlighted: true, // 확대 시 하이라이트 효과
                isNextActive: false,
                opacity: 1
            });

            // 오버레이 컨테이너 생성
            const cardOverlay = document.createElement('div');
            cardOverlay.className = 'card-activation-overlay';
            cardOverlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 999;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                animation: cardZoomIn 0.05s ease-out;
            `;

            // 통일된 카드를 오버레이에 추가
            cardOverlay.appendChild(cardElement);
            document.body.appendChild(cardOverlay);

            // 지속 시간 후 제거
            setTimeout(() => {
                cardOverlay.style.animation = 'cardZoomOut 0.05s ease-in forwards';
                setTimeout(() => {
                    if (cardOverlay.parentNode) {
                        cardOverlay.remove();
                    }
                    resolve();
                }, 50);
            }, duration);
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

    // 모든 효과 즉시 정리
    clearAllEffects() {
        this.effectsContainer.innerHTML = '';
        this.numbersContainer.innerHTML = '';
        this.activeEffects.clear();
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
`;
document.head.appendChild(style);

// 전역 객체로 등록
window.EffectSystem = EffectSystem;