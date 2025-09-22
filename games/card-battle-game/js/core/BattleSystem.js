// 전투 시스템 - 턴 기반 자동 전투 관리

class BattleSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 전투 상태
        this.player = null;
        this.enemy = null;
        this.currentTurn = 'player'; // 'player' | 'enemy'
        this.displayTurn = 'player'; // 화면에 표시되는 턴 (배경색 등 UI용)
        this.battlePhase = 'waiting'; // 'waiting' | 'cardActivation' | 'turnTransition' | 'ended'

        // 시스템들 (GameManager의 인스턴스 참조)
        this.hpBarSystem = gameManager.hpBarSystem;
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
        this.timerManager = window.TimerManager;

        // 활성 타이머 배열 초기화
        this.activeTimers = [];
    }

    // 전투 시작
    startBattle(player, enemy) {

        this.player = player;
        this.enemy = enemy;
        this.currentTurn = 'player';
        this.displayTurn = 'player';
        this.battlePhase = 'waiting';

        // 시스템 초기화
        this.initializeSystems();

        // 첫 턴 시작
        this.startTurn();
    }

    // 시스템들 초기화
    initializeSystems() {
        // HPBarSystem은 GameManager에서 이미 생성된 인스턴스 사용
        if (!this.hpBarSystem) {
            console.error('BattleSystem: HPBarSystem이 GameManager에서 초기화되지 않았습니다');
            return;
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
        // 화면 표시용 턴을 실제 턴과 동기화 (배경색 변경 시점)
        this.displayTurn = this.currentTurn;

        const currentPlayer = this.currentTurn === 'player' ? this.player : this.enemy;
        const isPlayerTurn = this.currentTurn === 'player';


        this.battlePhase = 'turnTransition';
        this.turnProgress.currentPlayer = currentPlayer;
        this.turnProgress.currentCardIndex = 0;
        this.turnProgress.cardsActivated = 0;

        // 턴 시작 처리
        currentPlayer.startTurn();

        // 방어력 초기화 처리 (플레이어와 적 모두)
        if (currentPlayer.defense > 0) {
            // 방어력 감소 애니메이션 실행
            await this.hpBarSystem.animateDefenseDecrease(currentPlayer, isPlayerTurn);

            // 실제 방어력 초기화
            currentPlayer.resetDefense();
        }

        // 기절 상태 체크
        if (currentPlayer.hasStatusEffect('stun')) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 기절 효과 표시
            this.effectSystem.showDamageNumber(0, position, 'stun');

            // 기절 해제
            currentPlayer.removeStatusEffect('stun');
            this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

            // 턴 종료
            this.endTurn();
            return;
        }

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

        // 플레이어 카드 사용 시 통계 수집
        if (isPlayerCard) {
            this.gameManager.updateStatsOnCardUse(card);
        }

        if (result.success) {
            // 성공 로그

            // 효과별 후처리
            await this.processCardResult(result, card, user, target);
        } else {
            // 실패 (빗나감)
            if (isPlayerCard) {
                this.gameManager.updateStatsOnMiss();
            }

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

            case 'defense':
                // 방어력은 자신에게 적용되므로 user 위치 사용
                const userPosition = isPlayerCard ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();
                await this.processDefenseResult(result, user, userPosition);
                break;

            default:
        }

        // HP 바 업데이트 (애니메이션 완료 대기)
        await this.updateHPWithAnimation();

        // 전투 종료 체크
        this.checkBattleEnd();
    }

    // 공격 결과 처리
    async processAttackResult(result, card, target, targetPosition) {
        const damage = result.damage || 0;

        if (damage > 0) {
            // 실제 대미지 적용
            const actualDamage = target.takeDamage(damage);

            // 피격 효과
            await this.effectSystem.showHitEffect(targetPosition, card.element, damage);

            // 통계 업데이트
            if (target === this.enemy) {
                this.battleStats.totalDamageDealt += actualDamage;
            } else {
                this.battleStats.totalDamageReceived += actualDamage;
            }
        } else if (damage === 0) {
            // 0 데미지 표시 (방어력으로 무효화된 경우 등)
            this.effectSystem.showDamageNumber(0, targetPosition, 'zero');
        }

        // 기절 처리
        if (result.stunned) {
            this.effectSystem.showDamageNumber(0, targetPosition, 'stun');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
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
        // 방어력 획득인지 확인
        if (result.defenseGain) {
            this.effectSystem.showDamageNumber(result.defenseGain, targetPosition, 'defense-gain');
        }

        // 기타 버프 효과
        if (result.power && result.power > 0) {
            this.effectSystem.showStatusEffect('buff', targetPosition, result.power);
        }
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
            if (statusType === 'taunt') {
                this.effectSystem.showDamageNumber(0, targetPosition, 'taunt');

                // 상태이상 UI 즉시 업데이트
                const isTargetPlayer = target === this.player;
                this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
            } else {
                this.effectSystem.showStatusEffect('debuff', targetPosition, 0);
            }
        }
    }

    // 방어 결과 처리
    async processDefenseResult(result, user, userPosition) {
        const defenseGain = result.defenseGain || 0;
        const selfDamage = result.selfDamage || 0;

        if (defenseGain > 0) {
            // 방어력 숫자 연출 표시 (방어력 획득한 주체 위치에)
            this.effectSystem.showDamageNumber(defenseGain, userPosition, 'defense-gain');

            // 방어력 관련 통계 업데이트
            this.battleStats.defenseBuilt += defenseGain;
        }

        // 자가 대미지가 있는 경우 대미지 이펙트 표시
        if (selfDamage > 0) {
            await this.effectSystem.showHitEffect(userPosition, result.element, selfDamage);
        }
    }

    // 대미지 계산 및 적용
    dealDamage(target, damage) {
        const actualDamage = target.takeDamage(damage);

        // 플레이어가 데미지를 가했는지 받았는지 확인
        if (target === this.enemy) {
            // 플레이어가 적에게 데미지
            this.gameManager.updateStatsOnDamage(actualDamage);
        } else if (target === this.player) {
            // 플레이어가 데미지를 받음
            this.gameManager.updateStatsOnPlayerDamage(actualDamage);
        }

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


        // 상태이상 해제 (턴 종료 시)
        currentPlayer.removeStatusEffect('taunt');
        currentPlayer.removeStatusEffect('stun'); // 안전장치

        // 상태이상 UI 업데이트
        const isPlayerTurn = currentPlayer === this.player;
        this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

        // 턴 종료 처리
        currentPlayer.endTurn();

        // 턴 전환
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
        this.battleStats.totalTurns++;

        // 플레이어 턴이 끝났을 때 통계 업데이트
        if (currentPlayer === this.player) {
            this.gameManager.updateStatsOnTurn();
        }

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
        if (this.activeTimers && Array.isArray(this.activeTimers)) {
            this.activeTimers.forEach(timerId => {
                clearTimeout(timerId);
            });
        }
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

    // HP 업데이트 애니메이션 처리 (새 메서드 추가)
    async updateHPWithAnimation() {
        // 플레이어와 적의 HP 업데이트를 병렬로 실행
        await Promise.all([
            this.hpBarSystem.updateHP(this.player, true),
            this.hpBarSystem.updateHP(this.enemy, false)
        ]);

        // 방어력 업데이트도 애니메이션 완료까지 대기
        await Promise.all([
            this.hpBarSystem.updateDefense(this.player, true),
            this.hpBarSystem.updateDefense(this.enemy, false)
        ]);

        // 상태이상과 이름은 즉시 업데이트
        this.hpBarSystem.updateStatusEffects(this.player, true);
        this.hpBarSystem.updateStatusEffects(this.enemy, false);
        this.hpBarSystem.updateNames(this.player, this.enemy);
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