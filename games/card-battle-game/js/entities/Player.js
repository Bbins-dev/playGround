// 플레이어 클래스 정의

class Player {
    constructor(name = 'Player', isPlayer = true) {
        // 기본 정보
        this.name = name;
        this.isPlayer = isPlayer;
        this.maxHP = GameConfig.player.startingHP;
        this.hp = this.maxHP;
        this.maxHandSize = isPlayer ? GameConfig.player.maxHandSize : GameConfig.enemy.maxHandSize;

        // 손패
        this.hand = [];

        // 게임 상태
        this.turn = 0;
        this.defenseElement = GameConfig.player.defaultDefenseElement;

        // 방어 시스템
        this.defense = 0; // 현재 방어력

        // 대미지 추적
        this.lastDamageTaken = 0; // 마지막에 받은 대미지 (카운터어택용)

        // 상태이상
        this.statusEffects = [];

        // 버프 시스템
        this.strength = 0; // 힘 버프
        this.enhanceTurns = 0; // 강화 버프 남은 턴 수
        this.focusTurns = 0; // 집중 버프 남은 턴 수
        this.speedBonus = 0; // 고속 추가 발동횟수
        this.speedTurns = 0; // 고속 버프 남은 턴 수
        this.scentBonus = 0; // 냄새 추가 대미지 (스택 수)
        this.scentTurns = 0; // 냄새 버프 남은 턴 수
        this.sharpenTurns = 0; // 벼리기 버프 남은 턴 수
        this.hotWindTurns = 0; // 열풍 버프 남은 턴 수
        this.lithiumTurns = 0; // Li⁺ 버프 남은 턴 수 (곱셈 배율)
        this.breathTurns = 0; // 호흡 버프 남은 턴 수 (불 속성 버프카드 100% 발동)
        this.massBonus = 0; // 질량 버프 스택 수
        this.massTurns = 0; // 질량 버프 남은 턴 수 (항상 1턴 고정)
        this.torrentBonus = 0; // 급류 추가 발동횟수
        this.torrentTurns = 0; // 급류 버프 남은 턴 수 (항상 1턴 고정)
        this.absorptionBonus = 0; // 흡수 버프 스택 수
        this.absorptionTurns = 0; // 흡수 버프 남은 턴 수 (스테이지 내내 유지)
        this.lightSpeedBonus = 0; // 광속 추가 발동횟수
        this.lightSpeedTurns = 0; // 광속 버프 남은 턴 수 (항상 1턴 고정)
        this.superConductivityTurns = 0; // 초전도 버프 남은 턴 수 (중첩 불가, 1턴 고정)
        this.staticTurns = 0; // 정전기 버프 남은 턴 수 (중첩 불가, 1턴 고정)
        this.packBonus = 0; // 팩 버프 스택 수
        this.packTurns = 0; // 팩 버프 턴 수 (회복 직후 즉시 제거)
        this.propagationBonus = 0; // 연쇄 추가 발동횟수
        this.propagationTurns = 0; // 연쇄 버프 남은 턴 수 (항상 1턴 고정)
        this.poisonNeedleTurns = 0; // 독침 버프 남은 턴 수 (1턴 고정, 독 공격 명중률 20% 증가)
        this.sulfurTurns = 0; // 유황 버프 남은 턴 수 (얼음 면역)
        this.coatingTurns = 0; // 코팅 버프 남은 턴 수 (화상 면역)
        this.raincoatStacks = 0; // 우비 버프 스택 수 (상태이상 차단, 턴이 아닌 스택 기반)

        // 턴 관련
        this.currentCardIndex = 0;
        this.cardsActivatedThisTurn = 0;

        // 상대 참조 (동적 공격력 계산용)
        this.opponent = null;

        // 성능 최적화: throttle 메커니즘
        this.lastUpdateTime = 0;
        this.updateThrottleMs = GameConfig?.constants?.performance?.updateThrottleMs || 16;
        this.pendingUpdate = false;
    }

    // HP 관련 메서드
    takeDamage(amount, attacker = null) {
        // 입력값 유효성 검사
        if (typeof amount !== 'number' || amount < 0) {
            console.warn('Player.takeDamage: 유효하지 않은 대미지 값:', amount);
            return 0;
        }

        const previousHP = this.hp;
        let remainingDamage = amount;

        // 마지막 받은 대미지 기록 (방어력 차감 전 원래 데미지 - 카운터어택용)
        this.lastDamageTaken = amount;

        // 방어력 먼저 소모 (보호막 방식)
        if (this.defense > 0 && remainingDamage > 0) {
            const defenseAbsorbed = Math.min(this.defense, remainingDamage);
            this.defense -= defenseAbsorbed;
            remainingDamage -= defenseAbsorbed;
        }

        // 남은 대미지를 HP에 적용
        if (remainingDamage > 0) {
            const newHP = this.hp - remainingDamage;

            // 벼리기 버프: HP가 0 이하가 되지 않고 1로 유지
            if (newHP <= 0 && this.hasSharpenBuff()) {
                this.hp = 1;  // 0이 되지 않고 1로 설정
                // 버프는 소모하지 않음! 턴 종료까지 계속 유효
            } else {
                this.hp = Math.max(0, newHP);
            }
        }

        const actualDamage = previousHP - this.hp;

        return actualDamage;
    }

    heal(amount) {
        // 입력값 유효성 검사
        if (typeof amount !== 'number' || amount < 0) {
            console.warn('Player.heal: 유효하지 않은 회복량:', amount);
            return 0;
        }

        const previousHP = this.hp;
        this.hp = Math.min(this.maxHP, this.hp + amount);
        const actualHealing = this.hp - previousHP;

        return actualHealing;
    }

    isDead() {
        return this.hp <= 0;
    }

    // 방어력 관련 메서드
    addDefense(amount) {
        this.defense += amount;
        return amount;
    }

    removeDefense(amount) {
        const previousDefense = this.defense;
        this.defense = Math.max(0, this.defense - amount);
        const actualReduction = previousDefense - this.defense;
        return actualReduction;
    }


    // 방어력 초기화 (턴 시작 시 사용)
    resetDefense() {
        const previousDefense = this.defense;
        this.defense = 0;
        return previousDefense;
    }

    // 카드 관련 메서드
    addCard(card) {
        if (this.hand.length >= this.maxHandSize) {
            return false;
        }

        this.hand.push(card);
        this.updateDefenseElement();
        this.updateRuntimeCardStats();  // 새 카드의 런타임 스탯 즉시 계산
        return true;
    }

    removeCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            const removedCard = this.hand.splice(cardIndex, 1)[0];
            this.updateDefenseElement();
            return removedCard;
        }
        return null;
    }

    replaceCard(oldCardIndex, newCard) {
        if (oldCardIndex >= 0 && oldCardIndex < this.hand.length) {
            const oldCard = this.hand[oldCardIndex];
            this.hand[oldCardIndex] = newCard;
            this.updateDefenseElement();
            return oldCard;
        }
        return null;
    }

    // 방어 속성 업데이트 (손패의 가장 많은 속성)
    updateDefenseElement() {
        this.defenseElement = GameConfig.utils.calculateDefenseElement(this.hand);
    }

    // 상태이상 관련 메서드
    addStatusEffect(statusType, power = null, duration = null) {

        // 입력값 유효성 검사
        if (!statusType || typeof statusType !== 'string') {
            console.warn('Player.addStatusEffect: 유효하지 않은 상태이상 타입:', statusType);
            return { success: false, reason: 'invalid_input' };
        }

        // 면역 체크 (속성 기반)
        const isImmune = GameConfig.utils.isImmuneToStatus(this.defenseElement, statusType);
        if (isImmune) {
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[STATUS] ${this.name} 면역: ${statusType}`);
            }
            return { success: false, reason: 'immune' };
        }

        // 버프 기반 면역 체크
        if (statusType === 'frozen' && this.hasSulfurBuff()) {
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[STATUS] ${this.name} 유황 버프로 얼음 면역`);
            }
            return { success: false, reason: 'buff_immune', buffType: 'sulfur' };
        }

        if (statusType === 'burn' && this.hasCoatingBuff()) {
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[STATUS] ${this.name} 코팅 버프로 화상 면역`);
            }
            return { success: false, reason: 'buff_immune', buffType: 'coating' };
        }

        // 상태이상 설정 확인
        const statusConfig = GameConfig.statusEffects[statusType];
        if (!statusConfig) {
            console.warn('Player.addStatusEffect: 존재하지 않는 상태이상:', statusType);
            return { success: false, reason: 'invalid_status' };
        }

        // 강도 기반 중첩 시스템 (발화 전용)
        const existingEffect = this.statusEffects.find(effect => effect.type === statusType);
        if (existingEffect && statusConfig.canStack) {
            // 발화: 스택 증가 + 턴은 1로 리셋
            const maxStacks = statusConfig.maxStacks || 10;
            existingEffect.stacks = Math.min((existingEffect.stacks || 1) + 1, maxStacks);
            existingEffect.turnsLeft = 1; // 항상 1턴으로 리셋

            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[STATUS] ${statusType} 중첩: ${this.name} (×${existingEffect.stacks})`);
            }

            // 자신의 런타임 스탯 업데이트
            this.updateRuntimeCardStats();

            // 상대방의 런타임 스탯 즉시 업데이트 (동적 공격력 계산)
            if (this.opponent) {
                this.opponent.updateRuntimeCardStats();
            }

            return { success: true, stacked: true, stacks: existingEffect.stacks, statusType: statusType };
        }

        // 턴 연장 가능한 상태이상 (기존 시스템 - burn, poison 등)
        if (existingEffect && statusConfig.canExtend) {
            // 중복 적용 시 턴 수 누적
            const additionalTurns = duration || statusConfig.duration || 1;
            existingEffect.turnsLeft += additionalTurns;
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[STATUS] ${statusType} 연장: ${this.name} (+${additionalTurns}턴)`);
            }

            // 자신의 런타임 스탯 업데이트
            this.updateRuntimeCardStats();

            // 상대방의 런타임 스탯 즉시 업데이트 (동적 공격력 계산)
            if (this.opponent) {
                this.opponent.updateRuntimeCardStats();
            }

            return { success: true, extended: true, statusType: statusType };
        }

        // 연장 불가능한 상태이상은 중복 불가
        const hasDuplicate = this.hasStatusEffect(statusType);
        if (hasDuplicate) {
            return { success: false, duplicate: true, statusType: statusType };
        }

        // 새 상태이상 추가
        const statusEffect = {
            type: statusType,
            power: power || statusConfig.defaultDamage || statusConfig.defaultChance || 0,
            duration: duration || statusConfig.duration || -1, // -1은 영구
            turnsLeft: duration || statusConfig.duration || -1,
            stacks: statusConfig.canStack ? 1 : undefined // 강도 기반 중첩용
        };

        this.statusEffects.push(statusEffect);

        // 자신의 런타임 스탯 업데이트
        this.updateRuntimeCardStats();

        // 상대방의 런타임 스탯 즉시 업데이트 (동적 공격력 계산)
        if (this.opponent) {
            this.opponent.updateRuntimeCardStats();
        }

        return { success: true };
    }

    removeStatusEffect(statusType) {
        const index = this.statusEffects.findIndex(effect => effect.type === statusType);
        if (index !== -1) {
            const removed = this.statusEffects.splice(index, 1)[0];
            this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트

            // 상대방의 런타임 스탯 즉시 업데이트 (동적 공격력 계산)
            if (this.opponent) {
                this.opponent.updateRuntimeCardStats();
            }

            return true;
        }
        return false;
    }

    hasStatusEffect(statusType) {
        return this.statusEffects.some(effect =>
            effect.type === statusType && effect.turnsLeft > 0
        );
    }

    /**
     * 발화 상태이상의 스택 수를 반환
     * @returns {number} 발화 스택 (0 = 발화 없음)
     */
    getIgnitionStacks() {
        const ignition = this.statusEffects.find(e => e.type === 'ignition' && e.turnsLeft > 0);
        return ignition?.stacks || 0;
    }

    /**
     * 발화 상태이상의 데미지 배수를 반환 (지수 증가)
     * @returns {number} 배수 (1 = 발화 없음, 3 = 1스택, 9 = 2스택, 27 = 3스택...)
     */
    getIgnitionMultiplier() {
        const stacks = this.getIgnitionStacks();
        if (stacks === 0) return 1;

        const baseMultiplier = GameConfig?.statusEffects?.ignition?.stackMultiplier || 3;
        return Math.pow(baseMultiplier, stacks);
    }

    clearAllStatusEffects() {
        this.statusEffects = [];
    }

    // 버프 관련 메서드
    addStrength(amount) {
        // 입력값 유효성 검사
        if (typeof amount !== 'number' || amount < 0) {
            console.warn('Player.addStrength: 유효하지 않은 힘 버프 값:', amount);
            return 0;
        }

        this.strength += amount;
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return amount;
    }

    getStrength() {
        // 불의 사슬 상태이상이 있으면 힘 버프 무효화
        if (this.hasStatusEffect('chains')) {
            return 0;
        }
        return this.strength;
    }

    // 망각 디버프 체크
    hasOblivionDebuff() {
        return this.hasStatusEffect('oblivion');
    }

    // 강화 버프 관련 메서드
    hasEnhanceBuff() {
        return this.enhanceTurns > 0;
    }

    addEnhanceBuff(turns) {
        this.enhanceTurns += turns;
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 집중 버프 관련 메서드
    hasFocusBuff() {
        return this.focusTurns > 0;
    }

    addFocusBuff(turns) {
        this.focusTurns += turns;
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 고속 버프 관련 메서드
    hasSpeedBuff() {
        return this.speedTurns > 0;
    }

    addSpeedBuff(bonus) {
        this.speedBonus += bonus;
        this.speedTurns = 1; // 항상 1턴

        // 즉시 현재 손패의 노멀 공격카드들에 적용
        this.hand.forEach(card => {
            if (card.type === 'attack' && card.element === 'normal') {
                // 일반 카드: activationCount + bonus
                if (card.activationCount !== null && card.activationCount !== undefined) {
                    card.modifiedActivationCount = card.activationCount + this.speedBonus;
                }
                // 랜덤 카드 (isRandomBash/isRandomHeal): bonus만 저장
                else if (card.isRandomBash || card.isRandomHeal) {
                    card.modifiedActivationCount = this.speedBonus;
                }
            }
        });

        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return bonus;
    }

    // 냄새 버프 관련 메서드
    hasScentBuff() {
        return this.scentTurns > 0;
    }

    addScentBuff(bonus) {
        this.scentBonus += bonus;
        this.scentTurns = 1; // 항상 1턴
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return bonus;
    }

    getScentBonus(element) {
        // 불 속성 공격카드일 때만 추가 대미지 반환
        if (element === 'fire' && this.hasScentBuff()) {
            const damagePerStack = GameConfig?.cardEffects?.opportunityScent?.damagePerStack || 10;
            return this.scentBonus * damagePerStack;
        }
        return 0;
    }

    // 벼리기 버프 관련 메서드
    hasSharpenBuff() {
        return this.sharpenTurns > 0;
    }

    addSharpenBuff(turns) {
        this.sharpenTurns = turns;  // 중첩 불가이므로 덮어쓰기 (카드에 중복 체크 있음)
        return turns;
    }

    // 열풍 버프 관련 메서드
    hasHotWindBuff() {
        return this.hotWindTurns > 0;
    }

    addHotWindBuff(turns) {
        this.hotWindTurns = turns;  // 중첩 불가 (덮어쓰기)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // Li⁺ 버프 관련 메서드
    hasLithiumBuff() {
        return this.lithiumTurns > 0;
    }

    addLithiumBuff(turns) {
        this.lithiumTurns += turns;  // 누적 방식 (재사용 시 턴 추가)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    getLithiumTurns() {
        return this.lithiumTurns;
    }

    // 호흡 버프 관련 메서드
    hasBreathBuff() {
        return this.breathTurns > 0;
    }

    addBreathBuff(turns) {
        this.breathTurns = turns;  // 중복 불가이므로 덮어쓰기 (1턴만 유지)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 질량 버프 관련 메서드
    hasMassBuff() {
        return this.massTurns > 0;
    }

    addMassBuff(stacks) {
        this.massBonus += stacks;
        this.massTurns = 1;  // 항상 1턴으로 고정
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return stacks;
    }

    getMassBonus(element) {
        // 물 속성 공격카드일 때만 추가 대미지 반환
        if (element === 'water' && this.hasMassBuff()) {
            const percent = GameConfig?.cardEffects?.massiveWeight?.hpPercent || 15;
            return Math.floor(this.hp * (percent / 100) * this.massBonus);
        }
        return 0;
    }

    // 급류 버프 관련 메서드
    hasTorrentBuff() {
        return this.torrentTurns > 0;
    }

    addTorrentBuff(bonus) {
        this.torrentBonus += bonus;
        this.torrentTurns = 1; // 항상 1턴

        // 즉시 현재 손패의 물 속성 공격카드들에 적용
        this.hand.forEach(card => {
            if (card.type === 'attack' && card.element === 'water') {
                // 일반 카드: activationCount + bonus
                if (card.activationCount !== null && card.activationCount !== undefined) {
                    card.modifiedActivationCount = card.activationCount + this.torrentBonus;
                }
                // 랜덤 카드 (isRandomBash/isRandomHeal): bonus만 저장
                else if (card.isRandomBash || card.isRandomHeal) {
                    card.modifiedActivationCount = this.torrentBonus;
                }
            }
        });

        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return bonus;
    }

    // 흡수 버프 관련 메서드
    hasAbsorptionBuff() {
        return this.absorptionBonus > 0; // 스테이지 내내 유지되므로 스택만 체크
    }

    addAbsorptionBuff(stacks) {
        this.absorptionBonus += stacks;
        // 스테이지 내내 유지되므로 turnsLeft는 999로 설정 (실질적으로 무한)
        this.absorptionTurns = 999;
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return stacks;
    }

    getAbsorptionHeal() {
        // 흡수 버프가 없으면 0 반환
        if (!this.hasAbsorptionBuff()) {
            return 0;
        }

        // GameConfig에서 설정 가져오기 (안전한 접근)
        const baseHeal = GameConfig?.buffs?.absorption?.effect?.baseHeal || 8;
        const wetMultiplier = GameConfig?.buffs?.absorption?.effect?.wetMultiplier || 2;

        // 기본 회복량 계산
        let healAmount = this.absorptionBonus * baseHeal;

        // 젖음 상태이면 회복량 2배
        if (this.hasStatusEffect('wet')) {
            healAmount *= wetMultiplier;
        }

        return healAmount;
    }

    // 광속 버프 관련 메서드
    hasLightSpeedBuff() {
        return this.lightSpeedTurns > 0;
    }

    addLightSpeedBuff(bonus) {
        this.lightSpeedBonus += bonus;
        this.lightSpeedTurns = 1; // 항상 1턴

        // 즉시 현재 손패의 전기 속성 공격카드들에 적용
        this.hand.forEach(card => {
            if (card.type === 'attack' && card.element === 'electric') {
                // 일반 카드: activationCount + bonus
                if (card.activationCount !== null && card.activationCount !== undefined) {
                    card.modifiedActivationCount = card.activationCount + this.lightSpeedBonus;
                }
                // 랜덤 카드 (isRandomBash/isRandomHeal): bonus만 저장
                else if (card.isRandomBash || card.isRandomHeal) {
                    card.modifiedActivationCount = this.lightSpeedBonus;
                }
            }
        });

        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return bonus;
    }

    // 초전도 버프 관련 메서드
    hasSuperConductivityBuff() {
        return this.superConductivityTurns > 0;
    }

    addSuperConductivityBuff(turns) {
        this.superConductivityTurns = turns;  // 중복 불가이므로 덮어쓰기 (1턴만 유지)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 정전기 버프 관련 메서드
    hasStaticBuff() {
        return this.staticTurns > 0;
    }

    addStaticBuff(turns) {
        this.staticTurns = turns;  // 중복 불가이므로 덮어쓰기
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 팩 버프 관련 메서드
    hasPackBuff() {
        return this.packBonus > 0;
    }

    addPackBuff(stacks) {
        this.packBonus += stacks;
        this.packTurns = 1;  // Set to 1 to indicate active
        this.updateRuntimeCardStats();
        return stacks;
    }

    getPackHeal() {
        if (!this.hasPackBuff()) {
            return 0;
        }
        const baseHeal = GameConfig?.buffs?.pack?.effect?.baseHeal || 8;
        return this.packBonus * baseHeal;
    }

    clearPackBuff() {
        this.packBonus = 0;
        this.packTurns = 0;
    }

    // 연쇄 버프 관련 메서드
    hasPropagationBuff() {
        return this.propagationBonus > 0 && this.propagationTurns > 0;
    }

    addPropagationBuff(bonus) {
        this.propagationBonus += bonus;
        this.propagationTurns = 1;  // 항상 1턴 고정

        // 독 속성 공격카드의 발동횟수 즉시 업데이트
        this.hand.forEach(card => {
            if (card.type === 'attack' && card.element === 'poison') {
                // 일반 카드: activationCount + bonus
                if (card.activationCount !== null && card.activationCount !== undefined) {
                    card.modifiedActivationCount = card.activationCount + this.propagationBonus;
                }
                // 랜덤 카드 (isRandomBash/isRandomHeal): bonus만 저장
                else if (card.isRandomBash || card.isRandomHeal) {
                    card.modifiedActivationCount = this.propagationBonus;
                }
            }
        });

        this.updateRuntimeCardStats();
        return bonus;
    }

    // 독침 버프 관련 메서드
    hasPoisonNeedleBuff() {
        return this.poisonNeedleTurns > 0;
    }

    addPoisonNeedleBuff(turns) {
        this.poisonNeedleTurns += turns;  // 턴 추가 방식 (스택 가능)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return turns;
    }

    // 유황 버프 관련 메서드
    hasSulfurBuff() {
        return this.sulfurTurns > 0;
    }

    addSulfurBuff(turns) {
        this.sulfurTurns += turns;  // 턴 추가 방식

        // ★ 선제적 정화: 이미 얼음 상태이상이 걸려있다면 즉시 제거
        const hadFrozen = this.hasStatusEffect('frozen');
        if (hadFrozen) {
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[CLEANSE] ${this.name} 유황 버프로 얼음 정화됨`);
            }
            this.removeStatusEffect('frozen');
            // removeStatusEffect 내부에서 updateRuntimeCardStats() 자동 호출됨 (자기 자신 + 상대방)
        } else {
            this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        }

        return { turns, cleansed: hadFrozen };
    }

    // 코팅 버프 관련 메서드
    hasCoatingBuff() {
        return this.coatingTurns > 0;
    }

    addCoatingBuff(turns) {
        this.coatingTurns += turns;  // 턴 추가 방식

        // ★ 선제적 정화: 이미 화상 상태이상이 걸려있다면 즉시 제거
        const hadBurn = this.hasStatusEffect('burn');
        if (hadBurn) {
            if (GameConfig?.debugMode?.showStatusEffects) {
                console.log(`[CLEANSE] ${this.name} 코팅 버프로 화상 정화됨`);
            }
            this.removeStatusEffect('burn');
            // removeStatusEffect 내부에서 updateRuntimeCardStats() 자동 호출됨 (자기 자신 + 상대방)
        } else {
            this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        }

        return { turns, cleansed: hadBurn };
    }

    // 우비 버프 관련 메서드
    hasRaincoatProtection() {
        return this.raincoatStacks > 0;
    }

    addRaincoatBuff(stacks) {
        this.raincoatStacks += stacks;  // 스택 추가 방식 (턴이 아님!)
        this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
        return stacks;
    }

    // 우비 1스택 소모 (상태이상 차단 시)
    consumeRaincoatStack() {
        if (this.raincoatStacks > 0) {
            this.raincoatStacks--;
            this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
            return true;
        }
        return false;
    }

    // 턴 시작 시 우비 버프 완전 제거 (스택 수 무관 - 한 턴만 지속)
    decrementRaincoatAtTurnStart() {
        if (this.raincoatStacks > 0) {
            const removedStacks = this.raincoatStacks;
            this.raincoatStacks = 0;  // 스택 수와 관계없이 완전 제거
            this.updateRuntimeCardStats();  // 런타임 스탯 즉시 업데이트
            return removedStacks;
        }
        return 0;
    }

    clearBuffs() {
        this.strength = 0;
        this.enhanceTurns = 0;
        this.focusTurns = 0;
        this.speedBonus = 0;
        this.speedTurns = 0;
        this.scentBonus = 0;
        this.scentTurns = 0;
        this.hotWindTurns = 0;
        this.lithiumTurns = 0;
        this.breathTurns = 0;
        this.massBonus = 0;
        this.massTurns = 0;
        this.torrentBonus = 0;
        this.torrentTurns = 0;
        this.propagationBonus = 0;
        this.propagationTurns = 0;
        this.absorptionBonus = 0;
        this.absorptionTurns = 0;
        this.lightSpeedBonus = 0;
        this.lightSpeedTurns = 0;
        this.superConductivityTurns = 0;
        this.staticTurns = 0;
        this.packBonus = 0;
        this.packTurns = 0;
        this.poisonNeedleTurns = 0;
    }

    // 런타임 카드 스탯 업데이트 (버프/상태이상 반영)
    updateRuntimeCardStats(opponent) {
        if (!this.hand) return;

        // 성능 최적화: throttle 적용
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottleMs) {
            // 이미 pending 상태가 아니면 다음 프레임에 실행 예약
            if (!this.pendingUpdate) {
                this.pendingUpdate = true;
                requestAnimationFrame(() => {
                    this.pendingUpdate = false;
                    this.lastUpdateTime = Date.now();
                    this._doUpdateRuntimeCardStats(opponent);
                });
            }
            return;
        }

        this.lastUpdateTime = now;
        this._doUpdateRuntimeCardStats(opponent);
    }

    // 실제 업데이트 로직 (내부 메서드)
    _doUpdateRuntimeCardStats(opponent) {
        if (!this.hand) return;

        // opponent 파라미터가 전달되면 사용, 아니면 this.opponent 사용 (폴백)
        const target = opponent || this.opponent;

        this.hand.forEach(card => {
            // 공격력 계산 (공격 카드만)
            if (card.type === 'attack') {
                let buffedPower = card.power;

                // ★ 1단계: 정전기 버프 적용 (전기 속성만, 가장 먼저!)
                if (card.element === 'electric' && this.hasStaticBuff()) {
                    const electricCount = this.hand.filter(c => c.element === 'electric').length;
                    const damagePerCard = GameConfig?.buffs?.static?.effect?.damagePerCard || 1;
                    buffedPower += electricCount * damagePerCard;
                }

                // ★ 2단계: 힘 버프 적용 (+1/스택)
                buffedPower += this.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1);

                // ★ 3단계: 조건부 곱셈 (정전기 + 힘 포함한 상태에서 곱셈)

                // freezing_wind 카드: 적의 젖음 잔여 턴 × 10 (동적 계산)
                if (card.id === 'freezing_wind' && target) {
                    const wetEffect = target.statusEffects?.find(e => e.type === 'wet');
                    const wetTurns = wetEffect ? wetEffect.turnsLeft : 0;
                    buffedPower = wetTurns * 10;

                    // 조건 미충족 시 버프 계산 건너뛰기 (질량 버프 등 미적용)
                    if (wetTurns === 0) {
                        card.buffedPower = 0;
                        return;
                    }
                    // 조건 충족 시 계속 진행하여 버프 적용
                }

                // toxic_blast 카드: 적의 중독 잔여 턴 × 1 (동적 계산)
                if (card.id === 'toxic_blast' && target) {
                    const poisonedEffect = target.statusEffects?.find(e => e.type === 'poisoned');
                    const poisonedTurns = poisonedEffect ? poisonedEffect.turnsLeft : 0;
                    buffedPower = poisonedTurns * (GameConfig?.cardEffects?.toxicBlast?.damagePerTurn || 1);

                    // 조건 미충족 시 버프 계산 건너뛰기 (질량 버프 등 미적용)
                    if (poisonedTurns === 0) {
                        card.buffedPower = 0;
                        return;
                    }
                    // 조건 충족 시 계속 진행하여 버프 적용
                }

                // electric_shock 카드: 적이 젖음 상태일 때 3배 곱셈 (정전기 + 힘 포함)
                if (card.id === 'electric_shock' && target) {
                    const hasWet = target.hasStatusEffect('wet');
                    if (hasWet) {
                        buffedPower = buffedPower * 3;
                    }
                    // 젖음 아닐 때는 그대로 유지 (정전기 + 힘만 반영됨)
                }

                // overload 카드: 적이 화상 상태일 때 2배 곱셈 (정전기 + 힘 포함)
                if (card.id === 'overload' && target) {
                    const hasBurn = target.hasStatusEffect('burn');
                    if (hasBurn) {
                        buffedPower = buffedPower * 2;
                    }
                    // 화상 아닐 때는 그대로 유지 (정전기 + 힘만 반영됨)
                }

                // short_circuit 카드: 적이 마비 상태일 때 10배 곱셈 (정전기 + 힘 포함)
                if (card.id === 'short_circuit' && target) {
                    const hasParalysis = target.hasStatusEffect('paralysis');
                    if (hasParalysis) {
                        buffedPower = buffedPower * 10;
                    }
                    // 마비 아닐 때는 그대로 유지 (정전기 + 힘만 반영됨)
                }

                // 발화 상태 추가 데미지 (불 공격 카드만, 적이 발화 상태일 때 3^stacks 배)
                if (card.element === 'fire' && card.type === 'attack' && target) {
                    const multiplier = target.getIgnitionMultiplier();
                    if (multiplier > 1) {
                        buffedPower = Math.floor(buffedPower * multiplier);
                    }
                    // 발화 없을 때는 그대로 유지 (multiplier === 1)
                }

                // ice_breaker 카드: 적이 frozen 상태일 때 적 최대 HP의 20% (고정 피해)
                if (card.id === 'ice_breaker' && target) {
                    const hasFrozen = target.hasStatusEffect('frozen');
                    buffedPower = hasFrozen ? Math.floor(target.maxHP * 0.2) : 0;
                    card.buffedPower = buffedPower;
                    return; // 고정 피해이므로 버프 계산 건너뛰기
                }

                // shield_bash 카드: 자신의 현재 방어력만큼 피해 (동적 계산)
                if (card.id === 'shield_bash') {
                    buffedPower = this.defense || 0;  // 현재 방어력
                    // 이후 일반 버프 계산 계속 진행 (속성 → 강화 → Li⁺)
                }

                // counter_attack 카드: 마지막 받은 대미지의 2배 (동적 계산)
                if (card.id === 'counter_attack') {
                    buffedPower = (this.lastDamageTaken || 0) * 2;
                    // 이후 일반 버프 계산 계속 진행 (힘 → 강화)
                }

                // ★ 4단계: 속성 보너스 덧셈

                // 냄새 버프 적용 (불 속성만)
                buffedPower += this.getScentBonus(card.element);

                // 질량 버프 적용 (물 속성만, 현재 HP의 15% × 스택)
                buffedPower += this.getMassBonus(card.element);

                // ★ 5단계: 열풍 버프 적용 (불 속성만, 곱셈)
                if (card.element === 'fire' && this.hasHotWindBuff()) {
                    const fireAttackCount = this.hand.filter(c =>
                        c.type === 'attack' && c.element === 'fire'
                    ).length;
                    if (fireAttackCount > 0) {
                        buffedPower = Math.floor(buffedPower * fireAttackCount);
                    }
                }

                // ★ 6단계: 최종 곱셈 버프들
                // 강화 버프 적용 (1.5배)
                if (this.hasEnhanceBuff()) {
                    buffedPower = Math.floor(buffedPower * (GameConfig?.constants?.multipliers?.buffMultiplier || 1.5));
                }

                // Li⁺ 버프 적용 (불, 전기 속성 공격 카드, 턴수만큼 곱셈)
                if ((card.element === 'fire' || card.element === 'electric') && this.hasLithiumBuff && this.hasLithiumBuff()) {
                    const lithiumMultiplier = this.getLithiumTurns();
                    buffedPower = Math.floor(buffedPower * lithiumMultiplier);
                }

                card.buffedPower = buffedPower;
            } else if (card.type === 'heal') {
                // 회복 카드 처리
                let buffedHealAmount = card.healAmount || card.power || 0;

                // skin_breathing 카드: 젖음 상태일 때 3배
                if (card.id === 'skin_breathing') {
                    const hasWet = this.hasStatusEffect('wet');
                    buffedHealAmount = hasWet ? buffedHealAmount * 3 : buffedHealAmount;
                }

                // healing_spring 카드: 젖음 상태일 때만 회복 (0 → 10)
                if (card.id === 'healing_spring') {
                    const hasWet = this.hasStatusEffect('wet');
                    buffedHealAmount = hasWet ? (GameConfig?.cardEffects?.healingSpring?.healAmount || 10) : 0;
                }

                // liquify 카드: 잃은 체력의 일정 비율 회복 (실시간 동적 계산, 최소 1)
                if (card.id === 'liquify') {
                    const lostHP = this.maxHP - this.hp;
                    const healPercent = GameConfig?.cardEffects?.liquify?.healPercent || 10;
                    buffedHealAmount = Math.max(1, Math.floor(lostHP * (healPercent / 100)));
                }

                // slash_water 카드: 마지막 받은 피해만큼 회복 (실시간 동적 계산)
                if (card.id === 'slash_water') {
                    buffedHealAmount = this.lastDamageTaken || 0;
                }

                // gas_absorption 카드: 적의 중독 잔여 턴 × 1 (동적 계산)
                if (card.id === 'gas_absorption' && target) {
                    const poisonedEffect = target.statusEffects?.find(e => e.type === 'poisoned');
                    const poisonedTurns = poisonedEffect ? poisonedEffect.turnsLeft : 0;
                    buffedHealAmount = poisonedTurns * (GameConfig?.cardEffects?.gasAbsorption?.healPerTurn || 1);

                    // 조건 미충족 시 버프 계산 건너뛰기
                    if (poisonedTurns === 0) {
                        card.buffedPower = 0;
                        return;
                    }
                }

                // 향후 회복 관련 버프 추가 가능 (예: 회복량 증가 버프)

                card.buffedPower = buffedHealAmount;  // power에 할당하여 UI 통합
            } else if (card.type === 'defense') {
                // 방어 카드 동적 방어력 계산
                let buffedDefense = card.power || 0;

                // conductive_armor 카드: 상대방의 현재 방어력만큼 방어력 획득
                if (card.id === 'conductive_armor' && target) {
                    buffedDefense = target.defense || 0;
                    card.buffedPower = buffedDefense;
                    return;
                }

                // high_voltage_gloves 카드: 상대가 마비 상태일 경우 15 방어력 획득
                if (card.id === 'high_voltage_gloves' && target) {
                    const hasParalysis = target.hasStatusEffect('paralysis');
                    buffedDefense = hasParalysis ? 15 : 0;
                    card.buffedPower = buffedDefense;
                    return;
                }

                // mirror_reaction 카드: 상대의 중독 잔여 턴수만큼 방어력 획득
                if (card.id === 'mirror_reaction' && target) {
                    const poisonEffect = target.statusEffects?.find(e => e.type === 'poisoned');
                    const poisonTurns = poisonEffect ? poisonEffect.turnsLeft : 0;
                    buffedDefense = poisonTurns;
                    card.buffedPower = buffedDefense;
                    return;
                }

                // 일반 방어 카드는 buffedPower 초기화
                card.buffedPower = undefined;
            } else {
                // 버프/상태이상 카드는 buffedPower 초기화
                card.buffedPower = undefined;
            }

            // 명중률 계산 (Card.checkAccuracy 로직과 동일)
            let modifiedAccuracy = card.accuracy;

            // 모래 상태이상 체크 (공격 카드만) - 곱셈 방식으로 감소 (소수점 버림)
            if (card.type === 'attack' && this.hasStatusEffect('sand')) {
                const sandEffect = this.statusEffects.find(e => e.type === 'sand');
                if (sandEffect) {
                    modifiedAccuracy = Math.max(0, Math.floor(modifiedAccuracy * (1 - sandEffect.power / 100)));
                }
            }

            // 모욕 상태이상 체크 (방어 카드만) - 곱셈 방식으로 감소 (소수점 버림)
            if (card.type === 'defense' && this.hasStatusEffect('insult')) {
                const insultEffect = this.statusEffects.find(e => e.type === 'insult');
                if (insultEffect) {
                    modifiedAccuracy = Math.max(0, Math.floor(modifiedAccuracy * (1 - insultEffect.power / 100)));
                }
            }

            // 둔화 상태이상 체크 (상태이상 카드만) - 곱셈 방식으로 감소 (소수점 버림)
            if (card.type === 'status' && this.hasStatusEffect('slow')) {
                const slowEffect = this.statusEffects.find(e => e.type === 'slow');
                if (slowEffect) {
                    modifiedAccuracy = Math.max(0, Math.floor(modifiedAccuracy * (1 - slowEffect.power / 100)));
                }
            }

            // 얼음 상태이상 체크 (공격 카드만) - 곱셈 방식으로 감소 (소수점 버림)
            if (card.type === 'attack' && this.hasStatusEffect('frozen')) {
                const frozenEffect = this.statusEffects.find(e => e.type === 'frozen');
                if (frozenEffect) {
                    modifiedAccuracy = Math.max(0, Math.floor(modifiedAccuracy * (1 - frozenEffect.power / 100)));
                }
            }

            // 집중 버프 체크 (노멀 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
            if (card.type === 'attack' && card.element === 'normal' && this.hasFocusBuff()) {
                const focusEffect = GameConfig?.buffs?.focus?.effect?.accuracy || 30; // 30%
                modifiedAccuracy = Math.floor(modifiedAccuracy * (1 + focusEffect / 100));
            }

            // 호흡 버프 체크 (불 속성 버프 카드만) - 발동률 100% 보장
            if (card.type === 'buff' && card.element === 'fire' && this.hasBreathBuff()) {
                modifiedAccuracy = 100;
            }

            // 초전도 버프 체크 (전기 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
            if (card.type === 'attack' && card.element === 'electric' && this.hasSuperConductivityBuff()) {
                const superConductivityEffect = GameConfig?.buffs?.superConductivity?.effect?.accuracy || 40; // 40%
                modifiedAccuracy = Math.floor(modifiedAccuracy * (1 + superConductivityEffect / 100));
            }

            // 독침 버프 체크 (독 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
            if (card.type === 'attack' && card.element === 'poison' && this.hasPoisonNeedleBuff()) {
                const poisonNeedleEffect = GameConfig?.buffs?.poisonNeedle?.effect?.accuracy || 20; // 20%
                modifiedAccuracy = Math.floor(modifiedAccuracy * (1 + poisonNeedleEffect / 100));
            }

            // 명중률 상한 100% 제한
            modifiedAccuracy = Math.min(100, modifiedAccuracy);

            card.modifiedAccuracy = modifiedAccuracy;
        });
    }

    // 턴 관련 메서드
    startTurn() {
        this.turn++;
        this.currentCardIndex = 0;
        this.cardsActivatedThisTurn = 0;

        // 턴 시작 시 랜덤 발동 카드 activationCount 리셋 (마구때리기, 영양제 등)
        this.hand.forEach(card => {
            if (card.isRandomBash || card.isRandomHeal) {
                // Random activation 카드는 activationCount를 null로 설정 (지연 초기화 - 발동 시점에 결정)
                card.activationCount = null;
                card.currentActivations = 0;
            } else {
                // 일반 카드들은 currentActivations만 리셋
                card.currentActivations = 0;
            }

            // 망각 상태가 아닐 때만 발동횟수 버프 적용
            if (!this.hasOblivionDebuff()) {
                // 일반 카드: activationCount + bonus
                if (card.activationCount !== null && card.activationCount !== undefined) {
                    // 고속 버프 적용 (노멀 공격카드만)
                    if (this.hasSpeedBuff() && card.type === 'attack' && card.element === 'normal') {
                        card.modifiedActivationCount = card.activationCount + this.speedBonus;
                    }
                    // 급류 버프 적용 (물 속성 공격카드만)
                    else if (this.hasTorrentBuff() && card.type === 'attack' && card.element === 'water') {
                        card.modifiedActivationCount = card.activationCount + this.torrentBonus;
                    }
                    // 광속 버프 적용 (전기 속성 공격카드만)
                    else if (this.hasLightSpeedBuff() && card.type === 'attack' && card.element === 'electric') {
                        card.modifiedActivationCount = card.activationCount + this.lightSpeedBonus;
                    }
                    // 연쇄 버프 적용 (독 속성 공격카드만)
                    else if (this.hasPropagationBuff() && card.type === 'attack' && card.element === 'poison') {
                        card.modifiedActivationCount = card.activationCount + this.propagationBonus;
                    }
                    else {
                        // 버프가 없거나 적용 대상이 아닌 경우 초기화
                        card.modifiedActivationCount = undefined;
                    }
                }
                // 랜덤 카드 (isRandomBash/isRandomHeal): bonus만 저장
                else if (card.isRandomBash || card.isRandomHeal) {
                    // activationCount가 이미 결정된 경우 (카드 발동 중) modifiedActivationCount 재설정 방지
                    if (card.activationCount === null) {
                        // 고속 버프 적용 (노멀 공격카드만)
                        if (this.hasSpeedBuff() && card.type === 'attack' && card.element === 'normal') {
                            card.modifiedActivationCount = this.speedBonus;
                        }
                        // 급류 버프 적용 (물 속성 공격카드만)
                        else if (this.hasTorrentBuff() && card.type === 'attack' && card.element === 'water') {
                            card.modifiedActivationCount = this.torrentBonus;
                        }
                        // 광속 버프 적용 (전기 속성 공격카드만)
                        else if (this.hasLightSpeedBuff() && card.type === 'attack' && card.element === 'electric') {
                            card.modifiedActivationCount = this.lightSpeedBonus;
                        }
                        // 연쇄 버프 적용 (독 속성 공격카드만)
                        else if (this.hasPropagationBuff() && card.type === 'attack' && card.element === 'poison') {
                            card.modifiedActivationCount = this.propagationBonus;
                        }
                        else {
                            // 버프가 없거나 적용 대상이 아닌 경우 초기화
                            card.modifiedActivationCount = undefined;
                        }
                    }
                    // activationCount가 이미 결정된 경우: modifiedActivationCount 유지 (재설정 안함)
                }
                else {
                    // activationCount가 없는 특수 카드 (버프 적용 불가)
                    card.modifiedActivationCount = undefined;
                }
            } else {
                // 망각 상태일 때는 모든 발동횟수 버프 무시 (기본값 사용)
                card.modifiedActivationCount = undefined;
            }
        });

        // 벼리기 버프 턴수 차감은 BattleSystem.startTurn()에서 처리 (UI 동기화를 위해)
        // 화상 데미지도 BattleSystem에서 처리

        // 런타임 스탯 업데이트 (버프/상태이상이 변경되었으므로)
        this.updateRuntimeCardStats();
    }

    endTurn() {
        // 독 데미지는 BattleSystem에서 처리하므로 여기서는 제외
        // 상태이상 지속시간 감소
        this.updateStatusEffects();

        // 강화 버프 턴수 차감
        if (this.enhanceTurns > 0) {
            this.enhanceTurns--;
        }

        // 집중 버프 턴수 차감
        if (this.focusTurns > 0) {
            this.focusTurns--;
        }

        // 고속 버프 턴수 차감
        if (this.speedTurns > 0) {
            this.speedTurns--;
            if (this.speedTurns === 0) {
                this.speedBonus = 0;
                // 버프 해제 시 모든 카드의 modifiedActivationCount 초기화
                this.hand.forEach(card => {
                    if (card.type === 'attack' && card.element === 'normal') {
                        card.modifiedActivationCount = undefined;
                    }
                });
            }
        }

        // 냄새 버프 턴수 차감
        if (this.scentTurns > 0) {
            this.scentTurns--;
            if (this.scentTurns === 0) {
                this.scentBonus = 0;
            }
        }

        // 열풍 버프 턴수 차감
        if (this.hotWindTurns > 0) {
            this.hotWindTurns--;
        }

        // Li⁺ 버프 턴수 차감
        if (this.lithiumTurns > 0) {
            this.lithiumTurns--;
        }

        // 호흡 버프 턴수 차감
        if (this.breathTurns > 0) {
            this.breathTurns--;
        }

        // 질량 버프 턴수 차감 (1턴 고정, 스택과 무관하게 제거)
        if (this.massTurns > 0) {
            this.massTurns--;
            if (this.massTurns === 0) {
                this.massBonus = 0;  // 스택도 함께 초기화
            }
        }

        // 급류 버프 턴수 차감
        if (this.torrentTurns > 0) {
            this.torrentTurns--;
            if (this.torrentTurns === 0) {
                this.torrentBonus = 0;
                // 버프 해제 시 모든 카드의 modifiedActivationCount 초기화
                this.hand.forEach(card => {
                    if (card.type === 'attack' && card.element === 'water') {
                        card.modifiedActivationCount = undefined;
                    }
                });
            }
        }

        // 광속 버프 턴수 차감
        if (this.lightSpeedTurns > 0) {
            this.lightSpeedTurns--;
            if (this.lightSpeedTurns === 0) {
                this.lightSpeedBonus = 0;
                // 버프 해제 시 모든 카드의 modifiedActivationCount 초기화
                this.hand.forEach(card => {
                    if (card.type === 'attack' && card.element === 'electric') {
                        card.modifiedActivationCount = undefined;
                    }
                });
            }
        }

        // 연쇄 버프 턴수 차감
        if (this.propagationTurns > 0) {
            this.propagationTurns--;
            if (this.propagationTurns === 0) {
                this.propagationBonus = 0;
                // 버프 해제 시 모든 카드의 modifiedActivationCount 초기화
                this.hand.forEach(card => {
                    if (card.type === 'attack' && card.element === 'poison') {
                        card.modifiedActivationCount = undefined;
                    }
                });
            }
        }

        // 초전도 버프 턴수 차감
        if (this.superConductivityTurns > 0) {
            this.superConductivityTurns--;
        }

        // 정전기 버프 턴수 차감
        if (this.staticTurns > 0) {
            this.staticTurns--;
        }

        // 독침 버프 턴수 차감
        if (this.poisonNeedleTurns > 0) {
            this.poisonNeedleTurns--;
        }

        // 런타임 스탯 업데이트 (버프가 차감되었으므로)
        this.updateRuntimeCardStats();
    }

    // 다음 발동할 카드 가져오기
    getNextCard() {
        if (this.currentCardIndex >= this.hand.length) {
            return null; // 모든 카드 발동 완료
        }

        return this.hand[this.currentCardIndex];
    }

    // 카드 발동 후 인덱스 증가
    advanceCardIndex() {
        this.currentCardIndex++;
        this.cardsActivatedThisTurn++;
    }

    // 턴 완료 여부 체크
    isTurnComplete() {
        return this.currentCardIndex >= this.hand.length;
    }

    // 상태이상 처리
    processStatusEffect(statusType, timing) {
        const effect = this.statusEffects.find(e => e.type === statusType);
        if (!effect) return;

        switch (statusType) {
            case 'burn':
                if (timing === 'start') {
                    const damage = Math.floor(this.maxHP * effect.power / 100);
                    this.takeDamage(damage);
                }
                break;

            case 'poisoned':
                if (timing === 'end') {
                    const damage = Math.floor(this.maxHP * effect.power / 100);
                    this.takeDamage(damage);
                }
                break;

            case 'paralysis':
                if (timing === 'start') {
                    // 마비 확률 체크는 BattleSystem에서 처리
                    return Math.random() * 100 < effect.power;
                }
                break;
        }

        return false;
    }

    // 상태이상 지속시간 업데이트
    updateStatusEffects() {
        this.statusEffects = this.statusEffects.filter(effect => {
            if (effect.turnsLeft > 0) {
                effect.turnsLeft--;
                return effect.turnsLeft > 0;
            }
            return effect.turnsLeft === -1; // 영구 상태이상
        });

        // 상태이상 턴수 변동/제거 시 상대방 스탯 즉시 업데이트 (동적 공격력 계산)
        if (this.opponent) {
            this.opponent.updateRuntimeCardStats();
        }
    }

    // 턴에서 발동 가능한 카드 필터링 (상태이상 고려)
    getActivatableCards() {
        if (this.hasStatusEffect('stun')) {
            return []; // 기절 시 카드 발동 불가
        }

        let cards = this.hand;
        if (this.hasStatusEffect('taunt')) {
            cards = cards.filter(card => card.type === 'attack'); // 도발 시 공격 카드만
        }

        // 6장 이상일 때 발동 순서 조정 (플레이어와 적 모두 동일)
        if (cards.length >= 6) {
            const newCards = cards.slice(0, cards.length - 5);  // 새 카드들
            const oldCards = cards.slice(cards.length - 5);     // 기존 5장
            return [...newCards, ...oldCards];
        }

        return cards; // 정상 상태
    }

    // 플레이어 정보 반환
    getInfo() {
        return {
            name: this.name,
            hp: this.hp,
            maxHP: this.maxHP,
            turn: this.turn,
            defenseElement: this.defenseElement,
            handSize: this.hand.length,
            statusEffects: this.statusEffects.map(effect => ({
                type: effect.type,
                power: effect.power,
                turnsLeft: effect.turnsLeft
            }))
        };
    }

    // 디버깅용 문자열 변환
    toString() {
        return `${this.name}(HP: ${this.hp}/${this.maxHP}, Turn: ${this.turn}, Cards: ${this.hand.length})`;
    }
}

// 전역 객체로 등록
window.Player = Player;