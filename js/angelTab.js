window.AngelTab = (function () {
  const SLOT_IDS = [1, 2, 3, 4, 5, 6];
  let slots = {};
  let gridEl;

  const ANGEL_ICON_SVG = `
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="13" rx="13" ry="4" fill="none" stroke="#e0ac3f" stroke-width="2.2"/>
      <path d="M12,40 C3,36 1,49 7,54 C11,50 13,44 13,39 Z" fill="#f0d9ff" stroke="#d9b8ec" stroke-width="1"/>
      <path d="M48,40 C57,36 59,49 53,54 C49,50 47,44 47,39 Z" fill="#f0d9ff" stroke="#d9b8ec" stroke-width="1"/>
      <path d="M30,31 C19,35 15,48 15,56 L45,56 C45,48 41,35 30,31 Z" fill="#ffffff" stroke="#e6d4f0" stroke-width="1"/>
      <circle cx="30" cy="23" r="9.5" fill="#ffe4c4"/>
    </svg>`;

  function createSlotEl(id) {
    const el = document.createElement('div');
    el.className = 'angel-slot';
    el.dataset.id = String(id);
    el.innerHTML = `
      <div class="angel-icon">${ANGEL_ICON_SVG}</div>
      <div class="angel-slot-name">Engel ${id}</div>
      <div class="angel-slot-status" data-role="status">Leer</div>
      <div class="angel-slot-actions">
        <button type="button" class="angel-btn record" data-role="record">&#9679; Aufnehmen</button>
        <button type="button" class="angel-btn play" data-role="play" disabled>&#9654; Abspielen</button>
      </div>
    `;
    return el;
  }

  function setStatus(id, text) {
    const el = gridEl.querySelector(`.angel-slot[data-id="${id}"] [data-role="status"]`);
    if (el) el.textContent = text;
  }

  function isBusy() {
    return Object.values(slots).some((s) => s.state !== 'idle');
  }

  function updateButtons() {
    const busy = isBusy();
    SLOT_IDS.forEach((id) => {
      const slot = slots[id];
      const slotEl = gridEl.querySelector(`.angel-slot[data-id="${id}"]`);
      const recordBtn = slotEl.querySelector('[data-role="record"]');
      const playBtn = slotEl.querySelector('[data-role="play"]');
      recordBtn.disabled = busy && slot.state === 'idle';
      playBtn.disabled = busy || !slot.hasData;
    });
  }

  async function onRecordClick(id) {
    const slot = slots[id];
    const slotEl = gridEl.querySelector(`.angel-slot[data-id="${id}"]`);
    const btn = slotEl.querySelector('[data-role="record"]');

    if (slot.state === 'idle') {
      try {
        slot.recorder = AngelAudio.createRecorder();
        await slot.recorder.start();
        slot.state = 'recording';
        btn.textContent = '■ Stop';
        btn.classList.add('active');
        slotEl.classList.add('recording');
        setStatus(id, 'Nimmt auf...');
        updateButtons();
      } catch (err) {
        setStatus(id, 'Mikrofon-Zugriff verweigert');
      }
      return;
    }

    if (slot.state === 'recording') {
      btn.textContent = '● Aufnehmen';
      btn.classList.remove('active');
      slotEl.classList.remove('recording');
      slot.state = 'processing';
      setStatus(id, 'Verarbeite zu Engelsstimme...');
      updateButtons();

      try {
        const rawBuffer = await slot.recorder.stop();
        const { audioBuffer, blob } = await AngelAudio.process(rawBuffer);
        slot.cachedBuffer = audioBuffer;
        slot.hasData = true;
        await SlotStorage.saveSlot(id, blob);
        setStatus(id, 'Bereit');
      } catch (err) {
        setStatus(id, 'Fehler bei der Verarbeitung');
      }

      slot.state = 'idle';
      updateButtons();
    }
  }

  async function onPlayClick(id) {
    const slot = slots[id];
    if (!slot.hasData) return;
    const slotEl = gridEl.querySelector(`.angel-slot[data-id="${id}"]`);

    let buffer = slot.cachedBuffer;
    if (!buffer) {
      const blob = await SlotStorage.loadSlot(id);
      if (!blob) return;
      buffer = await AngelAudio.blobToAudioBuffer(blob);
      slot.cachedBuffer = buffer;
    }

    slotEl.classList.add('playing');
    AngelAudio.playBuffer(buffer, () => slotEl.classList.remove('playing'));
  }

  async function init() {
    gridEl = document.getElementById('angelGrid');

    SLOT_IDS.forEach((id) => {
      slots[id] = { state: 'idle', cachedBuffer: null, hasData: false, recorder: null };
      const el = createSlotEl(id);
      gridEl.appendChild(el);
      el.querySelector('[data-role="record"]').addEventListener('click', () => onRecordClick(id));
      el.querySelector('[data-role="play"]').addEventListener('click', () => onPlayClick(id));
    });

    for (const id of SLOT_IDS) {
      try {
        const blob = await SlotStorage.loadSlot(id);
        if (blob) {
          slots[id].hasData = true;
          setStatus(id, 'Bereit');
        }
      } catch (err) {
        // IndexedDB evtl. nicht verfügbar (privater Modus etc.) - Slot bleibt leer nutzbar
      }
    }
    updateButtons();
  }

  return { init };
})();
