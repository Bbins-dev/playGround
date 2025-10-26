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

        // 상대 참조 설정 (동적 공격력 계산용)
        this.player.opponent = this.enemy;
        this.enemy.opponent = this.player;

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

        // EffectSystem에 AudioSystem 주입 (사운드 통합)
        if (this.gameManager && this.gameManager.audioSystem) {
            this.effectSystem.audioSystem = this.gameManager.audioSystem;
        } else {
            console.warn('[BattleSystem] AudioSystem not found - sound effects will be disabled');
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

        // 턴 배경 인디케이터 업데이트 (화살표 패턴 애니메이션)
        if (this.gameManager && this.gameManager.uiManager) {
            this.gameManager.uiManager.updateTurnBackground(isPlayerTurn);
        }


        this.battlePhase = 'turnTransition';
        this.turnProgress.currentPlayer = currentPlayer;
        this.turnProgress.currentCardIndex = 0;
        this.turnProgress.cardsActivated = 0;

        // 턴 통계 업데이트 (플레이어 턴만)
        if (isPlayerTurn) {
            this.gameManager.updateStatsOnTurn();
        }

        // ===== 1. 턴 시작 시 제거되는 버프 차감 =====
        // 벼리기 버프 차감 (턴 시작 시 - "다음 턴 시작까지" 지속)
        if (currentPlayer.sharpenTurns > 0) {
            currentPlayer.sharpenTurns--;

            // 버프 UI 즉시 업데이트
            this.hpBarSystem.updateBuffs(currentPlayer, isPlayerTurn);
        }

        // 유황 버프 차감 (턴 시작 시 - "다음 턴 시작까지" 지속)
        if (currentPlayer.sulfurTurns > 0) {
            currentPlayer.sulfurTurns--;

            // 버프 UI 즉시 업데이트
            this.hpBarSystem.updateBuffs(currentPlayer, isPlayerTurn);
        }

        // 코팅 버프 차감 (턴 시작 시 - "다음 턴 시작까지" 지속)
        if (currentPlayer.coatingTurns > 0) {
            currentPlayer.coatingTurns--;

            // 버프 UI 즉시 업데이트
            this.hpBarSystem.updateBuffs(currentPlayer, isPlayerTurn);
        }

        // ===== 2. 방어력 초기화 =====
        if (currentPlayer.defense > 0) {
            // 방어력 감소 애니메이션 실행
            await this.hpBarSystem.animateDefenseDecrease(currentPlayer, isPlayerTurn);

            // 실제 방어력 초기화
            currentPlayer.resetDefense();
        }

        // ===== 3. 화상 데미지 처리 =====
        const burnDamageApplied = await this.processBurnDamage(currentPlayer, isPlayerTurn);

        // 화상 데미지 후 즉시 사망 체크
        if (burnDamageApplied && currentPlayer.isDead()) {
            await this.checkBattleEnd();
            return;
        }

        // ===== 3-1. 흡수 버프 회복 처리 =====
        await this.processAbsorptionHeal(currentPlayer, isPlayerTurn);

        // ===== 3-2. 팩 버프 회복 처리 (회복 후 즉시 제거) =====
        await this.processPackHeal(currentPlayer, isPlayerTurn);

        // ===== 4. Player.startTurn() 호출 (카드 초기화만) =====
        currentPlayer.startTurn();

        // ===== 4-1. 런타임 카드 스탯 업데이트 (동적 공격력 계산 포함) =====
        const opponent = isPlayerTurn ? this.enemy : this.player;
        currentPlayer.updateRuntimeCardStats(opponent);

        // ===== 5. 스테이지 회복 =====
        if (isPlayerTurn && this.gameManager.stageHealingAmount > 0) {
            const playerPosition = this.effectSystem.getPlayerPosition();
            this.effectSystem.showDamageNumber(
                this.gameManager.stageHealingAmount,
                playerPosition,
                'heal',
                null,
                { isPlayerTarget: true }  // 스테이지 회복은 항상 플레이어
            );

            // HP바 업데이트
            this.hpBarSystem.updateHP(this.player, true);

            // 회복량 초기화
            this.gameManager.stageHealingAmount = 0;

            // 회복 애니메이션 대기
            await this.wait(800);
        }

        // ===== 6. 기절 상태 체크 (턴 스킵) =====
        if (currentPlayer.hasStatusEffect('stun')) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 기절 효과 표시
            await this.effectSystem.showEffectMessage('stun', position, 'status_applied');

            // 기절 해제
            currentPlayer.removeStatusEffect('stun');
            this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

            // 턴 종료
            await this.endTurn();
            return;
        }

        // ===== 7. 마비 상태 체크 (확률적 턴 스킵) =====
        if (currentPlayer.hasStatusEffect('paralysis')) {
            const paralysisChance = currentPlayer.statusEffects.find(e => e.type === 'paralysis').power;
            if (Math.random() * 100 < paralysisChance) {
                const position = isPlayerTurn ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();

                // 마비 발동 메시지 표시 (템플릿 기반)
                await this.effectSystem.showEffectMessage('paralysis', position, 'paralysis_triggered');

                // 턴 종료
                await this.endTurn();
                return;
            }
        }

        // ===== 8. 턴 인디케이터 표시 =====
        this.hpBarSystem.showTurnIndicator(currentPlayer.name, isPlayerTurn);

        // 잠시 대기 후 카드 발동 시작
        await this.wait(1000);

        // ===== 9. 카드 발동 시작 =====
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

        // 카드 발동 순서: 손패 배열 순서 그대로 사용 (인덱스 0부터 순차적)
        const sortedCards = activatableCards;

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
                    await this.wait(GameConfig.timing?.cards?.repeatDelay || 300);
                }
            }

            this.turnProgress.cardsActivated++;

            // 턴 스킵이 설정되었으면 전체 턴 종료
            if (turnSkipped) {
                break; // 전체 카드 루프 중단
            }

            // 다음 카드 발동 전 잠시 대기
            if (i < activatableCards.length - 1) {
                await this.wait(GameConfig.animations.cardInterval);
            }
        }

        // 모든 카드 발동 완료
        await this.endTurn();
    }

    // 개별 카드 발동
    async activateCard(card, user) {
        let target = user === this.player ? this.enemy : this.player; // let으로 변경 (위상으로 타겟 변경 가능)
        const isPlayerCard = user === this.player;

        // 현재 발동 중인 카드 설정
        this.activatingCard = card;

        // 랜덤 발동 카드 진행 로그 (각 발동마다)
        if ((card.isRandomBash || card.isRandomHeal) && GameConfig?.debugMode?.showRandomBashCounts) {
            const currentCount = card.currentActivations + 1;
            const totalCount = card.modifiedActivationCount !== undefined ?
                card.modifiedActivationCount : card.activationCount;
            console.log(`[RANDOM ACTIVATION] ${card.name || card.id}: ${currentCount}/${totalCount}번째 발동 중`);
        }

        // 카드 발동 애니메이션 (속도는 wait()에서 자동 적용)
        const cardDuration = GameConfig.animations.cardActivation;

        await this.effectSystem.showCardActivation(card, cardDuration);

        // 자해 데미지를 먼저 적용 (명중 여부와 관계없이)
        let selfDamageProcessed = false;
        if (card.selfDamage && card.selfDamage > 0) {
            const selfDamageResult = await this.preprocessSelfDamage(card, user);
            selfDamageProcessed = true;
            if (selfDamageResult && selfDamageResult.terminated) {
                // 자해로 인한 사망 시 즉시 종료
                this.activatingCard = null;
                return;
            }
        }

        // ===== 위상 상태 체크 (30% 확률로 타겟 자신으로 변경) =====
        // 공격 카드만 위상 효과 적용 (버프/회복/방어 카드는 원래 자신에게 적용되므로 제외)
        if (card.type === 'attack' && user.hasStatusEffect('phase')) {
            const phaseConfig = GameConfig.statusEffects?.phase;
            const phaseChance = phaseConfig?.defaultChance || 30;

            if (Math.random() * 100 < phaseChance) {
                // 위상 발동! 타겟을 자신으로 변경
                target = user;

                const userPosition = isPlayerCard ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();

                // 위상 발동 메시지 표시
                await this.effectSystem.showEffectMessage('phase', userPosition, 'phase_self_attack');
            }
        }

        // ===== 피뢰침 버프 체크 (전기 공격 카드 발동 전) =====
        const hadLightningRod = card.type === 'attack' && card.element === 'electric' &&
                                user.hasLightningRodBuff && user.hasLightningRodBuff();

        // 카드 효과 실행 (명중 체크 포함)
        const result = card.activate(user, target, this);

        // 플레이어 카드 사용 시 통계 수집
        if (isPlayerCard) {
            this.gameManager.updateStatsOnCardUse(card);
        }

        if (result.success) {
            // 성공 로그

            // ===== 피뢰침 버프 즉시 제거 (전기 공격 명중 성공 시) =====
            if (hadLightningRod) {
                user.lightningRodTurns = 0;
                this.hpBarSystem.updateBuffs(user, isPlayerCard);
            }

            // 효과별 후처리
            await this.processCardResult(result, card, user, target, selfDamageProcessed);
        } else if (result.conditionFailed) {
            // 조건 실패 (명중했지만 조건 미달)
            // 위상으로 인한 타겟 변경을 반영하기 위해 실제 target 기준으로 위치 계산
            const targetPosition = target === this.player ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // "실패!" 메시지 표시
            this.effectSystem.showDamageNumber(0, targetPosition, 'conditionFailed', null, {
                isPlayerTarget: (target === this.player)
            });

            // 조건 실패 시 추가 대기 (플레이어가 확인할 수 있도록)
            await this.wait(GameConfig.timing?.cards?.missDelay || 800);
        } else {
            // 명중률 실패 (빗나감)
            if (isPlayerCard) {
                this.gameManager.updateStatsOnMiss();
            }

            // 위상으로 인한 타겟 변경을 반영하기 위해 실제 target 기준으로 위치 계산
            const targetPosition = target === this.player ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // "빗나감!" 표시
            this.effectSystem.showDamageNumber(0, targetPosition, 'miss', null, {
                isPlayerTarget: (target === this.player)
            });

            // Miss 시 추가 대기 (플레이어가 확인할 수 있도록)
            await this.wait(GameConfig.timing?.cards?.missDelay || 800);
        }

        this.battleStats.cardsActivated++;

        // 카드 발동 완료 - 현재 발동 중인 카드 초기화
        this.activatingCard = null;
    }

    // 카드 결과 처리
    async processCardResult(result, card, user, target, selfDamageProcessed = false) {
        const isPlayerCard = user === this.player;
        // 위상으로 인한 타겟 변경을 반영하기 위해 실제 target 기준으로 위치 계산
        const targetPosition = target === this.player ?
            this.effectSystem.getPlayerPosition() :
            this.effectSystem.getEnemyPosition();

        // 카드 타입별 처리
        switch (card.type) {
            case 'attack':
                await this.processAttackResult(result, card, user, target, targetPosition);
                break;

            case 'heal':
                // 회복은 자신에게 적용되므로 user 위치 사용
                const healUserPosition = isPlayerCard ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();
                await this.processHealResult(result, user, healUserPosition);
                break;

            case 'buff':
                await this.processBuffResult(result, user);
                break;

            case 'debuff':
                await this.processDebuffResult(result, target, targetPosition);
                break;

            case 'status':
                await this.processStatusResult(result, user, target, targetPosition, card);
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
        await this.updateHPWithAnimation(user, selfDamageProcessed);

        // 전투 종료 체크
        await this.checkBattleEnd();
    }

    /**
     * 공격 결과 처리
     * @param {Object} result - 카드 효과 결과 객체
     * @param {Card} card - 발동된 카드
     * @param {Player} user - 카드를 사용한 플레이어
     * @param {Player} target - 공격 대상 플레이어
     * @param {Object} targetPosition - 타겟 위치 {x, y}
     */
    async processAttackResult(result, card, user, target, targetPosition) {
        const damage = result.damage || 0;

        if (damage > 0) {
            // 실제 대미지 적용
            const actualDamage = target.takeDamage(damage);

            // 화면 흔들림 효과 (플레이어/적 모두 큰 데미지를 받았을 때)
            if (actualDamage > 0) {
                const damagePercent = (actualDamage / target.maxHP) * 100;
                const heavyDamageThreshold = GameConfig?.constants?.performance?.heavyDamageThreshold || 20;

                if (damagePercent >= heavyDamageThreshold) {
                    // 데미지 비율에 따라 흔들림 강도 조절 (20% = 1.0, 40% = 2.0, 60%+ = 3.0)
                    const intensity = Math.min(damagePercent / 20, 3.0);
                    // 게임 속도를 전달하여 애니메이션 duration 자동 조절
                    this.effectSystem.showScreenShake(intensity, this.gameSpeed);
                }
            }

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
                const source = user === this.player ? 'player' : 'enemy';
                const targetType = target === this.enemy ? 'enemy' : 'player';
                this.gameManager.recordDamage(source, targetType, damage, 'normal');
            }
        } else if (damage === 0) {
            // 0 데미지 표시 (방어력으로 무효화된 경우 등)
            this.effectSystem.showDamageNumber(0, targetPosition, 'zero', null, {
                isPlayerTarget: (target === this.player)
            });
        }

        // 힘 버프 획득 처리 (attack 타입 카드에서 힘 버프를 얻는 경우 - 화염승천 등)
        // 데미지 처리 직후에 표시 (동시 연출)
        if (result.strengthGain && result.strengthGain > 0) {
            // user를 직접 사용 (셀프 타겟팅 상황에서도 올바른 위치 보장)
            // user = 실제 카드 사용자 = 버프 획득자
            await this.effectSystem.showBuffEffect('strength', user, result.strengthGain);

            // 버프 라벨 즉시 업데이트 (메시지와 동시에)
            const isUserPlayer = (user === this.player);
            this.hpBarSystem.updateBuffs(user, isUserPlayer);
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

            // 플레이어의 상태이상 테두리 효과 업데이트
            if (isTargetPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }
        }

        // 다른 상태이상 처리 (일반적인 statusType 지원)
        if (result.statusType && result.statusType !== 'stun' && result.statusType !== 'poisoned') {
            await this.effectSystem.showEffectMessage(result.statusType, targetPosition, 'status_applied');

            // 상태이상 UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);

            // 플레이어의 상태이상 테두리 효과 업데이트
            if (isTargetPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }
        }

        // 통합 상태이상 처리 (신규 방식 - 면역 메시지 지원)
        if (result.statusEffect) {
            await this.tryApplyStatusEffect(result.statusEffect, target, targetPosition);
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

    /**
     * 회복 결과 처리
     * @param {Object} result - 카드 효과 결과 객체
     * @param {Player} user - 카드를 사용한 플레이어 (회복 대상자, target 파라미터 없음!)
     * @param {Object} targetPosition - 타겟 위치 {x, y}
     */
    async processHealResult(result, user, targetPosition) {
        // healAmount 또는 healing 속성 모두 지원 (하위 호환성)
        const healing = result.healAmount || result.healing || 0;

        // 회복 카드 발동 시 항상 메시지 표시 (healing >= 0)
        if (healing >= 0) {
            // 템플릿 기반 회복 메시지 표시
            let template = I18nHelper.getText(result.messageKey || 'auto_battle_card_game.ui.templates.heal_effect');
            if (!template) {
                template = '❤️ HP +{value}'; // fallback
            }
            const message = template.replace('{value}', healing);
            await this.effectSystem.showDamageNumber(healing, targetPosition, 'heal', message, {
                isPlayerTarget: (user === this.player)
            });

            // HP바 즉시 업데이트 (프로젝트 규칙: 회복 시 HP 즉시 반영)
            const isPlayer = (user === this.player);
            if (this.hpBarSystem) {
                this.hpBarSystem.updateHP(user, isPlayer);
            }

            // 회복 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
            user.updateRuntimeCardStats();
        }
    }

    /**
     * 버프 결과 처리 - Configuration-Driven (위치 자동 결정)
     * @param {Object} result - 카드 효과 결과 객체
     * @param {Player} user - 카드를 사용한 플레이어 (버프 적용 대상자, target 파라미터 없음!)
     */
    async processBuffResult(result, user) {
        // 조건 실패 체크 (명중했지만 조건 미달)
        if (result.conditionFailed) {
            // targetPosition 계산 (버프는 user에게 적용되지만, 조건 체크는 상대에 대한 것)
            const targetPosition = user.isPlayer ?
                this.effectSystem.getEnemyPosition() :
                this.effectSystem.getPlayerPosition();

            // "실패!" 메시지 표시
            await this.effectSystem.showDamageNumber(0, targetPosition, 'conditionFailed', null, {
                isPlayerTarget: (user === this.enemy)
            });
            // 조건 실패 시 추가 대기 (플레이어가 확인할 수 있도록)
            await this.wait(GameConfig.timing?.cards?.missDelay || 800);
            return; // 조건 실패면 추가 처리 중단
        }

        // 방어력 버프 - 방어력 획득 메시지 표시 (0도 표시)
        if (result.defenseGain !== undefined) {
            const userPosition = user.isPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();
            await this.effectSystem.showDefenseGainMessage(userPosition, result.defenseGain, {
                isPlayerTarget: (user === this.player)
            });
        }

        // 힘 버프 획득 처리 (끝없는 노력 카드 등) - 새로운 통합 메서드 사용
        if (result.strengthGain && result.strengthGain > 0) {
            await this.effectSystem.showBuffEffect('strength', user, result.strengthGain);
        }

        // 강화 버프 획득 처리 (칼춤 카드 등) - 새로운 통합 메서드 사용
        if (result.enhanceGain && result.enhanceGain > 0) {
            await this.effectSystem.showBuffEffect('enhance', user, result.enhanceGain);
        }

        // 집중 버프 획득 처리 (집중 카드 등) - 새로운 통합 메서드 사용
        if (result.focusGain && result.focusGain > 0) {
            await this.effectSystem.showBuffEffect('focus', user, result.focusGain);
        }

        // 고속 버프 획득 처리 (고속공격 카드) - 새로운 통합 메서드 사용
        if (result.speedGain && result.speedGain > 0) {
            await this.effectSystem.showBuffEffect('speed', user, result.speedGain);
        }

        // 냄새 버프 획득 처리 (기회의 냄새 카드) - 새로운 통합 메서드 사용
        if (result.scentGain && result.scentGain > 0) {
            await this.effectSystem.showBuffEffect('scent', user, result.scentGain);
        }

        // 벼리기 버프 획득 처리 (벼리기 카드) - 새로운 통합 메서드 사용
        if (result.sharpenGain && result.sharpenGain > 0) {
            await this.effectSystem.showBuffEffect('sharpen', user, result.sharpenGain);
        }

        // 열풍 버프 획득 처리 (열풍 카드) - 새로운 통합 메서드 사용
        if (result.hotWindGain && result.hotWindGain > 0) {
            await this.effectSystem.showBuffEffect('hotWind', user, result.hotWindGain);
        }

        // Li⁺ 버프 획득 처리 (배터리폭발 카드) - 새로운 통합 메서드 사용
        if (result.lithiumGain && result.lithiumGain > 0) {
            await this.effectSystem.showBuffEffect('lithium', user, result.lithiumGain);
        }

        // 호흡 버프 획득 처리 (불의호흡 카드) - 새로운 통합 메서드 사용
        if (result.breathGain && result.breathGain > 0) {
            await this.effectSystem.showBuffEffect('breath', user, result.breathGain);
        }

        // 질량 버프 획득 처리 (상당한 질량 카드) - 새로운 통합 메서드 사용
        if (result.massGain && result.massGain > 0) {
            await this.effectSystem.showBuffEffect('mass', user, result.massGain);
        }

        // 급류 버프 획득 처리 (급류 카드) - 새로운 통합 메서드 사용
        if (result.torrentGain && result.torrentGain > 0) {
            await this.effectSystem.showBuffEffect('torrent', user, result.torrentGain);
        }

        // 흡수 버프 획득 처리 (수분흡수 카드) - 새로운 통합 메서드 사용
        if (result.absorptionGain && result.absorptionGain > 0) {
            await this.effectSystem.showBuffEffect('absorption', user, result.absorptionGain);
        }

        // 광속 버프 획득 처리 (빛의 속도 카드) - 새로운 통합 메서드 사용
        if (result.lightSpeedGain && result.lightSpeedGain > 0) {
            await this.effectSystem.showBuffEffect('lightSpeed', user, result.lightSpeedGain);
        }

        // 초전도 버프 획득 처리 (초전도 카드) - 새로운 통합 메서드 사용
        if (result.superConductivityGain && result.superConductivityGain > 0) {
            await this.effectSystem.showBuffEffect('superConductivity', user, result.superConductivityGain);
        }

        // 피뢰침 버프 획득 처리 (피뢰침 카드) - 새로운 통합 메서드 사용
        if (result.lightningRodGain && result.lightningRodGain > 0) {
            await this.effectSystem.showBuffEffect('lightningRod', user, result.lightningRodGain);
        }

        // 팩 버프 획득 처리 (건전지 팩 카드) - 새로운 통합 메서드 사용
        if (result.packGain && result.packGain > 0) {
            await this.effectSystem.showBuffEffect('pack', user, result.packGain);
        }

        // 연쇄 버프 획득 처리 (연쇄 반응 카드) - 새로운 통합 메서드 사용
        if (result.propagationGain && result.propagationGain > 0) {
            await this.effectSystem.showBuffEffect('propagation', user, result.propagationGain);
        }

        // 독침 버프 획득 처리 (독침 카드) - 새로운 통합 메서드 사용
        if (result.poisonNeedleGain && result.poisonNeedleGain > 0) {
            await this.effectSystem.showBuffEffect('poisonNeedle', user, result.poisonNeedleGain);
        }

        // 유황 버프 획득 처리 (유황 온천 카드) - 새로운 통합 메서드 사용
        if (result.sulfurGain && result.sulfurGain > 0) {
            await this.effectSystem.showBuffEffect('sulfur', user, result.sulfurGain);

            // ★ 선제적 정화: 얼음 상태이상 제거 시 UI 즉시 동기화
            if (result.frozenCleansed) {
                const isUserPlayer = (user === this.player);
                this.hpBarSystem.updateStatusEffects(user, isUserPlayer);

                // 플레이어의 상태이상 테두리 효과 업데이트
                if (isUserPlayer && this.gameManager?.uiManager) {
                    this.gameManager.uiManager.updateStatusBorder();
                }

                // 정화 메시지 표시 (시각적 피드백)
                const userPosition = isUserPlayer ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();
                await this.effectSystem.showEffectMessage('frozen', userPosition, 'status_cleansed');
            }
        }

        // 코팅 버프 획득 처리 (액체 코팅 카드) - 새로운 통합 메서드 사용
        if (result.coatingGain && result.coatingGain > 0) {
            await this.effectSystem.showBuffEffect('coating', user, result.coatingGain);

            // ★ 선제적 정화: 화상 상태이상 제거 시 UI 즉시 동기화
            if (result.burnCleansed) {
                const isUserPlayer = (user === this.player);
                this.hpBarSystem.updateStatusEffects(user, isUserPlayer);

                // 플레이어의 상태이상 테두리 효과 업데이트
                if (isUserPlayer && this.gameManager?.uiManager) {
                    this.gameManager.uiManager.updateStatusBorder();
                }

                // 정화 메시지 표시 (시각적 피드백)
                const userPosition = isUserPlayer ?
                    this.effectSystem.getPlayerPosition() :
                    this.effectSystem.getEnemyPosition();
                await this.effectSystem.showEffectMessage('burn', userPosition, 'status_cleansed');
            }
        }

        // 정화 효과 처리 (정화 카드)
        if (result.purified) {
            const userPosition = user.isPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 정화 메시지 표시
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, userPosition, 'status', template, {
                isPlayerTarget: (user === this.player)
            });

            // 상태이상 UI 즉시 업데이트
            const isPlayer = (user === this.player);
            this.hpBarSystem.updateStatusEffects(user, isPlayer);

            // 플레이어의 상태이상 테두리 효과 제거
            if (isPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }
        }

        // 몸 털기 효과 처리 (상태이상 무작위 제거)
        if (result.removedStatusType) {
            const isUserPlayer = (user === this.player);

            // 상태이상 UI 즉시 업데이트
            this.hpBarSystem.updateStatusEffects(user, isUserPlayer);

            // 플레이어의 상태이상 테두리 효과 업데이트
            if (isUserPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }

            // "{이모티콘} {상태이상이름} 제거!" 메시지 표시
            const userPosition = isUserPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();
            await this.effectSystem.showEffectMessage(result.removedStatusType, userPosition, 'status_removed');
        }

        // 억제제 효과 처리 (턴 기반 상태이상 턴수 감소)
        if (result.inhibitorApplied) {
            // user의 위치에서 메시지 표시 (버프카드지만 상태이상 관련)
            const userPosition = user.isPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 억제제 메시지 표시
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, userPosition, 'status', template, {
                isPlayerTarget: (user === this.player)
            });

            // 상태이상 UI 즉시 업데이트 (감소된 턴수 표시 + 제거된 상태 반영)
            const isPlayer = (user === this.player);
            this.hpBarSystem.updateStatusEffects(user, isPlayer);

            // 플레이어의 상태이상 테두리 효과 업데이트
            if (isPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }

            // 자신의 런타임 스탯 즉시 업데이트
            user.updateRuntimeCardStats();

            // 상대방의 런타임 스탯 즉시 업데이트 (냉동바람 등 동적 계산)
            if (user.opponent) {
                user.opponent.updateRuntimeCardStats();
            }

            // 억제제 메시지 확인을 위한 대기 시간 추가 (다른 상태이상 처리와 동일 패턴)
            await this.wait(GameConfig.timing?.cards?.missDelay || 800);

            return; // 억제제 처리 완료
        }

        // 상태이상이 없는 경우 메시지 (정화 카드)
        if (result.noStatusEffects) {
            const userPosition = user.isPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, userPosition, 'status', template, {
                isPlayerTarget: (user === this.player)
            });
        }

        // 자신에게 상태이상 적용 처리 (물장구 카드 등 - 버프 카드지만 자신에게 상태이상 적용)
        if (result.statusEffectSelf) {
            const userPosition = user.isPlayer ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 통합 상태이상 시스템 사용 (확률, 면역, 중복 자동 처리)
            await this.tryApplyStatusEffect(result.statusEffectSelf, user, userPosition);
        }

        // 버프 획득 후 HPBar 버프 라벨 즉시 업데이트
        const isPlayer = (user === this.player);
        this.hpBarSystem.updateBuffs(user, isPlayer);

        // 기타 버프 효과 - 확장 가능한 구조
        // TODO: 다른 버프 타입들도 동일한 패턴으로 추가 가능
    }

    // 디버프 결과 처리
    async processDebuffResult(result, target, targetPosition) {
        this.effectSystem.showStatusEffect('debuff', targetPosition, result.power || 0);
    }

    /**
     * 상태이상 결과 처리
     * @param {Object} result - 카드 효과 결과 객체
     * @param {Player} user - 카드를 사용한 플레이어
     * @param {Player} target - 상태이상 적용 대상 플레이어
     * @param {Object} targetPosition - 타겟 위치 {x, y}
     * @param {Card} card - 발동된 카드
     */
    async processStatusResult(result, user, target, targetPosition, card) {
        // 버프 제거 효과 처리 (고압 전류 카드)
        if (result.buffsCleared) {
            // 고압 전류 메시지 표시
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, targetPosition, 'status', template, {
                isPlayerTarget: (target === this.player)
            });

            // 버프 UI 즉시 업데이트
            const isTargetPlayer = (target === this.player);
            this.hpBarSystem.updateBuffs(target, isTargetPlayer);

            return; // 버프 제거 완료
        }

        // 버프가 없는 경우 메시지 (고압 전류 카드)
        if (result.noBuffs) {
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, targetPosition, 'conditionFailed', template, {
                isPlayerTarget: (target === this.player)
            });
            return;
        }

        // 촉진제 효과 처리 (턴 기반 상태이상 턴수 연장)
        if (result.catalystApplied) {
            // 촉진제 메시지 표시
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, targetPosition, 'status', template, {
                isPlayerTarget: (target === this.player)
            });

            // 상태이상 UI 즉시 업데이트 (연장된 턴수 표시)
            const isTargetPlayer = (target === this.player);
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);

            return; // 촉진제 처리 완료
        }

        // 조건 실패 체크 (명중했지만 조건 미달)
        if (result.conditionFailed) {
            // "실패!" 메시지 표시
            await this.effectSystem.showDamageNumber(0, targetPosition, 'conditionFailed', null, {
                isPlayerTarget: (target === this.player)
            });
            // 조건 실패 시 추가 대기 (플레이어가 확인할 수 있도록)
            await this.wait(GameConfig.timing?.cards?.missDelay || 800);
            return; // 조건 실패면 추가 처리 중단
        }

        // 중복 상태이상 체크 (이미 걸린 상태)
        if (result.duplicate) {
            // 어떤 상태이상 타입이든 템플릿 기반으로 처리
            const statusType = result.statusType || this.extractStatusTypeFromMessage(result.messageKey);
            if (statusType) {
                await this.effectSystem.showEffectMessage(statusType, targetPosition, 'already_status');
            }
            return; // 중복 상태면 추가 처리 중단
        }

        // 데미지가 있는 상태이상 카드 처리 (예: 화약통 투척)
        const damage = result.damage || 0;
        if (damage > 0) {
            // 실제 대미지 적용
            const actualDamage = target.takeDamage(damage);

            // 피격 효과 (속성 상성 정보 포함) - 불 공격 연출 활용
            const effectiveness = result.effectiveness || 1.0;
            const element = result.element || (card ? card.element : 'normal');
            await this.effectSystem.showHitEffect(targetPosition, element, damage, effectiveness);

            // 통계 업데이트 (기존 BattleSystem 통계)
            if (target === this.enemy) {
                this.battleStats.totalDamageDealt += actualDamage;
            } else {
                this.battleStats.totalDamageReceived += actualDamage;
            }

            // GameManager 중앙 통계 시스템 업데이트
            if (this.gameManager && this.gameManager.recordDamage) {
                const source = user === this.player ? 'player' : 'enemy';
                const targetType = target === this.enemy ? 'enemy' : 'player';
                this.gameManager.recordDamage(source, targetType, damage, 'normal');
            }
        }

        // 양쪽 상태이상 처리 (비내리기 카드 등 - 자신과 상대 모두에게 적용)
        if (result.statusEffectBoth) {
            // 카드 사용자(user) 확인 - target의 반대
            const user = target === this.player ? this.enemy : this.player;
            const userPosition = target === this.player ?
                this.effectSystem.getEnemyPosition() :
                this.effectSystem.getPlayerPosition();

            // 상대(target)에게 상태이상 적용
            await this.tryApplyStatusEffect(result.statusEffectBoth, target, targetPosition);

            // 자신(user)에게도 상태이상 적용
            await this.tryApplyStatusEffect(result.statusEffectBoth, user, userPosition);

            return; // 양쪽 처리 완료
        }

        // 통합 상태이상 처리 (신규 방식 - 면역 메시지 지원)
        if (result.statusEffect) {
            await this.tryApplyStatusEffect(result.statusEffect, target, targetPosition);
            return; // 통합 시스템으로 처리했으면 레거시 처리 건너뛰기
        }

        // 상태이상별 효과 표시 (레거시 방식 - 하위 호환)
        const statusType = result.statusType;
        if (statusType) {
            // 템플릿 선택: 화상 연장 카드는 burn_extended 사용
            let templateType = 'status_applied';
            let turnsValue = 0;

            // 화상 연장 카드 체크 (기름붓기, 화약통)
            if (result.turnsExtended && statusType === 'burn') {
                templateType = 'burn_extended';
                turnsValue = result.turnsExtended;
            }

            // 템플릿 기반으로 상태이상 적용 메시지 표시
            await this.effectSystem.showEffectMessage(statusType, targetPosition, templateType, turnsValue);

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

    /**
     * 방어 결과 처리
     * @param {Object} result - 카드 효과 결과 객체
     * @param {Player} user - 카드를 사용한 플레이어 (방어력 획득 대상자, target 파라미터 없음!)
     * @param {Object} userPosition - 사용자 위치 {x, y}
     */
    async processDefenseResult(result, user, userPosition) {
        // 조건 미충족 시 특별 메시지 처리 (거울반응 카드 등)
        if (result.conditionNotMet && result.messageKey) {
            const template = I18nHelper.getText(result.messageKey);
            await this.effectSystem.showDamageNumber(0, userPosition, 'status', template, {
                isPlayerTarget: (user === this.player)
            });
            return; // 조건 미충족이면 추가 처리 중단
        }

        const defenseGain = result.defenseGain || 0;
        const selfDamage = result.selfDamage || 0;

        // 회복 처리 (이관능성 방패 등 회복+방어력 복합 카드)
        const healAmount = result.healAmount || 0;
        if (healAmount > 0) {
            // 회복 메시지 표시
            let template = I18nHelper.getText('auto_battle_card_game.ui.templates.heal_effect');
            if (!template) {
                template = '❤️ HP +{value}'; // fallback
            }
            const message = template.replace('{value}', healAmount);
            await this.effectSystem.showDamageNumber(healAmount, userPosition, 'heal', message, {
                isPlayerTarget: (user === this.player)
            });

            // HP바 즉시 업데이트
            const isPlayer = (user === this.player);
            if (this.hpBarSystem) {
                this.hpBarSystem.updateHP(user, isPlayer);
            }

            // 회복 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
            user.updateRuntimeCardStats();
        }

        if (defenseGain > 0) {
            // 방어력 숫자 연출 표시 - 기존 방어력 전용 메서드 사용 (은색 표시)
            await this.effectSystem.showDefenseGainMessage(userPosition, defenseGain, {
                isPlayerTarget: (user === this.player)
            });

            // 방어력 UI 즉시 업데이트 (방어력 메시지 표시 직후)
            const isPlayer = (user === this.player);
            if (this.hpBarSystem) {
                await this.hpBarSystem.updateAfterDamage(user, isPlayer);
            }

            // 방어력 관련 통계 업데이트
            this.battleStats.defenseBuilt += defenseGain;

            // 게임 매니저 통계 업데이트 (플레이어만)
            if (user === this.player) {
                this.gameManager.updateStatsOnDefense(defenseGain);
            }
        }

        // 힘 버프 획득 처리 (가시갑옷 카드 등) - 새로운 통합 메서드 사용
        if (result.strengthGain && result.strengthGain > 0) {
            await this.effectSystem.showBuffEffect('strength', user, result.strengthGain);

            // 힘 버프 라벨 즉시 업데이트 (힘 버프 메시지 표시 직후)
            const isPlayer = (user === this.player);
            this.hpBarSystem.updateBuffs(user, isPlayer);
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
        this.effectSystem.showDamageNumber(0, position, 'selfDamage', message, {
            isPlayerTarget: (attacker === this.player)
        });
    }

    // 상태이상 적용 시도 (통합 시스템 - Configuration-Driven)
    async tryApplyStatusEffect(statusInfo, target, targetPosition) {
        // statusInfo: { type, chance, power, duration }

        // 1. 확률 체크
        if (statusInfo.chance < 100) {
            const roll = Math.random() * 100;
            if (GameConfig?.debugMode?.showStatusRolls) {
                const result = roll < statusInfo.chance ? '✓' : '✗';
                console.log(`[STATUS ROLL] ${statusInfo.type} → ${target.name}: ${statusInfo.chance.toFixed(1)}% (roll: ${roll.toFixed(1)}) ${result}`);
            }
            if (roll >= statusInfo.chance) {
                // 확률 실패 - 메시지 없음
                return { success: false, reason: 'missed_chance' };
            }
        }

        // 2. 상태이상 적용 시도
        const result = target.addStatusEffect(
            statusInfo.type,
            statusInfo.power || null,
            statusInfo.duration || null
        );

        // 3. 결과에 따른 메시지 표시
        if (result.success) {
            // 성공 - 상태이상 적용됨
            if (result.extended) {
                // 연장 가능한 상태이상(화상, 중독) - xxx_extended 템플릿 사용
                const templateKey = `${statusInfo.type}_extended`;
                await this.effectSystem.showEffectMessage(statusInfo.type, targetPosition, templateKey, statusInfo.duration);
            } else {
                // 일반 적용 - status_applied 템플릿 사용
                await this.effectSystem.showEffectMessage(statusInfo.type, targetPosition, 'status_applied');
            }

            // UI 즉시 업데이트
            const isTargetPlayer = target === this.player;
            this.hpBarSystem.updateStatusEffects(target, isTargetPlayer);

            // 플레이어의 상태이상 테두리 효과 업데이트
            if (isTargetPlayer && this.gameManager?.uiManager) {
                this.gameManager.uiManager.updateStatusBorder();
            }

            // 상대방의 런타임 스탯 즉시 업데이트 (동적 공격력 계산, 예: 냉동바람)
            if (target.opponent) {
                target.opponent.updateRuntimeCardStats();
            }

            return { success: true, statusType: statusInfo.type, extended: result.extended };
        } else if (result.duplicate) {
            // 중복 - 이미 상태이상 걸림
            await this.effectSystem.showEffectMessage(statusInfo.type, targetPosition, 'already_status');
            return { success: false, duplicate: true, statusType: statusInfo.type };
        } else if (result.reason === 'immune') {
            // 면역 - 방어속성으로 인한 면역
            await this.effectSystem.showEffectMessage(statusInfo.type, targetPosition, 'status_immune');
            return { success: false, immune: true, statusType: statusInfo.type };
        } else if (result.reason === 'buff_immune') {
            // 버프 면역 - 유황/코팅 버프로 인한 면역
            const buffType = result.buffType; // 'sulfur' or 'coating'
            const messageKey = `${buffType}_immune`; // 'sulfur_immune' or 'coating_immune'
            await this.effectSystem.showEffectMessage(buffType, targetPosition, messageKey);
            return { success: false, buffImmune: true, buffType: buffType };
        }

        // 기타 실패 (invalid_input, invalid_status 등)
        return { success: false, reason: result.reason };
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


        // 1. 즉시 해제가 필요한 상태이상 제거
        currentPlayer.removeStatusEffect('taunt');
        currentPlayer.removeStatusEffect('stun'); // 안전장치
        currentPlayer.removeStatusEffect('frozen'); // 얼음 즉시 해제
        currentPlayer.removeStatusEffect('phase'); // 위상 즉시 해제

        // 2. 턴 종료 시 데미지 처리 (독 등)
        const poisonDamageApplied = await this.processPoisonDamage(currentPlayer, isPlayerTurn);

        // 3. 데미지로 인한 전투 종료 체크
        if (poisonDamageApplied && await this.checkBattleEnd()) {
            return; // 독 데미지로 전투가 끝났으면 여기서 종료
        }

        // 4. 상태이상 턴수 차감 (0턴인 것 자동 제거)
        currentPlayer.endTurn();

        // 5. UI 업데이트 (차감된 상태 반영)
        this.hpBarSystem.updateStatusEffects(currentPlayer, isPlayerTurn);

        // 6. 버프 UI 업데이트 (강화 버프 턴수 반영)
        this.hpBarSystem.updateBuffs(currentPlayer, isPlayerTurn);

        // 7. 플레이어의 상태이상 테두리 효과 업데이트 (턴 종료 시)
        if (isPlayerTurn && this.gameManager?.uiManager) {
            this.gameManager.uiManager.updateStatusBorder();
        }

        // 턴 전환
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
        this.battleStats.totalTurns++;

        // 전투 종료 체크
        if (!await this.checkBattleEnd()) {
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

            this.timerManager.setTimeout(checkAndStartTurn, (GameConfig.timing?.battle?.pauseDelay || 1000) / this.gameSpeed, 'turn-transition');
        }
    }

    // 전투 종료 체크
    async checkBattleEnd() {
        if (this.player.isDead()) {
            // HP 애니메이션 완료까지 대기 (체력바가 0이 되는 것을 보고 난 후 게임오버)
            await this.wait(GameConfig.timing?.battle?.deathAnimationDelay || 520);
            this.endBattle(this.enemy);
            return true;
        }

        if (this.enemy.isDead()) {
            // 적 사망 시에도 동일하게 처리
            await this.wait(GameConfig.timing?.battle?.deathAnimationDelay || 520);
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
        console.log(`[BattleSystem] 게임 속도 설정: ${speed}x (레거시, 실제로는 TimerManager 사용)`);
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

    // 특수 카드 결과 처리 - Configuration-Driven (위치 자동 결정)
    async processSpecialResult(result, user, targetPosition) {
        if (result.effectType === 'heal' && result.templateData) {
            // 자동 위치 결정으로 하드코딩 제거
            const userPos = this.effectSystem.getTargetPosition(user);

            // 템플릿 직접 사용 (heal_effect 템플릿 활용)
            const template = I18nHelper.getText('auto_battle_card_game.ui.templates.heal_effect');
            const message = template.replace('{value}', result.templateData.value);
            this.effectSystem.showDamageNumber(0, userPos, 'heal', message, {
                isPlayerTarget: (user === this.player)
            });
        }
    }

    // 독 상태이상 대미지 처리
    async processPoisonDamage(player, isPlayerTurn) {
        const poisonEffect = player.statusEffects.find(e => e.type === 'poisoned');

        if (!poisonEffect) {
            return false;
        }

        const damage = poisonEffect.turnsLeft; // 남은 턴수만큼 데미지 (동적 계산)
        if (GameConfig?.debugMode?.showDamageCalculation) {
            console.log(`[DOT] 독: -${damage} HP (${player.name}) [턴: ${poisonEffect.turnsLeft}]`);
        }

        if (damage > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 독 데미지 시각적 표시 (읽기 시간 포함)
            await this.effectSystem.showDamageNumber(damage, position, 'poison', null, {
                isPlayerTarget: isPlayerTurn
            });

            // 실제 대미지 적용
            const actualDamage = player.takeDamage(damage);

            // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
            if (player === this.player && this.gameManager && this.gameManager.recordDamage) {
                this.gameManager.recordDamage('status', 'player', damage, 'poison');
            }

            // HP/방어력 바 순차 업데이트 (방어력 → HP 순서 보장)
            await this.hpBarSystem.updateAfterDamage(player, isPlayerTurn);

            // 독 데미지 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
            player.updateRuntimeCardStats();

            return actualDamage > 0;
        }
        return false;
    }

    // 화상 상태이상 데미지 처리
    async processBurnDamage(player, isPlayerTurn) {
        const burnEffect = player.statusEffects.find(e => e.type === 'burn');

        if (!burnEffect) {
            return false;
        }

        const damage = burnEffect.power; // 고정 데미지 (기본 5)

        if (damage > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 화상 데미지 시각적 표시 (읽기 시간 포함)
            await this.effectSystem.showDamageNumber(damage, position, 'burn', null, {
                isPlayerTarget: isPlayerTurn
            });

            // 실제 데미지 적용
            const actualDamage = player.takeDamage(damage);

            // GameManager 중앙 통계 시스템 업데이트 (원래 대미지 사용)
            if (player === this.player && this.gameManager && this.gameManager.recordDamage) {
                this.gameManager.recordDamage('status', 'player', damage, 'burn');
            }

            // HP/방어력 바 순차 업데이트 (방어력 → HP 순서 보장)
            if (this.hpBarSystem) {
                await this.hpBarSystem.updateAfterDamage(player, isPlayerTurn);
            }

            // 화상 데미지 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
            player.updateRuntimeCardStats();

            if (GameConfig?.debugMode?.showDamageCalculation) {
                console.log(`[DOT] 화상: -${actualDamage} HP (${player.name})`);
            }
            return actualDamage > 0;
        }
        return false;
    }

    // 흡수 버프 회복 처리 (턴 시작 시)
    async processAbsorptionHeal(player, isPlayerTurn) {
        // 흡수 버프가 없으면 리턴
        if (!player.hasAbsorptionBuff()) {
            return false;
        }

        const healAmount = player.getAbsorptionHeal();

        if (healAmount > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 회복 전 HP 저장
            const beforeHP = player.hp;

            // 실제 회복 적용
            const actualHeal = player.heal(healAmount);

            // 회복 메시지 표시 (젖음 상태 체크)
            const isWet = player.hasStatusEffect('wet');
            const templateKey = isWet ?
                'auto_battle_card_game.ui.templates.absorption_heal_wet' :
                'auto_battle_card_game.ui.templates.absorption_heal';

            // 템플릿 메시지 가져오기
            const template = I18nHelper.getText(templateKey);
            const message = template.replace('{value}', actualHeal);

            // 회복 이펙트 표시 (읽기 시간 포함)
            await this.effectSystem.showDamageNumber(actualHeal, position, 'heal', message, {
                isPlayerTarget: isPlayerTurn
            });

            // HP바 업데이트
            if (this.hpBarSystem) {
                this.hpBarSystem.updateHP(player, isPlayerTurn);
            }

            // 회복 후 런타임 스탯 재계산
            player.updateRuntimeCardStats();

            if (GameConfig?.debugMode?.showDamageCalculation) {
                console.log(`[HEAL] 흡수: +${actualHeal} HP (${player.name}) [젖음: ${isWet}]`);
            }
            return actualHeal > 0;
        }
        return false;
    }

    // 팩 버프 회복 처리 (턴 시작 시 - 회복 후 즉시 제거)
    async processPackHeal(player, isPlayerTurn) {
        // 팩 버프가 없으면 리턴
        if (!player.hasPackBuff()) {
            return false;
        }

        const healAmount = player.getPackHeal();

        if (healAmount > 0) {
            const position = isPlayerTurn ?
                this.effectSystem.getPlayerPosition() :
                this.effectSystem.getEnemyPosition();

            // 회복 전 HP 저장
            const beforeHP = player.hp;

            // 실제 회복 적용
            const actualHeal = player.heal(healAmount);

            // 회복 메시지 표시 (템플릿 기반)
            const templateKey = 'auto_battle_card_game.ui.templates.pack_heal';
            const template = I18nHelper.getText(templateKey);
            const message = template.replace('{value}', actualHeal);

            // 회복 이펙트 표시 (읽기 시간 포함)
            await this.effectSystem.showDamageNumber(actualHeal, position, 'heal', message, {
                isPlayerTarget: isPlayerTurn
            });

            // HP바 업데이트
            if (this.hpBarSystem) {
                this.hpBarSystem.updateHP(player, isPlayerTurn);
            }

            // 회복 후 즉시 팩 버프 제거 (핵심 차이점!)
            player.clearPackBuff();

            // 버프 UI 즉시 업데이트 (팩 버프 사라짐)
            this.hpBarSystem.updateBuffs(player, isPlayerTurn);

            // 회복 후 런타임 스탯 재계산
            player.updateRuntimeCardStats();

            if (GameConfig?.debugMode?.showDamageCalculation) {
                console.log(`[HEAL] 팩: +${actualHeal} HP (${player.name}) [제거됨]`);
            }
            return actualHeal > 0;
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
    /**
     * 게임 속도가 자동 적용되는 대기 함수
     * @param {number} baseMs - 기본 대기 시간 (ms)
     * @returns {Promise} 대기 완료 Promise
     */
    wait(baseMs) {
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

            // TimerManager의 속도 인식 기능 사용
            let adjustedMs = baseMs;
            if (this.timerManager && typeof this.timerManager.applyGameSpeed === 'function') {
                adjustedMs = this.timerManager.applyGameSpeed(baseMs);
            } else {
                console.warn('[BattleSystem.wait] TimerManager를 찾을 수 없어 속도 적용 안됨');
            }

            const timerId = setTimeout(() => {
                this.activeTimers = this.activeTimers.filter(id => id !== timerId);
                checkAndResolve();
            }, adjustedMs);

            // 활성 타이머 목록에 추가
            this.activeTimers.push(timerId);
        });
    }

    // HP 업데이트 애니메이션 처리 (순차 업데이트 적용)
    async updateHPWithAnimation(cardUser = null, selfDamageProcessed = false) {
        // 모든 플레이어의 UI를 항상 업데이트 (KISS 원칙)
        // updateAfterDamage 내부에서 실제 변경된 값만 업데이트하므로 성능 영향 없음
        const updatePromises = [
            this.hpBarSystem.updateAfterDamage(this.player, true),
            this.hpBarSystem.updateAfterDamage(this.enemy, false)
        ];

        // 플레이어와 적의 순차 업데이트를 병렬로 실행 (각각 내부적으로는 방어력→HP 순서)
        await Promise.all(updatePromises);

        // HP 변경 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
        this.player.updateRuntimeCardStats();
        this.enemy.updateRuntimeCardStats();

        // 이름 업데이트 (시각적 우선순위 낮음)
        this.hpBarSystem.updateNames(this.player, this.enemy);
    }

    // 전투 통계 가져오기
    getBattleStats() {
        return { ...this.battleStats };
    }

    // 자해 데미지 전처리 시스템 (Configuration-Driven)
    async preprocessSelfDamage(card, user) {
        // 자해 데미지가 없는 카드는 건너뜀
        if (!card.selfDamage || card.selfDamage <= 0) {
            return null;
        }

        const isPlayerCard = user === this.player;
        const userPosition = isPlayerCard ?
            this.effectSystem.getPlayerPosition() :
            this.effectSystem.getEnemyPosition();

        // GameConfig 설정 사용 (안전한 접근 방식)
        const config = GameConfig?.cardEffects?.selfDamage || {
            timing: {
                animationDelay: 300,        // 기본값 (GameConfig.masterTiming.cards.repeatDelay)
                deathCheckDelay: 300
            },
            visual: {
                damageColor: '#E67E22',     // 기본값 (화상 색상)
                textKey: 'auto_battle_card_game.ui.templates.self_damage'
            }
        };
        const selfDamage = card.selfDamage;

        // 자해 데미지 시각 효과 표시 (숫자만 표시) - 통합 읽기 시간 적용
        await this.effectSystem.showDamageNumber(selfDamage, userPosition, 'selfDamage', null, {
            isPlayerTarget: isPlayerCard
        });

        // 자해 데미지 적용
        user.takeDamage(selfDamage);

        // GameManager 중앙 통계 시스템 업데이트
        if (this.gameManager && this.gameManager.recordDamage && isPlayerCard) {
            this.gameManager.recordDamage('self', 'player', selfDamage, 'self');
        }

        // HP/방어력 바 순차 업데이트 (방어력 → HP 순서 보장)
        if (this.hpBarSystem) {
            await this.hpBarSystem.updateAfterDamage(user, isPlayerCard);
        }

        // 셀프 데미지 후 런타임 스탯 재계산 (질량 버프 등 HP 기반 계산 즉시 반영)
        user.updateRuntimeCardStats();

        // 자해 데미지 표시 대기 시간
        await this.wait(config.timing.animationDelay);

        // 자해 후 자신에게 상태이상 적용 (selfStatusEffect 지원)
        if (card.selfStatusEffect && !user.isDead()) {
            // 자신에게 상태이상 적용 (통합 시스템 사용)
            await this.tryApplyStatusEffect(card.selfStatusEffect, user, userPosition);
        }

        // 사망 체크
        if (user.isDead()) {
            // 사망 체크 대기 시간
            await this.wait(config.timing.deathCheckDelay);

            // 전투 종료 처리
            await this.checkBattleEnd();

            return {
                terminated: true,
                success: false,
                selfDamage: selfDamage,
                selfKnockout: true,
                element: card.element || 'normal'
            };
        }

        return {
            terminated: false,
            selfDamage: selfDamage,
            success: true
        };
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