const SDK_SRC = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const TIMEOUT_MS = 4_000;

function timeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => clearTimeout(timer));
}
function isSupportedHost() {
  if (new URLSearchParams(location.search).get('disableSdk') === 'true') return false;
  const host = location.hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
    || host.endsWith('.crazygames.com') || host === 'crazygames.com'
    || new URLSearchParams(location.search).get('useLocalSdk') === 'true';
}
function loadSdkScript() {
  if (window.CrazyGames?.SDK) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-crazygames-sdk]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error('SDK script could not be loaded')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.dataset.crazygamesSdk = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('SDK script could not be loaded'));
    document.head.append(script);
  });
}

export class GamePlatform {
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    this.sdk = null;
    this.environment = 'disabled';
    this.mode = 'initializing';
    this.error = '';
    this.data = null;
    this.gameplayActive = false;
    this.muteAudio = false;
    this.accountAvailable = false;
    this._settingsListener = null;
  }

  _notify() { this.onChange(this.getStatus()); }
  _error(error) {
    this.error = error?.message || String(error || 'SDK error');
    this._notify();
  }
  _active() { return Boolean(this.sdk && (this.environment === 'crazygames' || this.environment === 'local')); }

  async initialize() {
    this.mode = 'initializing';
    this._notify();
    if (!window.CrazyGames?.SDK && !isSupportedHost()) {
      this.mode = 'standalone';
      this.environment = 'disabled';
      this._notify();
      return this.getStatus();
    }
    try {
      await timeout(loadSdkScript(), TIMEOUT_MS, 'SDK script timed out');
      const sdk = window.CrazyGames?.SDK;
      if (!sdk || typeof sdk.init !== 'function') throw new Error('CrazyGames SDK v3 is unavailable');
      await timeout(sdk.init(), TIMEOUT_MS, 'SDK initialization timed out');
      const environment = sdk.environment;
      this.sdk = sdk;
      this.environment = typeof environment === 'string' ? environment : 'disabled';
      if (!['local', 'crazygames'].includes(this.environment)) {
        this.mode = 'standalone';
        this.sdk = null;
        this._notify();
        return this.getStatus();
      }
      this.mode = this.environment === 'crazygames' ? 'active' : 'local-test';
      if (sdk.data && typeof sdk.data.getItem === 'function' && typeof sdk.data.setItem === 'function') {
        this.data = {
          getItem: (key) => sdk.data.getItem(key),
          setItem: (key, value) => sdk.data.setItem(key, value),
        };
      }
      this.accountAvailable = sdk.user?.isUserAccountAvailable === true;
      this._call('game.loadingStart');
      this._attachSettings();
      this._notify();
      return this.getStatus();
    } catch (error) {
      this.mode = 'sdk-unavailable';
      this.environment = 'disabled';
      this.sdk = null;
      this.data = null;
      this._error(error);
      return this.getStatus();
    }
  }

  _attachSettings() {
    const game = this.sdk?.game;
    const apply = (settings) => {
      this.muteAudio = Boolean(settings?.muteAudio);
      this._notify();
    };
    apply(game?.settings);
    if (game && typeof game.addSettingsChangeListener === 'function') {
      this._settingsListener = apply;
      try { game.addSettingsChangeListener(apply); } catch (error) { this._error(error); }
    }
  }

  getStatus() {
    return {
      mode: this.mode,
      environment: this.environment,
      error: this.error,
      hasData: Boolean(this.data),
      hasAds: Boolean(this._active() && this.sdk?.ad?.requestAd),
      accountAvailable: this.accountAvailable,
      muteAudio: this.muteAudio,
    };
  }

  storageAdapter() { return this._active() ? this.data : null; }

  _call(path, ...args) {
    if (!this._active()) return false;
    try {
      const fn = path.split('.').reduce((obj, key) => obj?.[key], this.sdk);
      if (typeof fn !== 'function') return false;
      fn.apply(path.split('.').slice(0, -1).reduce((obj, key) => obj?.[key], this.sdk), args);
      return true;
    } catch (error) {
      this._error(error);
      return false;
    }
  }

  loadingStart() { this._call('game.loadingStart'); }
  loadingStop() { this._call('game.loadingStop'); }
  happyTime() { this._call('game.happytime'); }

  setGameplay(active) {
    const next = Boolean(active);
    if (!this._active() || this.gameplayActive === next) return;
    this.gameplayActive = next;
    this._call(next ? 'game.gameplayStart' : 'game.gameplayStop');
  }

  requestMidgame({ onStarted = () => {}, onEnded = () => {} } = {}) {
    return this._requestAd('midgame', { onStarted, onEnded });
  }

  requestRewarded({ onStarted = () => {}, onEnded = () => {} } = {}) {
    return this._requestAd('rewarded', { onStarted, onEnded });
  }

  _requestAd(type, { onStarted, onEnded }) {
    if (!this._active() || typeof this.sdk?.ad?.requestAd !== 'function') {
      return Promise.resolve({ completed: false, error: new Error('Ads are unavailable in this environment') });
    }
    return new Promise((resolve) => {
      let settled = false;
      let timer;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { onEnded(result); } catch {}
        resolve(result);
      };
      const callbacks = {
        adStarted: () => { try { onStarted(); } catch {} },
        adError: (error) => finish({ completed: false, error }),
        adFinished: () => finish({ completed: true }),
      };
      timer = setTimeout(() => finish({ completed: false, error: new Error('Ad request timed out') }), 90_000);
      try {
        const result = this.sdk.ad.requestAd(type, callbacks);
        if (result && typeof result.then === 'function') result.catch((error) => finish({ completed: false, error }));
      } catch (error) {
        finish({ completed: false, error });
      }
    });
  }
}
