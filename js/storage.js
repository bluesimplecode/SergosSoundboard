// Kleiner IndexedDB-Wrapper: speichert die 6 verarbeiteten Engelsstimmen-Slots
// (Audio + Name) rein lokal im Browser des Geräts (keine Server-Kommunikation).
window.SlotStorage = (function () {
  const DB_NAME = 'sergo-soundbot';
  const STORE = 'angel-slots';
  const VERSION = 1;
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function getRecord(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function putRecord(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Speichert/ersetzt die Audiodatei eines Slots, ohne Name/Emoji zu verlieren.
  async function saveSlot(id, blob) {
    const existing = await getRecord(id);
    await putRecord({
      id,
      blob,
      name: existing ? existing.name : null,
      emoji: existing ? existing.emoji : null,
      savedAt: Date.now(),
    });
  }

  // Speichert/ändert nur den Namen eines Slots, ohne die Audiodatei anzufassen.
  async function saveSlotName(id, name) {
    const existing = await getRecord(id);
    await putRecord({
      id,
      blob: existing ? existing.blob : null,
      name,
      emoji: existing ? existing.emoji : null,
      savedAt: existing ? existing.savedAt : Date.now(),
    });
  }

  // Speichert/ändert nur das Emoji-Icon eines Slots, ohne die Audiodatei anzufassen.
  async function saveSlotEmoji(id, emoji) {
    const existing = await getRecord(id);
    await putRecord({
      id,
      blob: existing ? existing.blob : null,
      name: existing ? existing.name : null,
      emoji,
      savedAt: existing ? existing.savedAt : Date.now(),
    });
  }

  // Gibt { id, blob, name, emoji, savedAt } oder null zurück.
  async function loadSlot(id) {
    return getRecord(id);
  }

  async function deleteSlot(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { saveSlot, saveSlotName, saveSlotEmoji, loadSlot, deleteSlot };
})();
