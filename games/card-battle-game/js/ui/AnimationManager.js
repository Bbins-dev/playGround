// 애니메이션 관리 시스템 - 게임 애니메이션 및 전환 효과

class AnimationManager {
    constructor() {
        // 애니메이션 큐
        this.animations = new Map();
        this.sequences = new Map();

        // 타이밍 설정
        this.defaultDurations = {
            cardMove: 800,
            cardFlip: 600,
            cardHighlight: 1000,
            damage: 1200,
            statusEffect: 1000,
            turnTransition: 1500
        };

        // 이징 함수들
        this.easingFunctions = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            bounce: t => {
                if (t < 1/2.75) return 7.5625 * t * t;
                if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
                if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
            },
            elastic: t => {
                if (t === 0 || t === 1) return t;
                return -(Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI));
            }
        };

        // 애니메이션 상태
        this.isPlaying = false;
        this.globalSpeed = 1;

        // RAF 핸들
        this.rafId = null;

    }

    // 애니메이션 시작
    start() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.animate();
        }
    }

    // 애니메이션 정지
    stop() {
        this.isPlaying = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    // 메인 애니메이션 루프
    animate() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();

        // 개별 애니메이션 업데이트
        this.updateAnimations(currentTime);

        // 시퀀스 애니메이션 업데이트
        this.updateSequences(currentTime);

        this.rafId = requestAnimationFrame(() => this.animate());
    }

    // 개별 애니메이션 업데이트
    updateAnimations(currentTime) {
        this.animations.forEach((anim, id) => {
            const elapsed = (currentTime - anim.startTime) * this.globalSpeed;
            const progress = Math.min(elapsed / anim.duration, 1);

            // 이징 적용
            const easedProgress = anim.easing ? anim.easing(progress) : progress;

            // 애니메이션 업데이트
            if (anim.onUpdate) {
                anim.onUpdate(easedProgress, anim);
            }

            // 완료 체크
            if (progress >= 1) {
                if (anim.onComplete) {
                    anim.onComplete(anim);
                }
                this.animations.delete(id);
            }
        });
    }

    // 시퀀스 애니메이션 업데이트
    updateSequences(currentTime) {
        this.sequences.forEach((seq, id) => {
            if (seq.currentIndex >= seq.animations.length) {
                // 시퀀스 완료
                if (seq.onComplete) {
                    seq.onComplete();
                }
                this.sequences.delete(id);
                return;
            }

            const current = seq.animations[seq.currentIndex];

            if (!current.started) {
                // 현재 애니메이션 시작
                current.started = true;
                this.createAnimation(
                    `${id}_${seq.currentIndex}`,
                    current.config
                );
            }

            // 현재 애니메이션이 완료되었는지 체크
            if (!this.animations.has(`${id}_${seq.currentIndex}`)) {
                seq.currentIndex++;

                // 딜레이가 있으면 대기
                if (seq.currentIndex < seq.animations.length) {
                    const next = seq.animations[seq.currentIndex];
                    if (next.delay) {
                        setTimeout(() => {
                            if (this.sequences.has(id)) {
                                // 딜레이 후 다음 애니메이션 준비
                            }
                        }, next.delay);
                    }
                }
            }
        });
    }

    // 애니메이션 생성
    createAnimation(id, config) {
        const animation = {
            id,
            type: config.type,
            duration: config.duration || this.defaultDurations[config.type] || 1000,
            easing: this.easingFunctions[config.easing || 'easeInOut'],
            startTime: Date.now(),
            onUpdate: config.onUpdate,
            onComplete: config.onComplete,
            ...config
        };

        this.animations.set(id, animation);

        // 애니메이션이 시작되면 자동으로 애니메이션 루프 시작
        this.start();

        return animation;
    }

    // 카드 이동 애니메이션
    animateCardMove(cardElement, from, to, options = {}) {
        const id = `cardMove_${Date.now()}_${Math.random()}`;

        return this.createAnimation(id, {
            type: 'cardMove',
            duration: options.duration || this.defaultDurations.cardMove,
            easing: options.easing || 'easeInOut',
            from: { x: from.x, y: from.y },
            to: { x: to.x, y: to.y },
            element: cardElement,
            onUpdate: (progress, anim) => {
                const x = anim.from.x + (anim.to.x - anim.from.x) * progress;
                const y = anim.from.y + (anim.to.y - anim.from.y) * progress;

                if (anim.element && anim.element.style) {
                    anim.element.style.transform = `translate(${x}px, ${y}px)`;
                }

                if (options.onUpdate) {
                    options.onUpdate(progress, { x, y });
                }
            },
            onComplete: options.onComplete
        });
    }

    // 카드 하이라이트 애니메이션
    animateCardHighlight(cardElement, options = {}) {
        const id = `cardHighlight_${Date.now()}_${Math.random()}`;

        return this.createAnimation(id, {
            type: 'cardHighlight',
            duration: options.duration || this.defaultDurations.cardHighlight,
            easing: 'easeInOut',
            element: cardElement,
            intensity: options.intensity || 0.5,
            onUpdate: (progress, anim) => {
                // 펄스 효과
                const pulseIntensity = Math.sin(progress * Math.PI * 4) * anim.intensity;
                const scale = 1 + pulseIntensity * 0.1;
                const brightness = 1 + pulseIntensity * 0.3;

                if (anim.element && anim.element.style) {
                    anim.element.style.transform = `scale(${scale})`;
                    anim.element.style.filter = `brightness(${brightness})`;
                }

                if (options.onUpdate) {
                    options.onUpdate(progress, { scale, brightness });
                }
            },
            onComplete: (anim) => {
                if (anim.element && anim.element.style) {
                    anim.element.style.transform = '';
                    anim.element.style.filter = '';
                }
                if (options.onComplete) {
                    options.onComplete();
                }
            }
        });
    }

    // 카드 발동 애니메이션
    animateCardActivation(cardData, position, options = {}) {
        const id = `cardActivation_${Date.now()}_${Math.random()}`;

        return this.createAnimation(id, {
            type: 'cardActivation',
            duration: options.duration || 2000,
            easing: 'easeInOut',
            card: cardData,
            position: position,
            onUpdate: (progress, anim) => {
                // 카드 확대 및 중앙 이동 효과
                const scale = 1 + progress * 0.5;
                const opacity = progress < 0.8 ? 1 : (1 - progress) * 5;

                if (options.onUpdate) {
                    options.onUpdate(progress, { scale, opacity, card: anim.card });
                }
            },
            onComplete: options.onComplete
        });
    }

    // 대미지 숫자 애니메이션
    animateDamageNumber(damage, position, type = 'damage', options = {}) {
        const id = `damageNumber_${Date.now()}_${Math.random()}`;

        // 대미지 숫자 요소 생성
        const numberElement = document.createElement('div');
        numberElement.className = `damage-number ${type}-number animated`;
        numberElement.textContent = type === 'damage' ? `-${damage}` : `+${damage}`;

        // 색상 설정
        const colors = {
            damage: '#ff4444',
            heal: '#44ff44',
            buff: '#4444ff',
            debuff: '#ff8800'
        };
        numberElement.style.color = colors[type] || colors.damage;

        // 초기 위치 설정
        numberElement.style.position = 'absolute';
        numberElement.style.left = position.x + 'px';
        numberElement.style.top = position.y + 'px';
        numberElement.style.pointerEvents = 'none';
        numberElement.style.zIndex = '1000';
        numberElement.style.fontWeight = 'bold';
        numberElement.style.fontSize = '24px';
        numberElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        document.body.appendChild(numberElement);

        return this.createAnimation(id, {
            type: 'damageNumber',
            duration: options.duration || this.defaultDurations.damage,
            easing: 'easeOut',
            element: numberElement,
            startY: position.y,
            onUpdate: (progress, anim) => {
                const y = anim.startY - (progress * 100); // 위로 이동
                const opacity = 1 - progress;
                const scale = 1 + progress * 0.5;

                anim.element.style.transform = `translateY(${y - anim.startY}px) scale(${scale})`;
                anim.element.style.opacity = opacity;
            },
            onComplete: (anim) => {
                if (anim.element && anim.element.parentNode) {
                    anim.element.parentNode.removeChild(anim.element);
                }
                if (options.onComplete) {
                    options.onComplete();
                }
            }
        });
    }

    // 상태이상 효과 애니메이션
    animateStatusEffect(effectType, position, options = {}) {
        const id = `statusEffect_${Date.now()}_${Math.random()}`;

        const effectConfigs = {
            buff: { emoji: '↑', color: '#2ECC71', movement: 'up' },
            debuff: { emoji: '↓', color: '#E74C3C', movement: 'down' },
            heal: { emoji: '♥', color: '#2ECC71', movement: 'pulse' },
            poison: { emoji: '☠', color: '#9B59B6', movement: 'shake' },
            burn: { emoji: '🔥', color: '#E67E22', movement: 'flicker' }
        };

        const config = effectConfigs[effectType] || effectConfigs.buff;

        return this.createAnimation(id, {
            type: 'statusEffect',
            duration: options.duration || this.defaultDurations.statusEffect,
            easing: 'easeInOut',
            effect: effectType,
            position: position,
            config: config,
            onUpdate: (progress, anim) => {
                if (options.onUpdate) {
                    options.onUpdate(progress, anim);
                }
            },
            onComplete: options.onComplete
        });
    }

    // 턴 전환 애니메이션
    animateTurnTransition(fromPlayer, toPlayer, options = {}) {
        const id = `turnTransition_${Date.now()}_${Math.random()}`;

        return this.createAnimation(id, {
            type: 'turnTransition',
            duration: options.duration || this.defaultDurations.turnTransition,
            easing: 'easeInOut',
            fromPlayer: fromPlayer,
            toPlayer: toPlayer,
            onUpdate: (progress, anim) => {
                // 턴 전환 시각적 효과
                if (options.onUpdate) {
                    options.onUpdate(progress, anim);
                }
            },
            onComplete: options.onComplete
        });
    }

    // 애니메이션 시퀀스 생성
    createSequence(id, animations, options = {}) {
        const sequence = {
            id,
            animations: animations.map(anim => ({
                ...anim,
                started: false
            })),
            currentIndex: 0,
            onComplete: options.onComplete,
            delay: options.delay || 0
        };

        this.sequences.set(id, sequence);

        // 딜레이 후 시작
        if (sequence.delay > 0) {
            setTimeout(() => {
                this.start();
            }, sequence.delay);
        } else {
            this.start();
        }

        return sequence;
    }

    // 배틀 액션 시퀀스 (카드 발동 → 피격 → 대미지)
    createBattleActionSequence(card, user, target, result) {
        const sequenceId = `battleAction_${Date.now()}`;

        const userPosition = user === 'player' ?
            GameConfig.ui.playerHand : GameConfig.ui.enemyHand;
        const targetPosition = target === 'player' ?
            GameConfig.ui.playerHand : GameConfig.ui.enemyHand;

        const animations = [
            {
                config: {
                    type: 'cardActivation',
                    duration: 1500,
                    card: card,
                    position: userPosition
                }
            },
            {
                delay: 500,
                config: {
                    type: 'statusEffect',
                    duration: 800,
                    effect: result.success ? 'hit' : 'miss',
                    position: targetPosition
                }
            }
        ];

        if (result.success && result.damage > 0) {
            animations.push({
                delay: 200,
                config: {
                    type: 'damageNumber',
                    duration: 1200,
                    damage: result.damage,
                    position: targetPosition,
                    type: 'damage'
                }
            });
        }

        return this.createSequence(sequenceId, animations);
    }

    // 게임 속도 설정
    setGlobalSpeed(speed) {
        this.globalSpeed = speed;
    }

    // 특정 애니메이션 중지
    stopAnimation(id) {
        if (this.animations.has(id)) {
            const anim = this.animations.get(id);
            if (anim.onComplete) {
                anim.onComplete(anim);
            }
            this.animations.delete(id);
        }
    }

    // 특정 타입의 모든 애니메이션 중지
    stopAnimationsByType(type) {
        this.animations.forEach((anim, id) => {
            if (anim.type === type) {
                this.stopAnimation(id);
            }
        });
    }

    // 모든 애니메이션 중지
    stopAllAnimations() {
        this.animations.forEach((anim, id) => {
            if (anim.onComplete) {
                anim.onComplete(anim);
            }
        });
        this.animations.clear();
        this.sequences.clear();
    }

    // 애니메이션 일시정지
    pause() {
        this.isPlaying = false;
    }

    // 애니메이션 재개
    resume() {
        this.isPlaying = true;
        this.animate();
    }

    // 현재 실행중인 애니메이션 수
    getActiveAnimationCount() {
        return this.animations.size + this.sequences.size;
    }

    // 특정 타입의 애니메이션이 실행중인지 확인
    hasAnimationType(type) {
        for (let anim of this.animations.values()) {
            if (anim.type === type) {
                return true;
            }
        }
        return false;
    }

    // 애니메이션 완료 대기
    waitForAnimationType(type) {
        return new Promise((resolve) => {
            const checkComplete = () => {
                if (!this.hasAnimationType(type)) {
                    resolve();
                } else {
                    setTimeout(checkComplete, 50);
                }
            };
            checkComplete();
        });
    }

    // 모든 애니메이션 완료 대기
    waitForAllAnimations() {
        return new Promise((resolve) => {
            const checkComplete = () => {
                if (this.getActiveAnimationCount() === 0) {
                    resolve();
                } else {
                    setTimeout(checkComplete, 50);
                }
            };
            checkComplete();
        });
    }

    // 정리
    cleanup() {
        this.stop();
        this.stopAllAnimations();
    }
}

// 전역 객체로 등록
window.AnimationManager = AnimationManager;