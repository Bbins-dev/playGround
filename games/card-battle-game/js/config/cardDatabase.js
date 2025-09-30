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
            cost: 1,
            activationCount: 3, // 기본값, 턴 시작 시 동적으로 3-5로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.random_bash.description',
            isRandomBash: true, // 마구때리기 카드임을 표시
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * 3) + 3; // 3-5 랜덤
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.heavy_strike.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.shield_bash.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = user.defense + (user.getStrength ? user.getStrength() : 0); // 방어력 + 힘 버프

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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.concussion.description',
            stunChance: GameConfig?.cardEffects?.concussion?.stunChance || 40,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 기절 확률 체크
                let stunned = false;
                const stunRoll = Math.random() * 100;
                if (stunRoll < this.stunChance) {
                    const result = target.addStatusEffect('stun', null, 1);
                    stunned = result.success;
                }

                return {
                    success: true,
                    messageKey: stunned ? 'auto_battle_card_game.ui.concussion_stun' : 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    stunned: stunned,
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.counter_attack.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = user.lastDamageTaken + (user.getStrength ? user.getStrength() : 0); // 받은 대미지 + 힘 버프

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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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

        // 도발 카드 (상대를 도발 상태로)
        this.addCard({
            id: 'taunt',
            nameKey: 'auto_battle_card_game.ui.cards.taunt.name',
            type: 'status',
            element: 'normal',
            power: 0,
            accuracy: 70,
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.taunt.description',
            effect: function(user, target, battleSystem) {
                // 도발 상태 적용 (1턴)
                const result = target.addStatusEffect('taunt', null, 1);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.taunt_success';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.already_taunted';
                } else {
                    messageKey = 'auto_battle_card_game.ui.taunt_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'taunt' : null
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_throw.description',
            burnChance: 15,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 확률 체크 (명중 성공 시에만)
                let burned = false;
                const burnRoll = Math.random() * 100;
                if (burnRoll < this.burnChance) {
                    const result = target.addStatusEffect('burn', 15, 1);
                    burned = result.success;
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    burned: burned,
                    statusType: burned ? 'burn' : null,
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
            cost: 1,
            activationCount: 2, // 기본값, 턴 시작 시 동적으로 2-5로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.bubble_strike.description',
            isRandomBash: true, // 마구때리기 타입 카드
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * 4) + 2; // 2-5 랜덤
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

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

        // 번개일격 카드 (전기 속성, 강력하지만 낮은 명중률)
        this.addCard({
            id: 'thunder_strike',
            nameKey: 'auto_battle_card_game.ui.cards.thunder_strike.name',
            type: 'attack',
            element: 'electric',
            power: 5,
            accuracy: 50,
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.thunder_strike.description',
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.smog.description',
            poisonChance: 70,
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 중독 확률 체크 (명중한 경우에만)
                let poisoned = false;
                const poisonRoll = Math.random() * 100;

                if (poisonRoll < this.poisonChance) {
                    const result = target.addStatusEffect('poisoned', null, 3); // 3턴 지속
                    poisoned = result.success;
                    if (poisoned && GameConfig?.debugMode?.showStatusEffects) {
                        console.log(`[STATUS] 독 적용: ${target.name} (3턴)`);
                    }
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    poisoned: poisoned,
                    statusType: poisoned ? 'poisoned' : null,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 붕대감기 카드 (특수 카드, 체력 회복)
        this.addCard({
            id: 'bandage',
            nameKey: 'auto_battle_card_game.ui.cards.bandage.name',
            type: 'special',
            element: 'special', // 속성 없음을 표현
            power: 3, // 회복량
            accuracy: 100,
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.bandage.description',
            effect: function(user, target, battleSystem) {
                const maxHeal = this.power;
                const actualHealing = user.heal ? user.heal(maxHeal) : 0;

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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.push_back.description',
            effect: function(user, target, battleSystem) {
                // 기절 상태 적용 (1턴)
                const result = target.addStatusEffect('stun', null, 1);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.templates.status_applied';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.templates.already_status';
                } else {
                    messageKey = 'auto_battle_card_game.ui.push_back_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'stun' : null,
                    templateData: { name: GameConfig.statusEffects.stun.name }
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.sand_throw.description',
            effect: function(user, target, battleSystem) {
                // 모래 상태 적용 (2턴, 30% 명중률 감소)
                const result = target.addStatusEffect('sand', 30, 2);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.templates.status_applied';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.templates.already_status';
                } else {
                    messageKey = 'auto_battle_card_game.ui.sand_throw_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'sand' : null,
                    templateData: { name: GameConfig.statusEffects.sand.name }
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.karura_strike.description',
            selfDamage: 10,
            burnChance: 100, // 명중 시 100% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (상대에게 공격)
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 확률 체크 (명중 성공 시에만)
                let burned = false;
                const burnRoll = Math.random() * 100;
                if (burnRoll < this.burnChance) {
                    const result = target.addStatusEffect('burn', GameConfig.statusEffects.burn.defaultPercent, 1);
                    burned = result.success;
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.templates.karura_strike_effect',
                    damage: finalDamage,
                    burned: burned,
                    statusType: burned ? 'burn' : null,
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
            cost: 1,
            activationCount: 1, // 기본값, 턴 시작 시 동적으로 1-3으로 설정됨
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_burst.description',
            isRandomBash: true, // 랜덤 연속 공격 카드임을 표시
            burnChance: 10, // 각 타격마다 10% 확률로 화상
            getRandomActivationCount: function() {
                return Math.floor(Math.random() * 3) + 1; // 1-3 랜덤
            },
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 확률 체크 (명중 성공 시에만)
                let burned = false;
                const burnRoll = Math.random() * 100;
                if (burnRoll < this.burnChance) {
                    const result = target.addStatusEffect('burn', GameConfig.statusEffects.burn.defaultPercent, 1);
                    burned = result.success;
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    burned: burned,
                    statusType: burned ? 'burn' : null,
                    element: this.element,
                    effectiveness: effectiveness
                };
            }
        });

        // 화염승천 카드 (불 속성, 자해 + 강력한 공격 + 화상 확률)
        this.addCard({
            id: 'flame_ascension',
            nameKey: 'auto_battle_card_game.ui.cards.flame_ascension.name',
            type: 'attack',
            element: 'fire',
            power: 8,
            accuracy: 70,
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.flame_ascension.description',
            selfDamage: 5,
            burnChance: 40, // 명중 시 40% 확률로 화상
            effect: function(user, target, battleSystem) {
                // 자해 데미지는 BattleSystem.preprocessSelfDamage()에서 이미 처리됨
                // 여기서는 카드의 본연의 효과만 처리 (상대에게 공격)
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 확률 체크 (명중 성공 시에만)
                let burned = false;
                const burnRoll = Math.random() * 100;
                if (burnRoll < this.burnChance) {
                    const result = target.addStatusEffect('burn', GameConfig.statusEffects.burn.defaultPercent, 1);
                    burned = result.success;
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    burned: burned,
                    statusType: burned ? 'burn' : null,
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.fireball.description',
            burnChance: 60, // 명중 시 60% 확률로 화상
            effect: function(user, target, battleSystem) {
                let baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);

                // 강화 버프 적용 (덧셈 계산 후, 속성 상성 계산 전)
                if (user.hasEnhanceBuff && user.hasEnhanceBuff()) {
                    baseDamage = Math.floor(baseDamage * 1.5);
                }

                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(baseDamage * effectiveness);

                // 화상 확률 체크 (명중 성공 시에만)
                let burned = false;
                const burnRoll = Math.random() * 100;
                if (burnRoll < this.burnChance) {
                    const result = target.addStatusEffect('burn', GameConfig.statusEffects.burn.defaultPercent, 1);
                    burned = result.success;
                }

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.damage',
                    damage: finalDamage,
                    burned: burned,
                    statusType: burned ? 'burn' : null,
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.hot_breath.description',
            effect: function(user, target, battleSystem) {
                // 화상 상태 적용 (1턴 지속)
                const result = target.addStatusEffect('burn', GameConfig.statusEffects.burn.defaultPercent, 1);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.templates.status_applied';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.templates.already_status';
                } else {
                    messageKey = 'auto_battle_card_game.ui.hot_breath_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'burn' : null,
                    templateData: { name: GameConfig.statusEffects.burn.name }
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.insult.description',
            effect: function(user, target, battleSystem) {
                // 모욕 상태 적용 (2턴, 방어카드 발동률 30% 감소)
                const result = target.addStatusEffect('insult', GameConfig.statusEffects.insult.defaultReduction, 2);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.templates.status_applied';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.templates.already_status';
                } else {
                    messageKey = 'auto_battle_card_game.ui.insult_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'insult' : null,
                    templateData: { name: GameConfig.statusEffects.insult.name }
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
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.net_throw.description',
            effect: function(user, target, battleSystem) {
                // 둔화 상태 적용 (2턴, 상태이상카드 발동률 30% 감소)
                const result = target.addStatusEffect('slow', GameConfig.statusEffects.slow.defaultReduction, 2);

                let messageKey;
                if (result.success) {
                    messageKey = 'auto_battle_card_game.ui.templates.status_applied';
                } else if (result.duplicate) {
                    messageKey = 'auto_battle_card_game.ui.templates.already_status';
                } else {
                    messageKey = 'auto_battle_card_game.ui.net_throw_failed';
                }

                return {
                    success: result.success,
                    messageKey: messageKey,
                    element: this.element,
                    duplicate: result.duplicate,
                    statusType: result.success ? 'slow' : null,
                    templateData: { name: GameConfig.statusEffects.slow.name }
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
            cost: 1,
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
    }
};

// 카드 클래스 정의를 위한 기본 구조
// (실제 Card 클래스는 entities/Card.js에서 정의됨)

// 전역 객체로 등록
window.CardDatabase = CardDatabase;