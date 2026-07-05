window.OceanTab = (function () {
  const FEET_TO_KMH = 0.18288; // feet/6s -> km/h
  const MAX_FEET = 50;

  const ANALOGIES = [
    { feet: 0, label: 'Windstille' },
    { feet: 5, label: 'Schlendern' },
    { feet: 10, label: 'Bummeltempo' },
    { feet: 15, label: 'Gehen' },
    { feet: 20, label: 'Flottes Gehen' },
    { feet: 25, label: 'Zügiges Gehen' },
    { feet: 30, label: 'Power-Walking' },
    { feet: 35, label: 'Joggen' },
    { feet: 40, label: 'Laufen' },
    { feet: 45, label: 'Schnelles Laufen' },
    { feet: 50, label: 'Sprinten' },
  ];

  let slider, speedValueEl, feetValueEl, analogyEl, needleEl, gaugeFillEl, gaugeFillArc = 377;

  // ---- Sound engine ----------------------------------------------------
  let ctx = null;
  let running = false;
  let masterGain, levelGain, ampGain, filter, waveshaper, lfoOsc, lfoGain, constSource, noiseSource;
  let whaleTimer = null;
  let burstTimer = null;
  let currentFeet = 0;
  let lastDrive = -1;

  function ensureContext() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function makeDistortionCurve(amount) {
    const n = 4096;
    const curve = new Float32Array(n);
    const k = amount;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = k <= 0 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function buildGraph() {
    const c = ensureContext();

    masterGain = c.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(c.destination);

    levelGain = c.createGain();
    levelGain.gain.value = 0.12;
    levelGain.connect(masterGain);

    ampGain = c.createGain();
    ampGain.gain.value = 0.55;
    ampGain.connect(levelGain);

    waveshaper = c.createWaveShaper();
    waveshaper.curve = makeDistortionCurve(0);
    waveshaper.oversample = '2x';
    waveshaper.connect(ampGain);

    filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.7;
    filter.connect(waveshaper);

    noiseSource = c.createBufferSource();
    noiseSource.buffer = NoiseSynth.createNoiseBuffer(c, 4, 'brown');
    noiseSource.loop = true;
    noiseSource.connect(filter);

    lfoOsc = c.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 0.15;
    lfoGain = c.createGain();
    lfoGain.gain.value = 0.25;
    lfoOsc.connect(lfoGain);
    lfoGain.connect(ampGain.gain);

    constSource = c.createConstantSource();
    constSource.offset.value = 0.55;
    constSource.connect(ampGain.gain);

    noiseSource.start();
    lfoOsc.start();
    constSource.start();
  }

  function playWhaleCall() {
    const c = ctx;
    const osc = c.createOscillator();
    osc.type = 'sine';
    const g = c.createGain();
    osc.connect(g);
    g.connect(masterGain);
    const now = c.currentTime;
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 2.6);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.5);
    g.gain.linearRampToValueAtTime(0.1, now + 2.0);
    g.gain.linearRampToValueAtTime(0.0001, now + 3.0);
    osc.start(now);
    osc.stop(now + 3.1);
  }

  function scheduleWhale() {
    const delay = 15000 + Math.random() * 15000;
    whaleTimer = setTimeout(() => {
      if (running && currentFeet > 0 && currentFeet <= 15) playWhaleCall();
      scheduleWhale();
    }, delay);
  }

  function playCrashBurst(intensity) {
    const c = ctx;
    const src = c.createBufferSource();
    src.buffer = NoiseSynth.createNoiseBuffer(c, 0.4, 'white');
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 0.6;
    const g = c.createGain();
    const now = c.currentTime;
    const peak = 0.15 + intensity * 0.55;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    src.connect(bp);
    bp.connect(g);
    g.connect(masterGain);
    src.start(now);
    src.stop(now + 0.4);
  }

  function scheduleBursts() {
    if (!running) return;
    if (currentFeet >= 25) {
      const t = currentFeet / MAX_FEET;
      const gapBase = 1800 - t * 1300;
      const gap = gapBase + Math.random() * gapBase * 0.6;
      burstTimer = setTimeout(() => {
        playCrashBurst(t);
        scheduleBursts();
      }, gap);
    } else {
      burstTimer = setTimeout(scheduleBursts, 1500);
    }
  }

  function setIntensity(feet) {
    currentFeet = feet;
    if (!running || !ctx) return;
    const t = feet / MAX_FEET;
    const now = ctx.currentTime;
    filter.frequency.setTargetAtTime(450 + t * 3200, now, 0.4);
    lfoOsc.frequency.setTargetAtTime(0.1 + t * 0.55, now, 0.4);
    lfoGain.gain.setTargetAtTime(0.15 + t * 0.35, now, 0.4);
    levelGain.gain.setTargetAtTime(0.12 + t * 0.55, now, 0.4);
    const drive = Math.round(t * t * 25);
    if (drive !== lastDrive) {
      lastDrive = drive;
      waveshaper.curve = makeDistortionCurve(drive);
    }
  }

  function startSound() {
    if (running) return;
    if (!ctx) buildGraph();
    else ensureContext();
    running = true;
    masterGain.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
    scheduleWhale();
    scheduleBursts();
    setIntensity(currentFeet);
  }

  function stopSound() {
    if (!running) return;
    running = false;
    clearTimeout(whaleTimer);
    clearTimeout(burstTimer);
    if (ctx && masterGain) masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  }

  function syncSound() {
    if (currentFeet > 0) startSound(); else stopSound();
  }

  // ---- UI ---------------------------------------------------------------

  function lerpColor(t, a, b) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function nearestAnalogy(feet) {
    let best = ANALOGIES[0];
    let bestDiff = Infinity;
    for (const a of ANALOGIES) {
      const diff = Math.abs(a.feet - feet);
      if (diff < bestDiff) { bestDiff = diff; best = a; }
    }
    return best.label;
  }

  function generateTicks() {
    const g = document.getElementById('gaugeTicks');
    if (!g) return;
    g.innerHTML = '';
    const cx = 150, cy = 160, rOuter = 122, rInner = 104;
    for (let i = 0; i <= 10; i++) {
      const theta = Math.PI - (i / 10) * Math.PI; // 180deg -> 0deg
      const x1 = cx + rInner * Math.cos(theta);
      const y1 = cy - rInner * Math.sin(theta);
      const x2 = cx + rOuter * Math.cos(theta);
      const y2 = cy - rOuter * Math.sin(theta);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(1));
      line.setAttribute('y1', y1.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1));
      line.setAttribute('y2', y2.toFixed(1));
      line.setAttribute('class', 'gauge-tick');
      g.appendChild(line);
    }
  }

  function updateUI(feet) {
    const kmh = feet * FEET_TO_KMH;
    const t = feet / MAX_FEET;

    feetValueEl.textContent = feet;
    speedValueEl.textContent = kmh.toFixed(1);
    analogyEl.textContent = nearestAnalogy(feet);

    const angle = -90 + t * 180;
    needleEl.style.transform = `rotate(${angle}deg)`;

    gaugeFillEl.style.strokeDashoffset = (gaugeFillArc * (1 - t)).toFixed(1);
    gaugeFillEl.style.stroke = lerpColor(t, [255, 215, 106], [255, 70, 60]);
  }

  function init() {
    slider = document.getElementById('speedSlider');
    speedValueEl = document.getElementById('speedValue');
    feetValueEl = document.getElementById('feetValue');
    analogyEl = document.getElementById('analogyText');
    needleEl = document.getElementById('needle');
    gaugeFillEl = document.getElementById('gaugeFill');

    generateTicks();
    updateUI(0);

    slider.addEventListener('input', () => {
      const feet = parseInt(slider.value, 10);
      updateUI(feet);
      currentFeet = feet;
      syncSound();
    });
  }

  return { init, stopSound, resume: syncSound };
})();
