// Gemeinsame Helfer zur Audio-Synthese (kein Sample-Material, alles generiert).
window.NoiseSynth = (function () {

  function createNoiseBuffer(ctx, seconds, color) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (color === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else if (color === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      }
    } else {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // Synthetische Impulsantwort für Hall (kein IR-Sample nötig).
  function createReverbImpulse(ctx, seconds, decay) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  // Einmaliger gefilterter Rauschstoß (z.B. Zischen, Wind, Krachen).
  function playNoiseOneShot(ctx, opts) {
    const {
      duration = 1.0,
      color = 'white',
      filterType = 'bandpass',
      freqStart = 1000,
      freqEnd = freqStart,
      Q = 0.7,
      peak = 0.4,
      attack = 0.02,
      startTime = ctx.currentTime,
      dest = ctx.destination,
    } = opts || {};
    const now = startTime;
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, duration + 0.15, color);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = Q;
    filter.frequency.setValueAtTime(Math.max(20, freqStart), now);
    if (freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration * 0.9);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0005, now + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(now);
    src.stop(now + duration + 0.15);
    return { src, filter, gain: g };
  }

  // Einmaliger Ton mit Tonhöhenverlauf (z.B. Zap, Glocke, Sirene).
  function playToneOneShot(ctx, opts) {
    const {
      freqStart = 440,
      freqEnd = freqStart,
      duration = 0.6,
      type = 'sine',
      peak = 0.3,
      attack = 0.01,
      detune = 0,
      startTime = ctx.currentTime,
      dest = ctx.destination,
    } = opts || {};
    const now = startTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration * 0.9);
    }
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0005, now + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.05);
    return { osc, gain: g };
  }

  return { createNoiseBuffer, createReverbImpulse, playNoiseOneShot, playToneOneShot };
})();
