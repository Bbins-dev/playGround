// 전투 시스템 - 턴 기반 자동 전투 관리

class BattleSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 전투 상태
        this.player = null;
        this.enemy = null;
        this.currentTurn = 'player'; // 'player' | 'enemy'
        this.battlePhase = 'waiting'; // 'waiting' | 'cardActivation' | 'turnTransition' | 'ended'

        // 시스템들
        this.hpBarSystem = null;
        this.effectSystem = null;

        // 턴 진행 상태
        this.turnProgress = {
            currentPlayer: null,
            currentCardIndex: 0,
            cardsActivated: 0,
            turnNumber: 0
        };

        // 게임 속도
        this.gameSpeed = 1;

        // 전투 통계
        this.battleStats = {
            totalTurns: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            cardsActivated: 0
        };
    }

    // 전투 시작
    startBattle(player, enemy) {
        console.log('⚔️ 전투 시작:', player.name, 'vs', enemy.name);

        this.player = player;
        this.enemy = enemy;
        this.currentTurn = 'player';
        this.battlePhase = 'waiting';

        // 시스템 초기화
        this.initializeSystems();

        // 첫 턴 시작
        this.startTurn();
    }

    // 시스템들 초기화
    initializeSystems() {
        if (!this.hpBarSystem) {
            this.hpBarSystem = new HPBarSystem();
        }

        if (!this.effectSystem) {
            this.effectSystem = new EffectSystem();
        }

        // HP 바 표시
        this.hpBarSystem.show();
        this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);
    }

    // 턴 시작
    async startTurn() {
        const currentPlayer = this.currentTurn === 'player' ? this.player : this.enemy;
        const isPlayerTurn = this.currentTurn === 'player';

        console.log(`🎯 ${currentPlayer.name}의 턴 시작`);

        this.battlePhase = 'turnTransition';
        this.turnProgress.currentPlayer = currentPlayer;
        this.turnProgress.currentCardIndex = 0;
        this.turnProgress.cardsActivated = 0;

        // 턴 시작 처리
        currentPlayer.startTurn();

        // 마비 상태 체크
        if (currentPlayer.hasStatusEffect('paralysis')) {
            const paralysisChance = currentPlayer.statusEffects.find(e => e.type === 'paralysis').power;
            if (Math.random() * 100 < paralysisChance) {
                console.log(`⚡ ${currentPlayer.name}이(가) 마비로 턴을 넘김`);

                // 마비 효과 표시
                const position = isPlayerTurn ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();

                this.effectSystem.showStatusEffect('debuff', position, 0);

                // 턴 종료
                this.endTurn();
                return;
            }
        }

        // 턴 인디케이터 표시
        this.hpBarSystem.showTurnIndicator(currentPlayer.name, isPlayerTurn);

        // 잠시 대기 후 카드 발동 시작
        await this.wait(1000);

        this.battlePhase = 'cardActivation';
        await this.activateCards();
    }

    // 카드 순차 발동
    async activateCards() {
        const currentPlayer = this.turnProgress.currentPlayer;
        const activatableCards = currentPlayer.getActivatableCards();

        if (activatableCards.length === 0) {
            console.log(`${currentPlayer.name}의 발동 가능한 카드가 없음`);
            this.endTurn();
            return;
        }

        console.log(`🃏 ${currentPlayer.name}의 카드 발동 시작 (${activatableCards.length}장)`);

        // 카드를 순차적으로 발동
        for (let i = 0; i < activatableCards.length; i++) {
            if (this.battlePhase !== 'cardActivation') break;

            const card = activatableCards[i];
            await this.activateCard(card, currentPlayer);

            // 전투가 종료되었으면 중단
            if (this.battlePhase === 'ended') {
                return;
            }

            this.turnProgress.cardsActivated++;

            // 다음 카드 발동 전 잠시 대기
            if (i < activatableCards.length - 1) {
                await this.wait(500 / this.gameSpeed);
            }
        }

        // 모든 카드 발동 완료
        this.endTurn();
    }

    // 개별 카드 발동
    async activateCard(card, user) {
        const target = user === this.player ? this.enemy : this.player;
        const isPlayerCard = user === this.player;

        console.log(`🎴 ${user.name}이(가) ${card.name} 발동`);

        // 카드 발동 애니메이션
        const cardDuration = GameConfig.utils.applyGameSpeed(
            GameConfig.animations.cardActivation,
            this.gameSpeed
        );

        await this.effectSystem.showCardActivation(card, cardDuration);

        // 카드 효과 실행
        const result = card.activate(user, target, this);

        if (result.success) {
            // 성공 로그
            console.log(`✅ ${card.name} 성공: ${result.message}`);

            // 효과별 후처리
            await this.processCardResult(result, card, user, target);
        } else {
            // 실패 (빗나감)
            console.log(`❌ ${card.name} 실패: ${result.message}`);

            const targetPosition = isPlayerCard ?
                this.effectSystem.getEnemyPosition() :
                this.effectSystem.getPlayerPosition();

            // 빗나감 표시
            this.effectSystem.showDamageNumber(0, targetPosition, 'miss');
        }

        this.battleStats.cardsActivated++;
    }

    // 카드 결과 처리
    async processCardResult(result, card, user, target) {
        const isPlayerCard = user === this.player;
        const targetPosition = isPlayerCard ?
            this.effectSystem.getEnemyPosition() :
            this.effectSystem.getPlayerPosition();

        // 카드 타입별 처리
        switch (card.type) {
            case 'attack':
                await this.processAttackResult(result, card, target, targetPosition);
                break;

            case 'heal':
                await this.processHealResult(result, user, targetPosition);
                break;

            case 'buff':
                await this.processBuffResult(result, user, targetPosition);
                break;

            case 'debuff':
                await this.processDebuffResult(result, target, targetPosition);
                break;

            case 'status':
                await this.processStatusResult(result, target, targetPosition);
                break;

            default:
                console.log('알 수 없는 카드 타입:', card.type);
        }

        // HP 바 업데이트
        this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);

        // 전투 종료 체크
        this.checkBattleEnd();
    }

    // 공격 결과 처리
    async processAttackResult(result, card, target, targetPosition) {
        const damage = result.damage || 0;

        if (damage > 0) {
            // 피격 효과
            await this.effectSystem.showHitEffect(targetPosition, card.element, damage);

            // 통계 업데이트
            if (target === this.enemy) {
                this.battleStats.totalDamageDealt += damage;
            } else {
                this.battleStats.totalDamageReceived += damage;
            }
        }
    }

    // 회복 결과 처리
    async processHealResult(result, user, targetPosition) {
        const healing = result.healing || 0;

        if (healing > 0) {
            this.effectSystem.showStatusEffect('heal', targetPosition, healing);
        }
    }

    // 버프 결과 처리
    async processBuffResult(result, user, targetPosition) {
        this.effectSystem.showStatusEffect('buff', targetPosition, result.power || 0);
    }

    // 디버프 결과 처리
    async processDebuffResult(result, target, targetPosition) {
        this.effectSystem.showStatusEffect('debuff', targetPosition, result.power || 0);
    }

    // 상태이상 결과 처리
    async processStatusResult(result, target, targetPosition) {
        // 상태이상별 효과 표시
        const statusType = result.statusType;
        if (statusType) {
            this.effectSystem.showStatusEffect('debuff', targetPosition, 0);
        }
    }

    // 대미지 계산 및 적용
    dealDamage(target, damage) {
        const actualDamage = target.takeDamage(damage);
        console.log(`💥 ${target.name}이(가) ${actualDamage} 대미지를 받음`);
        return actualDamage;
    }

    // 회복 적용
    healTarget(target, amount) {
        const actualHealing = target.heal(amount);
        console.log(`💚 ${target.name}이(가) ${actualHealing} 회복`);
        return actualHealing;
    }

    // 턴 종료
    endTurn() {
        const currentPlayer = this.turnProgress.currentPlayer;

        console.log(`🏁 ${currentPlayer.name}의 턴 종료`);

        // 턴 종료 처리
        currentPlayer.endTurn();

        // 턴 전환
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
        this.battleStats.totalTurns++;

        // 전투 종료 체크
        if (!this.checkBattleEnd()) {
            // 다음 턴 시작
            setTimeout(() => {
                this.startTurn();
            }, 1000 / this.gameSpeed);
        }
    }

    // 전투 종료 체크
    checkBattleEnd() {
        if (this.player.isDead()) {
            this.endBattle(this.enemy);
            return true;
        }

        if (this.enemy.isDead()) {
            this.endBattle(this.player);
            return true;
        }

        return false;
    }

    // 전투 종료
    endBattle(winner) {
        console.log(`🏆 전투 종료 - 승자: ${winner.name}`);

        this.battlePhase = 'ended';

        // 전투 통계 로그
        console.log('📊 전투 통계:', this.battleStats);

        // 게임 매니저에 결과 전달
        if (this.gameManager) {
            this.gameManager.endBattle(winner);
        }
    }

    // 업데이트 (게임 루프에서 호출)
    update(deltaTime) {
        // 현재는 턴 기반이므로 특별한 업데이트 없음
        // 추후 애니메이션 동기화 등에 사용 가능
    }

    // 게임 속도 설정
    setGameSpeed(speed) {
        this.gameSpeed = speed;
        console.log(`⚡ 게임 속도: ${speed}x`);
    }

    // 전투 정리
    cleanup() {
        if (this.hpBarSystem) {
            this.hpBarSystem.hide();
        }

        if (this.effectSystem) {
            this.effectSystem.clearAllEffects();
        }

        this.battlePhase = 'waiting';
        this.player = null;
        this.enemy = null;
    }

    // 유틸리티: 대기
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 전투 통계 가져오기
    getBattleStats() {
        return { ...this.battleStats };
    }

    // 현재 전투 상태 정보
    getBattleInfo() {
        return {
            phase: this.battlePhase,
            currentTurn: this.currentTurn,
            turnProgress: { ...this.turnProgress },
            stats: this.getBattleStats()
        };
    }
}

// 전역 객체로 등록
window.BattleSystem = BattleSystem;