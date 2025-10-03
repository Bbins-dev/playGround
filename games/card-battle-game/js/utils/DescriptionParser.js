// 카드 설명 텍스트 파서 - 인라인 라벨 마커 처리
// Configuration-Driven: GameConfig의 버프/상태이상/카드타입 정보 활용

class DescriptionParser {
    /**
     * 설명 텍스트를 파싱하여 텍스트와 라벨 세그먼트로 분리
     * @param {string} text - 파싱할 텍스트 (예: "자신에게 1 데미지를 가하고 {buff:strength} 3을 얻습니다")
     * @returns {Array} 세그먼트 배열 [{type: 'text'|'label', content/labelType/labelKey}]
     */
    static parse(text) {
        if (!text) return [];

        // 마커 형식: {buff:strength}, {status:burn}, {cardType:attack}, {defense}
        const regex = /\{(buff|status|cardType):(\w+)\}|\{(defense)\}/g;
        const segments = [];
        let lastIndex = 0;

        let match;
        while ((match = regex.exec(text)) !== null) {
            // 마커 앞의 일반 텍스트
            if (match.index > lastIndex) {
                segments.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index)
                });
            }

            // 라벨 세그먼트
            if (match[3] === 'defense') {
                // {defense} 단독 마커
                segments.push({
                    type: 'label',
                    labelType: 'defense',
                    labelKey: 'defense'
                });
            } else {
                // {type:key} 형식 마커
                segments.push({
                    type: 'label',
                    labelType: match[1],  // 'buff', 'status', 'cardType'
                    labelKey: match[2]    // 'strength', 'burn', 'attack' 등
                });
            }

            lastIndex = regex.lastIndex;
        }

        // 마지막 일반 텍스트
        if (lastIndex < text.length) {
            segments.push({
                type: 'text',
                content: text.substring(lastIndex)
            });
        }

        return segments;
    }

    /**
     * GameConfig에서 라벨 정보 가져오기
     * @param {string} labelType - 'buff', 'status', 'cardType', 'defense'
     * @param {string} labelKey - 'strength', 'burn', 'attack', 'defense' 등
     * @returns {Object|null} {emoji, name, color} 또는 null
     */
    static getLabelInfo(labelType, labelKey) {
        // defense는 특별 처리 (은색 라벨)
        if (labelType === 'defense') {
            const defenseNames = {
                ko: '방어력',
                en: 'Defense',
                ja: '防御力'
            };
            const langSelect = document.getElementById('languageSelect');
            const currentLang = langSelect ? langSelect.value : 'ko';

            return {
                emoji: '🛡️',
                name: defenseNames[currentLang] || defenseNames.ko,
                color: '#C0C0C0'  // 은색
            };
        }

        const configMap = {
            buff: GameConfig?.buffs,
            status: GameConfig?.statusEffects,
            cardType: GameConfig?.cardTypes
        };

        const config = configMap[labelType]?.[labelKey];
        if (!config) {
            console.warn(`[DescriptionParser] Unknown label: {${labelType}:${labelKey}}`);
            return null;
        }

        // 다국어 이름 (I18nHelper 사용)
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
     * 라벨 스타일 CSS 생성 (DOMCardRenderer용)
     * @param {Object} labelInfo - getLabelInfo 반환값
     * @param {number} fontSize - 폰트 크기
     * @returns {string} CSS 문자열
     */
    static getLabelCSS(labelInfo, fontSize) {
        if (!labelInfo) return '';

        const padding = Math.max(1, Math.floor(fontSize * 0.1));
        const borderRadius = Math.max(2, Math.floor(fontSize * 0.15));

        return `
            display: inline-block;
            border: 1px solid ${labelInfo.color};
            background: linear-gradient(135deg, ${labelInfo.color}, ${labelInfo.color}CC);
            padding: ${padding}px ${padding * 2}px;
            border-radius: ${borderRadius}px;
            font-size: ${fontSize}px;
            font-weight: bold;
            color: #FFFFFF;
            margin: 0 2px;
            white-space: nowrap;
            vertical-align: baseline;
            text-shadow:
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000;
        `.trim();
    }
}

// 전역 객체로 등록
window.DescriptionParser = DescriptionParser;
