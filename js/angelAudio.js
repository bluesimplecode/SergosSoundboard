// Aufnahme + Verarbeitung der Engelsstimmen-Sounds. Läuft komplett im Browser
// (Web Audio API), es werden keine Daten irgendwohin hochgeladen.
window.AngelAudio = (function () {
  let sharedCtx = null;

  function getSharedContext() {
    if (!sharedCtx) sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sharedCtx.state === 'suspended') sharedCtx.resume();
    return sharedCtx;
  }

  // ---- Aufnahme ----------------------------------------------------------

  function createRecorder() {
    let mediaRecorder, chunks, stream;
    return {
      async start() {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.start();
      },
      stop() {
        return new Promise((resolve, reject) => {
          if (!mediaRecorder) return reject(new Error('Aufnahme nicht gestartet'));
          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            try {
              const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
              const arrayBuffer = await blob.arrayBuffer();
              const ctx = getSharedContext();
              const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
              resolve(audioBuffer);
            } catch (err) {
              reject(err);
            }
          };
          mediaRecorder.stop();
        });
      },
    };
  }

  // ---- Rauschunterdrückung (leichtgewichtiges Noise-Gate) -----------------
  // Praktikable Lösung: Kurzzeit-Energie pro 20ms-Frame schätzt den
  // Rauschboden; leisere Frames werden weich gedämpft. Kein Studio-Denoiser.

  function denoiseBuffer(audioBuffer, ctx) {
    const frameLen = Math.max(64, Math.round(audioBuffer.sampleRate * 0.02));
    const channels = audioBuffer.numberOfChannels;
    const out = ctx.createBuffer(channels, audioBuffer.length, audioBuffer.sampleRate);

    for (let ch = 0; ch < channels; ch++) {
      const input = audioBuffer.getChannelData(ch);
      const numFrames = Math.ceil(input.length / frameLen);
      const rms = new Float32Array(numFrames);

      for (let f = 0; f < numFrames; f++) {
        const start = f * frameLen;
        const end = Math.min(start + frameLen, input.length);
        let sum = 0;
        for (let i = start; i < end; i++) sum += input[i] * input[i];
        rms[f] = Math.sqrt(sum / Math.max(1, end - start));
      }

      const sorted = Array.from(rms).sort((a, b) => a - b);
      const noiseFloor = sorted[Math.floor(sorted.length * 0.1)] || 0.0005;
      const threshold = Math.max(noiseFloor * 2.2, 0.004);

      const gains = new Float32Array(numFrames);
      for (let f = 0; f < numFrames; f++) {
        if (rms[f] <= threshold) {
          const ratio = rms[f] / threshold;
          gains[f] = Math.max(0.05, ratio * ratio);
        } else {
          gains[f] = 1;
        }
      }

      const smoothed = new Float32Array(numFrames);
      for (let f = 0; f < numFrames; f++) {
        const prev = gains[Math.max(0, f - 1)];
        const next = gains[Math.min(numFrames - 1, f + 1)];
        smoothed[f] = (prev + gains[f] * 2 + next) / 4;
      }

      const outData = out.getChannelData(ch);
      for (let f = 0; f < numFrames; f++) {
        const start = f * frameLen;
        const end = Math.min(start + frameLen, input.length);
        const gStart = smoothed[f];
        const gEnd = smoothed[Math.min(numFrames - 1, f + 1)];
        const len = end - start;
        for (let i = 0; i < len; i++) {
          const g = gStart + (gEnd - gStart) * (i / len);
          outData[start + i] = input[start + i] * g;
        }
      }
    }
    return out;
  }

  // ---- Pitch-Shift (granular, ohne externe Bibliothek) ---------------------
  // Zwei Schritte: 1) Resampling ändert Tonhöhe UND Länge gemeinsam,
  // 2) Overlap-Add-Zeitstreckung bringt die Länge zurück auf das Original,
  // ohne die neue Tonhöhe wieder zu verändern.

  function hannWindow(size) {
    const w = new Float32Array(size);
    for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    return w;
  }

  function resampleLinear(data, ratio) {
    const outLen = Math.max(1, Math.floor(data.length / ratio));
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcPos = i * ratio;
      const idx = Math.floor(srcPos);
      const frac = srcPos - idx;
      const a = data[idx] || 0;
      const b = data[idx + 1] || 0;
      out[i] = a + (b - a) * frac;
    }
    return out;
  }

  function timeStretch(data, outputLength) {
    const inputLength = data.length;
    if (inputLength < 8 || outputLength < 8) return data.slice(0, outputLength);
    const stretchRatio = outputLength / inputLength;
    const grainSize = Math.min(2048, Math.max(256, Math.floor(inputLength / 4)));
    const hopIn = Math.floor(grainSize / 2);
    const hopOut = Math.max(1, Math.floor(hopIn * stretchRatio));
    const window = hannWindow(grainSize);
    const bufLen = outputLength + grainSize;
    const output = new Float32Array(bufLen);
    const weight = new Float32Array(bufLen);

    let inPos = 0, outPos = 0;
    while (inPos + grainSize <= inputLength && outPos < outputLength) {
      for (let i = 0; i < grainSize; i++) {
        output[outPos + i] += data[inPos + i] * window[i];
        weight[outPos + i] += window[i];
      }
      inPos += hopIn;
      outPos += hopOut;
    }
    for (let i = 0; i < bufLen; i++) {
      if (weight[i] > 1e-6) output[i] /= weight[i];
    }
    return output.slice(0, outputLength);
  }

  function pitchShiftChannel(data, semitones) {
    const ratio = Math.pow(2, semitones / 12);
    const resampled = resampleLinear(data, ratio);
    return timeStretch(resampled, data.length);
  }

  // ---- Hall/Chor-Rendering (OfflineAudioContext) ---------------------------

  async function renderAngelVoice(pitchedBuffer) {
    const sampleRate = pitchedBuffer.sampleRate;
    const tailSeconds = 2.2;
    const totalLength = pitchedBuffer.length + Math.floor(tailSeconds * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

    const voicesBus = offlineCtx.createGain();
    voicesBus.gain.value = 1;

    [
      { rate: 1.0, gain: 0.85 },
      { rate: 1.006, gain: 0.28 },
      { rate: 0.994, gain: 0.28 },
    ].forEach(({ rate, gain }) => {
      const src = offlineCtx.createBufferSource();
      src.buffer = pitchedBuffer;
      src.playbackRate.value = rate;
      const g = offlineCtx.createGain();
      g.gain.value = gain;
      src.connect(g);
      g.connect(voicesBus);
      src.start(0);
    });

    const shimmerSrc = offlineCtx.createBufferSource();
    shimmerSrc.buffer = pitchedBuffer;
    shimmerSrc.playbackRate.value = 2.0;
    const shimmerGain = offlineCtx.createGain();
    shimmerGain.gain.value = 0.12;
    shimmerSrc.connect(shimmerGain);
    shimmerSrc.start(0);

    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 110;

    const hiShelf = offlineCtx.createBiquadFilter();
    hiShelf.type = 'highshelf';
    hiShelf.frequency.value = 7000;
    hiShelf.gain.value = -8;

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.75;

    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = 0.45;

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = NoiseSynth.createReverbImpulse(offlineCtx, 2.0, 2.2);

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    voicesBus.connect(highpass);
    highpass.connect(hiShelf);
    hiShelf.connect(dryGain);
    hiShelf.connect(convolver);
    shimmerGain.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(compressor);
    wetGain.connect(compressor);
    compressor.connect(offlineCtx.destination);

    return offlineCtx.startRendering();
  }

  // ---- WAV-Export (für IndexedDB-Speicherung) ------------------------------

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  function interleaveChannels(buffer) {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const result = new Float32Array(length * numChannels);
    for (let ch = 0; ch < numChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) result[i * numChannels + ch] = data[i];
    }
    return result;
  }

  function bufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const interleaved = interleaveChannels(buffer);
    const dataLength = interleaved.length * (bitDepth / 8);
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  async function blobToAudioBuffer(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = getSharedContext();
    return ctx.decodeAudioData(arrayBuffer.slice(0));
  }

  // ---- Öffentliche Pipeline -------------------------------------------------

  async function process(rawBuffer, opts) {
    const semitones = (opts && opts.semitones) || 7;
    const ctx = getSharedContext();

    const denoised = denoiseBuffer(rawBuffer, ctx);
    const pitched = ctx.createBuffer(denoised.numberOfChannels, denoised.length, denoised.sampleRate);
    for (let ch = 0; ch < denoised.numberOfChannels; ch++) {
      const shifted = pitchShiftChannel(denoised.getChannelData(ch), semitones);
      pitched.copyToChannel(shifted, ch);
    }

    const rendered = await renderAngelVoice(pitched);
    const blob = bufferToWav(rendered);
    return { audioBuffer: rendered, blob };
  }

  function playBuffer(audioBuffer, onEnded) {
    const ctx = getSharedContext();
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);
    if (onEnded) src.onended = onEnded;
    src.start();
    return src;
  }

  return { createRecorder, process, blobToAudioBuffer, playBuffer, getSharedContext };
})();
