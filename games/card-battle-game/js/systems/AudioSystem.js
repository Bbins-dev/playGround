/**
 * AudioSystem.js
 * Configuration-Driven 오디오 시스템
 *
 * 핵심 기능:
 * - BGM 스택 관리 (이전 BGM 자동 복원)
 * - 페이드 인/아웃 효과
 * - 오디오 프리로딩
 * - 볼륨 조절
 * - 스테이지별 BGM 자동 선택
 *
 * 설계 원칙:
 * - 모든 경로는 GameConfig.audio에서 관리 (하드코딩 금지)
 * - Optional Chaining으로 안전한 접근
 * - 에러 처리 및 폴백
 */

class AudioSystem {
    constructor() {
        // 현재 재생 중인 BGM
        this.currentBGM = null;
        this.currentBGMKey = null;

        // BGM 스택 (카드 갤러리 등에서 이전 BGM 복원용)
        this.bgmStack = [];

        // 오디오 객체 캐시
        this.audioCache = {};

        // 페이드 애니메이션 타이머
        this.fadeTimer = null;

        // 볼륨 설정 (GameConfig에서 초기화)
        this.volumes = {
            master: GameConfig?.audio?.volume?.master || 1.0,
            bgm: GameConfig?.audio?.volume?.bgm || 0.6,
            sfx: GameConfig?.audio?.volume?.sfx || 0.8
        };

        // 로딩 상태
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalCount = 0;

        // 백그라운드 상태 추적
        this.wasPlayingBeforeBackground = false;

        // Page Visibility API 설정 (바인딩 필요 - 리스너 제거 시 사용)
        this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
        this.setupVisibilityListener();
    }

    /**
     * Page Visibility API 리스너 설정
     * 백그라운드로 전환 시 BGM 자동 일시정지 (배터리 절약)
     */
    setupVisibilityListener() {
        try {
            // GameConfig에서 기능 활성화 여부 확인
            const enabled = GameConfig?.audio?.background?.pauseOnBackground ?? true;

            if (enabled) {
                document.addEventListener('visibilitychange', this.boundVisibilityHandler);
            }
        } catch (error) {
            console.error('[AudioSystem] Error setting up visibility listener:', error);
        }
    }

    /**
     * Page Visibility 변경 핸들러
     * document.hidden 상태에 따라 BGM 일시정지/재개
     */
    handleVisibilityChange() {
        try {
            if (!this.currentBGM) {
                return; // BGM 없으면 무시
            }

            if (document.hidden) {
                // 백그라운드로 전환: BGM 일시정지
                if (!this.currentBGM.paused) {
                    this.wasPlayingBeforeBackground = true;
                    this.currentBGM.pause();
                }
            } else {
                // 포그라운드로 복귀: BGM 재개
                if (this.wasPlayingBeforeBackground) {
                    this.currentBGM.play().catch(e => {
                        console.warn('[AudioSystem] Failed to resume BGM on foreground:', e);
                    });
                    this.wasPlayingBeforeBackground = false;
                }
            }
        } catch (error) {
            console.error('[AudioSystem] Error handling visibility change:', error);
        }
    }

    /**
     * 오디오 파일 전체 경로 생성
     * @param {string} relativePath - 상대 경로 (예: 'bgm/bgm_main_menu.mp3')
     * @returns {string} 전체 경로
     */
    getFullPath(relativePath) {
        const basePath = GameConfig?.audio?.basePath || 'assets/audio/';
        return `${basePath}${relativePath}`;
    }

    /**
     * BGM 키로부터 오디오 객체 생성 또는 캐시에서 가져오기
     * @param {string} bgmKey - BGM 키 (예: 'mainMenu', 'normalBattle')
     * @returns {HTMLAudioElement|null} 오디오 객체
     */
    getBGMAudio(bgmKey) {
        try {
            // 캐시에 있으면 반환
            if (this.audioCache[bgmKey]) {
                return this.audioCache[bgmKey];
            }

            // GameConfig에서 경로 가져오기
            const relativePath = GameConfig?.audio?.bgm?.[bgmKey];
            if (!relativePath) {
                console.warn(`[AudioSystem] BGM key '${bgmKey}' not found in GameConfig`);
                return null;
            }

            // 전체 경로 생성
            const fullPath = this.getFullPath(relativePath);

            // 오디오 객체 생성
            const audio = new Audio(fullPath);
            audio.volume = this.getEffectiveVolume('bgm');

            // 모바일 오디오 믹싱 설정 (다른 앱 오디오와 공존)
            const allowMixing = GameConfig?.audio?.background?.allowAudioMixing ?? true;
            if (allowMixing) {
                audio.setAttribute('x-webkit-airplay', 'allow');  // AirPlay 허용
                audio.setAttribute('playsinline', 'true');         // 인라인 재생 (iOS 필수)
                // 참고: HTML5 Audio는 완벽한 믹싱 제어 불가 (브라우저/OS 의존)
            }

            // 에러 핸들러 추가 (파일 누락/경로 오류 감지)
            audio.addEventListener('error', (e) => {
                console.error(`[AudioSystem] Failed to load audio file for '${bgmKey}':`, fullPath);
                console.error('Error details:', e);
            }, { once: true });

            // 캐시에 저장
            this.audioCache[bgmKey] = audio;

            return audio;
        } catch (error) {
            console.error(`[AudioSystem] Error creating audio for '${bgmKey}':`, error);
            return null;
        }
    }

    /**
     * 실제 적용되는 볼륨 계산 (마스터 * BGM/SFX + 커브 적용)
     * @param {string} type - 'bgm' 또는 'sfx'
     * @returns {number} 0.0 ~ 1.0
     */
    getEffectiveVolume(type) {
        const master = this.volumes.master ?? 1.0;
        const typeVolume = this.volumes[type] ?? 1.0;
        let volume = master * typeVolume;

        // 볼륨 커브 적용 (로그 스케일 시뮬레이션 - 인지 개선)
        const curveEnabled = GameConfig?.audio?.volumeCurve?.enabled ?? true;
        if (curveEnabled) {
            const exponent = GameConfig?.audio?.volumeCurve?.exponent || 2.0;
            volume = Math.pow(volume, exponent);
        }

        return Math.max(0, Math.min(1, volume));
    }

    /**
     * BGM 재생 (페이드 인 옵션)
     * @param {string} bgmKey - BGM 키
     * @param {boolean} loop - 반복 재생 여부 (기본: true)
     * @param {boolean} fade - 페이드 인 여부 (기본: true)
     * @returns {Promise<boolean>} 성공 여부
     */
    async playBGM(bgmKey, loop = true, fade = true) {
        try {
            // 이미 같은 BGM이 재생 중이면 무시
            if (this.currentBGMKey === bgmKey && this.currentBGM && !this.currentBGM.paused) {
                return true;
            }

            // 현재 BGM 정지 (페이드 아웃)
            if (this.currentBGM) {
                await this.stopBGM(fade);
            }

            // 새 BGM 오디오 객체 가져오기
            const audio = this.getBGMAudio(bgmKey);
            if (!audio) {
                console.warn(`[AudioSystem] Cannot play BGM '${bgmKey}'`);
                return false;
            }

            // 설정 적용
            audio.loop = loop;
            audio.currentTime = 0;

            // 페이드 인
            if (fade) {
                audio.volume = 0;
                try {
                    await audio.play();
                    await this.fadeIn(audio, 'bgm');
                } catch (e) {
                    console.warn('[AudioSystem] Autoplay blocked:', e);
                    return false;
                }
            } else {
                audio.volume = this.getEffectiveVolume('bgm');
                try {
                    await audio.play();
                } catch (e) {
                    console.warn('[AudioSystem] Autoplay blocked:', e);
                    return false;
                }
            }

            // 백그라운드 플래그 리셋 (새 BGM 재생 시 초기화)
            this.wasPlayingBeforeBackground = false;

            // 현재 BGM 설정
            this.currentBGM = audio;
            this.currentBGMKey = bgmKey;

            return true;

        } catch (error) {
            console.error(`[AudioSystem] Error playing BGM '${bgmKey}':`, error);
            return false;
        }
    }

    /**
     * BGM 정지 (페이드 아웃 옵션)
     * @param {boolean} fade - 페이드 아웃 여부 (기본: true)
     * @returns {Promise<void>}
     */
    async stopBGM(fade = true) {
        if (!this.currentBGM) {
            return;
        }

        try {
            const audio = this.currentBGM;

            if (fade) {
                await this.fadeOut(audio);
            }

            audio.pause();
            audio.currentTime = 0;

            // 백그라운드 플래그 리셋 (BGM 정지 시 초기화)
            this.wasPlayingBeforeBackground = false;

            this.currentBGM = null;
            this.currentBGMKey = null;

        } catch (error) {
            console.error('[AudioSystem] Error stopping BGM:', error);
        }
    }

    /**
     * 현재 BGM 일시정지 및 스택에 저장
     * (카드 갤러리 열 때 사용)
     * @returns {boolean} 성공 여부
     */
    pauseAndSaveBGM() {
        if (!this.currentBGM || !this.currentBGMKey) {
            return false;
        }

        try {
            // 현재 재생 위치 저장
            const savedState = {
                key: this.currentBGMKey,
                currentTime: this.currentBGM.currentTime,
                loop: this.currentBGM.loop
            };

            this.bgmStack.push(savedState);

            // 일시정지
            this.currentBGM.pause();

            // 백그라운드 플래그 리셋 (BGM 스택에 저장 시 초기화)
            this.wasPlayingBeforeBackground = false;

            // 현재 BGM 초기화 (새 BGM 재생 가능하도록)
            this.currentBGM = null;
            this.currentBGMKey = null;

            return true;

        } catch (error) {
            console.error('[AudioSystem] Error pausing BGM:', error);
            return false;
        }
    }

    /**
     * 이전 BGM 복원 및 재생
     * (카드 갤러리 닫을 때 사용)
     * @returns {Promise<boolean>} 성공 여부
     */
    async restorePreviousBGM() {
        if (this.bgmStack.length === 0) {
            return false;
        }

        try {
            // 스택에서 이전 상태 꺼내기
            const savedState = this.bgmStack.pop();

            // 현재 BGM 정지 (페이드 아웃)
            if (this.currentBGM) {
                await this.stopBGM(true);
            }

            // 오디오 객체 가져오기
            const audio = this.getBGMAudio(savedState.key);
            if (!audio) {
                console.warn(`[AudioSystem] Cannot restore BGM '${savedState.key}'`);
                return false;
            }

            // 이전 재생 위치로 복원
            audio.currentTime = savedState.currentTime;
            audio.loop = savedState.loop;
            audio.volume = 0;

            // 재생 (페이드 인)
            try {
                await audio.play();
                await this.fadeIn(audio, 'bgm');
            } catch (e) {
                console.warn('[AudioSystem] Autoplay blocked on restore:', e);
                // Autoplay 차단 시 실패 처리하지만 에러는 던지지 않음
            }

            // 백그라운드 플래그 리셋 (BGM 복원 시 초기화)
            this.wasPlayingBeforeBackground = false;

            // 현재 BGM 설정
            this.currentBGM = audio;
            this.currentBGMKey = savedState.key;

            return true;

        } catch (error) {
            console.error('[AudioSystem] Error restoring BGM:', error);
            return false;
        }
    }

    /**
     * 스테이지 번호로 전투 BGM 결정
     * @param {number} stage - 스테이지 번호
     * @returns {string} BGM 키 ('normalBattle' 또는 'bossBattle')
     */
    getBattleBGM(stage) {
        const bossInterval = GameConfig?.audio?.bossStage?.interval || 10;
        const isBossStage = stage % bossInterval === 0;

        return isBossStage ? 'bossBattle' : 'normalBattle';
    }

    /**
     * 볼륨 설정
     * @param {string} type - 'master', 'bgm', 'sfx'
     * @param {number} value - 0.0 ~ 1.0
     */
    setVolume(type, value) {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.volumes[type] = clampedValue;

        // 현재 재생 중인 BGM 볼륨 즉시 업데이트
        if (type === 'master' || type === 'bgm') {
            if (this.currentBGM) {
                this.currentBGM.volume = this.getEffectiveVolume('bgm');
            }
        }
    }

    /**
     * 페이드 인 효과
     * @param {HTMLAudioElement} audio - 오디오 객체
     * @param {string} type - 'bgm' 또는 'sfx'
     * @returns {Promise<void>}
     */
    fadeIn(audio, type) {
        return new Promise((resolve) => {
            const targetVolume = this.getEffectiveVolume(type);
            const duration = GameConfig?.audio?.fade?.duration || 1000;
            const steps = 20;
            const stepTime = duration / steps;
            const volumeStep = targetVolume / steps;

            let currentStep = 0;
            audio.volume = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.min(volumeStep * currentStep, targetVolume);

                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    audio.volume = targetVolume;
                    resolve();
                }
            }, stepTime);
        });
    }

    /**
     * 페이드 아웃 효과
     * @param {HTMLAudioElement} audio - 오디오 객체
     * @returns {Promise<void>}
     */
    fadeOut(audio) {
        return new Promise((resolve) => {
            const duration = GameConfig?.audio?.fade?.duration || 1000;
            const steps = 20;
            const stepTime = duration / steps;
            const startVolume = audio.volume;
            const volumeStep = startVolume / steps;

            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(startVolume - volumeStep * currentStep, 0);

                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    audio.volume = 0;
                    resolve();
                }
            }, stepTime);
        });
    }

    /**
     * 모든 오디오 파일 프리로드 (BGM + SFX)
     * @param {Function} onProgress - 진행률 콜백 (loaded, total)
     * @param {Function} onComplete - 완료 콜백
     */
    async preloadAll(onProgress, onComplete) {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.loadedCount = 0;

        try {
            // GameConfig.audio 존재 확인
            if (!GameConfig || !GameConfig.audio) {
                console.error('[AudioSystem] ❌ CRITICAL: GameConfig.audio is undefined!');
                console.error('[AudioSystem] This usually means gameConfig.js failed to load or is cached.');
                console.error('[AudioSystem] Please hard refresh (Cmd+Shift+R or Ctrl+Shift+R)');
                if (onComplete) onComplete();
                this.isLoading = false;
                return;
            }

            // BGM + SFX 파일 목록 가져오기
            const bgmKeys = Object.keys(GameConfig?.audio?.bgm || {});
            const sfxKeys = Object.keys(GameConfig?.audio?.sfx || {});
            this.totalCount = bgmKeys.length + sfxKeys.length;

            // 초기 진행률 표시 (0/total)
            if (onProgress) {
                onProgress(0, this.totalCount);
            }

            // 모든 오디오 파일 로드 (BGM + SFX)
            const allKeys = [
                ...bgmKeys.map(key => ({ type: 'bgm', key })),
                ...sfxKeys.map(key => ({ type: 'sfx', key }))
            ];

            const loadPromises = allKeys.map(async ({ type, key }) => {
                try {
                    const audio = type === 'bgm' ? this.getBGMAudio(key) : this.getSFXAudio(key);
                    if (!audio) {
                        throw new Error(`Failed to create audio for ${key}`);
                    }

                    // canplaythrough 이벤트로 로드 완료 대기
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout loading ${key}`));
                        }, 10000); // 10초 타임아웃

                        audio.addEventListener('canplaythrough', () => {
                            clearTimeout(timeout);
                            resolve();
                        }, { once: true });

                        audio.addEventListener('error', (e) => {
                            clearTimeout(timeout);
                            reject(new Error(`Error loading ${key}: ${e.message}`));
                        }, { once: true });

                        // 로드 시작
                        audio.load();
                    });

                    // 각 파일 로딩 후 50ms 딜레이 (진행률 표시 가시성 향상)
                    await new Promise(resolve => setTimeout(resolve, 50));

                    this.loadedCount++;

                    // 진행률 콜백 호출
                    if (onProgress) {
                        onProgress(this.loadedCount, this.totalCount);
                    }

                } catch (error) {
                    console.error(`[AudioSystem] Failed to load ${type} '${key}':`, error);
                    // 실패해도 계속 진행
                    this.loadedCount++;
                    if (onProgress) {
                        onProgress(this.loadedCount, this.totalCount);
                    }
                }
            });

            // 모든 로드 대기
            await Promise.all(loadPromises);

            // 완료 콜백 호출
            if (onComplete) {
                onComplete();
            }

        } catch (error) {
            console.error('[AudioSystem] Error during preload:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * SFX 키로부터 오디오 객체 생성 또는 캐시에서 가져오기
     * @param {string} sfxKey - SFX 키 (예: 'attackHit', 'click')
     * @returns {HTMLAudioElement|null} 오디오 객체
     */
    getSFXAudio(sfxKey) {
        try {
            // 캐시에 있으면 반환
            const cacheKey = `sfx_${sfxKey}`;
            if (this.audioCache[cacheKey]) {
                return this.audioCache[cacheKey];
            }

            // GameConfig에서 경로 가져오기
            const relativePath = GameConfig?.audio?.sfx?.[sfxKey];
            if (!relativePath) {
                console.warn(`[AudioSystem] SFX key '${sfxKey}' not found in GameConfig`);
                return null;
            }

            // 전체 경로 생성
            const fullPath = this.getFullPath(relativePath);

            // 오디오 객체 생성
            const audio = new Audio(fullPath);
            audio.volume = this.getEffectiveVolume('sfx');

            // 모바일 오디오 믹싱 설정 (다른 앱 오디오와 공존)
            const allowMixing = GameConfig?.audio?.background?.allowAudioMixing ?? true;
            if (allowMixing) {
                audio.setAttribute('x-webkit-airplay', 'allow');  // AirPlay 허용
                audio.setAttribute('playsinline', 'true');         // 인라인 재생 (iOS 필수)
                // 참고: HTML5 Audio는 완벽한 믹싱 제어 불가 (브라우저/OS 의존)
            }

            // 에러 핸들러 추가
            audio.addEventListener('error', (e) => {
                console.error(`[AudioSystem] Failed to load SFX file for '${sfxKey}':`, fullPath);
                console.error('Error details:', e);
            }, { once: true });

            // 캐시에 저장
            this.audioCache[cacheKey] = audio;

            return audio;
        } catch (error) {
            console.error(`[AudioSystem] Error creating SFX for '${sfxKey}':`, error);
            return null;
        }
    }

    /**
     * SFX 재생
     * @param {string} sfxKey - SFX 키
     * @param {number} volume - 볼륨 배율 (0.0 ~ 1.0, 기본값: 1.0)
     * @returns {boolean} 성공 여부
     */
    playSFX(sfxKey, volume = 1.0) {
        try {
            const audio = this.getSFXAudio(sfxKey);
            if (!audio) {
                console.warn(`[AudioSystem] Cannot play SFX '${sfxKey}'`);
                return false;
            }

            // 볼륨 설정 (SFX 볼륨 * 배율)
            audio.volume = this.getEffectiveVolume('sfx') * Math.max(0, Math.min(1, volume));

            // 처음부터 재생 (이미 재생 중이어도)
            audio.currentTime = 0;
            audio.play().catch(e => console.warn(`[AudioSystem] SFX play blocked: ${sfxKey}`, e));

            return true;
        } catch (error) {
            console.error(`[AudioSystem] Error playing SFX '${sfxKey}':`, error);
            return false;
        }
    }

    /**
     * 랜덤 카드 획득 사운드 재생
     * @returns {boolean} 성공 여부
     */
    playRandomCardGet() {
        try {
            const pool = GameConfig?.audio?.battleSounds?.cardAcquisition || [];
            if (pool.length === 0) {
                console.warn('[AudioSystem] No card acquisition sounds configured');
                return false;
            }

            const randomKey = pool[Math.floor(Math.random() * pool.length)];
            return this.playSFX(randomKey);
        } catch (error) {
            console.error('[AudioSystem] Error playing random card get sound:', error);
            return false;
        }
    }

    /**
     * 데미지 타입별 사운드 재생 (effectiveness 기반)
     * @param {number} effectiveness - 상성 배율 (0.5, 1.0, 1.5)
     * @returns {boolean} 성공 여부
     */
    playDamageSFX(effectiveness) {
        try {
            const mapping = GameConfig?.audio?.battleSounds?.damage;
            if (!mapping) {
                console.warn('[AudioSystem] Damage sound mapping not found in GameConfig');
                return false;
            }

            let sfxKey;
            if (effectiveness > 1.0) {
                sfxKey = mapping.critical;
            } else if (effectiveness < 1.0) {
                sfxKey = mapping.weak;
            } else {
                sfxKey = mapping.normal;
            }

            if (!sfxKey) {
                console.warn(`[AudioSystem] No SFX key for effectiveness ${effectiveness}`);
                return false;
            }

            return this.playSFX(sfxKey);
        } catch (error) {
            console.error('[AudioSystem] Error playing damage SFX:', error);
            return false;
        }
    }

    /**
     * 속성 플래시 사운드 재생
     * @param {string} element - 속성 ('fire', 'poison', 'electric', 'water', 'normal')
     * @returns {boolean} 성공 여부
     */
    playElementFlashSFX(element) {
        try {
            const sfxKey = GameConfig?.audio?.battleSounds?.elementFlash?.[element];

            // null이면 의도적으로 사운드 없음 (예: normal 속성)
            if (sfxKey === null) {
                return true; // 에러가 아님
            }

            if (!sfxKey) {
                console.warn(`[AudioSystem] No element flash sound for '${element}'`);
                return false;
            }

            return this.playSFX(sfxKey);
        } catch (error) {
            console.error(`[AudioSystem] Error playing element flash SFX for '${element}':`, error);
            return false;
        }
    }

    /**
     * 모든 오디오 정지 및 정리
     */
    dispose() {
        // Page Visibility 리스너 제거 (메모리 누수 방지)
        try {
            document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
        } catch (error) {
            console.error('[AudioSystem] Error removing visibility listener:', error);
        }

        // 현재 BGM 정지
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM = null;
            this.currentBGMKey = null;
        }

        // 백그라운드 플래그 초기화
        this.wasPlayingBeforeBackground = false;

        // 캐시 정리
        Object.values(this.audioCache).forEach(audio => {
            audio.pause();
            audio.src = '';
        });
        this.audioCache = {};

        // 스택 초기화
        this.bgmStack = [];
    }
}
