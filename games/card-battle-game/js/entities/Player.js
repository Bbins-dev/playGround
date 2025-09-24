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

        // 턴 관련
        this.currentCardIndex = 0;
        this.cardsActivatedThisTurn = 0;
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

        // 방어력 먼저 소모 (보호막 방식)
        if (this.defense > 0 && remainingDamage > 0) {
            const defenseAbsorbed = Math.min(this.defense, remainingDamage);
            this.defense -= defenseAbsorbed;
            remainingDamage -= defenseAbsorbed;
        }

        // 남은 대미지를 HP에 적용
        if (remainingDamage > 0) {
            this.hp = Math.max(0, this.hp - remainingDamage);
        }

        const actualDamage = previousHP - this.hp;

        // 마지막 받은 대미지 기록
        this.lastDamageTaken = actualDamage;

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

        // 면역 체크
        if (GameConfig.utils.isImmuneToStatus(this.defenseElement, statusType)) {
            return { success: false, reason: 'immune' };
        }

        // 중복 상태이상 체크
        if (this.hasStatusEffect(statusType)) {
            return { success: false, duplicate: true, statusType: statusType };
        }

        const statusConfig = GameConfig.statusEffects[statusType];
        if (!statusConfig) {
            console.warn('Player.addStatusEffect: 존재하지 않는 상태이상:', statusType);
            return { success: false, reason: 'invalid_status' };
        }

        const statusEffect = {
            type: statusType,
            power: power || statusConfig.defaultPercent || statusConfig.defaultChance || 0,
            duration: duration || statusConfig.duration || -1, // -1은 영구
            turnsLeft: duration || statusConfig.duration || -1
        };

        this.statusEffects.push(statusEffect);
        return { success: true };
    }

    removeStatusEffect(statusType) {
        const index = this.statusEffects.findIndex(effect => effect.type === statusType);
        if (index !== -1) {
            const removed = this.statusEffects.splice(index, 1)[0];
            return true;
        }
        return false;
    }

    hasStatusEffect(statusType) {
        return this.statusEffects.some(effect => effect.type === statusType);
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
        return amount;
    }

    getStrength() {
        return this.strength;
    }

    clearBuffs() {
        this.strength = 0;
    }

    // 턴 관련 메서드
    startTurn() {
        this.turn++;
        this.currentCardIndex = 0;
        this.cardsActivatedThisTurn = 0;

        // 턴 시작 시 마구때리기 카드 activationCount 리셋
        this.hand.forEach(card => {
            if (card.isRandomBash && card.getRandomActivationCount) {
                card.activationCount = card.getRandomActivationCount();
                card.currentActivations = 0;
            } else {
                // 일반 카드들은 currentActivations만 리셋
                card.currentActivations = 0;
            }
        });


        // 턴 시작 시 상태이상 처리 (화상)
        this.processStatusEffect('burn', 'start');

    }

    endTurn() {
        // 독 데미지는 BattleSystem에서 처리하므로 여기서는 제외
        // 상태이상 지속시간 감소
        this.updateStatusEffects();

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