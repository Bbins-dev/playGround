// 카드 클래스 정의

class Card {
    constructor(cardData) {
        // 기본 카드 정보
        this.id = cardData.id;
        this.nameKey = cardData.nameKey; // i18n 키
        this.name = cardData.name || this.id; // 백업용
        this.type = cardData.type;
        this.element = cardData.element;
        this.power = cardData.power;
        this.accuracy = cardData.accuracy || 100;
        this.cost = cardData.cost || 1;
        this.activationCount = cardData.activationCount || 1;
        this.descriptionKey = cardData.descriptionKey; // i18n 키
        this.description = cardData.description || ''; // 백업용

        // 카드 효과 (함수)
        this.effect = cardData.effect || this.defaultEffect;

        // 현재 상태
        this.currentActivations = 0;
        this.isActive = true;
    }

    // 기본 효과 (오버라이드 가능)
    defaultEffect(user, target, battleSystem) {
        return {
            success: true,
            message: `${this.name} 발동!`,
            damage: 0
        };
    }

    // 카드 발동
    activate(user, target, battleSystem) {
        try {
            // 명중률 체크
            if (!this.checkAccuracy()) {
                return {
                    success: false,
                    message: `${this.name} 빗나감!`,
                    damage: 0
                };
            }

            // 카드 효과 실행
            const result = this.effect.call(this, user, target, battleSystem);

            // 발동 횟수 증가
            this.currentActivations++;

            return result;
        } catch (error) {
            return {
                success: false,
                message: `${this.name} 발동 실패`,
                damage: 0
            };
        }
    }

    // 명중률 체크
    checkAccuracy() {
        return Math.random() * 100 < this.accuracy;
    }

    // 현재 언어에 맞는 카드 이름 가져오기
    getDisplayName() {
        if (this.nameKey && typeof getI18nText === 'function') {
            return getI18nText(this.nameKey) || this.name;
        }
        return this.name;
    }

    // 현재 언어에 맞는 카드 설명 가져오기
    getDisplayDescription() {
        if (this.descriptionKey && typeof getI18nText === 'function') {
            return getI18nText(this.descriptionKey) || this.description;
        }
        return this.description;
    }

    // 카드 정보 반환
    getInfo() {
        return {
            id: this.id,
            name: this.getDisplayName(),
            type: this.type,
            element: this.element,
            power: this.power,
            accuracy: this.accuracy,
            cost: this.cost,
            activationCount: this.activationCount,
            description: this.getDisplayDescription()
        };
    }

    // 카드 색상 가져오기 (속성별)
    getColor() {
        const element = GameConfig.elements[this.element];
        return element ? element.color : GameConfig.colors.text;
    }

    // 카드 이모지 가져오기 (속성별)
    getEmoji() {
        const element = GameConfig.elements[this.element];
        return element ? element.emoji : '⭐';
    }

    // 카드 타입 색상 가져오기
    getTypeColor() {
        const type = GameConfig.cardTypes[this.type];
        return type ? type.color : GameConfig.colors.textShadow;
    }

    // 카드가 발동 가능한지 체크
    canActivate() {
        return this.isActive && this.currentActivations < this.activationCount;
    }

    // 카드 복사 (새 인스턴스 생성)
    clone() {
        return new Card(this.getInfo());
    }

    // 카드 리셋 (발동 횟수 초기화)
    reset() {
        this.currentActivations = 0;
        this.isActive = true;
    }

    // 디버깅용 문자열 변환
    toString() {
        return `${this.name}(${this.type}, ${this.element}, ${this.power})`;
    }
}

// 전역 객체로 등록
window.Card = Card;