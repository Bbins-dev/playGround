// 카드 관리 시스템

class CardManager {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // 카드 풀 (게임에 존재하는 모든 카드)
        this.allCards = [];

        // 선택 가능한 카드들 (타입별)
        this.availableCards = {
            attack: [],
            defense: [],
            status: [],
            buff: [],
            debuff: [],
            special: []
        };

        // 초기화
        this.initialize();
    }

    // 초기화
    initialize() {
        this.loadAllCards();
        this.categorizeCards();
        console.log('🎴 카드 매니저 초기화 완료');
    }

    // 모든 카드 로드
    loadAllCards() {
        // 현재는 마구때리기 카드만 존재
        this.allCards = CardDatabase.getAllCards();
        console.log(`📚 총 ${this.allCards.length}장의 카드 로드됨`);
    }

    // 카드 분류
    categorizeCards() {
        this.allCards.forEach(cardData => {
            const type = cardData.type;
            if (this.availableCards[type]) {
                this.availableCards[type].push(cardData);
            }
        });

        console.log('📋 카드 분류 완료:');
        Object.keys(this.availableCards).forEach(type => {
            console.log(`  ${type}: ${this.availableCards[type].length}장`);
        });
    }

    // 초기 카드 선택용 공격 카드 목록
    getInitialAttackCards() {
        return this.availableCards.attack.map(cardData => cardData.id);
    }

    // 랜덤 카드 3장 선택 (스테이지 클리어 후)
    getRandomCards(count = 3) {
        const selectedCards = [];
        const availablePool = [...this.allCards];

        for (let i = 0; i < count && availablePool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availablePool.length);
            const selectedCard = availablePool.splice(randomIndex, 1)[0];
            selectedCards.push(selectedCard.id);
        }

        return selectedCards;
    }

    // 카드 인스턴스 생성
    createCard(cardId) {
        return CardDatabase.createCardInstance(cardId);
    }

    // 플레이어 손패에 카드 추가
    addCardToPlayer(player, cardId, position = 'left') {
        const card = this.createCard(cardId);
        if (!card) {
            console.error('카드 생성 실패:', cardId);
            return false;
        }

        if (position === 'left') {
            // 왼쪽에 추가 (다음 턴에 먼저 발동)
            player.hand.unshift(card);
        } else {
            // 오른쪽에 추가
            player.hand.push(card);
        }

        // 방어 속성 업데이트
        player.updateDefenseElement();

        console.log(`🃏 ${player.name}에게 ${card.name} 추가 (${position})`);
        return true;
    }

    // 카드 교체
    replacePlayerCard(player, oldCardIndex, newCardId) {
        if (oldCardIndex < 0 || oldCardIndex >= player.hand.length) {
            console.error('잘못된 카드 인덱스:', oldCardIndex);
            return false;
        }

        const newCard = this.createCard(newCardId);
        if (!newCard) {
            console.error('새 카드 생성 실패:', newCardId);
            return false;
        }

        const oldCard = player.hand[oldCardIndex];
        player.hand[oldCardIndex] = newCard;

        // 방어 속성 업데이트
        player.updateDefenseElement();

        console.log(`🔄 ${player.name}의 ${oldCard.name} → ${newCard.name} 교체`);
        return true;
    }

    // 플레이어 손패에서 카드 제거
    removeCardFromPlayer(player, cardIndex) {
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            console.error('잘못된 카드 인덱스:', cardIndex);
            return null;
        }

        const removedCard = player.hand.splice(cardIndex, 1)[0];

        // 방어 속성 업데이트
        player.updateDefenseElement();

        console.log(`🗑️ ${player.name}에서 ${removedCard.name} 제거`);
        return removedCard;
    }

    // 카드 선택 검증 (최소 공격 카드 1장 필요)
    validatePlayerHand(player) {
        const attackCards = player.hand.filter(card => card.type === 'attack');

        if (attackCards.length === 0) {
            console.warn('⚠️ 공격 카드가 없습니다. 최소 1장 필요합니다.');
            return false;
        }

        return true;
    }

    // 다음 발동할 카드 가져오기 (시각적 하이라이트용)
    getNextCardToActivate(player) {
        const activatableCards = player.getActivatableCards();

        if (activatableCards.length === 0) {
            return null;
        }

        // 첫 번째 카드가 다음에 발동할 카드
        return activatableCards[0];
    }

    // 카드 정보 가져오기
    getCardInfo(cardId) {
        return CardDatabase.getCard(cardId);
    }

    // 카드 갤러리용 모든 카드 정보
    getAllCardsForGallery() {
        return this.allCards.map(cardData => ({
            ...cardData,
            element: GameConfig.elements[cardData.element],
            type: GameConfig.cardTypes[cardData.type]
        }));
    }

    // 타입별 카드 가져오기
    getCardsByType(type) {
        return this.availableCards[type] || [];
    }

    // 속성별 카드 가져오기
    getCardsByElement(element) {
        return this.allCards.filter(cardData => cardData.element === element);
    }

    // 카드 검색
    searchCards(searchTerm) {
        if (!searchTerm) return this.allCards;

        const term = searchTerm.toLowerCase();
        return this.allCards.filter(cardData =>
            cardData.name.toLowerCase().includes(term) ||
            cardData.description.toLowerCase().includes(term) ||
            cardData.type.toLowerCase().includes(term) ||
            cardData.element.toLowerCase().includes(term)
        );
    }

    // 플레이어 손패 순서 변경
    reorderPlayerHand(player, fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= player.hand.length ||
            toIndex < 0 || toIndex >= player.hand.length) {
            console.error('잘못된 인덱스:', fromIndex, toIndex);
            return false;
        }

        // 카드 이동
        const card = player.hand.splice(fromIndex, 1)[0];
        player.hand.splice(toIndex, 0, card);

        console.log(`🔄 ${player.name} 손패 순서 변경: ${fromIndex} → ${toIndex}`);
        return true;
    }

    // 손패 분석 (디버깅용)
    analyzePlayerHand(player) {
        const analysis = {
            totalCards: player.hand.length,
            byType: {},
            byElement: {},
            defenseElement: player.defenseElement
        };

        // 타입별 분석
        player.hand.forEach(card => {
            analysis.byType[card.type] = (analysis.byType[card.type] || 0) + 1;
            analysis.byElement[card.element] = (analysis.byElement[card.element] || 0) + 1;
        });

        console.log(`📊 ${player.name} 손패 분석:`, analysis);
        return analysis;
    }

    // 카드 효과 미리보기
    previewCardEffect(cardId, user, target) {
        const card = this.createCard(cardId);
        if (!card) return null;

        // 실제 발동하지 않고 효과만 계산
        const preview = {
            cardName: card.name,
            type: card.type,
            element: card.element,
            power: card.power,
            accuracy: card.accuracy,
            description: card.description,
            estimatedDamage: 0,
            effectiveness: 1
        };

        // 공격 카드의 경우 예상 대미지 계산
        if (card.type === 'attack' && target) {
            const effectiveness = GameConfig.utils.getTypeEffectiveness(card.element, target.defenseElement);
            preview.effectiveness = effectiveness;
            preview.estimatedDamage = Math.floor(card.power * effectiveness);
        }

        return preview;
    }

    // 카드 추천 시스템 (AI 힌트)
    getCardRecommendations(player, enemy) {
        const recommendations = [];

        // 현재 상황 분석
        const playerHP = player.hp / player.maxHP;
        const enemyHP = enemy.hp / enemy.maxHP;

        // 추천 로직 (기본적인 예시)
        if (playerHP < 0.3) {
            // 체력이 낮으면 회복 카드 추천
            const healCards = this.getCardsByType('heal');
            recommendations.push(...healCards.map(card => ({
                cardId: card.id,
                reason: '체력이 낮아 회복이 필요합니다',
                priority: 'high'
            })));
        }

        if (enemyHP < 0.5) {
            // 적 체력이 낮으면 공격 카드 추천
            const attackCards = this.getCardsByType('attack');
            recommendations.push(...attackCards.map(card => ({
                cardId: card.id,
                reason: '적의 체력이 낮아 마무리 공격이 효과적입니다',
                priority: 'medium'
            })));
        }

        return recommendations;
    }

    // 카드 밸런스 체크 (개발용)
    checkCardBalance() {
        const balance = {
            totalCards: this.allCards.length,
            averagePower: 0,
            powerDistribution: {},
            typeBalance: {},
            elementBalance: {}
        };

        let totalPower = 0;

        this.allCards.forEach(cardData => {
            // 파워 분석
            const power = cardData.power || 0;
            totalPower += power;
            balance.powerDistribution[power] = (balance.powerDistribution[power] || 0) + 1;

            // 타입 분석
            balance.typeBalance[cardData.type] = (balance.typeBalance[cardData.type] || 0) + 1;

            // 속성 분석
            balance.elementBalance[cardData.element] = (balance.elementBalance[cardData.element] || 0) + 1;
        });

        balance.averagePower = totalPower / this.allCards.length;

        console.log('⚖️ 카드 밸런스 분석:', balance);
        return balance;
    }
}

// 전역 객체로 등록
window.CardManager = CardManager;