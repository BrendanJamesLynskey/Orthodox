# Ψαλμὸς Ὀρθόδοξος — Orthodox Chant Synthesizer

A web-based synthesizer that generates ethereal Byzantine Orthodox chant using pure sine waves and the Web Audio API. No samples, no libraries — everything is synthesized in real time in the browser.

![Screenshot](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Spas_vsederzhitel_sinay.jpg/200px-Spas_vsederzhitel_sinay.jpg)

*The app features the 6th-century Christ Pantocrator icon from Saint Catherine's Monastery, Sinai.*

**[Launch the app](https://brendanjameslynskey.github.io/Orthodox/)** — auto-detects your device and recommends desktop or mobile

## Features

- **8 Byzantine Echoi** (modes) with historically-informed interval structures — diatonic, chromatic, and enharmonic genera
- **Ison drone** — shimmering sine cluster with sub-octave and ghost fifth partials
- **Melodic generation** — modal melodic patterns with melismatic rhythm, portamento, and phrase breathing
- **Cathedral reverb** — synthesized impulse response (4–6 second tail with early reflections)
- **Choir voices** (Solo / Small / Full) — voices enter staggered with individual detune, vibrato, and breathing rates; odd voices double at the octave
- **Pure sine tones only** — notes bloom in slowly and dissolve with long release tails
- **Real-time visualizer** — golden frequency bars and waveform display

## Quick Start

```bash
# Clone and serve
git clone https://github.com/YOUR_USERNAME/orthodox-chant.git
cd orthodox-chant
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) and tap **Begin Chant**.

Any static file server works — there is no build step or dependency.

## Mobile Version

`orthodox_chant_mobile.html` is a fully self-contained single file (~210 KB) with the icon image embedded as base64. It is optimized for iPhone (tested on iPhone 16):

- iOS Safari AudioContext unlock on user gesture
- Safe area insets for Dynamic Island and home indicator
- 44px minimum touch targets
- Reduced particle count and FFT size for performance
- Add to Home Screen (PWA-capable)

AirDrop or transfer the single file — no server needed.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page — detects device, links to desktop or mobile |
| `desktop.html` | Desktop web app (multi-file) |
| `style.css` | Orthodox-themed styles (gold, crimson, navy palette) |
| `chant-engine.js` | Audio synthesis engine (Web Audio API) |
| `app.js` | UI controller, visualizer, incense particles |
| `pantocrator.jpg` | 6th-century Christ Pantocrator icon (Wikimedia Commons) |
| `orthodox_chant_mobile.html` | Self-contained mobile version (single file, ~210 KB) |

## Controls

| Control | Description |
|---|---|
| **Tone (Echos)** | Select one of 8 Byzantine modes (A' through Πλ''') |
| **Ison** | Drone volume |
| **Melody** | Melodic voice volume |
| **Reverence** | Wet/dry reverb mix |
| **Tempo** | 30–90 BPM |
| **Choir Voices** | Solo (1), Small (3), or Full (6) layered voices |

## How It Works

The synthesizer uses only `OscillatorNode` (sine type) and native Web Audio nodes:

1. **Drone**: Each choir voice creates 3 sine oscillators (fundamental, sub-octave, ghost fifth) with per-voice detune spread and independent LFO breathing
2. **Melody**: Notes are scheduled from mode-specific melodic patterns with varied rhythm weights. Each note gets a slow attack, gentle sustain, and long exponential release
3. **Reverb**: A `ConvolverNode` with a procedurally generated impulse response simulating a large stone cathedral
4. **Choir effect**: Additional voices are additive (not redistributive) — wider detune, staggered entries, octave doublings, and individual vibrato rates

## Image Attribution

The Christ Pantocrator icon is a 6th-century encaustic painting from Saint Catherine's Monastery, Mount Sinai. Public domain. Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Sinai_icon_of_Christ_Pantocrator).

## License

MIT
