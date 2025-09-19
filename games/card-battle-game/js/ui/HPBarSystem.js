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
        this.playerStatus = document.getElementById('player-status-effects');

        this.enemyFill = this.enemyHPBar.querySelector('.hp-bar-fill');
        this.enemyNumber = this.enemyHPBar.querySelector('.hp-number');
        this.enemyName = this.enemyHPBar.querySelector('.entity-name');
        this.enemyDefenseInfo = this.enemyHPBar.querySelector('.defense-info');
        this.enemyStatus = document.getElementById('enemy-status-effects');

        // 방어력 오버레이 요소들
        this.playerDefenseOverlay = this.playerHPBar.querySelector('.defense-overlay');
        this.playerDefenseNumber = this.playerHPBar.querySelector('.defense-number-overlay');
        this.playerThornsInfo = this.playerHPBar.querySelector('.thorns-info');
        this.playerThornsNumber = this.playerHPBar.querySelector('.thorns-number');

        this.enemyDefenseOverlay = this.enemyHPBar.querySelector('.defense-overlay');
        this.enemyDefenseNumber = this.enemyHPBar.querySelector('.defense-number-overlay');
        this.enemyThornsInfo = this.enemyHPBar.querySelector('.thorns-info');
        this.enemyThornsNumber = this.enemyHPBar.querySelector('.thorns-number');

        // 애니메이션 상태 추적
        this.animating = {
            player: false,
            enemy: false
        };
    }

    // HP 바 업데이트
    updateHP(player, isPlayer = true) {
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

        // HP 숫자 카운트 애니메이션
        this.animateHPNumber(targetElements.number, player.hp, player.maxHP);
    }

    // HP 숫자 카운트 애니메이션
    animateHPNumber(element, targetHP, maxHP) {
        const currentText = element.textContent;
        const currentHP = parseInt(currentText.split('/')[0]);

        if (currentHP === targetHP) return;

        const duration = 500; // 0.5초
        const steps = 20;
        const stepDuration = duration / steps;
        const hpDiff = targetHP - currentHP;
        const stepValue = hpDiff / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const newHP = Math.round(currentHP + (stepValue * step));
            element.textContent = `${newHP}/${maxHP}`;

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = `${targetHP}/${maxHP}`;
            }
        }, stepDuration);
    }

    // 상태이상 표시 업데이트 (강화 버전)
    updateStatusEffects(player, isPlayer = true) {
        const statusContainer = isPlayer ? this.playerStatus : this.enemyStatus;

        // 기존 상태이상 클리어
        statusContainer.innerHTML = '';

        // 새 상태이상들 추가
        player.statusEffects.forEach((effect, index) => {
            const statusConfig = GameConfig.statusEffects[effect.type];
            if (!statusConfig) return;

            const statusElement = document.createElement('div');
            statusElement.className = 'status-icon pulse'; // 펄스 애니메이션 추가

            // 지속 턴수가 있는 경우 카운트다운 표시
            let countdownHtml = '';
            if (effect.duration && effect.duration > 0) {
                countdownHtml = `<span class="countdown">${effect.duration}</span>`;
            }

            statusElement.innerHTML = `
                <span class="icon">${statusConfig.emoji}</span>
                <span class="name">${statusConfig.name}</span>
                ${countdownHtml}
            `;

            // 상태이상별 색상 적용
            statusElement.style.borderColor = statusConfig.color;
            statusElement.style.background = statusConfig.color + '33'; // 투명도 추가

            // 화면 테두리 효과 (첫 번째 상태이상만)
            if (index === 0 && GameConfig.statusEffectsUI.screenEffects.enabled) {
                this.showScreenBorderEffect(statusConfig.color);
            }

            statusContainer.appendChild(statusElement);
        });
    }

    // 방어력 오버레이 업데이트
    updateDefense(player, isPlayer = true) {
        const targetElements = isPlayer ? {
            overlay: this.playerDefenseOverlay,
            number: this.playerDefenseNumber,
            defenseInfo: this.playerDefenseInfo,
            thornsInfo: this.playerThornsInfo,
            thornsNumber: this.playerThornsNumber
        } : {
            overlay: this.enemyDefenseOverlay,
            number: this.enemyDefenseNumber,
            defenseInfo: this.enemyDefenseInfo,
            thornsInfo: this.enemyThornsInfo,
            thornsNumber: this.enemyThornsNumber
        };

        if (player.defense > 0) {
            // 방어력 오버레이 표시 및 크기 조정
            // 최대 HP까지는 100% 비율로 표시, 그 이상은 100%로 고정
            const maxHP = player.maxHP;
            const percentage = Math.min((player.defense / maxHP) * 100, 100);
            targetElements.overlay.style.width = percentage + '%';

            // 방어력이 maxHP와 같거나 클 때 최대 효과 적용
            if (player.defense >= maxHP) {
                targetElements.overlay.classList.add('max-defense');
            } else {
                targetElements.overlay.classList.remove('max-defense');
            }

            // 방어력 정보 표시
            targetElements.defenseInfo.classList.remove('hidden');
            targetElements.number.textContent = player.defense;
        } else {
            // 방어력이 0일 때 숨김
            targetElements.overlay.style.width = '0%';
            targetElements.overlay.classList.remove('max-defense');
            targetElements.defenseInfo.classList.add('hidden');
        }

        // 가시 정보 업데이트
        if (player.thorns > 0) {
            targetElements.thornsInfo.classList.remove('hidden');
            targetElements.thornsNumber.textContent = player.thorns;
        } else {
            targetElements.thornsInfo.classList.add('hidden');
        }
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
        if (!GameConfig.statusEffectsUI.screenEffects.enabled) return;

        const gameContainer = document.querySelector('.game-container');
        const originalBorder = gameContainer.style.borderColor;

        gameContainer.style.borderColor = color;
        gameContainer.style.borderWidth = '4px';

        setTimeout(() => {
            gameContainer.style.borderColor = originalBorder;
            gameContainer.style.borderWidth = '2px';
        }, GameConfig.statusEffectsUI.screenEffects.borderFlash.duration);
    }

    // 턴 인디케이터 표시
    showTurnIndicator(playerName, isPlayerTurn = true) {
        const container = document.getElementById('turn-indicator-container');

        // 기존 인디케이터 제거
        const existing = container.querySelector('.turn-indicator');
        if (existing) {
            existing.remove();
        }

        // 새 턴 인디케이터 생성
        const indicator = document.createElement('div');
        indicator.className = 'turn-indicator';

        if (isPlayerTurn) {
            // 플레이어 턴의 경우 플레이어 이름을 포함한 템플릿 사용
            const playerTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.player_turn_template') || '{name}의 턴';
            const turnText = playerTurnTemplate.replace('{name}', playerName);
            indicator.textContent = turnText;
            indicator.style.color = '#2ECC71';
        } else {
            // 적 턴의 경우 적 이름을 포함한 템플릿 사용
            const enemyTurnTemplate = I18nHelper.getText('auto_battle_card_game.ui.enemy_turn_template') || '{name}의 턴';
            const turnText = enemyTurnTemplate.replace('{name}', playerName);
            indicator.textContent = turnText;
            indicator.style.color = '#E74C3C';
        }

        container.appendChild(indicator);

        // 자동 제거
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 2000);
    }

    // 전체 플레이어 정보 업데이트 (통합 메서드)
    updatePlayerInfo(player, enemy) {
        // HP 업데이트
        this.updateHP(player, true);
        this.updateHP(enemy, false);

        // 이름 업데이트
        this.updateNames(player, enemy);

        // 방어력 업데이트
        this.updateDefense(player, true);
        this.updateDefense(enemy, false);

        // 상태이상 업데이트
        this.updateStatusEffects(player, true);
        this.updateStatusEffects(enemy, false);
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
    }

    hide() {
        this.playerHPBar.style.display = 'none';
        this.enemyHPBar.style.display = 'none';
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
            this.playerDefenseNumber.classList.add('hidden');
            this.playerThornsInfo.classList.add('hidden');
        }
        if (this.enemyDefenseOverlay) {
            this.enemyDefenseOverlay.style.width = '0%';
            this.enemyDefenseOverlay.classList.remove('max-defense');
            this.enemyDefenseNumber.classList.add('hidden');
            this.enemyThornsInfo.classList.add('hidden');
        }

        // 상태이상 클리어
        this.playerStatus.innerHTML = '';
        this.enemyStatus.innerHTML = '';

        // 색상 리셋
        this.playerFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
        this.enemyFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
    }
}

// 전역 객체로 등록
window.HPBarSystem = HPBarSystem;