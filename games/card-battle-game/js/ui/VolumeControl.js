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

        // DOM 요소 - 인게임 볼륨 팝업
        this.volumeControlBtn = document.getElementById('volume-control-btn');
        this.volumePopupPanel = document.getElementById('volume-popup-panel');
        this.ingameBgmSlider = document.getElementById('ingame-bgm-slider');
        this.ingameSfxSlider = document.getElementById('ingame-sfx-slider');
        this.ingameBgmValue = document.getElementById('ingame-bgm-value');
        this.ingameSfxValue = document.getElementById('ingame-sfx-value');

        // 현재 볼륨 값
        this.volumes = {
            bgm: GameConfig?.audio?.volume?.bgm * 100 || 60,
            sfx: GameConfig?.audio?.volume?.sfx * 100 || 80
        };

        // LocalStorage 키
        this.storageKeys = {
            bgm: 'cardBattle_volumeBGM',
            sfx: 'cardBattle_volumeSFX'
        };

        // 초기화
        this.init();

        console.log('[VolumeControl] Initialized');
    }

    /**
     * 초기화
     */
    init() {
        // LocalStorage에서 볼륨 불러오기
        this.loadVolumes();

        // 슬라이더 초기값 설정
        this.updateAllSliders();

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // AudioSystem에 초기 볼륨 적용
        this.applyVolumesToAudioSystem();
    }

    /**
     * LocalStorage에서 볼륨 불러오기
     */
    loadVolumes() {
        try {
            const savedBgm = localStorage.getItem(this.storageKeys.bgm);
            const savedSfx = localStorage.getItem(this.storageKeys.sfx);

            if (savedBgm !== null) {
                this.volumes.bgm = parseFloat(savedBgm);
            }
            if (savedSfx !== null) {
                this.volumes.sfx = parseFloat(savedSfx);
            }

            console.log(`[VolumeControl] Loaded volumes: BGM ${this.volumes.bgm}%, SFX ${this.volumes.sfx}%`);
        } catch (error) {
            console.error('[VolumeControl] Error loading volumes:', error);
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
            this.settingsMenuBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // 설정 모달 닫기
        if (this.closeSettingsBtn) {
            this.closeSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
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
            this.volumeControlBtn.addEventListener('click', () => this.toggleVolumePopup());
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

        // 팝업 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!this.volumePopupPanel.contains(e.target) &&
                e.target !== this.volumeControlBtn &&
                !this.volumePopupPanel.classList.contains('hidden')) {
                this.hideVolumePopup();
            }
        });
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

        // AudioSystem에 즉시 적용
        this.applyVolumesToAudioSystem();

        // LocalStorage에 저장
        this.saveVolume(type, value);

        console.log(`[VolumeControl] ${type.toUpperCase()} volume changed to ${value}%`);
    }

    /**
     * 설정 모달 표시
     */
    showSettingsModal() {
        if (!this.settingsModal) return;

        this.settingsModal.classList.remove('hidden');
        console.log('[VolumeControl] Settings modal shown');
    }

    /**
     * 설정 모달 숨기기
     */
    hideSettingsModal() {
        if (!this.settingsModal) return;

        this.settingsModal.classList.add('hidden');
        console.log('[VolumeControl] Settings modal hidden');
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
        console.log('[VolumeControl] Volume popup shown');
    }

    /**
     * 인게임 볼륨 팝업 숨기기
     */
    hideVolumePopup() {
        if (!this.volumePopupPanel || !this.volumeControlBtn) return;

        this.volumePopupPanel.classList.add('hidden');
        this.volumeControlBtn.classList.remove('active');
        console.log('[VolumeControl] Volume popup hidden');
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

        console.log('[VolumeControl] Disposed');
    }
}
