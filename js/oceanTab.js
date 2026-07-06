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

  let slider, speedValueEl, feetValueEl, analogyEl, needleEl, gaugeFillEl, gaugeFillArc = 245.0;

  // ---- Sound engine ----------------------------------------------------
  let ctx = null;
  let running = false;
  let masterGain, levelGain, ampGain, filter, waveshaper, lfoOsc, lfoGain, lfoOsc2, lfoGain2, constSource, noiseSource;
  let rainSource, rainFilterHP, rainFilterLP, rainGain, rainFlutterOsc, rainFlutterGain;
  let whaleTimer = null;
  let whipTimer = null;
  let thunderTimer = null;
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

    // zweiter, unrunder LFO sorgt für unregelmäßige (nicht-metronomische)
    // Verwirbelung statt eines gleichmäßigen Wellentakts.
    lfoOsc2 = c.createOscillator();
    lfoOsc2.type = 'sine';
    lfoOsc2.frequency.value = 0.37;
    lfoGain2 = c.createGain();
    lfoGain2.gain.value = 0;
    lfoOsc2.connect(lfoGain2);
    lfoGain2.connect(ampGain.gain);

    constSource = c.createConstantSource();
    constSource.offset.value = 0.55;
    constSource.connect(ampGain.gain);

    // Regen: kontinuierliches, helles Rauschband, das erst ab hoher
    // Geschwindigkeit eingeblendet wird (siehe setIntensity).
    rainSource = c.createBufferSource();
    rainSource.buffer = NoiseSynth.createNoiseBuffer(c, 4, 'white');
    rainSource.loop = true;

    rainFilterHP = c.createBiquadFilter();
    rainFilterHP.type = 'highpass';
    rainFilterHP.frequency.value = 2200;

    rainFilterLP = c.createBiquadFilter();
    rainFilterLP.type = 'lowpass';
    rainFilterLP.frequency.value = 9000;

    rainGain = c.createGain();
    rainGain.gain.value = 0;

    rainFlutterOsc = c.createOscillator();
    rainFlutterOsc.type = 'sine';
    rainFlutterOsc.frequency.value = 5;
    rainFlutterGain = c.createGain();
    rainFlutterGain.gain.value = 0;
    rainFlutterOsc.connect(rainFlutterGain);
    rainFlutterGain.connect(rainGain.gain);

    rainSource.connect(rainFilterHP);
    rainFilterHP.connect(rainFilterLP);
    rainFilterLP.connect(rainGain);
    rainGain.connect(masterGain);

    noiseSource.start();
    lfoOsc.start();
    lfoOsc2.start();
    constSource.start();
    rainSource.start();
    rainFlutterOsc.start();
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

  // "Peitschen": kurzer, schmalbandiger Rausch-Klick (Wind/Gischt-Knacken).
  // Exakt die ursprüngliche Klangfarbe (feste Frequenz/Q/Dauer) - nur das
  // Timing zwischen den Treffern ist unregelmäßig (siehe scheduleWhipCracks),
  // der Klang selbst bleibt unverändert von Treffer zu Treffer.
  function playWhipCrack(intensity) {
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

  function scheduleWhipCracks() {
    if (!running) return;
    if (currentFeet >= 25) {
      const t = currentFeet / MAX_FEET;
      const gapBase = 1800 - t * 1300;
      // deutlich breiterer Zufallsbereich (0.3x - 2x) statt gleichmäßigem Takt
      const gap = gapBase * (0.3 + Math.random() * 1.7);
      whipTimer = setTimeout(() => {
        playWhipCrack(t);
        scheduleWhipCracks();
      }, gap);
    } else {
      whipTimer = setTimeout(scheduleWhipCracks, 1500);
    }
  }

  // Gewitter: tiefes Rollen, bei starkem Sturm (50ft/6s) zusätzlich mit
  // hellem Blitz-Krachen und zweitem, verzögertem Rollen.
  function playThunder(strong) {
    const c = ctx;
    const now = c.currentTime;
    const rumbleDur = strong ? 4.5 : 2.8;

    const rumbleSrc = c.createBufferSource();
    rumbleSrc.buffer = NoiseSynth.createNoiseBuffer(c, rumbleDur + 0.3, 'brown');
    const rumbleFilter = c.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = strong ? 220 : 140;
    const rumbleGain = c.createGain();
    const rumblePeak = strong ? 0.6 : 0.26;
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.linearRampToValueAtTime(rumblePeak, now + (strong ? 0.25 : 0.4));
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + rumbleDur);
    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumbleSrc.start(now);
    rumbleSrc.stop(now + rumbleDur + 0.3);

    if (!strong) return;

    const crackSrc = c.createBufferSource();
    crackSrc.buffer = NoiseSynth.createNoiseBuffer(c, 0.25, 'white');
    const crackFilter = c.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 1500;
    const crackGain = c.createGain();
    crackGain.gain.setValueAtTime(0.0001, now);
    crackGain.gain.linearRampToValueAtTime(0.5, now + 0.008);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(masterGain);
    crackSrc.start(now);
    crackSrc.stop(now + 0.3);

    const rumble2Src = c.createBufferSource();
    rumble2Src.buffer = NoiseSynth.createNoiseBuffer(c, 3.2, 'brown');
    const rumble2Filter = c.createBiquadFilter();
    rumble2Filter.type = 'lowpass';
    rumble2Filter.frequency.value = 180;
    const rumble2Gain = c.createGain();
    const startAt = now + 0.6 + Math.random() * 0.4;
    rumble2Gain.gain.setValueAtTime(0.0001, startAt);
    rumble2Gain.gain.linearRampToValueAtTime(0.35, startAt + 0.3);
    rumble2Gain.gain.exponentialRampToValueAtTime(0.001, startAt + 3);
    rumble2Src.connect(rumble2Filter);
    rumble2Filter.connect(rumble2Gain);
    rumble2Gain.connect(masterGain);
    rumble2Src.start(startAt);
    rumble2Src.stop(startAt + 3.2);
  }

  function scheduleThunder() {
    if (!running) return;
    if (currentFeet >= 40) {
      const strong = currentFeet >= 50;
      const gap = strong ? 6000 + Math.random() * 8000 : 12000 + Math.random() * 14000;
      thunderTimer = setTimeout(() => {
        playThunder(strong);
        scheduleThunder();
      }, gap);
    } else {
      thunderTimer = setTimeout(scheduleThunder, 3000);
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
    lfoOsc2.frequency.setTargetAtTime(0.3 + t * 1.1, now, 0.4);
    lfoGain2.gain.setTargetAtTime(t * 0.3, now, 0.4);
    levelGain.gain.setTargetAtTime(0.12 + t * 0.55, now, 0.4);
    const drive = Math.round(t * t * 25);
    if (drive !== lastDrive) {
      lastDrive = drive;
      waveshaper.curve = makeDistortionCurve(drive);
    }

    // Regen blendet erst ab ~40ft/6s ein, bei 50ft/6s voller Regen
    const rainLevel = Math.max(0, (t - 0.75) / 0.25);
    rainGain.gain.setTargetAtTime(rainLevel * 0.35, now, 0.6);
    rainFlutterGain.gain.setTargetAtTime(rainLevel * 0.08, now, 0.6);
  }

  function startSound() {
    if (running) return;
    if (!ctx) buildGraph();
    else ensureContext();
    running = true;
    masterGain.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
    scheduleWhale();
    scheduleWhipCracks();
    scheduleThunder();
    setIntensity(currentFeet);
  }

  function stopSound() {
    if (!running) return;
    running = false;
    clearTimeout(whaleTimer);
    clearTimeout(whipTimer);
    clearTimeout(thunderTimer);
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
    const cx = 160, cy = 205, rOuter = 84, rInner = 68;
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
      if (running) setIntensity(feet);
    });
  }

  return { init, stopSound, resume: syncSound };
})();
