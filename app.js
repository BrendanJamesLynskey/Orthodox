/**
 * Orthodox Chant Synthesizer — UI Controller
 */

const engine = new ChantEngine();
let animationId = null;
let isChanting = false;

// === Transport ===

async function toggleChant() {
    const btn = document.getElementById('btnChant');
    const icon = document.getElementById('mainIcon');

    if (!isChanting) {
        await engine.start();
        isChanting = true;
        btn.classList.add('playing');
        btn.querySelector('.btn-text').textContent = 'Rest';
        btn.querySelector('.btn-icon').textContent = '\u25A0'; // Stop square
        icon.classList.add('active');
        startVisualization();
        startIncense();
    } else {
        engine.stop();
        isChanting = false;
        btn.classList.remove('playing');
        btn.querySelector('.btn-text').textContent = 'Begin Chant';
        btn.querySelector('.btn-icon').textContent = '\u266A';
        icon.classList.remove('active');
        stopVisualization();
    }
}

// === Mode Selection ===

function setMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
    engine.setMode(mode);
}

// === Choir Voices ===

function setVoices(count) {
    document.querySelectorAll('.choir-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.choir-btn[data-voices="${count}"]`).classList.add('active');
    engine.setVoices(count);
}

// === Slider Updates ===

function updateDrone() {
    const val = document.getElementById('droneVol').value / 100;
    engine.setDroneVolume(val);
}

function updateMelody() {
    const val = document.getElementById('melodyVol').value / 100;
    engine.setMelodyVolume(val);
}

function updateReverb() {
    const val = document.getElementById('reverbMix').value / 100;
    engine.setReverbMix(val);
}

function updateTempo() {
    engine.setTempo(parseInt(document.getElementById('tempoSlider').value));
}

// === Visualization ===

function startVisualization() {
    const canvas = document.getElementById('vizCanvas');
    const ctx = canvas.getContext('2d');

    // Set actual canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    function draw() {
        animationId = requestAnimationFrame(draw);

        const waveData = engine.getAnalyserData();
        const freqData = engine.getFrequencyData();
        if (!waveData || !freqData) return;

        // Clear with deep navy
        ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Draw frequency bars as soft golden light — like candlelight
        const barCount = 64;
        const barWidth = width / barCount;
        const freqStep = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
            const value = freqData[i * freqStep] / 255;
            const barHeight = value * height * 0.7;

            const x = i * barWidth;

            // Golden gradient bars
            const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
            gradient.addColorStop(0, `rgba(200, 168, 78, ${0.1 + value * 0.4})`);
            gradient.addColorStop(0.5, `rgba(255, 215, 0, ${value * 0.3})`);
            gradient.addColorStop(1, `rgba(139, 0, 0, ${value * 0.2})`);

            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);

            // Glow on top
            if (value > 0.3) {
                ctx.beginPath();
                ctx.arc(x + barWidth / 2, height - barHeight, 3 + value * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${value * 0.3})`;
                ctx.fill();
            }
        }

        // Draw waveform as flowing golden line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200, 168, 78, 0.6)';
        ctx.lineWidth = 1.5;

        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
            const v = waveData[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.stroke();

        // Decorative cross overlay in center (subtle)
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(200, 168, 78, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 30);
        ctx.lineTo(cx, cy + 30);
        ctx.moveTo(cx - 20, cy - 10);
        ctx.lineTo(cx + 20, cy - 10);
        ctx.stroke();
    }

    draw();
}

function stopVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Fade out canvas
    const canvas = document.getElementById('vizCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    let alpha = 1;
    function fadeOut() {
        ctx.fillStyle = `rgba(10, 10, 26, 0.05)`;
        ctx.fillRect(0, 0, width, height);
        alpha -= 0.02;
        if (alpha > 0) requestAnimationFrame(fadeOut);
    }
    fadeOut();
}

// === Incense Smoke Particles ===

let incenseInterval = null;

function startIncense() {
    const container = document.getElementById('incenseContainer');
    if (incenseInterval) return;

    incenseInterval = setInterval(() => {
        if (!isChanting) return;
        createSmokeParticle(container);
    }, 300);
}

function createSmokeParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';

    // Random start position at bottom
    const startX = 30 + Math.random() * (window.innerWidth - 60);
    particle.style.left = startX + 'px';
    particle.style.bottom = '0px';

    // Random drift
    const drift = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--drift', drift + 'px');

    // Random duration
    const duration = 6 + Math.random() * 8;
    particle.style.animationDuration = duration + 's';

    // Random size
    const size = 3 + Math.random() * 5;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    container.appendChild(particle);

    // Clean up after animation
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

// === Window resize handler for canvas ===

window.addEventListener('resize', () => {
    if (isChanting) {
        stopVisualization();
        startVisualization();
    }
});

// === Init canvas on load ===

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('vizCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw idle state
    ctx.fillStyle = 'rgba(10, 10, 26, 1)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw subtle cross
    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    ctx.strokeStyle = 'rgba(200, 168, 78, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.lineTo(cx, cy + 40);
    ctx.moveTo(cx - 25, cy - 15);
    ctx.lineTo(cx + 25, cy - 15);
    ctx.stroke();

    // "Click to begin" hint
    ctx.font = '14px Cinzel, serif';
    ctx.fillStyle = 'rgba(200, 168, 78, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('Press "Begin Chant" to start', cx, cy + 65);
});
