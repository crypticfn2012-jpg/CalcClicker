import { SAVE_KEY, createFreshState, validateSave, applyOfflineProgress, MAX_OFFLINE_SECONDS } from './engine.js';

const BACKUP_KEY = SAVE_KEY + '.backup';

function readRaw(store, key) {
  try { return store?.getItem(key) ?? null; }
  catch (error) { return { error }; }
}
function safeLocalStorage() {
  try {
    const probe = '__calc_clicker_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}
function preserveCorrupt(store, raw, now) {
  if (typeof raw !== 'string' || raw.length > 200_000) return;
  try { store?.setItem(SAVE_KEY + '.corrupt.' + Math.floor(now), raw); } catch {}
}

export function loadGameState(platform, now = Date.now()) {
  let store = platform?.storageAdapter?.() ?? null;
  let source = store ? 'platform' : 'local';
  let usedFallback = false;
  if (!store) store = safeLocalStorage();

  let raw = readRaw(store, SAVE_KEY);
  if (raw && typeof raw === 'object' && raw.error) {
    usedFallback = true;
    store = safeLocalStorage();
    source = 'local-fallback';
    raw = readRaw(store, SAVE_KEY);
  }

  const decode = (value) => {
    if (typeof value !== 'string') return null;
    try { return validateSave(JSON.parse(value), now); } catch { return null; }
  };
  let state = decode(raw);
  if (!state && typeof raw === 'string' && raw.length) {
    preserveCorrupt(store, raw, now);
    const backupRaw = readRaw(store, BACKUP_KEY);
    const backup = decode(backupRaw);
    if (backup) {
      state = backup;
      source += '-backup';
    }
  }

  if (!state) state = createFreshState(now);
  const elapsed = Math.max(0, Math.min(MAX_OFFLINE_SECONDS, (now - state.savedAt) / 1_000));
  const offline = elapsed >= 15 ? applyOfflineProgress(state, elapsed, now) : null;
  state.savedAt = now;
  return {
    state,
    offline,
    source,
    usedFallback,
    saveStatus: usedFallback ? 'Local recovery save' : source === 'platform' ? 'Platform save' : 'Saved on this device',
  };
}

export function saveGameState(state, platform, now = Date.now()) {
  state.savedAt = now;
  state.version = 1;
  let raw;
  try { raw = JSON.stringify(state); }
  catch (error) { return { ok: false, status: 'Save failed', error }; }

  const platformStore = platform?.storageAdapter?.() ?? null;
  const localStore = safeLocalStorage();
  const store = platformStore ?? localStore;
  const primary = platformStore ? 'platform' : 'local';
  if (!store) return { ok: false, status: 'Storage unavailable' };

  try {
    let old;
    try { old = store.getItem(SAVE_KEY); } catch { old = null; }
    if (typeof old === 'string' && old && old !== raw) {
      try { store.setItem(BACKUP_KEY, old); } catch {}
    }
    store.setItem(SAVE_KEY, raw);
    if (platformStore && localStore) {
      try { localStore.setItem(SAVE_KEY + '.device-backup', raw); } catch {}
    }
    return {
      ok: true,
      status: primary === 'platform' ? 'Platform save queued' : 'Saved on this device',
      target: primary,
    };
  } catch (error) {
    if (platformStore && localStore) {
      try {
        localStore.setItem(SAVE_KEY, raw);
        return { ok: true, status: 'Platform save unavailable · device copy saved', target: 'local-fallback', error };
      } catch {}
    }
    return { ok: false, status: 'Save failed', error };
  }
}

export function exportSave(state, now = Date.now()) {
  const copy = { ...state, version: 1, savedAt: now };
  return JSON.stringify(copy, null, 2);
}

export const STORAGE_KEYS = { primary: SAVE_KEY, backup: BACKUP_KEY };
