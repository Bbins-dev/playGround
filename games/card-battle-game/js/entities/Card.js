// 카드 클래스 정의

class Card {
    constructor(cardData) {
        // 먼저 모든 속성 복사 (특수 속성 포함)
        Object.assign(this, cardData);

        // 기본값 처리 및 특별 관리가 필요한 속성들 재설정
        this.name = cardData.name || this.id; // 백업용
        this.accuracy = cardData.accuracy || 100;
        this.cost = cardData.cost || 1;
        this.activationCount = cardData.activationCount || 1;
        this.description = cardData.description || ''; // 백업용
        this.isRandomBash = cardData.isRandomBash || false;

        // 카드 효과 (함수)
        this.effect = cardData.effect || this.defaultEffect;

        // 현재 상태 (항상 초기화 필요)
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
            // 발동 횟수 증가 (먼저 차감)
            this.currentActivations++;

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

            return result;
        } catch (error) {
            return {
                success: false,
                message: `${this.name} 발동 실패`,
                damage: 0
            };
        }
    }

    // 명중률 체크 (올바른 구현 확인)
    checkAccuracy() {
        // Math.random() * 100이 accuracy보다 작으면 성공
        // 예: 80% 명중률이면 0~79.99는 성공, 80~100은 실패
        const roll = Math.random() * 100;
        const hit = roll < this.accuracy;

        return hit;
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

    // 발동횟수 표시용 (마구때리기 카드는 "3-5", 일반 카드는 숫자)
    getDisplayActivationCount() {
        if (this.isRandomBash) {
            return "3-5";
        }
        return this.activationCount.toString();
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