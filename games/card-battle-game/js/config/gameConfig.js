// 게임 설정 및 상수 정의

const GameConfig = {
    // 게임 버전
    version: '1.0.0',

    // 화면 설정 - 고정 크기 (반응형 제거)
    canvas: {
        width: 750,
        height: 960,
        targetFPS: 60
    },

    // 속성 시스템
    elements: {
        fire: {
            name: '불',
            nameKey: 'auto_battle_card_game.elements.fire',
            color: '#FF6B6B',      // 코랄/주황색
            emoji: '🔥',
            strong: 'poison',       // 독에 강함
            weak: 'water',         // 물에 약함
            immunity: 'burn'       // 화상 면역
        },
        water: {
            name: '물',
            nameKey: 'auto_battle_card_game.elements.water',
            color: '#87CEEB',      // 하늘색
            emoji: '💧',
            strong: 'fire',        // 불에 강함
            weak: 'electric',      // 전기에 약함
            immunity: 'burn'       // 화상 면역
        },
        electric: {
            name: '전기',
            nameKey: 'auto_battle_card_game.elements.electric',
            color: '#FFD700',      // 노랑색
            emoji: '⚡',
            strong: 'water',       // 물에 강함
            weak: 'poison',        // 독에 약함
            immunity: 'paralysis'  // 마비 면역
        },
        poison: {
            name: '독',
            nameKey: 'auto_battle_card_game.elements.poison',
            color: '#9B59B6',      // 보라색
            emoji: '☠️',
            strong: 'electric',    // 전기에 강함
            weak: 'fire',          // 불에 약함
            immunity: 'poison'     // 중독 면역
        },
        normal: {
            name: '노멀',
            nameKey: 'auto_battle_card_game.elements.normal',
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
            nameKey: 'auto_battle_card_game.ui.status_effects.taunt',
            name: '도발',
            emoji: '😡',
            description: '다음 턴에 공격 카드만 발동',
            duration: 1,
            color: '#E74C3C'
        },
        stun: {
            nameKey: 'auto_battle_card_game.ui.status_effects.stun',
            name: '기절',
            emoji: '😵',
            description: '다음 턴에 아무 카드도 발동되지 않음',
            duration: 1,
            color: '#8E44AD'
        },
        paralysis: {
            nameKey: 'auto_battle_card_game.ui.status_effects.paralysis',
            name: '마비',
            emoji: '⚡',
            description: '확률적으로 턴을 넘김',
            defaultChance: 30,
            color: '#F39C12'
        },
        burn: {
            nameKey: 'auto_battle_card_game.ui.status_effects.burn',
            name: '화상',
            emoji: '🔥',
            description: '턴 시작 시 최대 HP의 일정 비율 대미지',
            defaultPercent: 5,
            color: '#E67E22'
        },
        poisoned: {
            nameKey: 'auto_battle_card_game.ui.status_effects.poisoned',
            name: '중독',
            emoji: '☠️',
            description: '턴 종료 시 최대 HP의 일정 비율 대미지',
            defaultPercent: 7,
            color: '#9B59B6'
        }
    },

    // 버프 정의
    buffs: {
        // TODO: 힘 버프 등 다른 버프 시스템 구현 예정
    },

    // 카드 타입
    cardTypes: {
        attack: {
            nameKey: 'auto_battle_card_game.ui.card_types.attack',
            name: '공격',
            color: '#E74C3C',
            emoji: '⚔️',
            statEmojis: { power: '⚔️', accuracy: '🎯' }
        },
        defense: {
            nameKey: 'auto_battle_card_game.ui.card_types.defense',
            name: '방어',
            color: '#3498DB',
            emoji: '🛡️',
            statEmojis: { power: '🛡️', accuracy: '✅' }
        },
        status: {
            nameKey: 'auto_battle_card_game.ui.card_types.status',
            name: '상태이상',
            color: '#9B59B6',
            emoji: '💀',
            statEmojis: { power: '⏱️', accuracy: '✅' }
        },
        buff: {
            nameKey: 'auto_battle_card_game.ui.card_types.buff',
            name: '버프',
            color: '#2ECC71',
            emoji: '⭐',
            statEmojis: { power: '⬆️', accuracy: '✅' }
        },
        debuff: {
            nameKey: 'auto_battle_card_game.ui.card_types.debuff',
            name: '디버프',
            color: '#E67E22',
            emoji: '💔',
            statEmojis: { power: '⬇️', accuracy: '✅' }
        },
        special: {
            nameKey: 'auto_battle_card_game.ui.card_types.special',
            name: '특수',
            color: '#F39C12',
            emoji: '💎',
            statEmojis: { power: '💎', accuracy: '✅' }
        }
    },

    // 플레이어 설정
    player: {
        maxHandSize: 10,
        startingHP: 80,
        defaultDefenseElement: 'normal'
    },

    // 체력 회복 시스템
    healing: {
        stageHealing: 5,        // 매 스테이지 회복량
        fullHealInterval: 10    // 10의 배수 스테이지마다 완전 회복
    },

    // 플레이어 이름 설정
    playerName: {
        maxLength: 12,              // 최대 이름 길이
        allowEmpty: true,           // 빈 이름 허용 (기본값 사용)
        trimWhitespace: true        // 공백 제거
    },

    // 적 설정 (플레이어와 동일한 룰 적용)
    enemy: {
        maxHandSize: 10,
        startingHP: 10,
        defaultDefenseElement: 'normal'
    },

    // 카드 크기 설정
    cardSizes: {
        hand: { width: 120, height: 168 },       // 손패 카드 크기 (20% 확대)
        enlarged: { width: 400, height: 560 },   // 발동 시 확대 크기 (33% 증가)
        preview: { width: 260, height: 364 },    // 갤러리 미리보기 크기 (확대됨)
        large: { width: 320, height: 448 },      // 카드 디테일 모달 크기 (preview보다 크고 enlarged보다 작음)
        victory: { width: 120, height: 168 },    // 승리 모달 보상 카드 크기 (20% 확대)
        victoryDetail: { width: 360, height: 504 } // 승리 모달 확대 카드 크기 (260% 확대)
    },

    // 손패 레이아웃 설정
    handLayout: {
        rows: 2,                        // 두 줄 배치
        cardsPerRow: 5,                 // 줄당 최대 5장
        rowSpacing: 0.1,                // 줄 간격 (카드 높이의 10%)
        activationOrder: 'leftToRightTopToBottom', // 발동 순서: 왼쪽 위 → 오른쪽 → 아래줄
        cardSpacing: 5                  // 카드 간 간격
    },

    // 손패 겹침 설정 (레거시 - handLayout 우선 사용)
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
        cardInterval: 1200,        // 카드 간 발동 간격 (ms)
        turnTransition: 1000,      // 턴 전환 시간 (ms)
        damageDisplay: 1500,       // 대미지 표시 시간 (ms)
        statusEffectDisplay: 1000  // 상태이상 표시 시간 (ms)
    },

    // 타이밍 설정 - Magic Number 정리
    timing: {
        modal: {
            fadeIn: 300,           // 모달 페이드인 시간
            fadeOut: 300,          // 모달 페이드아웃 시간
            display: 2000,         // 자동 전환 대기시간
            transition: 200        // 일반 전환 시간
        },
        battle: {
            pauseDelay: 1000,      // 전투 일시정지 딜레이
            resumeDelay: 500,      // 전투 재개 딜레이
            actionDelay: 300,      // 액션 간 딜레이
            animationStep: 100     // 애니메이션 스텝 간격
        },
        ui: {
            clickFeedback: 100,    // 클릭 피드백 시간
            hoverDelay: 200,       // 호버 딜레이
            tooltipDelay: 500      // 툴팁 표시 딜레이
        },
        effects: {
            shortFlash: 200,       // 짧은 플래시
            longFlash: 500,        // 긴 플래시
            fadeOut: 1000,         // 페이드아웃
            slideIn: 300           // 슬라이드인
        }
    },

    // 렌더링 최적화 설정
    rendering: {
        dirtyCheck: true,          // Dirty checking 활성화
        maxFPS: 60,                // 최대 FPS
        cullDistance: 100,         // 화면 밖 컬링 거리
        cacheTimeout: 5000,        // 캐시 타임아웃 (ms)
        batchSize: 10              // 배치 렌더링 크기
    },

    // 게임 속도 설정
    gameSpeed: {
        '1x': 1.0,
        '2x': 2.0,
        '3x': 3.0
    },

    // UI 위치 설정
    ui: {
        playerInfo: { x: 50, y: 750 },           // 플레이어 정보 위치
        enemyInfo: { x: 50, y: 50 },             // 적 정보 위치
        playerHand: { x: 375, y: 660 },          // 플레이어 손패 중앙 위치 (화면 중앙+180px)
        enemyHand: { x: 375, y: 300 },           // 적 손패 중앙 위치 (화면 중앙-180px)
        cardActivation: { x: 375, y: 480 },      // 카드 발동 표시 위치 (화면 중앙)
        stageInfo: { x: 700, y: 750 },           // 스테이지 정보 위치
        enemyName: { x: 700, y: 50 }             // 적 이름 위치
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
            description: { y: 0.46 } // 상단에서 46% (카드 중앙에 더 가깝게 위치)
        },
        // 활성 카드 글로우 설정
        activeCardGlow: {
            color: '#ff4444',                 // 붉은색 글로우
            secondaryColor: '#ff6666',        // 보조 글로우 색상
            borderWidth: 4,                   // 더 두꺼운 테두리
            glowRadius: 12,                   // 글로우 반경
            glowIntensity: 0.8,               // 글로우 강도
            pulseSpeed: 2000,                 // 펄스 애니메이션 속도 (ms)
            fadeoutDuration: 800              // 잔상 페이드아웃 시간 (ms)
        },
        // 속성 라벨 설정
        elementLabel: {
            position: { x: 0.04, y: 0.08 },  // 카드 크기 대비 비율 (좌상단)
            fontSize: 0.045,                  // 카드 높이 대비 폰트 크기
            padding: { x: 6, y: 3 },          // 라벨 내부 패딩
            backgroundOpacity: 0.9,           // 배경 투명도
            darkenFactor: 0.3,                // 속성색을 어둡게 하는 비율
            borderRadius: 4,                  // 모서리 둥글기
            textColor: '#fff',                // 텍스트 색상
            textOutline: {
                enabled: true,
                color: '#000',
                width: 0.5
            }
        },
        // 카드 이름 개선 설정
        cardName: {
            maxLines: 2,                      // 최대 2줄
            minFontRatio: 0.05,               // 최소 폰트 크기 비율
            maxFontRatio: 0.074,              // 최대 폰트 크기 비율 (기존값)
            lineSpacing: 1.1,                 // 줄 간격
            maxWidthRatio: 0.85,              // 카드 너비 대비 최대 텍스트 너비
            dynamicSizing: true               // 동적 크기 조절 활성화
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
            width: 260,         // 카드 너비 (갤러리와 동일)
            height: 364,        // 카드 높이 (갤러리와 동일)
            spacing: 280,       // 카드 간격 (확대됨)
            maxCols: 2,         // 최대 열 수 (2열로 조정)
            rowSpacing: 40      // 카드 행 간격
        },
        scroll: {
            speed: 50,          // 스크롤 속도
            maxVisibleRows: 2,  // 한 번에 표시할 최대 행 수
            viewportHeight: 550 // 가시 영역 높이 (카드 영역에 맞게 조정)
        },
        // 카드 선택 그리드 레이아웃 설정
        grid: {
            paddingTop: 20,         // 위쪽 여백 적정화
            paddingBottom: 20,      // 아래쪽 여백 축소 (40px → 20px)
            paddingHorizontal: 15   // 좌우 여백 유지
        },
        // 카드 선택 모달 크기 설정
        modal: {
            heightRatio: 0.98,      // 뷰포트 높이의 98% 사용 (더 넓게)
            padding: 15             // 모달 패딩 축소 (30px → 15px)
        },
        // 카드 확대 팝업 설정
        popup: {
            background: {
                overlay: 'rgba(0, 0, 0, 0.7)',  // 오버레이 배경색
                modal: '#2a2a3e',                // 팝업 배경색
                borderColor: '#4a5568',          // 팝업 테두리 색
                borderWidth: 3                   // 팝업 테두리 두께
            },
            card: {
                width: 320,                      // 팝업 내 카드 너비
                height: 448,                     // 팝업 내 카드 높이
                x: 0,                           // 카드 X 위치 (동적 계산)
                y: 80                           // 카드 Y 위치 (팝업 상단에서)
            },
            size: {
                width: 500,                      // 팝업 너비
                height: 600,                     // 팝업 높이
                borderRadius: 15                 // 팝업 모서리 둥글기
            },
            title: {
                text: '카드 선택',               // 팝업 제목
                fontSize: 24,                    // 제목 폰트 크기
                y: 30,                          // 제목 Y 위치
                color: '#ffffff'                 // 제목 색상
            },
            buttons: {
                width: 120,                      // 버튼 너비
                height: 40,                      // 버튼 높이
                spacing: 20,                     // 버튼 간격
                y: 540,                         // 버튼 Y 위치
                borderRadius: 8,                 // 버튼 모서리 둥글기
                fontSize: 16,                    // 버튼 폰트 크기
                select: {
                    color: '#4CAF50',           // 선택 버튼 색상
                    textColor: '#ffffff',       // 선택 버튼 텍스트 색상
                    text: '선택'                 // 선택 버튼 텍스트
                },
                cancel: {
                    color: '#666666',           // 취소 버튼 색상
                    textColor: '#ffffff',       // 취소 버튼 텍스트 색상
                    text: '취소'                 // 취소 버튼 텍스트
                }
            },
            animation: {
                duration: 300,                   // 팝업 애니메이션 지속시간 (ms)
                easing: 'easeOutQuart'          // 애니메이션 이징
            }
        },
        // 클릭 연출 애니메이션 설정
        clickEffect: {
            duration: 200,                       // 클릭 연출 지속시간 (ms)
            scaleMax: 1.05,                     // 최대 확대 비율
            scaleMin: 0.98,                     // 최소 축소 비율
            phases: {
                expand: 0.4,                    // 확대 단계 비율 (40%)
                contract: 0.6                   // 축소 단계 비율 (60%)
            }
        },
        // 확인 대화상자 설정
        // 피격 숫자 표시 설정
        damageNumber: {
            fontSize: {
                large: 72,      // 큰 화면
                medium: 60,     // 중간 화면
                mobile: 50      // 모바일
            },
            position: {
                // 전투 영역 기준 위치 (캔버스 상하 1/3 지점)
                playerY: 0.75,  // 캔버스 높이의 75% 지점 (하단 1/3)
                enemyY: 0.25,   // 캔버스 높이의 25% 지점 (상단 1/3)
                randomX: 60,    // X축 랜덤 분산 범위 (-60 ~ +60px)
                randomY: 20     // Y축 랜덤 분산 범위 (-20 ~ +20px)
            },
            animation: {
                duration: 1200, // 애니메이션 지속 시간 (ms)
                scaleStart: 0.5,
                scaleMax: 1.3,
                scaleEnd: 0.8,
                moveDistance: 60 // 위로 이동하는 거리
            },
            colors: {
                damage: '#FF0000',
                heal: '#2ECC71',
                buff: '#2ECC71',
                debuff: '#E74C3C'
            }
        },

        confirmationModal: {
            size: {
                width: 400,
                height: 200,
                borderRadius: 15
            },
            background: {
                overlay: 'rgba(0, 0, 0, 0.7)',
                modal: '#2a2a3e',
                borderColor: '#666',
                borderWidth: 2
            },
            title: {
                y: 50,
                fontSize: 18,
                color: '#fff'
            },
            description: {
                y: 80,
                fontSize: 14,
                color: '#ccc'
            },
            buttons: {
                y: 150,
                width: 100,
                height: 30,
                spacing: 20,
                borderRadius: 5,
                fontSize: 14,
                confirm: {
                    color: '#4caf50',
                    textColor: '#fff',
                    text: '확인'
                },
                cancel: {
                    color: '#666',
                    textColor: '#fff',
                    text: '취소'
                }
            }
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
    },

    // 턴별 배경색 설정
    turnBackgrounds: {
        player: {
            gradientStops: [
                { position: 0, color: '#1a1a2e' },
                { position: 0.5, color: '#16213e' },
                { position: 1, color: '#0f0f23' }
            ]
        },
        enemy: {
            gradientStops: [
                { position: 0, color: '#4a2828' },
                { position: 0.5, color: '#5c2835' },
                { position: 1, color: '#3d1f1f' }
            ]
        }
    },

    // UI 레이어 z-index 설정 (하드코딩 방지)
    zIndexLayers: {
        canvas: 1,               // 게임 캔버스
        uiElements: 10,          // 일반 UI 요소들 (HP바, 버튼)
        mainMenuButtons: 100,    // 메인메뉴 버튼
        modals: 1000,           // 모달들
        overlays: 2000          // 최상위 오버레이
    },

    // 픽셀 값 설정 - Magic Number 정리
    layout: {
        padding: {
            small: 4,
            medium: 8,
            large: 16,
            xlarge: 32
        },
        spacing: {
            tight: 5,
            normal: 10,
            loose: 20,
            wide: 40
        },
        offsets: {
            shadowSmall: 2,
            shadowMedium: 4,
            shadowLarge: 8,
            borderThin: 1,
            borderMedium: 2,
            borderThick: 3
        },
        positions: {
            tooltipOffset: 15,
            iconOffset: 6,
            textOffset: 3,
            cardGap: 5
        }
    },

    // 방어력 UI 설정
    defenseUI: {
        // 오버레이 시스템 설정
        overlay: {
            background: 'linear-gradient(90deg, #c0c7d1, #f5f7fa, #e8eaf0)', // 은색 메탈릭 그라데이션
            opacity: 0.9,
            borderColor: 'rgba(169, 169, 169, 0.6)',
            borderWidth: 1,
            transition: 'width 0.4s ease-out',
            shadows: {
                inset: 'inset 0 1px 3px rgba(255, 255, 255, 0.6), inset 0 -1px 3px rgba(0, 0, 0, 0.2)',
                outer: '0 1px 2px rgba(0, 0, 0, 0.1)'
            },
            maxDefense: {
                background: 'linear-gradient(90deg, #b8c6db, #f5f7fa, #c0c7d1)',
                shadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 8px rgba(169, 169, 169, 0.4)'
            }
        },
        numbers: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50', // 어두운 색으로 HP와 구분
            textShadow: '1px 1px 0 rgba(255, 255, 255, 0.8), -1px -1px 0 rgba(0, 0, 0, 0.2)',
            position: { right: 8 }
        },
        animations: {
            shatter: {
                name: 'defenseShatter',
                duration: '0.4s',
                timing: 'ease-out'
            }
        },
        // 레거시 설정 (제거 예정)
        bar: {
            height: 8,
            borderRadius: 4,
            backgroundColor: '#34495e',
            fillColor: 'linear-gradient(90deg, #3498db, #2980b9)',
            maxDisplay: 20  // HP 최대값과 동일하게 설정 (10 기준)
        },
        icons: {
            shield: '🛡️',
            fontSize: 16,
            spacing: 4
        },
        animation: {
            duration: 300,
            breakEffect: {
                enabled: true,
                particles: 5,
                color: '#3498db'
            }
        }
    },

    // 버프 시스템 정의
    buffs: {
        strength: {
            nameKey: 'auto_battle_card_game.ui.buffs.strength',
            emoji: '💪',
            description: '공격력 +{value}',
            color: '#FF8C00' // 주황색 계열
        }
    },

    // 상태이상 UI 강화 설정
    statusEffectsUI: {
        icons: {
            size: 32,
            borderWidth: 2,
            borderRadius: 8,
            spacing: 8,
            maxVisible: 6
        },
        animation: {
            pulse: {
                enabled: true,
                duration: 2000,
                intensity: 0.2
            },
            countdown: {
                enabled: true,
                fontSize: 12,
                fontWeight: 'bold',
                color: '#ffffff'
            }
        },
        screenEffects: {
            enabled: true,
            borderFlash: {
                duration: 500,
                opacity: 0.3
            }
        }
    },

    // 전투 정보 HUD 설정
    battleHUD: {
        damageNumbers: {
            enabled: true,
            fontSize: {
                normal: 24,
                critical: 36
            },
            floatDistance: 50,
            duration: 1500,
            colors: {
                damage: '#e74c3c',
                heal: '#2ecc71',
                shield: '#3498db',
                critical: '#f39c12'
            }
        },
        combatLog: {
            enabled: true,
            maxEntries: 3,
            fadeTime: 3000,
            position: { x: 20, y: 200 }
        },
        screenEffects: {
            shake: {
                enabled: true,
                intensity: 8,
                duration: 200
            },
            flash: {
                enabled: true,
                colors: {
                    damage: 'rgba(231, 76, 60, 0.3)',
                    heal: 'rgba(46, 204, 113, 0.3)',
                    critical: 'rgba(243, 156, 18, 0.3)'
                }
            }
        }
    },

    // 전투 결과 팝업 설정 - 글래스모피즘 디자인
    battleResult: {
        // 공통 모달 설정
        modal: {
            size: {
                width: 600,              // 크기 확대
                height: 400,
                borderRadius: 30         // 더 부드러운 모서리
            },
            position: {
                centerX: true,
                centerY: true
            },
            background: {
                overlay: 'rgba(0, 0, 0, 0.6)',    // 더 밝은 오버레이
                blur: 15,                          // 배경 블러 효과 (글래스모피즘)
                borderWidth: 1                     // 얇은 테두리
            },
            animation: {
                fadeIn: 600,             // 더 부드러운 페이드인
                display: 2500,           // 2.5초 동안 표시
                fadeOut: 800,            // 부드러운 페이드아웃
                transitionDelay: 200     // 짧은 딜레이
            }
        },
        // 승리 팝업 설정 - 글래스모피즘
        victory: {
            colors: {
                background: 'rgba(255, 255, 255, 0.15)',     // 반투명 백색 글래스
                gradient: {
                    start: 'rgba(134, 239, 172, 0.3)',       // 연한 초록
                    end: 'rgba(59, 130, 246, 0.3)'           // 연한 파랑
                },
                border: 'rgba(255, 255, 255, 0.3)',          // 반투명 테두리
                title: '#FFFFFF',
                message: 'rgba(255, 255, 255, 0.9)',
                glow: {
                    color: 'rgba(134, 239, 172, 0.6)',       // 글로우 효과
                    blur: 20,
                    spread: 3
                }
            },
            title: {
                fontSize: 56,            // 크게 키운 타이틀
                y: 120,
                fontWeight: '900',
                letterSpacing: 2,
                textShadow: {
                    blur: 10,
                    color: 'rgba(134, 239, 172, 0.8)'
                }
            },
            message: {
                fontSize: 28,            // 크게 키운 메시지
                y: 200,
                lineHeight: 35,
                textShadow: {
                    blur: 5,
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            },
            particles: {                 // 파티클 효과 추가
                enabled: true,
                count: 30,
                colors: ['#86EF8C', '#3B82F6', '#FBBF24'],
                size: { min: 2, max: 6 },
                speed: { min: 0.5, max: 2 },
                lifetime: 2000
            },
            icon: {
                emoji: '✨',
                fontSize: 72,            // 더 큰 아이콘
                y: 60,
                animation: {
                    type: 'rotate',      // 회전 애니메이션
                    duration: 2000,
                    easing: 'ease-in-out'
                }
            }
        },
        // 패배 팝업 설정 - 글래스모피즘
        defeat: {
            layout: {
                modal: {
                    widthRatio: 0.625,    // 화면 너비의 62.5% (800/1280)
                    heightRatio: 0.81,    // 화면 높이의 81% (650/800)
                    borderRadius: 30
                },
                stats: {
                    startYRatio: 0.49,    // 모달 내부의 49% 위치 (320/650)
                    spacingRatio: 0.043,  // 모달 높이의 4.3% 간격
                    fontSizeRatio: 0.025, // 모달 높이의 2.5%
                    humorFontSizeRatio: 0.022, // 모달 높이의 2.2%
                    leftColumnRatio: 0.075,    // 모달 너비의 7.5%
                    rightColumnRatio: 0.55,     // 모달 너비의 55%
                    columnWidthRatio: 0.375     // 모달 너비의 37.5%
                },
                handDisplay: {
                    startYRatio: 0.34,    // 모달 내부의 34% 위치 (220/650)
                    cardScale: 0.35,      // 미니 카드 크기
                    spacingRatio: 0.069,  // 모달 너비의 6.9% (55/800)
                    maxCards: 10
                },
                confirmButton: {
                    yRatio: 0.88,         // 모달 내부의 88% 위치
                    widthRatio: 0.2,      // 모달 너비의 20%
                    heightRatio: 0.07,    // 모달 높이의 7%
                    fontSizeRatio: 0.028, // 모달 높이의 2.8%
                    borderRadius: 25,
                    spacing: 40
                },
                buttons: {
                    yRatio: 0.88,         // 모달 내부의 88% 위치
                    widthRatio: 0.2,      // 모달 너비의 20%
                    heightRatio: 0.07,    // 모달 높이의 7%
                    fontSizeRatio: 0.025, // 모달 높이의 2.5%
                    borderRadius: 25,
                    spacingRatio: 0.075,  // 모달 너비의 7.5% 간격
                    restart: {
                        xRatio: 0.225,    // 모달 너비의 22.5% (왼쪽 버튼 중앙)
                        background: 'rgba(46, 204, 113, 0.2)',
                        border: 'rgba(46, 204, 113, 0.4)',
                        hover: 'rgba(46, 204, 113, 0.3)'
                    },
                    mainMenu: {
                        xRatio: 0.575,    // 모달 너비의 57.5% (오른쪽 버튼 중앙)
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: 'rgba(231, 76, 60, 0.4)',
                        hover: 'rgba(231, 76, 60, 0.3)'
                    }
                }
            },
            colors: {
                background: 'rgba(0, 0, 0, 0.2)',            // 반투명 다크 글래스
                gradient: {
                    start: 'rgba(239, 68, 68, 0.2)',         // 연한 빨강
                    end: 'rgba(109, 40, 217, 0.2)'           // 연한 보라
                },
                border: 'rgba(255, 255, 255, 0.2)',
                title: '#FFFFFF',
                message: 'rgba(255, 255, 255, 0.8)',
                stats: 'rgba(255, 255, 255, 0.85)',
                statValue: '#FFD700', // 황금색으로 값 강조
                humor: 'rgba(255, 255, 255, 0.7)', // 유머 텍스트는 조금 연하게
                button: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'rgba(255, 255, 255, 0.3)',
                    text: '#FFFFFF',
                    hover: 'rgba(255, 255, 255, 0.25)'
                },
                glow: {
                    color: 'rgba(239, 68, 68, 0.4)',
                    blur: 15,
                    spread: 2
                }
            },
            title: {
                fontSize: 56,
                y: 80, // 위로 올림
                fontWeight: '900',
                letterSpacing: 2,
                textShadow: {
                    blur: 8,
                    color: 'rgba(239, 68, 68, 0.6)'
                }
            },
            message: {
                fontSize: 20, // 더 작게 조정
                y: 150, // 아래로 더 내림 (겹침 방지)
                lineHeight: 25,
                textShadow: {
                    blur: 5,
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            subtitle: {
                fontSize: 18,
                y: 175, // 부제목 위치 추가
                lineHeight: 22,
                textShadow: {
                    blur: 3,
                    color: 'rgba(255, 255, 255, 0.2)'
                }
            },
            icon: {
                emoji: '😢',
                fontSize: 64, // 조금 작게
                y: 45, // 위로 올림
                animation: {
                    type: 'shake',       // 흔들림 애니메이션
                    duration: 1000,
                    intensity: 3
                }
            }
        }
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