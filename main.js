import {
  ACHIEVEMENTS, DAILY_CHALLENGES, PRODUCERS, SPECIAL_UPGRADES, UPGRADES,
  PRESTIGE_UPGRADES, REBIRTH_UPGRADES, SAVE_KEY, createFreshState, formatNumber,
  getAchievementProgress, getActiveBoostRemaining, getBaseProduction, getClickPower, getDailyChallenge, getDailyDayKey,
  getEventRemaining, getFocusRemaining, getGlobalMultiplier, getMetric,
  getNextCost, getOfflineEfficiency, getOwned, getProduction, getPurchaseQuote,
  getUnlockedAchievementCount, getUpgrade, getUpgradeUnlock, canPrestige,
  canRebirth, prestigeReward, rebirthReward, totalUpgradeVariety, clickCalculator,
  buyUpgrade, advanceTime, collectRareEquation, activateFocus, buyFocusBoost,
  claimDailyChallenge, performPrestige, purchasePrestigeUpgrade, performRebirth,
  purchaseRebirthUpgrade, grantRewardedBoost, applyOfflineProgress,
} from './engine.js';
import { GamePlatform } from './platform.js';
import { loadGameState, saveGameState, exportSave } from './storage.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const timeLabel = (seconds) => {
  const n = Math.max(0, Math.floor(seconds));
  if (n < 60) return n + ' sec';
  if (n < 3_600) return Math.floor(n / 60) + ' min';
  return Math.floor(n / 3_600) + ' hr ' + Math.floor((n % 3_600) / 60) + ' min';
};
const percent = (value, total) => total > 0 ? Math.max(0, Math.min(100, value / total * 100)) : 0;

const loader = $('#loader');
const progressBar = $('#loading-progress');
const gameShell = $('#game-shell');
const screenHost = $('#screen-host');
const modalRoot = $('#modal-root');
const toastRegion = $('#toast-region');
const saveChip = $('#save-status');
const footerSave = $('#footer-save');
const platform = new GamePlatform(() => refreshPlatformDisplay());
let state = null;
let currentScreen = 'lab';
let buyMode = '1';
let upgradeFilter = 'all';
let achievementFilter = 'all';
let saveTimer = 0;
let renderTimer = 0;
let lastTick = 0;
let accumulator = 0;
let modalConfirm = null;
let eventNoticeId = '';
let adInProgress = false;
let saveLabel = 'Starting…';
let audioContext = null;
let platformMuted = false;
let toastQueue = [];
let toastBusy = false;
let modalReturnFocus = null;

function number(value) { return formatNumber(value, state?.settings?.numberMode ?? 'compact'); }
function totalUnlocked() { return getUnlockedAchievementCount(state); }
function template(markup) {
  const holder = document.createElement('template');
  holder.innerHTML = markup;
  return holder.content.firstElementChild;
}
function setLoaderProgress(value) {
  progressBar.style.width = Math.max(0, Math.min(100, value)) + '%';
  progressBar.parentElement.setAttribute('aria-valuenow', String(value));
}
function updateMotionPreference() {
  document.documentElement.dataset.reducedMotion = state?.settings?.reducedMotion ? 'true' : 'false';
}
function updateSaveStatus(message, kind = '') {
  saveLabel = message;
  saveChip.className = 'save-chip' + (kind ? ' ' + kind : '');
  const text = $('span', saveChip);
  if (text) text.textContent = message;
  footerSave.textContent = message === 'Saved on this device' ? 'Progress saves automatically on this device' : message;
}
function refreshPlatformDisplay() {
  if (currentScreen === 'settings' && state) renderSettings();
  updateSaveStatus(saveLabel, platform.mode === 'sdk-unavailable' ? 'warning' : '');
}
function playSound(type) {
  if (!state?.settings.sound || state.settings.volume <= 0 || platformMuted || platform.muteAudio) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ??= new Audio();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const tones = type === 'achievement' ? [660, 880] : type === 'purchase' ? [500, 720] : type === 'event' ? [620, 940] : [390];
    tones.forEach((frequency, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type === 'click' ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(Math.min(.11, state.settings.volume * (type === 'click' ? .08 : .12)), now + index * .065);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .065 + (type === 'click' ? .055 : .16));
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now + index * .065);
      osc.stop(now + index * .065 + (type === 'click' ? .06 : .17));
    });
  } catch {}
}
function notify(title, detail = '', kind = 'achievement') {
  toastQueue.push({ title: String(title), detail: String(detail), kind });
  if (!toastBusy) showNextToast();
}
function showNextToast() {
  const item = toastQueue.shift();
  if (!item) { toastBusy = false; return; }
  toastBusy = true;
  const symbol = item.kind === 'event' ? '✦' : item.kind === 'purchase' ? '✓' : '★';
  const toast = template('<div class="toast"><span class="toast-icon">' + symbol + '</span><span><strong></strong><small></small></span></div>');
  $('strong', toast).textContent = item.title;
  $('small', toast).textContent = item.detail;
  toastRegion.append(toast);
  if (item.kind !== 'quiet') playSound(item.kind);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => {
      toast.remove();
      toastBusy = false;
      showNextToast();
    }, 220);
  }, 2_500);
}
function celebrateAchievements(unlocked = []) {
  for (const item of unlocked) {
    notify('Milestone unlocked', item.name + ' · +' + number(item.reward) + ' points', 'achievement');
    if (['prestige-first', 'rebirth-first'].includes(item.id)) platform.happyTime();
  }
}
function refreshNav() {
  $$('.nav-item').forEach((button) => {
    const active = button.dataset.screen === currentScreen;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const daily = getDailyChallenge(state);
  const badge = $('#daily-badge');
  const done = state.daily.progress >= daily.goal && !state.daily.claimed;
  badge.hidden = !done;
  updatePlatformLifecycle();
}
function updatePlatformLifecycle() {
  if (!state) return;
  const modalOpen = Boolean($('.modal-backdrop', modalRoot));
  platform.setGameplay(!gameShell.hidden && !document.hidden && currentScreen === 'lab' && !modalOpen && !adInProgress);
}
function renderScreen() {
  if (!state) return;
  refreshNav();
  updateMotionPreference();
  switch (currentScreen) {
    case 'lab': renderLab(); break;
    case 'challenges': renderChallenges(); break;
    case 'achievements': renderAchievements(); break;
    case 'prestige': renderPrestige(); break;
    case 'records': renderRecords(); break;
    case 'break': renderBreak(); break;
    case 'settings': renderSettings(); break;
    default: currentScreen = 'lab'; renderLab();
  }
  syncHeader();
}
function goToScreen(screen) {
  if (!['lab', 'challenges', 'achievements', 'prestige', 'records', 'break', 'settings'].includes(screen)) return;
  closeModal();
  currentScreen = screen;
  renderScreen();
  screenHost.focus({ preventScroll: true });
}
function syncHeader() {
  if (!state) return;
  $('#top-points').textContent = number(state.points);
  const saveText = $('span', saveChip);
  if (saveText && saveText.textContent !== saveLabel) saveText.textContent = saveLabel;
  $('#footer-save').textContent = saveLabel === 'Saved on this device' ? 'Progress saves automatically on this device' : saveLabel;
  const clickDisplay = $('#calc-total');
  if (clickDisplay) clickDisplay.textContent = number(state.points);
  const pps = $('#stat-pps');
  if (pps) pps.textContent = number(getProduction(state));
  const ppc = $('#stat-ppc');
  if (ppc) ppc.textContent = number(getClickPower(state));
  const streak = $('#streak-value');
  if (streak) streak.textContent = String(state.streak.count);
  const streakFill = $('#streak-fill');
  if (streakFill) streakFill.style.width = Math.min(100, (state.streak.count % 10) * 10) + '%';
  const eventSlot = $('#event-slot');
  if (eventSlot) syncEventSlot(eventSlot);
  syncUpgradeAffordability();
  syncAchievementProgress();
  syncChallengeProgress();
  const daily = getDailyChallenge(state);
  const badge = $('#daily-badge');
  if (badge) badge.hidden = !(state.daily.progress >= daily.goal && !state.daily.claimed);
  updatePlatformLifecycle();
}
function pageHeading(eyebrow, title, description, right = '') {
  return '<div class="page-heading"><div><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + title + '</h1><p>' + esc(description) + '</p></div>' + right + '</div>';
}
function renderEventMarkup() {
  if (!state.activeEvent) return '';
  const remain = getEventRemaining(state);
  return '<div class="event-banner"><div class="event-copy"><span class="event-spark">✦</span><span><strong>Rare equation found</strong><small>Collect it for a point reward and a short production boost · ' + remain + 's</small></span></div><button class="button compact" data-action="collect-event">Collect</button></div>';
}
function syncEventSlot(slot) {
  const id = state.activeEvent?.id ?? '';
  if (eventNoticeId !== id) {
    slot.innerHTML = renderEventMarkup();
    eventNoticeId = id;
    if (id) { playSound('event'); notify('A rare equation appeared', 'There is a short window to collect it.', 'event'); }
  } else if (state.activeEvent) {
    const small = $('small', slot);
    if (small) small.textContent = 'Collect it for a point reward and a short production boost · ' + getEventRemaining(state) + 's';
  }
}
function visibleUpgrades() {
  const candidates = UPGRADES.filter((item) => upgradeFilter === 'all'
    || (upgradeFilter === 'calculators' ? item.rate != null : item.rate == null));
  const unlocked = candidates.filter((item) => getUpgradeUnlock(item, state).unlocked || getOwned(state, item.id) > 0);
  const locked = candidates.filter((item) => !getUpgradeUnlock(item, state).unlocked && getOwned(state, item.id) === 0)
    .sort((a, b) => a.unlockAt - b.unlockAt);
  return unlocked.concat(locked.slice(0, 3));
}
function renderUpgradeCard(item) {
  const quote = getPurchaseQuote(state, item.id, buyMode);
  const unlocked = getUpgradeUnlock(item, state);
  const owned = getOwned(state, item.id);
  const locked = !unlocked.unlocked && owned === 0;
  if (locked) {
    return '<article class="upgrade-card" data-upgrade-id="' + esc(item.id) + '"><span class="upgrade-icon">' + esc(item.icon) + '</span><span class="upgrade-copy"><h3>' + esc(item.name) + '</h3><p>' + esc(unlocked.requirement) + '</p></span><span class="upgrade-count">LOCKED</span></article>';
  }
  const benefit = item.rate != null
    ? '+' + number(item.rate) + ' / sec each'
    : item.kind === 'clickMultiplier' ? '×' + number(item.value) + ' click power / level'
    : item.kind === 'clickFlat' ? '+' + number(item.value) + ' per click'
    : item.kind === 'offline' ? '+' + Math.round(item.value * 100) + '% offline'
    : item.kind === 'globalProduction' ? '+' + Math.round((item.value - 1) * 100) + '% production'
    : item.kind === 'critical' ? '5× lucky calculation'
    : item.kind === 'focus' ? 'Unlocks Focus burst'
    : item.kind === 'event' ? 'More rare equations'
    : '+' + Math.round(item.value * 100) + '% streak power';
  const soldOut = quote.soldOut;
  const affordable = quote.affordable;
  const action = soldOut ? 'MAXED' : 'Buy ' + quote.quantity;
  const cost = soldOut ? 'OWNED' : number(quote.cost || getNextCost(state, item));
  return '<article class="upgrade-card ' + (affordable ? 'affordable' : '') + '" data-upgrade-id="' + esc(item.id) + '">'
    + '<span class="upgrade-icon">' + esc(item.icon) + '</span>'
    + '<span class="upgrade-copy"><h3>' + esc(item.name) + '<span class="upgrade-count">×' + number(owned) + '</span></h3>'
    + '<p>' + esc(item.description) + '</p><span class="upgrade-meta"><strong>' + esc(benefit) + '</strong></span></span>'
    + '<button class="button compact ' + (affordable ? 'primary' : '') + '" data-action="buy" data-id="' + esc(item.id) + '" data-mode="' + esc(buyMode) + '" ' + (affordable ? '' : 'disabled') + '>'
    + '<span class="purchase-count">' + esc(action) + '</span><span class="purchase-price">' + esc(cost) + '</span></button></article>';
}
function renderLab() {
  const focus = getOwned(state, 'focus-mode') > 0;
  const focusButton = focus
    ? '<button class="button small soft" data-action="focus-burst" id="focus-button">Focus burst · ' + (getFocusRemaining(state) ? getFocusRemaining(state) + 's' : state.boosts.focusReadyAt > Date.now() ? timeLabel((state.boosts.focusReadyAt - Date.now()) / 1000) : 'ready') + '</button>'
    : '<span class="pill">Next: buy a calculator</span>';
  const filters = [['all', 'All'], ['calculators', 'Production'], ['tools', 'Click tools']].map((item) =>
    '<button class="filter-chip ' + (upgradeFilter === item[0] ? 'active' : '') + '" data-action="upgrade-filter" data-filter="' + item[0] + '">' + item[1] + '</button>').join('');
  const cards = visibleUpgrades().map(renderUpgradeCard).join('');
  screenHost.innerHTML = '<div class="page-wrap"><div class="game-layout">'
    + '<section class="game-main">'
    + '<div class="game-intro"><div><p class="eyebrow">THE STUDY HALL</p><h1>Make math <span>add up.</span></h1><p>One good calculation can turn into quite a lot.</p></div><div class="live-stats">'
    + '<div class="live-stat"><small>PER SECOND</small><strong id="stat-pps">' + number(getProduction(state)) + '</strong></div>'
    + '<div class="live-stat"><small>PER CLICK</small><strong id="stat-ppc">' + number(getClickPower(state)) + '</strong></div></div></div>'
    + '<div id="event-slot">' + renderEventMarkup() + '</div>'
    + '<section class="click-stage" aria-label="Calculator click area"><span class="stage-glow"></span><div class="float-layer" id="float-layer"></div>'
    + '<button class="calc-button" id="click-button" data-action="click" aria-label="Calculate and earn Calculator Points">'
    + '<span class="calc-screen"><small>CALC CLICKER · READY</small><strong id="calc-total">' + number(state.points) + '</strong></span>'
    + '<span class="calc-keys" aria-hidden="true"><span class="calc-key">7</span><span class="calc-key">8</span><span class="calc-key">9</span><span class="calc-key operator">÷</span>'
    + '<span class="calc-key">4</span><span class="calc-key">5</span><span class="calc-key">6</span><span class="calc-key operator">×</span>'
    + '<span class="calc-key">1</span><span class="calc-key">2</span><span class="calc-key">3</span><span class="calc-key operator">−</span>'
    + '<span class="calc-key">0</span><span class="calc-key">.</span><span class="calc-key equals">=</span></span></button>'
    + '<div class="click-instruction"><strong>Tap or press Enter</strong> to calculate · every click counts</div></section>'
    + '<div class="stage-bottom"><span class="streak-box"><span class="streak-icon">↗</span><strong id="streak-value">' + state.streak.count + '</strong><span>click streak</span><span class="streak-track"><span class="streak-fill" id="streak-fill"></span></span></span>' + focusButton + '</div>'
    + '<div class="mini-stat">Lifetime earned <strong>' + number(state.stats.totalEarned) + ' points</strong></div>'
    + '</section>'
    + '<aside class="upgrade-panel panel"><div class="upgrade-head"><div><span class="panel-label">Your toolkit</span><h2>Upgrades</h2></div><div><span class="panel-label">BUY</span><div class="buy-modes" role="group" aria-label="Purchase quantity">'
    + ['1', '10', 'max'].map((mode) => '<button class="buy-mode ' + (buyMode === mode ? 'active' : '') + '" data-action="buy-mode" data-mode="' + mode + '" aria-pressed="' + (buyMode === mode) + '">' + (mode === 'max' ? 'MAX' : mode) + '</button>').join('')
    + '</div></div></div><div class="upgrade-filters">' + filters + '</div><div class="upgrade-list" id="upgrade-list">' + (cards || '<p class="upgrade-empty">No tools in this group yet.</p>') + '</div>'
    + '<div style="padding:0 17px 15px;color:#8295a8;font-size:10px">New tools appear as your lifetime points grow.</div></aside>'
    + '</div></div>';
}
function syncUpgradeAffordability() {
  const list = $('#upgrade-list');
  if (!list || currentScreen !== 'lab') return;
  $$('.upgrade-card[data-upgrade-id]', list).forEach((card) => {
    const quote = getPurchaseQuote(state, card.dataset.upgradeId, buyMode);
    const button = $('button[data-action="buy"]', card);
    if (!button) return;
    button.dataset.mode = buyMode;
    button.disabled = !quote.affordable;
    button.classList.toggle('primary', quote.affordable);
    const count = $('.purchase-count', button);
    const cost = $('.purchase-price', button);
    if (count) count.textContent = quote.soldOut ? 'MAXED' : 'Buy ' + quote.quantity;
    if (cost) cost.textContent = quote.soldOut ? 'OWNED' : number(quote.cost || getNextCost(state, card.dataset.upgradeId));
    card.classList.toggle('affordable', quote.affordable);
  });
}

function renderChallenges() {
  const challenge = getDailyChallenge(state);
  const done = state.daily.progress >= challenge.goal;
  const claimed = state.daily.claimed;
  const pct = percent(state.daily.progress, challenge.goal);
  const recent = state.dailyHistory.slice(-7).reverse();
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('A fresh page every day', 'Daily <em>challenge.</em>', 'A small goal, a tidy reward, and a reason to keep your streak going.')
    + '<section class="daily-hero"><p class="eyebrow">TODAY’S PRACTICE · ' + esc(new Date(state.daily.dayIndex * 86_400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })) + ' UTC</p>'
    + '<h2>' + esc(challenge.name) + '</h2><p>' + esc(challenge.description) + '</p>'
    + '<div class="daily-reward">✦ Reward · ' + number(challenge.reward) + ' Calculator Points</div>'
    + '<div class="daily-actions"><div class="progress-area"><div class="progress-head"><span>Challenge progress</span><strong id="challenge-progress-text">' + number(state.daily.progress) + ' / ' + number(challenge.goal) + '</strong></div>'
    + '<div class="progress-track"><div class="progress-fill mint" id="challenge-progress-fill" style="width:' + pct + '%"></div></div></div>'
    + '<button class="button ' + (done && !claimed ? 'primary' : '') + '" data-action="claim-daily" ' + (done && !claimed ? '' : 'disabled') + '>' + (claimed ? 'Completed today' : done ? 'Claim reward' : 'Keep going') + '</button></div>'
    + '</section><div class="content-grid" style="margin-top:15px"><section class="panel pad-panel"><div class="panel-heading"><div><span class="panel-label">How it works</span><h2>One goal, one claim</h2></div><span class="pill blue">UTC day</span></div>'
    + '<p class="challenge-note">Your challenge rotates once per UTC day. Progress saves with your game, and a completed day can only be claimed once. The game remembers the latest day it has seen if your device clock moves backwards.</p>'
    + '<div class="muted-callout" style="margin-top:14px">Challenge progress is earned naturally while you play. No ad, account or extra step is required.</div></section>'
    + '<section class="panel pad-panel"><div class="panel-heading"><div><span class="panel-label">Your record</span><h2>Completed challenges</h2></div><span class="pill mint">' + state.stats.challengesCompleted + ' total</span></div>'
    + (recent.length ? '<div class="daily-history">' + recent.map((day) => '<div class="history-row"><strong>' + esc(day) + '</strong><span>Reward claimed ✓</span></div>').join('') + '</div>' : '<p class="challenge-note">Your first daily reward will show here after you claim it.</p>')
    + '</section></div></div>';
}
function syncChallengeProgress() {
  const fill = $('#challenge-progress-fill');
  if (!fill || currentScreen !== 'challenges') return;
  const challenge = getDailyChallenge(state);
  const done = state.daily.progress >= challenge.goal;
  fill.style.width = percent(state.daily.progress, challenge.goal) + '%';
  const text = $('#challenge-progress-text');
  if (text) text.textContent = number(state.daily.progress) + ' / ' + number(challenge.goal);
  const button = $('[data-action="claim-daily"]');
  if (button) {
    button.disabled = !done || state.daily.claimed;
    button.classList.toggle('primary', done && !state.daily.claimed);
    button.textContent = state.daily.claimed ? 'Completed today' : done ? 'Claim reward' : 'Keep going';
  }
}
function renderAchievements() {
  const categories = ['All', ...new Set(ACHIEVEMENTS.map((item) => item.category))];
  const list = achievementFilter === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter((item) => item.category === achievementFilter);
  const unlocked = totalUnlocked();
  const filters = categories.map((category) => {
    const key = category === 'All' ? 'all' : category;
    return '<button class="filter-chip ' + (achievementFilter === key ? 'active' : '') + '" data-action="achievement-filter" data-filter="' + esc(key) + '">' + esc(category) + '</button>';
  }).join('');
  const cards = list.map((achievement) => {
    const earned = Boolean(state.achievements[achievement.id]);
    const progress = getAchievementProgress(state, achievement);
    const ratio = progress.ratio * 100;
    return '<article class="achievement-card ' + (earned ? 'unlocked' : '') + '" data-achievement-id="' + esc(achievement.id) + '" data-metric="' + esc(achievement.metric) + '" data-goal="' + achievement.goal + '">'
      + '<div class="achievement-top"><span class="achievement-icon">' + (earned ? '✓' : '◇') + '</span><div class="achievement-copy"><h3>' + esc(achievement.name) + '</h3><p>' + esc(achievement.description) + '</p></div>'
      + '<span class="achievement-reward">+' + number(achievement.reward) + '</span></div>'
      + '<div class="achievement-progress"><div class="progress-head"><span>' + (earned ? 'Unlocked' : 'Progress') + '</span><strong class="achievement-value">' + (earned ? 'Complete' : number(progress.value) + ' / ' + number(progress.goal)) + '</strong></div>'
      + '<div class="progress-track"><div class="progress-fill mint" style="width:' + ratio + '%"></div></div></div></article>';
  }).join('');
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('Things worth remembering', 'Little <em>victories.</em>', 'Every milestone is earned through play and stays with your profile after a reset.', '<span class="pill mint">' + unlocked + ' / ' + ACHIEVEMENTS.length + ' unlocked</span>')
    + '<div class="filter-row">' + filters + '</div><div class="achievement-grid">' + cards + '</div></div>';
}
function syncAchievementProgress() {
  if (currentScreen !== 'achievements') return;
  $$('.achievement-card').forEach((card) => {
    const achievement = ACHIEVEMENTS.find((item) => item.id === card.dataset.achievementId);
    if (!achievement) return;
    const progress = getAchievementProgress(state, achievement);
    const earned = Boolean(state.achievements[achievement.id]);
    card.classList.toggle('unlocked', earned);
    const icon = $('.achievement-icon', card);
    if (icon) icon.textContent = earned ? '✓' : '◇';
    const label = $('.achievement-value', card);
    const bar = $('.progress-fill', card);
    if (label) label.textContent = earned ? 'Complete' : number(progress.value) + ' / ' + number(progress.goal);
    if (bar) bar.style.width = (progress.ratio * 100) + '%';
  });
}
function renderPerkCard(item, tree) {
  const rebirth = tree === 'rebirth';
  const levels = rebirth ? state.prestige.rebirthUpgrades : state.prestige.upgrades;
  const currency = rebirth ? state.prestige.rebirthTokens : state.prestige.stars;
  const level = levels[item.id] || 0;
  const cost = item.cost;
  const maxed = level >= item.max;
  const affordable = !maxed && currency >= cost;
  const action = rebirth ? 'buy-rebirth-upgrade' : 'buy-prestige-upgrade';
  return '<article class="perk-card"><span class="perk-icon">' + esc(item.icon) + '</span><h3>' + esc(item.name) + ' <span class="upgrade-count">' + level + '/' + item.max + '</span></h3>'
    + '<p>' + esc(item.description) + '</p><button class="button compact ' + (affordable ? 'primary' : '') + '" data-action="' + action + '" data-id="' + esc(item.id) + '" ' + (affordable ? '' : 'disabled') + '>'
    + (maxed ? 'Max level' : 'Buy · ' + cost + (rebirth ? ' rebirth marks' : ' stars')) + '</button></article>';
}
function renderPrestige() {
  const reward = prestigeReward(state);
  const eligible = canPrestige(state);
  const nextReward = Math.max(1, reward + 1);
  const nextTarget = 250_000 * nextReward * nextReward;
  const prestigePct = percent(state.runEarned, nextTarget);
  const rebirthEligible = canRebirth(state);
  const rebirthTarget = 500_000_000;
  const rebirthPct = percent(state.runEarned, rebirthTarget);
  const resetButton = '<button class="button ' + (eligible ? 'primary' : '') + '" data-action="open-prestige" ' + (eligible ? '' : 'disabled') + '>'
    + (eligible ? 'Prestige · gain ' + reward + ' star' + (reward === 1 ? '' : 's') : 'Reach the milestone to prestige') + '</button>';
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('Long-term progression', 'Start <em>again, stronger.</em>', 'Prestige trades this run for permanent choices. Rebirth is a deeper reset that starts a new prestige journey.')
    + '<section class="prestige-hero"><div><p class="eyebrow">PRESTIGE · CURRENT RUN</p><h2>Fresh notebook, sharper tools.</h2><p>Earn ' + number(nextTarget) + ' points in this run to gain ' + nextReward + ' prestige star' + (nextReward === 1 ? '' : 's') + '. Your first star arrives at 250K run points.</p>'
    + '<div style="max-width:520px;margin-top:16px"><div class="progress-head"><span>Run points</span><strong>' + number(state.runEarned) + ' / ' + number(nextTarget) + '</strong></div><div class="progress-track"><div class="progress-fill orange" style="width:' + prestigePct + '%"></div></div></div>'
    + '<div style="margin-top:15px">' + resetButton + '</div></div><div class="prestige-count"><strong>' + number(state.prestige.stars) + '</strong><small>PRESTIGE STARS</small></div></section>'
    + '<div class="reset-details"><div class="reset-info"><strong>Resets on prestige</strong><p>Current points, this-run earnings, click and production upgrades, streak, active event and temporary boosts.</p></div><div class="reset-info"><strong>Kept after prestige</strong><p>Prestige stars and perks, lifetime records, achievements, daily progress, settings and save data.</p></div></div>'
    + '<section class="panel pad-panel" style="margin-top:14px"><div class="panel-heading"><div><span class="panel-label">Permanent tree</span><h2>Prestige upgrades</h2><p>Spend stars on bonuses that stay through future prestiges.</p></div><span class="pill orange">' + number(state.prestige.stars) + ' stars</span></div>'
    + '<div class="perk-grid">' + PRESTIGE_UPGRADES.map((item) => renderPerkCard(item, 'prestige')).join('') + '</div></section>'
    + '<section class="prestige-hero rebirth-panel" style="margin-top:16px"><div><p class="eyebrow">REBIRTH · DEEPER RESET</p><h2>Turn a long journey into a new beginning.</h2><p>Requires five completed prestige cycles and ' + number(rebirthTarget) + ' points this run. Rebirth resets your run, prestige stars, prestige perks and current prestige cycles. It keeps your rebirth marks and their separate upgrade tree.</p>'
    + '<div style="max-width:520px;margin-top:16px"><div class="progress-head"><span>Prestige cycles · run points</span><strong>' + state.prestige.cycles + ' / 5 · ' + number(state.runEarned) + ' / ' + number(rebirthTarget) + '</strong></div><div class="progress-track"><div class="progress-fill" style="width:' + Math.min(percent(state.prestige.cycles, 5), rebirthPct) + '%"></div></div></div>'
    + '<div style="margin-top:15px"><button class="button ' + (rebirthEligible ? 'primary' : '') + '" data-action="open-rebirth" ' + (rebirthEligible ? '' : 'disabled') + '>' + (rebirthEligible ? 'Rebirth · gain ' + rebirthReward(state) + ' mark' + (rebirthReward(state) === 1 ? '' : 's') : 'Complete five prestige cycles and reach 500M run points') + '</button></div></div>'
    + '<div class="prestige-count"><strong>' + number(state.prestige.rebirthTokens) + '</strong><small>REBIRTH MARKS</small></div></section>'
    + '<section class="panel pad-panel" style="margin-top:14px"><div class="panel-heading"><div><span class="panel-label">Rebirth tree</span><h2>Knowledge that carries forward</h2><p>These upgrades survive future rebirths.</p></div><span class="pill blue">' + number(state.prestige.rebirthTokens) + ' marks</span></div>'
    + '<div class="perk-grid">' + REBIRTH_UPGRADES.map((item) => renderPerkCard(item, 'rebirth')).join('') + '</div></section></div>';
}
function renderRecords() {
  const rows = [
    ['Calculator Points earned', number(state.stats.totalEarned)],
    ['Points this run', number(state.runEarned)],
    ['Calculations made', number(state.stats.totalClicks)],
    ['Current click value', number(getClickPower(state))],
    ['Current points per second', number(getProduction(state))],
    ['Best production rate', number(state.stats.highestProduction) + ' / sec'],
    ['Study time', timeLabel(state.stats.totalPlaySeconds)],
    ['Upgrades purchased', number(state.stats.totalUpgradesPurchased)],
    ['Upgrade types discovered', totalUpgradeVariety(state) + ' / ' + UPGRADES.length],
    ['Rare equations collected', number(state.stats.rareEvents)],
    ['Daily challenges claimed', number(state.stats.challengesCompleted)],
    ['Milestones unlocked', totalUnlocked() + ' / ' + ACHIEVEMENTS.length],
    ['Prestige cycles completed', number(state.stats.totalPrestiges)],
    ['Rebirths completed', number(state.stats.totalRebirths)],
  ];
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('Numbers from your save', 'Your <em>records.</em>', 'A personal progress board for this save. Online rankings are not configured, so no global scores are shown.')
    + '<div class="local-only"><span>▤</span><span>LOCAL RECORDS · visible only in this browser or your connected CrazyGames save.</span></div>'
    + '<div class="records-grid">' + rows.map((row) => '<div class="record-row"><span>' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong></div>').join('') + '</div>'
    + '<section class="panel pad-panel" style="margin-top:14px"><div class="panel-heading"><div><span class="panel-label">Your current multipliers</span><h2>What is helping right now?</h2></div></div>'
    + '<div class="metric-grid"><div class="metric-card"><small>Permanent gain</small><strong>×' + number(getGlobalMultiplier(state, 0, false)) + '</strong><em>Prestige and permanent upgrades</em></div>'
    + '<div class="metric-card"><small>Offline efficiency</small><strong>' + Math.round(getOfflineEfficiency(state) * 100) + '%</strong><em>Capped at 85%</em></div>'
    + '<div class="metric-card"><small>Calculator Points</small><strong>' + number(state.points) + '</strong><em>Ready to spend</em></div>'
    + '<div class="metric-card"><small>Highest streak</small><strong>' + number(state.stats.bestStreak) + '</strong><em>Best consecutive clicks</em></div></div></section></div>';
}
function renderBreak() {
  const status = platform.getStatus();
  const ads = status.hasAds;
  const cooldown = Math.max(0, Math.ceil((state.boosts.adReadyAt - Date.now()) / 1000));
  const adContent = ads
    ? '<p>The ad is optional. A completed video grants the boost; a failed or unavailable ad does not. You can also buy the same boost with points.</p>'
      + (cooldown ? '<span class="pill orange" style="margin-bottom:11px">Available in ' + timeLabel(cooldown) + '</span>' : '')
      + '<button class="button primary block" data-action="watch-ad" ' + (cooldown || adInProgress ? 'disabled' : '') + '>▶ &nbsp; Watch video · 2× for 60 seconds</button>'
      + '<button class="button block" style="margin-top:8px" data-action="skip-ad">Continue without a video</button>'
    : '<p>Video offers are available only when the official CrazyGames SDK provides them. Study Break, focus bursts and the rest of the game work without online services.</p>'
      + '<span class="pill">Standalone mode · no ads</span>';
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('Put down the pencil for a moment', 'Study <em>break.</em>', 'Take a short production boost, then jump back into the Study Hall.')
    + '<div class="break-grid"><section class="panel break-card"><span class="break-icon">◷</span><h2>Point-funded boost</h2><p>Spend 1,000 Calculator Points for a 60-second double production boost. This option works anywhere and has no cooldown.</p>'
    + '<button class="button primary block" data-action="buy-focus-boost" ' + (state.points < 1_000 || getActiveBoostRemaining(state) ? 'disabled' : '') + '>Buy boost · 1,000 points</button></section>'
    + '<section class="panel break-card ad-card"><span class="break-icon">▶</span><h2>Optional video boost</h2>' + adContent + '</section></div>'
    + '<div class="muted-callout" style="margin-top:14px">No ad is required to progress. Focus Mode, daily rewards, rare equations and offline earnings offer other ways to grow.</div></div>';
}

function sdkDescription(status) {
  if (status.mode === 'active') {
    return 'CrazyGames SDK v3 is active. The CrazyGames Data Module is the save store for this platform; it synchronizes according to the SDK. Ads are requested only through the SDK.';
  }
  if (status.mode === 'local-test') {
    return 'CrazyGames SDK local simulation is active on localhost. Demo ads and account data are for integration checks; they are not proof of production ads or cloud saves.';
  }
  if (status.mode === 'sdk-unavailable') {
    return 'SDK loading or initialization did not complete. The game is playable and saves on this device. ' + (status.error || '');
  }
  return 'Standalone mode. CrazyGames methods are not called on this host; progress saves locally in this browser.';
}
function renderSettings() {
  const status = platform.getStatus();
  const version = '1.0.0';
  screenHost.innerHTML = '<div class="page-wrap">'
    + pageHeading('Make it yours', 'Game <em>settings.</em>', 'Sound, motion and number display preferences are saved with this browser.')
    + '<div class="content-grid"><section class="panel pad-panel"><div class="panel-heading"><div><span class="panel-label">Comfort</span><h2>Play preferences</h2></div></div><div class="settings-list">'
    + '<label class="setting-row" for="setting-volume"><span class="setting-copy"><strong>Master volume</strong><small>Short, original calculator tones.</small></span><span class="setting-control"><input id="setting-volume" type="range" min="0" max="1" step="0.05" value="' + state.settings.volume + '" aria-label="Master volume"><output id="volume-value">' + Math.round(state.settings.volume * 100) + '%</output></span></label>'
    + '<label class="setting-row" for="setting-sound"><span class="setting-copy"><strong>Sound effects</strong><small>Click, purchase and milestone sounds.</small></span><span class="setting-control"><input id="setting-sound" type="checkbox" ' + (state.settings.sound ? 'checked' : '') + '></span></label>'
    + '<label class="setting-row" for="setting-motion"><span class="setting-copy"><strong>Reduced motion</strong><small>Use shorter, gentler transitions.</small></span><span class="setting-control"><input id="setting-motion" type="checkbox" ' + (state.settings.reducedMotion ? 'checked' : '') + '></span></label>'
    + '<label class="setting-row" for="setting-numbers"><span class="setting-copy"><strong>Number display</strong><small>Compact suffixes or full numbers.</small></span><span class="setting-control"><select id="setting-numbers" aria-label="Number display"><option value="compact" ' + (state.settings.numberMode === 'compact' ? 'selected' : '') + '>Compact</option><option value="full" ' + (state.settings.numberMode === 'full' ? 'selected' : '') + '>Full numbers</option></select></span></label>'
    + '</div><div class="settings-actions"><button class="button" data-action="manual-save">Save now</button><button class="button" data-action="export-save">Export save</button><button class="button warn" data-action="open-reset">Reset progress</button></div></section>'
    + '<aside class="stack"><section class="panel pad-panel"><div class="panel-heading"><div><span class="panel-label">Progress safety</span><h2>Save status</h2></div></div>'
    + '<div class="status-box"><span class="status-symbol">✓</span><span><strong>' + esc(saveLabel) + '</strong><p>Autosaves after meaningful changes, when the page is hidden and before it closes. Saves use a versioned schema with a recoverable previous copy.</p></span></div>'
    + '<div class="status-box" style="margin-top:9px"><span class="status-symbol">◈</span><span><strong>' + (status.hasData ? 'Data Module available' : 'Local save active') + '</strong><p>' + esc(sdkDescription(status)) + '</p></span></div>'
    + '<p class="credits" style="margin-top:14px">Current environment: <strong>' + esc(status.environment) + '</strong> · SDK: <strong>' + esc(status.mode) + '</strong>' + (status.accountAvailable ? ' · platform account features available' : '') + '</p></section>'
    + '<section class="panel pad-panel"><div class="panel-heading"><div><span class="panel-label">People and tools</span><h2>Credits</h2></div><span class="pill">v' + version + '</span></div>'
    + '<p class="credits"><strong>PixelForge Studios</strong> · studio<br><strong>Ron</strong> · main developer<br>Studio mark: PixelForge Studios public repository<br>All game interface art and sound effects are original CSS, SVG and Web Audio. No third-party code or sound files are used.</p></section></aside></div></div>';
}
function openModal(title, subtitle, body, actions) {
  modalReturnFocus = document.activeElement;
  gameShell.inert = true;
  modalRoot.innerHTML = '<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-subtitle">'
    + '<header class="modal-head"><span><h2 id="modal-title">' + esc(title) + '</h2><p id="modal-subtitle">' + esc(subtitle) + '</p></span><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></header>'
    + '<div class="modal-body">' + body + '<div class="modal-actions">' + actions + '</div></div></section></div>';
  updatePlatformLifecycle();
  const close = $('[data-action="close-modal"]', modalRoot);
  close?.focus({ preventScroll: true });
}
function closeModal() {
  modalRoot.replaceChildren();
  gameShell.inert = false;
  modalConfirm = null;
  updatePlatformLifecycle();
  modalReturnFocus?.focus?.({ preventScroll: true });
  modalReturnFocus = null;
}
function confirmPrestige() {
  const reward = prestigeReward(state);
  openModal('Start a new notebook?', 'You will receive ' + reward + ' prestige star' + (reward === 1 ? '' : 's') + '.', '<p>Prestige is permanent. This resets your current points, this-run earnings, all normal upgrades, your streak, the rare equation and temporary boosts.</p><ul class="confirm-list"><li><strong>Kept:</strong> prestige stars and tree, rebirth progress, achievements, lifetime stats, daily progress, settings and save.</li><li><strong>Reward:</strong> ' + reward + ' prestige star' + (reward === 1 ? '' : 's') + ' for the current run.</li></ul>', '<button class="button" data-action="close-modal">Keep playing</button><button class="button primary" data-action="confirm-prestige">Prestige now</button>');
}
function confirmRebirth() {
  const reward = rebirthReward(state);
  openModal('Begin a rebirth?', 'You will receive ' + reward + ' rebirth mark' + (reward === 1 ? '' : 's') + '.', '<p>Rebirth is deeper than prestige. It requires five prestige cycles and 500M points in this run.</p><ul class="confirm-list"><li><strong>Reset:</strong> run points, normal upgrades, prestige stars, prestige perks and completed cycles.</li><li><strong>Kept:</strong> rebirth marks and perks, lifetime records, achievements, daily progress, settings and save.</li></ul>', '<button class="button" data-action="close-modal">Keep playing</button><button class="button primary" data-action="confirm-rebirth">Rebirth now</button>');
}
function confirmReset() {
  openModal('Reset all progress?', 'This replaces your current game save.', '<p>This clears Calculator Points, upgrades, challenges, achievements and long-term progression. A backup of the most recent saved game is kept where browser storage allows.</p><p>For an extra copy, export your save before resetting.</p>', '<button class="button" data-action="close-modal">Cancel</button><button class="button warn" data-action="confirm-reset">Reset progress</button>');
}
function showOfflineSummary(offline) {
  if (!offline || offline.reward < 1) return;
  const body = '<div class="offline-summary"><span class="offline-emblem">↗</span><div><p>You were away for <strong>' + esc(timeLabel(offline.elapsed)) + '</strong> and earned <strong>' + number(offline.reward) + ' Calculator Points</strong>.</p><p>Offline efficiency: ' + Math.round(offline.efficiency * 100) + '% · earnings are capped at 7 days.</p></div></div>';
  openModal('Welcome back!', 'Your calculators kept working while you were away.', body, '<button class="button primary" data-action="close-modal">Back to the game</button>');
}
function flushSave() {
  if (!state) return;
  const result = saveGameState(state, platform);
  updateSaveStatus(result.status, result.ok ? '' : 'error');
  if (currentScreen === 'settings') {
    const label = $('.status-box strong', screenHost);
    if (label) label.textContent = result.status;
  }
  return result;
}
function scheduleSave(immediate = false) {
  if (!state) return;
  if (saveTimer) clearTimeout(saveTimer);
  if (immediate) { flushSave(); return; }
  updateSaveStatus('Saving…');
  saveTimer = setTimeout(() => { saveTimer = 0; flushSave(); }, 850);
}
function exportProgress() {
  try {
    const blob = new Blob([exportSave(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calc-clicker-save-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    notify('Save exported', 'A JSON copy was downloaded.', 'quiet');
  } catch {
    notify('Export unavailable', 'Your browser could not create a save file.', 'quiet');
  }
}
function performProgressReset() {
  scheduleSave(true);
  const settings = { ...state.settings };
  state = createFreshState(Date.now());
  state.settings = settings;
  currentScreen = 'lab';
  eventNoticeId = '';
  closeModal();
  renderScreen();
  scheduleSave(true);
  notify('Progress reset', 'A new study session is ready.', 'quiet');
}
function floatGain(gain, critical) {
  const layer = $('#float-layer');
  const button = $('#click-button');
  if (!layer || !button) return;
  const item = document.createElement('span');
  item.className = 'float-gain' + (critical ? ' critical' : '');
  item.textContent = (critical ? '✦ ' : '+') + number(gain);
  const box = button.getBoundingClientRect();
  const target = layer.getBoundingClientRect();
  item.style.left = (box.left - target.left + box.width * (0.38 + Math.random() * 0.24)) + 'px';
  item.style.top = (box.top - target.top + box.height * 0.38) + 'px';
  layer.append(item);
  setTimeout(() => item.remove(), 850);
}
function handleClick(event) {
  const button = event.target.closest('[data-action], [data-screen]');
  if (!button) {
    if (event.target.classList.contains('modal-backdrop')) closeModal();
    return;
  }
  if (button.dataset.screen) {
    event.preventDefault();
    goToScreen(button.dataset.screen);
    return;
  }
  const action = button.dataset.action;
  if (action === 'close-modal' || action === 'backdrop-close' && event.target === button) { closeModal(); return; }
  if (action === 'click') {
    const result = clickCalculator(state, Date.now());
    playSound('click');
    floatGain(result.gain, result.critical);
    button.classList.add('pulse');
    setTimeout(() => button.classList.remove('pulse'), 100);
    celebrateAchievements(result.achievements);
    scheduleSave();
    syncHeader();
    return;
  }
  if (action === 'buy-mode') {
    buyMode = button.dataset.mode;
    renderLab();
    syncHeader();
    return;
  }
  if (action === 'upgrade-filter') {
    upgradeFilter = button.dataset.filter;
    renderLab();
    syncHeader();
    return;
  }
  if (action === 'achievement-filter') {
    achievementFilter = button.dataset.filter;
    renderAchievements();
    return;
  }
  if (action === 'buy') {
    const result = buyUpgrade(state, button.dataset.id, button.dataset.mode);
    if (!result.bought) return;
    playSound('purchase');
    const boughtCount = result.quote.quantity;
    notify(result.upgrade.name + (boughtCount > 1 ? ' ×' + boughtCount : ' purchased'), boughtCount > 1 ? number(result.quote.cost) + ' points invested.' : 'Your toolkit is a little stronger.', 'purchase');
    celebrateAchievements(result.achievements);
    if (currentScreen === 'lab') renderLab();
    else if (currentScreen === 'prestige') renderPrestige();
    else renderScreen();
    scheduleSave();
    return;
  }
  if (action === 'collect-event') {
    const result = collectRareEquation(state);
    if (!result.collected) { notify('The equation faded', 'Watch for the next rare one.', 'quiet'); }
    else {
      playSound('event');
      notify('Rare equation solved', '+' + number(result.reward) + ' points · 2× production boost', 'event');
      celebrateAchievements(result.achievements);
      scheduleSave();
    }
    renderLab();
    syncHeader();
    return;
  }
  if (action === 'focus-burst') {
    const result = activateFocus(state);
    if (result.activated) {
      notify('Focus mode', '2× production for 15 seconds.', 'event');
      scheduleSave();
      syncHeader();
    } else notify(result.reason === 'locked' ? 'Focus Mode is locked' : 'Focus is recharging', result.reason === 'locked' ? 'Find it in Click tools.' : timeLabel((result.readyAt - Date.now()) / 1000) + ' remaining.', 'quiet');
    return;
  }
  if (action === 'claim-daily') {
    const result = claimDailyChallenge(state);
    if (result.claimed) {
      notify('Daily reward claimed', '+' + number(result.reward) + ' points · ' + result.challenge.name, 'achievement');
      celebrateAchievements(result.achievements);
      renderChallenges();
      scheduleSave();
    }
    syncHeader();
    return;
  }
  if (action === 'open-prestige') { confirmPrestige(); return; }
  if (action === 'confirm-prestige') {
    const result = performPrestige(state);
    closeModal();
    if (result.performed) {
      playSound('achievement');
      currentScreen = 'prestige';
      renderScreen();
      notify('Fresh notebook', '+' + result.reward + ' prestige star' + (result.reward === 1 ? '' : 's'), 'achievement');
      celebrateAchievements(result.achievements);
      scheduleSave(true);
    }
    return;
  }
  if (action === 'buy-prestige-upgrade') {
    const result = purchasePrestigeUpgrade(state, button.dataset.id);
    if (result.bought) { playSound('purchase'); renderPrestige(); scheduleSave(); celebrateAchievements(result.achievements); }
    return;
  }
  if (action === 'open-rebirth') { confirmRebirth(); return; }
  if (action === 'confirm-rebirth') {
    const result = performRebirth(state);
    closeModal();
    if (result.performed) {
      currentScreen = 'prestige';
      renderScreen();
      notify('New curriculum', '+' + result.reward + ' rebirth mark' + (result.reward === 1 ? '' : 's'), 'achievement');
      celebrateAchievements(result.achievements);
      scheduleSave(true);
    }
    return;
  }
  if (action === 'buy-rebirth-upgrade') {
    const result = purchaseRebirthUpgrade(state, button.dataset.id);
    if (result.bought) { playSound('purchase'); renderPrestige(); scheduleSave(); celebrateAchievements(result.achievements); }
    return;
  }
  if (action === 'buy-focus-boost') {
    const result = buyFocusBoost(state);
    if (result.bought) { notify('Study boost activated', '2× production for 60 seconds.', 'event'); playSound('event'); scheduleSave(); renderBreak(); syncHeader(); }
    else if (result.reason === 'active') notify('A boost is already running', 'Come back after it ends.', 'quiet');
    else notify('Not quite enough points', 'A study boost costs 1,000 points.', 'quiet');
    return;
  }
  if (action === 'skip-ad') { goToScreen('lab'); return; }
  if (action === 'watch-ad') { watchRewardedVideo(); return; }
  if (action === 'manual-save') {
    const result = flushSave();
    notify(result?.ok ? 'Progress saved' : 'Save needs attention', result?.status || 'Storage is unavailable.', result?.ok ? 'quiet' : 'event');
    return;
  }
  if (action === 'export-save') { exportProgress(); return; }
  if (action === 'open-reset') { confirmReset(); return; }
  if (action === 'confirm-reset') { performProgressReset(); return; }
}

function handleInput(event) {
  if (event.target.id === 'setting-volume') {
    state.settings.volume = Math.max(0, Math.min(1, Number(event.target.value) || 0));
    const output = $('#volume-value');
    if (output) output.textContent = Math.round(state.settings.volume * 100) + '%';
    scheduleSave();
  }
}
function handleChange(event) {
  const target = event.target;
  if (target.id === 'setting-sound') state.settings.sound = target.checked;
  else if (target.id === 'setting-motion') state.settings.reducedMotion = target.checked;
  else if (target.id === 'setting-numbers') state.settings.numberMode = target.value === 'full' ? 'full' : 'compact';
  else if (target.id === 'setting-volume') state.settings.volume = Math.max(0, Math.min(1, Number(target.value) || 0));
  else return;
  updateMotionPreference();
  scheduleSave(true);
  renderSettings();
  syncHeader();
}
async function watchRewardedVideo() {
  const status = platform.getStatus();
  if (!status.hasAds || adInProgress) return;
  if (state.boosts.adReadyAt > Date.now()) {
    notify('Video offer is cooling down', timeLabel((state.boosts.adReadyAt - Date.now()) / 1000) + ' until it is available again.', 'quiet');
    return;
  }
  adInProgress = true;
  screenHost.inert = true;
  updatePlatformLifecycle();
  const result = await platform.requestRewarded({
    onStarted: () => { platformMuted = true; },
    onEnded: () => { platformMuted = false; },
  });
  platformMuted = false;
  adInProgress = false;
  screenHost.inert = false;
  if (result.completed) {
    const grant = grantRewardedBoost(state);
    if (grant.granted) {
      playSound('event');
      notify('Study boost earned', '2× production for 60 seconds.', 'event');
      scheduleSave(true);
    }
  } else {
    notify('No video available', 'Nothing was charged. You can continue playing or try again later.', 'quiet');
  }
  renderBreak();
  syncHeader();
  updatePlatformLifecycle();
}
function onAchievements(result) { if (result?.achievements?.length) celebrateAchievements(result.achievements); }
function applyOfflineReturn() {
  if (!state) return;
  const now = Date.now();
  const elapsed = Math.max(0, (now - state.savedAt) / 1_000);
  if (elapsed < 15) { state.savedAt = now; return; }
  const dayBefore = getDailyDayKey(state);
  const offline = applyOfflineProgress(state, elapsed, now);
  if (dayBefore !== getDailyDayKey(state)) {
    notify('A new daily challenge is ready', 'Your progress is safe and a new goal has started.', 'quiet');
    if (currentScreen === 'challenges') renderChallenges();
  }
  onAchievements(offline);
  scheduleSave(true);
  showOfflineSummary(offline);
}
function loop(time) {
  if (!state) return;
  if (document.hidden) { requestAnimationFrame(loop); return; }
  if (!lastTick) lastTick = time;
  const delta = Math.max(0, Math.min(.5, (time - lastTick) / 1_000));
  lastTick = time;
  accumulator += delta;
  if (accumulator >= .2) {
    const now = Date.now();
    const priorDay = getDailyDayKey(state);
    const result = advanceTime(state, accumulator, now);
    accumulator = 0;
    onAchievements(result);
    if (priorDay !== getDailyDayKey(state)) {
      notify('A new daily challenge is ready', 'Your UTC-day goal has changed.', 'quiet');
      if (currentScreen === 'challenges') renderChallenges();
      scheduleSave(true);
    }
    syncHeader();
    if (currentScreen === 'prestige') syncPrestigeStats();
    if (now - (loop.lastSaveAt || 0) > 15_000) {
      loop.lastSaveAt = now;
      scheduleSave();
    }
  }
  requestAnimationFrame(loop);
}
function syncPrestigeStats() {
  if (currentScreen !== 'prestige') return;
  if (canPrestige(state) && $('[data-action="open-prestige"]')?.disabled) { renderPrestige(); return; }
  if (canRebirth(state) && $('[data-action="open-rebirth"]')?.disabled) { renderPrestige(); return; }
  // Rebuild only when a new milestone becomes available or while the progress figures are visible.
  const run = $('.prestige-hero .progress-head strong', screenHost);
  if (run) run.textContent = number(state.runEarned) + ' / ' + number(Math.max(250_000, 250_000 * (prestigeReward(state) + 1) ** 2));
  const runBar = $('.prestige-hero .progress-fill.orange', screenHost);
  if (runBar) runBar.style.width = percent(state.runEarned, Math.max(250_000, 250_000 * (prestigeReward(state) + 1) ** 2)) + '%';
}
function closeOnEscape(event) {
  if (event.key === 'Escape' && $('.modal-backdrop', modalRoot)) closeModal();
}

async function startGame() {
  setLoaderProgress(14);
  const init = platform.initialize();
  const progressTimer = setInterval(() => {
    const current = Number(progressBar.parentElement.getAttribute('aria-valuenow')) || 14;
    if (current < 64) setLoaderProgress(current + 4);
  }, 160);
  const status = await init;
  clearInterval(progressTimer);
  setLoaderProgress(72);
  const loaded = loadGameState(platform, Date.now());
  state = loaded.state;
  updateSaveStatus(loaded.saveStatus, loaded.usedFallback ? 'warning' : '');
  updateMotionPreference();
  renderScreen();
  setLoaderProgress(91);
  try { await $('.studio-mark').decode(); } catch {}
  await new Promise((resolve) => setTimeout(resolve, 180));
  setLoaderProgress(100);
  gameShell.hidden = false;
  loader.classList.add('leaving');
  setTimeout(() => { loader.hidden = true; }, 450);
  platform.loadingStop();
  platform.setGameplay(true);
  scheduleSave(true);
  lastTick = performance.now();
  requestAnimationFrame(loop);
  if (loaded.offline && loaded.offline.reward >= 1) setTimeout(() => showOfflineSummary(loaded.offline), 520);
  if (status.mode === 'sdk-unavailable') {
    setTimeout(() => notify('Platform features unavailable', 'The game continues with a local save.', 'quiet'), 1_100);
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('input', handleInput);
document.addEventListener('change', handleChange);
document.addEventListener('keydown', closeOnEscape);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = 0;
    flushSave();
    return;
  }
  lastTick = performance.now();
  applyOfflineReturn();
});
window.addEventListener('pagehide', () => { if (state) flushSave(); });
window.addEventListener('beforeunload', () => { if (state) flushSave(); });

startGame().catch((error) => {
  setLoaderProgress(100);
  gameShell.hidden = false;
  loader.classList.add('leaving');
  setTimeout(() => { loader.hidden = true; }, 450);
  const fallback = createFreshState(Date.now());
  state ??= fallback;
  renderScreen();
  updateSaveStatus('Starting with a new game', 'warning');
  notify('The game started in recovery mode', error?.message || 'A local save may be unavailable.', 'quiet');
  lastTick = performance.now();
  requestAnimationFrame(loop);
});
