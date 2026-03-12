/**
 * Orthodox Chant Synthesis Engine — Pure & Ephemeral
 *
 * Uses Web Audio API to generate ethereal Byzantine-style chant with:
 * - Pure sine wave tones only
 * - Long, slow fades — notes bloom and dissolve like incense
 * - Ison (drone) as a shimmering sine cluster
 * - Modal melodic patterns based on the 8 Byzantine Echoi
 * - Deep cathedral reverb
 * - Choir effect through gently detuned sine layers
 */

class ChantEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.currentMode = 1;
        this.numVoices = 1;
        this.tempo = 55;
        this.droneVolume = 0.6;
        this.melodyVolume = 0.7;
        this.reverbMix = 0.65;

        this.droneNodes = [];
        this.melodyTimeout = null;
        this.melodyNodes = [];

        this.masterGain = null;
        this.droneGain = null;
        this.melodyGain = null;
        this.reverbGain = null;
        this.dryGain = null;
        this.convolver = null;
        this.analyser = null;

        // Base pitch — A2 for a deep, grounding drone
        this.basePitch = 110;

        // The 8 Echoi (Byzantine modes)
        this.echoi = {
            1: {
                intervals: [0, 200, 400, 500, 700, 900, 1100, 1200],
                melodicPattern: [0, 2, 4, 3, 2, 4, 5, 4, 3, 2, 1, 0],
                finalis: 0, name: "Protos"
            },
            2: {
                intervals: [0, 100, 400, 500, 700, 800, 1100, 1200],
                melodicPattern: [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 2, 1, 0],
                finalis: 0, name: "Deuteros"
            },
            3: {
                intervals: [0, 150, 350, 500, 700, 850, 1050, 1200],
                melodicPattern: [0, 2, 3, 4, 5, 4, 3, 4, 3, 2, 1, 0],
                finalis: 0, name: "Tritos"
            },
            4: {
                intervals: [0, 200, 350, 500, 700, 900, 1050, 1200],
                melodicPattern: [4, 3, 2, 3, 4, 5, 4, 3, 2, 1, 0, 1, 2, 0],
                finalis: 0, name: "Tetartos"
            },
            5: {
                intervals: [0, 200, 400, 500, 700, 900, 1100, 1200],
                melodicPattern: [0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0],
                finalis: 0, name: "Plagal Protos"
            },
            6: {
                intervals: [0, 100, 400, 500, 700, 800, 1100, 1200],
                melodicPattern: [0, 1, 2, 1, 0, 1, 3, 2, 1, 0],
                finalis: 0, name: "Plagal Deuteros"
            },
            7: {
                intervals: [0, 200, 300, 500, 700, 800, 1000, 1200],
                melodicPattern: [0, 2, 3, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1, 0],
                finalis: 0, name: "Barys"
            },
            8: {
                intervals: [0, 200, 400, 500, 700, 900, 1000, 1200],
                melodicPattern: [0, 2, 4, 5, 4, 2, 3, 4, 3, 2, 1, 0],
                finalis: 0, name: "Plagal Tetartos"
            }
        };

        this.melodyPosition = 0;
    }

    async init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.ctx.destination);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.9;
        this.masterGain.connect(this.analyser);

        await this.createReverb();

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = this.droneVolume;

        this.melodyGain = this.ctx.createGain();
        this.melodyGain.gain.value = this.melodyVolume;

        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 1 - this.reverbMix;

        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = this.reverbMix;

        this.droneGain.connect(this.dryGain);
        this.droneGain.connect(this.convolver);
        this.melodyGain.connect(this.dryGain);
        this.melodyGain.connect(this.convolver);

        this.dryGain.connect(this.masterGain);
        this.reverbGain.connect(this.masterGain);
        this.convolver.connect(this.reverbGain);
    }

    async createReverb() {
        // Long, deep cathedral impulse — 6 seconds for maximum ethereality
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 6;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                // Very slow, smooth decay — cathedral stone
                const envelope =
                    Math.exp(-t * 0.6) * 0.3 +
                    Math.exp(-t * 0.3) * 0.4 +
                    Math.exp(-t * 0.15) * 0.2;

                data[i] = (Math.random() * 2 - 1) * envelope;

                // Sparse early reflections for spaciousness
                if (i < sampleRate * 0.15) {
                    const reflections = [0.008, 0.019, 0.031, 0.048, 0.067, 0.089, 0.112, 0.138];
                    for (const delay of reflections) {
                        const sampleDelay = Math.floor(delay * sampleRate);
                        if (i === sampleDelay) {
                            data[i] += (Math.random() * 2 - 1) * 0.25;
                        }
                    }
                }
            }
        }

        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = impulse;
    }

    centsToFreq(basePitch, cents) {
        return basePitch * Math.pow(2, cents / 1200);
    }

    /**
     * Drone — pure sine tones forming a shimmering ison.
     * Each voice is a cluster of very slightly detuned sines
     * that fade in like a breath and shimmer gently.
     */
    startDrone() {
        this.stopDrone();
        const mode = this.echoi[this.currentMode];
        const droneFreq = this.centsToFreq(this.basePitch, mode.intervals[mode.finalis]);

        // More voices = richer and louder (choir grows, not just redistributes)
        // Solo: one clean tone. Small: warm chorus. Full: vast cathedral choir.
        const volPerVoice = [
            0.18,  // v=0 (always present)
            0.14,  // v=1
            0.12,  // v=2
            0.10,  // v=3
            0.09,  // v=4
            0.08,  // v=5
        ];

        for (let v = 0; v < this.numVoices; v++) {
            // Wide detune spread — each singer is distinct
            const detuneCents = (v - (this.numVoices - 1) / 2) * 12 + (Math.random() - 0.5) * 6;
            const baseVol = volPerVoice[Math.min(v, volPerVoice.length - 1)];

            // Each voice gets slightly different partials for timbral variety
            const partials = [
                { ratio: 1.0, vol: 1.0 },
                { ratio: 0.5, vol: 0.25 + v * 0.03 },  // sub-octave grows with choir
                { ratio: 1.498, vol: 0.05 + v * 0.02 }, // fifth hint grows with choir
            ];

            // Odd-numbered voices sing an octave higher (tenor vs bass)
            const octaveShift = (v > 0 && v % 2 === 1) ? 2.0 : 1.0;

            const voiceGain = this.ctx.createGain();
            voiceGain.gain.setValueAtTime(0, this.ctx.currentTime);
            // Staggered entries — voices join one by one like real singers
            const entryDelay = 2 + v * 1.2;
            voiceGain.gain.linearRampToValueAtTime(baseVol, this.ctx.currentTime + entryDelay + 2);
            voiceGain.connect(this.droneGain);

            const oscillators = [];

            for (const partial of partials) {
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = droneFreq * partial.ratio * octaveShift;
                osc.detune.value = detuneCents + (Math.random() - 0.5) * 4;

                const partialGain = this.ctx.createGain();
                partialGain.gain.value = partial.vol;

                osc.connect(partialGain);
                partialGain.connect(voiceGain);
                osc.start(this.ctx.currentTime + entryDelay);
                oscillators.push(osc);
            }

            // Each voice breathes at its own rate
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.06 + v * 0.025 + Math.random() * 0.03;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = baseVol * 0.2;
            lfo.connect(lfoGain);
            lfoGain.connect(voiceGain.gain);
            lfo.start();

            this.droneNodes.push({ oscillators, lfo, voiceGain, lfoGain });
        }
    }

    stopDrone() {
        const now = this.ctx ? this.ctx.currentTime : 0;
        for (const node of this.droneNodes) {
            try {
                // Slow fade out — 3 seconds
                node.voiceGain.gain.cancelScheduledValues(now);
                node.voiceGain.gain.setValueAtTime(node.voiceGain.gain.value, now);
                node.voiceGain.gain.linearRampToValueAtTime(0, now + 3);
                setTimeout(() => {
                    try {
                        for (const osc of node.oscillators) osc.stop();
                        node.lfo.stop();
                    } catch (e) {}
                }, 4000);
            } catch (e) {}
        }
        this.droneNodes = [];
    }

    startMelody() {
        this.melodyPosition = 0;
        this.scheduleMelodyNote();
    }

    stopMelody() {
        if (this.melodyTimeout) {
            clearTimeout(this.melodyTimeout);
            this.melodyTimeout = null;
        }
        const now = this.ctx.currentTime;
        for (const node of this.melodyNodes) {
            try {
                node.gain.gain.cancelScheduledValues(now);
                node.gain.gain.setValueAtTime(node.gain.gain.value, now);
                node.gain.gain.linearRampToValueAtTime(0, now + 1.5);
                setTimeout(() => {
                    try { node.osc.stop(); } catch (e) {}
                }, 2000);
            } catch (e) {}
        }
        this.melodyNodes = [];
    }

    scheduleMelodyNote() {
        if (!this.isPlaying) return;

        const mode = this.echoi[this.currentMode];
        const pattern = mode.melodicPattern;
        const degree = pattern[this.melodyPosition % pattern.length];
        const freq = this.centsToFreq(this.basePitch, mode.intervals[degree % mode.intervals.length]);
        const octaveShift = degree >= mode.intervals.length ? 2 : 1;
        const finalFreq = freq * octaveShift;

        const beatDuration = 60 / this.tempo;
        // Longer, more meditative rhythm
        const rhythmWeights = [1.5, 1.0, 2.0, 1.2, 0.8, 1.8, 1.0, 1.3];
        const rhythmMult = rhythmWeights[this.melodyPosition % rhythmWeights.length];
        const noteDuration = beatDuration * rhythmMult;

        // Occasional portamento (gentle slide between notes)
        const prevDegree = pattern[(this.melodyPosition - 1 + pattern.length) % pattern.length];
        const prevFreq = this.centsToFreq(this.basePitch, mode.intervals[prevDegree % mode.intervals.length]);
        const usePortamento = Math.abs(degree - prevDegree) <= 2 && Math.random() < 0.4;

        this.playMelodyNote(finalFreq, noteDuration, usePortamento ? prevFreq : null);

        this.melodyPosition++;

        // Longer pauses between phrases — space to breathe
        const isPhraseEnd = this.melodyPosition % pattern.length === 0;
        const pauseTime = isPhraseEnd ? beatDuration * 1.5 : beatDuration * 0.15;

        this.melodyTimeout = setTimeout(() => {
            this.scheduleMelodyNote();
        }, (noteDuration + pauseTime) * 1000);
    }

    /**
     * Play a single melody note as pure sine tones.
     * Notes bloom in slowly and dissolve with long tails.
     */
    playMelodyNote(freq, duration, slideFromFreq) {
        const now = this.ctx.currentTime;
        const voiceCount = Math.min(this.numVoices, 6);

        // Volume per voice — additive, so choir gets genuinely louder/richer
        const melodyVolPerVoice = [0.15, 0.11, 0.09, 0.08, 0.07, 0.06];

        for (let v = 0; v < voiceCount; v++) {
            // Wide detune — each singer has their own pitch center
            const detune = (v - (voiceCount - 1) / 2) * 14 + (Math.random() - 0.5) * 8;

            // Stagger note onsets slightly — real singers don't attack in perfect sync
            const onsetJitter = v * 0.04 + Math.random() * 0.03;

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';

            // Odd voices above v=0 can sing an octave up
            const voiceOctave = (v > 0 && v % 3 === 0) ? 2.0 : 1.0;
            const voiceFreq = freq * voiceOctave;

            if (slideFromFreq) {
                osc.frequency.setValueAtTime(slideFromFreq * voiceOctave, now + onsetJitter);
                osc.frequency.exponentialRampToValueAtTime(voiceFreq, now + onsetJitter + 0.3);
            } else {
                osc.frequency.value = voiceFreq;
            }

            osc.detune.value = detune;

            const gain = this.ctx.createGain();
            const baseVol = melodyVolPerVoice[Math.min(v, melodyVolPerVoice.length - 1)];

            const attackTime = Math.min(0.6, duration * 0.25) + onsetJitter;
            const releaseTime = duration * 0.5;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(baseVol, now + attackTime);
            gain.gain.setValueAtTime(baseVol * 0.85, now + duration * 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration + releaseTime);
            gain.gain.linearRampToValueAtTime(0, now + duration + releaseTime + 0.05);

            // Each voice has its own vibrato rate — creates living, breathing texture
            if (duration > 0.8) {
                const vibrato = this.ctx.createOscillator();
                vibrato.type = 'sine';
                vibrato.frequency.value = 3.0 + v * 0.5 + Math.random() * 1.5;
                const vibratoDepth = this.ctx.createGain();
                vibratoDepth.gain.value = voiceFreq * (0.002 + v * 0.0005);
                vibrato.connect(vibratoDepth);
                vibratoDepth.connect(osc.frequency);
                vibrato.start(now);
                vibrato.stop(now + duration + releaseTime);
            }

            // Ghost octave shimmer on first voice only
            if (v === 0 && Math.random() < 0.3) {
                const ghost = this.ctx.createOscillator();
                ghost.type = 'sine';
                ghost.frequency.value = freq * 2;
                const ghostGain = this.ctx.createGain();
                ghostGain.gain.setValueAtTime(0, now);
                ghostGain.gain.linearRampToValueAtTime(baseVol * 0.06, now + attackTime * 1.5);
                ghostGain.gain.exponentialRampToValueAtTime(0.001, now + duration + releaseTime);
                ghost.connect(ghostGain);
                ghostGain.connect(this.melodyGain);
                ghost.start(now);
                ghost.stop(now + duration + releaseTime + 0.1);
            }

            osc.connect(gain);
            gain.connect(this.melodyGain);

            osc.start(now + onsetJitter);
            osc.stop(now + duration + releaseTime + 0.1);

            const noteNode = { osc, gain };
            this.melodyNodes.push(noteNode);

            setTimeout(() => {
                const idx = this.melodyNodes.indexOf(noteNode);
                if (idx > -1) this.melodyNodes.splice(idx, 1);
            }, (duration + releaseTime + 0.2) * 1000);
        }
    }

    async start() {
        await this.init();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        this.isPlaying = true;
        this.startDrone();
        // Melody enters after the drone has breathed in
        setTimeout(() => {
            if (this.isPlaying) this.startMelody();
        }, 3000);
    }

    stop() {
        this.isPlaying = false;
        this.stopMelody();
        this.stopDrone();
    }

    setMode(mode) {
        this.currentMode = mode;
        if (this.isPlaying) {
            this.stopDrone();
            this.stopMelody();
            this.melodyPosition = 0;
            setTimeout(() => {
                if (this.isPlaying) {
                    this.startDrone();
                    setTimeout(() => {
                        if (this.isPlaying) this.startMelody();
                    }, 2000);
                }
            }, 1500);
        }
    }

    setVoices(count) {
        this.numVoices = count;
        if (this.isPlaying) {
            this.stopDrone();
            setTimeout(() => {
                if (this.isPlaying) this.startDrone();
            }, 500);
        }
    }

    setDroneVolume(value) {
        this.droneVolume = value;
        if (this.droneGain) {
            this.droneGain.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.3);
        }
    }

    setMelodyVolume(value) {
        this.melodyVolume = value;
        if (this.melodyGain) {
            this.melodyGain.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.3);
        }
    }

    setReverbMix(value) {
        this.reverbMix = value;
        if (this.reverbGain && this.dryGain) {
            const now = this.ctx.currentTime;
            this.reverbGain.gain.linearRampToValueAtTime(value, now + 0.3);
            this.dryGain.gain.linearRampToValueAtTime(1 - value * 0.5, now + 0.3);
        }
    }

    setTempo(bpm) {
        this.tempo = bpm;
    }

    getAnalyserData() {
        if (!this.analyser) return null;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(data);
        return data;
    }

    getFrequencyData() {
        if (!this.analyser) return null;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        return data;
    }
}
