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
            console.error('카드를 찾을 수 없습니다:', cardId);
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
        console.log(`✅ 카드 데이터베이스 초기화 완료 - 총 ${Object.keys(this.cards).length}장의 카드`);
    },

    // 기본 카드들 로드
    loadBasicCards: function() {
        // 마구때리기 카드 (현재 유일한 구현 카드)
        this.addCard({
            id: 'bash',
            name: '마구때리기',
            type: 'attack',
            element: 'normal',
            power: 3,
            accuracy: 100,
            activationCount: 1,
            description: '상대에게 대미지 3을 가합니다.',
            effect: function(user, target, battleSystem) {
                const damage = this.power;
                const effectiveness = GameConfig.utils.getTypeEffectiveness(this.element, target.defenseElement);
                const finalDamage = Math.floor(damage * effectiveness);

                battleSystem.dealDamage(target, finalDamage);

                return {
                    success: true,
                    message: `${this.name}으로 ${finalDamage} 대미지!`,
                    damage: finalDamage
                };
            }
        });

        // 추후 추가될 카드들을 위한 템플릿
        // TODO: 나머지 24개 기본 카드와 10개 특수 카드 추가 예정
    }
};

// 카드 클래스 정의를 위한 기본 구조
// (실제 Card 클래스는 entities/Card.js에서 정의됨)

// 전역 객체로 등록
window.CardDatabase = CardDatabase;