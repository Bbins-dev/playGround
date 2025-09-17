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
        // 스테이지가 높을수록 HP 증가
        const hpMultiplier = 1 + (this.stage - 1) * 0.3;
        this.maxHP = Math.floor(GameConfig.enemy.startingHP * hpMultiplier);
        this.hp = this.maxHP;

        // 스테이지별 이름 설정
        this.name = this.generateEnemyName();

        console.log(`스테이지 ${this.stage} 적 생성: ${this.name} (HP: ${this.hp})`);
    }

    // 적 이름 생성
    generateEnemyName() {
        const enemyNames = [
            '훈련용 허수아비',
            '야생 늑대',
            '오크 전사',
            '어둠의 마법사',
            '고블린 왕',
            '화염 골렘',
            '독 거미',
            '전기 엘리멘탈',
            '얼음 거인',
            '드래곤 새끼',
            '언데드 기사',
            '암흑 마도사',
            '크리스탈 골렘',
            '화염 드레이크',
            '최종 보스'
        ];

        const index = Math.min(this.stage - 1, enemyNames.length - 1);
        return enemyNames[index];
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
        console.log(`${this.name} 덱 구성 완료: ${this.hand.length}장`);
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
                console.log(`${this.name}이(가) ${statusType}에 저항했습니다!`);
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

        console.log(`${this.name}이(가) 특수 능력을 사용했습니다!`);

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