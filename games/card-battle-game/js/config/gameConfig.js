// 게임 설정 및 상수 정의

const GameConfig = {
    // 게임 버전
    version: '1.0.0',

    // 화면 설정 - 고정 크기 (반응형 제거)
    canvas: {
        width: 1247,
        height: 832,
        targetFPS: 60
    },

    // 속성 시스템
    elements: {
        fire: {
            name: '불',
            color: '#FF6B6B',      // 코랄/주황색
            emoji: '🔥',
            strong: 'poison',       // 독에 강함
            weak: 'water',         // 물에 약함
            immunity: 'burn'       // 화상 면역
        },
        water: {
            name: '물',
            color: '#87CEEB',      // 하늘색
            emoji: '💧',
            strong: 'fire',        // 불에 강함
            weak: 'electric',      // 전기에 약함
            immunity: 'burn'       // 화상 면역
        },
        electric: {
            name: '전기',
            color: '#FFD700',      // 노랑색
            emoji: '⚡',
            strong: 'water',       // 물에 강함
            weak: 'poison',        // 독에 약함
            immunity: 'paralysis'  // 마비 면역
        },
        poison: {
            name: '독',
            color: '#9B59B6',      // 보라색
            emoji: '☠️',
            strong: 'electric',    // 전기에 강함
            weak: 'fire',          // 불에 약함
            immunity: 'poison'     // 중독 면역
        },
        normal: {
            name: '노멀',
            color: '#F8F9FA',      // 밝은 회색/하얀색
            emoji: '👊',
            strong: null,          // 강점 없음
            weak: null,           // 약점 없음
            immunity: null        // 면역 없음
        }
    },

    // 상성 배율
    typeEffectiveness: {
        strong: 1.5,    // 강점으로 공격 시 1.5배 대미지
        normal: 1.0,    // 보통 대미지
        weak: 0.5       // 약점으로 공격 시 0.5배 대미지
    },

    // 상태이상 정의
    statusEffects: {
        taunt: {
            name: '도발',
            emoji: '😡',
            description: '다음 턴에 공격 카드만 발동',
            duration: 1,
            color: '#E74C3C'
        },
        stun: {
            name: '기절',
            emoji: '😵',
            description: '다음 턴에 아무 카드도 발동되지 않음',
            duration: 1,
            color: '#8E44AD'
        },
        paralysis: {
            name: '마비',
            emoji: '⚡',
            description: '확률적으로 턴을 넘김',
            defaultChance: 30,
            color: '#F39C12'
        },
        burn: {
            name: '화상',
            emoji: '🔥',
            description: '턴 시작 시 최대 HP의 일정 비율 대미지',
            defaultPercent: 5,
            color: '#E67E22'
        },
        poisoned: {
            name: '중독',
            emoji: '☠️',
            description: '턴 종료 시 최대 HP의 일정 비율 대미지',
            defaultPercent: 7,
            color: '#9B59B6'
        }
    },

    // 카드 타입
    cardTypes: {
        attack: { nameKey: 'auto_battle_card_game.ui.card_types.attack', name: '공격', color: '#E74C3C' },
        defense: { nameKey: 'auto_battle_card_game.ui.card_types.defense', name: '방어', color: '#3498DB' },
        status: { nameKey: 'auto_battle_card_game.ui.card_types.status', name: '상태이상', color: '#9B59B6' },
        buff: { nameKey: 'auto_battle_card_game.ui.card_types.buff', name: '버프', color: '#2ECC71' },
        debuff: { nameKey: 'auto_battle_card_game.ui.card_types.debuff', name: '디버프', color: '#E67E22' },
        special: { nameKey: 'auto_battle_card_game.ui.card_types.special', name: '특수', color: '#F39C12' }
    },

    // 플레이어 설정
    player: {
        maxHandSize: 10,
        startingHP: 100,
        defaultDefenseElement: 'normal'
    },

    // 적 설정
    enemy: {
        maxHandSize: 20,
        startingHP: 100,
        defaultDefenseElement: 'normal'
    },

    // 카드 크기 설정
    cardSizes: {
        hand: { width: 100, height: 140 },       // 손패 카드 크기 (설명 표시를 위해 증가)
        enlarged: { width: 300, height: 420 },   // 발동 시 확대 크기
        preview: { width: 180, height: 252 }     // 갤러리 미리보기 크기 (50% 증가)
    },

    // 손패 겹침 설정
    handOverlap: {
        1: 0,      // 1-3장: 겹침 없음
        2: 0,
        3: 0,
        4: 0.5,    // 4-6장: 50% 겹침
        5: 0.5,
        6: 0.5,
        7: 0.3,    // 7-9장: 30% 겹침
        8: 0.3,
        9: 0.3,
        10: 0.2    // 10장: 20% 겹침
    },

    // 애니메이션 설정
    animations: {
        cardActivation: 2000,      // 카드 발동 시 표시 시간 (ms)
        turnTransition: 1000,      // 턴 전환 시간 (ms)
        damageDisplay: 1500,       // 대미지 표시 시간 (ms)
        statusEffectDisplay: 1000  // 상태이상 표시 시간 (ms)
    },

    // 게임 속도 설정
    gameSpeed: {
        '1x': 1.0,
        '2x': 2.0,
        '3x': 3.0
    },

    // UI 위치 설정
    ui: {
        playerInfo: { x: 50, y: 650 },           // 플레이어 정보 위치
        enemyInfo: { x: 50, y: 50 },             // 적 정보 위치
        playerHand: { x: 640, y: 600 },          // 플레이어 손패 중앙 위치
        enemyHand: { x: 640, y: 120 },           // 적 손패 중앙 위치
        cardActivation: { x: 640, y: 360 },      // 카드 발동 표시 위치 (화면 중앙)
        stageInfo: { x: 1200, y: 650 },          // 스테이지 정보 위치
        enemyName: { x: 1200, y: 50 }            // 적 이름 위치
    },

    // 카드 스타일 통일 설정
    cardStyle: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#3498db',
        backgroundColor: {
            default: 'linear-gradient(135deg, rgba(52, 73, 94, 0.9), rgba(44, 62, 80, 0.9))',
            element: true // 속성별 색상 사용
        },
        textOutline: {
            enabled: true,
            color: '#000',
            width: 1
        },
        fontRatio: {
            emoji: 0.17,    // 높이의 17%
            name: 0.074,    // 높이의 7.4%
            type: 0.058,    // 높이의 5.8%
            stats: 0.058,   // 높이의 5.8%
            description: 0.052 // 높이의 5.2% (약간 축소)
        },
        padding: {
            x: 8,
            y: 8
        },
        layout: {
            emoji: { y: 0.13 },      // 상단에서 13%
            name: { y: 0.30 },       // 상단에서 30% (위로 이동)
            type: { y: 0.38 },       // 상단에서 38% (위로 이동)
            stats: { y: 0.84 },      // 하단에서 16%
            description: { y: 0.58 } // 상단에서 58% (크게 위로 이동하여 stats와 겹치지 않게)
        },
        shadows: {
            card: '0 4px 8px rgba(0, 0, 0, 0.3)',
            hover: '0 8px 16px rgba(0, 0, 0, 0.4)'
        }
    },

    // 메인 메뉴 레이아웃 설정
    mainMenu: {
        title: {
            size: 56,                            // 제목 폰트 크기
            y: 150,                              // 제목 Y 위치
            shadowOffset: 4                      // 그림자 오프셋
        },
        subtitle: {
            size: 20,                            // 부제목 폰트 크기
            offsetY: 60                          // 제목으로부터의 Y 오프셋
        },
        menuItems: {
            startY: 280,                         // 메뉴 시작 Y 위치
            itemHeight: 60,                      // 메뉴 아이템 간격
            width: 320,                          // 메뉴 아이템 너비
            height: 50,                          // 메뉴 아이템 높이
            iconSize: 28,                        // 아이콘 크기
            textSize: {
                normal: 18,                      // 일반 텍스트 크기
                selected: 20                     // 선택된 텍스트 크기
            },
            // 위치는 렌더링 시 동적으로 계산 (중앙 정렬)
            centerAligned: true                  // 완전 중앙 정렬 활성화
        },
        background: {
            pattern: {
                enabled: false,                  // 배경 패턴 활성화 여부
                opacity: 0.03,                   // 패턴 투명도 (매우 낮음)
                cardSize: { width: 40, height: 50 }, // 카드 크기
                spacing: 120                     // 카드 간격
            }
        },
        instructions: {
            startY: -80,                         // 화면 하단으로부터의 오프셋
            lineHeight: 20,                      // 줄 간격
            fontSize: 14                         // 폰트 크기
        }
    },

    // 카드 선택 화면 설정
    cardSelection: {
        title: {
            y: 50,              // 제목 Y 위치
            fontSize: 28,       // 제목 폰트 크기
            shadowOffset: 2     // 그림자 오프셋
        },
        progress: {
            y: 75,              // 진행상황 Y 위치
            fontSize: 16        // 진행상황 폰트 크기
        },
        instructions: {
            startY: 100,        // 안내 메시지 시작 Y 위치
            lineHeight: 18,     // 줄 간격
            fontSize: 14        // 폰트 크기
        },
        cards: {
            startY: 180,        // 카드 그리드 시작 Y 위치
            width: 140,         // 카드 너비
            height: 190,        // 카드 높이
            spacing: 160,       // 카드 간격
            maxCols: 5          // 최대 열 수
        }
    },

    // 색상 테마
    colors: {
        background: '#2C3E50',
        text: '#FFFFFF',
        textShadow: '#000000',
        uiBackground: 'rgba(0, 0, 0, 0.7)',
        buttonPrimary: '#3498DB',
        buttonSecondary: '#95A5A6',
        danger: '#E74C3C',
        success: '#2ECC71',
        warning: '#F39C12'
    }
};

// 유틸리티 함수들
GameConfig.utils = {
    // 속성 상성 계산
    getTypeEffectiveness: function(attackElement, defenseElement) {
        if (!attackElement || !defenseElement) return GameConfig.typeEffectiveness.normal;

        const attacker = GameConfig.elements[attackElement];
        if (!attacker) return GameConfig.typeEffectiveness.normal;

        if (attacker.strong === defenseElement) {
            return GameConfig.typeEffectiveness.strong;
        } else if (attacker.weak === defenseElement) {
            return GameConfig.typeEffectiveness.weak;
        }

        return GameConfig.typeEffectiveness.normal;
    },

    // 손패 겹침 비율 계산
    getHandOverlapRatio: function(cardCount) {
        return GameConfig.handOverlap[Math.min(cardCount, 10)] || 0;
    },

    // 속성별 방어 타입 계산 (손패에서 가장 많은 속성)
    calculateDefenseElement: function(cards) {
        if (!cards || cards.length === 0) return 'normal';

        const elementCounts = {};

        // 각 속성별 카드 개수 계산
        cards.forEach(card => {
            const element = card.element || 'normal';
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        });

        // 가장 많은 속성 찾기
        let maxCount = 0;
        let defenseElement = 'normal';
        let tiedElements = [];

        for (const [element, count] of Object.entries(elementCounts)) {
            if (count > maxCount) {
                maxCount = count;
                defenseElement = element;
                tiedElements = [element];
            } else if (count === maxCount) {
                tiedElements.push(element);
            }
        }

        // 동점인 경우 normal 우선
        if (tiedElements.length > 1) {
            return tiedElements.includes('normal') ? 'normal' : tiedElements[0];
        }

        return defenseElement;
    },

    // 게임 속도 적용
    applyGameSpeed: function(baseTime, speedMultiplier = 1) {
        return Math.max(100, baseTime / speedMultiplier); // 최소 100ms
    },

    // 상태이상 면역 체크
    isImmuneToStatus: function(defenseElement, statusType) {
        const element = GameConfig.elements[defenseElement];
        if (!element || !element.immunity) return false;

        return element.immunity === statusType;
    }
};

// 전역 객체로 등록
window.GameConfig = GameConfig;