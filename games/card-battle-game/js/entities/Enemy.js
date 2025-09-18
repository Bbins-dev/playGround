// 적 클래스 정의 (Player 클래스를 상속)

class Enemy extends Player {
    constructor(name = 'Enemy', stage = 1) {
        super(name, false); // isPlayer = false

        // 적 전용 설정
        this.stage = stage;
        this.maxHP = GameConfig.enemy.startingHP;
        this.hp = this.maxHP;
        this.maxHandSize = GameConfig.enemy.maxHandSize;
        this.defenseElement = GameConfig.enemy.defaultDefenseElement;

        // 적 AI 설정
        this.aiType = 'basic';
        this.difficulty = this.calculateDifficulty();

        // 적 스테이지별 특성
        this.setupStageCharacteristics();
    }

    // 스테이지별 난이도 계산
    calculateDifficulty() {
        return Math.min(1 + (this.stage - 1) * 0.2, 3.0); // 최대 3배 난이도
    }

    // 스테이지별 특성 설정
    setupStageCharacteristics() {
        // 1-30스테이지는 HP 10으로 고정
        if (this.stage <= 30) {
            this.maxHP = GameConfig.enemy.startingHP; // 10으로 고정
        } else {
            // 31스테이지 이후는 기존 방식
            const hpMultiplier = 1 + (this.stage - 31) * 0.3;
            this.maxHP = Math.floor(GameConfig.enemy.startingHP * hpMultiplier);
        }
        this.hp = this.maxHP;

        // 스테이지별 이름 설정
        this.name = this.generateEnemyName();

    }

    // 적 이름 생성 (다국어 지원)
    generateEnemyName() {
        // 스테이지 번호를 30개 범위 내로 제한
        const enemyStage = Math.min(this.stage, 30);

        // i18n 시스템을 통해 적 이름 가져오기
        const nameKey = `auto_battle_card_game.ui.enemy_names.${enemyStage}`;

        // 전역 i18n 함수가 있는지 확인하고 사용
        if (typeof window.i18n !== 'undefined' && window.i18n.t) {
            return window.i18n.t(nameKey);
        }

        // i18n이 로드되지 않은 경우 기본 이름 반환
        const fallbackNames = {
            1: "Training Dummy", 2: "Wooden Puppet", 3: "Straw Monster", 4: "Practice Golem", 5: "Beginner's Nightmare",
            6: "Hungry Wolf", 7: "Enraged Boar", 8: "Poison Fang Snake", 9: "Shadow Leopard", 10: "Forest Predator",
            11: "Apprentice Mage", 12: "Fire Caster", 13: "Ice Witch", 14: "Lightning Summoner", 15: "Elemental Master",
            16: "Zombie Soldier", 17: "Skeleton Archer", 18: "Ghost Knight", 19: "Lich Priest", 20: "Death Lord",
            21: "Dragon Hatchling", 22: "Fire Drake", 23: "Frost Wyvern", 24: "Storm Dragon", 25: "Ancient Dragon King",
            26: "Fallen Hero", 27: "Betrayer Knight Captain", 28: "Demon Summoner", 29: "Avatar of Chaos", 30: "Final Examiner"
        };

        return fallbackNames[enemyStage] || `Enemy ${enemyStage}`;
    }

    // 적 덱 구성 (스테이지별)
    buildDeck() {
        this.hand = [];

        // 1~30스테이지는 마구때리기 카드로 시작 (테스트용)
        if (this.stage <= 30) {
            const basicCard = CardDatabase.createCardInstance('random_bash');
            if (basicCard) {
                this.addCard(basicCard);
            }
        } else {
            // 31스테이지 이후는 추후 변경 예정
            const basicCard = CardDatabase.createCardInstance('bash');
            if (basicCard) {
                this.addCard(basicCard);
            }
        }

        this.updateDefenseElement();
    }

    // 적 AI 행동 (현재는 기본 자동 발동)
    // 추후 AI 로직 추가 가능
    makeDecision() {
        // 현재는 단순히 왼쪽부터 순서대로 발동
        // 향후 AI 복잡도에 따라 전략적 카드 선택 가능
        return 'auto';
    }

    // 적이 받을 추가 보너스 (스테이지별 난이도 조정)
    applyStageBonus(damage) {
        // 높은 스테이지에서는 공격력 보너스
        if (this.stage > 5) {
            return Math.floor(damage * 1.2);
        }
        return damage;
    }

    // 적 전용 상태이상 저항력
    addStatusEffect(statusType, power = null, duration = null) {
        // 높은 스테이지 적은 일부 상태이상에 저항력 보유
        if (this.stage > 3) {
            const resistance = Math.min(0.3, (this.stage - 3) * 0.1);
            if (Math.random() < resistance) {
                return false;
            }
        }

        return super.addStatusEffect(statusType, power, duration);
    }

    // 적 정보 반환 (Player 클래스 확장)
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            stage: this.stage,
            difficulty: this.difficulty,
            aiType: this.aiType
        };
    }

    // 스테이지 클리어 시 보상 계산
    calculateRewards() {
        // 기본 경험치 + 스테이지 보너스
        const baseReward = 100;
        const stageBonus = this.stage * 50;
        const difficultyBonus = Math.floor(this.difficulty * 100);

        return {
            experience: baseReward + stageBonus + difficultyBonus,
            stage: this.stage,
            enemyName: this.name
        };
    }

    // 적 특수 능력 (스테이지별)
    hasSpecialAbility() {
        return this.stage > 2;
    }

    useSpecialAbility() {
        if (!this.hasSpecialAbility()) return null;


        return {
            used: true,
            effect: 'placeholder'
        };
    }

    // 디버깅용 문자열 변환
    toString() {
        return `${this.name}(Stage: ${this.stage}, HP: ${this.hp}/${this.maxHP}, Turn: ${this.turn}, Cards: ${this.hand.length})`;
    }
}

// 전역 객체로 등록
window.Enemy = Enemy;