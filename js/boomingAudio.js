// "Booming Voice"-Effekt: nutzt Aufnahme/Rauschunterdrückung/Pitch-Shift/WAV-Export
// von AngelAudio, rendert aber eine tiefe, dröhnende Stimme statt einer Engelsstimme.
// Bewusst zurückhaltend abgemischt, damit die Stimme dabei erkennbar bleibt.
window.BoomingAudio = (function () {
  async function renderBoomingVoice(pitchedBuffer) {
    const sampleRate = pitchedBuffer.sampleRate;
    const tailSeconds = 1.8;
    const totalLength = pitchedBuffer.length + Math.floor(tailSeconds * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

    const src = offlineCtx.createBufferSource();
    src.buffer = pitchedBuffer;

    const bassBoost = offlineCtx.createBiquadFilter();
    bassBoost.type = 'peaking';
    bassBoost.frequency.value = 160;
    bassBoost.Q.value = 0.8;
    bassBoost.gain.value = 3.5;

    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    lowShelf.gain.value = 2;

    const hiShelf = offlineCtx.createBiquadFilter();
    hiShelf.type = 'highshelf';
    hiShelf.frequency.value = 5500;
    hiShelf.gain.value = -2;

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.9;

    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = 0.22;

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = NoiseSynth.createReverbImpulse(offlineCtx, 1.8, 2.4);

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 16;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    src.connect(bassBoost);
    bassBoost.connect(lowShelf);
    lowShelf.connect(hiShelf);

    hiShelf.connect(dryGain);
    hiShelf.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(compressor);
    wetGain.connect(compressor);
    compressor.connect(offlineCtx.destination);

    src.start(0);

    return offlineCtx.startRendering();
  }

  async function process(rawBuffer) {
    return AngelAudio.process(rawBuffer, { semitones: -4, renderFn: renderBoomingVoice });
  }

  return {
    createRecorder: AngelAudio.createRecorder,
    process,
    blobToAudioBuffer: AngelAudio.blobToAudioBuffer,
    playBuffer: AngelAudio.playBuffer,
  };
})();
