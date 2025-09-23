// 카드 데이터베이스

const CardDatabase = {
    // 카드 데이터 저장소
    cards: {},

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
                const baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);
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
                const baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);
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
                const baseDamage = user.defense + (user.getStrength ? user.getStrength() : 0); // 방어력 + 힘 버프
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

        // 뇌진탕 카드 (대미지 2 + 40% 기절)
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
            stunChance: 100,
            effect: function(user, target, battleSystem) {
                const baseDamage = this.power + (user.getStrength ? user.getStrength() : 0);
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
                const baseDamage = user.lastDamageTaken + (user.getStrength ? user.getStrength() : 0); // 받은 대미지 + 힘 버프
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

        // 웅크리기 카드 (방어력 10 + 턴 넘김)
        this.addCard({
            id: 'crouch',
            nameKey: 'auto_battle_card_game.ui.cards.crouch.name',
            type: 'defense',
            element: 'normal',
            power: 10,
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

        // 가시갑옷 카드 (자신에게 대미지 1을 가하고 힘 1을 얻습니다)
        this.addCard({
            id: 'thorn_armor',
            nameKey: 'auto_battle_card_game.ui.cards.thorn_armor.name',
            type: 'defense',
            element: 'normal',
            power: 1,
            accuracy: 80,
            cost: 1,
            activationCount: 1,
            descriptionKey: 'auto_battle_card_game.ui.cards.thorn_armor.description',
            effect: function(user, target, battleSystem) {
                // 자신에게 대미지 1
                const selfDamage = this.power;
                user.takeDamage(selfDamage);

                // 힘 버프 1 추가
                const strengthGain = 1;
                user.addStrength(strengthGain);

                return {
                    success: true,
                    messageKey: 'auto_battle_card_game.ui.thorn_armor_effect',
                    selfDamage: selfDamage,
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
            accuracy: 80,
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
    },

    // i18n을 고려한 카드 이름 가져오기
    getCardName: function(cardData) {
        if (cardData.nameKey && typeof getI18nText === 'function') {
            return getI18nText(cardData.nameKey) || cardData.name || cardData.id;
        }
        return cardData.name || cardData.id;
    },

    // i18n을 고려한 카드 설명 가져오기
    getCardDescription: function(cardData) {
        if (cardData.descriptionKey && typeof getI18nText === 'function') {
            return getI18nText(cardData.descriptionKey) || cardData.description || '';
        }
        return cardData.description || '';
    }
};

// 카드 클래스 정의를 위한 기본 구조
// (실제 Card 클래스는 entities/Card.js에서 정의됨)

// 전역 객체로 등록
window.CardDatabase = CardDatabase;