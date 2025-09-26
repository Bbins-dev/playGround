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

        // 현재 발동 중인 카드 추적
        this.activatingCard = null;

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
    async startBattle(player, enemy) {

        this.player = player;
        this.enemy = enemy;
        this.currentTurn = 'player';
        this.displayTurn = 'player';
        this.battlePhase = 'waiting';

        // 시스템 초기화
        await this.initializeSystems();

        // 첫 턴 시작
        this.startTurn();
    }

    // 시스템들 초기화
    async initializeSystems() {
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

        // 적 이름 즉시 표시
        this.hpBarSystem.updateNames(this.player, this.enemy);

        // 기존 방식으로 플레이어 정보 업데이트
        await this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);
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

        // 턴 통계 업데이트 (플레이어 턴만)
        if (isPlayerTurn) {
            this.gameManager.updateStatsOnTurn();
        }

        // 1. 먼저 방어력 초기화 처리 (플레이어와 적 모두)
        if (currentPlayer.defense > 0) {
            // 방어력 감소 애니메이션 실행
            await this.hpBarSystem.animateDefenseDecrease(currentPlayer, isPlayerTurn);

            // 실제 방어력 초기화
            currentPlayer.resetDefense();
        }

        // 2. 그 다음 화상 데미지 처리 (방어력 초기화 후)
        const burnDamageApplied = await this.processBurnDamage(currentPlayer, isPlayerTurn);

        // 화상 데미지 후 즉시 사망 체크
        if (burnDamageApplied && currentPlayer.isDead()) {
            // 화상 데미지로 사망했을 경우 즉시 전투 종료
            this.checkBattleEnd();
            return;
        }

        // 3. 마지막으로 턴 시작 처리 (화상 처리 제외)
        currentPlayer.startTurn();

        // 스테이지 회복 애니메이션 (플레이어 턴 시작 시만)
        if (isPlayerTurn && this.gameManager.stageHealingAmount > 0) {
            const playerPosition = this.effectSystem.getPlayerPosition();
            this.effectSystem.showDamageNumber(
                this.gameManager.stageHealingAmount,
                playerPosition,
                'heal'
            );

            // HP바 업데이트
            this.hpBarSystem.updateHP(this.player, true);

            // 회복량 초기화 (다음 턴에는 표시하지 않도록)
            this.gameManager.stageHealingAmount = 0;

            // 회복 애니메이션을 위한 잠시 대기
            await this.wait(800);
        }

        // 기절 상태 체크
        if (currentPlayer.hasStatusEffect('stun')) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 기절 효과 표시 (읽기 시간 포함)
            await this.effectSystem.showEffectMessage('stun', position, 'status_applied');

            // 기절 해제
            currentPlayer.removeStatusEffect('stun');
            this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

            // 턴 종료
            await this.endTurn();
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
                await this.endTurn();
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
            await this.endTurn();
            return;
        }

        // 카드 발동 순서 정렬 (GameConfig 기반)
        const sortedCards = this.sortCardsByActivationOrder(activatableCards, currentPlayer === this.enemy);

        // 카드를 순차적으로 발동
        for (let i = 0; i < sortedCards.length; i++) {
            if (this.battlePhase !== 'cardActivation') break;

            const card = sortedCards[i];
            let turnSkipped = false;

            // 카드의 activationCount만큼 반복 발동
            while (card.canActivate() && this.battlePhase === 'cardActivation') {
                await this.activateCard(card, currentPlayer);

                // 턴 스킵 체크 (웅크리기 등)
                if (this.checkTurnSkip()) {
                    turnSkipped = true;
                    break; // 현재 카드 발동 중단
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

            // 턴 스킵이 설정되었으면 전체 턴 종료
            if (turnSkipped) {
                break; // 전체 카드 루프 중단
            }

            // 다음 카드 발동 전 잠시 대기
            if (i < activatableCards.length - 1) {
                await this.wait(GameConfig.animations.cardInterval / this.gameSpeed);
            }
        }

        // 모든 카드 발동 완료
        await this.endTurn();
    }

    // 개별 카드 발동
    async activateCard(card, user) {
        const target = user === this.player ? this.enemy : this.player;
        const isPlayerCard = user === this.player;

        // 현재 발동 중인 카드 설정
        this.activatingCard = card;

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

        // 카드 발동 완료 - 현재 발동 중인 카드 초기화
        this.activatingCard = null;
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

            case 'special':
                await this.processSpecialResult(result, user, targetPosition);
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

            // 피격 효과 (속성 상성 정보 포함)
            const effectiveness = result.effectiveness || 1.0;
            await this.effectSystem.showHitEffect(targetPosition, card.element, damage, effectiveness);

            // 통계 업데이트 (기존 BattleSystem 통계)
            if (target === this.enemy) {
                this.battleStats.totalDamageDealt += actualDamage;
            } else {
                this.battleStats.totalDamageReceived += actualDamage;
            }

            // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
            if (this.gameManager && this.gameManager.recordDamage) {
                const source = target === this.enemy ? 'player' : 'enemy';
                const targetType = target === this.enemy ? 'enemy' : 'player';
                this.gameManager.recordDamage(source, targetType, damage, 'normal');
            }
        } else if (damage === 0) {
            // 0 데미지 표시 (방어력으로 무효화된 경우 등)
            this.effectSystem.showDamageNumber(0, targetPosition, 'zero');
        }

        // 기절 처리
        if (result.stunned) {
            await this.effectSystem.showEffectMessage('stun', targetPosition, 'status_applied');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
        }

        // 중독 처리
        if (result.poisoned) {
            await this.effectSystem.showEffectMessage('poisoned', targetPosition, 'status_applied');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
        }

        // 다른 상태이상 처리 (일반적인 statusType 지원)
        if (result.statusType && result.statusType !== 'stun' && result.statusType !== 'poisoned') {
            await this.effectSystem.showEffectMessage(result.statusType, targetPosition, 'status_applied');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
        }

        // 자해 대미지 처리 (공격 카드의 경우)
        const selfDamage = result.selfDamage || 0;
        if (selfDamage > 0) {
            // 공격을 한 사용자의 위치 계산 (target 반대)
            const attackerPosition = target === this.player ?
                this.effectSystem.getEnemyPosition() :
                this.effectSystem.getPlayerPosition();

            // 실제 자해 대미지 적용
            const attacker = target === this.player ? this.enemy : this.player;
            const actualSelfDamage = attacker.takeDamage(selfDamage);

            // GameManager 중앙 통계 시스템 업데이트 (자해 대미지)
            if (target === this.enemy && this.gameManager && this.gameManager.recordDamage) {
                // 플레이어가 적을 공격했다면 플레이어가 자해를 받음
                this.gameManager.recordDamage('self', 'player', selfDamage, 'self');
            } else if (target === this.player && this.gameManager && this.gameManager.recordDamage) {
                // 적이 플레이어를 공격했다면 적이 자해를 받음 (적의 통계는 추적하지 않음)
                // 현재는 플레이어 통계만 추적하므로 별도 처리 없음
            }

            await this.showSelfDamageEffect(attackerPosition, selfDamage);
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
            await this.effectSystem.showDefenseGainMessage(targetPosition, result.defenseGain);
        }

        // 기타 버프 효과 - 현재 사용되지 않음 (모든 버프는 개별 처리됨)
    }

    // 디버프 결과 처리
    async processDebuffResult(result, target, targetPosition) {
        this.effectSystem.showStatusEffect('debuff', targetPosition, result.power || 0);
    }

    // 상태이상 결과 처리
    async processStatusResult(result, target, targetPosition) {
        // 중복 상태이상 체크 (이미 걸린 상태)
        if (result.duplicate) {
            // 어떤 상태이상 타입이든 템플릿 기반으로 처리
            const statusType = result.statusType || this.extractStatusTypeFromMessage(result.messageKey);
            if (statusType) {
                await this.effectSystem.showEffectMessage(statusType, targetPosition, 'already_status');
            }
            return; // 중복 상태면 추가 처리 중단
        }

        // 상태이상별 효과 표시
        const statusType = result.statusType;
        if (statusType) {
            // 템플릿 기반으로 상태이상 적용 메시지 표시
            await this.effectSystem.showEffectMessage(statusType, targetPosition, 'status_applied');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);
        }
    }

    // messageKey에서 상태이상 타입 추출 (helper 메서드)
    extractStatusTypeFromMessage(messageKey) {
        if (!messageKey) return null;

        if (messageKey.includes('taunt')) return 'taunt';
        if (messageKey.includes('stun')) return 'stun';
        // 필요 시 다른 상태이상 타입들 추가

        return null;
    }

    // 방어 결과 처리
    async processDefenseResult(result, user, userPosition) {
        const defenseGain = result.defenseGain || 0;
        const selfDamage = result.selfDamage || 0;

        if (defenseGain > 0) {
            // 방어력 숫자 연출 표시 (템플릿 기반)
            await this.effectSystem.showDefenseGainMessage(userPosition, defenseGain);

            // 방어력 관련 통계 업데이트
            this.battleStats.defenseBuilt += defenseGain;

            // 게임 매니저 통계 업데이트 (플레이어만)
            if (user === this.player) {
                this.gameManager.updateStatsOnDefense(defenseGain);
            }
        }

        // 힘 버프 획득 처리 (가시갑옷 카드 등)
        if (result.strengthGain && result.strengthGain > 0) {
            await this.effectSystem.showEffectMessage('strength', userPosition, 'buff_gained', result.strengthGain);
        }

        // 자가 대미지가 있는 경우 대미지 이펙트 표시
        if (selfDamage > 0) {
            // 실제 자해 대미지 적용
            const actualSelfDamage = user.takeDamage(selfDamage);

            // GameManager 중앙 통계 시스템 업데이트 (자해 대미지)
            if (user === this.player && this.gameManager && this.gameManager.recordDamage) {
                this.gameManager.recordDamage('self', 'player', selfDamage, 'self');
            }

            await this.showSelfDamageEffect(userPosition, selfDamage);
        }
    }

    // 자해 대미지 이펙트 표시 (템플릿 기반)
    async showSelfDamageEffect(position, selfDamage) {
        // 템플릿 기반 자해 대미지 숫자 표시
        let template = I18nHelper.getText('auto_battle_card_game.ui.templates.self_damage');
        if (!template) {
            template = '-{value}'; // fallback
        }

        const message = template.replace('{value}', selfDamage);
        this.effectSystem.showDamageNumber(0, position, 'self_damage', message);
    }

    // 대미지 계산 및 적용 (첫 번째 버전 - 간단한 형태)
    dealDamageSimple(target, damage) {
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
    async endTurn() {
        const currentPlayer = this.turnProgress.currentPlayer;
        const isPlayerTurn = currentPlayer === this.player;

        // 디버그: 턴 종료 처리 시작
        console.log(`[DEBUG] endTurn: ${currentPlayer.name} turn ending (isPlayer: ${isPlayerTurn})`);
        console.log(`[DEBUG] ${currentPlayer.name} status effects before:`, currentPlayer.statusEffects);

        // 1. 즉시 해제가 필요한 상태이상 제거
        currentPlayer.removeStatusEffect('taunt');
        currentPlayer.removeStatusEffect('stun'); // 안전장치

        // 2. 턴 종료 시 데미지 처리 (독 등)
        const poisonDamageApplied = await this.processPoisonDamage(currentPlayer, isPlayerTurn);

        // 3. 데미지로 인한 전투 종료 체크
        if (poisonDamageApplied && this.checkBattleEnd()) {
            return; // 독 데미지로 전투가 끝났으면 여기서 종료
        }

        // 4. 상태이상 턴수 차감 (0턴인 것 자동 제거)
        currentPlayer.endTurn();
        console.log(`[DEBUG] ${currentPlayer.name} status effects after endTurn:`, currentPlayer.statusEffects);

        // 5. UI 업데이트 (차감된 상태 반영)
        this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

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

    // 카드 발동 순서 정렬 (플레이어: 윗줄→아랫줄, 적: 아랫줄→윗줄)
    sortCardsByActivationOrder(cards, isEnemy = false) {
        if (!cards || cards.length === 0) return [];

        const layout = GameConfig.handLayout;
        const cardsPerRow = layout.cardsPerRow;

        // 카드에 원래 인덱스 정보 추가
        const cardsWithIndex = cards.map((card, index) => ({
            card,
            originalIndex: index
        }));

        // 두 줄 레이아웃에 따른 발동 순서로 정렬
        cardsWithIndex.sort((a, b) => {
            const aRow = Math.floor(a.originalIndex / cardsPerRow);
            const aCol = a.originalIndex % cardsPerRow;
            const bRow = Math.floor(b.originalIndex / cardsPerRow);
            const bCol = b.originalIndex % cardsPerRow;

            // 행 우선, 그 다음 열 순서
            if (aRow !== bRow) {
                return isEnemy ? (bRow - aRow) : (aRow - bRow); // 적: 아랫줄 먼저, 플레이어: 윗줄 먼저
            }
            return aCol - bCol; // 같은 줄에서는 왼쪽부터
        });

        // 정렬된 카드만 반환
        return cardsWithIndex.map(item => item.card);
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

        // 전투 통계 업데이트 (기존 BattleSystem 통계)
        if (attacker === this.player) {
            this.battleStats.totalDamageDealt += actualDamage;
        } else if (attacker === this.enemy) {
            this.battleStats.totalDamageReceived += actualDamage;
        }

        // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
        if (this.gameManager && this.gameManager.recordDamage) {
            // 플레이어가 적에게 준 대미지
            if (attacker === this.player && target === this.enemy) {
                this.gameManager.recordDamage('player', 'enemy', amount, 'normal');
            }
            // 플레이어가 받은 대미지
            if (target === this.player) {
                const source = attacker === this.enemy ? 'enemy' : 'unknown';
                this.gameManager.recordDamage(source, 'player', amount, 'normal');
            }
        }

        // HP 바 업데이트
        if (this.hpBarSystem) {
            this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);
        }

        return actualDamage;
    }

    // 특수 카드 결과 처리
    async processSpecialResult(result, user, targetPosition) {
        if (result.effectType === 'heal' && result.templateData) {
            const userPos = user === this.player ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 템플릿 직접 사용 (heal_effect 템플릿 활용)
            const template = I18nHelper.getText('auto_battle_card_game.ui.templates.heal_effect');
            const message = template.replace('{value}', result.templateData.value);
            this.effectSystem.showDamageNumber(0, userPos, 'effect', message);
        }
    }

    // 독 상태이상 대미지 처리
    async processPoisonDamage(player, isPlayerTurn) {
        console.log(`[DEBUG] processPoisonDamage: ${player.name} (isPlayerTurn: ${isPlayerTurn})`);
        const poisonEffect = player.statusEffects.find(e => e.type === 'poisoned');

        if (!poisonEffect) {
            console.log(`[DEBUG] No poison effect found on ${player.name}`);
            return false;
        }

        console.log(`[DEBUG] Poison effect found on ${player.name}:`, poisonEffect);
        const damage = Math.floor(player.maxHP * poisonEffect.power / 100);
        console.log(`[DEBUG] Calculated poison damage: ${damage} (${poisonEffect.power}% of ${player.maxHP})`);

        if (damage > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 독 데미지 시각적 표시 (읽기 시간 포함)
            await this.effectSystem.showDamageNumber(damage, position, 'poison');

            // 실제 대미지 적용
            const actualDamage = player.takeDamage(damage);

            // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
            if (player === this.player && this.gameManager && this.gameManager.recordDamage) {
                this.gameManager.recordDamage('status', 'player', damage, 'poison');
            }

            // HP 바 업데이트
            await this.hpBarSystem.updateHP(player, isPlayerTurn);

            return actualDamage > 0;
        }
        return false;
    }

    // 화상 상태이상 데미지 처리
    async processBurnDamage(player, isPlayerTurn) {
        console.log(`[DEBUG] processBurnDamage: ${player.name} (isPlayerTurn: ${isPlayerTurn})`);
        const burnEffect = player.statusEffects.find(e => e.type === 'burn');

        if (!burnEffect) {
            console.log(`[DEBUG] No burn effect found on ${player.name}`);
            return false;
        }

        console.log(`[DEBUG] Burn effect found on ${player.name}:`, burnEffect);
        const damage = Math.floor(player.maxHP * burnEffect.power / 100);
        console.log(`[DEBUG] Calculated burn damage: ${damage} (${burnEffect.power}% of ${player.maxHP})`);

        if (damage > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 화상 데미지 시각적 표시 (읽기 시간 포함)
            await this.effectSystem.showEffectMessage('burn', position, 'burn_damage', damage);

            // 실제 데미지 적용
            const actualDamage = player.takeDamage(damage);

            // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
            if (player === this.player && this.gameManager && this.gameManager.recordDamage) {
                this.gameManager.recordDamage('status', 'player', damage, 'burn');
            }

            // HP 바 업데이트
            if (this.hpBarSystem) {
                await this.hpBarSystem.updatePlayerInfo(this.player, this.enemy);
            }

            console.log(`[DEBUG] Burn damage applied: ${actualDamage} to ${player.name} (HP: ${player.hp}/${player.maxHP})`);
            return actualDamage > 0;
        }
        return false;
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