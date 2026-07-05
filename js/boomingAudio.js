// "Booming Voice"-Effekt: nutzt Aufnahme/Rauschunterdrückung/Pitch-Shift/WAV-Export
// von AngelAudio, rendert aber eine tiefe, dröhnende Stimme statt einer Engelsstimme.
window.BoomingAudio = (function () {
  async function renderBoomingVoice(pitchedBuffer) {
    const sampleRate = pitchedBuffer.sampleRate;
    const tailSeconds = 3.2;
    const totalLength = pitchedBuffer.length + Math.floor(tailSeconds * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

    const src = offlineCtx.createBufferSource();
    src.buffer = pitchedBuffer;

    const doubleSrc = offlineCtx.createBufferSource();
    doubleSrc.buffer = pitchedBuffer;
    doubleSrc.playbackRate.value = 0.5; // eine Oktave tiefer, leise untergemischt für mehr Wucht
    const doubleGain = offlineCtx.createGain();
    doubleGain.gain.value = 0.35;

    const bassBoost = offlineCtx.createBiquadFilter();
    bassBoost.type = 'peaking';
    bassBoost.frequency.value = 160;
    bassBoost.Q.value = 0.9;
    bassBoost.gain.value = 9;

    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 220;
    lowShelf.gain.value = 6;

    const hiShelf = offlineCtx.createBiquadFilter();
    hiShelf.type = 'highshelf';
    hiShelf.frequency.value = 4500;
    hiShelf.gain.value = -6;

    const drive = offlineCtx.createWaveShaper();
    const n = 4096;
    const curve = new Float32Array(n);
    const k = 6;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    drive.curve = curve;
    drive.oversample = '2x';

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.7;

    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = 0.55;

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = NoiseSynth.createReverbImpulse(offlineCtx, 3.5, 2.6);

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.3;

    src.connect(bassBoost);
    doubleSrc.connect(doubleGain);
    doubleGain.connect(bassBoost);

    bassBoost.connect(lowShelf);
    lowShelf.connect(hiShelf);
    hiShelf.connect(drive);

    drive.connect(dryGain);
    drive.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(compressor);
    wetGain.connect(compressor);
    compressor.connect(offlineCtx.destination);

    src.start(0);
    doubleSrc.start(0);

    return offlineCtx.startRendering();
  }

  async function process(rawBuffer) {
    return AngelAudio.process(rawBuffer, { semitones: -8, renderFn: renderBoomingVoice });
  }

  return {
    createRecorder: AngelAudio.createRecorder,
    process,
    blobToAudioBuffer: AngelAudio.blobToAudioBuffer,
    playBuffer: AngelAudio.playBuffer,
  };
})();
