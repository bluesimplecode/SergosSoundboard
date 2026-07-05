// Ein synthetisierter Sound pro DnD-5e-Zauberschule.
window.SpellSchoolsTab = (function () {
  function ctx() {
    return AngelAudio.getSharedContext();
  }

  function playAbjuration(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 300, freqEnd: 900, duration: 0.5, type: 'sine', peak: 0.25, attack: 0.05, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.3, color: 'white', filterType: 'bandpass', freqStart: 1800, Q: 3, peak: 0.2, attack: 0.02, startTime: now + 0.4 });
    NoiseSynth.playToneOneShot(c, { freqStart: 200, freqEnd: 140, duration: 0.4, type: 'sine', peak: 0.3, attack: 0.01, startTime: now + 0.42 });
  }

  function playConjuration(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.7, color: 'white', filterType: 'bandpass', freqStart: 300, freqEnd: 3000, Q: 1, peak: 0.25, attack: 0.3, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.12, color: 'white', filterType: 'lowpass', freqStart: 900, Q: 0.6, peak: 0.3, attack: 0.005, startTime: now + 0.68 });
  }

  function playDivination(c) {
    const now = c.currentTime;
    [660, 880, 1100, 1320, 1760].forEach((f, i) => {
      NoiseSynth.playToneOneShot(c, { freqStart: f, duration: 0.6, type: 'sine', peak: 0.16, attack: 0.01, startTime: now + i * 0.1 });
    });
  }

  function playEnchantment(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 700, freqEnd: 400, duration: 1.1, type: 'sine', peak: 0.22, attack: 0.08, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 705, freqEnd: 404, duration: 1.1, type: 'sine', peak: 0.18, attack: 0.08, detune: 8, startTime: now + 0.03 });
  }

  function playEvocation(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.15, color: 'white', filterType: 'highpass', freqStart: 1500, Q: 0.5, peak: 0.45, attack: 0.004, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 200, freqEnd: 900, duration: 0.3, type: 'sawtooth', peak: 0.25, attack: 0.01, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 900, freqEnd: 150, duration: 0.35, type: 'sawtooth', peak: 0.2, attack: 0.01, startTime: now + 0.28 });
  }

  function playIllusion(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 500, freqEnd: 560, duration: 1.3, type: 'triangle', peak: 0.16, attack: 0.2, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 505, freqEnd: 565, duration: 1.3, type: 'triangle', peak: 0.14, attack: 0.2, detune: -20, startTime: now + 0.06 });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.0, color: 'pink', filterType: 'bandpass', freqStart: 2000, freqEnd: 1000, Q: 1.5, peak: 0.1, attack: 0.3, startTime: now });
  }

  function playNecromancy(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 130, freqEnd: 55, duration: 1.8, type: 'sawtooth', peak: 0.22, attack: 0.2, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 138, freqEnd: 58, duration: 1.8, type: 'sawtooth', peak: 0.16, attack: 0.25, detune: -30, startTime: now + 0.05 });
    for (let i = 0; i < 3; i++) {
      NoiseSynth.playNoiseOneShot(c, { duration: 0.08, color: 'white', filterType: 'highpass', freqStart: 2500, Q: 2, peak: 0.12, attack: 0.005, startTime: now + 0.3 + i * 0.25 });
    }
  }

  function playTransmutation(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.3, color: 'pink', filterType: 'bandpass', freqStart: 400, freqEnd: 3000, Q: 1.2, peak: 0.28, attack: 0.1, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 220, freqEnd: 660, duration: 1.0, type: 'triangle', peak: 0.18, attack: 0.15, startTime: now + 0.1 });
  }

  const SCHOOLS = [
    { id: 'abjuration', label: 'Bannmagie', color: '#4a90d9', play: playAbjuration },
    { id: 'conjuration', label: 'Beschwörung', color: '#f0a83c', play: playConjuration },
    { id: 'divination', label: 'Erkenntnismagie', color: '#9fd8ff', play: playDivination },
    { id: 'enchantment', label: 'Verzauberung', color: '#f06fae', play: playEnchantment },
    { id: 'evocation', label: 'Hervorrufung', color: '#ff4d4d', play: playEvocation },
    { id: 'illusion', label: 'Illusion', color: '#b06fe0', play: playIllusion },
    { id: 'necromancy', label: 'Nekromantie', color: '#4a6b4a', play: playNecromancy },
    { id: 'transmutation', label: 'Verwandlung', color: '#7cd992', play: playTransmutation },
  ];

  let gridEl;

  function onButtonClick(school, el) {
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 400);
    school.play(ctx());
  }

  function init() {
    gridEl = document.getElementById('schoolsGrid');
    SCHOOLS.forEach((school) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'school-btn';
      button.style.setProperty('--school-color', school.color);
      button.textContent = school.label;
      button.addEventListener('click', () => onButtonClick(school, button));
      gridEl.appendChild(button);
    });
  }

  return { init };
})();
