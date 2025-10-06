/**
 * 버프/상태이상 툴팁 모달 - 인라인 라벨 클릭 시 설명 표시
 * Configuration-Driven: 모든 스타일은 GameConfig.tooltipModal에서 참조
 */
class BuffStatusTooltipModal {
    constructor() {
        // DOM 요소들
        this.modal = null;
        this.content = null;
        this.header = null;
        this.emoji = null;
        this.name = null;
        this.description = null;

        // 상태
        this.isVisible = false;
        this.currentType = null;
        this.currentKey = null;

        this.initialize();
    }

    /**
     * 초기화 - DOM 요소 생성 및 이벤트 리스너 설정
     */
    initialize() {
        // 모달이 이미 존재하면 재사용
        this.modal = document.getElementById('tooltip-modal');

        if (!this.modal) {
            console.warn('[BuffStatusTooltipModal] tooltip-modal 요소를 찾을 수 없습니다. HTML에 추가가 필요합니다.');
            return;
        }

        // DOM 요소 참조
        this.content = this.modal.querySelector('.tooltip-modal-content');
        this.header = this.modal.querySelector('.tooltip-header');
        this.emoji = this.modal.querySelector('.tooltip-emoji');
        this.name = this.modal.querySelector('.tooltip-name');
        this.description = this.modal.querySelector('.tooltip-description');

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 외부 클릭 시 닫기
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }

        // ESC 키로 닫기 (비활성화)
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape' && this.isVisible) {
        //         this.hide();
        //     }
        // });
    }

    /**
     * 툴팁 모달 표시
     * @param {string} labelType - 'buff', 'status', 'cardType', 'defense', 'hp', 또는 속성
     * @param {string} labelKey - 'strength', 'burn', 'attack' 등
     */
    show(labelType, labelKey) {
        // 클릭 사운드 재생 (중앙화된 처리)
        if (window.gameManager?.audioSystem) {
            window.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
        }

        // 초기화되지 않았으면 재시도 (Lazy Initialization)
        if (!this.modal) {
            this.initialize();
        }

        if (!this.modal) {
            console.warn('[BuffStatusTooltipModal] 모달을 초기화할 수 없습니다. HTML 요소를 찾을 수 없습니다.');
            return;
        }

        this.currentType = labelType;
        this.currentKey = labelKey;

        // 라벨 정보 가져오기 (DescriptionParser 재사용)
        const labelInfo = this.getLabelInfo(labelType, labelKey);
        if (!labelInfo) {
            console.warn(`[BuffStatusTooltipModal] 라벨 정보를 찾을 수 없습니다: {${labelType}:${labelKey}}`);
            return;
        }

        // 설명 가져오기
        const description = this.getDescription(labelType, labelKey);
        if (!description) {
            console.warn(`[BuffStatusTooltipModal] 설명을 찾을 수 없습니다: {${labelType}:${labelKey}}`);
            return;
        }

        // 콘텐츠 업데이트
        this.updateContent(labelInfo, description);

        // 모달 표시
        this.modal.classList.remove('hidden');
        this.isVisible = true;

        // 페이드 인 애니메이션 (Configuration-Driven)
        const fadeInDuration = GameConfig?.tooltipModal?.animation?.fadeIn || 150;
        this.modal.style.animation = `fadeIn ${fadeInDuration}ms ease`;
    }

    /**
     * 툴팁 모달 숨김
     */
    hide() {
        if (!this.modal || !this.isVisible) return;

        // 페이드 아웃 애니메이션 (Configuration-Driven)
        const fadeOutDuration = GameConfig?.tooltipModal?.animation?.fadeOut || 100;
        this.modal.style.animation = `fadeOut ${fadeOutDuration}ms ease`;

        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.isVisible = false;
            this.currentType = null;
            this.currentKey = null;
        }, fadeOutDuration);
    }

    /**
     * 콘텐츠 업데이트
     * @param {Object} labelInfo - {emoji, name, color}
     * @param {string} description - 설명 텍스트
     */
    updateContent(labelInfo, description) {
        if (!this.emoji || !this.name || !this.description) return;

        // 이모지 업데이트
        this.emoji.textContent = labelInfo.emoji || '';
        this.emoji.style.color = labelInfo.color || '#FFD700';

        // 이름 업데이트
        this.name.textContent = labelInfo.name || '';
        this.name.style.color = labelInfo.color || '#FFD700';

        // 설명 업데이트
        this.description.textContent = description;
    }

    /**
     * 라벨 정보 가져오기 (DescriptionParser 재사용)
     * @param {string} labelType
     * @param {string} labelKey
     * @returns {Object|null} {emoji, name, color}
     */
    getLabelInfo(labelType, labelKey) {
        // 방어속성 배지 특별 처리
        if (labelType === 'defenseElement') {
            const elementConfig = GameConfig?.elements?.[labelKey];
            if (elementConfig) {
                // HPBarSystem과 동일한 키 참조 방식 사용 (ui.elements 경로)
                const elementNameKey = `auto_battle_card_game.ui.elements.${labelKey}`;
                let name = labelKey;
                if (typeof I18nHelper !== 'undefined') {
                    name = I18nHelper.getText(elementNameKey) || labelKey;
                }
                return {
                    emoji: elementConfig.emoji || '🛡️',
                    name: name,
                    color: elementConfig.color || '#999'
                };
            }
            return null;
        }

        // DescriptionParser가 있으면 재사용
        if (typeof DescriptionParser !== 'undefined') {
            return DescriptionParser.getLabelInfo(labelType, labelKey);
        }

        // 폴백: 직접 GameConfig에서 가져오기
        const configMap = {
            buff: GameConfig?.buffs,
            status: GameConfig?.statusEffects,
            cardType: GameConfig?.cardTypes
        };

        const config = configMap[labelType]?.[labelKey];
        if (!config) return null;

        // 다국어 이름
        let name = config.name;
        if (config.nameKey && typeof I18nHelper !== 'undefined') {
            name = I18nHelper.getText(config.nameKey) || config.name;
        }

        return {
            emoji: config.emoji || '',
            name: name || labelKey,
            color: config.color || '#999'
        };
    }

    /**
     * 설명 가져오기 (GameConfig + 언어팩)
     * @param {string} labelType
     * @param {string} labelKey
     * @returns {string|null} 설명 텍스트
     */
    getDescription(labelType, labelKey) {
        // defense, hp 특별 처리
        if (labelType === 'defense') {
            return this.getStatDescription('defense');
        }
        if (labelType === 'hp') {
            return this.getStatDescription('hp');
        }

        // 방어속성 배지 처리 (defenseElement)
        if (labelType === 'defenseElement') {
            return this.getDefenseElementDescription(labelKey);
        }

        // 속성 처리
        const elementTypes = ['fire', 'water', 'electric', 'poison', 'normal'];
        if (elementTypes.includes(labelType)) {
            return this.getElementDescription(labelType);
        }

        // 버프/상태이상/카드타입 처리
        const configMap = {
            buff: GameConfig?.buffs,
            status: GameConfig?.statusEffects,
            cardType: GameConfig?.cardTypes
        };

        const config = configMap[labelType]?.[labelKey];
        if (!config) return null;

        // descriptionKey로 다국어 설명 조회
        if (config.descriptionKey && typeof I18nHelper !== 'undefined') {
            const description = I18nHelper.getText(config.descriptionKey);
            if (description && description !== config.descriptionKey) {
                return description;
            }
        }

        // 폴백: description 속성 사용
        return config.description || `${config.name || labelKey}에 대한 설명이 없습니다.`;
    }

    /**
     * 스탯(defense, hp) 설명 가져오기
     * @param {string} statType - 'defense' | 'hp'
     * @returns {string} 설명 텍스트
     */
    getStatDescription(statType) {
        // 언어팩에서 조회 (ui.stats 구조로 통일)
        const descriptionKey = `auto_battle_card_game.ui.stats.${statType}_description`;
        if (typeof I18nHelper !== 'undefined') {
            const description = I18nHelper.getText(descriptionKey);
            if (description && description !== descriptionKey) {
                return description;
            }
        }

        // 폴백
        const fallbacks = {
            defense: '받는 피해를 줄여주는 방어력입니다. 공격을 받으면 먼저 방어력이 소모됩니다.',
            hp: '캐릭터의 생명력입니다. 0이 되면 패배합니다.'
        };
        return fallbacks[statType] || '';
    }

    /**
     * 속성 설명 가져오기
     * @param {string} element - 'fire', 'water', 'electric', 'poison', 'normal'
     * @returns {string} 설명 텍스트
     */
    getElementDescription(element) {
        const elementConfig = GameConfig?.elements?.[element];
        if (!elementConfig) return '';

        // descriptionKey로 다국어 설명 조회
        if (elementConfig.descriptionKey && typeof I18nHelper !== 'undefined') {
            const description = I18nHelper.getText(elementConfig.descriptionKey);
            if (description && description !== elementConfig.descriptionKey) {
                return description;
            }
        }

        // 폴백
        return elementConfig.description || `${element} 속성에 대한 설명이 없습니다.`;
    }

    /**
     * 방어속성 배지 설명 가져오기 (간결한 버전)
     * @param {string} element - 'fire', 'water', 'electric', 'poison', 'normal'
     * @returns {string} 설명 텍스트
     */
    getDefenseElementDescription(element) {
        // 새로 추가한 defense_element_descriptions 키 사용
        if (typeof I18nHelper !== 'undefined') {
            const descriptionKey = `auto_battle_card_game.ui.defense_element_descriptions.${element}`;
            const description = I18nHelper.getText(descriptionKey);
            if (description && description !== descriptionKey) {
                return description;
            }
        }

        // 폴백: 기본 속성 설명 사용
        const elementConfig = GameConfig?.elements?.[element];
        if (elementConfig) {
            return elementConfig.description || `${element} 방어속성에 대한 설명이 없습니다.`;
        }

        return `${element} 방어속성에 대한 설명이 없습니다.`;
    }
}

// Lazy Singleton 패턴 - 첫 사용 시에만 인스턴스 생성
let tooltipModalInstance = null;

window.BuffStatusTooltipModal = {
    getInstance() {
        if (!tooltipModalInstance) {
            try {
                tooltipModalInstance = new BuffStatusTooltipModal();
            } catch (error) {
                console.error('[BuffStatusTooltipModal] 인스턴스 생성 실패:', error);
                return null;
            }
        }
        return tooltipModalInstance;
    },

    show(labelType, labelKey) {
        const instance = this.getInstance();
        if (instance) {
            return instance.show(labelType, labelKey);
        }
    },

    hide() {
        const instance = this.getInstance();
        if (instance) {
            return instance.hide();
        }
    }
};
