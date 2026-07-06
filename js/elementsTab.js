// Ein synthetisierter Sound pro DnD-5e-Schadensart, plus "Explosion".
window.ElementsTab = (function () {
  function ctx() {
    return AngelAudio.getSharedContext();
  }

  function playAcid(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.3, color: 'white', filterType: 'bandpass', freqStart: 3200, freqEnd: 1200, Q: 0.7, peak: 0.28, attack: 0.05, startTime: now });
    for (let i = 0; i < 6; i++) {
      const t = now + 0.1 + Math.random() * 1.0;
      const freq = 900 + Math.random() * 2000;
      NoiseSynth.playNoiseOneShot(c, { duration: 0.12, color: 'white', filterType: 'bandpass', freqStart: freq, Q: 8, peak: 0.18, attack: 0.005, startTime: t });
    }
  }

  function playCold(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.4, color: 'white', filterType: 'bandpass', freqStart: 5000, freqEnd: 2000, Q: 1.2, peak: 0.22, attack: 0.1, startTime: now });
    // knackendes Eis statt Glockenton
    NoiseSynth.playNoiseOneShot(c, { duration: 0.08, color: 'white', filterType: 'highpass', freqStart: 4500, Q: 3, peak: 0.3, attack: 0.003, startTime: now + 0.15 });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.06, color: 'white', filterType: 'highpass', freqStart: 3800, Q: 3, peak: 0.22, attack: 0.003, startTime: now + 0.4 });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.05, color: 'white', filterType: 'highpass', freqStart: 5200, Q: 3, peak: 0.18, attack: 0.002, startTime: now + 0.58 });
  }

  function playFire(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.4, color: 'brown', filterType: 'lowpass', freqStart: 2500, freqEnd: 500, Q: 0.5, peak: 0.4, attack: 0.03, startTime: now });
    for (let i = 0; i < 8; i++) {
      const t = now + Math.random() * 1.2;
      NoiseSynth.playNoiseOneShot(c, { duration: 0.06, color: 'white', filterType: 'highpass', freqStart: 2500, Q: 1, peak: 0.15, attack: 0.002, startTime: t });
    }
  }

  function playForce(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.25, color: 'white', filterType: 'lowpass', freqStart: 1500, freqEnd: 150, Q: 0.6, peak: 0.35, attack: 0.004, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 120, freqEnd: 45, duration: 0.3, type: 'sine', peak: 0.4, attack: 0.003, startTime: now });
  }

  function playLightning(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.18, color: 'white', filterType: 'highpass', freqStart: 2500, Q: 0.4, peak: 0.5, attack: 0.002, startTime: now });
    for (let i = 0; i < 10; i++) {
      const t = now + Math.random() * 0.3;
      NoiseSynth.playNoiseOneShot(c, { duration: 0.02, color: 'white', filterType: 'highpass', freqStart: 3000 + Math.random() * 3000, Q: 1, peak: 0.15, attack: 0.001, startTime: t });
    }
    NoiseSynth.playNoiseOneShot(c, { duration: 1.0, color: 'brown', filterType: 'lowpass', freqStart: 300, Q: 0.4, peak: 0.25, attack: 0.05, startTime: now + 0.05 });
  }

  function playNecrotic(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 2.0, color: 'brown', filterType: 'lowpass', freqStart: 220, freqEnd: 80, Q: 0.5, peak: 0.35, attack: 0.25, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 90, freqEnd: 50, duration: 2.0, type: 'sine', peak: 0.15, attack: 0.3, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 92, freqEnd: 51, duration: 2.0, type: 'sine', peak: 0.12, attack: 0.35, detune: -15, startTime: now + 0.05 });
  }

  function playPoison(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.6, color: 'brown', filterType: 'bandpass', freqStart: 900, freqEnd: 300, Q: 0.6, peak: 0.28, attack: 0.15, startTime: now });
    for (let i = 0; i < 4; i++) {
      const t = now + 0.2 + Math.random() * 1.1;
      NoiseSynth.playNoiseOneShot(c, { duration: 0.15, color: 'white', filterType: 'bandpass', freqStart: 500 + Math.random() * 600, Q: 6, peak: 0.15, attack: 0.01, startTime: t });
    }
  }

  function playPsychic(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.4, color: 'pink', filterType: 'bandpass', freqStart: 1200, freqEnd: 2200, Q: 2, peak: 0.18, attack: 0.2, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 300, freqEnd: 340, duration: 1.3, type: 'sine', peak: 0.1, attack: 0.25, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 302, freqEnd: 342, duration: 1.3, type: 'sine', peak: 0.09, attack: 0.25, detune: 15, startTime: now + 0.04 });
  }

  function playRadiant(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.6, color: 'white', filterType: 'bandpass', freqStart: 800, freqEnd: 4500, Q: 0.8, peak: 0.3, attack: 0.4, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.3, color: 'white', filterType: 'highpass', freqStart: 6000, Q: 0.5, peak: 0.12, attack: 0.3, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 220, freqEnd: 240, duration: 1.3, type: 'sine', peak: 0.1, attack: 0.3, startTime: now });
  }

  function playThunder(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.2, color: 'white', filterType: 'highpass', freqStart: 1200, Q: 0.5, peak: 0.4, attack: 0.005, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.6, color: 'brown', filterType: 'lowpass', freqStart: 250, Q: 0.4, peak: 0.35, attack: 0.05, startTime: now + 0.05 });
  }

  function playExplosion(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 55, freqEnd: 35, duration: 0.8, type: 'sine', peak: 0.5, attack: 0.005, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.15, color: 'white', filterType: 'highpass', freqStart: 2000, Q: 0.4, peak: 0.5, attack: 0.003, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 2.2, color: 'brown', filterType: 'lowpass', freqStart: 1800, freqEnd: 200, Q: 0.4, peak: 0.45, attack: 0.02, startTime: now + 0.02 });
  }

  const ELEMENTS = [
    { id: 'acid', label: 'Säure', color: '#8fc93a', play: playAcid },
    { id: 'cold', label: 'Kälte', color: '#7fd7f0', play: playCold },
    { id: 'fire', label: 'Feuer', color: '#ff6a1a', play: playFire },
    { id: 'force', label: 'Kraft', color: '#8a5cff', play: playForce },
    { id: 'lightning', label: 'Blitz', color: '#ffe066', play: playLightning },
    { id: 'necrotic', label: 'Nekrotisch', color: '#5c3a70', play: playNecrotic },
    { id: 'poison', label: 'Gift', color: '#6a8f2f', play: playPoison },
    { id: 'psychic', label: 'Psychisch', color: '#d94ff0', play: playPsychic },
    { id: 'radiant', label: 'Strahlend', color: '#ffd76a', play: playRadiant },
    { id: 'thunder', label: 'Donner', color: '#6b7fa8', play: playThunder },
    { id: 'explosion', label: 'Explosion', color: '#ff3b1f', play: playExplosion },
  ];

  let gridEl;

  function onButtonClick(btn, el) {
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 350);
    btn.play(ctx());
  }

  function init() {
    gridEl = document.getElementById('elementsGrid');
    ELEMENTS.forEach((el) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'element-btn';
      button.style.setProperty('--element-color', el.color);
      button.textContent = el.label;
      button.addEventListener('click', () => onButtonClick(el, button));
      gridEl.appendChild(button);
    });
  }

  return { init };
})();
