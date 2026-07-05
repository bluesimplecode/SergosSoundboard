window.AngelTab = (function () {
  const SLOT_IDS = [1, 2, 3, 4, 5, 6];
  let slots = {};
  let gridEl;

  const DEFAULT_EMOJI = '';

  const EMOJI_CATEGORIES = [
    {
      label: 'Kampf & Aktionen',
      emojis: ['⚔️', '🛡️', '🏹', '🗡️', '🔪', '💥', '👊', '🤺', '🩸', '💀', '☠️', '🧨', '🔨', '🪓', '🎯', '🥊'],
    },
    {
      label: 'Reaktionen & Emotionen',
      emojis: ['😱', '😨', '😰', '😡', '🤬', '😭', '😂', '🤣', '😲', '😳', '🥴', '🙄', '😏', '😈', '👀', '😴', '🤯', '😤', '😅', '🤢'],
    },
    {
      label: 'Fantasy & Monster (DnD)',
      emojis: ['🐉', '🐲', '🧙‍♂️', '🧙‍♀️', '🧛', '🧟', '🧝‍♂️', '🧝‍♀️', '🧞‍♂️', '🧞‍♀️', '👹', '👺', '👻', '🦇', '🕷️', '🐺', '🦅', '🦂', '🐍', '🦑', '🦖', '🦕'],
    },
    {
      label: 'Magie & Zauber',
      emojis: ['🔮', '✨', '💫', '⚡', '🔥', '❄️', '🌪️', '☄️', '🪄', '📜', '🕯️', '⚗️', '🧪', '💎', '🌟', '🌠', '🧿'],
    },
    {
      label: 'Würfel & Glück',
      emojis: ['🎲', '🍀', '🃏', '♠️', '♣️', '♥️', '♦️', '🪙', '🎰', '🎴', '🀄'],
    },
    {
      label: 'Ereignisse & Momente',
      emojis: ['🎉', '🎊', '🏆', '🥇', '👑', '🔔', '📯', '📢', '⏰', '🚪', '🗝️', '💰', '📦', '🎁', '⚰️', '🕳️', '🚨'],
    },
    {
      label: 'Engel & Fantasie',
      emojis: ['👼', '😇', '🧚', '🧜', '🕊️', '🎭'],
    },
    {
      label: 'Puppen & Spielzeug',
      emojis: ['🪆', '🧸', '🪅', '🎪', '🎠', '🎡', '🧩', '🪀', '🪁'],
    },
    {
      label: 'Tiere',
      emojis: ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐢', '🦋', '🐝', '🦉', '🐦', '🐤', '🐬', '🐙'],
    },
    {
      label: 'Natur',
      emojis: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌈', '🌙', '☀️', '💧', '🌊', '🌌', '🍃', '🌾'],
    },
    {
      label: 'Herzen & Symbole',
      emojis: ['❤️', '💖', '💝', '💕', '💗', '💓', '💞', '💘', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤', '💯', '🎵', '🎶', '🎀'],
    },
  ];

  let pickerOverlay = null;
  let activeEmojiSlotId = null;

  function createSlotEl(id) {
    const el = document.createElement('div');
    el.className = 'angel-slot';
    el.dataset.id = String(id);
    el.innerHTML = `
      <div class="angel-icon-emoji" data-role="emoji" tabindex="0" title="Tippen zum Ändern">${DEFAULT_EMOJI}</div>
      <div class="angel-slot-name" data-role="name" tabindex="0" title="Tippen zum Umbenennen">leer</div>
      <input type="text" class="angel-slot-name-input" data-role="name-input" maxlength="24" />
      <div class="angel-slot-status" data-role="status">Leer</div>
      <div class="angel-slot-actions">
        <button type="button" class="angel-btn record" data-role="record">&#9679; Aufnehmen</button>
        <button type="button" class="angel-btn play" data-role="play" disabled>&#9654; Abspielen</button>
      </div>
    `;
    return el;
  }

  function buildEmojiPicker() {
    const overlay = document.createElement('div');
    overlay.className = 'emoji-picker-overlay';
    overlay.innerHTML = `
      <div class="emoji-picker-panel">
        <div class="emoji-picker-header">
          <span>Emoji wählen</span>
          <button type="button" class="emoji-picker-close" data-role="picker-close">&times;</button>
        </div>
        <div class="emoji-picker-categories">
          ${EMOJI_CATEGORIES.map((cat) => `
            <div class="emoji-picker-category">
              <div class="emoji-picker-category-label">${cat.label}</div>
              <div class="emoji-picker-grid">
                ${cat.emojis.map((e) => `<button type="button" class="emoji-picker-option" data-emoji="${e}">${e}</button>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="emoji-picker-custom">
          <input type="text" maxlength="4" placeholder="eigenes Emoji" data-role="picker-custom-input" />
          <button type="button" class="angel-btn play" data-role="picker-custom-confirm">Setzen</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeEmojiPicker();
    });
    overlay.querySelector('[data-role="picker-close"]').addEventListener('click', closeEmojiPicker);
    overlay.querySelectorAll('.emoji-picker-option').forEach((btn) => {
      btn.addEventListener('click', () => applyEmoji(btn.dataset.emoji));
    });

    const customInput = overlay.querySelector('[data-role="picker-custom-input"]');
    const confirmCustom = () => {
      const val = customInput.value.trim();
      if (val) applyEmoji(val);
      customInput.value = '';
    };
    overlay.querySelector('[data-role="picker-custom-confirm"]').addEventListener('click', confirmCustom);
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmCustom();
      }
    });

    pickerOverlay = overlay;
  }

  function openEmojiPicker(id) {
    activeEmojiSlotId = id;
    pickerOverlay.classList.add('open');
  }

  function closeEmojiPicker() {
    pickerOverlay.classList.remove('open');
    activeEmojiSlotId = null;
  }

  function applyEmoji(emoji) {
    if (activeEmojiSlotId == null) return;
    const id = activeEmojiSlotId;
    slots[id].emoji = emoji;
    gridEl.querySelector(`.angel-slot[data-id="${id}"] [data-role="emoji"]`).textContent = emoji;
    SlotStorage.saveSlotEmoji(id, emoji).catch(() => {});
    closeEmojiPicker();
  }

  function setupEmojiEditing(id, slotEl) {
    const emojiDisplay = slotEl.querySelector('[data-role="emoji"]');
    emojiDisplay.addEventListener('click', () => openEmojiPicker(id));
  }

  function setupNameEditing(id, slotEl) {
    const nameDisplay = slotEl.querySelector('[data-role="name"]');
    const nameInput = slotEl.querySelector('[data-role="name-input"]');

    function enterEdit() {
      nameInput.value = slots[id].name === 'leer' ? '' : slots[id].name;
      nameDisplay.style.display = 'none';
      nameInput.style.display = 'block';
      nameInput.focus();
      nameInput.select();
    }

    function commitEdit() {
      const finalName = nameInput.value.trim() || 'leer';
      slots[id].name = finalName;
      nameDisplay.textContent = finalName;
      nameDisplay.style.display = '';
      nameInput.style.display = 'none';
      SlotStorage.saveSlotName(id, finalName).catch(() => {});
    }

    nameDisplay.addEventListener('click', enterEdit);
    nameInput.addEventListener('blur', commitEdit);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInput.blur();
      }
    });
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
      const record = await SlotStorage.loadSlot(id);
      if (!record || !record.blob) return;
      buffer = await AngelAudio.blobToAudioBuffer(record.blob);
      slot.cachedBuffer = buffer;
    }

    slotEl.classList.add('playing');
    AngelAudio.playBuffer(buffer, () => slotEl.classList.remove('playing'));
  }

  async function init() {
    gridEl = document.getElementById('angelGrid');
    buildEmojiPicker();

    SLOT_IDS.forEach((id) => {
      slots[id] = { state: 'idle', cachedBuffer: null, hasData: false, recorder: null, name: 'leer', emoji: DEFAULT_EMOJI };
      const el = createSlotEl(id);
      gridEl.appendChild(el);
      el.querySelector('[data-role="record"]').addEventListener('click', () => onRecordClick(id));
      el.querySelector('[data-role="play"]').addEventListener('click', () => onPlayClick(id));
      setupNameEditing(id, el);
      setupEmojiEditing(id, el);
    });

    for (const id of SLOT_IDS) {
      try {
        const record = await SlotStorage.loadSlot(id);
        if (record) {
          const slotEl = gridEl.querySelector(`.angel-slot[data-id="${id}"]`);
          if (record.blob) {
            slots[id].hasData = true;
            setStatus(id, 'Bereit');
          }
          if (record.name) {
            slots[id].name = record.name;
            slotEl.querySelector('[data-role="name"]').textContent = record.name;
          }
          if (record.emoji) {
            slots[id].emoji = record.emoji;
            slotEl.querySelector('[data-role="emoji"]').textContent = record.emoji;
          }
        }
      } catch (err) {
        // IndexedDB evtl. nicht verfügbar (privater Modus etc.) - Slot bleibt leer nutzbar
      }
    }
    updateButtons();
  }

  return { init };
})();
