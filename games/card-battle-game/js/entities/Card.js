// 카드 클래스 정의

class Card {
    constructor(cardData) {
        // 먼저 모든 속성 복사 (특수 속성 포함)
        Object.assign(this, cardData);

        // 기본값 처리 및 특별 관리가 필요한 속성들 재설정
        this.name = cardData.name || this.id; // 백업용
        this.accuracy = cardData.accuracy || 70;
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

            // 명중률 체크 (사용자를 전달)
            if (!this.checkAccuracy(user)) {
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
            console.error(`[ERROR] ${this.name} effect 실행 중 에러:`, error);
            return {
                success: false,
                message: `${this.name} 발동 실패`,
                damage: 0
            };
        }
    }

    // 명중률 체크 (올바른 구현 확인)
    checkAccuracy(user) {
        let actualAccuracy = this.accuracy;


        // 모래 상태이상 체크 (공격 카드만) - 곱셈 방식으로 감소 (소수점 버림)
        if (this.type === 'attack' && user && user.hasStatusEffect('sand')) {
            const sandEffect = user.statusEffects.find(e => e.type === 'sand');
            if (sandEffect) {
                actualAccuracy = Math.max(0, Math.floor(actualAccuracy * (1 - sandEffect.power / 100)));
            }
        }

        // 모욕 상태이상 체크 (방어 카드만) - 곱셈 방식으로 감소 (소수점 버림)
        if (this.type === 'defense' && user && user.hasStatusEffect('insult')) {
            const insultEffect = user.statusEffects.find(e => e.type === 'insult');
            if (insultEffect) {
                actualAccuracy = Math.max(0, Math.floor(actualAccuracy * (1 - insultEffect.power / 100)));
            }
        }

        // 둔화 상태이상 체크 (상태이상 카드만) - 곱셈 방식으로 감소 (소수점 버림)
        if (this.type === 'status' && user && user.hasStatusEffect('slow')) {
            const slowEffect = user.statusEffects.find(e => e.type === 'slow');
            if (slowEffect) {
                actualAccuracy = Math.max(0, Math.floor(actualAccuracy * (1 - slowEffect.power / 100)));
            }
        }

        // 집중 버프 체크 (노멀 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
        if (this.type === 'attack' && this.element === 'normal' && user && user.hasFocusBuff && user.hasFocusBuff()) {
            const focusEffect = GameConfig.buffs.focus.effect.accuracy; // 30%
            actualAccuracy = Math.floor(actualAccuracy * (1 + focusEffect / 100));
        }

        // 호흡 버프 체크 (불 속성 버프 카드만) - 발동률 100% 보장
        if (this.type === 'buff' && this.element === 'fire' && user && user.hasBreathBuff && user.hasBreathBuff()) {
            actualAccuracy = 100;
        }

        // 피뢰침 버프 체크 (전기 공격 카드만) - 명중률 100% 보장
        if (this.type === 'attack' && this.element === 'electric' && user && user.hasLightningRodBuff && user.hasLightningRodBuff()) {
            actualAccuracy = 100;
        }

        // 명중률 상한 100% 제한
        actualAccuracy = Math.min(100, actualAccuracy);

        // 100% 이상이면 무조건 명중 (부동소수점 정밀도 문제 해결)
        if (actualAccuracy >= 100) {
            return true;  // Focus 버프로 100% 달성 시 절대 보장
        }

        // Math.random() * 100이 accuracy보다 작으면 성공
        // 예: 80% 명중률이면 0~79.99는 성공, 80~100은 실패
        const roll = Math.random() * 100;
        const hit = roll < actualAccuracy;

        // 명중률 체크 로그 (디버그 모드에서만)
        if (GameConfig?.debugMode?.showAccuracyRolls) {
            console.log(`[${hit ? 'HIT' : 'MISS'}] ${this.name || this.id}: ${actualAccuracy.toFixed(1)}% (roll: ${roll.toFixed(1)})`);
        }

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
        // 고속 버프가 적용된 경우 modifiedActivationCount 사용
        const effectiveCount = this.modifiedActivationCount !== undefined ?
            this.modifiedActivationCount : this.activationCount;
        return this.isActive && this.currentActivations < effectiveCount;
    }

    // 표시용 스탯 가져오기 (context에 따라 다른 값 반환)
    getDisplayStats(context = 'default') {
        const stats = {};

        if (context === 'runtime') {
            // 런타임 - 버프/디버프가 적용된 실시간 스탯
            stats.power = this.buffedPower !== undefined ? this.buffedPower : this.power;
            stats.accuracy = this.modifiedAccuracy !== undefined ? this.modifiedAccuracy : this.accuracy;

            // 발동횟수 - 랜덤 카드는 범위 표시
            if (this.modifiedActivationCount !== undefined) {
                if (this.isRandomBash && this.minActivation !== undefined && this.maxActivation !== undefined) {
                    // 랜덤 카드: 버프 적용된 범위 표시 (예: "2-5" → "3-6")
                    const bonus = this.modifiedActivationCount - this.activationCount;
                    stats.activation = `${this.minActivation + bonus}-${this.maxActivation + bonus}`;
                } else {
                    // 일반 카드: 숫자로 표시 (예: 1 → 2)
                    stats.activation = this.modifiedActivationCount;
                }
            } else {
                // 버프 없을 때: 기본 표시
                stats.activation = this.isRandomBash ? this.getDisplayActivationCount() : this.activationCount;
            }
        } else {
            // 기본값 - 원래 카드 스펙
            stats.power = this.power;
            stats.accuracy = this.accuracy;
            // 랜덤 발동 카드는 범위 문자열 반환 (예: "1-3")
            stats.activation = this.isRandomBash ? this.getDisplayActivationCount() : this.activationCount;
        }

        return stats;
    }

    // 런타임 스탯 초기화 (스테이지 전환 시 사용)
    resetRuntimeStats() {
        this.buffedPower = undefined;
        this.modifiedAccuracy = undefined;
        this.modifiedActivationCount = undefined;
    }

    // 발동횟수 표시용 (랜덤 발동 카드는 "2-5", 일반 카드는 숫자)
    getDisplayActivationCount() {
        if (this.isRandomBash) {
            // 자동으로 범위 생성 (Configuration-Driven - 하드코딩 제거)
            if (this.minActivation !== undefined && this.maxActivation !== undefined) {
                return `${this.minActivation}-${this.maxActivation}`;
            }
            // 속성이 없으면 물음표 (안전 장치 - 부정확한 정보 방지)
            return "?";
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