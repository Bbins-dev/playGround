// 게임 설정 및 상수 정의

const GameConfig = {
    // 게임 버전 정보
    versionInfo: {
        number: '1.0.4',                        // 버전 넘버
        stage: 'release'                        // 개발 단계 (i18n 키로 사용)
    },

    // 제작자 정보
    credits: {
        company: 'BinBox Games',                // 회사/제작자 이름
        year: 2025                              // 저작권 연도
    },

    // 하위 호환을 위한 레거시 버전 속성
    get version() { return this.versionInfo.number; },

    // 공통 상수 정의 - 매직 넘버 제거
    constants: {
        // 스케일 및 비율
        scales: {
            min: 0.3,                           // 최소 스케일 배율
            max: 2.0,                           // 최대 스케일 배율
            default: 1.0,                       // 기본 스케일
            cardEnlarged: 3.33,                 // 카드 확대 비율 (400/120)
            cardPreview: 2.17,                  // 미리보기 비율 (260/120)
            cardLarge: 4.33,                    // 상세 카드 비율 (520/120)
            cardVictory: 1.5,                   // 승리 카드 비율 (180/120)
            cardVictoryDetail: 3.0              // 승리 상세 비율 (360/120)
        },

        // 투명도 값
        opacity: {
            full: 1.0,                          // 완전 불투명
            high: 0.9,                          // 높은 투명도
            mediumHigh: 0.85,                   // 중간-높음 투명도
            medium: 0.5,                        // 중간 투명도
            low: 0.3,                           // 낮은 투명도
            subtle: 0.15,                       // 은은한 투명도
            verySubtle: 0.05                    // 매우 은은한 투명도
        },

        // 게임 배율
        multipliers: {
            advantage: 1.5,                     // 상성 유리 배율
            normal: 1.0,                        // 기본 배율
            disadvantage: 0.5,                  // 상성 불리 배율
            buffMultiplier: 1.5,                // 강화 버프 배율 (50% 증가)
            criticalHit: 2.0,                   // 치명타 배율
            barricadeDefense: 2.0,              // 바리케이트 방어력 배수
            barrierDefense: 3.0,                // 장벽 방어력 배수
            attackPerStrength: 1                // 힘 버프 1당 공격력 증가량
        },

        // 게임 제한값
        limits: {
            maxHandSize: 10,                    // 최대 손패 크기
            maxBuffStacks: 10,                  // 최대 버프 중첩
            maxStatusEffects: 6,                // 최대 상태이상 표시 수
            maxNameLength: 12,                  // 최대 이름 길이
            minDamage: 1,                       // 최소 대미지
            maxVisibleRows: 4                   // 최대 표시 행 수
        },

        // 확률값
        probabilities: {
            defaultAccuracy: 100,               // 기본 명중률
            criticalChance: 10,                 // 치명타 확률 10%
            paralysisChance: 30,                // 마비 확률 30%
            statusReduction: 30,                // 상태이상 감소율 30%
            statusPercent: 15                   // 상태이상 대미지 비율 15%
        },

        // 보상 시스템 설정
        rewards: {
            rewardCardCount: 4,                 // 보상 카드 갯수
            allowReroll: true,                  // Re-roll 기능 활성화 여부
            maxRerollsPerVictory: 1             // 승리당 최대 Re-roll 횟수
        },

        // 저장/불러오기 시스템 설정
        saveSystem: {
            enabled: true,                      // 저장 기능 활성화
            saveOnRewardSelection: true,        // 카드 선택 완료 시 저장
            saveOnStageComplete: false,         // 스테이지 클리어 즉시 저장 안함
            saveOnReroll: false,                // 리롤 시 저장 안함 (악용 방지)

            // 보안 설정
            useEncoding: true,                  // Base64 인코딩 사용 (폴백용)
            useChecksum: true,                  // 체크섬 검증 사용
            salt: 'CardBattle_v1_2025',         // 체크섬용 솔트값 (절대 변경 금지!)

            // 암호화 설정
            useEncryption: true,                // AES-256-GCM 암호화 사용
            encryptionAlgorithm: 'AES-GCM',     // 암호화 알고리즘
            keyLength: 256,                     // 키 길이 (비트)
            ivLength: 12,                       // IV 길이 (바이트, GCM 권장값)
            pbkdf2Iterations: 100000,           // PBKDF2 반복 횟수
            pbkdf2Hash: 'SHA-256',              // PBKDF2 해시 알고리즘

            // 폴백 전략
            fallbackToBase64OnError: true,      // 암호화 실패 시 Base64 사용
            requireSecureContext: false,        // HTTP 환경에서도 작동 (폴백 사용)
            autoMigration: true,                // 구 Base64 세이브 자동 변환

            // 저장 키 관리
            primarySaveKey: 'cardBattleGame_save',
            backupSaveKey: 'cardBattleGame_save_backup',
            migrationBackupKey: 'cardBattleGame_save_migration_backup',  // 마이그레이션 임시 백업
            deviceIdKey: '_cbg_did',            // 기기 ID 저장 키 (난독화)
            saveVersion: '1.0.0',               // 세이브 호환성 버전

            // 에러 처리
            enableBackupSave: true,             // 백업 세이브 활성화
            fallbackToBackup: true,             // 로드 실패 시 백업 시도
            logSaveErrors: true,                // 에러 로그 출력
            warnOnUnsavedChanges: true          // 저장 중 창 닫기 경고
        },

        // 기본 게임 속도 (느림 = 2배속)
        defaultGameSpeed: 2,

        // 속도 버튼 매핑 (버튼 ID → 실제 속도값)
        speedButtonMapping: {
            'speed-1x': 2,                      // "느림" 버튼 → 2배속
            'speed-2x': 3,                      // "보통" 버튼 → 3배속
            'speed-3x': 5,                      // "빠름" 버튼 → 5배속
            'speed-4x': 6,                      // (미사용) → 6배속
            'speed-5x': 7                       // "매우빠름" 버튼 → 7배속
        },

        // 성능 최적화 설정
        performance: {
            updateThrottleMs: 16,               // updateRuntimeCardStats throttle (60fps)
            maxConcurrentAnimations: 5,         // 동시 실행 애니메이션 최대 수
            animationThrottleMs: 16,            // 애니메이션 throttle (60fps)
            enablePassiveListeners: true,       // Passive 이벤트 리스너 활성화
            enableHardwareAcceleration: true,   // CSS 하드웨어 가속 활성화

            // 스마트 렌더링 시스템 (배터리 최적화)
            smartRendering: {
                enabled: true,                  // 스마트 렌더링 활성화 (배터리 절약)
                renderOnlyWhenNeeded: true,     // 변경 시에만 렌더링 (대기 시 0fps)
                maxFPS: 60,                     // 최대 프레임률

                // 게임 상태별 최소 FPS (레티나 디스플레이 끊김 방지)
                minFPS: {
                    menu: 0,                    // 메뉴: 이벤트 기반 (배터리 절약)
                    battle: 30,                 // 전투: 30fps 보장 (부드러움)
                    cardSelection: 15,          // 카드 선택: 15fps
                    gallery: 0,                 // 갤러리: 이벤트 기반
                    default: 0                  // 기본값: 이벤트 기반
                },

                // 고 DPI 디스플레이 보상 (레티나, 고해상도 모니터)
                highDPICompensation: true,      // 레티나 디스플레이 보상 활성화
                highDPIThreshold: 1.5,          // devicePixelRatio >= 1.5면 고 DPI로 판단
                highDPIBattleMinFPS: 30,        // 고 DPI에서 전투 중 최소 FPS

                pauseWhenInactive: true,        // 비활성화 시 렌더링 중지
                singleRenderLoop: true,         // 단일 RAF 루프 사용 (이중 루프 방지)
                stopWhenIdle: false,            // 유휴 상태 중지 비활성화 (안정성 우선)
                idleTimeout: 100                // 유휴 판단 시간 (ms)
            },

            // 카드 캔버스 캐싱 (Phase 1.1)
            cardCache: {
                enabled: true,                  // 카드 캐싱 활성화
                maxSize: 50,                    // 최대 캐시 크기 (카드 개수)
                cacheStaticElements: true,      // 정적 요소 캐싱 (배경, 테두리, 라벨 등)
                cacheDynamicStats: false,       // 동적 스탯은 캐싱 안함 (buffedPower 등)
                invalidateOnLanguageChange: true,   // 언어 전환 시 캐시 무효화
                invalidateOnResize: true,       // 윈도우 리사이즈 시 캐시 무효화
                // Note: invalidateOnForegroundRestore는 pageLifecycle.invalidateCacheOnRestore로 이동
                preloadCommonCards: false,      // 시작 카드 미리 캐싱 (선택적)
                fallbackOnError: true           // 캐싱 실패 시 즉시 폴백
            },

            // 터치 이벤트 최적화 (Phase 1.2)
            touchOptimization: {
                enabled: true,                  // 터치 최적화 활성화
                throttleMs: 16,                 // pointermove 스로틀 간격 (~60fps)
                throttleClick: false,           // click/tap은 스로틀 안함 (응답성 유지)
                usePassiveListeners: true       // passive 리스너 사용
            },

            // DOM 업데이트 최적화 (Phase 1.3)
            domOptimization: {
                enabled: true,                  // DOM 최적화 활성화
                useDiffing: true,               // 변경된 요소만 업데이트
                useDocumentFragment: true,      // DocumentFragment로 배칭
                batchUpdates: true,             // 여러 업데이트를 한 번에 적용
                fallbackOnError: true           // Diff 실패 시 전체 재생성
            },

            // 안전 장치 (Phase 1.4)
            safety: {
                maxCacheErrors: 5,              // 5회 이상 캐시 에러 시 캐싱 비활성화
                renderStallThreshold: 500,      // 500ms 이상 렌더링 없으면 강제 렌더링
                enableStallDetection: true,     // 렌더링 stall 감지 활성화
                forceRerenderOnStall: true,     // Stall 감지 시 강제 재렌더링
                disableOptimizationsOnError: true,  // 에러 발생 시 최적화 일시 비활성화
                reEnableDelay: 100              // 최적화 재활성화 딜레이 (ms)
            }
        },

        // 보안 설정 - 배터리 최적화
        security: {
            integrityCheckInterval: 2000,       // 무결성 검사 주기 (ms) - enableIntegrityCheck=true일 때만 사용
            domCheckInterval: 1000,             // DOM 무결성 검사 주기 (ms)
            maxHPTolerance: 50,                 // HP 초과 허용치 (힐링 오버플로우 대응)
            maxHandSizeTolerance: 5,            // 손패 크기 초과 허용치
            maxBuffValue: 100,                  // 최대 버프 수치
            maxStageNumber: 60,                 // 최대 스테이지 번호
            enableIntegrityCheck: false,        // 무결성 검사 반복 실행 비활성화 (배터리 절약)
            checkOnPageFocus: true              // 페이지 복귀 시에만 무결성 검사 (영향 미비)
        },

        // 픽셀 단위 값들
        pixels: {
            // 패딩
            paddingSmall: 4,
            paddingMedium: 8,
            paddingLarge: 16,
            paddingXLarge: 32,

            // 간격
            spacingTight: 5,
            spacingNormal: 10,
            spacingLoose: 20,
            spacingWide: 40,

            // 테두리
            borderThin: 1,
            borderMedium: 2,
            borderThick: 3,
            borderThicker: 4,

            // 그림자
            shadowSmall: 2,
            shadowMedium: 4,
            shadowLarge: 8,

            // 모서리 둥글기
            radiusSmall: 4,
            radiusMedium: 8,
            radiusLarge: 16,
            radiusXLarge: 24,
            radiusRound: 50,                    // 원형 (%)

            // 아이콘 크기
            iconSmall: 16,
            iconMedium: 24,
            iconLarge: 32,
            iconXLarge: 36,
            iconHuge: 72
        }
    },

    // 디버깅 모드 설정
    debugMode: {
        enabled: false,                         // 프로덕션에서는 false
        showAccuracyRolls: true,               // 명중률 체크 표시
        showStatusEffects: true,               // 상태이상 적용 표시
        showDamageCalculation: true,           // DOT 데미지 표시
        showRandomBashCounts: true,            // 랜덤배시 횟수 표시
        showStatusRolls: true,                 // 상태이상 확률 롤 표시
        showUIEvents: false,                   // UI 이벤트 숨김
        showSystemInitialization: false       // 시스템 초기화 숨김
    },

    // 페이지 라이프사이클 관리 설정 (모바일 백그라운드 복원 대응)
    pageLifecycle: {
        enableBackgroundPause: true,            // 백그라운드 전환 시 자동 일시정지
        enableAudioPause: true,                 // 백그라운드 시 오디오 일시정지
        enableBattlePause: true,                // 백그라운드 시 전투 일시정지
        restoreDelay: 100,                      // 포그라운드 복귀 시 복원 딜레이 (ms)
        forceRerender: true,                    // 포그라운드 복귀 시 Canvas 강제 재렌더링
        invalidateCacheOnRestore: false,        // 포그라운드 복귀 시 카드 캐시 무효화 (기본 꺼둠, 성능 우선)
        logVisibilityChanges: true,             // visibilitychange 이벤트 로그 (디버깅용 활성화)
        handlePageShow: true,                   // pageshow 이벤트 처리 (bfcache 대응)
        handlePageHide: true                    // pagehide 이벤트 처리
    },

    // 마스터 색상 시스템 - 모든 색상의 단일 진실의 원천
    masterColors: {
        // 속성 색상
        elements: {
            fire: '#FF6B6B',          // 코랄/주황색
            water: '#87CEEB',         // 하늘색
            electric: '#FFD700',      // 노랑색
            poison: '#9B59B6',        // 보라색
            normal: '#F0E6D8',        // 밝은 베이지 (따뜻한 중립색, 흰색 텍스트 가독성 유지)
            special: '#90EE90'        // 연두색
        },

        // 상태이상 색상
        statusEffects: {
            taunt: '#E74C3C',         // 도발 - 빨간색
            stun: '#8E44AD',          // 기절 - 보라색
            paralysis: '#F39C12',     // 마비 - 주황색
            phase: '#00FFFF',         // 위상 - 형광 하늘색 (cyan)
            burn: '#E67E22',          // 화상 - 주황색
            ignition: '#FF6347',      // 발화 - 토마토 빨강 (불꽃 느낌)
            poisoned: '#9B59B6',      // 중독 - 보라색
            sand: '#D4A76A',          // 모래 - 베이지색
            insult: '#8B4513',        // 모욕 - 갈색
            slow: '#6C757D',          // 둔화 - 회색
            chains: '#FF4500',        // 사슬 - 오렌지-레드
            wet: '#5DADE2',           // 젖음 - 밝은 파란색
            frozen: '#B0E0E6',        // 얼음 - 파우더 블루
            oblivion: '#8B008B',      // 망각 - 다크 마젠타 (혼란/기억상실 느낌)
            stench: '#8B7355'         // 악취 - 더스티 브라운 (악취/독 느낌)
        },

        // 카드 타입 색상
        cardTypes: {
            attack: '#E74C3C',        // 공격 - 빨간색
            defense: '#3498DB',       // 방어 - 파란색
            status: '#9B59B6',        // 상태이상 - 보라색
            buff: '#2ECC71',          // 버프 - 초록색
            debuff: '#E67E22',        // 디버프 - 주황색
            special: '#90EE90',       // 특수 - 연두색
            heal: '#2ECC71'           // 회복 - 초록색 (생명력 상징)
        },

        // 버프 색상
        buffs: {
            strength: '#FF8C00',      // 힘 - 다크 오렌지
            enhance: '#C0C0C0',       // 강화 - 은색
            focus: '#3498db',         // 집중 - 파란색 계열
            speed: '#FFD700',         // 고속 - 금색 (전기 속성)
            scent: '#FF4500',         // 냄새 - 오렌지-레드 (불꽃 느낌)
            sharpen: '#708090',       // 벼리기 - 슬레이트 그레이 (금속 느낌)
            hotWind: '#FF6B6B',       // 열풍 - 코랄/주황색 (불 속성 색상)
            lithium: '#00CED1',       // Li⁺ - 다크 터쿼이즈 (배터리 에너지 느낌)
            breath: '#F0F0F0',        // 호흡 - 흰색 계열 (확 구분되는 색상)
            mass: '#87CEEB',          // 질량 - 하늘색 (물 속성 색상)
            torrent: '#4682B4',       // 급류 - 스틸 블루 (물결/파도 느낌)
            absorption: '#20B2AA',    // 흡수 - 라이트 시그린 (물 치유 느낌)
            lightSpeed: '#FFD700',    // 광속 - 금색 (전기 속성 색상, 빛의 속도)
            static: '#FFA500',        // 정전기 - 오렌지 (전기 속성, 정전기 느낌)
            pack: '#00CED1',          // 팩 - 다크 터쿼이즈 (전기 에너지, 배터리 느낌)
            propagation: '#9B59B6',   // 연쇄 - 보라색 (독 속성, 화학 반응 전파)
            sulfur: '#FFD700',        // 유황 - 황금색 (온천, 얼음 면역)
            coating: '#4682B4',       // 코팅 - 스틸 블루 (방어막, 화상 면역)
            raincoat: '#87CEEB'       // 우비 - 하늘색 (상태이상 차단, 보호)
        },

        // 체력 라벨 색상
        hp: '#4CAF50',                // 체력 - Material Green (생명력 상징, 특수 카드보다 진한 초록)

        // 명중률 라벨 색상
        accuracy: '#F5F5DC',          // 명중률 - 베이지/아이보리 (🎯 타겟 색상과 조화)

        // 스탯 표시 색상
        stats: {
            negativePower: '#FF6B6B',  // 음수 power - 빨간색 (fire 색상 재사용)
            increased: '#4CAF50',      // 증가된 스탯 - 초록색 (hp 색상 재사용)
            decreased: '#FF6B6B',      // 감소된 스탯 - 빨간색 (fire 색상 재사용)
            normal: '#FFFFFF'          // 기본 스탯 - 흰색
        },

        // 기본 UI 색상
        ui: {
            primary: '#3498db',           // 기본 파란색
            primaryHover: '#f39c12',      // 호버 시 주황색
            secondary: '#2980b9',         // 어두운 파란색
            background: {
                gradient: {
                    start: '#2E4057',     // 어두운 블루
                    middle: '#48729B',    // 밝은 파란색
                    end: '#5D8AA8'        // 하늘색
                }
            },
            text: {
                primary: '#FFFFFF',       // 흰색 텍스트
                secondary: '#E0E0E0',     // 밝은 회색
                outline: '#000000',       // 검은색 외곽선
                disabled: '#888888'       // 비활성화 텍스트
            },
            selection: {
                selected: '#FFD700',      // 금색 선택됨
                hover: '#CCCCCC',         // 회색 호버
                border: '#666666'         // 기본 테두리
            }
        },

        // 게임 상태 색상
        status: {
            victory: '#2ECC71',           // 승리 초록색
            defeat: '#E74C3C',            // 패배 빨간색
            warning: '#F39C12',           // 경고 주황색
            info: '#3498DB',              // 정보 파란색
            neutral: '#95A5A6'            // 중성 회색
        },

        // 버프/디버프 색상
        effects: {
            buff: '#2ECC71',              // 버프 초록색
            debuff: '#E74C3C',            // 디버프 빨간색
            neutral: '#3498DB',           // 중성 효과 파란색
            poison: '#9B59B6',            // 독 보라색
            burn: '#FF6B6B',              // 화상 빨간색
            stun: '#F39C12'               // 기절 주황색
        },

        // 배경 및 오버레이
        overlay: {
            modal: 'rgba(0, 0, 0, 0.6)',  // 모달 배경
            tooltip: 'rgba(0, 0, 0, 0.8)', // 툴팁 배경
            glass: 'rgba(255, 255, 255, 0.15)' // 글래스모피즘
        },

        // 폴백 색상 (ColorUtils용)
        fallback: {
            default: '#666666',           // 기본 폴백
            text: '#FFFFFF',              // 텍스트 폴백
            outline: '#000000'            // 외곽선 폴백
        },

        // 대미지 표시 색상
        damage: {
            damage: '#FF0000',            // 대미지 - 빨간색
            heal: '#2ECC71',              // 회복 - 초록색
            buff: '#2ECC71',              // 버프 - 초록색
            debuff: '#E74C3C'             // 디버프 - 빨간색
        },

        // 메시지 타입별 색상 (플로팅 숫자용)
        messageTypes: {
            damage: '#FF4444',            // 대미지 - 빨간색
            heal: '#2ECC71',              // 회복 - 초록색
            shield: '#E8E8E8',            // 방어력 - 밝은 은색
            buff: '#FFD700',              // 버프 - 금색
            status: '#FFFFFF',            // 상태이상 일반 - 흰색
            poison: '#9B59B6',            // 독 - 보라색
            burn: '#FF7F50',              // 화상 및 화상 연장 - 코랄색
            miss: '#CCCCCC',              // 빗나감 - 회색
            zero: '#888888',              // 0 대미지 - 어두운 회색
            strong: '#FF8C00',            // 강함! (1.5배) - 주황색
            weak: '#8B0000',              // 약함! (0.5배) - 어두운 검붉은 색
            selfDamage: '#FFEB3B',        // 자해 데미지 - 노란색
            conditionFailed: '#CCCCCC',   // 조건 실패 - 회색
            debuff: '#E74C3C'             // 디버프 - 빨간색
        }
    },

    // 마스터 폰트 시스템 - 모든 폰트 설정의 단일 진실의 원천
    masterFonts: {
        // 폰트 패밀리
        families: {
            main: 'Arial, sans-serif',    // 기본 폰트
            title: 'Arial, sans-serif',   // 제목 폰트
            mono: 'monospace'             // 고정폭 폰트
        },

        // 기본 폰트 크기 (픽셀 단위)
        baseSizes: {
            tiny: 10,                     // 매우 작은 텍스트
            small: 12,                    // 작은 텍스트
            medium: 16,                   // 기본 텍스트
            large: 20,                    // 큰 텍스트
            xlarge: 24,                   // 매우 큰 텍스트
            title: 28,                    // 제목 크기
            huge: 32,                     // 거대한 텍스트
            massive: 40,                  // 매우 거대한 텍스트
            giant: 56,                    // 초대형 텍스트
            colossal: 64                  // 최대 텍스트
        },

        // 폰트 무게
        weights: {
            normal: 'normal',
            bold: 'bold',
            bolder: '900'
        },

        // 카드별 폰트 비율 (카드 높이 대비)
        cardRatios: {
            emoji: 0.17,                  // 높이의 17%
            name: 0.074,                  // 높이의 7.4%
            type: 0.058,                  // 높이의 5.8%
            stats: 0.058,                 // 높이의 5.8%
            description: 0.052,           // 높이의 5.2%
            elementLabel: 0.045           // 속성 라벨 4.5%
        },

        // UI별 폰트 크기 매핑
        uiSizes: {
            // 메인 메뉴
            mainMenuTitle: 64,            // 메인 제목
            mainMenuSubtitle: 24,         // 부제목
            mainMenuNormal: 22,           // 일반 메뉴 텍스트
            mainMenuSelected: 24,         // 선택된 메뉴 텍스트

            // 언어 선택기
            languageSelector: 26,

            // 카드 선택
            cardSelectionTitle: 28,       // 제목
            cardSelectionProgress: 16,    // 진행상황
            cardSelectionInstructions: 14, // 안내

            // 대미지 표시
            damageNumber: 60,             // 대미지 숫자

            // 배틀 HUD
            hpBarText: 24,                // HP 바 텍스트
            statusIcon: 14,               // 상태이상 아이콘 텍스트

            // 모달
            modalTitle: 40,               // 모달 제목
            modalInstruction: 24,         // 모달 설명
            modalButton: 20,              // 모달 버튼

            // 스테이지 표시기
            stageMain: 24,                // 메인 텍스트
            stageIcon: 24,                // 아이콘 크기
            stageProgress: 18             // 진행도 점
        }
    },

    // 마스터 타이밍 시스템 - 모든 애니메이션 타이밍의 단일 진실의 원천
    masterTiming: {
        // 카드 관련 타이밍
        cards: {
            activation: 2000,             // 카드 발동 시 표시 시간 (ms)
            interval: 1200,               // 카드 간 발동 간격 (ms)
            repeatDelay: 300,             // BattleSystem의 반복 딜레이
            activationInterval: 500,      // 카드 간 발동 간격
            missDelay: 800                // Miss 시 추가 대기 시간 (ms)
        },

        // 모달 관련 타이밍
        modal: {
            fadeIn: 300,                  // 모달 페이드인 시간
            fadeOut: 300,                 // 모달 페이드아웃 시간
            display: 2000,                // 자동 전환 대기시간
            transition: 200,              // 일반 전환 시간
            battleResultDisplay: 2500,    // 전투 결과 표시 시간
            battleResultFadeIn: 600,      // 전투 결과 페이드인
            battleResultFadeOut: 800      // 전투 결과 페이드아웃
        },

        // 전투 관련 타이밍
        battle: {
            pauseDelay: 1000,             // 전투 일시정지 딜레이
            resumeDelay: 500,             // 전투 재개 딜레이
            actionDelay: 300,             // 액션 간 딜레이
            animationStep: 100,           // 애니메이션 스텝 간격
            turnTransition: 1000,         // 턴 전환 시간
            damageDisplay: 1500,          // 대미지 표시 시간
            statusEffectDisplay: 1000,    // 상태이상 표시 시간
            deathAnimationDelay: 520      // 사망 시 모달 표시 전 대기 시간 (체력바 애니메이션 + 추가 시간)
        },

        // UI 애니메이션 타이밍
        ui: {
            hpAnimation: 300,             // HP 바 애니메이션 시간 (ms) - 500ms에서 단축
            defenseAnimation: 300,        // 방어력 바 애니메이션 시간 (ms) - 500ms에서 단축
            defenseShatter: 300           // 방어력 파괴 애니메이션 시간 (ms) - 500ms에서 단축
        },

        // 렌더링 관련
        rendering: {
            throttle: 16,                 // MainMenu 렌더링 체크 16ms
            frameTime: 16.67,             // 60fps 기준 (1000/60)
            dirtyCheckInterval: 100       // Dirty checking 간격
        },

        // 버전 체크 타이밍
        versionCheck: {
            loadingMinDuration: 500,      // 로딩 표시 최소 시간 (사용자가 인지할 수 있는 최소 시간)
            modalCloseDelay: 300          // 모달 닫기 후 새로고침 대기 시간
        },

        // UI 애니메이션
        ui: {
            fadeIn: 250,                  // 일반 페이드인
            fadeOut: 200,                 // 일반 페이드아웃
            transition: 300,              // 일반 전환
            hover: 150,                   // 호버 애니메이션
            clickFeedback: 100,           // 클릭 피드백 시간
            hoverDelay: 200,              // 호버 딜레이
            tooltipDelay: 500             // 툴팁 표시 딜레이
        },

        // 전투 효과
        combat: {
            damage: 400,                  // 대미지 애니메이션
            heal: 300,                    // 회복 애니메이션
            statusChange: 250,            // 상태 변화 애니메이션
            screenShake: 300,             // 화면 흔들림 (기본값)
            // 게임 속도별 화면 흔들림 duration
            screenShakeBySpeed: {
                0.5: 600,                 // 느림
                1: 300,                   // 보통
                2: 180,                   // 빠름
                5: 120                    // 매우빠름
            },
            flash: 500                    // 플래시 효과
        },

        // 이펙트 효과
        effects: {
            shortFlash: 200,              // 짧은 플래시
            longFlash: 500,               // 긴 플래시
            fadeOut: 1000,                // 페이드아웃
            slideIn: 300,                 // 슬라이드인
            pulse: 2000,                  // 펄스 애니메이션
            glow: 1500,                   // 글로우 효과
            particle: 2000                // 파티클 효과
        },

        // 카드 애니메이션
        cardAnimations: {
            click: 200,                   // 클릭 애니메이션
            expand: 400,                  // 확대 애니메이션
            contract: 300,                // 축소 애니메이션
            rotation: 2000,               // 회전 애니메이션
            shake: 1000                   // 흔들림 애니메이션
        },

        // 상태이상 애니메이션
        statusAnimations: {
            pulse: 2000,                  // 펄스 애니메이션
            borderFlash: 500,             // 테두리 플래시
            countdown: 1000,              // 카운트다운 애니메이션
            shatter: 400                  // 방어력 파괴 애니메이션
        },

        // 대미지 표시 애니메이션
        damageNumbers: {
            duration: 1200,               // 애니메이션 지속 시간
            readDelay: 500,               // 메시지 읽기 대기시간
            floatDistance: 60,            // 위로 이동하는 거리
            fadeOutStart: 800             // 페이드아웃 시작 시점
        }
    },

    // 화면 설정 - 고정 크기 (반응형 제거)
    canvas: {
        width: 750,
        height: 1200,
        targetFPS: 60
    },

    // 뷰포트 스케일링 설정
    viewport: {
        autoScale: true,                    // 자동 스케일링 활성화
        scaleMethod: 'fit',                 // 'fit': 화면에 맞춤, 'fill': 화면 채움
        minScale: 0.3,                      // 최소 스케일 배율
        maxScale: 2.0,                      // 최대 스케일 배율
        maintainAspectRatio: true           // 종횡비 유지
    },

    // 속성 시스템
    elements: {
        fire: {
            name: '불',
            nameKey: 'auto_battle_card_game.elements.fire',
            descriptionKey: 'auto_battle_card_game.ui.elements.fire_description',
            get color() { return GameConfig.masterColors.elements.fire; },
            emoji: '🔥',
            strong: 'poison',       // 독에 강함
            weak: 'water',         // 물에 약함
            // immunity: 'burn',       // [IMMUNITY_REMOVAL] 2025-11-03: 화상 면역 제거
            elementNames: {
                ko: '불',
                en: 'Fire',
                ja: '火'
            }
        },
        water: {
            name: '물',
            nameKey: 'auto_battle_card_game.elements.water',
            descriptionKey: 'auto_battle_card_game.ui.elements.water_description',
            get color() { return GameConfig.masterColors.elements.water; },
            emoji: '💧',
            strong: 'fire',        // 불에 강함
            weak: 'electric',       // 전기에 약함
            elementNames: {
                ko: '물',
                en: 'Water',
                ja: '水'
            }
        },
        electric: {
            name: '전기',
            nameKey: 'auto_battle_card_game.elements.electric',
            descriptionKey: 'auto_battle_card_game.ui.elements.electric_description',
            get color() { return GameConfig.masterColors.elements.electric; },
            emoji: '⚡',
            strong: 'water',       // 물에 강함
            weak: 'poison',        // 독에 약함
            // immunity: 'paralysis',  // [IMMUNITY_REMOVAL] 2025-11-03: 마비 면역 제거
            elementNames: {
                ko: '전기',
                en: 'Electric',
                ja: '電気'
            }
        },
        poison: {
            name: '독',
            nameKey: 'auto_battle_card_game.elements.poison',
            descriptionKey: 'auto_battle_card_game.ui.elements.poison_description',
            get color() { return GameConfig.masterColors.elements.poison; },
            emoji: '☠️',
            strong: 'electric',    // 전기에 강함
            weak: 'fire',          // 불에 약함
            // immunity: 'poisoned',   // [IMMUNITY_REMOVAL] 2025-11-03: 중독 면역 제거
            elementNames: {
                ko: '독',
                en: 'Poison',
                ja: '毒'
            }
        },
        normal: {
            name: '노멀',
            nameKey: 'auto_battle_card_game.elements.normal',
            descriptionKey: 'auto_battle_card_game.ui.elements.normal_description',
            get color() { return GameConfig.masterColors.elements.normal; },
            emoji: '👊',
            strong: null,          // 강점 없음
            weak: null,           // 약점 없음
            // immunity: null,        // [IMMUNITY_REMOVAL] 2025-11-03: 면역 없음
            elementNames: {
                ko: '노멀',
                en: 'Normal',
                ja: 'ノーマル'
            }
        },
        special: {
            name: '특수',
            nameKey: 'auto_battle_card_game.elements.special',
            get color() { return GameConfig.masterColors.elements.special; },
            emoji: '🔮',
            strong: null,          // 강점 없음
            weak: null,           // 약점 없음
            // immunity: null,        // [IMMUNITY_REMOVAL] 2025-11-03: 면역 없음
            elementNames: {
                ko: '특수',
                en: 'Special',
                ja: '特別'
            }
        }
    },

    // 상성 배율
    typeEffectiveness: {
        get strong() { return GameConfig.constants.multipliers.advantage; },    // 강점으로 공격 시 1.5배 대미지
        get normal() { return GameConfig.constants.multipliers.normal; },       // 보통 대미지
        get weak() { return GameConfig.constants.multipliers.disadvantage; }    // 약점으로 공격 시 0.5배 대미지
    },

    // 화면 쉐이킹 시스템 (절대 데미지값 기반, 게임 속도 무관)
    screenShake: {
        enabled: true,  // 쉐이킹 효과 활성화
        baseDuration: 300,  // 기본 지속시간 (ms) - 게임 속도 영향 없음
        // 데미지 구간별 차등 설정 (intensity: 흔들림 강도, durationMultiplier: 지속시간 배율)
        tiers: [
            { minDamage: 1,   maxDamage: 19,  intensity: 0.8, durationMultiplier: 0.8 },  // 작은 타격
            { minDamage: 20,  maxDamage: 49,  intensity: 1.2, durationMultiplier: 1.0 },  // 중간 타격
            { minDamage: 50,  maxDamage: 99,  intensity: 1.8, durationMultiplier: 1.2 },  // 강한 타격
            { minDamage: 100, maxDamage: 199, intensity: 2.5, durationMultiplier: 1.5 },  // 매우 강한 타격
            { minDamage: 200, maxDamage: Infinity, intensity: 3.5, durationMultiplier: 2.0 }  // 초대형 타격
        ]
    },

    // 상태이상 정의
    statusEffects: {
        taunt: {
            nameKey: 'auto_battle_card_game.ui.status_effects.taunt',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.taunt_description',
            name: '도발',
            emoji: '😡',
            description: '다음 턴에 공격 카드만 발동',
            duration: 1,
            get color() { return GameConfig.masterColors.statusEffects.taunt; }
        },
        stun: {
            nameKey: 'auto_battle_card_game.ui.status_effects.stun',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.stun_description',
            name: '기절',
            emoji: '😵',
            description: '다음 턴에 아무 카드도 발동되지 않음',
            duration: 1,
            get color() { return GameConfig.masterColors.statusEffects.stun; }
        },
        paralysis: {
            nameKey: 'auto_battle_card_game.ui.status_effects.paralysis',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.paralysis_description',
            name: '마비',
            emoji: '⚡',
            description: '확률적으로 턴을 넘김',
            duration: 1,
            canExtend: true,  // 턴 연장 가능 (중복 적용 시 누적)
            get defaultChance() { return GameConfig.constants.probabilities.paralysisChance; },
            get color() { return GameConfig.masterColors.statusEffects.paralysis; }
        },
        phase: {
            nameKey: 'auto_battle_card_game.ui.status_effects.phase',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.phase_description',
            name: '위상',
            emoji: '🌀',
            description: '30% 확률로 공격이 자신에게 향함',
            defaultChance: 30,
            duration: 1,
            canExtend: true,  // 턴 연장 가능 (중복 적용 시 누적)
            get color() { return GameConfig.masterColors.statusEffects.phase; }
        },
        burn: {
            nameKey: 'auto_battle_card_game.ui.status_effects.burn',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.burn_description',
            name: '화상',
            emoji: '🔥',
            description: '턴 시작 시 기본 피해 5',
            defaultDamage: 5,
            duration: 1,
            canExtend: true,  // 턴 연장 가능 (중복 적용 시 누적)
            get color() { return GameConfig.masterColors.statusEffects.burn; }
        },
        ignition: {
            nameKey: 'auto_battle_card_game.ui.status_effects.ignition',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.ignition_description',
            name: '발화',
            emoji: '🔆',
            description: '불 공격카드의 공격에 스택당 열 배의 피해를 입습니다.',
            duration: 1,
            canExtend: false,  // 턴 연장 비활성화
            canStack: true,    // 강도 기반 중첩 활성화
            maxStacks: 10,     // 최대 중첩 (밸런스용)
            stackMultiplier: 10, // 기본 배수
            damageFormula: 'linear', // 계산식: 3 × stacks (선형)
            get color() { return GameConfig.masterColors.statusEffects.ignition; }
        },
        poisoned: {
            nameKey: 'auto_battle_card_game.ui.status_effects.poisoned',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.poisoned_description',
            name: '중독',
            emoji: '☠️',
            description: '턴 종료 시 남은 턴수만큼 피해',
            defaultDamage: 5,  // 하위 호환용 유지 (실제로는 turnsLeft 사용)
            canExtend: true,  // 턴 연장 가능 (중복 적용 시 누적)
            get color() { return GameConfig.masterColors.statusEffects.poisoned; }
        },
        sand: {
            nameKey: 'auto_battle_card_game.ui.status_effects.sand',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.sand_description',
            name: '모래',
            emoji: '💨',
            description: '공격 카드의 명중률 30% 감소',
            affectedCardTypes: ['attack'],  // 영향받는 카드 타입 (Configuration-Driven)
            get defaultReduction() { return GameConfig.constants.probabilities.statusReduction; },
            duration: 1,
            canExtend: true,                                        // 턴 중첩 가능 (억제제/촉진제 영향)
            get color() { return GameConfig.masterColors.statusEffects.sand; }
        },
        insult: {
            nameKey: 'auto_battle_card_game.ui.status_effects.insult',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.insult_description',
            name: '모욕',
            emoji: '😤',
            description: '방어 카드의 발동률 30% 감소',
            affectedCardTypes: ['defense'],  // 영향받는 카드 타입 (Configuration-Driven)
            get defaultReduction() { return GameConfig.constants.probabilities.statusReduction; },
            duration: 2,
            get color() { return GameConfig.masterColors.statusEffects.insult; }
        },
        slow: {
            nameKey: 'auto_battle_card_game.ui.status_effects.slow',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.slow_description',
            name: '둔화',
            emoji: '🐢',
            description: '상태이상 카드의 발동률 30% 감소',
            affectedCardTypes: ['status'],  // 영향받는 카드 타입 (Configuration-Driven)
            get defaultReduction() { return GameConfig.constants.probabilities.statusReduction; },
            duration: 2,
            get color() { return GameConfig.masterColors.statusEffects.slow; }
        },
        chains: {
            nameKey: 'auto_battle_card_game.ui.status_effects.chains',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.chains_description',
            name: '사슬',
            emoji: '⛓️',
            description: '1턴 간 힘 버프가 적용되지 않음',
            duration: 1,
            get color() { return GameConfig.masterColors.statusEffects.chains; }
        },
        wet: {
            nameKey: 'auto_battle_card_game.ui.status_effects.wet',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.wet_description',
            name: '젖음',
            emoji: '💧',
            description: '흠뻑 젖었습니다.',
            duration: 1,
            canExtend: true,  // 턴 연장 가능 (중복 적용 시 누적)
            get color() { return GameConfig.masterColors.statusEffects.wet; }
        },
        frozen: {
            nameKey: 'auto_battle_card_game.ui.status_effects.frozen',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.frozen_description',
            name: '얼음',
            emoji: '❄️',
            description: '공격 카드의 명중률이 50% 감소합니다.',
            affectedCardTypes: ['attack'],  // 영향받는 카드 타입 (Configuration-Driven)
            defaultReduction: 50,
            duration: 1,
            get color() { return GameConfig.masterColors.statusEffects.frozen; }
        },
        oblivion: {
            nameKey: 'auto_battle_card_game.ui.status_effects.oblivion',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.oblivion_description',
            name: '망각',
            emoji: '🌀',
            description: '1턴 간 발동횟수 버프가 적용되지 않음',
            duration: 1,
            get color() { return GameConfig.masterColors.statusEffects.oblivion; }
        },
        stench: {
            nameKey: 'auto_battle_card_game.ui.status_effects.stench',
            descriptionKey: 'auto_battle_card_game.ui.status_effects.stench_description',
            name: '악취',
            emoji: '🦨',
            description: '버프 카드의 명중률이 50% 감소합니다.',
            affectedCardTypes: ['buff'],  // 영향받는 카드 타입 (버프카드만)
            defaultReduction: 50,  // 명중률 감소율 (50%)
            duration: 1,
            canExtend: true,  // 턴 연장 가능 (억제제/촉진제 영향)
            get color() { return GameConfig.masterColors.statusEffects.stench; }
        }
    },

    // 상태이상 화면 테두리 효과 설정 (Configuration-Driven)
    statusBorderEffects: {
        poisoned: {
            className: 'status-border-poison',
            get color() { return GameConfig.masterColors.statusEffects.poisoned; },
            priority: 3
        },
        burn: {
            className: 'status-border-burn',
            get color() { return GameConfig.masterColors.statusEffects.burn; },
            priority: 1  // 최고 우선순위
        },
        ignition: {
            className: 'status-border-ignition',
            get color() { return GameConfig.masterColors.statusEffects.ignition; },
            priority: 2  // burn 다음
        },
        sand: {
            className: 'status-border-sand',
            get color() { return GameConfig.masterColors.statusEffects.sand; },
            priority: 4
        },
        insult: {
            className: 'status-border-insult',
            get color() { return GameConfig.masterColors.statusEffects.insult; },
            priority: 5
        },
        slow: {
            className: 'status-border-slow',
            get color() { return GameConfig.masterColors.statusEffects.slow; },
            priority: 6
        },
        chains: {
            className: 'status-border-chains',
            get color() { return GameConfig.masterColors.statusEffects.chains; },
            priority: 7
        },
        wet: {
            className: 'status-border-wet',
            get color() { return GameConfig.masterColors.statusEffects.wet; },
            priority: 7
        },
        frozen: {
            className: 'status-border-frozen',
            get color() { return GameConfig.masterColors.statusEffects.frozen; },
            priority: 8
        },
        oblivion: {
            className: 'status-border-oblivion',
            get color() { return GameConfig.masterColors.statusEffects.oblivion; },
            priority: 9
        },
        stench: {
            className: 'status-border-stench',
            get color() { return GameConfig.masterColors.statusEffects.stench; },
            priority: 10
        }
    },

    // 테두리 애니메이션 설정
    statusBorderAnimation: {
        type: 'pulse',
        get duration() { return GameConfig.masterTiming.effects.pulse; },    // 2초 주기
        get intensity() { return GameConfig.constants.opacity.mediumHigh; }     // 투명도 변화 강도
    },

    // 버프 정의
    buffs: {
        strength: {
            nameKey: 'auto_battle_card_game.ui.buffs.strength',
            descriptionKey: 'auto_battle_card_game.ui.buffs.strength_description',
            name: '힘',
            emoji: '💪',
            description: '공격력 +{value}',
            get color() { return GameConfig.masterColors.buffs.strength; }, // 주황색 계열
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (스택 카운터)
            display: {
                showValue: true,
                format: '+{value}'
            }
        },
        enhance: {
            nameKey: 'auto_battle_card_game.ui.buffs.enhance',
            descriptionKey: 'auto_battle_card_game.ui.buffs.enhance_description',
            name: '강화',
            emoji: '🗡️',
            description: '공격카드 대미지 50% 증가',
            get color() { return GameConfig.masterColors.buffs.enhance; }, // 골드색
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수 (턴수 누적)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (enhanceTurns)
            display: {
                showValue: true,
                format: '({value})'
            }
        },
        focus: {
            nameKey: 'auto_battle_card_game.ui.buffs.focus',
            descriptionKey: 'auto_battle_card_game.ui.buffs.focus_description',
            name: '집중',
            emoji: '🎯',
            description: '노멀 공격카드 명중률 30% 증가',
            get color() { return GameConfig.masterColors.buffs.focus; }, // 파란색 계열
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수 (턴수 누적)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (focusTurns)
            display: {
                showValue: true,
                format: '({value})'
            },
            effect: {
                accuracy: 30  // 30% 증가
            }
        },
        speed: {
            nameKey: 'auto_battle_card_game.ui.buffs.speed',
            descriptionKey: 'auto_battle_card_game.ui.buffs.speed_description',
            name: '고속',
            emoji: '💫',
            description: '노멀 공격카드 발동횟수 +{value}',
            get color() { return GameConfig.masterColors.buffs.speed; }, // 전기색 계열
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (speedBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +3 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                activationBonus: 1  // 카드당 추가 횟수
            }
        },
        scent: {
            nameKey: 'auto_battle_card_game.ui.buffs.scent',
            descriptionKey: 'auto_battle_card_game.ui.buffs.scent_description',
            name: '냄새',
            emoji: '🔥',
            description: '불 속성 공격카드 대미지 +{value}',
            get color() { return GameConfig.masterColors.buffs.scent; }, // 토마토 레드
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (scentBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +4 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                damagePerStack: 10  // 냄새 1당 불 속성 공격 대미지 +10
            }
        },
        sharpen: {
            nameKey: 'auto_battle_card_game.ui.buffs.sharpen',
            descriptionKey: 'auto_battle_card_game.ui.buffs.sharpen_description',
            name: '벼리기',
            emoji: '⚒️',
            description: '다음 턴 시작까지 체력이 1 아래로 내려가지 않음',
            get color() { return GameConfig.masterColors.buffs.sharpen; }, // 불 속성 색상
            get maxStack() { return 1; },     // 중첩 불가 (카드 레벨에서 중복 차단됨)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'special', // 특수 (값 표시 없음)
            display: {
                showValue: false,  // 턴 표시 없음
                format: ''  // 빈 문자열 (이모지 + 이름만)
            }
        },
        mind: {
            nameKey: 'auto_battle_card_game.ui.buffs.mind',
            descriptionKey: 'auto_battle_card_game.ui.buffs.mind_description',
            name: '마음',
            emoji: '🛡️',
            description: '한 턴 간 상태이상에 걸리지 않습니다',
            get color() { return GameConfig.masterColors.buffs.enhance; }, // 보호 - 금색 계열
            get maxStack() { return 1; },     // 중첩 불가
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'special', // 특수 (값 표시 없음)
            display: {
                showValue: false,  // 턴 표시 없음
                format: ''  // 빈 문자열 (이모지 + 이름만)
            }
        },
        hotWind: {
            nameKey: 'auto_battle_card_game.ui.buffs.hotWind',
            descriptionKey: 'auto_battle_card_game.ui.buffs.hotWind_description',
            name: '열풍',
            emoji: '🌪️',
            description: '손패의 불 공격카드 수가 모든 불 공격카드의 공격력에 곱해집니다',
            get color() { return GameConfig.masterColors.buffs.hotWind; }, // 열풍 - 불 속성 색상
            get maxStack() { return 1; },     // 중첩 불가
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (hotWindTurns)
            display: {
                showValue: true,
                format: '({value})'  // 예: (2)
            }
        },
        lithium: {
            nameKey: 'auto_battle_card_game.ui.buffs.lithium',
            descriptionKey: 'auto_battle_card_game.ui.buffs.lithium_description',
            name: 'Li⁺',
            emoji: '⚡',
            description: '불 속성 공격카드 공격력 ×{value}',
            get color() { return GameConfig.masterColors.buffs.lithium; }, // Li⁺ - 터쿼이즈 배터리 색상
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; },     // 최대 중첩 수 (턴수)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (lithiumTurns)
            display: {
                showValue: true,
                format: '×{value}'  // 예: ×2 (곱셈 배율 표시)
            }
        },
        breath: {
            nameKey: 'auto_battle_card_game.ui.buffs.breath',
            descriptionKey: 'auto_battle_card_game.ui.buffs.breath_description',
            name: '호흡',
            emoji: '🫁',
            description: '불 속성 버프카드가 반드시 발동',
            get color() { return GameConfig.masterColors.buffs.breath; }, // 호흡 - 흰색 계열
            get maxStack() { return 1; }, // 중복 불가 (1턴만 유지)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'special', // 특수 (값 표시 없음)
            display: {
                showValue: false,  // 턴 표시 없음 (항상 1턴이므로)
                format: ''  // 빈 문자열 (이모지 + 이름만)
            }
        },
        mass: {
            nameKey: 'auto_battle_card_game.ui.buffs.mass',
            descriptionKey: 'auto_battle_card_game.ui.buffs.mass_description',
            name: '질량',
            emoji: '⚓',
            description: '물 속성 공격카드 공격력에 현재 체력의 15%×강도 추가',
            get color() { return GameConfig.masterColors.buffs.mass; }, // 질량 - 하늘색 (물 속성)
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (massBonus)
            display: {
                showValue: true,  // 강도 표시 (턴 표시 없음)
                format: '+{value}'  // 예: +3 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                hpPercent: 15  // 현재 체력의 15%
            }
        },
        torrent: {
            nameKey: 'auto_battle_card_game.ui.buffs.torrent',
            descriptionKey: 'auto_battle_card_game.ui.buffs.torrent_description',
            name: '급류',
            emoji: '🌊',
            description: '물 속성 공격카드 발동횟수 +{value}',
            get color() { return GameConfig.masterColors.buffs.torrent; }, // 급류 - 스틸 블루
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (torrentBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +3 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                activationBonus: 1  // 카드당 추가 횟수
            }
        },
        absorption: {
            nameKey: 'auto_battle_card_game.ui.buffs.absorption',
            descriptionKey: 'auto_battle_card_game.ui.buffs.absorption_description',
            name: '흡수',
            emoji: '💧',
            description: '턴 시작 시 HP +{value}',
            get color() { return GameConfig.masterColors.buffs.absorption; }, // 흡수 - 라이트 시그린
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (absorptionBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +2
            },
            effect: {
                baseHeal: 1,  // 기본 회복량 (스택당) - 흡수+1당 1 HP 회복
                wetMultiplier: 2  // 젖음 상태일 때 배율
            }
        },
        lightSpeed: {
            nameKey: 'auto_battle_card_game.ui.buffs.lightSpeed',
            descriptionKey: 'auto_battle_card_game.ui.buffs.lightSpeed_description',
            name: '광속',
            emoji: '⚡',
            description: '전기 속성 공격카드 발동횟수 +{value}',
            get color() { return GameConfig.masterColors.buffs.lightSpeed; }, // 광속 - 금색 (전기)
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (lightSpeedBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +2 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                activationBonus: 1  // 카드당 추가 횟수 +1
            }
        },
        superConductivity: {
            nameKey: 'auto_battle_card_game.ui.buffs.superConductivity',
            descriptionKey: 'auto_battle_card_game.ui.buffs.superConductivity_description',
            name: '초전도',
            emoji: '🎯',
            description: '전기 공격카드 명중률 40% 증가',
            get color() { return GameConfig.masterColors.buffs.focus; }, // 파란색 계열 (명중률 버프)
            get maxStack() { return 1; }, // 중첩 불가 (항상 1)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (superConductivityTurns)
            display: {
                showValue: false, // 턴 표기 없음 (항상 1턴이므로)
                format: ''
            },
            effect: {
                accuracy: 40  // 40% 증가 (곱셈 계산)
            }
        },
        static: {
            nameKey: 'auto_battle_card_game.ui.buffs.static',
            descriptionKey: 'auto_battle_card_game.ui.buffs.static_description',
            name: '정전기',
            emoji: '⚡',
            description: '전기속성 카드 1장당 5씩 전기 공격카드의 기본공격력이 강해집니다',
            get color() { return GameConfig.masterColors.buffs.static; }, // 오렌지 (피뢰침 색상 계승)
            get maxStack() { return 1; }, // 중첩 불가 (항상 1)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (staticTurns)
            display: {
                showValue: true, // 턴 표기 있음
                format: '({value})'
            },
            effect: {
                damagePerCard: 5  // 전기 카드당 추가 대미지
            }
        },
        pack: {
            nameKey: 'auto_battle_card_game.ui.buffs.pack',
            descriptionKey: 'auto_battle_card_game.ui.buffs.pack_description',
            name: '팩',
            emoji: '🔋',
            description: '턴 시작 시 HP +{value}, 회복 후 즉시 제거',
            get color() { return GameConfig.masterColors.buffs.pack; }, // 다크 터쿼이즈 (전기 에너지)
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (packBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +2
            },
            effect: {
                baseHeal: 8  // 기본 회복량 (스택당) - 충전+1당 8 HP 회복
            }
        },
        propagation: {
            nameKey: 'auto_battle_card_game.ui.buffs.propagation',
            descriptionKey: 'auto_battle_card_game.ui.buffs.propagation_description',
            name: '연쇄',
            emoji: '🧪',
            description: '독 속성 공격카드 발동횟수 +{value}',
            get color() { return GameConfig.masterColors.buffs.propagation; }, // 보라색 (독 속성, 화학 반응 전파)
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 강도 추가 방식 (propagationBonus)
            display: {
                showValue: true,
                format: '+{value}'  // 예: +2 (항상 1턴이므로 턴 표시 제거)
            },
            effect: {
                activationBonus: 1  // 카드당 추가 횟수
            }
        },
        poisonNeedle: {
            nameKey: 'auto_battle_card_game.ui.buffs.poisonNeedle',
            descriptionKey: 'auto_battle_card_game.ui.buffs.poisonNeedle_description',
            name: '독침',
            emoji: '🎯',
            description: '독 속성 공격카드 명중률 20% 증가',
            get color() { return GameConfig.masterColors.buffs.focus; }, // 파란색 계열 (명중률 버프)
            get maxStack() { return 1; }, // 중첩 불가 (항상 1턴)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (poisonNeedleTurns)
            display: {
                showValue: true, // 턴 표기 필요
                format: '({value})'
            },
            effect: {
                accuracy: 20  // 20% 증가 (곱셈 계산)
            }
        },
        raincoat: {
            nameKey: 'auto_battle_card_game.ui.buffs.raincoat',
            descriptionKey: 'auto_battle_card_game.ui.buffs.raincoat_description',
            name: '우비',
            emoji: '🌂',
            description: '상태이상 적용 1회 차단. 턴 시작 시 차감',
            get color() { return GameConfig.masterColors.buffs.raincoat; }, // 하늘색
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'intensity', // 스택 카운터 방식 (raincoatStacks) - 턴이 아님!
            display: {
                showValue: true,
                format: '+{value}'  // 예: +2 (스택 표시, 턴이 아님)
            },
            effect: {
                blockStatusEffect: true  // 상태이상 차단 기능
            }
        },
        sulfur: {
            nameKey: 'auto_battle_card_game.ui.buffs.sulfur',
            descriptionKey: 'auto_battle_card_game.ui.buffs.sulfur_description',
            name: '유황',
            emoji: '♨️',
            description: '얼음 상태이상에 면역. 턴 시작 시 차감',
            get color() { return GameConfig.masterColors.buffs.sulfur; }, // 황금색
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수 (턴수 누적)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (sulfurTurns)
            display: {
                showValue: true,
                format: '({value})'
            }
        },
        coating: {
            nameKey: 'auto_battle_card_game.ui.buffs.coating',
            descriptionKey: 'auto_battle_card_game.ui.buffs.coating_description',
            name: '코팅',
            emoji: '🛡️',
            description: '화상 상태이상에 면역. 턴 시작 시 차감',
            get color() { return GameConfig.masterColors.buffs.coating; }, // 스틸 블루
            get maxStack() { return GameConfig.constants.limits.maxBuffStacks; }, // 최대 중첩 수 (턴수 누적)
            targetSelf: true, // 자신에게 적용되는 버프
            durationType: 'duration', // 턴 추가 방식 (coatingTurns)
            display: {
                showValue: true,
                format: '({value})'
            }
        }
    },

    // 카드 타입
    cardTypes: {
        attack: {
            nameKey: 'auto_battle_card_game.ui.card_types.attack',
            descriptionKey: 'auto_battle_card_game.ui.card_types.attack_description',
            name: '공격',
            get color() { return GameConfig.masterColors.cardTypes.attack; },
            emoji: '⚔️',
            statEmojis: { power: '⚔️', accuracy: '🎯' }
        },
        defense: {
            nameKey: 'auto_battle_card_game.ui.card_types.defense',
            descriptionKey: 'auto_battle_card_game.ui.card_types.defense_description',
            name: '방어',
            get color() { return GameConfig.masterColors.cardTypes.defense; },
            emoji: '🛡️',
            statEmojis: { power: '🛡️', accuracy: '✅' }
        },
        status: {
            nameKey: 'auto_battle_card_game.ui.card_types.status',
            descriptionKey: 'auto_battle_card_game.ui.card_types.status_description',
            name: '상태이상',
            get color() { return GameConfig.masterColors.cardTypes.status; },
            emoji: '💀',
            statEmojis: { power: '⏱️', accuracy: '✅' }
        },
        buff: {
            nameKey: 'auto_battle_card_game.ui.card_types.buff',
            descriptionKey: 'auto_battle_card_game.ui.card_types.buff_description',
            name: '버프',
            get color() { return GameConfig.masterColors.cardTypes.buff; },
            emoji: '✨',
            statEmojis: { power: '✨', accuracy: '✅' }
        },
        debuff: {
            nameKey: 'auto_battle_card_game.ui.card_types.debuff',
            descriptionKey: 'auto_battle_card_game.ui.card_types.debuff_description',
            name: '디버프',
            get color() { return GameConfig.masterColors.cardTypes.debuff; },
            emoji: '💔',
            statEmojis: { power: '⬇️', accuracy: '✅' }
        },
        special: {
            nameKey: 'auto_battle_card_game.ui.card_types.special',
            descriptionKey: 'auto_battle_card_game.ui.card_types.special_description',
            name: '특수',
            get color() { return GameConfig.masterColors.cardTypes.special; },
            emoji: '🔮',
            statEmojis: { power: '🔮', accuracy: '✅' }
        },
        heal: {
            nameKey: 'auto_battle_card_game.ui.card_types.heal',
            descriptionKey: 'auto_battle_card_game.ui.card_types.heal_description',
            name: '회복',
            get color() { return GameConfig.masterColors.cardTypes.heal; },
            emoji: '✚',
            statEmojis: { power: '✚', accuracy: '✅' }
        }
    },

    // 체력 라벨 (인라인 라벨 시스템용)
    hpLabel: {
        nameKey: 'auto_battle_card_game.ui.hp_label',
        name: '체력',
        emoji: '❤️',
        get color() { return GameConfig.masterColors.hp; }
    },

    // 명중률 라벨 (인라인 라벨 시스템용)
    accuracyLabel: {
        nameKey: 'auto_battle_card_game.ui.accuracy',
        name: '명중률',
        emoji: '🎯',
        get color() { return GameConfig.masterColors.accuracy; }
    },

    // 플레이어 설정
    player: {
        get maxHandSize() { return GameConfig.constants.limits.maxHandSize; },
        startingHP: 10,
        defaultDefenseElement: 'normal'
    },

    // 체력 회복 시스템
    healing: {
        stageHealing: 5,            // 매 스테이지 회복량
        fullHealInterval: 10,       // 10의 배수 스테이지마다 완전 회복
        maxHPIncreasePerStage: 5    // 스테이지 클리어 시 최대 체력 증가량
    },

    // 플레이어 이름 설정
    playerName: {
        get maxLength() { return GameConfig.constants.limits.maxNameLength; },              // 최대 이름 길이
        allowEmpty: true,           // 빈 이름 허용 (기본값 사용)
        trimWhitespace: true        // 공백 제거
    },

    // 적 설정 (플레이어와 동일한 룰 적용)
    enemy: {
        get maxHandSize() { return GameConfig.constants.limits.maxHandSize; },
        startingHP: 10,
        defaultDefenseElement: 'normal',
        // 스테이지별 적 설정 (1-20스테이지)
        stageConfigs: {
            1: {
                hp: 3,
                cards: [
                    { id: 'random_bash', count: 1 }             // 마구때리기
                ]
            },
            2: {
                hp: 5,
                cards: [{ id: 'heavy_strike', count: 1 }]
            },
            3: {
                hp: 7,
                cards: [
                    { id: 'sand_throw', count: 1 },
                    { id: 'random_bash', count: 1 }
                ]
            },
            4: {
                hp: 9,
                cards: [
                    { id: 'raise_shield', count: 1 },
                    { id: 'shield_bash', count: 1 }
                ]
            },
            5: {
                hp: 15,
                cards: [
                    { id: 'taunt', count: 1 },
                    { id: 'wear_armor', count: 1 },
                    { id: 'shield_bash', count: 1 }
                ]
            },
            6: {
                hp: 27,
                cards: [
                    { id: 'sand_throw', count: 1 },
                    { id: 'heavy_strike', count: 1 },
                    { id: 'large_shield', count: 1 }
                ]
            },
            7: {
                hp: 40,
                cards: [
                    { id: 'concussion', count: 1 },
                    { id: 'wear_armor', count: 1 },
                    { id: 'raise_shield', count: 1 },
                    { id: 'shield_bash', count: 1 }
                ]
            },
            8: {
                hp: 50,
                cards: [
                    { id: 'taunt', count: 1 },
                    { id: 'wear_armor', count: 1 },
                    { id: 'random_bash', count: 1 },
                    { id: 'shield_bash', count: 1 }
                ]
            },
            9: {
                hp: 60,
                cards: [
                    { id: 'fast_attack', count: 1 },
                    { id: 'heavy_strike', count: 1 },
                    { id: 'large_shield', count: 1 }
                ]
            },
            10: {
                hp: 100,
                cards: [
                    { id: 'raise_shield', count: 5 },
                    { id: 'shield_bash', count: 1 }
                ]
            },
            11: {
                hp: 110,
                cards: [
                    { id: 'fire_shield', count: 1 },       // 불의방패
                    { id: 'hot_breath', count: 1 },        // 뜨거운입김
                    { id: 'chains_of_fire', count: 1 },    // 불의사슬
                    { id: 'powder_keg', count: 1 },        // 화약통투척
                    { id: 'fireball', count: 1 }           // 화염구
                ]
            },
            12: {
                hp: 120,
                cards: [
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'fire_breath', count: 1 },       // 불의 호흡
                    { id: 'opportunity_scent', count: 1 }, // 기회의 냄새
                    { id: 'flame_ascension', count: 1 }    // 화염승천
                ]
            },
            13: {
                hp: 130,
                cards: [
                    { id: 'scorched_shield', count: 1 },  // 작열방패
                    { id: 'ignite', count: 1 },           // 발화
                    { id: 'flame_throw', count: 1 }       // 불꽃 던지기
                ]
            },
            14: {
                hp: 140,
                cards: [
                    { id: 'battery_explosion', count: 2 }, // 배터리 폭발 x2
                    { id: 'flame_throw', count: 1 },       // 불꽃 던지기
                    { id: 'chains_of_fire', count: 1 }     // 불의 사슬
                ]
            },
            15: {
                hp: 150,
                cards: [
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'fire_breath', count: 1 },       // 불의 호흡
                    { id: 'opportunity_scent', count: 1 }, // 기회의 냄새
                    { id: 'fireball', count: 1 }           // 화염구
                ]
            },
            16: {
                hp: 160,
                cards: [
                    { id: 'nutrient_supplement', count: 1 }, // 영양제
                    { id: 'red_pendant', count: 1 },         // 붉은 펜던트
                    { id: 'flame_throw', count: 1 },         // 불꽃던지기
                    { id: 'flame_ascension', count: 1 }      // 화염승천
                ]
            },
            17: {
                hp: 170,
                cards: [
                    { id: 'hot_breath', count: 1 },           // 뜨거운입김
                    { id: 'ignite', count: 1 },               // 발화
                    { id: 'chains_of_fire', count: 1 },       // 불의 사슬
                    { id: 'indomitable_gauntlet', count: 1 }, // 불굴의 장갑
                    { id: 'flame_burst', count: 1 }           // 화염방사
                ]
            },
            18: {
                hp: 180,
                cards: [
                    { id: 'fire_breath', count: 1 },       // 불의 호흡
                    { id: 'hot_wind', count: 1 },          // 열풍
                    { id: 'red_pendant', count: 1 },       // 붉은 펜던트
                    { id: 'flame_throw', count: 2 }        // 불꽃던지기 x2
                ]
            },
            19: {
                hp: 190,
                cards: [
                    { id: 'red_pendant', count: 1 },           // 붉은 펜던트
                    { id: 'indomitable_gauntlet', count: 1 },  // 불굴의 장갑
                    { id: 'fireball', count: 1 },              // 화염구
                    { id: 'crouch', count: 1 }                 // 웅크리기
                ]
            },
            20: {
                hp: 300,
                cards: [
                    { id: 'sharpen', count: 1 },           // 벼리기
                    { id: 'karura_strike', count: 1 },     // 카루라 일격
                    { id: 'lava_prison', count: 1 }        // 용암 감옥
                ]
            },
            21: {
                hp: 320,
                cards: [
                    { id: 'water_play', count: 1 },        // 물장구
                    { id: 'healing_spring', count: 1 },    // 회복의 샘
                    { id: 'mud_bath', count: 1 },          // 진흙탕
                    { id: 'water_bomb', count: 1 },        // 물폭탄
                    { id: 'freezing_wind', count: 1 }      // 냉동바람
                ]
            },
            22: {
                hp: 340,
                cards: [
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'sleet', count: 1 },             // 진눈깨비
                    { id: 'mud_bath', count: 1 },          // 진흙탕
                    { id: 'cold_snap', count: 1 },         // 혹한기
                    { id: 'ice_breaker', count: 1 }        // 얼음깨기
                ]
            },
            23: {
                hp: 360,
                cards: [
                    { id: 'slash_water', count: 1 },       // 칼로 물 베기
                    { id: 'water_healing', count: 1 },     // 물의 치유
                    { id: 'healing_spring', count: 1 },    // 회복의 샘
                    { id: 'purification', count: 1 },      // 정화
                    { id: 'torrent', count: 4 },           // 급류 x4
                    { id: 'water_bomb', count: 1 }         // 물폭탄
                ]
            },
            24: {
                hp: 380,
                cards: [
                    { id: 'tsunami', count: 1 },           // 쓰나미
                    { id: 'moisture_absorption', count: 3 }, // 수분 흡수 x3
                    { id: 'healing_spring', count: 1 },    // 회복의 샘
                    { id: 'skin_breathing', count: 1 }     // 피부 호흡
                ]
            },
            25: {
                hp: 400,
                cards: [
                    { id: 'slash_water', count: 1 },       // 칼로 물 베기
                    { id: 'mud_bath', count: 1 },          // 진흙탕
                    { id: 'purification', count: 1 },      // 정화
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'torrent', count: 1 },           // 급류
                    { id: 'freezing_wind', count: 1 }      // 냉동바람
                ]
            },
            26: {
                hp: 420,
                cards: [
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'cold_snap', count: 1 },         // 혹한기
                    { id: 'cold_burn', count: 1 },         // 저온화상
                    { id: 'skin_breathing', count: 1 },    // 피부호흡
                    { id: 'water_healing', count: 1 },     // 물의 치유
                    { id: 'ice_breaker', count: 1 }        // 얼음깨기
                ]
            },
            27: {
                hp: 440,
                cards: [
                    { id: 'endless_effort', count: 1 },    // 끝없는 노력
                    { id: 'water_play', count: 1 },        // 물장구
                    { id: 'skin_breathing', count: 1 },    // 피부호흡
                    { id: 'healing_spring', count: 1 },    // 회복의샘
                    { id: 'water_healing', count: 1 },     // 물의 치유
                    { id: 'torrent', count: 3 },           // 급류 x3
                    { id: 'bubble_strike', count: 1 }      // 거품타격
                ]
            },
            28: {
                hp: 460,
                cards: [
                    { id: 'sword_dance', count: 1 },       // 칼춤
                    { id: 'tsunami', count: 1 },           // 쓰나미
                    { id: 'water_healing', count: 1 },     // 물의치유
                    { id: 'skin_breathing', count: 1 },    // 피부호흡
                    { id: 'slash_water', count: 1 }        // 칼로 물 베기
                ]
            },
            29: {
                hp: 500,
                cards: [
                    { id: 'water_bomb', count: 1 },        // 물폭탄
                    { id: 'freezing_wind', count: 1 },     // 냉동바람
                    { id: 'ice_breaker', count: 1 }        // 얼음깨기
                ]
            },
            30: {
                hp: 700,
                cards: [
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'moisture_absorption', count: 1 }, // 수분흡수
                    { id: 'purification', count: 1 },      // 정화
                    { id: 'torrent', count: 1 },           // 급류
                    { id: 'tsunami', count: 1 },           // 쓰나미
                    { id: 'slash_water', count: 1 },       // 칼로 물 베기
                    { id: 'cold_snap', count: 1 },         // 혹한기
                    { id: 'cold_burn', count: 1 },         // 저온화상
                    { id: 'skin_breathing', count: 1 },    // 피부호흡
                    { id: 'liquify', count: 1 }            // 액체화
                ]
            },
            31: {
                hp: 550,
                cards: [
                    { id: 'phase_shock', count: 1 },       // 위상 쇼크
                    { id: 'high_voltage_current', count: 1 }, // 고압 전류
                    { id: 'battery_explosion', count: 1 }, // 배터리 폭발
                    { id: 'overcharge_battery', count: 1 }, // 과충전
                    { id: 'super_conductivity', count: 1 }, // 초전도
                    { id: 'thunder_strike', count: 1 }     // 번개일격
                ]
            },
            32: {
                hp: 575,
                cards: [
                    { id: 'conductive_armor', count: 1 },  // 전도갑옷
                    { id: 'current_wall', count: 1 },      // 전류 벽
                    { id: 'light_speed', count: 1 },       // 빛의 속도
                    { id: 'lightning_storm', count: 1 },   // 번개폭풍
                    { id: 'electric_shock', count: 1 },    // 감전
                    { id: 'overload', count: 1 },          // 과부하
                    { id: 'short_circuit', count: 1 }      // 쇼트
                ]
            },
            33: {
                hp: 600,
                cards: [
                    { id: 'battery_pack', count: 2 },      // 건전지 팩 x2
                    { id: 'light_speed', count: 1 },       // 빛의 속도
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'high_voltage_current', count: 1 }, // 고압 전류
                    { id: 'high_voltage_gloves', count: 1 }, // 고전압 장갑
                    { id: 'endless_effort', count: 1 },    // 끝없는 노력
                    { id: 'short_circuit', count: 1 }      // 쇼트
                ]
            },
            34: {
                hp: 625,
                cards: [
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'high_voltage_gloves', count: 1 }, // 고전압 장갑
                    { id: 'current_wall', count: 1 },      // 전류 벽
                    { id: 'barricade', count: 1 },         // 바리케이드
                    { id: 'battery_explosion', count: 1 }, // 배터리 폭발
                    { id: 'overcharge_battery', count: 1 }, // 과충전
                    { id: 'lightning_storm', count: 1 },   // 번개 폭풍
                    { id: 'overload', count: 1 }           // 과부하
                ]
            },
            35: {
                hp: 650,
                cards: [
                    { id: 'super_conductivity', count: 1 }, // 초전도
                    { id: 'light_speed', count: 2 },       // 빛의 속도 x2
                    { id: 'indomitable_gauntlet', count: 1 }, // 불굴의 장갑
                    { id: 'phase_shock', count: 1 },       // 위상 쇼크
                    { id: 'thunder_strike', count: 1 }     // 번개 일격
                ]
            },
            36: {
                hp: 675,
                cards: [
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'sword_dance', count: 1 },       // 칼춤
                    { id: 'purification', count: 1 },      // 정화
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'blinding_flash', count: 1 },    // 눈부신 섬광
                    { id: 'electromagnetic_barrier', count: 1 }, // 전자기 방호
                    { id: 'red_pendant', count: 1 },       // 붉은 펜던트
                    { id: 'light_speed', count: 2 },       // 빛의 속도 x2
                    { id: 'overload', count: 1 }           // 과부하
                ]
            },
            37: {
                hp: 700,
                cards: [
                    { id: 'endless_effort', count: 1 },    // 끝없는 노력
                    { id: 'conductive_armor', count: 1 },  // 전도갑옷
                    { id: 'current_wall', count: 1 },      // 전류 벽
                    { id: 'high_voltage_gloves', count: 1 }, // 고전압 장갑
                    { id: 'lightning_storm', count: 3 },   // 번개폭풍 x3
                    { id: 'electric_shock', count: 1 },    // 감전
                    { id: 'overload', count: 1 },          // 과부하
                    { id: 'short_circuit', count: 1 }      // 쇼트
                ]
            },
            38: {
                hp: 750,
                cards: [
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'battery_pack', count: 6 },      // 건전지 팩 x6
                    { id: 'battery_explosion', count: 1 }, // 배터리 폭발
                    { id: 'overcharge_battery', count: 1 }, // 과충전
                    { id: 'short_circuit', count: 1 }      // 쇼트
                ]
            },
            39: {
                hp: 800,
                cards: [
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'super_conductivity', count: 1 }, // 초전도
                    { id: 'light_speed', count: 3 },       // 빛의 속도 x3
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'high_voltage_gloves', count: 1 }, // 고전압 장갑
                    { id: 'conductive_armor', count: 1 },  // 전도갑옷
                    { id: 'electric_shock', count: 2 }     // 감전 x2
                ]
            },
            40: {
                hp: 1000,
                cards: [
                    { id: 'blinding_flash', count: 1 },     // 눈부신 섬광
                    { id: 'battery_pack', count: 2 },       // 건전지팩 x2
                    { id: 'super_conductivity', count: 1 }, // 초전도
                    { id: 'light_speed', count: 1 },        // 빛의 속도
                    { id: 'static', count: 1 },             // 정전기
                    { id: 'thunder_strike', count: 1 }      // 번개일격
                ]
            },
            41: {
                hp: 1100,
                cards: [
                    { id: 'chain_reaction', count: 2 },    // 연쇄 반응 x2
                    { id: 'inhibitor', count: 1 },         // 억제제
                    { id: 'poison_needle', count: 1 },     // 독침
                    { id: 'liquid_coating', count: 1 },    // 액체 코팅
                    { id: 'poison_fang', count: 1 },       // 독 이빨
                    { id: 'gas_absorption', count: 1 }     // 가스 흡수
                ]
            },
            42: {
                hp: 1200,
                cards: [
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'sulfur_spring', count: 1 },     // 유황 온천
                    { id: 'sword_dance', count: 1 },       // 칼춤
                    { id: 'poison_barrage', count: 2 },    // 독침 연발 x2
                    { id: 'indomitable_gauntlet', count: 2 }, // 불굴의 장갑 x2
                    { id: 'gas_absorption', count: 1 }     // 가스흡수
                ]
            },
            43: {
                hp: 1300,
                cards: [
                    { id: 'inhibitor', count: 1 },         // 억제제
                    { id: 'sticky_liquid', count: 1 },     // 끈끈한 액체
                    { id: 'oblivion_draught', count: 1 },  // 망각제
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'poison_mutation', count: 2 },   // 맹독 변성 x2
                    { id: 'mirror_reaction', count: 1 },   // 거울 반응
                    { id: 'toxic_blast', count: 1 }        // 맹독 폭발
                ]
            },
            44: {
                hp: 1400,
                cards: [
                    { id: 'poison_throw', count: 5 },      // 독극물 투척 x5
                    { id: 'poison_mutation', count: 1 },   // 맹독 변성
                    { id: 'mirror_reaction', count: 1 },   // 거울 반응
                    { id: 'gas_absorption', count: 1 }     // 가스 흡수
                ]
            },
            45: {
                hp: 1500,
                cards: [
                    { id: 'inhibitor', count: 2 },         // 억제제 x2
                    { id: 'sulfur_spring', count: 1 },     // 유황 온천
                    { id: 'sticky_liquid', count: 1 },     // 끈끈한 액체
                    { id: 'toxic_barrier', count: 2 },     // 독극물 장벽 x2
                    { id: 'barricade', count: 1 },         // 바리케이드
                    { id: 'poison_needle', count: 1 },     // 독침
                    { id: 'poison_fang', count: 2 }        // 독 이빨 x2
                ]
            },
            46: {
                hp: 1600,
                cards: [
                    { id: 'oblivion_draught', count: 1 },  // 망각제
                    { id: 'liquid_coating', count: 1 },    // 액체 코팅
                    { id: 'sulfur_spring', count: 1 },     // 유황 온천
                    { id: 'mud_bath', count: 1 },          // 진흙탕
                    { id: 'taunt', count: 1 },             // 도발
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'phase_shock', count: 1 },       // 위상 쇼크
                    { id: 'catalyst', count: 1 }           // 촉진제
                ]
            },
            47: {
                hp: 1700,
                cards: [
                    { id: 'smog', count: 3 },              // 스모그 x3
                    { id: 'poison_throw', count: 2 },      // 독극물 투척 x2
                    { id: 'poison_fang', count: 1 },       // 독 이빨
                    { id: 'poison_barrage', count: 1 },    // 독침 연발
                    { id: 'toxic_blast', count: 1 },       // 맹독 폭발
                    { id: 'mirror_reaction', count: 1 }    // 거울 반응
                ]
            },
            48: {
                hp: 1800,
                cards: [
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'lava_prison', count: 1 },       // 용암 감옥
                    { id: 'poison_needle', count: 1 },     // 독침
                    { id: 'poison_fang', count: 3 },       // 독 이빨 x3
                    { id: 'gas_absorption', count: 1 },    // 가스 흡수
                    { id: 'mirror_reaction', count: 1 }    // 거울 반응
                ]
            },
            49: {
                hp: 1900,
                cards: [
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'poison_mutation', count: 2 },   // 맹독 변성 x2
                    { id: 'gas_absorption', count: 1 },    // 가스 흡수
                    { id: 'mirror_reaction', count: 1 },   // 거울 반응
                    { id: 'crouch', count: 1 }             // 웅크리기
                ]
            },
            50: {
                hp: 2500,
                cards: [
                    { id: 'taunt', count: 1 },             // 도발
                    { id: 'oblivion_draught', count: 1 },  // 망각제
                    { id: 'chain_reaction', count: 1 },    // 연쇄 반응
                    { id: 'poison_needle', count: 1 },     // 독침
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'poison_mutation', count: 1 },   // 맹독변성
                    { id: 'toxic_blast', count: 1 },       // 맹독 폭발
                    { id: 'mirror_reaction', count: 1 },   // 거울 반응
                    { id: 'gas_absorption', count: 1 }     // 가스 흡수
                ]
            },
            51: {
                hp: 3000,
                cards: [
                    { id: 'heavy_strike', count: 10 }      // 세게 치기 x10
                ]
            },
            52: {
                hp: 3500,
                cards: [
                    { id: 'taunt', count: 1 },             // 도발
                    { id: 'large_shield', count: 8 },      // 거대방패 x8
                    { id: 'shield_bash', count: 1 }        // 방패치기
                ]
            },
            53: {
                hp: 4000,
                cards: [
                    { id: 'defibrillator', count: 1 },     // 제세동기
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'cold_snap', count: 1 },         // 혹한기
                    { id: 'ice_breaker', count: 2 },       // 얼음깨기 x2
                    { id: 'freezing_wind', count: 1 }      // 냉동바람
                ]
            },
            54: {
                hp: 4500,
                cards: [
                    { id: 'water_play', count: 1 },        // 물장구
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'moisture_absorption', count: 1 }, // 수분흡수
                    { id: 'light_speed', count: 2 },       // 빛의 속도 x2
                    { id: 'electric_shock', count: 1 },    // 감전
                    { id: 'liquify', count: 1 }            // 액체화
                ]
            },
            55: {
                hp: 5000,
                cards: [
                    { id: 'paralysis_trap', count: 1 },    // 마비 덫
                    { id: 'high_voltage_gloves', count: 1 }, // 고전압 장갑
                    { id: 'current_wall', count: 1 },      // 전류 벽
                    { id: 'scorched_shield', count: 1 },   // 작열방패
                    { id: 'indomitable_gauntlet', count: 1 }, // 불굴의 장갑
                    { id: 'red_pendant', count: 1 },       // 붉은 펜던트
                    { id: 'large_shield', count: 1 },      // 거대방패
                    { id: 'barricade', count: 1 },         // 바리케이드
                    { id: 'shield_bash', count: 1 },       // 방패치기
                    { id: 'poison_fang', count: 1 }        // 독 이빨
                ]
            },
            56: {
                hp: 5500,
                cards: [
                    { id: 'purification', count: 1 },      // 정화
                    { id: 'moisture_absorption', count: 4 }, // 수분흡수 x4
                    { id: 'tsunami', count: 5 }            // 쓰나미 x5
                ]
            },
            57: {
                hp: 6000,
                cards: [
                    { id: 'battery_pack', count: 2 },      // 건전지 팩 x2
                    { id: 'hot_breath', count: 1 },        // 뜨거운 입김
                    { id: 'fire_breath', count: 1 },       // 불의 호흡
                    { id: 'sharpen', count: 1 },           // 벼리기
                    { id: 'opportunity_scent', count: 1 }, // 기회의 냄새
                    { id: 'ignite', count: 1 },            // 발화
                    { id: 'hot_wind', count: 1 },          // 열풍
                    { id: 'fireball', count: 2 }           // 화염구 x2
                ]
            },
            58: {
                hp: 6500,
                cards: [
                    { id: 'toxic_gas', count: 1 },         // 유독가스
                    { id: 'poison_mutation', count: 3 },   // 맹독 변성 x3
                    { id: 'gas_absorption', count: 1 }     // 가스흡수
                ]
            },
            59: {
                hp: 7000,
                cards: [
                    { id: 'endless_effort', count: 3 },    // 끝없는 노력 x3
                    { id: 'lightning_storm', count: 1 },   // 번개 폭풍
                    { id: 'electric_shock', count: 1 },    // 감전
                    { id: 'overload', count: 1 },          // 과부하
                    { id: 'short_circuit', count: 1 },     // 쇼트
                    { id: 'liquify', count: 1 }            // 액체화
                ]
            },
            60: {
                hp: 10000,
                cards: [
                    { id: 'water_bomb', count: 1 },        // 물폭탄
                    { id: 'freezing_wind', count: 2 },     // 냉동바람 x2
                    { id: 'ice_breaker', count: 3 },       // 얼음깨기 x3
                    { id: 'rain', count: 1 },              // 비내리기
                    { id: 'cold_snap', count: 1 },         // 혹한기
                    { id: 'tsunami', count: 1 },           // 쓰나미
                    { id: 'liquify', count: 1 }            // 액체화
                ]
            }
        },

        // 랜덤 인카운터 시스템 (스테이지별 덱 풀)
        randomEncounters: {
            enabled: true,  // 랜덤 인카운터 활성화 토글

            // 스테이지별 덱 풀 정의
            stages: {
                1: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'random_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'heavy_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'concussion', count: 1 }
                            ]
                        }
                    ]
                },
                2: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'heavy_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'raise_shield', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'counter_attack', count: 1 }
                            ]
                        }
                    ]
                },
                3: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'sand_throw', count: 1 },
                                { id: 'random_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'thorn_armor', count: 1 },
                                { id: 'concussion', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'insult', count: 1 },
                                { id: 'heavy_strike', count: 1 }
                            ]
                        }
                    ]
                },
                4: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'raise_shield', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'wear_armor', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'net_throw', count: 1 },
                                { id: 'random_bash', count: 1 }
                            ]
                        }
                    ]
                },
                5: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'wear_armor', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'concussion', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'counter_attack', count: 1 }
                            ]
                        }
                    ]
                },
                6: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'sand_throw', count: 1 },
                                { id: 'heavy_strike', count: 1 },
                                { id: 'large_shield', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'push_back', count: 1 },
                                { id: 'random_bash', count: 1 },
                                { id: 'wear_armor', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'net_throw', count: 1 },
                                { id: 'wear_armor', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                7: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'concussion', count: 1 },
                                { id: 'wear_armor', count: 1 },
                                { id: 'raise_shield', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'raise_shield', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'sword_dance', count: 1 },
                                { id: 'wear_armor', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                8: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'wear_armor', count: 1 },
                                { id: 'random_bash', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'raise_shield', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'thorn_armor', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'raise_shield', count: 1 },
                                { id: 'heavy_strike', count: 1 }
                            ]
                        }
                    ]
                },
                9: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'fast_attack', count: 1 },
                                { id: 'heavy_strike', count: 1 },
                                { id: 'large_shield', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'wear_armor', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'sword_dance', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'heavy_strike', count: 1 }
                            ]
                        }
                    ]
                },
                10: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'raise_shield', count: 5 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'large_shield', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'wear_armor', count: 1 },
                                { id: 'raise_shield', count: 1 },
                                { id: 'heavy_strike', count: 3 }
                            ]
                        }
                    ]
                },
                11: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'fire_shield', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'chains_of_fire', count: 1 },
                                { id: 'powder_keg', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'nutrient_supplement', count: 1 },
                                { id: 'flame_ascension', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'flame_wall', count: 1 },
                                { id: 'fireball', count: 2 }
                            ]
                        }
                    ]
                },
                12: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'fire_breath', count: 1 },
                                { id: 'opportunity_scent', count: 1 },
                                { id: 'flame_ascension', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'flame_burst', count: 1 },
                                { id: 'first_aid', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'red_pendant', count: 2 },
                                { id: 'chains_of_fire', count: 1 },
                                { id: 'flame_throw', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        }
                    ]
                },
                13: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'scorched_shield', count: 1 },
                                { id: 'flame_throw', count: 3 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'hot_wind', count: 1 },
                                { id: 'flame_throw', count: 2 },
                                { id: 'bandage', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'sharpen', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        }
                    ]
                },
                14: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'battery_explosion', count: 2 },
                                { id: 'flame_throw', count: 1 },
                                { id: 'chains_of_fire', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'fire_shield', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'flame_throw', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'powder_keg', count: 1 }
                            ]
                        }
                    ]
                },
                15: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'fire_breath', count: 1 },
                                { id: 'opportunity_scent', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'scorched_shield', count: 1 },
                                { id: 'flame_ascension', count: 1 },
                                { id: 'nutrient_supplement', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'red_pendant', count: 1 },
                                { id: 'flame_burst', count: 1 }
                            ]
                        }
                    ]
                },
                16: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'nutrient_supplement', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'flame_throw', count: 1 },
                                { id: 'flame_ascension', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'scorched_shield', count: 1 },
                                { id: 'nutrient_supplement', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'powder_keg', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'lava_prison', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        }
                    ]
                },
                17: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'chains_of_fire', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'fireball', count: 2 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'flame_wall', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'opportunity_scent', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'first_aid', count: 1 },
                                { id: 'fireball', count: 1 },
                                { id: 'flame_ascension', count: 1 }
                            ]
                        }
                    ]
                },
                18: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'fire_breath', count: 1 },
                                { id: 'hot_wind', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'flame_throw', count: 2 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'fire_shield', count: 2 },
                                { id: 'flame_wall', count: 2 },
                                { id: 'red_pendant', count: 2 },
                                { id: 'scorched_shield', count: 2 },
                                { id: 'flame_throw', count: 2 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'flame_wall', count: 1 },
                                { id: 'scorched_shield', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                19: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'red_pendant', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'fireball', count: 1 },
                                { id: 'crouch', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'karura_strike', count: 1 },
                                { id: 'first_aid', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'powder_keg', count: 2 },
                                { id: 'nutrient_supplement', count: 1 }
                            ]
                        }
                    ]
                },
                20: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'sharpen', count: 1 },
                                { id: 'karura_strike', count: 1 },
                                { id: 'lava_prison', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'sharpen', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'flame_ascension', count: 1 },
                                { id: 'flame_throw', count: 1 },
                                { id: 'chains_of_fire', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'sharpen', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'flame_wall', count: 1 },
                                { id: 'hot_wind', count: 1 },
                                { id: 'fireball', count: 2 }
                            ]
                        }
                    ]
                },
                21: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'water_play', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'mud_bath', count: 1 },
                                { id: 'water_bomb', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'tsunami', count: 1 },
                                { id: 'skin_breathing', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'sleet', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        }
                    ]
                },
                22: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'sleet', count: 1 },
                                { id: 'mud_bath', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'water_play', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'bubble_strike', count: 1 },
                                { id: 'slash_water', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'tsunami', count: 1 },
                                { id: 'water_healing', count: 2 },
                                { id: 'moisture_absorption', count: 2 }
                            ]
                        }
                    ]
                },
                23: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'slash_water', count: 1 },
                                { id: 'water_healing', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'torrent', count: 4 },
                                { id: 'water_bomb', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'moisture_absorption', count: 3 },
                                { id: 'rain', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'water_bomb', count: 6 },
                                { id: 'skin_breathing', count: 1 }
                            ]
                        }
                    ]
                },
                24: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'tsunami', count: 1 },
                                { id: 'moisture_absorption', count: 3 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'skin_breathing', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'water_bomb', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'purification', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'cold_burn', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        }
                    ]
                },
                25: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'slash_water', count: 1 },
                                { id: 'mud_bath', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'torrent', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'thorn_armor', count: 1 },
                                { id: 'bubble_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'water_play', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'water_bomb', count: 1 },
                                { id: 'tsunami', count: 1 }
                            ]
                        }
                    ]
                },
                26: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'cold_burn', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'water_healing', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'purification', count: 1 },
                                { id: 'torrent', count: 2 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'water_bomb', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        }
                    ]
                },
                27: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'endless_effort', count: 1 },
                                { id: 'water_play', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'water_healing', count: 1 },
                                { id: 'torrent', count: 3 },
                                { id: 'bubble_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'endless_effort', count: 1 },
                                { id: 'torrent', count: 4 },
                                { id: 'water_bomb', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'endless_effort', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        }
                    ]
                },
                28: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'sword_dance', count: 1 },
                                { id: 'tsunami', count: 1 },
                                { id: 'water_healing', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'slash_water', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'sword_dance', count: 1 },
                                { id: 'water_bomb', count: 5 },
                                { id: 'skin_breathing', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'cold_burn', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        }
                    ]
                },
                29: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'water_bomb', count: 1 },
                                { id: 'freezing_wind', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'water_bomb', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'freezing_wind', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        }
                    ]
                },
                30: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'moisture_absorption', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'torrent', count: 1 },
                                { id: 'tsunami', count: 1 },
                                { id: 'slash_water', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'cold_burn', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'torrent', count: 2 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        }
                    ]
                },
                31: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'phase_shock', count: 1 },
                                { id: 'high_voltage_current', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 4 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                32: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'conductive_armor', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'lightning_storm', count: 1 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'conductive_armor', count: 1 },
                                { id: 'battery_pack', count: 2 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'conductive_armor', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'battery_pack', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'overload', count: 1 }
                            ]
                        }
                    ]
                },
                33: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'battery_pack', count: 2 },
                                { id: 'light_speed', count: 1 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_current', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'battery_pack', count: 2 },
                                { id: 'light_speed', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'high_voltage_current', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'overload', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'battery_pack', count: 2 },
                                { id: 'light_speed', count: 3 },
                                { id: 'rain', count: 1 },
                                { id: 'high_voltage_current', count: 1 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        }
                    ]
                },
                34: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'lightning_storm', count: 1 },
                                { id: 'overload', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'phase_shock', count: 1 },
                                { id: 'battery_pack', count: 2 },
                                { id: 'light_speed', count: 4 },
                                { id: 'rain', count: 1 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'barricade', count: 2 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                35: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 2 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'phase_shock', count: 1 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'phase_shock', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'battery_pack', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'phase_shock', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'battery_pack', count: 1 }
                            ]
                        }
                    ]
                },
                36: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'blinding_flash', count: 1 },
                                { id: 'electromagnetic_barrier', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'light_speed', count: 2 },
                                { id: 'overload', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'blinding_flash', count: 1 },
                                { id: 'electromagnetic_barrier', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'light_speed', count: 2 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'sword_dance', count: 1 },
                                { id: 'purification', count: 1 },
                                { id: 'phase_shock', count: 1 },
                                { id: 'blinding_flash', count: 1 },
                                { id: 'electromagnetic_barrier', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        }
                    ]
                },
                37: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'endless_effort', count: 1 },
                                { id: 'conductive_armor', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'lightning_storm', count: 3 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'endless_effort', count: 4 },
                                { id: 'light_speed', count: 2 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'phase_shock', count: 1 },
                                { id: 'battery_pack', count: 2 },
                                { id: 'lightning_storm', count: 3 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        }
                    ]
                },
                38: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'battery_pack', count: 6 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'battery_pack', count: 6 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'battery_pack', count: 6 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'overload', count: 1 }
                            ]
                        }
                    ]
                },
                39: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 3 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'conductive_armor', count: 1 },
                                { id: 'electric_shock', count: 2 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'hot_breath', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 3 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'conductive_armor', count: 1 },
                                { id: 'overload', count: 2 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'thorn_armor', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'conductive_armor', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        }
                    ]
                },
                40: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'blinding_flash', count: 1 },
                                { id: 'battery_pack', count: 2 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'light_speed', count: 1 },
                                { id: 'static', count: 1 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'blinding_flash', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'thunder_strike', count: 7 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'battery_pack', count: 2 },
                                { id: 'static', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'electric_shock', count: 1 }
                            ]
                        }
                    ]
                },
                50: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'shake_off', count: 1 },         // 몸 털기
                                { id: 'taunt', count: 1 },             // 도발
                                { id: 'oblivion_draught', count: 1 },  // 망각제
                                { id: 'chain_reaction', count: 1 },    // 연쇄 반응
                                { id: 'poison_needle', count: 1 },     // 독침
                                { id: 'toxic_gas', count: 1 },         // 유독가스
                                { id: 'poison_mutation', count: 1 },   // 맹독변성
                                { id: 'toxic_blast', count: 1 },       // 맹독 폭발
                                { id: 'mirror_reaction', count: 1 },   // 거울 반응
                                { id: 'gas_absorption', count: 1 }     // 가스 흡수
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'shake_off', count: 1 },            // 몸 털기
                                { id: 'poison_needle', count: 1 },        // 독침
                                { id: 'bifunctional_shield', count: 1 },  // 이관능성 방패
                                { id: 'poison_fang', count: 5 },          // 독 이빨 x5
                                { id: 'mirror_reaction', count: 1 },      // 거울 반응
                                { id: 'gas_absorption', count: 1 }        // 가스 흡수
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'shake_off', count: 1 },          // 몸 털기
                                { id: 'sticky_liquid', count: 1 },      // 끈끈한 액체
                                { id: 'toxic_gas', count: 1 },          // 유독가스
                                { id: 'liquid_coating', count: 1 },     // 액체 코팅
                                { id: 'sulfur_spring', count: 1 },      // 유황 온천
                                { id: 'poison_needle', count: 1 },      // 독침
                                { id: 'chain_reaction', count: 1 },     // 연쇄 반응
                                { id: 'poison_throw', count: 1 },       // 독극물 투척
                                { id: 'poison_mutation', count: 1 },    // 맹독 변성
                                { id: 'gas_absorption', count: 1 }      // 가스 흡수
                            ]
                        }
                    ]
                },
                51: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'heavy_strike', count: 10 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'super_conductivity', count: 1 },
                                { id: 'thunder_strike', count: 9 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'fireball', count: 10 }
                            ]
                        }
                    ]
                },
                52: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'taunt', count: 1 },
                                { id: 'large_shield', count: 8 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 4 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'scorched_shield', count: 6 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        }
                    ]
                },
                53: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'defibrillator', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 2 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'push_back', count: 1 },
                                { id: 'toxic_gas', count: 3 },
                                { id: 'poison_mutation', count: 1 },
                                { id: 'toxic_blast', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'sword_dance', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 1 },
                                { id: 'karura_strike', count: 1 },
                                { id: 'nutrient_supplement', count: 1 }
                            ]
                        }
                    ]
                },
                54: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'water_play', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'moisture_absorption', count: 1 },
                                { id: 'light_speed', count: 2 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'battery_pack', count: 3 },
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'endless_effort', count: 1 },
                                { id: 'short_circuit', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'catalyst', count: 1 },
                                { id: 'freezing_wind', count: 1 }
                            ]
                        }
                    ]
                },
                55: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'scorched_shield', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'red_pendant', count: 1 },
                                { id: 'large_shield', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 },
                                { id: 'poison_fang', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'flame_wall', count: 1 },
                                { id: 'barricade', count: 2 },
                                { id: 'hot_wind', count: 1 },
                                { id: 'fireball', count: 3 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 1 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'freezing_wind', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 }
                            ]
                        }
                    ]
                },
                56: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'purification', count: 1 },
                                { id: 'moisture_absorption', count: 4 },
                                { id: 'tsunami', count: 5 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'purification', count: 1 },
                                { id: 'battery_pack', count: 5 },
                                { id: 'high_voltage_gloves', count: 1 },
                                { id: 'karura_strike', count: 3 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'purification', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 4 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'thunder_strike', count: 1 }
                            ]
                        }
                    ]
                },
                57: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'battery_pack', count: 5 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'fire_breath', count: 1 },
                                { id: 'sharpen', count: 1 },
                                { id: 'ignite', count: 1 },
                                { id: 'fireball', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'battery_pack', count: 2 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'fire_breath', count: 1 },
                                { id: 'battery_explosion', count: 1 },
                                { id: 'overcharge_battery', count: 3 },
                                { id: 'flame_throw', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'slash_water', count: 1 },
                                { id: 'large_shield', count: 2 },
                                { id: 'barricade', count: 2 },
                                { id: 'shield_bash', count: 1 },
                                { id: 'crouch', count: 1 }
                            ]
                        }
                    ]
                },
                58: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'toxic_gas', count: 1 },
                                { id: 'poison_mutation', count: 3 },
                                { id: 'gas_absorption', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'unbreakable_mind', count: 1 },
                                { id: 'flame_wall', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'toxic_barrier', count: 1 },
                                { id: 'large_shield', count: 1 },
                                { id: 'barricade', count: 1 },
                                { id: 'shield_bash', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'endless_effort', count: 1 },
                                { id: 'thorn_armor', count: 1 },
                                { id: 'indomitable_gauntlet', count: 1 },
                                { id: 'flame_ascension', count: 2 },
                                { id: 'first_aid', count: 3 }
                            ]
                        }
                    ]
                },
                59: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'endless_effort', count: 3 },
                                { id: 'lightning_storm', count: 1 },
                                { id: 'electric_shock', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'short_circuit', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'paralysis_trap', count: 1 },
                                { id: 'static', count: 1 },
                                { id: 'hot_breath', count: 1 },
                                { id: 'super_conductivity', count: 1 },
                                { id: 'battery_pack', count: 2 },
                                { id: 'current_wall', count: 1 },
                                { id: 'blinding_flash', count: 1 },
                                { id: 'overload', count: 1 },
                                { id: 'liquify', count: 1 }         // 액체화
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'rain', count: 2 },
                                { id: 'healing_spring', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'water_healing', count: 1 },
                                { id: 'freezing_wind', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        }
                    ]
                },
                60: {
                    deckPool: [
                        {
                            name: 'deck1',
                            cards: [
                                { id: 'shake_off', count: 1 },
                                { id: 'rain', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 },
                                { id: 'cold_snap', count: 1 },
                                { id: 'ice_breaker', count: 1 },
                                { id: 'skin_breathing', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck2',
                            cards: [
                                { id: 'shake_off', count: 1 },
                                { id: 'ignite', count: 1 },
                                { id: 'karura_strike', count: 1 },
                                { id: 'powder_keg', count: 2 },
                                { id: 'liquify', count: 1 }
                            ]
                        },
                        {
                            name: 'deck3',
                            cards: [
                                { id: 'shake_off', count: 1 },
                                { id: 'flame_wall', count: 1 },
                                { id: 'current_wall', count: 1 },
                                { id: 'toxic_barrier', count: 1 },
                                { id: 'barricade', count: 3 },
                                { id: 'shield_bash', count: 1 },
                                { id: 'liquify', count: 1 }
                            ]
                        }
                    ]
                }
            }
        }
    },

    // 카드 크기 설정
    cardSizes: {
        hand: { width: 120, height: 168 },       // 손패 카드 크기 (20% 확대)
        enlarged: { width: 550, height: 770 },   // 발동 시 확대 크기 (37.5% 증가)
        preview: { width: 290, height: 406 },    // 시작 카드 선택 크기 (적당한 크기)
        gallery: { width: 320, height: 448 },    // 카드 갤러리 전용 크기 (preview보다 약간 더 큼)
        large: { width: 580, height: 812 },      // 카드 디테일 모달 크기 (적당한 확대)
        victory: { width: 180, height: 252 },    // 승리 모달 보상 카드 크기 (50% 확대)
        victoryDetail: { width: 360, height: 504 }, // 승리 모달 확대 카드 크기 (260% 확대)
        defeatHand: { width: 120, height: 168 }  // 패배 모달 최종 손패 크기 (hand와 동일)
    },

    // 손패 레이아웃 설정
    handLayout: {
        rows: 2,                        // 두 줄 배치
        cardsPerRow: 5,                 // 줄당 최대 5장
        rowSpacing: 0.033,              // 줄 간격 (카드 높이의 3.3%)
        activationOrder: 'leftToRightTopToBottom', // 발동 순서: 왼쪽 위 → 오른쪽 → 아래줄
        cardSpacing: 5                  // 카드 간 간격
    },


    // 애니메이션 설정 - 마스터 타이밍 참조
    animations: {
        get cardActivation() { return GameConfig.masterTiming.cards.activation; },      // 카드 발동 시 표시 시간 (ms)
        get cardInterval() { return GameConfig.masterTiming.cards.interval; },        // 카드 간 발동 간격 (ms)
        get turnTransition() { return GameConfig.masterTiming.battle.turnTransition; },      // 턴 전환 시간 (ms)
        get damageDisplay() { return GameConfig.masterTiming.battle.damageDisplay; },       // 대미지 표시 시간 (ms)
        get statusEffectDisplay() { return GameConfig.masterTiming.battle.statusEffectDisplay; }  // 상태이상 표시 시간 (ms)
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
        '3x': 3.0,
        '4x': 4.0,   // 빠름
        '5x': 5.0,   // 매우빠름 - 카드 거의 즉시 사라지는 수준
        minTimingThreshold: 30,  // 최소 타이밍 임계값 (ms) - 초고속 지원
        maxSpeed: 7              // 최대 속도 배율 (초고속 지원)
    },

    // UI 위치 설정
    ui: {
        playerInfo: { x: 50, y: 750 },           // 플레이어 정보 위치
        enemyInfo: { x: 50, y: 50 },             // 적 정보 위치
        playerHand: { x: 375, y: 781 },          // 플레이어 손패 중앙 위치 (갭 아래쪽 + 카드영역높이/2)
        enemyHand: { x: 375, y: 419 },           // 적 손패 중앙 위치 (갭 위쪽 - 카드영역높이/2)
        cardActivation: { x: 375, y: 480 },      // 카드 발동 표시 위치 (화면 중앙)
        stageInfo: { x: 700, y: 750 },           // 스테이지 정보 위치
        enemyName: { x: 700, y: 50 },            // 적 이름 위치
        defenseBadge: {
            opacity: 0.85                        // 방어속성 배지 투명도 (85% 불투명)
        },
        handAreaBackground: {
            enabled: true,                       // 손패 영역 배경 활성화
            opacity: 0.15,                       // 배경 투명도 (15% 불투명 - 은은한 효과)
            gradientEnabled: true,               // 그라데이션 효과 사용
            gradientOpacity: {
                start: 0.05,                     // 그라데이션 시작 투명도
                end: 0.25                        // 그라데이션 끝 투명도
            },
            borderRadius: 10                     // 배경 모서리 둥글기
        },
        stageIndicator: {
            position: {
                top: 25                          // 상단에서 25px (기존 45px에서 올림)
            },
            size: {
                fontSize: 18,                    // 메인 폰트 크기 (모바일 한글/일본어 대응)
                iconSize: 18,                    // 아이콘 크기
                progressFontSize: 14,            // 진행도 점 크기
                padding: 14,                     // 내부 패딩
                minWidth: 180                    // 최소 너비
            }
        },
        galleryButton: {
            position: {
                bottom: 20                       // 하단에서 20px (기존 40px에서 내림)
            },
            size: {
                padding: {
                    vertical: 16,                // 세로 패딩 (기존 12px → 16px)
                    horizontal: 24               // 가로 패딩 (기존 20px → 24px)
                },
                fontSize: 18,                    // 폰트 크기 (기존 14px → 18px)
                fontWeight: 600,                 // 폰트 굵기
                borderRadius: 18,                // 모서리 둥글기 (기존 14px → 18px)
                minWidth: 140                    // 최소 너비
            }
        }
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
            color: '#000000',  // 완전한 검정
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
            type: { y: 0.41 },       // 상단에서 41% (약간 아래로)
            stats: { y: 0.90 },      // 하단에서 10% (설명과 겹치지 않도록 더 아래로)
            description: { y: 0.50 } // 상단에서 50% (카드 중앙, 타입과 간격 확보)
        },
        // 활성 카드 글로우 설정
        activeCardGlow: {
            color: '#FFFF00',                 // 네온 옐로우 (밝고 눈에 잘 띔)
            secondaryColor: '#FFD700',        // 골드 옐로우 (보조 글로우 색상)
            borderWidth: 10,                  // 매우 두꺼운 테두리 (6 → 10)
            glowRadius: 35,                   // 넓은 글로우 반경 (20 → 35, 주변 카드 많이 가림)
            glowIntensity: 1.2,               // 초강력 글로우 강도 (1.0 → 1.2)
            pulseSpeed: 2000,                 // 펄스 애니메이션 속도 (ms)
            fadeoutDuration: 800              // 잔상 페이드아웃 시간 (ms)
        },
        // 속성 라벨 설정
        elementLabel: {
            position: { x: 0.04, y: 0.08 },  // 카드 크기 대비 비율 (좌상단, 원래 위치로 복원)
            fontSize: 0.045,                  // 카드 높이 대비 폰트 크기
            padding: { x: 6, y: 3 },          // 라벨 내부 패딩 (원래 크기로 복원)
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
        // 속성 이모지 설정 (우상단)
        elementEmoji: {
            position: { x: 0.82, y: 0.06 },  // 카드 크기 대비 비율 (우상단)
            fontSize: 0.08,                   // 이모지는 더 크게
            padding: { x: 4, y: 4 },          // 작은 패딩
            backgroundOpacity: 0.9,           // 배경 투명도 (라벨과 동일)
            darkenFactor: 0.3,                // 속성색을 어둡게 하는 비율 (라벨과 동일)
            borderRadius: 50,                 // 원형
            textColor: '#fff',                // 텍스트 색상
            textOutline: {
                enabled: true,
                color: '#000',
                width: 1
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
        },
        // 카드 색상 설정 (활성화 상태 등)
        cardColors: {
            handHighlightFactor: 0.05,    // 손패 활성 카드 밝기 증가 비율 (5%로 감소)
            enlargedHighlight: false      // 확대 카드는 기본 색상 유지
        }
    },

    // 메인 메뉴 레이아웃 설정
    mainMenu: {
        title: {
            get size() { return GameConfig.masterFonts.uiSizes.mainMenuTitle; },                            // 제목 폰트 크기 (56 → 64)
            y: 180,                              // 제목 Y 위치 (280 → 180, 상단으로 이동)
            get shadowOffset() { return GameConfig.constants.pixels.shadowMedium; }                      // 그림자 오프셋
        },
        subtitle: {
            get size() { return GameConfig.masterFonts.uiSizes.mainMenuSubtitle; },                            // 부제목 폰트 크기 (20 → 24)
            offsetY: 90                          // 제목으로부터의 Y 오프셋 (120 → 90, 여백 축소)
        },
        versionDisplay: {
            get size() { return GameConfig.masterFonts.baseSizes.large; },                                     // 폰트 크기 (20px)
            offsetY: 150,                        // 제목으로부터의 Y 오프셋 (200 → 150, 여백 축소)
            get opacity() { return GameConfig.constants.opacity.mediumHigh; }                                   // 투명도 0.85 (더 진하게)
        },
        creditsDisplay: {
            get size() { return GameConfig.masterFonts.baseSizes.xlarge; },                                    // 폰트 크기 (24px)
            offsetY: -35,                        // 화면 하단으로부터의 오프셋 (적당한 여백 유지)
            get opacity() { return GameConfig.constants.opacity.mediumHigh; }                                   // 투명도 0.85 (더 진하게)
        },
        contactInfo: {
            enabled: true,                       // 연락처 정보 표시 여부
            email: 'contact.binboxgames@gmail.com', // 비즈니스 이메일
            position: {
                noticeOffsetY: 210,              // 안내 문구: 저작권 위 210px
                businessOffsetY: 45,             // 비즈니스 정보: 저작권 위 45px (레이블 위치 조정)
                lineSpacing: 30                  // 줄 간격
            },
            style: {
                noticeFontSize: 22,              // 안내 문구 폰트 크기 (16 → 22, 훨씬 크게)
                noticeMaxWidth: 500,             // 안내 문구 최대 너비 (자동 줄바꿈 기준, 700 → 500, 황금 비율)
                get labelFontSize() { return GameConfig.masterFonts.baseSizes.medium; },      // 레이블 폰트 크기 (18px)
                get emailFontSize() { return GameConfig.masterFonts.baseSizes.medium; },      // 이메일 폰트 크기 (18px)
                get opacity() { return GameConfig.constants.opacity.high; }                   // 투명도 0.9
            }
        },
        menuItems: {
            startY: 370,                         // 메뉴 시작 Y 위치 (420 → 370, 상향 이동)
            itemHeight: 80,                      // 메뉴 아이템 간격 (60 → 80)
            width: 380,                          // 메뉴 아이템 너비 (320 → 380)
            height: 65,                          // 메뉴 아이템 높이 (50 → 65)
            get iconSize() { return GameConfig.constants.pixels.iconLarge; },                        // 아이콘 크기 (28 → 32)
            textSize: {
                get normal() { return GameConfig.masterFonts.uiSizes.mainMenuNormal; },                      // 일반 텍스트 크기 (18 → 22)
                get selected() { return GameConfig.masterFonts.uiSizes.mainMenuSelected; }                     // 선택된 텍스트 크기 (20 → 24)
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
            get fontSize() { return GameConfig.masterFonts.baseSizes.small; }                         // 폰트 크기
        }
    },

    // 언어 선택기 설정
    languageSelector: {
        get fontSize() { return GameConfig.masterFonts.uiSizes.languageSelector; },                            // 폰트 크기 (22 → 26) - 더 큰 크기
        padding: {
            get vertical() { return GameConfig.constants.pixels.paddingLarge - 2; },                        // 세로 패딩 (12 → 14)
            get horizontal() { return GameConfig.constants.pixels.spacingLoose; }                       // 가로 패딩 (18 → 20)
        },
        get borderRadius() { return GameConfig.constants.pixels.radiusMedium; }                          // 모서리 둥글기
    },

    // 카드 선택 화면 설정
    cardSelection: {
        title: {
            y: 50,              // 제목 Y 위치
            get fontSize() { return GameConfig.masterFonts.uiSizes.cardSelectionTitle; },       // 제목 폰트 크기
            get shadowOffset() { return GameConfig.constants.pixels.shadowSmall; }     // 그림자 오프셋
        },
        progress: {
            y: 75,              // 진행상황 Y 위치
            get fontSize() { return GameConfig.masterFonts.uiSizes.cardSelectionProgress; }        // 진행상황 폰트 크기
        },
        instructions: {
            startY: 100,        // 안내 메시지 시작 Y 위치
            lineHeight: 18,     // 줄 간격
            get fontSize() { return GameConfig.masterFonts.uiSizes.cardSelectionInstructions; }        // 폰트 크기
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
            fontSize: 60,       // 폰트 크기 축소 (90 → 60)
            position: {
                // ⚠️ 중요: 메시지 표시 위치 (논리적 좌표, 스케일링 전 기준)
                //
                // 영역 판단 방식 (2025-01 근본 수정):
                // - BattleSystem이 metadata.isPlayerTarget 플래그를 직접 전달
                // - 좌표 계산 불필요 → 스케일링/transform 이슈 해결
                //
                // playerY/enemyY 값의 의미:
                // - playerY: 플레이어가 피격/회복 받을 때 메시지 표시 Y 위치 (하단 영역)
                // - enemyY: 적이 피격/회복 받을 때 메시지 표시 Y 위치 (상단 영역)
                //
                // 동작 원리:
                // 1. BattleSystem: target/user 정보를 isPlayerTarget 플래그로 변환
                // 2. EffectSystem: 플래그 기준으로 playerY/enemyY 선택
                // 3. 최종 위치: GameConfig.canvas.height * (playerY or enemyY)
                playerY: 0.75,  // 캔버스 높이의 75% 지점 (하단 영역, 900px)
                enemyY: 0.25,   // 캔버스 높이의 25% 지점 (상단 영역, 300px)
                randomX: 60,    // X축 랜덤 분산 범위 (-60 ~ +60px)
                randomY: 20     // Y축 랜덤 분산 범위 (-20 ~ +20px)
            },
            messageZones: {
                damage: {
                    xRange: [-80, 80],      // 중앙 존 약간 확대 (겹침 방지)
                    yRange: [-40, 40]       // Y 범위 2배 확대 (수직 공간 활용)
                },
                status: {
                    xRange: [-300, -120],   // 상태이상 메시지를 더 왼쪽으로 이동 (겹침 방지)
                    yRange: [-60, 60]       // Y 범위 3배 확대 (더 넓은 분산)
                },
                buff: {
                    xRange: [100, 200],     // 화면 안쪽으로 조정 (줄바꿈 방지)
                    yRange: [-60, 60]       // Y 범위 3배 확대 (더 넓은 분산)
                }
            },
            animation: {
                duration: 1200, // 애니메이션 지속 시간 (ms)
                readDelay: 500, // 메시지 읽기 대기시간 (ms) - 템플릿 기반 통합 관리
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
            },
            // z-index 우선순위 설정 (높을수록 위에 표시) - HP 바(1000)보다 높게 설정
            zIndexPriority: {
                damage: 1200,       // 실제 대미지 숫자 (최상위)
                status: 1100,       // 상태이상 메시지
                buff: 1100,         // 버프 메시지
                defense: 1100,      // 방어력 메시지
                heal: 1150,         // 회복 메시지 (대미지보다는 낮지만 다른 것보다 높게)
                default: 1100       // 기본값
            },
            // 메시지 위치 오프셋 설정 (픽셀 단위)
            positionOffset: {
                damageFromStatus: -40,  // 피격 데미지가 상태이상 메시지보다 위에 표시되도록 Y 오프셋
                statusDamageFromApplied: -80 // 상태이상 대미지가 상태이상 적용 메시지보다 위에 표시되도록 Y 오프셋
            },
            // 텍스트 화면 경계 여백 설정 (픽셀 단위) - 긴 메시지가 화면 밖으로 나가는 것 방지
            textMargins: {
                left: 20,   // 왼쪽 최소 여백
                right: 20   // 오른쪽 최소 여백
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
                { position: 0, color: '#6b3535' },
                { position: 0.5, color: '#7a3f42' },
                { position: 1, color: '#5a2d2d' }
            ]
        }
    },

    // UI 레이어 z-index 설정 (하드코딩 방지)
    zIndexLayers: {
        canvas: 1,               // 게임 캔버스
        uiElements: 10,          // 일반 UI 요소들 (HP바, 버튼)
        mainMenuButtons: 100,    // 메인메뉴 버튼
        volumeButton: 900,       // 인게임 볼륨 버튼
        volumeControls: 1500,    // 볼륨 팝업 패널 (카드 활성화보다 위)
        modals: 1000,            // 모달들
        cardActivation: 1200,    // 카드 발동 시 확대 이미지
        overlays: 2000,          // 일반 오버레이
        versionCheckOverlay: 9999  // 버전 체크 오버레이 (최상위, 로딩 화면 바로 아래)
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
        // 방어속성 배지 설정 (HP바 외부 위치)
        badge: {
            sizeMultiplier: 2.8,            // 기존 크기의 2.8배 (다시 키움)
            positions: {
                player: {
                    offsetY: 20,            // 손패 하단에서 위쪽 거리
                    placement: 'hand_bottom' // 손패 하단 기준
                },
                enemy: {
                    offsetY: 20,            // 손패 상단에서 아래쪽 거리
                    placement: 'hand_top'   // 손패 상단 기준
                }
            },
            styling: {
                minWidth: 62,               // CSS에서 사용하는 크기값들 (2.8배)
                height: 50,
                fontSize: 34,
                borderRadius: 8,            // 모서리가 둥근 사각형으로 변경
                borderWidth: 3,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
            }
        }
    },


    // 카드별 개별 설정 (끝없는 노력 카드)
    cardConfigs: {
        endlessEffort: {
            // 카드 기본 스탯
            stats: {
                power: 1,          // 힘 증가량
                accuracy: 80,      // 80% 발동률
                cost: 1,           // 에너지 비용
                activationCount: 1, // 발동 횟수
                usageLimit: 1      // 1회 제한
            },

            // 효과 설정
            effect: {
                type: 'buff',
                buffType: 'strength',
                value: 1,
                targetSelf: true
            },

            // UI 설정
            ui: {
                type: 'buff',
                element: 'normal',
                showUsageCount: true,
                usageIndicator: {
                    color: '#2ECC71',
                    emoji: '✓'
                }
            }
        }
    },

    // 카드 사용량 추적 시스템
    cardUsageTracking: {
        enabled: true,
        resetOnBattleStart: true,
        resetOnStageTransition: false, // 스테이지 간 사용량 유지
        ui: {
            showUsageIndicator: true,
            usedIndicatorColor: '#95A5A6',
            availableIndicatorColor: '#2ECC71'
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
        },

        // HP 바 및 효과 표시 개선
        hpBar: {
            height: 40,          // Increased from 30px
            fontSize: 24,        // Increased from 14px
            numberFontSize: 24   // New: HP number size
        },

        statusEffects: {
            iconSize: 36,        // Increased from 32px
            fontSize: 14,        // Increased from 11px
            columns: 2,          // Grid layout
            spacing: 8,          // Gap between icons
            verticalSpacing: 6,  // Gap between rows
            maxRows: 4           // Maximum 4 rows (8 effects)
        },

        buffs: {
            iconSize: 36,        // Match status effects
            fontSize: 14,        // Match status effects
            columns: 2,          // Grid layout
            spacing: 8,
            verticalSpacing: 6,
            maxRows: 4
        },

        // 턴 메시지 인디케이터 (항상 표시)
        turnIndicator: {
            message: {
                // 폰트 및 크기 설정
                fontSize: 56,               // 폰트 크기 (px) - 크고 명확하게
                minWidth: 300,              // 최소 너비 (px) - 두 줄 방지
                padding: 20,                // 내부 여백 (px)

                // 색상 설정
                get playerColor() { return GameConfig.masterColors.ui.success; },   // 플레이어 턴 (녹색)
                get enemyColor() { return GameConfig.masterColors.cardTypes.attack; },   // 적 턴 (빨강)

                // 텍스트 그림자 설정
                textShadow: {
                    offsetX: 3,
                    offsetY: 3,
                    blur: 6,
                    color: 'rgba(0, 0, 0, 0.8)'
                },

                // 전환 애니메이션 설정
                animationDuration: 0.6      // 전환 애니메이션 지속시간 (초)
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
    },

    // 카드 정렬 순서 설정 (확장성을 위한 설정)
    cardSorting: {
        // 속성 순서: 노멀 -> 불 -> 물 -> 전기 -> 독 -> 특수
        elementOrder: ['normal', 'fire', 'water', 'electric', 'poison', 'special'],

        // 타입 순서: 공격 -> 방어 -> 상태이상 -> 버프 -> 디버프 -> 특수
        typeOrder: ['attack', 'defense', 'status', 'buff', 'debuff', 'special']
    },

    // 카드 스탯 표시 시스템
    statDisplay: {
        emojiSpacing: '\u200A', // 이모지와 수치 사이 Hair-space (1px 상당) - 모든 카드 통일
        // 모든 카드에 동일 적용되는 스탯 위치 설정
        statPositions: {
            leftRatio: 0.05,    // 왼쪽 스탯을 카드 폭의 5% 위치에 배치 (더 왼쪽 가장자리에 가깝게)
            centerRatio: 0.47,  // 중앙 스탯을 47% 위치에 배치
            rightRatio: 0.95    // 오른쪽 스탯을 카드 폭의 95% 위치에 배치 (오른쪽 끝 근처)
        },
        definitions: [
            {
                key: 'power',
                emoji: '🗡️',
                format: (value, card) => {
                    // 회복 카드 중 퍼센트 표시가 필요한 카드들
                    if (card.type === 'heal' && (card.id === 'miracle_revival' || card.id === 'one_times_hundred')) {
                        return `${value}%`;
                    }
                    return value;
                },
                showCondition: (card, context) => {
                    // 상태이상 카드, 버프 카드, 특수 카드에서 주 스탯이 없는 경우 숨김 (회복 카드는 power:0이어도 표시)
                    if ((card.type === 'status' || card.type === 'buff' || card.type === 'special') && card.power === 0) return false;
                    return true;
                }
            },
            {
                key: 'activation',
                emoji: '🔄',
                format: (value, card) => {
                    // value는 이미 getDisplayStats에서 계산된 올바른 값 (런타임 버프 반영)
                    // 추가 처리 없이 그대로 반환
                    return value;
                }
            },
            {
                key: 'accuracy',
                emoji: '🎯',
                format: (value) => `${value}%`
            }
        ],
        // 카드 타입별 스탯 이모지 매핑
        typeStatEmojis: {
            attack: { power: '🗡️', accuracy: '🎯' },
            defense: { power: '🛡️', accuracy: '✅' },
            status: { power: '⏱️', accuracy: '✅' },
            buff: { power: '✨', accuracy: '✅' },
            debuff: { power: '⬇️', accuracy: '✅' },
            special: { power: '🔮', accuracy: '✅' },
            heal: { power: '✚', accuracy: '✅' }
        }
    },

    // 모달 크기 및 레이아웃 설정 - Configuration-Driven
    modals: {
        // 공통 모달 설정
        common: {
            overlay: 'rgba(0, 0, 0, 0.7)',
            backdropBlur: '8px',
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            padding: 30
        },

        // 카드 갤러리 모달 - 큰 카드들을 위한 넓은 공간
        cardGallery: {
            width: 720,      // 96% of 750px canvas width
            height: 1150,    // 96% of 1200px canvas height
            padding: 25,

            // 카드 갤러리 헤더 레이아웃
            header: {
                height: 80,             // 헤더 높이
                padding: {
                    vertical: 15,       // 상하 패딩
                    horizontal: 20      // 좌우 패딩
                }
            },

            // 카드 개수 표시 설정 (왼쪽)
            cardCount: {
                fontSize: 16,           // 폰트 크기 (20px → 16px, "105/105" 형태도 겹치지 않도록)
                fontWeight: 'bold',     // 폰트 굵기
                color: '#FFFFFF',       // 텍스트 색상
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' // 텍스트 그림자
            },

            // 속성 필터 설정 (오른쪽)
            filter: {
                // 속성 순서: 노멀 → 불 → 물 → 전기 → 독 → 특수
                elementOrder: ['normal', 'fire', 'water', 'electric', 'poison', 'special'],

                // 필터 버튼 크기 (터치 최적화)
                buttonSize: 72,         // 버튼 크기 (정사각형)
                gap: 14,                // 버튼 간격
                borderRadius: 12,       // 모서리 둥글기
                fontSize: 42,           // 이모지 폰트 크기

                // 기본 상태 스타일
                default: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                    opacity: 0.7
                },

                // 호버 상태 스타일
                hover: {
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    opacity: 1,
                    transform: 'scale(1.05)'
                },

                // 활성화 상태 스타일
                active: {
                    background: 'rgba(255, 215, 0, 0.3)',  // 금색 배경
                    border: '3px solid #FFD700',           // 금색 테두리
                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.8)', // 금색 글로우
                    opacity: 1,
                    transform: 'scale(1.1)'
                }
            }
        },

        // 카드 선택 모달 - 카드 선택을 위한 충분한 공간
        cardSelection: {
            width: 720,      // 96% of canvas width
            height: 1180,    // 98% of canvas height
            padding: 15,

            // 텍스트 폰트 크기 설정
            text: {
                title: 40,       // 제목 폰트 크기 (시작 카드 선택)
                instruction: 24  // 설명 텍스트 폰트 크기
            },

            // 카드 그리드 설정
            grid: {
                maxHeight: 900,  // 75vh(900px) → 더 많은 카드 표시 공간
                padding: {
                    top: 20,     // 40px → 20px (패딩 최적화)
                    bottom: 10,  // 20px → 10px
                    sides: 20    // 40px → 20px
                },
                gap: {
                    row: 20,     // 30px → 20px (수직 간격 줄임)
                    column: 120  // 카드 간 좌우 충분한 여백 확보
                }
            },

            // Footer 영역 설정
            footer: {
                padding: {
                    top: 15,     // 30px → 15px
                    bottom: 20,  // 40px → 20px
                    sides: 20    // 40px → 20px
                },
                marginTop: 15,   // 30px → 15px
                button: {
                    fontSize: 20,    // 버튼 폰트 크기
                    padding: {
                        vertical: 16,   // 세로 패딩
                        horizontal: 32  // 가로 패딩
                    }
                }
            }
        },

        // 플레이어 이름 입력 모달 - 간단한 입력을 위한 적당한 크기
        playerName: {
            topPosition: '15vh',  // 모바일 키보드 대응: 상단에서 15% 위치
            width: 550,      // 73% of canvas width
            height: 500,     // 42% of canvas height
            padding: 40
        },

        // 승리/패배 모달 - 결과 표시를 위한 충분한 공간
        battleResult: {
            width: 720,      // 96% of canvas width
            height: 1150,    // 96% of canvas height
            padding: 25
        },

        // 카드 상세 모달 - 카드 확대 표시
        cardDetail: {
            width: 720,      // 96% of canvas width
            height: 1000,    // 83% of canvas height (높이 증가)
            padding: 40
        },

        // 게임 튜토리얼 모달 - 게임 설명을 위한 충분한 공간
        gameTutorial: {
            width: 720,      // 96% of canvas width
            height: 1150,    // 96% of canvas height
            padding: 30
        },

        // 승리 모달 - 카드 보상 선택을 위한 충분한 공간 (반응형 제거)
        victory: {
            width: 800,      // 확장됨: 손패 5장이 스크롤 없이 표시되도록
            height: 1150,    // 96% of canvas height
            padding: 25
        },

        // 패배 모달 - 게임 통계 표시를 위한 충분한 공간
        defeat: {
            width: 720,      // 96% of canvas width
            height: 1150,    // 96% of canvas height
            padding: 25
        }
    },

    // 유틸리티 함수들
    utils: {
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

    // 손패 겹침 비율 계산 - handLayout 시스템 사용으로 레거시 함수
    getHandOverlapRatio: function(cardCount) {
        // handLayout 시스템을 사용하므로 항상 0 반환 (레거시 호환성)
        return 0;
    },

    // 속성별 방어 타입 계산 (손패에서 가장 많은 속성)
    calculateDefenseElement: function(cards) {
        if (!cards || cards.length === 0) return 'normal';

        const elementCounts = {};

        // 각 속성별 카드 개수 계산 (특수 카드는 제외)
        cards.forEach(card => {
            // 특수 카드는 방어속성 계산에서 제외
            if (card.element === 'special' || card.type === 'special') {
                return;
            }

            const element = card.element || 'normal';
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        });

        // normal 속성 카드 수 저장
        const normalCount = elementCounts['normal'] || 0;

        // non-normal 속성들만 필터링
        const nonNormalElements = Object.keys(elementCounts).filter(element => element !== 'normal');
        const nonNormalCounts = {};
        nonNormalElements.forEach(element => {
            nonNormalCounts[element] = elementCounts[element];
        });

        // 상쇄 처리: 같은 수를 가진 속성들 제거
        const countGroups = {};
        for (const [element, count] of Object.entries(nonNormalCounts)) {
            if (!countGroups[count]) countGroups[count] = [];
            countGroups[count].push(element);
        }

        const remainingElements = {};
        for (const [count, elements] of Object.entries(countGroups)) {
            if (elements.length === 1) {
                // 해당 카드 수를 가진 속성이 하나뿐이면 남김
                remainingElements[elements[0]] = parseInt(count);
            }
            // 2개 이상이면 모두 상쇄되어 제거
        }

        // 남은 속성 중 가장 많은 것 선택
        if (Object.keys(remainingElements).length === 0) {
            return 'normal'; // 모든 속성이 상쇄되었거나 속성 카드가 없음
        }

        let maxCount = 0;
        let defenseElement = 'normal';

        for (const [element, count] of Object.entries(remainingElements)) {
            if (count > maxCount) {
                maxCount = count;
                defenseElement = element;
            }
        }

        return defenseElement;
    },

    // 게임 속도 적용 (레거시 호환 - TimerManager 사용 권장)
    applyGameSpeed: function(baseTime, speedMultiplier = 1) {
        const adjusted = Math.round(baseTime / speedMultiplier);
        const threshold = GameConfig?.gameSpeed?.minTimingThreshold || 50;
        return Math.max(threshold, adjusted); // 최소 임계값 보장
    }

    // [IMMUNITY_REMOVAL] 2025-11-03: 속성별 면역 시스템 제거 (롤백 가능)
    // // 상태이상 면역 체크
    // isImmuneToStatus: function(defenseElement, statusType) {
    //     const element = GameConfig.elements[defenseElement];
    //     if (!element || !element.immunity) return false;
    //
    //     return element.immunity === statusType;
    // }
    },

    // 색상 시스템 - 모든 하드코딩된 색상을 중앙 관리
    colors: {
        // 기본 UI 색상
        ui: {
            primary: '#3498db',           // 기본 파란색
            primaryHover: '#f39c12',      // 호버 시 주황색
            secondary: '#2980b9',         // 어두운 파란색
            background: {
                gradient: {
                    start: '#2E4057',     // 어두운 블루
                    middle: '#48729B',    // 밝은 파란색
                    end: '#5D8AA8'        // 하늘색
                }
            },
            text: {
                primary: '#FFFFFF',       // 흰색 텍스트
                secondary: '#E0E0E0',     // 밝은 회색
                outline: '#000000',       // 검은색 외곽선
                disabled: '#888888'       // 비활성화 텍스트
            },
            selection: {
                selected: '#FFD700',      // 금색 선택됨
                hover: '#CCCCCC',         // 회색 호버
                border: '#666666'         // 기본 테두리
            }
        },

        // 게임 상태 색상
        status: {
            victory: '#2ECC71',           // 승리 초록색
            defeat: '#E74C3C',            // 패배 빨간색
            warning: '#F39C12',           // 경고 주황색
            info: '#3498DB',              // 정보 파란색
            neutral: '#95A5A6'            // 중성 회색
        },

        // 버프/디버프 색상
        effects: {
            buff: '#2ECC71',              // 버프 초록색
            debuff: '#E74C3C',            // 디버프 빨간색
            neutral: '#3498DB',           // 중성 효과 파란색
            poison: '#9B59B6',            // 독 보라색
            burn: '#FF6B6B',              // 화상 빨간색
            stun: '#F39C12'               // 기절 주황색
        },

        // 배경 및 오버레이
        overlay: {
            modal: 'rgba(0, 0, 0, 0.6)',  // 모달 배경
            tooltip: 'rgba(0, 0, 0, 0.8)', // 툴팁 배경
            glass: 'rgba(255, 255, 255, 0.15)' // 글래스모피즘
        },

        // 폴백 색상 (ColorUtils용)
        fallback: {
            default: '#666666',           // 기본 폴백
            text: '#FFFFFF',              // 텍스트 폴백
            outline: '#000000'            // 외곽선 폴백
        }
    },

    // 폰트 시스템 - 하드코딩된 폰트 설정 중앙 관리
    fonts: {
        families: {
            main: 'Arial, sans-serif',    // 기본 폰트
            title: 'Arial, sans-serif',   // 제목 폰트
            mono: 'monospace'             // 고정폭 폰트
        },
        sizes: {
            small: 12,                    // 작은 텍스트
            medium: 16,                   // 기본 텍스트
            large: 20,                    // 큰 텍스트
            xlarge: 24,                   // 매우 큰 텍스트
            title: 28,                    // 제목 크기
            huge: 32                      // 거대한 텍스트
        },
        weights: {
            normal: 'normal',
            bold: 'bold',
            bolder: '900'
        }
    },

    // 게임 로직 상수 - 하드코딩 제거
    gameRules: {
        enemy: {
            buffStartStage: 5,            // Enemy.js의 하드코딩된 5
            extraCardStage: 3,            // Enemy.js의 하드코딩된 3
            maxBuffStacks: 10             // 최대 버프 중첩
        },

        combat: {
            maxHandSize: 10,              // 최대 손패 크기
            defaultAccuracy: 100,         // 기본 명중률
            criticalChance: 0.1,          // 치명타 확률 10%
            elementAdvantage: 1.5,        // 상성 유리 배율
            elementDisadvantage: 0.5      // 상성 불리 배율
        },

        // 랜덤 범위 설정
        randomRanges: {
            // cardDatabase의 하드코딩된 랜덤 범위들
            basicDamage: { min: 3, max: 5 },      // Math.random() * 3 + 3
            enhancedDamage: { min: 2, max: 5 },   // Math.random() * 4 + 2
            statusChance: { base: 100 },          // Math.random() * 100

            // 새로운 확장 가능한 범위들
            heal: { min: 2, max: 4 },
            shield: { min: 1, max: 3 },
            buffDuration: { min: 2, max: 4 }
        },

        // 시작 카드 선택 설정
        initialAttackCards: [
            'heavy_strike',    // 세게치기 (노멀)
            'flame_throw',     // 불꽃던지기 (불)
            'bubble_strike',   // 거품타격 (물)
            'thunder_strike',  // 번개일격 (전기)
            'smog'             // 스모그 (독)
        ],

        // 유틸리티 메서드
        /**
         * 현재 정의된 마지막 스테이지 번호 반환 (확장 가능)
         * @returns {number} 마지막 스테이지 번호
         */
        getMaxStage() {
            const stages = Object.keys(GameConfig.enemy.stageConfigs).map(Number);
            return Math.max(...stages);
        }
    },

    // 카드 효과 시스템 설정 - 확장 가능한 구조
    cardEffects: {
        // 자해 데미지 처리 설정
        selfDamage: {
            // 타이밍 설정 - masterTiming 참조
            timing: {
                get preActivation() { return true; },                                          // 카드 효과 전 적용
                get animationDelay() { return GameConfig.masterTiming.cards.repeatDelay; },   // 자해 데미지 표시 시간 (300ms)
                get deathCheckDelay() { return GameConfig.masterTiming.cards.repeatDelay; }   // 사망 체크 대기 시간 (300ms)
            },

            // 시각적 설정 - masterColors 참조
            visual: {
                get showBeforeEffect() { return true; },                               // 효과 전 표시
                get damageColor() { return GameConfig.masterColors.statusEffects.burn; },    // 자해 데미지 색상 (화상색상)
                get textKey() { return 'auto_battle_card_game.ui.templates.self_damage'; }   // 다국어 키
            },

            // 자해 데미지 타입별 설정 (향후 확장용)
            types: {
                fixed: {
                    multiplier: 1.0                                 // 고정 데미지 배율
                },
                percent: {
                    basePercent: 10                                // 퍼센트 기본값 10%
                },
                conditional: {
                    healthThreshold: 0.5                           // 체력 임계값 50%
                }
            }
        },

        // 향후 다른 카드 효과 확장용
        damage: {
            timing: {
                get displayDuration() { return GameConfig.masterTiming.battle.damageDisplay; }
            }
        },

        statusEffect: {
            timing: {
                get displayDuration() { return GameConfig.masterTiming.battle.statusEffectDisplay; }
            }
        },

        // 가시갑옷 카드 설정
        thornArmor: {
            strengthGain: 2    // 힘 증가량
        },

        // 뇌진탕 카드 설정
        concussion: {
            stunChance: 25     // 기절 확률 (25%)
        },

        // 제세동기 카드 설정
        defibrillator: {
            stunChance: 100    // 기절 확률 (100%, 발동 시 확정)
        },

        // 웅크리기 카드 설정
        crouch: {
            defenseGain: 15    // 방어력 증가량
        },
        // 작열방패 카드 설정
        scorchedShield: {
            selfDamage: 3,     // 자해 데미지 3
            defenseGain: 13    // 방어력 13 획득
        },
        // 불굴의 장갑 카드 설정
        indomitableGauntlet: {
            selfDamage: 3,     // 자해 데미지 3
            strengthGain: 3    // 힘 증가량 3
        },
        // 맹독 변성 카드 설정
        poisonMutation: {
            multiplier: 2      // 중독 턴수 배율 (2배 = 현재 턴수만큼 추가)
        },
        // 연쇄 반응 카드 설정
        chainReaction: {
            propagationGain: 1,  // 연쇄 버프 획득량
            accuracy: 70         // 명중률 (70%)
        },
        poisonNeedle: {
            poisonNeedleGain: 1,  // 독침 버프 획득량 (턴수)
            accuracy: 80          // 명중률 (80%)
        },
        // 유황 온천 카드 설정
        sulfurSpring: {
            sulfurGain: 1,  // 유황 버프 획득량 (턴수)
            accuracy: 80    // 명중률 (80%)
        },
        // 액체 코팅 카드 설정
        liquidCoating: {
            coatingGain: 1,  // 코팅 버프 획득량 (턴수)
            accuracy: 80     // 명중률 (80%)
        },
        // 좋은 우비 카드 설정
        goodRaincoat: {
            raincoatGain: 1,  // 우비 버프 획득량 (스택)
            accuracy: 80      // 명중률 (80%)
        },
        // 액체화 카드 설정
        liquify: {
            healPercent: 10  // 잃은 체력의 회복 비율 (10%)
        },
        // 화약통 투척 카드 설정
        powderKeg: {
            damage: 10,        // 폭발 데미지
            burnTurnsExtended: 1  // 화상 연장 턴 수
        },
        // 기회의 냄새 카드 설정
        opportunityScent: {
            damagePerStack: 10    // 냄새 1당 불 속성 공격 대미지 +10
        },
        // 열풍 카드 설정
        hotWind: {
            selfDamage: 3      // 자해 데미지 3
        },
        // 쓰나미 카드 설정
        tsunami: {
            selfDamage: 15,    // 자해 데미지 15
            power: 15,         // 공격력 15
            wetChance: 100     // 젖음 확률 100%
        },
        // 맹독 폭발 카드 설정
        toxicBlast: {
            damagePerTurn: 1   // 중독 잔여 턴당 데미지
        },
        // 망각제 카드 설정
        oblivionDraught: {
            hitChance: 70,      // 명중률 70%
            oblivionChance: 100 // 명중 시 망각 적용 확률 100%
        },
        // 가스 흡수 카드 설정
        gasAbsorption: {
            healPerTurn: 1     // 중독 잔여 턴당 회복량
        },
        // 거울 반응 카드 설정
        mirrorReaction: {
            activationChance: 0.8   // 80% 발동률
        },
        // 회복의 샘 카드 설정
        healingSpring: {
            healAmount: 10    // 젖음 상태일 때 회복량
        },
        // 얼음깨기 카드 설정
        iceBreaker: {
            damagePercent: 25  // 적 최대 HP의 25% (고정 피해, 버프 무시)
        },
        // 물장구 카드 설정
        waterPlay: {
            wetChance: 100,   // 젖음 적용 확률 100% (프로젝트 규칙: xxxChance는 100%)
            duration: 1       // 지속 시간 1턴
        },
        // 상당한 질량 카드 설정
        massiveWeight: {
            hpPercent: 20,    // 현재 체력의 20%
            fixedTurns: 1     // 1턴 고정 지속
        },
        // 수분흡수 카드 설정
        moistureAbsorption: {
            baseHeal: 8,         // 기본 회복량 (스택당)
            wetMultiplier: 2,    // 젖음 상태일 때 배율
            fixedTurns: 1        // 1턴 고정 지속 (스테이지 내내 유지)
        },
        // 정화 카드 설정
        purification: {
            activationChance: 70,  // 70% 발동률
            messageKey: 'auto_battle_card_game.ui.templates.purification_success',
            noStatusKey: 'auto_battle_card_game.ui.templates.purification_no_status',
            visual: {
                effectColor: '#4ECDC4',  // 청록색 (정화 효과)
                particleCount: 20
            }
        },
        // 고압 전류 카드 설정
        highVoltageCurrent: {
            activationChance: 60,  // 60% 발동률 (밸런스 조정: 70% → 60%)
            successKey: 'auto_battle_card_game.ui.templates.high_voltage_current_success',
            noBuffsKey: 'auto_battle_card_game.ui.condition_failed'
        },
        // 빛의 속도 카드 설정
        lightSpeed: {
            activationBonus: 1,    // 발동 횟수 +1
            fixedTurns: 1          // 1턴 고정 지속
        },
        // 이관능성 방패 카드 설정
        bifunctionalShield: {
            healAmount: 3,         // 회복량
            defenseGain: 5,        // 방어력 증가량
            activationChance: 0.8  // 80% 발동률
        }
    },

    // 언어팩 폴백 시스템 - MainMenu.js의 하드코딩 제거
    fallbackTranslations: {
        'start-game': '게임 시작',
        'game-tutorial': '게임 설명',
        'card-gallery': '카드 갤러리',
        'back-to-main': '메인으로',
        'tutorial-line1': '공격카드 중 하나를 선택하여 게임을 시작하세요!',
        'tutorial-line2': '카드는 손패 왼쪽부터 자동으로 발동됩니다!',
        'tutorial-line3': '각 스테이지 클리어 시 랜덤으로 등장하는 세개의 카드 중에 하나를 선택하여 손패 왼쪽에 가져옵니다!',
        'tutorial-line4': '최대 손패 카드는 10장입니다! 스테이지 클리어시 카드를 선택하여 추가, 손패의 카드와 교체, 다음 스테이지로 스킵 중에 선택 가능합니다!',
        'tutorial-line5': '몇 스테이지까지 갈 수 있을까요! 당신의 운을 시험해보세요!',

        // 자해 데미지 관련 메시지
        'auto_battle_card_game.ui.templates.self_damage': '자신에게 {damage} 데미지!'
    },

    // CSS 변수 확장 설정
    cssVariables: {
        spacing: {
            small: 8,
            medium: 16,
            large: 24,
            xlarge: 32
        },
        borderRadius: {
            small: 4,
            medium: 8,
            large: 16,
            xlarge: 24
        },
        shadows: {
            small: '0 2px 4px rgba(0, 0, 0, 0.1)',
            medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
            large: '0 8px 16px rgba(0, 0, 0, 0.2)',
            glow: '0 0 10px rgba(255, 255, 255, 0.3)'
        },
        blur: {
            small: 5,
            medium: 10,
            large: 15
        },
        cardGrid: {
            gap: 10,              // 카드 간 간격 (최적화된 10px)
            columns: 2,           // 그리드 열 개수
            padding: '20px 15px'  // 그리드 패딩
        },
        effects: {
            spacing: 8,           // 버프/상태이상 가로 간격
            verticalSpacing: 6,   // 버프/상태이상 세로 간격
            columns: 2,           // 그리드 열 개수
            fontSize: 14,         // 라벨 폰트 크기
            iconSize: 36          // 라벨 최소 크기
        }
    },

    // 버프/상태이상 툴팁 모달 설정 (Configuration-Driven)
    tooltipModal: {
        // 모달 크기 및 스타일
        modal: {
            maxWidth: 600,  // 550px → 600px로 확대
            padding: 24,
            get borderRadius() { return GameConfig.constants.pixels.radiusLarge; },
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            get borderColor() { return GameConfig.masterColors.ui.accent; },
            borderWidth: 2
        },

        // 헤더 스타일 (이모지 + 이름)
        header: {
            get fontSize() { return GameConfig.masterFonts.baseSizes.xlarge; },
            emojiSize: 32,
            spacing: 8
        },

        // 설명 텍스트 스타일
        description: {
            fontSize: 17,
            lineHeight: 1.5,
            color: '#FFFFFF'
        },

        // 애니메이션
        animation: {
            fadeIn: 150,
            fadeOut: 100
        }
    },

    // 오디오 시스템 설정 (Configuration-Driven)
    audio: {
        // 기본 경로
        basePath: 'assets/audio/',

        // BGM 파일 경로 (하드코딩 금지 - 단일 진실의 원천)
        bgm: {
            mainMenu: 'bgm/bgm_main_menu.mp3',
            cardGallery: 'bgm/bgm_card_gallery.mp3',
            normalBattle: 'bgm/bgm_normal_battle.mp3',
            victoryModal: 'bgm/bgm_victory_modal.mp3',
            gameOver: 'bgm/bgm_game_over.mp3',
            bossBattle: 'bgm/bgm_boss_battle.mp3'
        },

        // SFX 파일 경로 (Configuration-Driven)
        sfx: {
            // 공격 사운드
            attackCritical: 'sfx/snd_attack_critical.mp3',
            attackHit: 'sfx/snd_attack_hit.mp3',
            attackWeak: 'sfx/snd_attack_weak.mp3',
            miss: 'sfx/snd_miss.mp3',

            // 속성별 공격 효과음
            attackElectric: 'sfx/snd_attack_effect_electric.mp3',
            attackFire: 'sfx/snd_attack_effect_fire.mp3',
            attackPoison: 'sfx/snd_attack_effect_poison.mp3',
            attackWater: 'sfx/snd_attack_effect_water.mp3',

            // 방어/버프/상태이상
            defenseGain: 'sfx/snd_deffense_gain.mp3',
            buffGain: 'sfx/snd_buff_gain.mp3',
            statusGain: 'sfx/snd_status_gain.mp3',
            statusBlocked: 'sfx/snd_status_blocked.mp3',
            cleansed: 'sfx/snd_cleansed.mp3',
            heal: 'sfx/snd_heal.mp3',

            // 카드 획득 (랜덤 재생용)
            cardGet1: 'sfx/snd_card_get_1.mp3',
            cardGet2: 'sfx/snd_card_get_2.mp3',
            cardGet3: 'sfx/snd_card_get_3.mp3',
            cardGet4: 'sfx/snd_card_get_4.mp3',

            // UI 사운드
            click: 'sfx/snd_click.mp3',
            cardClick: 'sfx/snd_click.mp3',  // 카드 클릭 사운드 (현재는 click과 동일, 추후 교체 가능)
            failed: 'sfx/snd_failed.mp3',
            nameModal: 'sfx/snd_name_modal.mp3',
            victoryModal: 'sfx/snd_victory_modal.mp3',
            gameOver: 'sfx/snd_game_over.mp3'
        },

        // 볼륨 설정 (0.0 ~ 1.0)
        volume: {
            master: 1.0,   // 마스터 볼륨
            bgm: 0.6,      // BGM 볼륨
            sfx: 0.8       // SFX 볼륨
        },

        // 볼륨 커브 설정 (인지 개선 - 로그 스케일 시뮬레이션)
        volumeCurve: {
            enabled: true,     // 볼륨 커브 적용 여부 (false = 선형)
            exponent: 2.0      // 제곱 지수 (2.0 = 제곱, 2.5 = 더 강한 커브, 1.0 = 선형)
            // 예시: 90% → 81%, 80% → 64%, 50% → 25% (exponent=2.0)
            // 인간의 청각은 로그 스케일이므로 제곱 적용 시 체감 차이 증가
        },

        // 페이드 효과 타이밍 (ms)
        fade: {
            duration: 300,       // 일반 페이드 인/아웃 시간 (빠른 전환)
            crossfade: 500       // BGM 크로스 페이드 시간 (빠른 전환)
        },

        // UI 이벤트별 SFX 매핑 (하드코딩 방지)
        uiSounds: {
            buttonClick: 'click',           // 모든 버튼 클릭 시 재생
            cardGalleryClick: 'cardClick',  // 갤러리 카드 클릭
            cardSelectionClick: 'cardClick', // 시작 카드 선택 클릭
            rewardCardClick: 'cardClick',   // 보상 카드 클릭
            handCardClick: 'cardClick',     // 손패 카드 클릭 (교체 모드)
            failed: 'failed',               // 실패/오류 시
            nameModal: 'nameModal',         // 이름 입력 모달
            victoryModal: 'victoryModal',   // 승리 모달
            gameOver: 'gameOver'            // 게임 오버
        },

        // 게임 상태별 예상 BGM 매핑 (BGM 복원 검증용)
        stateBGMMapping: {
            'menu': 'mainMenu',                          // 메인 메뉴
            'battle': ['normalBattle', 'bossBattle'],    // 전투 중 (일반/보스)
            'gameOver': ['gameOver', 'victoryModal']     // 게임 종료 (패배/승리)
        },

        // 보스 스테이지 판정 규칙
        bossStage: {
            interval: 10  // 10의 배수마다 보스 스테이지
        },

        // 로딩 설정
        loading: {
            showProgress: true,     // 로딩 진행률 표시 여부
            minimumLoadTime: 500    // 최소 로딩 화면 표시 시간 (ms) - 너무 빠르게 사라지지 않도록
        },

        // 전투 사운드 매핑 (Configuration-Driven)
        battleSounds: {
            // 데미지 타입별 SFX (effectiveness 기반)
            damage: {
                critical: 'attackCritical',  // 1.5배 (강점)
                normal: 'attackHit',          // 1.0배 (일반)
                weak: 'attackWeak'            // 0.5배 (약점)
            },

            // 속성별 플래시 SFX
            elementFlash: {
                fire: 'attackFire',
                poison: 'attackPoison',
                electric: 'attackElectric',
                water: 'attackWater',
                normal: null  // 노멀 속성은 사운드 없음
            },

            // 버프/상태 SFX
            effects: {
                buffGain: 'buffGain',
                defenseGain: 'defenseGain'
            },

            // 카드 획득 SFX (랜덤 풀)
            cardAcquisition: ['cardGet1', 'cardGet2', 'cardGet3', 'cardGet4'],

            // 메시지 효과 SFX
            messageEffects: {
                miss: 'miss',
                heal: 'heal',
                failed: 'failed',
                statusGain: 'statusGain',
                statusBlocked: 'statusBlocked',
                cleansed: 'cleansed'
            },

            // 모달 사운드
            modalSounds: {
                victory: 'victoryModal',
                gameOver: 'gameOver'
            }
        },

        // 백그라운드 동작 설정 (Configuration-Driven)
        background: {
            pauseOnBackground: true      // 백그라운드로 전환 시 BGM 자동 일시정지 (배터리 절약)
            // 참고: 모바일에서 유튜브 등 백그라운드 오디오와 충돌 방지는 마스터 볼륨 0%로 게임 음소거
        }
    },

    // 공유 시스템 설정 (SNS 공유, URL 생성 등)
    sharing: {
        enabled: true,                          // 공유 기능 활성화

        // 기본 URL 설정
        baseUrl: 'https://binboxgames.com/games/card-battle-game/',  // 기본 공유 URL
        useSimpleUrl: false,                    // 단순 URL 사용 (파라미터 제거) - 랜딩 페이지 모드에서는 false

        // 랜딩 페이지 설정
        landingPage: {
            enabled: true,                      // 랜딩 페이지 기능 활성화
            imageMaxWidth: 800,                 // 랜딩 페이지 이미지 최대 너비 (px) - deprecated, dimensions 사용
            showGameInfo: true,                 // 게임 정보 표시 여부

            // 랜딩 페이지 캔버스 크기 (고해상도, 표시할 때 600px로 축소)
            dimensions: {
                width: 1200,                    // 2배 크기 (표시: 600px)
                height: 1000,                   // 컴팩트 (타이틀 + 카드 2행 + footer)
                cardWidth: 230,                 // 큰 카드 (표시: 115px)
                cardHeight: 322                 // 5:7 비율 유지 (230 × 1.4)
            },

            // 랜딩 페이지 레이아웃
            layout: {
                rows: 2,                        // 최대 행 수
                cardsPerRow: 5,                 // 행당 최대 카드 수
                cardSpacing: 5,                 // 카드 간 좌우 간격 (px)
                rowSpacing: 20                  // 행 간 최소 간격
            }
        },

        // 플랫폼별 설정
        platforms: {
            // Native Share API (모바일 우선)
            native: {
                enabled: true,                  // Native Share API 활성화
                mobileOnly: true,               // 모바일에서만 표시 (PC는 플랫폼 버튼 사용)
                title: 'Card Battle Game',      // 기본 공유 제목
                fallbackToClipboard: true       // Native Share 지원 안 되면 URL 복사
            },

            // Twitter/X 공유
            twitter: {
                enabled: true,                  // Twitter 공유 활성화
                baseUrl: 'https://twitter.com/intent/tweet',
                hashtags: ['CardBattleGame', 'IndieGame', 'BrowserGame'],  // 해시태그 (자동 추가)
                via: '',                        // 트위터 계정 (비어있으면 생략)
                related: ''                     // 관련 계정 (비어있으면 생략)
            },

            // Facebook 공유
            facebook: {
                enabled: true,                  // Facebook 공유 활성화
                baseUrl: 'https://www.facebook.com/sharer/sharer.php',
                appId: ''                       // Facebook App ID (선택, Open Graph에 필요)
            },

            // Discord 공유 (향후 확장용)
            discord: {
                enabled: false,                 // Discord 공유 비활성화 (Phase 2)
                webhookUrl: ''                  // Discord Webhook URL
            },

            // URL 복사 (Clipboard API)
            clipboard: {
                enabled: true,                  // 클립보드 복사 활성화
                showToast: true,                // 복사 완료 토스트 메시지 표시
                toastDuration: 2000             // 토스트 표시 시간 (ms)
            }
        },

        // 메시지 템플릿 (다국어 지원)
        messageTemplates: {
            // 승리 모달 (스테이지 클리어)
            victory: {
                ko: '🎉 스테이지 {stage} 클리어!\n{element} 속성 덱으로 돌파했어요!\n\n당신도 도전해보세요! 👇',
                en: '🎉 Stage {stage} Cleared!\n{element} element deck victory!\n\nTry it yourself! 👇',
                ja: '🎉 ステージ {stage} クリア!\n{element} 属性デッキで突破!\n\nあなたも挑戦してみて! 👇'
            },

            // 패배 모달 (게임 오버)
            defeat: {
                ko: '⚔️ 스테이지 {stage}까지 도달!\n플레이 스타일: {style}\n총 대미지: {damage}\n\n나보다 더 갈 수 있어? 👇',
                en: '⚔️ Reached Stage {stage}!\nPlay Style: {style}\nTotal Damage: {damage}\n\nCan you beat my record? 👇',
                ja: '⚔️ ステージ {stage} まで到達!\nプレイスタイル: {style}\n総ダメージ: {damage}\n\n私より進める? 👇'
            },

            // 게임 클리어 모달 (60 스테이지 완료)
            complete: {
                ko: '🏆 게임 클리어! (60/60)\n총 턴 수: {turns}\n플레이 스타일: {style}\n\n당신도 완주에 도전해보세요! 👇',
                en: '🏆 Game Complete! (60/60)\nTotal Turns: {turns}\nPlay Style: {style}\n\nYour turn to complete it! 👇',
                ja: '🏆 ゲームクリア! (60/60)\n総ターン数: {turns}\nプレイスタイル: {style}\n\nあなたも挑戦してみて! 👇'
            },

            // 배틀 중 공유 (인게임 전투 상황)
            battle: {
                ko: '⚔️ 스테이지 {stage} 도전 중!\n{element} 속성 덱으로 전투 중!\n\n나와 함께 도전해보세요! 👇',
                en: '⚔️ Challenging Stage {stage}!\nBattling with {element} deck!\n\nJoin the challenge! 👇',
                ja: '⚔️ ステージ {stage} 挑戦中!\n{element} 属性デッキで戦闘中!\n\n一緒に挑戦しよう! 👇'
            }
        },

        // URL 파라미터 설정
        urlParams: {
            enabled: true,                      // URL 파라미터 활성화
            compress: true,                     // Base64 압축 사용 (긴 URL 방지)
            maxLength: 2000,                    // URL 최대 길이 (브라우저 제한)
            paramNames: {
                share: 's',                     // 공유 타입 (victory/defeat/complete)
                stage: 'st',                    // 스테이지 번호
                player: 'p',                    // 플레이어 이름
                element: 'e',                   // 속성
                deck: 'd',                      // 덱 구성 (카드 ID 리스트)
                style: 'ps',                    // 플레이 스타일
                damage: 'dm',                   // 총 대미지
                turns: 't'                      // 총 턴 수
            }
        },

        // 게임 메타데이터 (단일 진실의 원천)
        metadata: {
            game: {
                // 게임 기본 정보 (상수)
                totalStages: 60,                // 총 스테이지 수
                elementCount: 5,                // 속성 개수
                genre: 'strategy',              // 장르

                // i18n 키 참조 (다국어 지원)
                titleKey: 'auto_battle_card_game.title',              // 짧은 제목
                subtitleKey: 'auto_battle_card_game.subtitle',        // 부제목
                fullTitleKey: 'auto_battle_card_game.full_title',     // 전체 제목 (제목 - 부제목)
                descriptionKey: 'auto_battle_card_game.og_description' // SNS 설명
            }
        },

        // Open Graph 메타태그 설정 (SNS 미리보기)
        openGraph: {
            enabled: true,                      // Open Graph 활성화
            defaultImage: '/images/og-default.png',  // 기본 이미지
            dynamicImage: true,                 // 동적 이미지 생성 활성화
            siteName: 'BinBox Games',           // 사이트 이름
            type: 'website'                     // Open Graph 타입
            // 제목/설명은 metadata.game의 i18n 키 사용
        },

        // 이미지 생성 설정 (Canvas 기반)
        imageGeneration: {
            enabled: true,                      // 이미지 생성 활성화

            // 이미지 크기 (SNS 최적화)
            dimensions: {
                width: 1200,                    // 너비 (px) - SNS 권장 크기
                height: 630,                    // 높이 (px) - SNS 권장 비율 (1.91:1)
                cardWidth: 150,                 // 카드 너비
                cardHeight: 210                 // 카드 높이
            },

            // 이미지 품질 설정
            quality: 0.85,                      // JPEG 품질 (0.0 ~ 1.0)
            format: 'png',                      // 이미지 포맷 ('png' or 'jpeg')
            backgroundColor: '#1a1a2e',         // 기본 배경색

            // 레이아웃별 설정
            layouts: {
                // 손패 공유 (10장, 2행 레이아웃)
                hand: {
                    enabled: true,
                    maxCards: 10,               // 최대 카드 수 (2행 지원)
                    rows: 2,                    // 최대 행 수
                    cardsPerRow: 5,             // 행당 최대 카드 수
                    cardSpacing: 0,             // 여백 없이 붙어있게
                    rowSpacing: 20,             // 행 간 최소 간격
                    showOverlay: true,          // 스테이지/HP 오버레이 표시
                    titleY: 80,                 // 타이틀 Y 위치
                    subtitleY: 150,             // 서브타이틀(스테이지) Y 위치
                    cardStartY: 250,            // 카드 시작 Y 위치 (여유 있게)
                    title: {
                        fontSize: 64,           // 큰 폰트
                        fontWeight: 'bold',
                        color: '#ffffff'
                    }
                },

                // 승리 공유 (hand와 동일)
                victory: {
                    enabled: true,
                    maxCards: 10,               // hand와 동일
                    rows: 2,
                    cardsPerRow: 5,
                    cardSpacing: 0,             // 여백 없이
                    rowSpacing: 20,
                    showBadge: true,            // 승리 뱃지 표시
                    badgeText: '🎉 CLEAR!'
                },

                // 패배 공유 (hand와 동일)
                defeat: {
                    enabled: true,
                    maxCards: 10,               // hand와 동일
                    rows: 2,
                    cardsPerRow: 5,
                    cardSpacing: 0,             // 여백 없이
                    rowSpacing: 20,
                    showStats: false,           // 통계 정보 표시 안함 (카드와 겹침 방지)
                    statsOpacity: 0.9
                },

                // 덱 전체 공유 (hand와 동일)
                deck: {
                    enabled: true,
                    maxCards: 10,               // hand와 동일
                    rows: 2,
                    cardsPerRow: 5,
                    cardSpacing: 0,             // 여백 없이
                    rowSpacing: 20,
                    showElement: true           // 속성 표시
                }
            },

            // 속성별 배경 그라디언트
            elementBackgrounds: {
                fire: {
                    start: '#ff6b6b',
                    end: '#ee5a24'
                },
                water: {
                    start: '#4facfe',
                    end: '#00f2fe'
                },
                electric: {
                    start: '#f9d423',
                    end: '#ff4e50'
                },
                poison: {
                    start: '#8e44ad',
                    end: '#c0392b'
                },
                normal: {
                    start: '#bdc3c7',
                    end: '#7f8c8d'
                }
            },

            // 오버레이 설정
            overlay: {
                padding: 30,                    // 오버레이 패딩
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                textColor: '#ffffff',
                fontSize: {
                    title: 36,
                    subtitle: 24,
                    info: 40                    // Footer 텍스트 크기 (크게 키움)
                },
                footerHeight: 80                // Footer 영역 높이 (큰 텍스트 수용)
            },

            // 로딩 설정
            loading: {
                showIndicator: true,            // 로딩 표시
                message: 'Generating image...',  // 로딩 메시지
                timeout: 10000                  // 타임아웃 (ms)
            },

            // Footer 텍스트 설정 (타입별 다국어)
            footerTexts: {
                hand: {
                    ko: 'binboxgames.com',
                    en: 'binboxgames.com',
                    ja: 'binboxgames.com'
                },
                victory: {
                    ko: '당신도 도전해보세요! → binboxgames.com',
                    en: 'Try it yourself! → binboxgames.com',
                    ja: 'あなたも挑戦してみて! → binboxgames.com'
                },
                defeat: {
                    ko: '나보다 더 갈 수 있어?',
                    en: 'Can you beat my record?',
                    ja: '私より進める?'
                },
                deck: {
                    ko: 'binboxgames.com/games/card-battle-game',
                    en: 'binboxgames.com/games/card-battle-game',
                    ja: 'binboxgames.com/games/card-battle-game'
                }
            },

            // Badge 색상 설정
            badgeColor: '#FFD700',              // Gold 색상 (승리 뱃지)
            badgeShadowColor: 'rgba(0, 0, 0, 0.8)',
            badgeShadowBlur: 15
        },

        // 공유 통계 (향후 확장용)
        analytics: {
            enabled: false,                     // 통계 추적 비활성화 (Phase 2)
            trackPlatform: false,               // 플랫폼별 공유 추적
            trackSuccess: false                 // 공유 성공/실패 추적
        }
    },

    // SEO 설정 (다국어 검색 엔진 최적화)
    seo: {
        baseURL: 'https://binboxgames.com/games/card-battle-game/',
        supportedLanguages: ['ko', 'en', 'ja'],
        defaultLanguage: 'ko',
        hreflangXDefault: 'en',     // 기본 fallback 언어

        /**
         * Get all hreflang URLs for SEO
         * @returns {Array<{lang: string, url: string}>}
         */
        getHreflangURLs() {
            return this.supportedLanguages.map(lang => ({
                lang,
                url: `${this.baseURL}?lang=${lang}`
            }));
        },

        /**
         * Get canonical URL for current language
         * @param {string} lang - Language code
         * @returns {string}
         */
        getCanonicalURL(lang) {
            return `${this.baseURL}?lang=${lang || this.defaultLanguage}`;
        },

        /**
         * Validate language code
         * @param {string} lang - Language code to validate
         * @returns {boolean}
         */
        isValidLanguage(lang) {
            return this.supportedLanguages.includes(lang);
        }
    },

    // 글로벌 리더보드 설정
    leaderboard: {
        enabled: true,
        supabaseUrl: 'https://yexxudclxvqmwbjjpxsx.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleHh1ZGNseHZxbXdiampweHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MjY3MjMsImV4cCI6MjA3ODQwMjcyM30.BLkbIxPiLG-86Smh14FAkxGYtFTzsl2cfqIXV97cFqM',
        tableName: 'leaderboard',
        pageSize: 20,                       // 한 페이지당 표시할 기록 수
        submitCooldown: 3000,               // 제출 쿨다운 (3초)
        maxRank: 3000000,                   // 최대 순위 (300만 위까지 유지)
        autoCleanupDays: 30,                // 자동 정리 기간 (30일)
        topRecordsToKeep: 100,              // 영구 보존할 상위 기록 수

        // 초기화 재시도 설정 (카카오톡 브라우저 등 SDK 로딩 지연 대응)
        initRetries: 3,                     // 최대 재시도 횟수
        retryDelay: 1000,                   // 재시도 간격 (밀리초)

        // API 호출 재시도 설정 (Supabase pause 해제 등 네트워크 실패 대응)
        apiRetry: {
            maxRetries: 2,                  // 최대 재시도 횟수
            retryDelay: 2000,               // 재시도 간격 (밀리초)
        },

        // 디버깅 모드 (문제 발생 시 활성화)
        debugMode: {
            enabled: false,                 // 디버깅 로그 활성화 (배포 시 false)
            showBrowserInfo: true,          // 브라우저 정보 표시
            showErrorLogs: true,            // 에러 로그 표시
            logNetworkRequests: false       // 네트워크 요청 로깅 (성능 영향)
        },

        // 페이지네이션 설정
        pagination: {
            jumpSize: 10                    // 10페이지 단위 이동
        },

        // 손패 보기 기능
        enableHandView: true,               // 리더보드에서 손패 보기 기능 활성화

        // 순위 축약 표시 설정
        rankAbbreviation: {
            thousands: 1000,                // k 단위 (1,000+)
            millions: 1000000,              // m 단위 (1,000,000+)
            billions: 1000000000,           // b 단위 (1,000,000,000+)
            decimalPlaces: 2                // 소수점 자리수
        },

        // 로컬 스토리지 키
        lastSubmitKey: 'leaderboard_last_submit_time',

        // 자동 버전 업데이트 체크 (Configuration-Driven)
        versionCheck: {
            enabled: true,                      // 버전 체크 활성화 여부
            tableName: 'app_version',           // Supabase 테이블명
            checkOnLoad: true,                  // 페이지 로드 시 체크
            checkOnNewGame: true,               // 새 게임 시작 시 체크
            checkOnContinue: true               // 이어서하기 시 체크
        }
    },

    // ========== 헬퍼 메서드 (Configuration-Driven 중앙화) ==========
    // 하드코딩 배열 중복 제거: 단일 진실의 원천(Single Source of Truth)

    /**
     * 카드 명중률에 영향을 주는 상태이상 타입 목록 반환
     * 복합 적용 시 순서 중요: sand(-30%) + frozen(-50%) = 80% → 56% → 28% (순차 곱셈)
     * @returns {string[]} 상태이상 타입 배열 (적용 순서 유지)
     */
    getAccuracyAffectingStatusEffects() {
        // 순서 유지 필수: 곱셈 순서가 최종 결과에 영향
        // 동적 생성 대신 정적 배열 사용 (성능 + 순서 보장)
        return ['sand', 'insult', 'slow', 'frozen', 'stench'];
    },

    /**
     * 턴 기반 상태이상 타입 목록 반환 (즉시 해제 제외)
     * 사용처: 지속감염(prolonged_infection), 호흡조절(breath_control) 카드
     * @returns {string[]} 턴 기반 상태이상 배열
     */
    getTurnBasedStatusEffects() {
        // 즉시 해제 상태이상(taunt, stun, frozen, oblivion) 제외
        return ['burn', 'poisoned', 'wet', 'paralysis', 'sand', 'insult', 'slow', 'chains', 'phase', 'stench'];
    },

    /**
     * 즉시 해제 상태이상 타입 목록 반환
     * 사용처: HPBarSystem - 턴수 표시 숨김 처리
     * @returns {string[]} 즉시 해제 상태이상 배열
     */
    getInstantReleaseStatusEffects() {
        // 턴수를 화면에 표시하지 않는 상태이상
        return ['frozen', 'stun', 'taunt', 'oblivion'];
    },

    /**
     * 모든 버프 관련 Player 변수명 목록 반환
     * 사용처: Player.clearBuffs() - 동적 초기화
     * @returns {string[]} 버프 변수명 배열
     */
    getAllBuffVariableNames() {
        // Player 클래스에 정의된 모든 버프 관련 변수명
        // 새 버프 추가 시 이 배열에만 추가하면 clearBuffs() 자동 반영
        return [
            'strength',
            'enhanceTurns',
            'focusTurns',
            'speedBonus', 'speedTurns',
            'scentBonus', 'scentTurns',
            'hotWindTurns',
            'lithiumTurns',
            'breathTurns',
            'massBonus', 'massTurns',
            'torrentBonus', 'torrentTurns',
            'propagationBonus', 'propagationTurns',
            'absorptionBonus', 'absorptionTurns',
            'lightSpeedBonus', 'lightSpeedTurns',
            'superConductivityTurns',
            'staticTurns',
            'packBonus', 'packTurns',
            'poisonNeedleTurns',
            'sharpenTurns',
            'mindTurns',
            'sulfurTurns',
            'coatingTurns',
            'raincoatStacks'
        ];
    }
};

// 전역 객체로 등록
window.GameConfig = GameConfig;

// GameConfig 로드 검증 로그 (조건부)
if (GameConfig?.debugMode?.showSystemInitialization) {
    console.log('[GameConfig] Loaded successfully');
    console.log('[GameConfig] Audio section:', GameConfig.audio ? '✅ Exists' : '❌ Missing');
    if (GameConfig.audio) {
        const bgmCount = Object.keys(GameConfig.audio.bgm || {}).length;
        const sfxCount = Object.keys(GameConfig.audio.sfx || {}).length;
        console.log(`[GameConfig] Audio files configured: ${bgmCount} BGM + ${sfxCount} SFX = ${bgmCount + sfxCount} total`);
        console.log('[GameConfig] BGM keys:', Object.keys(GameConfig.audio.bgm || {}));
    }
}