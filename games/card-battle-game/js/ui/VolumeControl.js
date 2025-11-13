/**
 * VolumeControl.js
 * Configuration-Driven 볼륨 조절 시스템
 *
 * 기능:
 * - 메인 메뉴 설정 모달
 * - 인게임 볼륨 팝업
 * - AudioSystem 연동
 * - LocalStorage 저장/불러오기
 * - 실시간 볼륨 업데이트
 */

class VolumeControl {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.audioSystem = gameManager?.audioSystem;

        // DOM 요소 - 설정 모달
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsMenuBtn = document.getElementById('settings-menu-btn');
        this.closeSettingsBtn = document.getElementById('close-settings');
        this.settingsBgmSlider = document.getElementById('settings-bgm-slider');
        this.settingsSfxSlider = document.getElementById('settings-sfx-slider');
        this.settingsBgmValue = document.getElementById('settings-bgm-value');
        this.settingsSfxValue = document.getElementById('settings-sfx-value');
        this.settingsMuteToggle = document.getElementById('settings-mute-toggle');

        // DOM 요소 - 인게임 볼륨 팝업
        this.volumeControlBtn = document.getElementById('volume-control-btn');
        this.volumePopupPanel = document.getElementById('volume-popup-panel');
        this.ingameBgmSlider = document.getElementById('ingame-bgm-slider');
        this.ingameSfxSlider = document.getElementById('ingame-sfx-slider');
        this.ingameBgmValue = document.getElementById('ingame-bgm-value');
        this.ingameSfxValue = document.getElementById('ingame-sfx-value');
        this.ingameMuteToggle = document.getElementById('ingame-mute-toggle');

        // DOM 요소 - 체크박스
        this.settingsCheckbox = this.settingsMuteToggle?.querySelector('.mute-checkbox');
        this.ingameCheckbox = this.ingameMuteToggle?.querySelector('.mute-checkbox');

        // LocalStorage 키
        this.storageKeys = {
            bgm: 'cardBattle_volumeBGM',
            sfx: 'cardBattle_volumeSFX'
        };

        // 현재 볼륨 값 - localStorage 우선, 없으면 GameConfig 기본값
        this.volumes = {
            bgm: this.getStoredVolume('bgm') ?? (GameConfig?.audio?.volume?.bgm * 100 || 60),
            sfx: this.getStoredVolume('sfx') ?? (GameConfig?.audio?.volume?.sfx * 100 || 80)
        };

        // 음소거 상태 추적
        this.isMuted = false;

        // 초기화
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // 슬라이더 초기값 설정
        this.updateAllSliders();

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // AudioSystem에 초기 볼륨 적용
        this.applyVolumesToAudioSystem();
    }

    /**
     * LocalStorage에서 저장된 볼륨 가져오기
     * @param {string} type - 'bgm' 또는 'sfx'
     * @returns {number|null} 저장된 볼륨 값 (0-100) 또는 null
     */
    getStoredVolume(type) {
        try {
            const stored = localStorage.getItem(this.storageKeys[type]);
            if (stored !== null) {
                const value = parseFloat(stored);
                // 0도 유효한 값으로 인정
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    return value;
                }
            }
            return null;
        } catch (error) {
            console.error(`[VolumeControl] Error reading ${type} volume from storage:`, error);
            return null;
        }
    }

    /**
     * LocalStorage에 볼륨 저장
     * @param {string} type - 'bgm' 또는 'sfx'
     * @param {number} value - 0-100
     */
    saveVolume(type, value) {
        try {
            localStorage.setItem(this.storageKeys[type], value.toString());
        } catch (error) {
            console.error(`[VolumeControl] Error saving ${type} volume:`, error);
        }
    }

    /**
     * 모든 슬라이더 값 업데이트
     */
    updateAllSliders() {
        // 설정 모달 슬라이더
        if (this.settingsBgmSlider) {
            this.settingsBgmSlider.value = this.volumes.bgm;
            this.settingsBgmValue.textContent = `${Math.round(this.volumes.bgm)}%`;
        }
        if (this.settingsSfxSlider) {
            this.settingsSfxSlider.value = this.volumes.sfx;
            this.settingsSfxValue.textContent = `${Math.round(this.volumes.sfx)}%`;
        }

        // 인게임 팝업 슬라이더
        if (this.ingameBgmSlider) {
            this.ingameBgmSlider.value = this.volumes.bgm;
            this.ingameBgmValue.textContent = `${Math.round(this.volumes.bgm)}%`;
        }
        if (this.ingameSfxSlider) {
            this.ingameSfxSlider.value = this.volumes.sfx;
            this.ingameSfxValue.textContent = `${Math.round(this.volumes.sfx)}%`;
        }
    }

    /**
     * AudioSystem에 볼륨 적용
     */
    applyVolumesToAudioSystem() {
        if (!this.audioSystem) {
            console.warn('[VolumeControl] AudioSystem not available');
            return;
        }

        // 0-100을 0.0-1.0으로 변환
        this.audioSystem.setVolume('bgm', this.volumes.bgm / 100);
        this.audioSystem.setVolume('sfx', this.volumes.sfx / 100);
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 설정 버튼 클릭
        if (this.settingsMenuBtn) {
            this.settingsMenuBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.showSettingsModal();
            });
        }

        // 설정 모달 닫기
        if (this.closeSettingsBtn) {
            this.closeSettingsBtn.addEventListener('click', () => {
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.hideSettingsModal();
            });
        }

        // 설정 모달 배경 클릭 시 닫기
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }

        // 설정 모달 슬라이더
        if (this.settingsBgmSlider) {
            this.settingsBgmSlider.addEventListener('input', (e) => {
                this.handleVolumeChange('bgm', parseFloat(e.target.value));
            });
        }
        if (this.settingsSfxSlider) {
            this.settingsSfxSlider.addEventListener('input', (e) => {
                this.handleVolumeChange('sfx', parseFloat(e.target.value));
            });
        }

        // 인게임 볼륨 버튼 클릭
        if (this.volumeControlBtn) {
            this.volumeControlBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 이벤트 버블링 방지
                // 버튼 클릭 사운드 재생
                if (this.gameManager?.audioSystem) {
                    this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
                }
                this.toggleVolumePopup();
            });
        }

        // 인게임 팝업 슬라이더
        if (this.ingameBgmSlider) {
            this.ingameBgmSlider.addEventListener('input', (e) => {
                this.handleVolumeChange('bgm', parseFloat(e.target.value));
            });
        }
        if (this.ingameSfxSlider) {
            this.ingameSfxSlider.addEventListener('input', (e) => {
                this.handleVolumeChange('sfx', parseFloat(e.target.value));
            });
        }

        // 팝업 내부 클릭 시 이벤트 전파 차단
        if (this.volumePopupPanel) {
            this.volumePopupPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 팝업 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!this.volumePopupPanel.contains(e.target) &&
                e.target !== this.volumeControlBtn &&
                !this.volumePopupPanel.classList.contains('hidden')) {
                this.hideVolumePopup();
            }
        });

        // 음소거 토글 버튼 - 설정 모달
        if (this.settingsMuteToggle) {
            this.settingsMuteToggle.addEventListener('click', () => {
                this.toggleMute();
            });
        }

        // 음소거 토글 버튼 - 인게임 팝업
        if (this.ingameMuteToggle) {
            this.ingameMuteToggle.addEventListener('click', () => {
                this.toggleMute();
            });
        }
    }

    /**
     * 볼륨 변경 처리 (실시간)
     * @param {string} type - 'bgm' 또는 'sfx'
     * @param {number} value - 0-100
     */
    handleVolumeChange(type, value) {
        // 값 업데이트
        this.volumes[type] = value;

        // 모든 슬라이더 동기화
        this.updateAllSliders();

        // 음소거 상태가 아닐 때만 AudioSystem에 적용
        if (!this.isMuted) {
            this.applyVolumesToAudioSystem();
        }

        // LocalStorage에 저장
        this.saveVolume(type, value);
    }

    /**
     * 설정 모달 표시
     */
    showSettingsModal() {
        if (!this.settingsModal) return;

        this.settingsModal.classList.remove('hidden');

        // Pull-to-refresh 완벽 차단 (iOS/Android 공통)
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${scrollY}px`;
    }

    /**
     * 설정 모달 숨기기
     */
    hideSettingsModal() {
        if (!this.settingsModal) return;

        this.settingsModal.classList.add('hidden');

        // Body 스크롤 복원 + 스크롤 위치 복구
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);

        // 메인 메뉴가 표시 중이면 body fixed 재적용 (pull-to-refresh 방지)
        if (this.gameManager?.gameState === 'menu') {
            const newScrollY = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${newScrollY}px`;
        }
    }

    /**
     * 음소거 토글 (BGM + SFX 동시)
     */
    toggleMute() {
        if (this.isMuted) {
            // 음소거 해제 - master 볼륨 복원
            this.isMuted = false;
            if (this.audioSystem) {
                this.audioSystem.setVolume('master', 1.0);
            }

            // BGM 재개
            if (this.audioSystem && this.audioSystem.resumeBGM) {
                this.audioSystem.resumeBGM();
            }

            // 체크박스 상태 업데이트
            this.updateMuteButtonText(false);

            // 클릭 사운드 재생
            if (this.gameManager?.audioSystem) {
                this.gameManager.audioSystem.playSFX(GameConfig?.audio?.uiSounds?.buttonClick || 'click');
            }
        } else {
            // 음소거 - master 볼륨을 0으로 설정
            this.isMuted = true;
            if (this.audioSystem) {
                this.audioSystem.setVolume('master', 0);

                // BGM 일시정지
                if (this.audioSystem.pauseBGM) {
                    this.audioSystem.pauseBGM();
                }
            }

            // 체크박스 상태 업데이트
            this.updateMuteButtonText(true);
        }
    }

    /**
     * 음소거 체크박스 상태 업데이트
     * @param {boolean} isMuted - 음소거 상태
     */
    updateMuteButtonText(isMuted) {
        // 체크박스 상태 토글 (음소거 ON = 체크됨)
        if (this.settingsCheckbox) {
            if (isMuted) {
                this.settingsCheckbox.classList.add('checked');
            } else {
                this.settingsCheckbox.classList.remove('checked');
            }
        }

        if (this.ingameCheckbox) {
            if (isMuted) {
                this.ingameCheckbox.classList.add('checked');
            } else {
                this.ingameCheckbox.classList.remove('checked');
            }
        }
    }

    /**
     * 인게임 볼륨 팝업 토글
     */
    toggleVolumePopup() {
        if (!this.volumePopupPanel) return;

        const isHidden = this.volumePopupPanel.classList.contains('hidden');

        if (isHidden) {
            this.showVolumePopup();
        } else {
            this.hideVolumePopup();
        }
    }

    /**
     * 인게임 볼륨 팝업 표시
     */
    showVolumePopup() {
        if (!this.volumePopupPanel || !this.volumeControlBtn) return;

        this.volumePopupPanel.classList.remove('hidden');
        this.volumeControlBtn.classList.add('active');
    }

    /**
     * 인게임 볼륨 팝업 숨기기
     */
    hideVolumePopup() {
        if (!this.volumePopupPanel || !this.volumeControlBtn) return;

        this.volumePopupPanel.classList.add('hidden');
        this.volumeControlBtn.classList.remove('active');
    }

    /**
     * 인게임 볼륨 버튼 표시 (전투 중)
     */
    showIngameVolumeButton() {
        if (this.volumeControlBtn) {
            this.volumeControlBtn.style.display = 'flex';
        }
    }

    /**
     * 인게임 볼륨 버튼 숨기기 (메뉴 화면)
     */
    hideIngameVolumeButton() {
        if (this.volumeControlBtn) {
            this.volumeControlBtn.style.display = 'none';
        }
        // 팝업도 함께 숨기기
        this.hideVolumePopup();
    }

    /**
     * 정리
     */
    dispose() {
        // 팝업 닫기
        this.hideVolumePopup();
        this.hideSettingsModal();
    }
}
