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
                // 방어력만 사용 (힘, 강화, 리튬 버프 무시)
                const baseDamage = user.defense;

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
                // 마지막 받은 대미지의 2배만 사용 (힘, 강화, 리튬 버프 무시)
                const baseDamage = user.lastDamageTaken * 2;

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

        // 웅크리기 카드 (방어력 30 + 턴 넘김, 90% 명중률)
        this.addCard({
            id: 'crouch',
            nameKey: 'auto_battle_card_game.ui.cards.crouch.name',
            type: 'defense',
            element: 'normal',
            power: GameConfig?.cardEffects?.crouch?.defenseGain || 30,
            accuracy: 90,
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

                // ★ Configuration-Driven: strengthGain만 반환
                // 실제 버프 적용은 BattleSystem.processDefenseResult → showBuffEffect에서 처리
                const strengthGain = GameConfig?.cardEffects?.thornArmor?.strengthGain || 3;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.thorn_armor_effect',
                    strengthGain: strengthGain,
                    element: this.element
                };
            }
        });

        // 꺾이지 않는 마음 카드 (노멀 방어속성일 때 1턴 간 모든 상태이상 면역)
        this.addCard({
            id: 'unbreakable_mind',
            nameKey: 'auto_battle_card_game.ui.cards.unbreakable_mind.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.unbreakable_mind.description',
            effect: function(user, target, battleSystem) {
                // 방어속성이 노멀인지 확인
                if (user.defenseElement !== 'normal') {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.no_normal_defense',
                        element: this.element
                    };
                }

                // 마음 버프는 중첩 불가 - 이미 있으면 실패
                if (user.hasMindBuff()) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.buff_already_active',
                        element: this.element
                    };
                }

                // 마음 버프 1턴 부여
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'mind',
                    mindGain: 1,
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

                // ★ Configuration-Driven: strengthGain만 반환
                // 실제 버프 적용은 BattleSystem.processDefenseResult → showBuffEffect에서 처리
                const strengthGain = GameConfig?.cardEffects?.indomitableGauntlet?.strengthGain || 5;

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
            accuracy: 40,
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
            power: 4,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_throw.description',
            burnChance: 15,
            effect: function(user, target, battleSystem) {
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 열풍, 강화, Li⁺) - Player.updateRuntimeCardStats()에서 계산됨
                let baseDamage = this.buffedPower || 0;

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
            power: 0,  // 동적 계산: 적이 frozen 상태일 때 적 최대 HP의 25%
            accuracy: 100,
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
            power: 7,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.thunder_strike.description',
            effect: function(user, target, battleSystem) {
                // ★ 데미지 계산 순서 (Player.js와 동일):
                // 1. base power
                // 2. 정전기 버프
                // 3. 힘 버프
                // 4. 조건부 곱셈 (해당 없음)
                // 5. 강화 버프
                // 6. Li⁺ 버프

                let baseDamage = this.power;

                // ★ 1단계: 정전기 버프 적용 (전기 속성만, 가장 먼저!)
                if (user.hasStaticBuff && user.hasStaticBuff()) {
                    const electricCount = user.hand.filter(c => c.element === 'electric').length;
                    const damagePerCard = GameConfig?.buffs?.static?.effect?.damagePerCard || 1;
                    baseDamage += electricCount * damagePerCard;
                }

                // ★ 2단계: 힘 버프 적용
                baseDamage += (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // ★ 3단계: 곱셈 버프들
                // 강화 버프 적용 (1.5배)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                // Li⁺ 버프 적용 (전기 속성 공격 카드, 턴수만큼 곱셈)
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    baseDamage = Math.floor(baseDamage * user.getLithiumTurns());
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

        // 감전 카드 (전기 속성, 젖음 상태의 적에게 기본공격력 3배)
        this.addCard({
            id: 'electric_shock',
            nameKey: 'auto_battle_card_game.ui.cards.electric_shock.name',
            type: 'attack',
            element: 'electric',
            power: 3,  // 기본 공격력 (젖음 상태이면 9로 동적 계산)
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.electric_shock.description',
            effect: function(user, target, battleSystem) {
                // 동적 공격력: Player.updateRuntimeCardStats()에서 이미 계산됨
                // buffedPower에 이미 모든 버프 포함 (조건부 기본 → 덧셈 → 곱셈)
                let baseDamage = this.buffedPower || 3;

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

        // 과부하 카드 (전기 속성, 화상 상태의 적에게 기본공격력 2배)
        this.addCard({
            id: 'overload',
            nameKey: 'auto_battle_card_game.ui.cards.overload.name',
            type: 'attack',
            element: 'electric',
            power: 5,  // 기본 공격력 (화상 상태이면 10으로 동적 계산)
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.overload.description',
            effect: function(user, target, battleSystem) {
                // 동적 공격력: Player.updateRuntimeCardStats()에서 이미 계산됨
                // buffedPower에 이미 모든 버프 포함 (조건부 기본 → 덧셈 → 곱셈)
                let baseDamage = this.buffedPower || 5;

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

        // 쇼트 카드 (전기 속성, 마비 상태의 적에게 기본공격력 10배)
        this.addCard({
            id: 'short_circuit',
            nameKey: 'auto_battle_card_game.ui.cards.short_circuit.name',
            type: 'attack',
            element: 'electric',
            power: 1,  // 기본 공격력 (마비 상태이면 10으로 동적 계산)
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.short_circuit.description',
            effect: function(user, target, battleSystem) {
                // 동적 공격력: Player.updateRuntimeCardStats()에서 이미 계산됨
                // buffedPower에 이미 모든 버프 포함 (조건부 기본 → 덧셈 → 곱셈)
                let baseDamage = this.buffedPower || 1;

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

        // 마비 덫 카드 (전기 속성, 순수 마비 효과)
        this.addCard({
            id: 'paralysis_trap',
            nameKey: 'auto_battle_card_game.ui.cards.paralysis_trap.name',
            type: 'status',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.paralysis_trap.description',
            paralysisChance: 100,  // 100% to apply if card hits (accuracy already 80%)
            effect: function(user, target, battleSystem) {
                // 마비 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'paralysis',
                        chance: this.paralysisChance,
                        power: GameConfig.statusEffects.paralysis.defaultChance,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 번개폭풍 카드 (전기 속성, 랜덤 상태이상 부여)
        this.addCard({
            id: 'lightning_storm',
            nameKey: 'auto_battle_card_game.ui.cards.lightning_storm.name',
            type: 'attack',
            element: 'electric',
            power: 3,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.lightning_storm.description',
            effect: function(user, target, battleSystem) {
                // ★ 데미지 계산 순서 (Player.js와 동일):
                // 1. base power
                // 2. 정전기 버프
                // 3. 힘 버프
                // 4. 조건부 곱셈 (해당 없음)
                // 5. 강화 버프
                // 6. Li⁺ 버프

                let baseDamage = this.power;

                // ★ 1단계: 정전기 버프 적용 (전기 속성만, 가장 먼저!)
                if (user.hasStaticBuff && user.hasStaticBuff()) {
                    const electricCount = user.hand.filter(c => c.element === 'electric').length;
                    const damagePerCard = GameConfig?.buffs?.static?.effect?.damagePerCard || 1;
                    baseDamage += electricCount * damagePerCard;
                }

                // ★ 2단계: 힘 버프 적용
                baseDamage += (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // ★ 3단계: 곱셈 버프들
                // 강화 버프 적용 (1.5배)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                // Li⁺ 버프 적용 (전기 속성 공격 카드, 턴수만큼 곱셈)
                if (user.hasLithiumBuff && user.hasLithiumBuff()) {
                    baseDamage = Math.floor(baseDamage * user.getLithiumTurns());
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 랜덤 상태이상 선택 (마비, 화상, 젖음 중 하나)
                const statusOptions = [
                    {
                        type: 'paralysis',
                        chance: 100,
                        power: GameConfig?.statusEffects?.paralysis?.defaultChance || 30,
                        duration: 1
                    },
                    {
                        type: 'burn',
                        chance: 100,
                        power: GameConfig?.statusEffects?.burn?.defaultPercent || 5,
                        duration: 1
                    },
                    {
                        type: 'wet',
                        chance: 100,
                        power: null,
                        duration: 1
                    }
                ];

                // 랜덤으로 하나 선택
                const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

                // 데미지 + 랜덤 상태이상 반환
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    element: this.element,
                    effectiveness: effectiveness,
                    statusEffect: randomStatus
                };
            }
        });

        // 전류 방패 카드 (전기속성 방어력 5 추가, 90% 발동률)
        this.addCard({
            id: 'current_shield',
            nameKey: 'auto_battle_card_game.ui.cards.current_shield.name',
            type: 'defense',
            element: 'electric',
            power: 5,
            accuracy: 90,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.current_shield.description',
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

        // 전자기 방호 카드 (전기속성 방어력 8 추가, 80% 발동률)
        this.addCard({
            id: 'electromagnetic_barrier',
            nameKey: 'auto_battle_card_game.ui.cards.electromagnetic_barrier.name',
            type: 'defense',
            element: 'electric',
            power: 8,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.electromagnetic_barrier.description',
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

        // 전류 벽 카드 (전기속성 방어력 10 추가, 70% 발동률)
        this.addCard({
            id: 'current_wall',
            nameKey: 'auto_battle_card_game.ui.cards.current_wall.name',
            type: 'defense',
            element: 'electric',
            power: 10,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.current_wall.description',
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

        // 전도갑옷 카드 (전기속성, 상대 방어력만큼 방어력 획득, 80% 발동률)
        this.addCard({
            id: 'conductive_armor',
            nameKey: 'auto_battle_card_game.ui.cards.conductive_armor.name',
            type: 'defense',
            element: 'electric',
            power: 0,  // 동적 계산: Player.updateRuntimeCardStats()에서 상대 방어력으로 설정
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.conductive_armor.description',
            effect: function(user, target, battleSystem) {
                // 동적 방어력: 상대의 현재 방어력만큼 (Player.updateRuntimeCardStats()에서 계산됨)
                const defenseValue = this.buffedPower || 0;

                // 상대 방어력이 0이면 조건 미충족 메시지
                if (defenseValue === 0) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_defense',
                        element: this.element
                    };
                }

                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 고전압 장갑 카드 (전기속성, 상대 마비 시 15 방어력, 80% 발동률)
        this.addCard({
            id: 'high_voltage_gloves',
            nameKey: 'auto_battle_card_game.ui.cards.high_voltage_gloves.name',
            type: 'defense',
            element: 'electric',
            power: 0,  // 동적 계산: Player.updateRuntimeCardStats()에서 상대 마비 상태 체크
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.high_voltage_gloves.description',
            effect: function(user, target, battleSystem) {
                // 동적 방어력: 상대가 마비 상태일 때 15 (Player.updateRuntimeCardStats()에서 계산됨)
                const defenseValue = this.buffedPower || 0;

                // 상대가 마비 상태가 아니면 조건 미충족 메시지
                if (defenseValue === 0) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_paralysis',
                        element: this.element
                    };
                }

                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 눈부신 섬광 카드 (전기 속성, 순수 둔화 효과)
        this.addCard({
            id: 'blinding_flash',
            nameKey: 'auto_battle_card_game.ui.cards.blinding_flash.name',
            type: 'status',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.blinding_flash.description',
            slowChance: 100,  // 명중 시 100% 적용 (확률 통합)
            effect: function(user, target, battleSystem) {
                // 둔화 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'slow',
                        chance: this.slowChance,
                        power: GameConfig?.statusEffects?.slow?.defaultReduction || 30,
                        duration: 1  // 1턴 둔화
                    }
                };
            }
        });

        // 위상 쇼크 카드 (전기 속성, 순수 위상 효과)
        this.addCard({
            id: 'phase_shock',
            nameKey: 'auto_battle_card_game.ui.cards.phase_shock.name',
            type: 'status',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.phase_shock.description',
            phaseChance: 100,
            effect: function(user, target, battleSystem) {
                // 위상 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'phase',
                        chance: this.phaseChance,
                        power: null,
                        duration: GameConfig?.statusEffects?.phase?.duration || 1
                    }
                };
            }
        });

        // 제세동기 카드 (전기 속성, 기절 효과)
        this.addCard({
            id: 'defibrillator',
            nameKey: 'auto_battle_card_game.ui.cards.defibrillator.name',
            type: 'status',
            element: 'electric',
            power: 0,
            accuracy: 30,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.defibrillator.description',
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

        // 정전기 카드 (전기 속성, 손패 전기 카드 수만큼 전기 공격력 증가)
        this.addCard({
            id: 'static',
            nameKey: 'auto_battle_card_game.ui.cards.static.name',
            type: 'buff',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.static.description',
            effect: function(user, target, battleSystem) {
                // 중복 체크 (이미 정전기 버프가 있으면 실패)
                if (user.hasStaticBuff && user.hasStaticBuff()) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.buff_already_active',
                        element: this.element
                    };
                }

                // 정전기 버프 획득 (1턴, 중첩 불가)
                // ★ Configuration-Driven: staticGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'static',
                    staticGain: 1,
                    element: this.element,
                    templateData: {
                        value: 1  // 획득할 값
                    }
                };
            }
        });

        // 건전지 팩 카드 (전기 속성, 팩 버프 획득)
        this.addCard({
            id: 'battery_pack',
            nameKey: 'auto_battle_card_game.ui.cards.battery_pack.name',
            type: 'buff',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.battery_pack.description',
            effect: function(user, target, battleSystem) {
                // 팩 버프 획득 (+1 스택)
                // ★ Configuration-Driven: packGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'pack',
                    packGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.pack?.name || '팩',
                        value: 1  // 획득할 값
                    }
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
                        duration: 1  // 기본 1턴 중독 (추후 중독 턴 추가/곱셈 카드로 확장 가능)
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 독극물 투척 카드 (독 속성, 명중 시 100% 중독 1턴)
        this.addCard({
            id: 'poison_throw',
            nameKey: 'auto_battle_card_game.ui.cards.poison_throw.name',
            type: 'attack',
            element: 'poison',
            power: 3,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.poison_throw.description',
            poisonChance: 100,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 중독 적용 (통합 시스템 - 명중 시 100% 확률로 2턴 중독)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: 2  // 2턴 중독
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 독 이빨 카드 (독 속성, 명중 시 100% 확률로 5턴 중독)
        this.addCard({
            id: 'poison_fang',
            nameKey: 'auto_battle_card_game.ui.cards.poison_fang.name',
            type: 'attack',
            element: 'poison',
            power: 3,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.poison_fang.description',
            poisonChance: 100,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() * (GameConfig?.constants?.multipliers?.attackPerStrength || 1) : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 중독 적용 (통합 시스템 - 명중 시 100% 확률로 5턴 중독)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: 5  // 5턴 중독
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 독침 연발 카드 (독 속성, 2-5회 연속 공격 + 각 타격마다 10% 중독)
        this.addCard({
            id: 'poison_barrage',
            nameKey: 'auto_battle_card_game.ui.cards.poison_barrage.name',
            type: 'attack',
            element: 'poison',
            power: 1,
            accuracy: 100,
            activationCount: 2, // 기본값, 턴 시작 시 동적으로 2-5로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.poison_barrage.description',
            isRandomBash: true, // 랜덤 연속 공격 카드임을 표시
            minActivation: 2, // 최소 발동 횟수
            maxActivation: 5, // 최대 발동 횟수
            poisonChance: 10, // 각 타격마다 10% 확률로 중독
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

                // 중독 적용 (통합 시스템 - 각 타격마다 10% 확률로 1턴 중독)
                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: 1  // 1턴 중독
                    },
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 가스 흡수 카드 (독 속성 회복 카드, 중독 턴 기반 동적 회복량)
        this.addCard({
            id: 'gas_absorption',
            nameKey: 'auto_battle_card_game.ui.cards.gas_absorption.name',
            type: 'heal',
            element: 'poison',
            power: 0,  // 동적 계산: 적의 중독 잔여 턴 × 1
            healAmount: 0,  // 사용하지 않음, buffedPower만 사용
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.gas_absorption.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (실시간 동적 계산됨: 중독 잔여 턴 × 1)
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

        // 유독가스 카드 (독 속성, 순수 중독 효과)
        this.addCard({
            id: 'toxic_gas',
            nameKey: 'auto_battle_card_game.ui.cards.toxic_gas.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.toxic_gas.description',
            poisonChance: 100,
            effect: function(user, target, battleSystem) {
                // 중독 적용 (통합 시스템 - 명중 시 100% 확률로 1턴 중독)
                return {
                    success: true,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: 1  // 1턴 중독
                    },
                    element: this.element
                };
            }
        });

        // 끈끈한 액체 카드 (독 속성, 순수 둔화 효과)
        this.addCard({
            id: 'sticky_liquid',
            nameKey: 'auto_battle_card_game.ui.cards.sticky_liquid.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            usageLimit: 1,  // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.sticky_liquid.description',
            slowChance: 100,
            effect: function(user, target, battleSystem) {
                // 둔화 적용 (통합 시스템 - 명중 시 100% 확률로 1턴 둔화)
                return {
                    success: true,
                    statusEffect: {
                        type: 'slow',
                        chance: this.slowChance,
                        power: GameConfig?.statusEffects?.slow?.defaultReduction || 30,
                        duration: 1  // 1턴 둔화
                    },
                    element: this.element
                };
            }
        });

        // 망각제 카드 (독 속성, 발동횟수 버프 무효화)
        this.addCard({
            id: 'oblivion_draught',
            nameKey: 'auto_battle_card_game.ui.cards.oblivion_draught.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: GameConfig?.cardEffects?.oblivionDraught?.hitChance || 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.oblivion_draught.description',
            oblivionChance: GameConfig?.cardEffects?.oblivionDraught?.oblivionChance || 100,
            effect: function(user, target, battleSystem) {
                // 망각 적용 (통합 시스템 - 명중 시 100% 확률로 1턴 망각)
                return {
                    success: true,
                    statusEffect: {
                        type: 'oblivion',
                        chance: this.oblivionChance,
                        power: null,
                        duration: 1  // 1턴 망각 (턴 표시 없음)
                    },
                    element: this.element
                };
            }
        });

        // 맹독 폭발 카드 (독 속성, 중독 턴 기반 동적 공격력)
        this.addCard({
            id: 'toxic_blast',
            nameKey: 'auto_battle_card_game.ui.cards.toxic_blast.name',
            type: 'attack',
            element: 'poison',
            power: 0,  // 동적 계산: 적의 중독 잔여 턴 × 1
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.toxic_blast.description',
            effect: function(user, target, battleSystem) {
                // 동적 공격력: 적의 중독 잔여 턴 × 1 (Player.updateRuntimeCardStats()에서 이미 계산됨)
                // buffedPower에 이미 모든 버프 포함 (힘, 강화) - 중복 적용 방지
                let baseDamage = this.buffedPower || 0;

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

        // 액체갑옷 카드 (독 속성 방어력 3 추가, 100% 발동률)
        this.addCard({
            id: 'liquid_armor',
            nameKey: 'auto_battle_card_game.ui.cards.liquid_armor.name',
            type: 'defense',
            element: 'poison',
            power: 3,
            accuracy: 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.liquid_armor.description',
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

        // 독극물 장벽 카드 (독 속성 방어력 8 추가, 80% 발동률)
        this.addCard({
            id: 'toxic_barrier',
            nameKey: 'auto_battle_card_game.ui.cards.toxic_barrier.name',
            type: 'defense',
            element: 'poison',
            power: 8,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.toxic_barrier.description',
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

        // 이관능성 방패 카드 (독 속성, HP 3 회복 + 방어력 5, 80% 발동률)
        this.addCard({
            id: 'bifunctional_shield',
            nameKey: 'auto_battle_card_game.ui.cards.bifunctional_shield.name',
            type: 'defense',
            element: 'poison',
            power: 5,  // 스탯 표시 (방어력만)
            accuracy: GameConfig.cardEffects.bifunctionalShield.activationChance * 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.bifunctional_shield.description',
            effect: function(user, target, battleSystem) {
                const healAmount = GameConfig.cardEffects.bifunctionalShield.healAmount;
                const defenseValue = GameConfig.cardEffects.bifunctionalShield.defenseGain;

                // HP 회복
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                // 방어력 추가
                user.addDefense(defenseValue);

                return {
                    success: true,
                    healAmount: actualHealing,
                    defenseGain: defenseValue,
                    element: this.element
                };
            }
        });

        // 거울 반응 카드 (독 속성, 상대 중독 잔여 턴 만큼 방어력, 80% 발동률)
        this.addCard({
            id: 'mirror_reaction',
            nameKey: 'auto_battle_card_game.ui.cards.mirror_reaction.name',
            type: 'defense',
            element: 'poison',
            power: 0,  // 동적 계산: Player.updateRuntimeCardStats()에서 상대 중독 잔여 턴으로 설정
            accuracy: GameConfig.cardEffects.mirrorReaction.activationChance * 100,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.mirror_reaction.description',
            effect: function(user, target, battleSystem) {
                // 상대의 중독 상태 확인
                const poisonedEffect = target.statusEffects?.find(e => e.type === 'poisoned');
                const hasPoisoned = poisonedEffect && poisonedEffect.turnsLeft > 0;

                const defenseValue = this.buffedPower || 0;

                // 중독 없으면 특별 메시지
                if (!hasPoisoned) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.mirror_reaction_no_poison',
                        element: this.element
                    };
                }

                // 중독 있으면 방어력 획득
                user.addDefense(defenseValue);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',
                    defenseGain: defenseValue,
                    element: this.element
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

        // 응급처치 카드 (회복 카드, HP 8 회복, 70% accuracy)
        this.addCard({
            id: 'first_aid',
            nameKey: 'auto_battle_card_game.ui.cards.first_aid.name',
            type: 'heal',
            element: 'special',
            power: 8, // 스탯 표시 (고정 회복량 8)
            healAmount: 8, // 회복량
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.first_aid.description',
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

        // 영양제 카드 (회복 카드, HP 3을 1-3회 랜덤 회복)
        this.addCard({
            id: 'nutrient_supplement',
            nameKey: 'auto_battle_card_game.ui.cards.nutrient_supplement.name',
            type: 'heal',
            element: 'special',
            power: 3, // 스탯 표시 (고정 회복량 3)
            healAmount: 3, // 회복량
            accuracy: 100,
            activationCount: 1, // 기본값, 턴 시작 시 동적으로 1-3으로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.nutrient_supplement.description',
            isRandomHeal: true, // 랜덤 회복 카드임을 표시
            minActivation: 1, // 최소 발동 횟수
            maxActivation: 3, // 최대 발동 횟수
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * (this.maxActivation - this.minActivation + 1)) + this.minActivation;
            },
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
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.hp_sufficient',
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

        // 몸 털기 카드 (버프 카드, 상태이상 무작위 제거)
        this.addCard({
            id: 'shake_off',
            nameKey: 'auto_battle_card_game.ui.cards.shake_off.name',
            type: 'buff',
            element: 'special',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            usageLimit: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.shake_off.description',
            effect: function(user, target, battleSystem) {
                // turnsLeft > 0인 활성 상태이상만 필터링
                const activeStatusEffects = (user.statusEffects || []).filter(e => e.turnsLeft > 0);

                // 상태이상 없으면 조건 미충족
                if (activeStatusEffects.length === 0) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_status_effect',
                        element: this.element
                    };
                }

                // 무작위로 하나 선택 (안전한 방식)
                const randomIndex = Math.floor(Math.random() * activeStatusEffects.length);
                const removedEffect = activeStatusEffects[randomIndex];

                // 상태이상 제거
                if (user.removeStatusEffect) {
                    user.removeStatusEffect(removedEffect.type);
                }

                return {
                    success: true,
                    removedStatusType: removedEffect.type,
                    element: this.element
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
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.hp_not_one',
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
            accuracy: 30,
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
            accuracy: 80,
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
                        duration: 1
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
            sandChance: 100,  // 100% to apply if card hits (accuracy already 80%)
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
            frozenChance: 100,  // 100% to apply if card hits (accuracy already 70%)
            effect: function(user, target, battleSystem) {
                // 젖음 상태 체크
                const hasWet = target.hasStatusEffect('wet');
                if (!hasWet) {
                    // 젖음 상태가 아니면 조건 실패
                    return {
                        success: true,           // 명중은 성공
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_wet',
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
            power: 20,
            accuracy: 90,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.karura_strike.description',
            selfDamage: 9,
            burnChance: 100, // 명중 시 100% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 열풍, 강화, Li⁺) - Player.updateRuntimeCardStats()에서 계산됨
                let baseDamage = this.buffedPower || 0;

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
            power: 3,
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
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 열풍, 강화, Li⁺) - Player.updateRuntimeCardStats()에서 계산됨
                let baseDamage = this.buffedPower || 0;

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
            power: 10,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_ascension.description',
            selfDamage: 5,
            burnChance: 40, // 명중 시 40% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 열풍, 강화, Li⁺) - Player.updateRuntimeCardStats()에서 계산됨
                let baseDamage = this.buffedPower || 0;

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // ★ Configuration-Driven: strengthGain만 반환
                // 실제 버프 적용은 BattleSystem.processAttackResult → showBuffEffect에서 처리
                const strengthGain = 1;

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
            power: 7,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fireball.description',
            burnChance: 60, // 명중 시 60% 확률로 화상
            effect: function(user, target, battleSystem) {
                // buffedPower에 이미 모든 버프 포함 (힘, 냄새, 열풍, 강화, Li⁺) - Player.updateRuntimeCardStats()에서 계산됨
                let baseDamage = this.buffedPower || 0;

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

        // 발화 카드 (불 속성, 방어속성이 불일 때 발화 상태이상 적용)
        this.addCard({
            id: 'ignite',
            nameKey: 'auto_battle_card_game.ui.cards.ignite.name',
            type: 'status',
            element: 'fire',
            power: 0,
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.ignite.description',
            ignitionChance: 100,
            effect: function(user, target, battleSystem) {
                // 조건 체크: 사용자의 방어속성이 불인가?
                if (user.defenseElement !== 'fire') {
                    // 명중했지만 조건 실패 (방어속성이 불이 아님)
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_fire_defense',
                        element: this.element
                    };
                }

                // 조건 충족: 발화 상태 적용 (통합 시스템 - 면역 메시지 지원)
                return {
                    success: true,
                    statusEffect: {
                        type: 'ignition',
                        chance: this.ignitionChance,
                        power: 0,
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
            accuracy: 80,
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
                        duration: 1
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
            accuracy: 80,
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
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 맹독 변성 카드 (독 속성, 중독 턴수 2배 증가)
        this.addCard({
            id: 'poison_mutation',
            nameKey: 'auto_battle_card_game.ui.cards.poison_mutation.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: 60,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.poison_mutation.description',
            poisonChance: 100,
            effect: function(user, target, battleSystem) {
                // 상대가 중독 상태인지 확인
                const poisonedEffect = target.statusEffects?.find(e => e.type === 'poisoned');
                const hasPoisoned = poisonedEffect && poisonedEffect.turnsLeft > 0;

                if (!hasPoisoned) {
                    // 명중했지만 조건 실패 (중독 상태 아님)
                    return {
                        success: true,           // 명중은 성공
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_poison',
                        element: this.element
                    };
                }

                // 중독 2배 증가 (현재 턴수만큼 추가)
                const turnsToExtend = poisonedEffect.turnsLeft;
                return {
                    success: true,
                    statusEffect: {
                        type: 'poisoned',
                        chance: this.poisonChance,
                        power: null,
                        duration: turnsToExtend
                    },
                    element: this.element
                };
            }
        });

        // 촉진제 카드 (독 속성, 상태이상 턴 연장)
        this.addCard({
            id: 'catalyst',
            nameKey: 'auto_battle_card_game.ui.cards.catalyst.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.catalyst.description',
            catalystChance: 100,
            effect: function(user, target, battleSystem) {
                // 턴 중첩형 상태이상 목록 (즉시 해제 상태이상 제외)
                const turnBasedStatuses = ['burn', 'poisoned', 'wet', 'paralysis', 'sand', 'insult', 'slow', 'chains', 'phase', 'stench'];

                // 상대의 턴 중첩형 상태이상 찾기
                const statusesToExtend = target.statusEffects?.filter(e =>
                    turnBasedStatuses.includes(e.type) && e.turnsLeft > 0
                ) || [];

                if (statusesToExtend.length === 0) {
                    // 명중했지만 조건 실패 (적용 가능한 상태이상 없음)
                    return {
                        success: true,           // 명중은 성공
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_status_effect',
                        element: this.element
                    };
                }

                // 각 상태이상의 턴을 1씩 증가
                statusesToExtend.forEach(status => {
                    status.turnsLeft += 1;
                });

                // 성공 메시지와 함께 반환
                return {
                    success: true,
                    catalystApplied: true,
                    messageKey: 'auto_battle_card_game.ui.templates.catalyst_success',
                    affectedStatusCount: statusesToExtend.length,
                    element: this.element
                };
            }
        });

        // 억제제 카드 (독 속성, 버프카드이지만 자신의 상태이상 턴 감소)
        this.addCard({
            id: 'inhibitor',
            nameKey: 'auto_battle_card_game.ui.cards.inhibitor.name',
            type: 'buff',
            element: 'poison',
            power: 0,
            accuracy: 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.inhibitor.description',
            inhibitorChance: 100,
            effect: function(user, target, battleSystem) {
                // 턴 중첩형 상태이상 목록 (즉시 해제 상태이상 제외)
                const turnBasedStatuses = ['burn', 'poisoned', 'wet', 'paralysis', 'sand', 'insult', 'slow', 'chains', 'phase', 'stench'];

                // 자신(user)의 턴 중첩형 상태이상 찾기
                const statusesToReduce = user.statusEffects?.filter(e =>
                    turnBasedStatuses.includes(e.type) && e.turnsLeft > 0
                ) || [];

                if (statusesToReduce.length === 0) {
                    // 명중했지만 조건 실패 (적용 가능한 상태이상 없음)
                    return {
                        success: true,           // 명중은 성공
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_status_effect',
                        element: this.element
                    };
                }

                // 각 상태이상의 턴을 1씩 감소
                statusesToReduce.forEach(status => {
                    status.turnsLeft -= 1;
                });

                // 0턴이 된 상태이상 제거 (즉시 제거)
                user.statusEffects = user.statusEffects.filter(e => e.turnsLeft > 0);

                // 성공 메시지와 함께 반환
                return {
                    success: true,
                    inhibitorApplied: true,
                    messageKey: 'auto_battle_card_game.ui.templates.inhibitor_success',
                    affectedStatusCount: statusesToReduce.length,
                    element: this.element
                };
            }
        });

        // 연쇄 반응 카드 (독 속성, 연쇄 버프 획득)
        this.addCard({
            id: 'chain_reaction',
            nameKey: 'auto_battle_card_game.ui.cards.chain_reaction.name',
            type: 'buff',
            element: 'poison',
            power: 0,
            accuracy: GameConfig?.cardEffects?.chainReaction?.accuracy || 70,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.chain_reaction.description',
            effect: function(user, target, battleSystem) {
                // 연쇄 버프 획득 (+1 스택)
                // ★ Configuration-Driven: propagationGain만 반환
                const gain = GameConfig?.cardEffects?.chainReaction?.propagationGain || 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'propagation',
                    propagationGain: gain,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.propagation?.name || '연쇄',
                        value: gain  // 획득할 값
                    }
                };
            }
        });

        // 독침 카드 (독 속성, 독침 버프 획득 - 독 공격 명중률 20% 증가)
        this.addCard({
            id: 'poison_needle',
            nameKey: 'auto_battle_card_game.ui.cards.poison_needle.name',
            type: 'buff',
            element: 'poison',
            power: 0,
            accuracy: GameConfig?.cardEffects?.poisonNeedle?.accuracy || 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.poison_needle.description',
            effect: function(user, target, battleSystem) {
                // 독침 버프 획득 (1턴)
                // ★ Configuration-Driven: poisonNeedleGain만 반환
                const gain = GameConfig?.cardEffects?.poisonNeedle?.poisonNeedleGain || 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'poisonNeedle',
                    poisonNeedleGain: gain,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.poisonNeedle?.name || '독침',
                        value: gain  // 획득할 값
                    }
                };
            }
        });

        // 유황 온천 카드 (독 속성, 유황 버프 - 얼음 면역)
        this.addCard({
            id: 'sulfur_spring',
            nameKey: 'auto_battle_card_game.ui.cards.sulfur_spring.name',
            type: 'buff',
            element: 'poison',
            power: 0,
            accuracy: GameConfig?.cardEffects?.sulfurSpring?.accuracy || 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.sulfur_spring.description',
            effect: function(user, target, battleSystem) {
                // 유황 버프 획득 (선제적 정화 포함)
                // ★ Configuration-Driven: sulfurGain만 반환
                // ★ 특수 케이스: addSulfurBuff()는 정화 정보 반환하므로 여기서만 호출 필요
                const gain = GameConfig?.cardEffects?.sulfurSpring?.sulfurGain || 1;
                const result = user.addSulfurBuff(gain);  // 정화 정보 획득

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'sulfur',
                    sulfurGain: result.turns,
                    frozenCleansed: result.cleansed,  // 정화 여부 전달
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.sulfur?.name || '유황',
                        value: result.turns  // 획득할 값
                    }
                };
            }
        });

        // 액체 코팅 카드 (독 속성, 코팅 버프 - 화상 면역)
        this.addCard({
            id: 'liquid_coating',
            nameKey: 'auto_battle_card_game.ui.cards.liquid_coating.name',
            type: 'buff',
            element: 'poison',
            power: 0,
            accuracy: GameConfig?.cardEffects?.liquidCoating?.accuracy || 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.liquid_coating.description',
            effect: function(user, target, battleSystem) {
                // 코팅 버프 획득 (선제적 정화 포함)
                // ★ Configuration-Driven: coatingGain만 반환
                // ★ 특수 케이스: addCoatingBuff()는 정화 정보 반환하므로 여기서만 호출 필요
                const gain = GameConfig?.cardEffects?.liquidCoating?.coatingGain || 1;
                const result = user.addCoatingBuff(gain);  // 정화 정보 획득

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'coating',
                    coatingGain: result.turns,
                    burnCleansed: result.cleansed,  // 정화 여부 전달
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.coating?.name || '코팅',
                        value: result.turns  // 획득할 값
                    }
                };
            }
        });

        // 좋은 우비 카드 (특수 속성, 우비 버프 - 상태이상 차단)
        this.addCard({
            id: 'good_raincoat',
            nameKey: 'auto_battle_card_game.ui.cards.good_raincoat.name',
            type: 'buff',
            element: 'special',
            power: 0,
            accuracy: GameConfig?.cardEffects?.goodRaincoat?.accuracy || 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.good_raincoat.description',
            effect: function(user, target, battleSystem) {
                // 우비 버프 획득 (상태이상 차단)
                // ★ Configuration-Driven: raincoatGain만 반환
                const gain = GameConfig?.cardEffects?.goodRaincoat?.raincoatGain || 1;
                const stacksAdded = user.addRaincoatBuff(gain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'raincoat',
                    raincoatGain: stacksAdded,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.raincoat?.name || '우비',
                        value: stacksAdded
                    }
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
                // ★ Configuration-Driven: strengthGain만 반환
                // 실제 버프 적용은 BattleSystem.processBuffResult → showBuffEffect에서 처리
                const strengthGain = this.power;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'strength',
                    strengthGain: strengthGain,
                    element: this.element,
                    templateData: {
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
                // ★ Configuration-Driven: enhanceGain만 반환
                const enhanceGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'enhance',
                    enhanceGain: enhanceGain,
                    element: this.element,
                    templateData: {
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
                // ★ Configuration-Driven: focusGain만 반환
                const focusGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'focus',
                    focusGain: focusGain,
                    element: this.element,
                    templateData: {
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
                // ★ Configuration-Driven: speedGain만 반환
                const speedGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'speed',
                    speedGain: speedGain,
                    element: this.element,
                    templateData: {
                        value: speedGain,  // 획득할 값
                        turns: 1  // 고속은 1턴
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
            accuracy: 80,
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

                // 방어력 추가 (카드에서 직접 적용 - Defense 패턴)
                user.addDefense(defenseValue);

                // ★ Configuration-Driven: strengthGain만 반환
                // 힘 버프 적용은 BattleSystem.processDefenseResult → showBuffEffect에서 처리

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
            accuracy: 35,
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
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_burn',
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
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_burn',
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
                        conditionNotMet: true,   // 조건 미충족
                        messageKey: 'auto_battle_card_game.ui.templates.no_burn',
                        element: this.element
                    };
                }

                // 화상 상태일 경우 냄새 버프 획득
                // ★ Configuration-Driven: scentGain만 반환하면 BattleSystem이 자동으로 버프 적용
                const scentGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.scent_buff_gained',
                    buffType: 'scent',
                    scentGain: scentGain,
                    element: this.element,
                    templateData: {
                        value: scentGain,  // 획득할 값 (아직 적용 전)
                        turns: 1  // 냄새 버프는 항상 1턴
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
                // 중복 체크 (이미 벼리기 버프가 있으면 실패 - Mind 버프와 동일한 패턴)
                if (user.hasSharpenBuff && user.hasSharpenBuff()) {
                    return {
                        success: false,  // Mind와 동일한 명확한 실패 처리
                        messageKey: 'auto_battle_card_game.ui.buff_already_active',
                        element: this.element
                    };
                }

                // 벼리기 버프 획득 (1턴)
                // ★ Configuration-Driven: sharpenGain만 반환

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
                // ★ Configuration-Driven: hotWindGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'hotWind',
                    hotWindGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.hotWind?.name || '열풍',
                        value: 1  // 획득할 값
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
            accuracy: 90,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fire_breath.description',
            effect: function(user, target, battleSystem) {
                // 중복 체크 (이미 호흡 버프가 있으면 조건 미충족)
                if (user.hasBreathBuff && user.hasBreathBuff()) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.buff_already_active',
                        element: this.element
                    };
                }

                // 호흡 버프 획득 (1턴, 중복 불가)
                // ★ Configuration-Driven: breathGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'breath',
                    breathGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.breath?.name || '호흡',
                        value: 1  // 획득할 값
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
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.battery_explosion.description',
            effect: function(user, target, battleSystem) {
                // Li⁺ 버프 획득 (1턴, 재사용 시 누적)
                // ★ Configuration-Driven: lithiumGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'lithium',
                    lithiumGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.lithium?.name || 'Li⁺',
                        value: 1  // 획득할 값
                    }
                };
            }
        });

        // 과충전 카드 (Li⁺ 버프 연장 카드, Li⁺ 버프 존재 시만 발동)
        this.addCard({
            id: 'overcharge_battery',
            nameKey: 'auto_battle_card_game.ui.cards.overcharge_battery.name',
            type: 'buff',
            element: 'electric',
            power: 0,
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.overcharge_battery.description',
            effect: function(user, target, battleSystem) {
                // Li⁺ 버프 존재 여부 체크
                if (!user.hasLithiumBuff || !user.hasLithiumBuff()) {
                    // Li⁺ 버프가 없으면 조건 실패
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_lithium',
                        element: this.element
                    };
                }

                // Li⁺ 버프 1턴 추가 (기존 버프에 누적)
                // ★ Configuration-Driven: lithiumGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'lithium',
                    lithiumGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.lithium?.name || 'Li⁺',
                        value: 1  // 획득할 값
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
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_water_defense',
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
            power: 0, // 기본 회복량 0 (젖음 상태일 때만 10으로 증가)
            healAmount: 10,
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.healing_spring.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (젖음 상태 자동 반영됨)
                // buffedPower가 0일 때 OR 연산자로 healAmount가 사용되는 버그 방지
                const healAmount = this.buffedPower !== undefined ? this.buffedPower : 0;

                // 젖음 상태가 아니면 조건 실패
                if (healAmount === 0) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_wet',
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

        // 액체화 카드 (물 속성 회복 카드, 잃은 체력의 10% 회복 + 젖음 제거)
        this.addCard({
            id: 'liquify',
            nameKey: 'auto_battle_card_game.ui.cards.liquify.name',
            type: 'heal',
            element: 'water',
            power: 0, // 파워 스탯에 회복량 표시 (실시간 동적 계산: 잃은 체력의 10%)
            healAmount: 0, // 사용하지 않음, buffedPower만 사용
            accuracy: 90,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.liquify.description',
            effect: function(user, target, battleSystem) {
                // buffedPower 사용 (실시간 동적 계산됨: 잃은 체력의 10%)
                const healAmount = this.buffedPower || 0;
                const actualHealing = user.heal ? user.heal(healAmount) : 0;

                // 젖음 상태 제거 (남은 턴 관계없이 즉시 제거)
                const hadWet = user.hasStatusEffect && user.hasStatusEffect('wet');
                if (hadWet && user.removeStatusEffect) {
                    user.removeStatusEffect('wet');
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.liquify_effect',
                    healAmount: actualHealing,
                    wetRemoved: hadWet,
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
            accuracy: 70,
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
            slowChance: 100,  // 100% to apply if card hits (accuracy already 80%)
            descriptionKey: 'auto_battle_card_game.ui.cards.sleet.description',
            effect: function(user, target, battleSystem) {
                // 적의 젖음 상태 확인
                const wetEffect = target.statusEffects?.find(e => e.type === 'wet');
                const hasWet = wetEffect && wetEffect.turnsLeft > 0;

                // 젖음 상태가 아니면 조건 실패 (발동률 성공해도 실패 메시지)
                if (!hasWet) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_wet',
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
            burnChance: 100, // 명중 시 화상 확정 (언어팩의 "조건 충족 시 화상 추가"와 일치)
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
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_wet_or_frozen',
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
                // ★ Configuration-Driven: massGain만 반환
                const stacksGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'mass',
                    massGain: stacksGain,
                    element: this.element,
                    templateData: {
                        value: stacksGain  // 획득할 값
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
                // ★ Configuration-Driven: torrentGain만 반환
                const torrentGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.torrent_buff_gained',
                    buffType: 'torrent',
                    torrentGain: torrentGain,
                    element: this.element,
                    templateData: {
                        value: torrentGain,  // 획득할 값
                        turns: 1  // 급류는 1턴
                    }
                };
            }
        });

        // 물장구 카드 (물 속성 버프 카드, 자신에게 젖음 상태이상 적용)
        this.addCard({
            id: 'water_play',
            nameKey: 'auto_battle_card_game.ui.cards.water_play.name',
            type: 'buff',
            element: 'water',
            power: 0, // 버프 카드지만 상태이상 적용
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.water_play.description',
            wetChance: GameConfig?.cardEffects?.waterPlay?.wetChance || 80,
            effect: function(user, target, battleSystem) {
                // 자신에게 젖음 상태이상 적용 (통합 상태이상 시스템)
                return {
                    success: true,
                    statusEffectSelf: {
                        type: 'wet',
                        chance: this.wetChance,
                        power: null,
                        duration: GameConfig?.cardEffects?.waterPlay?.duration || 1
                    },
                    element: this.element
                };
            }
        });

        // 수분흡수 카드 (물 속성 버프 카드, 흡수 버프 획득)
        this.addCard({
            id: 'moisture_absorption',
            nameKey: 'auto_battle_card_game.ui.cards.moisture_absorption.name',
            type: 'buff',
            element: 'water',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: 80,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.moisture_absorption.description',
            effect: function(user, target, battleSystem) {
                // 흡수 버프 1 스택 획득
                // ★ Configuration-Driven: absorptionGain만 반환
                const absorptionGain = 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'absorption',
                    absorptionGain: absorptionGain,
                    element: this.element,
                    templateData: {
                        value: absorptionGain  // 획득할 값
                    }
                };
            }
        });

        // 정화 카드 (물 속성 버프 카드, 모든 상태이상 제거)
        this.addCard({
            id: 'purification',
            nameKey: 'auto_battle_card_game.ui.cards.purification.name',
            type: 'buff',
            element: 'water',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: GameConfig?.cardEffects?.purification?.activationChance || 70,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.purification.description',
            effect: function(user, target, battleSystem) {
                // 방어속성이 물이 아닌 경우 실패
                if (user.defenseElement !== 'water') {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_water_defense',
                        element: this.element
                    };
                }

                // 현재 상태이상 카운트
                const statusCount = user.statusEffects.length;

                // 상태이상이 없는 경우
                if (statusCount === 0) {
                    return {
                        success: true,
                        noStatusEffects: true,
                        messageKey: GameConfig?.cardEffects?.purification?.noStatusKey ||
                                   'auto_battle_card_game.ui.templates.purification_no_status'
                    };
                }

                // 모든 상태이상 제거 (복사본으로 순회하여 안전하게 제거)
                const removedEffects = [...user.statusEffects];
                user.clearAllStatusEffects();

                // 즉시 런타임 스탯 재계산 (중요!)
                user.updateRuntimeCardStats();

                // 상대방의 런타임 스탯도 재계산 (젖음 기반 공격력 등)
                if (user.opponent) {
                    user.opponent.updateRuntimeCardStats();
                }

                return {
                    success: true,
                    purified: true,
                    removedCount: statusCount,
                    removedEffects: removedEffects,
                    messageKey: GameConfig?.cardEffects?.purification?.messageKey ||
                               'auto_battle_card_game.ui.templates.purification_success',
                    element: this.element
                };
            }
        });

        // 고압 전류 카드 (전기 속성 상태이상 카드, 상대의 모든 버프 제거)
        this.addCard({
            id: 'high_voltage_current',
            nameKey: 'auto_battle_card_game.ui.cards.high_voltage_current.name',
            type: 'status',
            element: 'electric',
            power: 0, // 상태이상 카드는 파워가 없음
            accuracy: GameConfig?.cardEffects?.highVoltageCurrent?.activationChance || 70,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.high_voltage_current.description',
            effect: function(user, target, battleSystem) {
                // 상대의 버프 존재 여부 체크
                const hasAnyBuff = target.strength > 0 ||
                                  target.enhanceTurns > 0 ||
                                  target.focusTurns > 0 ||
                                  target.speedTurns > 0 ||
                                  target.scentTurns > 0 ||
                                  target.sharpenTurns > 0 ||
                                  target.hotWindTurns > 0 ||
                                  target.lithiumTurns > 0 ||
                                  target.breathTurns > 0 ||
                                  target.massTurns > 0 ||
                                  target.torrentTurns > 0 ||
                                  target.absorptionBonus > 0 ||
                                  target.lightSpeedTurns > 0 ||
                                  target.superConductivityTurns > 0 ||
                                  target.staticTurns > 0 ||
                                  target.packBonus > 0 ||
                                  target.propagationTurns > 0 ||
                                  target.poisonNeedleTurns > 0 ||
                                  target.mindTurns > 0 ||
                                  target.sulfurTurns > 0 ||
                                  target.coatingTurns > 0 ||
                                  target.raincoatStacks > 0;

                // 버프가 없는 경우 실패
                if (!hasAnyBuff) {
                    return {
                        success: true,
                        noBuffs: true,
                        messageKey: GameConfig?.cardEffects?.highVoltageCurrent?.noBuffsKey ||
                                   'auto_battle_card_game.ui.templates.no_buffs'
                    };
                }

                // 모든 버프 제거
                target.clearBuffs();

                // 즉시 런타임 스탯 재계산 (중요!)
                target.updateRuntimeCardStats();

                // 사용자의 런타임 스탯도 재계산
                user.updateRuntimeCardStats();

                return {
                    success: true,
                    buffsCleared: true,
                    messageKey: GameConfig?.cardEffects?.highVoltageCurrent?.successKey ||
                               'auto_battle_card_game.ui.templates.high_voltage_current_success',
                    element: this.element
                };
            }
        });

        // 빛의 속도 카드 (전기 속성 버프 카드, 광속 버프 획득)
        this.addCard({
            id: 'light_speed',
            nameKey: 'auto_battle_card_game.ui.cards.light_speed.name',
            type: 'buff',
            element: 'electric',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: 70,
            activationCount: 1,
            usageLimit: 1, // 1회만 사용 가능
            descriptionKey: 'auto_battle_card_game.ui.cards.light_speed.description',
            effect: function(user, target, battleSystem) {
                // 광속 버프 획득
                // ★ Configuration-Driven: GameConfig에서 값 가져오기
                const lightSpeedGain = GameConfig?.buffs?.lightSpeed?.effect?.activationBonus || 1;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.light_speed_buff_gained',
                    buffType: 'lightSpeed',
                    lightSpeedGain: lightSpeedGain,
                    element: this.element,
                    templateData: {
                        value: lightSpeedGain,  // 획득할 값
                        turns: 1  // 광속은 1턴
                    }
                };
            }
        });

        // 초전도 카드 (전기 속성 버프 카드, 전기 공격카드 명중률 40% 증가, 1턴, 중첩 불가)
        this.addCard({
            id: 'super_conductivity',
            nameKey: 'auto_battle_card_game.ui.cards.super_conductivity.name',
            type: 'buff',
            element: 'electric',
            power: 0, // 버프 카드는 파워가 없음
            accuracy: 80,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.super_conductivity.description',
            effect: function(user, target, battleSystem) {
                // 중복 체크 (이미 초전도 버프가 있으면 조건 미충족)
                if (user.hasSuperConductivityBuff && user.hasSuperConductivityBuff()) {
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.buff_already_active',
                        element: this.element
                    };
                }

                // 초전도 버프 획득 (1턴, 전기 공격 명중률 40% 증가)
                // ★ Configuration-Driven: superConductivityGain만 반환

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.buff_gained',
                    buffType: 'superConductivity',
                    superConductivityGain: 1,
                    element: this.element,
                    templateData: {
                        name: GameConfig?.buffs?.superConductivity?.name || '초전도',
                        value: 1  // 획득할 값
                    }
                };
            }
        });

        // 악취 카드 (독 속성 상태이상 카드, 버프카드 명중률 50% 감소, 방어속성 조건)
        this.addCard({
            id: 'stench',
            nameKey: 'auto_battle_card_game.ui.cards.stench.name',
            type: 'status',
            element: 'poison',
            power: 0,
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.stench.description',
            stenchChance: 100,  // 조건 충족 시 100% 적용
            effect: function(user, target, battleSystem) {
                // 조건 체크: 사용자의 방어속성이 독인가?
                if (user.defenseElement !== 'poison') {
                    // 명중했지만 조건 실패 (방어속성이 독이 아님)
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.templates.no_poison_defense',
                        element: this.element
                    };
                }

                // 조건 충족: 악취 상태 적용 (통합 시스템 - 우비 차단, 억제제/촉진제 영향)
                return {
                    success: true,
                    statusEffect: {
                        type: 'stench',
                        chance: this.stenchChance,
                        power: GameConfig?.statusEffects?.stench?.defaultReduction || 50,
                        duration: 1
                    },
                    element: this.element
                };
            }
        });

        // 장벽 카드 (노멀 속성 버프 카드, 현재 방어력 5배 증가, 방어속성 조건)
        this.addCard({
            id: 'barrier',
            nameKey: 'auto_battle_card_game.ui.cards.barrier.name',
            type: 'buff',
            element: 'normal',
            power: 0,
            accuracy: 75,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.barrier.description',
            effect: function(user, target, battleSystem) {
                // 조건 체크: 사용자의 방어속성이 노멀인가?
                if (user.defenseElement !== 'normal') {
                    // 명중했지만 조건 실패 (방어속성이 노멀이 아님)
                    return {
                        success: true,
                        conditionNotMet: true,
                        messageKey: 'auto_battle_card_game.ui.no_normal_defense',  // 기존 메시지 재사용
                        element: this.element
                    };
                }

                // 조건 충족: 현재 방어력 × 5
                const currentDefense = user.defense;
                const multiplier = GameConfig?.constants?.multipliers?.barrierDefense || 5;
                const newDefense = currentDefense * multiplier;
                const defenseGain = newDefense - currentDefense;

                // 방어력 설정 (바리케이드 패턴)
                user.defense = newDefense;

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.defense_gained',  // 기존 메시지 재사용
                    defenseGain: defenseGain,
                    element: this.element
                };
            }
        });
    }
};

// 카드 클래스 정의를 위한 기본 구조
// (실제 Card 클래스는 entities/Card.js에서 정의됨)

// 전역 객체로 등록
window.CardDatabase = CardDatabase;