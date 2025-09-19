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

        // 턴 스킵 플래그
        this.turnSkip = false;

        // 일시정지 상태
        this.isPaused = false;

        // 전투 통계
        this.battleStats = {
            totalTurns: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            cardsActivated: 0
        };

        // TimerManager 사용으로 교체
        this.timerManager = TimerManager;
    }

    // 전투 시작
    startBattle(player, enemy) {

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
            this.endTurn();
            return;
        }


        // 카드를 순차적으로 발동
        for (let i = 0; i < activatableCards.length; i++) {
            if (this.battlePhase !== 'cardActivation') break;

            const card = activatableCards[i];

            // 카드의 activationCount만큼 반복 발동
            while (card.canActivate() && this.battlePhase === 'cardActivation') {
                await this.activateCard(card, currentPlayer);

                // 턴 스킵 체크 (웅크리기 등)
                if (this.checkTurnSkip()) {
                    break; // 즉시 턴 종료
                }

                // 전투가 종료되었으면 중단
                if (this.battlePhase === 'ended') {
                    return;
                }

                // 같은 카드의 연속 발동 간 짧은 딜레이
                if (card.canActivate()) {
                    await this.wait(300 / this.gameSpeed);
                }
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

            // 효과별 후처리
            await this.processCardResult(result, card, user, target);
        } else {
            // 실패 (빗나감)

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
        } else if (damage === 0) {
            // 0 데미지 표시 (방어력으로 무효화된 경우 등)
            this.effectSystem.showDamageNumber(0, targetPosition, 'zero');
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
        return actualDamage;
    }

    // 회복 적용
    healTarget(target, amount) {
        const actualHealing = target.heal(amount);
        return actualHealing;
    }

    // 턴 종료
    endTurn() {
        const currentPlayer = this.turnProgress.currentPlayer;


        // 턴 종료 처리
        currentPlayer.endTurn();

        // 턴 전환
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
        this.battleStats.totalTurns++;

        // 전투 종료 체크
        if (!this.checkBattleEnd()) {
            // 다음 턴 시작 (TimerManager 사용)
            const checkAndStartTurn = () => {
                // 일시정지 중이면 다시 체크
                if (this.isPaused) {
                    this.timerManager.setTimeout(checkAndStartTurn, 100, 'pause-check');
                    return;
                }

                // 전투가 아직 진행 중인 경우에만 다음 턴 시작
                if (this.battlePhase !== 'ended') {
                    this.startTurn();
                }
            };

            this.timerManager.setTimeout(checkAndStartTurn, GameConfig.timing.battle.pauseDelay / this.gameSpeed, 'turn-transition');
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

        this.battlePhase = 'ended';


        // 게임 매니저에 결과 전달
        if (this.gameManager) {
            this.gameManager.endBattle(winner);
        }
    }

    // 업데이트 (게임 루프에서 호출)
    update(deltaTime) {
        // 일시정지 상태에서는 업데이트하지 않음
        if (this.isPaused) {
            return;
        }

        // 현재는 턴 기반이므로 특별한 업데이트 없음
        // 추후 애니메이션 동기화 등에 사용 가능
    }

    // 게임 속도 설정
    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }

    // 전투 일시정지
    pause() {
        this.isPaused = true;
    }

    // 전투 재개
    resume() {
        this.isPaused = false;
    }

    // 일시정지 상태 체크
    isPausedState() {
        return this.isPaused;
    }

    // 전투 정리 (강화된 타이머 정리 포함)
    cleanup() {
        // 전투 상태를 먼저 끝남으로 설정하여 새로운 타이머 생성 방지
        this.battlePhase = 'ended';

        // 모든 활성 타이머 정리
        this.activeTimers.forEach(timerId => {
            clearTimeout(timerId);
        });
        this.activeTimers = [];

        // AbortController가 있다면 신호 전송
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // UI 시스템 정리
        if (this.hpBarSystem) {
            this.hpBarSystem.hide();
        }

        if (this.effectSystem) {
            this.effectSystem.clearAllEffects();
        }

        // 전투 상태 초기화
        this.battlePhase = 'waiting';
        this.player = null;
        this.enemy = null;
    }

    // 대미지 처리 (방어력과 가시 대미지 포함)
    dealDamage(target, amount, attacker = null) {
        const actualDamage = target.takeDamage(amount, attacker);

        // 전투 통계 업데이트
        if (attacker === this.player) {
            this.battleStats.totalDamageDealt += actualDamage;
        } else if (attacker === this.enemy) {
            this.battleStats.totalDamageReceived += actualDamage;
        }

        // HP 바 업데이트
        if (this.hpBarSystem) {
            this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);
        }

        return actualDamage;
    }

    // 턴 스킵 설정
    setTurnSkip(skip) {
        this.turnSkip = skip;
    }

    // 턴 스킵 확인 및 처리
    checkTurnSkip() {
        if (this.turnSkip) {
            this.turnSkip = false;
            return true;
        }
        return false;
    }

    // 유틸리티: 대기 (개선된 타이머 추적 버전)
    wait(ms) {
        return new Promise(resolve => {
            // 전투가 이미 종료되었으면 즉시 resolve
            if (this.battlePhase === 'ended') {
                resolve();
                return;
            }

            const checkAndResolve = () => {
                // 일시정지 중이면 다시 체크
                if (this.isPaused) {
                    const timerId = setTimeout(checkAndResolve, 100);
                    this.activeTimers.push(timerId);
                    return;
                }

                // 타이머 완료 후 배열에서 제거
                resolve();
            };

            const timerId = setTimeout(() => {
                this.activeTimers = this.activeTimers.filter(id => id !== timerId);
                checkAndResolve();
            }, ms);

            // 활성 타이머 목록에 추가
            this.activeTimers.push(timerId);
        });
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