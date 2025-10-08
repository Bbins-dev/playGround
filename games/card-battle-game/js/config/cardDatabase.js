// 카드 데이터베이스

const CardDatabase = {
    // 카드 데이터 저장소
    cards: {},

    // processSelfDamage 함수는 더 이상 사용하지 않음 (BattleSystem.preprocessSelfDamage로 대체)

    // 카드 추가 메서드
    addCard: function(cardData) {
        this.cards[cardData.id] = cardData;
    },

    // 카드 조회 메서드
    getCard: function(cardId) {
        return this.cards[cardId];
    },

    // 카드 복사 메서드 (새 인스턴스 생성)
    createCardInstance: function(cardId) {
        const cardData = this.getCard(cardId);
        if (!cardData) {
            return null;
        }
        return new Card(cardData);
    },

    // 모든 카드 조회
    getAllCards: function() {
        return Object.values(this.cards);
    },

    // 타입별 카드 조회
    getCardsByType: function(type) {
        return this.getAllCards().filter(card => card.type === type);
    },

    // 속성별 카드 조회
    getCardsByElement: function(element) {
        return this.getAllCards().filter(card => card.element === element);
    },

    // 초기화 메서드
    initialize: function() {
        this.loadBasicCards();
    },

    // 기본 카드들 로드
    loadBasicCards: function() {
        // 마구때리기 카드 (연속 공격 카드)
        this.addCard({
            id: 'random_bash',
            nameKey: 'auto_battle_card_game.ui.cards.random_bash.name',
            type: 'attack',
            element: 'normal',
            power: 1,
            accuracy: 100,
            activationCount: 3, // 기본값, 턴 시작 시 동적으로 3-5로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.random_bash.description',
            isRandomBash: true, // 마구때리기 카드임을 표시
            minActivation: 3, // 최소 발동 횟수
            maxActivation: 5, // 최대 발동 횟수
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * (this.maxActivation - this.minActivation + 1)) + this.minActivation;
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 세게치기 카드 (강력한 단일 공격 카드)
        this.addCard({
            id: 'heavy_strike',
            nameKey: 'auto_battle_card_game.ui.cards.heavy_strike.name',
            type: 'attack',
            element: 'normal',
            power: 5,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.heavy_strike.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 방패치기 카드 (현재 방어력만큼 대미지)
        this.addCard({
            id: 'shield_bash',
            nameKey: 'auto_battle_card_game.ui.cards.shield_bash.name',
            type: 'attack',
            element: 'normal',
            power: 0, // 실제 파워는 현재 방어력
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.shield_bash.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = user.defense + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0); // 방어력 + 힘 버프

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.shield_bash_damage',
                    damage: finalDamage,
                    shieldValue: user.defense,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 뇌진탕 카드 (대미지 2 + 60% 기절)
        this.addCard({
            id: 'concussion',
            nameKey: 'auto_battle_card_game.ui.cards.concussion.name',
            type: 'attack',
            element: 'normal',
            power: 2,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.concussion.description',
            stunChance: GameConfig?.cardEffects?.concussion?.stunChance || 40,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 기절 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'stun',
                        chance: this.stunChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 카운터어택 카드 (마지막 받은 대미지 반환)
        this.addCard({
            id: 'counter_attack',
            nameKey: 'auto_battle_card_game.ui.cards.counter_attack.name',
            type: 'attack',
            element: 'normal',
            power: 0, // 실제 파워는 마지막 받은 대미지
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.counter_attack.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = user.lastDamageTaken + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0); // 받은 대미지 + 힘 버프

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.counter_damage',
                    damage: finalDamage,
                    counterValue: user.lastDamageTaken,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 방패들기 카드 (방어력 3 추가)
        this.addCard({
            id: 'raise_shield',
            nameKey: 'auto_battle_card_game.ui.cards.raise_shield.name',
            type: 'defense',
            element: 'normal',
            power: 3,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.raise_shield.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 갑옷입기 카드 (방어력 5 추가)
        this.addCard({
            id: 'wear_armor',
            nameKey: 'auto_battle_card_game.ui.cards.wear_armor.name',
            type: 'defense',
            element: 'normal',
            power: 5,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.wear_armor.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 웅크리기 카드 (방어력 15 + 턴 넘김)
        this.addCard({
            id: 'crouch',
            nameKey: 'auto_battle_card_game.ui.cards.crouch.name',
            type: 'defense',
            element: 'normal',
            power: GameConfig?.cardEffects?.crouch?.defenseGain || 30,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.crouch.description',
            skipTurn: true,
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                // 턴 스킵 플래그 설정 (BattleSystem에서 처리)
                if (battleSystem && battleSystem.setTurnSkip) {
                    battleSystem.setTurnSkip(true);
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.crouch_effect',
                    defenseGain: defenseValue,
                    skipTurn: true,
                    element: this.element
                };
            }
        });

        // 거대방패 카드 (방어력 8, 80% 성공률)
        this.addCard({
            id: 'large_shield',
            nameKey: 'auto_battle_card_game.ui.cards.large_shield.name',
            type: 'defense',
            element: 'normal',
            power: 8,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.large_shield.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 불의 방패 카드 (불속성 방어력 5 추가)
        this.addCard({
            id: 'fire_shield',
            nameKey: 'auto_battle_card_game.ui.cards.fire_shield.name',
            type: 'defense',
            element: 'fire',
            power: 5,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fire_shield.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 화염벽 카드 (불속성 방어력 10 추가)
        this.addCard({
            id: 'flame_wall',
            nameKey: 'auto_battle_card_game.ui.cards.flame_wall.name',
            type: 'defense',
            element: 'fire',
            power: 10,
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_wall.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 작열방패 카드 (자신에게 대미지 3을 가하고 방어력 13을 얻습니다)
        this.addCard({
            id: 'scorched_shield',
            nameKey: 'auto_battle_card_game.ui.cards.scorched_shield.name',
            type: 'defense',
            element: 'fire',
            power: GameConfig?.cardEffects?.scorchedShield?.defenseGain || 13,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.scorched_shield.description',
            selfDamage: GameConfig?.cardEffects?.scorchedShield?.selfDamage || 3,
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (방어력 추가)
                const defenseValue = this.power;
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 가시갑옷 카드 (자신에게 대미지 1을 가하고 힘 1을 얻습니다)
        this.addCard({
            id: 'thorn_armor',
            nameKey: 'auto_battle_card_game.ui.cards.thorn_armor.name',
            type: 'defense',
            element: 'normal',
            power: -1,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.thorn_armor.description',
            selfDamage: 1,  // 자해 데미지 1
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (힘 버프 추가)

                // 안전한 접근 방식 (Optional Chaining + 기본값)
                const strengthGain = GameConfig?.cardEffects?.thornArmor?.strengthGain || 3;

                user.addStrength(strengthGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.thorn_armor_effect',
                    strengthGain: strengthGain,
                    element: this.element
                };
            }
        });

        // 불굴의 장갑 카드 (자해 데미지 + 힘 증가)
        this.addCard({
            id: 'indomitable_gauntlet',
            nameKey: 'auto_battle_card_game.ui.cards.indomitable_gauntlet.name',
            type: 'defense',
            element: 'fire',
            power: -3,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.indomitable_gauntlet.description',
            selfDamage: GameConfig?.cardEffects?.indomitableGauntlet?.selfDamage || 3,
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (힘 버프 추가)

                // 안전한 접근 방식 (Optional Chaining + 기본값)
                const strengthGain = GameConfig?.cardEffects?.indomitableGauntlet?.strengthGain || 5;

                user.addStrength(strengthGain);

                // 버프 라벨 즉시 업데이트
                const isPlayer = (user === battleSystem.player);
                battleSystem.hpBarSystem.updateBuffs(user, isPlayer);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.indomitable_gauntlet_effect',
                    strengthGain: strengthGain,
                    element: this.element
                };
            }
        });

        // 도발 카드 (상대를 도발 상태로)
        this.addCard({
            id: 'taunt',
            nameKey: 'auto_battle_card_game.ui.cards.taunt.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.taunt.description',
            tauntChance: 100,
            effect: function(user, target, battleSystem) {
                // 도발 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'taunt',
                        chance: this.tauntChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 불꽃던지기 카드 (불 속성)
        this.addCard({
            id: 'flame_throw',
            nameKey: 'auto_battle_card_game.ui.cards.flame_throw.name',
            type: 'attack',
            element: 'fire',
            power: 3,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_throw.description',
            burnChance: 15,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0) + (user.getScentBonus ? user.getScentBonus(this.element) : 0);

                // 곱셈 버프 적용 (강화, Li⁺)
                let multiplier = 1.0;
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    multiplier *= 1.5;
                }
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    multiplier *= user.getLithiumTurns();
                }
                baseDamage = Math.floor(baseDamage * multiplier);

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 거품타격 카드 (물 속성, 연속 공격)
        this.addCard({
            id: 'bubble_strike',
            nameKey: 'auto_battle_card_game.ui.cards.bubble_strike.name',
            type: 'attack',
            element: 'water',
            power: 1,
            accuracy: 100,
            activationCount: 2, // 기본값, 턴 시작 시 동적으로 2-5로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.bubble_strike.description',
            isRandomBash: true, // 마구때리기 타입 카드
            minActivation: 2, // 최소 발동 횟수
            maxActivation: 5, // 최대 발동 횟수
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * (this.maxActivation - this.minActivation + 1)) + this.minActivation;
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 질량 버프 적용 (물 속성만)
                baseDamage += (user.getMassBonus ? user.getMassBonus(this.element) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 물폭탄 카드 (물 속성, 공격 + 젖음 상태이상)
        this.addCard({
            id: 'water_bomb',
            nameKey: 'auto_battle_card_game.ui.cards.water_bomb.name',
            type: 'attack',
            element: 'water',
            power: 3,
            accuracy: 80,
            activationCount: 1,
            wetChance: 80,
            descriptionKey: 'auto_battle_card_game.ui.cards.water_bomb.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 질량 버프 적용 (물 속성만)
                baseDamage += (user.getMassBonus ? user.getMassBonus(this.element) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'wet',
                        chance: this.wetChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 쓰나미 카드 (물 속성, 자해 15 + 상대에게 15 공격 + 양측 젖음)
        this.addCard({
            id: 'tsunami',
            nameKey: 'auto_battle_card_game.ui.cards.tsunami.name',
            type: 'attack',
            element: 'water',
            power: GameConfig?.cardEffects?.tsunami?.power || 15,
            accuracy: 90,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.tsunami.description',
            selfDamage: GameConfig?.cardEffects?.tsunami?.selfDamage || 15,
            selfStatusEffect: {
                type: 'wet',
                chance: 100,
                power: null,
                duration: 1
            },
            wetChance: GameConfig?.cardEffects?.tsunami?.wetChance || 100,
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 자해 시 자신에게 젖음도 이미 적용됨 (selfStatusEffect)
                // 여기서는 카드의 본연의 효과만 처리 (상대에게 공격 + 젖음)
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 질량 버프 적용 (물 속성만)
                baseDamage += (user.getMassBonus ? user.getMassBonus(this.element) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 상대에게 젖음 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'wet',
                        chance: this.wetChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 냉동바람 카드 (물 속성, 젖음 턴 기반 동적 공격력 + 얼음 상태이상)
        this.addCard({
            id: 'freezing_wind',
            nameKey: 'auto_battle_card_game.ui.cards.freezing_wind.name',
            type: 'attack',
            element: 'water',
            power: 0,  // 동적 계산: 적의 젖음 잔여 턴 × 10
            accuracy: 80,
            activationCount: 1,
            frozenChance: 30,
            descriptionKey: 'auto_battle_card_game.ui.cards.freezing_wind.description',
            effect: function(user, target, battleSystem) {
                // 동적 공격력: 적의 젖음 잔여 턴 × 10 (Player.updateRuntimeCardStats()에서 이미 계산됨)
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 질량, 강화) - 중복 적용 방지
                let baseDamage = this.buffedPower || 0;

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 젖음 상태 확인 - 얼음 적용 여부 결정
                const wetEffect = target.statusEffects?.find(e => e.type === 'wet');
                const hasWet = wetEffect && wetEffect.turnsLeft > 0;

                // 얼음 적용 (통합 시스템 - 젖음 있을 때만)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: hasWet ? {
                        type: 'frozen',
                        chance: this.frozenChance,
                        power: GameConfig.statusEffects.frozen.defaultReduction,
                        duration: 1
                    } : null,  // 젖음 없으면 얼음 적용 안함
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 얼음깨기 카드 (물 속성, 얼음 상태의 적에게 고정 피해 + 얼음 제거)
        this.addCard({
            id: 'ice_breaker',
            nameKey: 'auto_battle_card_game.ui.cards.ice_breaker.name',
            type: 'attack',
            element: 'water',
            power: 0,  // 동적 계산: 적이 frozen 상태일 때 적 최대 HP의 20%
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.ice_breaker.description',
            isFixedDamage: true,  // 고정 피해 (버프 무시)
            effect: function(user, target, battleSystem) {
                // 동적 공격력: 적이 frozen 상태일 때만 대미지 (Player.updateRuntimeCardStats()에서 계산됨)
                let baseDamage = this.buffedPower || 0;

                // 고정 피해이므로 버프 적용 건너뛰기 (힘, 강화, Li⁺ 등 무시)

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 얼음 상태 확인 (명중 시에만 제거)
                const hasFrozen = target.hasStatusEffect('frozen');

                // 명중 시 얼음 제거
                if (hasFrozen) {
                    target.removeStatusEffect('frozen');
                    // 상태이상 UI 업데이트는 BattleSystem에서 자동 처리
                    // 상대방의 런타임 스탯 즉시 업데이트 (Player.removeStatusEffect에서 자동 호출됨)
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    frozenRemoved: hasFrozen,  // 얼음 제거 여부 (UI 업데이트용)
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 번개일격 카드 (전기 속성, 강력하지만 낮은 명중률)
        this.addCard({
            id: 'thunder_strike',
            nameKey: 'auto_battle_card_game.ui.cards.thunder_strike.name',
            type: 'attack',
            element: 'electric',
            power: 5,
            accuracy: 50,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.thunder_strike.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 스모그 카드 (독 속성, 중독 확률)
        this.addCard({
            id: 'smog',
            nameKey: 'auto_battle_card_game.ui.cards.smog.name',
            type: 'attack',
            element: 'poison',
            power: 2,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.smog.description',
            poisonChance: 70,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 중독 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: 3
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 붕대감기 카드 (회복 카드, 체력 회복)
        this.addCard({
            id: 'bandage',
            nameKey: 'auto_battle_card_game.ui.cards.bandage.name',
            type: 'heal',
            element: 'special', // 특수 속성
            power: 3, // 스탯 표시 (고정 회복량 3)
            healAmount: 3, // 회복량
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.bandage.description',
            effect: function(user, target, battleSystem) {
                const maxHeal = this.healAmount;
                const actualHealing = user.heal ? user.heal(maxHeal) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    templateData: { value: actualHealing }
                };
            }
        });

        // 기사회생 카드 (회복 카드, 조건부 대량 회복)
        this.addCard({
            id: 'miracle_revival',
            nameKey: 'auto_battle_card_game.ui.cards.miracle_revival.name',
            type: 'heal',
            element: 'special',
            power: 50, // 스탯 표시 (회복량 50%)
            healPercent: 50, // 회복량 (최대 HP의 50%)
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.miracle_revival.description',
            effect: function(user, target, battleSystem) {
                const hpThreshold = 30; // 30% 미만일 때 발동
                const currentHPPercent = (user.hp / user.maxHP) * 100;

                // 조건 체크: 현재 HP가 최대 HP의 30% 미만인가?
                if (currentHPPercent >= hpThreshold) {
                    // 조건 미충족
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 조건 충족: 최대 HP의 50% 회복
                const healAmount = Math.floor(user.maxHP * this.healPercent / 100);
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 1x100=? 카드 (회복 카드, HP=1일 때 최대 HP로 회복)
        this.addCard({
            id: 'one_times_hundred',
            nameKey: 'auto_battle_card_game.ui.cards.one_times_hundred.name',
            type: 'heal',
            element: 'special',
            power: 100, // 스탯 표시 (회복량 100%)
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.one_times_hundred.description',
            effect: function(user, target, battleSystem) {
                // 조건 체크: 현재 HP가 정확히 1인가?
                if (user.hp !== 1) {
                    // 조건 미충족
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 조건 충족: 최대 HP까지 회복 (현재 HP가 1이므로 healAmount = maxHP - 1)
                const healAmount = user.maxHP - user.hp;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 밀쳐내기 카드 (노멀 상태이상, 기절)
        this.addCard({
            id: 'push_back',
            nameKey: 'auto_battle_card_game.ui.cards.push_back.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 40,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.push_back.description',
            stunChance: 100,
            effect: function(user, target, battleSystem) {
                // 기절 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'stun',
                        chance: this.stunChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 모래뿌리기 카드 (노멀 상태이상, 명중률 감소)
        this.addCard({
            id: 'sand_throw',
            nameKey: 'auto_battle_card_game.ui.cards.sand_throw.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.sand_throw.description',
            sandChance: 100,
            effect: function(user, target, battleSystem) {
                // 모래 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'sand',
                        chance: this.sandChance,
                        power: GameConfig.statusEffects.sand.defaultReduction,
                        duration: 2
                    },
                    element: this.element
                };
            }
        });

        // 진흙탕 카드 (물 속성 상태이상, 모래 상태 1턴 적용)
        this.addCard({
            id: 'mud_bath',
            nameKey: 'auto_battle_card_game.ui.cards.mud_bath.name',
            type: 'status',
            element: 'water',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.mud_bath.description',
            sandChance: 80,
            effect: function(user, target, battleSystem) {
                // 모래 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'sand',
                        chance: this.sandChance,
                        power: GameConfig.statusEffects.sand.defaultReduction,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 혹한기 카드 (물 속성 상태이상, 젖음 상태일 때만 얼음 적용)
        this.addCard({
            id: 'cold_snap',
            nameKey: 'auto_battle_card_game.ui.cards.cold_snap.name',
            type: 'status',
            element: 'water',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.cold_snap.description',
            frozenChance: 70,
            effect: function(user, target, battleSystem) {
                // 젖음 상태 체크
                const hasWet = target.hasStatusEffect('wet');
                if (!hasWet) {
                    // 젖음 상태가 아니면 조건 실패
                    return {
                        success: true,           // 명중은 성공
                        conditionFailed: true,   // 조건 실패
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }
                // 젖음 상태일 경우 얼음 적용 (통합 시스템 - 면역/중복 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'frozen',
                        chance: this.frozenChance,
                        power: GameConfig.statusEffects.frozen.defaultReduction,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 카루라 일격 카드 (불 속성, 자해 + 강력한 공격 + 확정 화상)
        this.addCard({
            id: 'karura_strike',
            nameKey: 'auto_battle_card_game.ui.cards.karura_strike.name',
            type: 'attack',
            element: 'fire',
            power: 12,
            accuracy: 90,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.karura_strike.description',
            selfDamage: 10,
            burnChance: 100, // 명중 시 100% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (상대에게 공격)
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0) + (user.getScentBonus ? user.getScentBonus(this.element) : 0);

                // 곱셈 버프 적용 (강화, Li⁺)
                let multiplier = 1.0;
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    multiplier *= 1.5;
                }
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    multiplier *= user.getLithiumTurns();
                }
                baseDamage = Math.floor(baseDamage * multiplier);

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.karura_strike_effect',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness,
                    templateData: {
                        damage: finalDamage
                    }
                };
            }
        });

        // 화염방사 카드 (불 속성, 1-3회 연속 공격 + 화상 확률)
        this.addCard({
            id: 'flame_burst',
            nameKey: 'auto_battle_card_game.ui.cards.flame_burst.name',
            type: 'attack',
            element: 'fire',
            power: 2,
            accuracy: 100,
            activationCount: 1, // 기본값, 턴 시작 시 동적으로 1-3으로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_burst.description',
            isRandomBash: true, // 랜덤 연속 공격 카드임을 표시
            minActivation: 1, // 최소 발동 횟수
            maxActivation: 3, // 최대 발동 횟수
            burnChance: 10, // 각 타격마다 10% 확률로 화상
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * (this.maxActivation - this.minActivation + 1)) + this.minActivation;
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0) + (user.getScentBonus ? user.getScentBonus(this.element) : 0);

                // 곱셈 버프 적용 (강화, Li⁺)
                let multiplier = 1.0;
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    multiplier *= 1.5;
                }
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    multiplier *= user.getLithiumTurns();
                }
                baseDamage = Math.floor(baseDamage * multiplier);

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 화염승천 카드 (불 속성, 자해 + 강력한 공격 + 화상 확률 + 힘 버프)
        this.addCard({
            id: 'flame_ascension',
            nameKey: 'auto_battle_card_game.ui.cards.flame_ascension.name',
            type: 'attack',
            element: 'fire',
            power: 7,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_ascension.description',
            selfDamage: 5,
            burnChance: 40, // 명중 시 40% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (상대에게 공격)
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0) + (user.getScentBonus ? user.getScentBonus(this.element) : 0);

                // 곱셈 버프 적용 (강화, Li⁺)
                let multiplier = 1.0;
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    multiplier *= 1.5;
                }
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    multiplier *= user.getLithiumTurns();
                }
                baseDamage = Math.floor(baseDamage * multiplier);

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 힘 버프 추가 (라벨 업데이트는 BattleSystem에서 메시지와 함께)
                const strengthGain = 1;
                user.addStrength(strengthGain);

                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    strengthGain: strengthGain,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 화염구 카드 (불 속성, 중간 대미지 + 화상 확률)
        this.addCard({
            id: 'fireball',
            nameKey: 'auto_battle_card_game.ui.cards.fireball.name',
            type: 'attack',
            element: 'fire',
            power: 4,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fireball.description',
            burnChance: 60, // 명중 시 60% 확률로 화상
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0) + (user.getScentBonus ? user.getScentBonus(this.element) : 0);

                // 곱셈 버프 적용 (강화, Li⁺)
                let multiplier = 1.0;
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    multiplier *= 1.5;
                }
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    multiplier *= user.getLithiumTurns();
                }
                baseDamage = Math.floor(baseDamage * multiplier);

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 뜨거운 입김 카드 (불 속성, 순수 화상 효과)
        this.addCard({
            id: 'hot_breath',
            nameKey: 'auto_battle_card_game.ui.cards.hot_breath.name',
            type: 'status',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.hot_breath.description',
            burnChance: 100,
            effect: function(user, target, battleSystem) {
                // 화상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 모욕 카드 (노멀 속성, 방어카드 발동률 감소)
        this.addCard({
            id: 'insult',
            nameKey: 'auto_battle_card_game.ui.cards.insult.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.insult.description',
            insultChance: 100,
            effect: function(user, target, battleSystem) {
                // 모욕 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'insult',
                        chance: this.insultChance,
                        power: GameConfig.statusEffects.insult.defaultReduction,
                        duration: 2
                    },
                    element: this.element
                };
            }
        });

        // 그물투척 카드 (노멀 속성, 상태이상카드 발동률 감소)
        this.addCard({
            id: 'net_throw',
            nameKey: 'auto_battle_card_game.ui.cards.net_throw.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.net_throw.description',
            slowChance: 100,
            effect: function(user, target, battleSystem) {
                // 둔화 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'slow',
                        chance: this.slowChance,
                        power: GameConfig.statusEffects.slow.defaultReduction,
                        duration: 2
                    },
                    element: this.element
                };
            }
        });

        // 기름붓기 카드 (불 속성, 화상 연장)
        this.addCard({
            id: 'oil_pour',
            nameKey: 'auto_battle_card_game.ui.cards.oil_pour.name',
            type: 'status',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.oil_pour.description',
            burnChance: 100,
            effect: function(user, target, battleSystem) {
                // 상대가 화상 상태인지 확인
                const hasBurn = target.hasStatusEffect('burn');

                if (!hasBurn) {
                    // 명중했지만 조건 실패 (화상 상태 아님)
                    return {
                        success: true,           // 명중은 성공
                        conditionFailed: true,   // 조건 실패
                        messageKey: 'auto_battle_card_game.ui.oil_pour_failed',
                        element: this.element
                    };
                }

                // 화상 연장 적용 (통합 시스템 - 면역 메시지 지원)
                const turnsToExtend = GameConfig?.cardEffects?.oilPour?.turnsExtended || 2;
                return {
                    success: true,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: turnsToExtend
                    },
                    element: this.element
                };
            }
        });

        // 불의 사슬 카드 (불 속성, 힘 버프 무효화)
        this.addCard({
            id: 'chains_of_fire',
            nameKey: 'auto_battle_card_game.ui.cards.chains_of_fire.name',
            type: 'status',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.chains_of_fire.description',
            chainsChance: 100,
            effect: function(user, target, battleSystem) {
                // 사슬 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'chains',
                        chance: this.chainsChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 끝없는 노력 카드 (힘 버프 카드)
        this.addCard({
            id: 'endless_effort',
            nameKey: 'auto_battle_card_game.ui.cards.endless_effort.name',
            type: 'buff',
            element: 'normal',
            power: 1,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.endless_effort.description',
            effect: function(user, target, battleSystem) {
                const strengthGain = this.power;
                user.addStrength(strengthGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'strength',
                    strengthGain: strengthGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.strength.name,
                        value: strengthGain
                    }
                };
            }
        });

        // 칼춤 카드 (강화 버프 카드)
        this.addCard({
            id: 'sword_dance',
            nameKey: 'auto_battle_card_game.ui.cards.sword_dance.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.sword_dance.description',
            effect: function(user, target, battleSystem) {
                const enhanceGain = 1;
                user.addEnhanceBuff(enhanceGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'enhance',
                    enhanceGain: enhanceGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.enhance.name,
                        value: enhanceGain
                    }
                };
            }
        });

        // 집중 카드 (집중 버프 카드)
        this.addCard({
            id: 'focus',
            nameKey: 'auto_battle_card_game.ui.cards.focus.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.focus.description',
            effect: function(user, target, battleSystem) {
                const focusGain = 1;
                user.addFocusBuff(focusGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'focus',
                    focusGain: focusGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.focus.name,
                        value: focusGain
                    }
                };
            }
        });

        // 고속공격 카드 (고속 버프 카드)
        this.addCard({
            id: 'fast_attack',
            nameKey: 'auto_battle_card_game.ui.cards.fast_attack.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fast_attack.description',
            effect: function(user, target, battleSystem) {
                const speedGain = 1;
                user.addSpeedBuff(speedGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'speed',
                    speedGain: speedGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.speed.name,
                        value: user.speedBonus,
                        turns: user.speedTurns
                    }
                };
            }
        });

        // 바리케이트 카드 (현재 방어력 2배 증가)
        this.addCard({
            id: 'barricade',
            nameKey: 'auto_battle_card_game.ui.cards.barricade.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.barricade.description',
            effect: function(user, target, battleSystem) {
                const currentDefense = user.defense;
                const multiplier = GameConfig.constants.multipliers.barricadeDefense;
                const newDefense = currentDefense * multiplier;
                const defenseGain = newDefense - currentDefense;

                // 방어력 설정 (현재 방어력 × 배수)
                user.defense = newDefense;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseGain,
                    element: this.element
                };
            }
        });

        // 붉은 펜던트 카드 (불속성 방어력 3 + 힘 1 버프)
        this.addCard({
            id: 'red_pendant',
            nameKey: 'auto_battle_card_game.ui.cards.red_pendant.name',
            type: 'defense',
            element: 'fire',
            power: 3,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.red_pendant.description',
            effect: function(user, target, battleSystem) {
                const defenseValue = this.power;
                const strengthGain = GameConfig?.cardEffects?.redPendant?.strengthGain || 1;

                // 방어력 추가
                user.addDefense(defenseValue);

                // 힘 버프 추가
                user.addStrength(strengthGain);

                // UI 업데이트는 processDefenseResult에서 메시지 연출 후 처리

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.red_pendant_effect',
                    defenseGain: defenseValue,
                    strengthGain: strengthGain,
                    element: this.element,
                    templateData: {
                        defense: defenseValue,
                        strength: strengthGain
                    }
                };
            }
        });

        // 용암 감옥 카드 (불 속성, 화상 상태일 경우 기절)
        this.addCard({
            id: 'lava_prison',
            nameKey: 'auto_battle_card_game.ui.cards.lava_prison.name',
            type: 'status',
            element: 'fire',
            power: 0,
            accuracy: 60,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.lava_prison.description',
            stunChance: 100,
            effect: function(user, target, battleSystem) {
                // 상대가 화상 상태인지 확인
                const hasBurn = target.hasStatusEffect('burn');

                if (!hasBurn) {
                    // 명중했지만 조건 실패 (화상 상태 아님)
                    return {
                        success: true,           // 명중은 성공
                        conditionFailed: true,   // 조건 실패
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 기절 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'stun',
                        chance: this.stunChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 화약통 투척 카드 (불 속성, 화상 상태일 경우 폭발 데미지 + 화상 연장)
        this.addCard({
            id: 'powder_keg',
            nameKey: 'auto_battle_card_game.ui.cards.powder_keg.name',
            type: 'status',
            element: 'fire',
            power: 0,  // 상태이상 카드이므로 power 스탯 표시 안함
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.powder_keg.description',
            burnChance: 100,
            effect: function(user, target, battleSystem) {
                // 상대가 화상 상태인지 확인
                const hasBurn = target.hasStatusEffect('burn');

                if (!hasBurn) {
                    // 명중했지만 조건 실패 (화상 상태 아님)
                    return {
                        success: true,           // 명중은 성공
                        conditionFailed: true,   // 조건 실패
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 화상 상태일 경우 폭발: 데미지 + 화상 연장
                const cardDamage = GameConfig?.cardEffects?.powderKeg?.damage || 10;
                let baseDamage = cardDamage + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 연장 적용 (통합 시스템 - 면역 메시지 지원)
                const turnsToExtend = GameConfig?.cardEffects?.powderKeg?.burnTurnsExtended || 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.powder_keg_effect',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: GameConfig.statusEffects.burn.defaultPercent,
                        duration: turnsToExtend
                    },
                    element: this.element,
                    effectiveness: effectiveness,
                    templateData: {
                        damage: finalDamage
                    }
                };
            }
        });

        // 기회의 냄새 카드 (불 속성, 화상 상태일 때 냄새 버프 획득)
        this.addCard({
            id: 'opportunity_scent',
            nameKey: 'auto_battle_card_game.ui.cards.opportunity_scent.name',
            type: 'buff',
            element: 'fire',
            power: 10,  // 냄새 버프의 추가 대미지를 암시
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.opportunity_scent.description',
            effect: function(user, target, battleSystem) {
                // 상대가 화상 상태인지 확인
                const hasBurn = target.hasStatusEffect('burn');

                if (!hasBurn) {
                    // 명중했지만 조건 실패 (화상 상태 아님)
                    return {
                        success: true,           // 명중은 성공
                        conditionFailed: true,   // 조건 실패
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 화상 상태일 경우 냄새 버프 획득
                const scentGain = 1;
                user.addScentBuff(scentGain);

                // 버프 라벨 즉시 업데이트
                const isPlayer = (user === battleSystem.player);
                battleSystem.hpBarSystem.updateBuffs(user, isPlayer);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.scent_buff_gained',
                    buffType: 'scent',
                    scentGain: scentGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.scent.name,
                        value: user.scentBonus,
                        turns: user.scentTurns
                    }
                };
            }
        });

        // 벼리기 카드 (불 속성, 1턴 동안 HP가 1 아래로 내려가지 않음)
        this.addCard({
            id: 'sharpen',
            nameKey: 'auto_battle_card_game.ui.cards.sharpen.name',
            type: 'buff',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.sharpen.description',
            effect: function(user, target, battleSystem) {
                // 중복 체크 (이미 벼리기 버프가 있으면 실패)
                if (user.hasSharpenBuff && user.hasSharpenBuff()) {
                    return {
                        success: true,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 벼리기 버프 획득 (1턴)
                user.addSharpenBuff(1);

                // 버프 라벨 즉시 업데이트
                const isPlayer = (user === battleSystem.player);
                battleSystem.hpBarSystem.updateBuffs(user, isPlayer);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'sharpen',
                    sharpenGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.sharpen?.name || '벼리기'
                    }
                };
            }
        });

        // 열풍 카드 (불 속성, 자해 데미지 5 + 열풍 버프 획득)
        this.addCard({
            id: 'hot_wind',
            nameKey: 'auto_battle_card_game.ui.cards.hot_wind.name',
            type: 'buff',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.hot_wind.description',
            selfDamage: GameConfig?.cardEffects?.hotWind?.selfDamage || 5,
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (열풍 버프 추가)

                // 열풍 버프 획득 (1턴, 중첩 가능)
                user.addHotWindBuff(1);

                // 버프 라벨 즉시 업데이트
                const isPlayer = (user === battleSystem.player);
                battleSystem.hpBarSystem.updateBuffs(user, isPlayer);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'hotWind',
                    hotWindGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.hotWind?.name || '열풍',
                        value: user.hotWindTurns
                    }
                };
            }
        });

        // 불의 호흡 카드 (불 속성, 한 턴 간 불 속성 버프카드 100% 발동)
        this.addCard({
            id: 'fire_breath',
            nameKey: 'auto_battle_card_game.ui.cards.fire_breath.name',
            type: 'buff',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fire_breath.description',
            effect: function(user, target, battleSystem) {
                // 중복 체크 (이미 호흡 버프가 있으면 실패)
                if (user.hasBreathBuff && user.hasBreathBuff()) {
                    return {
                        success: true,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 호흡 버프 획득 (1턴, 중복 불가)
                user.addBreathBuff(1);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'breath',
                    breathGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.breath?.name || '호흡',
                        value: user.breathTurns
                    }
                };
            }
        });

        // 배터리폭발 카드 (Li⁺ 버프 카드)
        this.addCard({
            id: 'battery_explosion',
            nameKey: 'auto_battle_card_game.ui.cards.battery_explosion.name',
            type: 'buff',
            element: 'fire',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.battery_explosion.description',
            effect: function(user, target, battleSystem) {
                // Li⁺ 버프 획득 (1턴, 재사용 시 누적)
                user.addLithiumBuff(1);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'lithium',
                    lithiumGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.lithium?.name || 'Li⁺',
                        value: user.lithiumTurns
                    }
                };
            }
        });

        // 물의 치유 카드 (물 속성 회복 카드, 물 방어속성일 때만 발동)
        this.addCard({
            id: 'water_healing',
            nameKey: 'auto_battle_card_game.ui.cards.water_healing.name',
            type: 'heal',
            element: 'water',
            power: 8, // 파워 스탯에 회복량 표시
            healAmount: 8,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.water_healing.description',
            effect: function(user, target, battleSystem) {
                // 조건 체크: 현재 방어속성이 물인가?
                if (user.defenseElement !== 'water') {
                    // 조건 미충족 (물 방어속성 아님)
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 조건 충족: 8 회복
                const healAmount = this.healAmount;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 피부호흡 카드 (물 속성 회복 카드, 젖음 상태일 때 3배 회복)
        this.addCard({
            id: 'skin_breathing',
            nameKey: 'auto_battle_card_game.ui.cards.skin_breathing.name',
            type: 'heal',
            element: 'water',
            power: 6, // 파워 스탯에 회복량 표시 (젖음 상태일 때 18로 실시간 변경)
            healAmount: 6,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.skin_breathing.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (젖음 상태 자동 반영됨)
                const healAmount = this.buffedPower || this.healAmount;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 회복의 샘 카드 (물 속성 회복 카드, 젖음 상태일 때만 발동)
        this.addCard({
            id: 'healing_spring',
            nameKey: 'auto_battle_card_game.ui.cards.healing_spring.name',
            type: 'heal',
            element: 'water',
            power: 10, // 파워 스탯에 회복량 표시 (젖음 상태일 때만 발동)
            healAmount: 10,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.healing_spring.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (젖음 상태 자동 반영됨)
                const healAmount = this.buffedPower || this.healAmount;

                // 젖음 상태가 아니면 조건 실패
                if (healAmount === 0) {
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 액체화 카드 (물 속성 회복 카드, 잃은 체력의 50% 회복 + 젖음 제거 + 턴 넘김)
        this.addCard({
            id: 'liquify',
            nameKey: 'auto_battle_card_game.ui.cards.liquify.name',
            type: 'heal',
            element: 'water',
            power: 0, // 파워 스탯에 회복량 표시 (실시간 동적 계산: 잃은 체력의 50%)
            healAmount: 0, // 사용하지 않음, buffedPower만 사용
            accuracy: 90,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.liquify.description',
            skipTurn: true,
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (실시간 동적 계산됨: 잃은 체력의 50%)
                const healAmount = this.buffedPower || 0;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                // 젖음 상태 제거 (남은 턴 관계없이 즉시 제거)
                const hadWet = user.hasStatusEffect && user.hasStatusEffect('wet');
                if (hadWet && user.removeStatusEffect) {
                    user.removeStatusEffect('wet');
                }

                // 턴 스킵 플래그 설정 (BattleSystem에서 처리)
                if (battleSystem && battleSystem.setTurnSkip) {
                    battleSystem.setTurnSkip(true);
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.liquify_effect',
                    healAmount: actualHealing,
                    wetRemoved: hadWet,
                    skipTurn: true,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 칼로 물 베기 카드 (물 속성 회복 카드, 마지막 받은 피해만큼 회복)
        this.addCard({
            id: 'slash_water',
            nameKey: 'auto_battle_card_game.ui.cards.slash_water.name',
            type: 'heal',
            element: 'water',
            power: 0, // 파워 스탯에 회복량 표시 (실시간 동적 계산: 마지막 받은 피해)
            healAmount: 0, // 사용하지 않음, buffedPower만 사용
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.slash_water.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (실시간 동적 계산됨: 마지막 받은 피해)
                const healAmount = this.buffedPower || 0;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.heal_effect',
                    healAmount: actualHealing,
                    element: this.element,
                    effectType: 'heal',
                    templateData: { value: actualHealing }
                };
            }
        });

        // 비내리기 카드 (물 속성 상태이상 카드, 자신과 상대 모두에게 젖음 상태 적용)
        this.addCard({
            id: 'rain',
            nameKey: 'auto_battle_card_game.ui.cards.rain.name',
            type: 'status',
            element: 'water',
            power: 0, // 상태이상 카드는 파워가 없음
            accuracy: 90,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.rain.description',
            wetChance: 100, // 발동 시 젖음 확률 100%
            effect: function(user, target, battleSystem) {
                // 통합 상태이상 시스템 사용 (양쪽 적용)
                return {
                    success: true,
                    statusEffectBoth: {
                        type: 'wet',
                        chance: this.wetChance,
                        power: null,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 진눈깨비 카드 (물 속성 상태이상 카드, 젖음 상태의 적에게 둔화 적용)
        this.addCard({
            id: 'sleet',
            nameKey: 'auto_battle_card_game.ui.cards.sleet.name',
            type: 'status',
            element: 'water',
            power: 0, // 상태이상 카드는 파워가 없음
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            slowChance: 80, // 둔화 발동률 80%
            descriptionKey: 'auto_battle_card_game.ui.cards.sleet.description',
            effect: function(user, target, battleSystem) {
                // 적의 젖음 상태 확인
                const wetEffect = target.statusEffects?.find(e => e.type === 'wet');
                const hasWet = wetEffect && wetEffect.turnsLeft > 0;

                // 젖음 상태가 아니면 조건 실패 (발동률 성공해도 실패 메시지)
                if (!hasWet) {
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 젖음 상태일 때 둔화 적용 (통합 시스템)
                return {
                    success: true,
                    statusEffect: {
                        type: 'slow',
                        chance: this.slowChance,
                        power: GameConfig?.statusEffects?.slow?.defaultReduction || 30,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 저온화상 카드 (물 속성 상태이상 카드, 젖음 또는 얼음 상태의 적에게 화상 적용)
        this.addCard({
            id: 'cold_burn',
            nameKey: 'auto_battle_card_game.ui.cards.cold_burn.name',
            type: 'status',
            element: 'water',
            power: 0, // 상태이상 카드는 파워가 없음
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            burnChance: 80, // 화상 발동률 80%
            descriptionKey: 'auto_battle_card_game.ui.cards.cold_burn.description',
            effect: function(user, target, battleSystem) {
                // 적의 젖음 또는 얼음 상태 확인
                const wetEffect = target.statusEffects?.find(e => e.type === 'wet');
                const frozenEffect = target.statusEffects?.find(e => e.type === 'frozen');
                const hasWet = wetEffect && wetEffect.turnsLeft > 0;
                const hasFrozen = frozenEffect && frozenEffect.turnsLeft > 0;

                // 젖음도 얼음도 없으면 조건 실패 (발동률 성공해도 실패 메시지)
                if (!hasWet && !hasFrozen) {
                    return {
                        success: false,
                        conditionFailed: true,
                        messageKey: 'auto_battle_card_game.ui.condition_failed',
                        element: this.element
                    };
                }

                // 젖음 또는 얼음 상태일 때 화상 적용 (통합 시스템)
                return {
                    success: true,
                    statusEffect: {
                        type: 'burn',
                        chance: this.burnChance,
                        power: null, // burn은 defaultDamage 사용
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 상당한 질량 카드 (물 속성 버프 카드, 질량 버프 획득)
        this.addCard({
            id: 'massive_weight',
            nameKey: 'auto_battle_card_game.ui.cards.massive_weight.name',
            type: 'buff',
            element: 'water',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.massive_weight.description',
            effect: function(user, target, battleSystem) {
                // 질량 버프 1 스택 획득
                const stacksGain = 1;
                user.addMassBuff(stacksGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'mass',
                    massGain: stacksGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.mass.name,
                        value: user.massBonus
                    }
                };
            }
        });

        // 급류 카드 (물 속성 버프 카드, 급류 버프 획득)
        this.addCard({
            id: 'torrent',
            nameKey: 'auto_battle_card_game.ui.cards.torrent.name',
            type: 'buff',
            element: 'water',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.torrent.description',
            effect: function(user, target, battleSystem) {
                // 급류 버프 획득
                const torrentGain = 1;
                user.addTorrentBuff(torrentGain);

                // 버프 라벨 즉시 업데이트
                const isPlayer = (user === battleSystem.player);
                battleSystem.hpBarSystem.updateBuffs(user, isPlayer);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.torrent_buff_gained',
                    buffType: 'torrent',
                    torrentGain: torrentGain,
                    element: this.element,
                    templateData: {
                        name: GameConfig.buffs.torrent.name,
                        value: user.torrentBonus,
                        turns: user.torrentTurns
                    }
                };
            }
        });
    }
};

// 카드 클래스 정의를 위한 기본 구조
// (실제 Card 클래스는 entities/Card.js에서 정의됨)

// 전역 객체로 등록
window.CardDatabase = CardDatabase;