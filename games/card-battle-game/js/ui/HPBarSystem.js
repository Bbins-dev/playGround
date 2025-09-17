// HP 바 시스템 관리

class HPBarSystem {
    constructor() {
        // HP 바 요소들
        this.playerHPBar = document.getElementById('player-hp-bar');
        this.enemyHPBar = document.getElementById('enemy-hp-bar');

        // HP 바 내부 요소들
        this.playerFill = this.playerHPBar.querySelector('.hp-bar-fill');
        this.playerNumber = this.playerHPBar.querySelector('.hp-number');
        this.playerStatus = document.getElementById('player-status-effects');

        this.enemyFill = this.enemyHPBar.querySelector('.hp-bar-fill');
        this.enemyNumber = this.enemyHPBar.querySelector('.hp-number');
        this.enemyStatus = document.getElementById('enemy-status-effects');

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

    // 상태이상 표시 업데이트
    updateStatusEffects(player, isPlayer = true) {
        const statusContainer = isPlayer ? this.playerStatus : this.enemyStatus;

        // 기존 상태이상 클리어
        statusContainer.innerHTML = '';

        // 새 상태이상들 추가
        player.statusEffects.forEach(effect => {
            const statusConfig = GameConfig.statusEffects[effect.type];
            if (!statusConfig) return;

            const statusElement = document.createElement('div');
            statusElement.className = 'status-icon';
            statusElement.innerHTML = `
                <span class="icon">${statusConfig.emoji}</span>
                <span class="name">${statusConfig.name}</span>
            `;

            // 상태이상별 색상 적용
            statusElement.style.borderColor = statusConfig.color;
            statusElement.style.background = statusConfig.color + '33'; // 투명도 추가

            statusContainer.appendChild(statusElement);
        });
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
            indicator.textContent = '나의 턴';
            indicator.style.color = '#2ECC71';
        } else {
            indicator.textContent = `${playerName}의 턴`;
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

    // 대미지 숫자 표시
    showDamageNumber(amount, position, type = 'damage') {
        const container = document.getElementById('numbers-container');

        const numberElement = document.createElement('div');
        numberElement.className = `damage-number ${type}-number`;
        numberElement.textContent = type === 'damage' ? `-${amount}` : `+${amount}`;

        // 위치 설정
        numberElement.style.left = position.x + 'px';
        numberElement.style.top = position.y + 'px';

        container.appendChild(numberElement);

        // 애니메이션 완료 후 제거
        setTimeout(() => {
            if (numberElement.parentNode) {
                numberElement.remove();
            }
        }, 1000);
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
        // HP 바를 100%로 리셋
        this.playerFill.style.width = '100%';
        this.enemyFill.style.width = '100%';

        // 숫자 리셋
        this.playerNumber.textContent = '100/100';
        this.enemyNumber.textContent = '100/100';

        // 상태이상 클리어
        this.playerStatus.innerHTML = '';
        this.enemyStatus.innerHTML = '';

        // 색상 리셋
        this.playerFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
        this.enemyFill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
    }

    // 플레이어/적 정보 표시 업데이트
    updatePlayerInfo(player, enemy) {
        // 플레이어 업데이트
        this.updateHP(player, true);
        this.updateStatusEffects(player, true);

        // 적 업데이트
        this.updateHP(enemy, false);
        this.updateStatusEffects(enemy, false);

        // 적 이름 업데이트 (HP 바 라벨)
        const enemyLabel = this.enemyHPBar.querySelector('.hp-label');
        if (enemyLabel && enemy.name) {
            enemyLabel.textContent = enemy.name;
        }
    }
}

// 전역 객체로 등록
window.HPBarSystem = HPBarSystem;