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
        this.isRandomHeal = cardData.isRandomHeal || false;

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
        // 계산 순서: 1) 디버프(상태이상) 먼저 → 2) 버프 나중 (곱셈 순서 중요!)
        let actualAccuracy = this.accuracy;

        // 상태이상 디버프 적용 (GameConfig 기반) - 곱셈 방식으로 감소 (소수점 버림)
        // 중요: 각 상태이상은 1번씩만 적용 (find()로 첫 번째만 찾음)
        // 복합 적용: sand(-30%) + frozen(-50%) = 80% → 56% → 28% (순차 곱셈)
        // Configuration-Driven: 단일 진실의 원천(GameConfig) 사용
        const statusEffectTypes = GameConfig?.getAccuracyAffectingStatusEffects() || [];
        statusEffectTypes.forEach(effectType => {
            if (!user || !user.hasStatusEffect(effectType)) return;

            const statusConfig = GameConfig?.statusEffects?.[effectType];
            if (!statusConfig?.affectedCardTypes) return;

            // 설정에 정의된 카드 타입에만 적용
            if (statusConfig.affectedCardTypes.includes(this.type)) {
                const effect = user.statusEffects.find(e => e.type === effectType);  // 첫 번째만 (중복 방지)
                if (effect) {
                    const reduction = effect.power || statusConfig.defaultReduction || 0;
                    actualAccuracy = Math.max(0, Math.floor(actualAccuracy * (1 - reduction / 100)));
                }
            }
        });

        // 집중 버프 체크 (노멀 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
        if (this.type === 'attack' && this.element === 'normal' && user && user.hasFocusBuff && user.hasFocusBuff()) {
            const focusEffect = GameConfig.buffs.focus.effect.accuracy; // 30%
            actualAccuracy = Math.floor(actualAccuracy * (1 + focusEffect / 100));
        }

        // 호흡 버프 체크 (불 속성 버프 카드만) - 발동률 100% 보장
        if (this.type === 'buff' && this.element === 'fire' && user && user.hasBreathBuff && user.hasBreathBuff()) {
            actualAccuracy = 100;
        }

        // 초전도 버프 체크 (전기 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
        if (this.type === 'attack' && this.element === 'electric' && user && user.hasSuperConductivityBuff && user.hasSuperConductivityBuff()) {
            const superConductivityEffect = GameConfig?.buffs?.superConductivity?.effect?.accuracy || 40; // 40%
            actualAccuracy = Math.floor(actualAccuracy * (1 + superConductivityEffect / 100));
        }

        // 독침 버프 체크 (독 공격 카드만) - 상태이상 적용 후 곱셈 방식으로 증가 (소수점 버림)
        if (this.type === 'attack' && this.element === 'poison' && user && user.hasPoisonNeedleBuff && user.hasPoisonNeedleBuff()) {
            const poisonNeedleEffect = GameConfig?.buffs?.poisonNeedle?.effect?.accuracy || 20; // 20%
            actualAccuracy = Math.floor(actualAccuracy * (1 + poisonNeedleEffect / 100));
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
        // Random activation 카드: 첫 체크 시점에 횟수 결정 (Lazy Initialization)
        if ((this.isRandomBash || this.isRandomHeal) && this.activationCount === null) {
            if (this.getRandomActivationCount) {
                this.activationCount = this.getRandomActivationCount();

                // ★ FIX: 랜덤 횟수 결정 후 버프 보너스 누적 (급류/고속/열풍/광속/연쇄 버프)
                // modifiedActivationCount에는 Player.startTurn()에서 버프 보너스만 저장되어 있음
                if (this.modifiedActivationCount !== undefined) {
                    this.activationCount += this.modifiedActivationCount;

                    // 디버그 로그: 버프 적용 후 최종 횟수
                    if (GameConfig?.debugMode?.showRandomBashCounts) {
                        const bonus = this.modifiedActivationCount;
                        const baseCount = this.activationCount - bonus;
                        console.log(`[RANDOM ACTIVATION] ${this.name || this.id}: ${baseCount}회(기본) + ${bonus}회(버프) = ${this.activationCount}회`);
                    }

                    // ★ 중요: modifiedActivationCount 유지 (표시용으로 계속 사용)
                    // 발동 중에도 버프 정보를 유지하여 "3-6" 범위 표시 유지
                } else {
                    // 디버그 로그: 버프 없을 때
                    if (GameConfig?.debugMode?.showRandomBashCounts) {
                        console.log(`[RANDOM ACTIVATION] ${this.name || this.id}: ${this.activationCount}회로 결정됨 (버프 없음)`);
                    }
                }
            } else {
                this.activationCount = 1; // fallback
            }
        }

        // 발동 가능 여부 체크
        // 랜덤 카드: activationCount 사용 (이미 버프가 적용된 값)
        // 일반 카드: modifiedActivationCount 우선 사용
        let effectiveCount;
        if (this.isRandomBash || this.isRandomHeal) {
            // 랜덤 카드는 activationCount 사용 (이미 버프 보너스 적용됨)
            effectiveCount = this.activationCount;
        } else {
            // 일반 카드는 modifiedActivationCount 우선
            effectiveCount = this.modifiedActivationCount !== undefined ?
                this.modifiedActivationCount : this.activationCount;
        }
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
                if ((this.isRandomBash || this.isRandomHeal) && this.minActivation !== undefined && this.maxActivation !== undefined) {
                    // 랜덤 카드: 버프 적용된 범위 표시 (예: "2-5" → "3-6")
                    // modifiedActivationCount는 버프 보너스만 저장 (Player.js에서 설정)
                    // ★ 발동 전/중/후 모두 이 범위를 표시 (activationCount 결정 여부와 무관)
                    const bonus = this.modifiedActivationCount;
                    stats.activation = `${this.minActivation + bonus}-${this.maxActivation + bonus}`;
                } else {
                    // 일반 카드: 숫자로 표시 (예: 1 → 2)
                    stats.activation = this.modifiedActivationCount;
                }
            } else {
                // 버프 없을 때: 기본 표시
                stats.activation = (this.isRandomBash || this.isRandomHeal) ? this.getDisplayActivationCount() : this.activationCount;
            }
        } else {
            // 기본값 - 원래 카드 스펙
            stats.power = this.power;
            stats.accuracy = this.accuracy;
            // 랜덤 발동 카드는 범위 문자열 반환 (예: "1-3")
            stats.activation = (this.isRandomBash || this.isRandomHeal) ? this.getDisplayActivationCount() : this.activationCount;
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
        if (this.isRandomBash || this.isRandomHeal) {
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
        // 랜덤 카드의 activationCount를 null로 리셋 (다음 턴에 다시 랜덤 결정)
        if (this.isRandomBash || this.isRandomHeal) {
            this.activationCount = null;
        }
    }

    // 디버깅용 문자열 변환
    toString() {
        return `${this.name}(${this.type}, ${this.element}, ${this.power})`;
    }
}

// 전역 객체로 등록
window.Card = Card;