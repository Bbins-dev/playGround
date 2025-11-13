/**
 * CryptoUtils - 세이브 파일 암호화/복호화 유틸리티
 *
 * AES-256-GCM 암호화를 사용하여 세이브 파일을 보호합니다.
 * - Configuration-Driven: 모든 설정은 GameConfig에서 관리
 * - 조용한 UX: 에러 시 자동 폴백, 모달 없음
 * - 안전성: 모든 단계에서 try-catch 보호
 */

class CryptoUtils {
    /**
     * Secure Context 체크 (HTTPS 또는 localhost)
     * @returns {boolean} 암호화 사용 가능 여부
     */
    static isSecureContext() {
        return window.isSecureContext &&
               window.crypto &&
               window.crypto.subtle;
    }

    /**
     * Web Crypto API 지원 여부 테스트
     * @returns {Promise<boolean>} 암호화 지원 여부
     */
    static async testCryptoSupport() {
        if (!this.isSecureContext()) {
            return false;
        }

        try {
            const config = GameConfig?.constants?.saveSystem;

            // 테스트 키 생성
            const key = await crypto.subtle.generateKey(
                {
                    name: config?.encryptionAlgorithm || 'AES-GCM',
                    length: config?.keyLength || 256
                },
                true,
                ['encrypt', 'decrypt']
            );

            // 테스트 암호화
            const testData = new TextEncoder().encode('test');
            const iv = crypto.getRandomValues(new Uint8Array(config?.ivLength || 12));

            await crypto.subtle.encrypt(
                { name: config?.encryptionAlgorithm || 'AES-GCM', iv },
                key,
                testData
            );

            return true;
        } catch (error) {
            console.warn('[CryptoUtils] 암호화 미지원:', error);
            return false;
        }
    }

    /**
     * 기기 고유 ID 가져오기 또는 생성
     * @returns {string} 기기 ID (UUID)
     */
    static getOrCreateDeviceId() {
        const config = GameConfig?.constants?.saveSystem;
        const deviceIdKey = config?.deviceIdKey || '_cbg_did';

        let deviceId = localStorage.getItem(deviceIdKey);

        if (!deviceId) {
            // crypto.randomUUID() 사용 (최신 브라우저)
            deviceId = crypto.randomUUID ? crypto.randomUUID() : this._generateUUID();
            localStorage.setItem(deviceIdKey, deviceId);
        }

        return deviceId;
    }

    /**
     * UUID 생성 (폴백용)
     * @private
     */
    static _generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 암호화 키 유도 (PBKDF2)
     * @returns {Promise<CryptoKey>} 암호화 키
     */
    static async deriveKey() {
        const config = GameConfig?.constants?.saveSystem;
        const salt = config?.salt || 'CardBattle_v1_2025';
        const deviceId = this.getOrCreateDeviceId();

        // Base Key 생성
        const baseKeyMaterial = new TextEncoder().encode(salt + deviceId);
        const baseKey = await crypto.subtle.importKey(
            'raw',
            baseKeyMaterial,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // PBKDF2로 AES 키 유도
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode(salt),
                iterations: config?.pbkdf2Iterations || 100000,
                hash: config?.pbkdf2Hash || 'SHA-256'
            },
            baseKey,
            {
                name: config?.encryptionAlgorithm || 'AES-GCM',
                length: config?.keyLength || 256
            },
            false,
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    }

    /**
     * 데이터 암호화
     * @param {string} plaintext - 평문 데이터 (JSON 문자열)
     * @returns {Promise<string>} 암호화된 데이터 (iv.암호문 형식)
     */
    static async encryptData(plaintext) {
        try {
            const config = GameConfig?.constants?.saveSystem;

            // 1. 키 유도
            const key = await this.deriveKey();

            // 2. IV 생성 (랜덤)
            const iv = crypto.getRandomValues(new Uint8Array(config?.ivLength || 12));

            // 3. 암호화
            const encodedData = new TextEncoder().encode(plaintext);
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: config?.encryptionAlgorithm || 'AES-GCM',
                    iv
                },
                key,
                encodedData
            );

            // 4. Base64 인코딩
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));

            // 5. IV를 Hex로 변환
            const ivHex = Array.from(iv)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // 6. 최종 형식: iv.암호문
            return `${ivHex}.${encryptedBase64}`;

        } catch (error) {
            console.error('[CryptoUtils] 암호화 실패:', error);
            throw error;
        }
    }

    /**
     * 데이터 복호화
     * @param {string} ivHex - IV (Hex 문자열)
     * @param {string} encryptedBase64 - 암호문 (Base64)
     * @returns {Promise<string>} 복호화된 평문
     */
    static async decryptData(ivHex, encryptedBase64) {
        try {
            const config = GameConfig?.constants?.saveSystem;

            // 1. 키 유도 (저장 시와 동일한 키)
            const key = await this.deriveKey();

            // 2. IV 복원 (Hex → Uint8Array)
            const iv = new Uint8Array(
                ivHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
            );

            // 3. 암호문 디코딩 (Base64 → Uint8Array)
            const encryptedArray = new Uint8Array(
                atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
            );

            // 4. 복호화
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: config?.encryptionAlgorithm || 'AES-GCM',
                    iv
                },
                key,
                encryptedArray
            );

            // 5. 문자열 변환
            const decryptedText = new TextDecoder().decode(decryptedBuffer);

            return decryptedText;

        } catch (error) {
            console.error('[CryptoUtils] 복호화 실패:', error);
            throw error;
        }
    }

    /**
     * 세이브 형식 감지
     * @param {string} encodedData - 인코딩된 세이브 데이터
     * @returns {string} 'encrypted' | 'base64' | 'unknown'
     */
    static detectSaveFormat(encodedData) {
        if (!encodedData || typeof encodedData !== 'string') {
            return 'unknown';
        }

        // 1. 버전 태그로 감지
        if (encodedData.startsWith('v2:')) {
            return 'encrypted';
        }

        // 2. IV 존재 여부 감지 (iv.암호문.체크섬)
        const parts = encodedData.split('.');
        if (parts.length >= 3) {
            // IV는 12바이트 = 24 hex 문자
            const firstPart = parts[0];
            if (firstPart.length === 24 && /^[0-9a-f]+$/i.test(firstPart)) {
                return 'encrypted';
            }
        }

        // 3. 기존 Base64 방식
        return 'base64';
    }

    /**
     * 암호화 세이브 파싱
     * @param {string} encodedData - iv.암호문.체크섬
     * @returns {{iv: string, encrypted: string, checksum: string}}
     */
    static parseSaveFormat(encodedData) {
        const parts = encodedData.split('.');

        if (parts.length < 3) {
            throw new Error('유효하지 않은 세이브 형식 (데이터 불완전)');
        }

        const iv = parts[0];
        const checksum = parts[parts.length - 1];
        const encrypted = parts.slice(1, -1).join('.');  // 중간 부분 (점 포함 가능)

        // IV 길이 검증 (12바이트 = 24 hex)
        if (iv.length !== 24) {
            throw new Error('유효하지 않은 IV 길이');
        }

        return { iv, encrypted, checksum };
    }

    /**
     * Base64 세이브 파싱
     * @param {string} encodedData - base64.체크섬
     * @returns {{encoded: string, checksum: string}}
     */
    static parseBase64Format(encodedData) {
        const parts = encodedData.split('.');

        if (parts.length < 2) {
            // 체크섬 없는 구 버전
            return { encoded: encodedData, checksum: null };
        }

        const checksum = parts[parts.length - 1];
        const encoded = parts.slice(0, -1).join('.');

        return { encoded, checksum };
    }

    /**
     * 완전한 암호화 프로세스 (JSON → 암호화 + 체크섬)
     * @param {string} jsonData - JSON 문자열
     * @param {Function} checksumFn - 체크섬 생성 함수
     * @returns {Promise<string>} iv.암호문.체크섬
     */
    static async encryptSaveData(jsonData, checksumFn) {
        try {
            // 1. 원본 체크섬 생성
            const checksum = checksumFn ? checksumFn(jsonData) : '';

            // 2. 암호화 (iv.암호문)
            const encrypted = await this.encryptData(jsonData);

            // 3. 최종 형식: iv.암호문.체크섬
            return checksum ? `${encrypted}.${checksum}` : encrypted;

        } catch (error) {
            console.error('[CryptoUtils] 암호화 프로세스 실패:', error);
            throw error;
        }
    }

    /**
     * 완전한 복호화 프로세스 (암호화 데이터 → JSON + 체크섬 검증)
     * @param {string} encryptedData - iv.암호문.체크섬
     * @param {Function} checksumFn - 체크섬 검증 함수
     * @returns {Promise<string>} JSON 문자열
     */
    static async decryptSaveData(encryptedData, checksumFn) {
        try {
            // 1. 파싱
            const { iv, encrypted, checksum } = this.parseSaveFormat(encryptedData);

            // 2. 복호화
            const decryptedJson = await this.decryptData(iv, encrypted);

            // 3. 체크섬 검증 (선택적)
            if (checksumFn && checksum) {
                const calculatedChecksum = checksumFn(decryptedJson);
                if (calculatedChecksum !== checksum) {
                    throw new Error('체크섬 불일치 - 세이브 파일 손상 또는 조작됨');
                }
            }

            return decryptedJson;

        } catch (error) {
            console.error('[CryptoUtils] 복호화 프로세스 실패:', error);
            throw error;
        }
    }
}

// Export (브라우저 환경)
if (typeof window !== 'undefined') {
    window.CryptoUtils = CryptoUtils;
}
