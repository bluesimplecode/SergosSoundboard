// Ein synthetisierter Sound pro DnD-5e-Zauberschule.
window.SpellSchoolsTab = (function () {
  function ctx() {
    return AngelAudio.getSharedContext();
  }

  function playAbjuration(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.3, color: 'white', filterType: 'lowpass', freqStart: 1200, freqEnd: 200, Q: 0.6, peak: 0.25, attack: 0.02, startTime: now });
    // dumpfes Einrasten (wie ein zufallender Schild) statt Glockenton
    NoiseSynth.playNoiseOneShot(c, { duration: 0.15, color: 'brown', filterType: 'bandpass', freqStart: 220, Q: 4, peak: 0.35, attack: 0.005, startTime: now + 0.28 });
    NoiseSynth.playToneOneShot(c, { freqStart: 130, freqEnd: 90, duration: 0.25, type: 'sine', peak: 0.25, attack: 0.005, startTime: now + 0.28 });
  }

  function playConjuration(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.7, color: 'white', filterType: 'bandpass', freqStart: 300, freqEnd: 3000, Q: 1, peak: 0.25, attack: 0.3, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.12, color: 'white', filterType: 'lowpass', freqStart: 900, Q: 0.6, peak: 0.3, attack: 0.005, startTime: now + 0.68 });
  }

  function playDivination(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.2, color: 'pink', filterType: 'bandpass', freqStart: 600, freqEnd: 3000, Q: 1.0, peak: 0.22, attack: 0.3, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.0, color: 'white', filterType: 'highpass', freqStart: 5000, Q: 0.5, peak: 0.1, attack: 0.35, startTime: now + 0.1 });
    NoiseSynth.playToneOneShot(c, { freqStart: 260, freqEnd: 300, duration: 1.0, type: 'sine', peak: 0.08, attack: 0.3, startTime: now });
  }

  function playEnchantment(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 600, freqEnd: 350, duration: 1.2, type: 'sine', peak: 0.2, attack: 0.1, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 604, freqEnd: 353, duration: 1.2, type: 'sine', peak: 0.16, attack: 0.1, detune: 8, startTime: now + 0.03 });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.0, color: 'pink', filterType: 'bandpass', freqStart: 800, freqEnd: 400, Q: 1.5, peak: 0.08, attack: 0.15, startTime: now });
  }

  function playEvocation(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 0.1, color: 'white', filterType: 'highpass', freqStart: 2000, Q: 0.5, peak: 0.5, attack: 0.003, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 90, freqEnd: 40, duration: 0.35, type: 'sine', peak: 0.35, attack: 0.004, startTime: now });
    NoiseSynth.playNoiseOneShot(c, { duration: 0.6, color: 'brown', filterType: 'lowpass', freqStart: 1200, freqEnd: 250, Q: 0.4, peak: 0.3, attack: 0.02, startTime: now + 0.02 });
  }

  function playIllusion(c) {
    const now = c.currentTime;
    NoiseSynth.playToneOneShot(c, { freqStart: 500, freqEnd: 560, duration: 1.3, type: 'sine', peak: 0.14, attack: 0.25, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 505, freqEnd: 565, duration: 1.3, type: 'sine', peak: 0.12, attack: 0.25, detune: -20, startTime: now + 0.06 });
    NoiseSynth.playNoiseOneShot(c, { duration: 1.2, color: 'pink', filterType: 'bandpass', freqStart: 2200, freqEnd: 900, Q: 1.5, peak: 0.12, attack: 0.3, startTime: now });
  }

  function playNecromancy(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.9, color: 'brown', filterType: 'lowpass', freqStart: 220, freqEnd: 80, Q: 0.5, peak: 0.32, attack: 0.25, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 85, freqEnd: 48, duration: 1.9, type: 'sine', peak: 0.15, attack: 0.3, startTime: now });
    for (let i = 0; i < 3; i++) {
      NoiseSynth.playNoiseOneShot(c, { duration: 0.08, color: 'white', filterType: 'highpass', freqStart: 2500, Q: 2, peak: 0.1, attack: 0.005, startTime: now + 0.3 + i * 0.25 });
    }
  }

  function playTransmutation(c) {
    const now = c.currentTime;
    NoiseSynth.playNoiseOneShot(c, { duration: 1.3, color: 'pink', filterType: 'bandpass', freqStart: 400, freqEnd: 3000, Q: 1.2, peak: 0.28, attack: 0.1, startTime: now });
    NoiseSynth.playToneOneShot(c, { freqStart: 220, freqEnd: 660, duration: 1.0, type: 'sine', peak: 0.15, attack: 0.15, startTime: now + 0.1 });
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
