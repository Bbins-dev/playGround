/**
 * 시작카드 선택 모달 관리 클래스
 * PlayerNameModal과 동일한 패턴으로 깔끔한 DOM 전용 구현
 */
class CardSelectionModal {
    constructor(gameManager) {
        this.gameManager = gameManager;

        // DOM 요소들
        this.modal = document.getElementById('card-selection-modal');
        this.grid = document.getElementById('card-selection-grid');
        this.detailModal = document.getElementById('card-detail-modal');
        this.detailCard = document.getElementById('card-detail-content');
        this.selectBtn = document.getElementById('card-detail-select');
        this.cancelBtn = document.getElementById('card-detail-cancel');
        this.mainCancelBtn = document.getElementById('card-selection-cancel');

        // 상태 관리
        this.availableCards = [];
        this.selectedCard = null;
        this.onCardSelected = null; // 콜백 함수

        // DOM 카드 렌더러 (갤러리와 동일한 방식)
        this.domCardRenderer = new DOMCardRenderer();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 확대 모달 버튼들
        if (this.selectBtn) {
            this.selectBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleCardSelect();
            });
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.hideDetailModal();
            });
        }

        // 모달 외부 클릭으로 닫기
        if (this.detailModal) {
            this.detailModal.addEventListener('click', (e) => {
                if (e.target === this.detailModal) {
                    this.hideDetailModal();
                }
            });
        }

        // 메인 취소 버튼 (메인 메뉴로 돌아가기)
        if (this.mainCancelBtn) {
            this.mainCancelBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.handleMainCancel();
            });
        }

        // ESC 키로 닫기 (비활성화)
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape') {
        //         if (this.detailModal && !this.detailModal.classList.contains('hidden')) {
        //             this.hideDetailModal();
        //         } else if (this.modal && !this.modal.classList.contains('hidden')) {
        //             // 메인 카드 선택 모달은 ESC로 닫지 않음 (필수 선택)
        //         }
        //     }
        // });
    }

    /**
     * 카드 선택 모달을 표시
     * @param {Function} callback - 카드가 선택되었을 때 호출할 콜백 (selectedCard 매개변수 전달)
     */
    show(callback) {
        this.onCardSelected = callback;

        // 초기 카드 선택 설정
        this.setupInitialSelection();

        // 카드 그리드 생성
        this.populateCardGrid();

        // 모달 표시
        this.modal.classList.remove('hidden');
    }

    /**
     * 모달을 숨김
     */
    hide() {
        this.modal.classList.add('hidden');
        this.hideDetailModal();
        this.clearGrid();
    }

    /**
     * 초기 카드 선택 설정 (기존 코드에서 가져옴)
     */
    setupInitialSelection() {
        // CardDatabase 상태 확인
        const allCards = CardDatabase.getAllCards();

        // 초기 선택 가능한 카드들 (모든 공격 카드)
        if (this.gameManager.cardManager) {
            const attackCardIds = this.gameManager.cardManager.getInitialAttackCards();

            this.availableCards = attackCardIds.map(cardId => {
                const cardInstance = CardDatabase.createCardInstance(cardId);
                return cardInstance;
            }).filter(Boolean);
        } else {
            // 폴백: 공격 카드만 필터링하고 Card 인스턴스 생성
            const attackCards = CardDatabase.getAllCards().filter(card => card.type === 'attack');
            this.availableCards = attackCards.map(cardData => new Card(cardData));
        }

        if (this.availableCards.length === 0) {
            console.warn('사용 가능한 공격 카드가 없습니다');
        }
    }

    /**
     * 카드 그리드 생성 (UIManager.populateCardGallery와 동일한 방식)
     */
    populateCardGrid() {
        if (!this.grid) return;

        this.grid.innerHTML = '';

        // 카드 정렬 적용
        const sortedCards = this.gameManager.cardManager.sortCards(this.availableCards);

        sortedCards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.grid.appendChild(cardElement);
        });
    }

    /**
     * 카드 요소 생성 (UIManager.createCardGalleryElement와 동일한 방식)
     */
    createCardElement(card, index) {
        // 갤러리 카드 크기 (gameConfig에서 가져오기)
        const cardSize = GameConfig.cardSizes.preview;

        // 통일된 카드 렌더러로 카드 생성
        const cardElement = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive: false,
            opacity: 1,
            context: 'default' // 카드 선택 모달은 기본값
        });

        // 카드 선택 스타일 적용
        cardElement.className = 'card-selection-item';

        // 클릭 이벤트 핸들러
        cardElement.addEventListener('click', () => {
            // 카드 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.cardSelectionClick || 'cardClick');
            }
            this.showCardDetail(card);
        });

        return cardElement;
    }

    /**
     * 카드 상세 모달 표시
     */
    showCardDetail(card) {
        this.selectedCard = card;

        if (!this.detailModal || !this.detailCard) return;

        // 확대된 카드 크기
        const cardSize = GameConfig.cardSizes.large || { width: 200, height: 280 };

        // 확대 카드 생성
        const enlargedCard = this.domCardRenderer.createCard(card, cardSize.width, cardSize.height, {
            isSelected: false,
            isHighlighted: false,
            isNextActive: false,
            opacity: 1,
            context: 'default' // 카드 선택 모달은 기본값
        });

        // 카드 상세 내용 업데이트
        this.detailCard.innerHTML = '';
        this.detailCard.appendChild(enlargedCard);

        // 상세 모달 표시
        this.detailModal.classList.remove('hidden');
    }

    /**
     * 카드 상세 모달 숨김
     */
    hideDetailModal() {
        if (this.detailModal) {
            this.detailModal.classList.add('hidden');
        }
        this.selectedCard = null;
    }

    /**
     * 카드 선택 처리
     */
    handleCardSelect() {
        if (!this.selectedCard) {
            console.error('[CardSelectionModal] selectedCard가 없습니다!');
            return;
        }

        // 콜백을 먼저 호출하고 나서 hide() 호출 (selectedCard가 null이 되기 전에)
        if (this.onCardSelected) {
            this.onCardSelected(this.selectedCard);
        } else {
            console.error('[CardSelectionModal] 콜백이 설정되지 않음!');
            return;
        }

        this.hide();
    }

    /**
     * 그리드 클리어
     */
    clearGrid() {
        if (this.grid) {
            this.grid.innerHTML = '';
        }
        if (this.detailCard) {
            this.detailCard.innerHTML = '';
        }
    }

    /**
     * 메인 취소 버튼 처리 (메인 메뉴로 돌아가기)
     */
    handleMainCancel() {
        // 모달 숨기기
        this.hide();

        // 게임 매니저를 통해 메인 메뉴로 돌아가기
        if (this.gameManager && this.gameManager.showMainMenu) {
            this.gameManager.showMainMenu();
        } else {
            console.warn('[CardSelectionModal] gameManager.showMainMenu가 없습니다');
        }
    }

    /**
     * 정리
     */
    cleanup() {
        this.clearGrid();
        this.selectedCard = null;
        this.availableCards = [];
    }
}