export const SAVE_VERSION = 1;
export const SAVE_KEY = 'calc-clicker-save-v1';
export const MAX_VALUE = 1e300;
export const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60;
const DAY_MS = 86_400_000;

export const PRODUCERS = [
  { id: 'pocket', name: 'Pocket Calculator', icon: '▦', description: 'A trusty little number cruncher.', baseCost: 8, growth: 1.15, rate: 0.2, unlockAt: 0 },
  { id: 'study-buddy', name: 'Study Buddy', icon: '✎', description: 'Checks your working while you rest.', baseCost: 70, growth: 1.15, rate: 1.25, unlockAt: 45 },
  { id: 'classroom', name: 'Calculator Classroom', icon: '▤', description: 'Thirty eager buttons, one big answer.', baseCost: 600, growth: 1.15, rate: 7.5, unlockAt: 350 },
  { id: 'scientific', name: 'Scientific Calculator', icon: 'ƒ', description: 'Brings sine, cosine and extra oomph.', baseCost: 5_500, growth: 1.15, rate: 44, unlockAt: 3_500 },
  { id: 'answer-machine', name: 'Answer Machine', icon: '⌘', description: 'The answer is always “more points.”', baseCost: 48_000, growth: 1.15, rate: 270, unlockAt: 30_000 },
  { id: 'computer-lab', name: 'Computer Lab', icon: '▣', description: 'A whole room full of solved equations.', baseCost: 420_000, growth: 1.15, rate: 1_700, unlockAt: 250_000 },
  { id: 'formula-server', name: 'Formula Server', icon: '⌬', description: 'Keeps the calculations humming overnight.', baseCost: 3_800_000, growth: 1.15, rate: 10_500, unlockAt: 2_500_000 },
  { id: 'quantum-board', name: 'Quantum Whiteboard', icon: '∿', description: 'Every possible answer, all at once.', baseCost: 34_000_000, growth: 1.15, rate: 68_000, unlockAt: 22_000_000 },
  { id: 'proof-engine', name: 'Proof Engine', icon: '∴', description: 'Turns elegant proofs into steady points.', baseCost: 310_000_000, growth: 1.15, rate: 470_000, unlockAt: 200_000_000 },
  { id: 'number-reactor', name: 'Number Reactor', icon: '◉', description: 'A controlled chain reaction of arithmetic.', baseCost: 2_900_000_000, growth: 1.15, rate: 3_400_000, unlockAt: 1_800_000_000 },
  { id: 'infinity-array', name: 'Infinity Array', icon: '∞', description: 'Runs calculations beyond the syllabus.', baseCost: 27_000_000_000, growth: 1.15, rate: 25_000_000, unlockAt: 16_000_000_000 },
  { id: 'theorem-engine', name: 'Theorem Engine', icon: '△', description: 'An entire universe of proofs, on demand.', baseCost: 250_000_000_000, growth: 1.15, rate: 190_000_000, unlockAt: 150_000_000_000 },
];

export const SPECIAL_UPGRADES = [
  { id: 'keycaps', name: 'Springy Keycaps', icon: '⌨', description: 'Each click is worth twice as much.', baseCost: 35, growth: 1, kind: 'clickMultiplier', value: 2, unlockAt: 0 },
  { id: 'formula-notes', name: 'Formula Notes', icon: '≡', description: 'A tidy shortcut adds 3 points to every click.', baseCost: 280, growth: 1, kind: 'clickFlat', value: 3, unlockAt: 100 },
  { id: 'streak-engine', name: 'Streak Engine', icon: '↗', description: 'Click streaks build a little faster.', baseCost: 1_500, growth: 1, kind: 'streak', value: 0.08, unlockAt: 900 },
  { id: 'lucky-theory', name: 'Lucky Theory', icon: '✦', description: 'Adds a 7% chance to land a 5× calculation.', baseCost: 8_000, growth: 1, kind: 'critical', value: 0.07, unlockAt: 5_000 },
  { id: 'focus-mode', name: 'Focus Mode', icon: '◷', description: 'Unlocks a 15-second focus burst. Recharges in 90 seconds.', baseCost: 42_000, growth: 1, kind: 'focus', value: 1, unlockAt: 25_000 },
  { id: 'sleep-math', name: 'Sleep Math', icon: '☾', description: 'Keep 10% more points from offline production.', baseCost: 180_000, growth: 1, kind: 'offline', value: 0.1, unlockAt: 100_000 },
  { id: 'event-radar', name: 'Equation Radar', icon: '⌖', description: 'Rare equations appear about 20% more often.', baseCost: 900_000, growth: 1, kind: 'event', value: 0.2, unlockAt: 500_000 },
  { id: 'whiteboard', name: 'Master Whiteboard', icon: '□', description: 'All production gains a permanent 15% lift.', baseCost: 5_000_000, growth: 1, kind: 'globalProduction', value: 1.15, unlockAt: 3_000_000 },
  { id: 'mental-math', name: 'Mental Maths', icon: '∑', description: 'Click power rises by 50% per level.', baseCost: 28_000_000, growth: 1.65, kind: 'clickMultiplier', value: 1.5, maxOwned: 8, unlockAt: 16_000_000 },
  { id: 'offline-planner', name: 'Offline Planner', icon: '▱', description: 'Keep 10% more points from offline production.', baseCost: 120_000_000, growth: 1, kind: 'offline', value: 0.1, unlockAt: 70_000_000 },
];
export const UPGRADES = [...PRODUCERS, ...SPECIAL_UPGRADES];
const UPGRADE_BY_ID = new Map(UPGRADES.map((item) => [item.id, item]));

export const PRESTIGE_UPGRADES = [
  { id: 'pocket-money', name: 'A Head Start', icon: '✦', description: 'Begin each prestige run with 250 points.', cost: 1, max: 1 },
  { id: 'sharper-minds', name: 'Sharper Minds', icon: '⌁', description: 'All gains increase by 20% per level.', cost: 2, max: 5 },
  { id: 'night-shift', name: 'Night Shift', icon: '☾', description: 'Offline efficiency improves by 8% per level.', cost: 2, max: 5 },
];
export const REBIRTH_UPGRADES = [
  { id: 'echoes', name: 'Echoes of Knowledge', icon: '∞', description: 'All gains increase by 25% per level.', cost: 1, max: 5 },
  { id: 'keepsake', name: 'Calculator Keepsake', icon: '▦', description: 'Begin every run with 2,000 points.', cost: 1, max: 1 },
  { id: 'long-memory', name: 'Long Memory', icon: '◷', description: 'Offline efficiency improves by 10% per level.', cost: 2, max: 5 },
];

export const DAILY_CHALLENGES = [
  { id: 'daily-clicks', name: 'Warm Up', description: 'Make 30 calculations.', metric: 'clicks', goal: 30, reward: 120 },
  { id: 'daily-bank', name: 'Fill the Notebook', description: 'Earn 1,000 Calculator Points.', metric: 'earn', goal: 1_000, reward: 350 },
  { id: 'daily-shop', name: 'Supply Run', description: 'Buy 8 upgrades.', metric: 'buys', goal: 8, reward: 500 },
  { id: 'daily-streak', name: 'No Calculator Needed', description: 'Build a 20-click streak.', metric: 'streak', goal: 20, reward: 240 },
  { id: 'daily-collect', name: 'A Curious Find', description: 'Collect a rare equation.', metric: 'events', goal: 1, reward: 300 },
  { id: 'daily-time', name: 'Study Session', description: 'Play actively for 3 minutes.', metric: 'play', goal: 180, reward: 300 },
];

export const ACHIEVEMENTS = [
  { id: 'first-click', name: 'First Calculation', description: 'Make your first calculation.', category: 'Getting started', metric: 'clicks', goal: 1, reward: 5 },
  { id: 'first-upgrade', name: 'New Supplies', description: 'Buy your first upgrade.', category: 'Getting started', metric: 'upgrades', goal: 1, reward: 10 },
  { id: 'first-auto', name: 'Set It and Forget It', description: 'Reach 1 point per second.', category: 'Getting started', metric: 'pps', goal: 1, reward: 20 },
  { id: 'clicks-25', name: 'Getting the Hang of It', description: 'Make 25 calculations.', category: 'Clicking', metric: 'clicks', goal: 25, reward: 20 },
  { id: 'clicks-100', name: 'Busy Buttons', description: 'Make 100 calculations.', category: 'Clicking', metric: 'clicks', goal: 100, reward: 50 },
  { id: 'clicks-500', name: 'The Equals Enthusiast', description: 'Make 500 calculations.', category: 'Clicking', metric: 'clicks', goal: 500, reward: 120 },
  { id: 'clicks-2500', name: 'Clicktician', description: 'Make 2,500 calculations.', category: 'Clicking', metric: 'clicks', goal: 2_500, reward: 350 },
  { id: 'streak-10', name: 'On a Roll', description: 'Reach a 10-click streak.', category: 'Clicking', metric: 'streak', goal: 10, reward: 30 },
  { id: 'streak-50', name: 'Rapid Revision', description: 'Reach a 50-click streak.', category: 'Clicking', metric: 'streak', goal: 50, reward: 180 },
  { id: 'bank-100', name: 'Pocket Change', description: 'Earn 100 points in total.', category: 'Points', metric: 'lifetime', goal: 100, reward: 10 },
  { id: 'bank-1k', name: 'A Thousand Sums', description: 'Earn 1,000 points in total.', category: 'Points', metric: 'lifetime', goal: 1_000, reward: 30 },
  { id: 'bank-10k', name: 'Five Figures', description: 'Earn 10,000 points in total.', category: 'Points', metric: 'lifetime', goal: 10_000, reward: 100 },
  { id: 'bank-100k', name: 'Six Figure Study', description: 'Earn 100,000 points in total.', category: 'Points', metric: 'lifetime', goal: 100_000, reward: 300 },
  { id: 'bank-1m', name: 'Million Point Problem', description: 'Earn 1 million points in total.', category: 'Points', metric: 'lifetime', goal: 1_000_000, reward: 1_000 },
  { id: 'bank-1b', name: 'Big Brain Energy', description: 'Earn 1 billion points in total.', category: 'Points', metric: 'lifetime', goal: 1_000_000_000, reward: 5_000 },
  { id: 'rate-10', name: 'Steady Output', description: 'Reach 10 points per second.', category: 'Production', metric: 'pps', goal: 10, reward: 100 },
  { id: 'rate-100', name: 'The Numbers Flow', description: 'Reach 100 points per second.', category: 'Production', metric: 'pps', goal: 100, reward: 500 },
  { id: 'rate-10k', name: 'A Proper Lab', description: 'Reach 10,000 points per second.', category: 'Production', metric: 'pps', goal: 10_000, reward: 4_000 },
  { id: 'rate-1m', name: 'Research Funding', description: 'Reach 1 million points per second.', category: 'Production', metric: 'pps', goal: 1_000_000, reward: 25_000 },
  { id: 'upgrades-10', name: 'Well Equipped', description: 'Buy 10 upgrades in total.', category: 'Building', metric: 'upgrades', goal: 10, reward: 100 },
  { id: 'variety-5', name: 'A Little of Everything', description: 'Own five different upgrade types.', category: 'Building', metric: 'variety', goal: 5, reward: 200 },
  { id: 'variety-10', name: 'Whole Department', description: 'Own ten different upgrade types.', category: 'Building', metric: 'variety', goal: 10, reward: 1_000 },
  { id: 'time-1m', name: 'Short Study Break', description: 'Play actively for 1 minute.', category: 'Study time', metric: 'play', goal: 60, reward: 20 },
  { id: 'time-10m', name: 'Settling In', description: 'Play actively for 10 minutes.', category: 'Study time', metric: 'play', goal: 600, reward: 100 },
  { id: 'time-1h', name: 'Dedicated Learner', description: 'Play actively for 1 hour.', category: 'Study time', metric: 'play', goal: 3_600, reward: 1_000 },
  { id: 'daily-first', name: 'Daily Practice', description: 'Complete a daily challenge.', category: 'Daily challenges', metric: 'challenges', goal: 1, reward: 100 },
  { id: 'daily-10', name: 'Perfect Attendance', description: 'Complete 10 daily challenges.', category: 'Daily challenges', metric: 'challenges', goal: 10, reward: 800 },
  { id: 'event-first', name: 'Unexpected Result', description: 'Collect your first rare equation.', category: 'Rare equations', metric: 'events', goal: 1, reward: 100 },
  { id: 'event-5', name: 'Pattern Spotter', description: 'Collect five rare equations.', category: 'Rare equations', metric: 'events', goal: 5, reward: 500 },
  { id: 'prestige-first', name: 'Fresh Notebook', description: 'Prestige for the first time.', category: 'Prestige', metric: 'prestiges', goal: 1, reward: 1_000 },
  { id: 'prestige-5', name: 'Seasoned Scholar', description: 'Prestige five times.', category: 'Prestige', metric: 'prestiges', goal: 5, reward: 10_000 },
  { id: 'rebirth-first', name: 'New Curriculum', description: 'Complete your first rebirth.', category: 'Rebirth', metric: 'rebirths', goal: 1, reward: 15_000 },
  { id: 'rebirth-3', name: 'Mathematical Immortality', description: 'Complete three rebirths.', category: 'Rebirth', metric: 'rebirths', goal: 3, reward: 100_000 },
  { id: 'bank-1t', name: 'Beyond the Syllabus', description: 'Earn one trillion points in total.', category: 'Points', metric: 'lifetime', goal: 1e12, reward: 100_000 },
  { id: 'clicks-10000', name: 'The Human Calculator', description: 'Make 10,000 calculations.', category: 'Clicking', metric: 'clicks', goal: 10_000, reward: 1_000 },
  { id: 'variety-all', name: 'Fully Stocked', description: 'Own every upgrade type at least once.', category: 'Building', metric: 'variety', goal: UPGRADES.length, reward: 20_000 },
];
const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((item) => [item.id, item]));
const PRESTIGE_BY_ID = new Map(PRESTIGE_UPGRADES.map((item) => [item.id, item]));
const REBIRTH_BY_ID = new Map(REBIRTH_UPGRADES.map((item) => [item.id, item]));

function safeNumber(value, fallback = 0, minimum = 0, maximum = MAX_VALUE) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(maximum, Math.max(minimum, n));
}
function safeInt(value, fallback = 0, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return Math.floor(safeNumber(value, fallback, minimum, maximum));
}
function boundedAdd(a, b) {
  const x = safeNumber(a);
  const y = safeNumber(b);
  return x >= MAX_VALUE - y ? MAX_VALUE : x + y;
}
function boundedMultiply(a, b) {
  const x = safeNumber(a);
  const y = safeNumber(b);
  return !x || !y ? 0 : x > MAX_VALUE / y ? MAX_VALUE : x * y;
}
function utcDay(now) { return Math.floor(safeNumber(now, Date.now()) / DAY_MS); }
function dayKey(dayIndex) { return new Date(dayIndex * DAY_MS).toISOString().slice(0, 10); }

export function createFreshState(now = Date.now()) {
  const dayIndex = utcDay(now);
  return {
    version: SAVE_VERSION, points: 0, runEarned: 0, owned: {},
    prestige: { stars: 0, cycles: 0, upgrades: {}, rebirthTokens: 0, rebirths: 0, rebirthUpgrades: {} },
    stats: {
      totalEarned: 0, totalClicks: 0, totalPlaySeconds: 0, totalUpgradesPurchased: 0,
      highestProduction: 0, bestStreak: 0, rareEvents: 0, challengesCompleted: 0,
      totalPrestiges: 0, totalRebirths: 0, upgradesEver: {},
    },
    achievements: {}, daily: { dayIndex, maxDayIndex: dayIndex, progress: 0, claimed: false }, dailyHistory: [],
    activeEvent: null, nextEventAt: safeNumber(now, Date.now()) + 45_000,
    streak: { count: 0, until: 0 },
    boosts: { focusUntil: 0, rewardUntil: 0, focusReadyAt: 0, adReadyAt: 0 },
    settings: { volume: 0.45, sound: true, reducedMotion: false, numberMode: 'compact' },
    savedAt: safeNumber(now, Date.now()),
  };
}

export function validateSave(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.version != null && Number(raw.version) > SAVE_VERSION) return null;
  if (raw.version == null && raw.points == null && raw.owned == null) return null;
  const state = createFreshState(now);
  state.points = safeNumber(raw.points);
  state.runEarned = safeNumber(raw.runEarned);
  if (raw.owned && typeof raw.owned === 'object') {
    for (const upgrade of UPGRADES) {
      const qty = safeInt(raw.owned[upgrade.id], 0, 0, upgrade.maxOwned ?? 1_000_000);
      if (qty) state.owned[upgrade.id] = qty;
    }
  }
  const p = raw.prestige && typeof raw.prestige === 'object' ? raw.prestige : {};
  state.prestige.stars = safeNumber(p.stars);
  state.prestige.cycles = safeInt(p.cycles);
  state.prestige.rebirthTokens = safeNumber(p.rebirthTokens);
  state.prestige.rebirths = safeInt(p.rebirths);
  for (const upgrade of PRESTIGE_UPGRADES) {
    const lvl = safeInt(p.upgrades?.[upgrade.id], 0, 0, upgrade.max);
    if (lvl) state.prestige.upgrades[upgrade.id] = lvl;
  }
  for (const upgrade of REBIRTH_UPGRADES) {
    const lvl = safeInt(p.rebirthUpgrades?.[upgrade.id], 0, 0, upgrade.max);
    if (lvl) state.prestige.rebirthUpgrades[upgrade.id] = lvl;
  }
  const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  for (const key of ['totalEarned', 'highestProduction']) state.stats[key] = safeNumber(stats[key]);
  for (const key of ['totalClicks', 'totalPlaySeconds', 'totalUpgradesPurchased', 'bestStreak', 'rareEvents', 'challengesCompleted', 'totalPrestiges', 'totalRebirths']) {
    state.stats[key] = safeInt(stats[key]);
  }
  if (stats.upgradesEver && typeof stats.upgradesEver === 'object') {
    for (const upgrade of UPGRADES) if (stats.upgradesEver[upgrade.id]) state.stats.upgradesEver[upgrade.id] = true;
  }
  if (raw.achievements && typeof raw.achievements === 'object') {
    for (const [id, time] of Object.entries(raw.achievements)) {
      if (ACHIEVEMENT_BY_ID.has(id) && safeNumber(time) > 0) state.achievements[id] = safeNumber(time);
    }
  }
  const history = Array.isArray(raw.dailyHistory) ? raw.dailyHistory : [];
  state.dailyHistory = history.filter((key) => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)).slice(-64);
  const oldDaily = raw.daily && typeof raw.daily === 'object' ? raw.daily : {};
  const maxDay = Math.max(utcDay(now), safeInt(oldDaily.maxDayIndex, safeInt(oldDaily.dayIndex, utcDay(now))));
  state.daily = {
    dayIndex: Math.min(maxDay, safeInt(oldDaily.dayIndex, maxDay)),
    maxDayIndex: maxDay, progress: safeNumber(oldDaily.progress), claimed: Boolean(oldDaily.claimed),
  };
  syncDaily(state, now);
  if (raw.activeEvent && typeof raw.activeEvent.id === 'string' && safeNumber(raw.activeEvent.expiresAt) > now) {
    state.activeEvent = { id: raw.activeEvent.id.slice(0, 100), expiresAt: safeNumber(raw.activeEvent.expiresAt) };
  }
  state.nextEventAt = safeNumber(raw.nextEventAt, now + 45_000);
  if (raw.streak && typeof raw.streak === 'object') {
    state.streak = { count: safeInt(raw.streak.count, 0, 0, 100_000), until: safeNumber(raw.streak.until) };
  }
  if (raw.boosts && typeof raw.boosts === 'object') {
    for (const key of Object.keys(state.boosts)) state.boosts[key] = safeNumber(raw.boosts[key]);
  }
  if (raw.settings && typeof raw.settings === 'object') {
    state.settings.volume = safeNumber(raw.settings.volume, 0.45, 0, 1);
    state.settings.sound = raw.settings.sound !== false;
    state.settings.reducedMotion = Boolean(raw.settings.reducedMotion);
    state.settings.numberMode = raw.settings.numberMode === 'full' ? 'full' : 'compact';
  }
  state.savedAt = Math.min(now, safeNumber(raw.savedAt, now));
  state.version = SAVE_VERSION;
  return state;
}

export function syncDaily(state, now = Date.now()) {
  if (!state.daily || typeof state.daily !== 'object') {
    const dayIndex = utcDay(now);
    state.daily = { dayIndex, maxDayIndex: dayIndex, progress: 0, claimed: false };
  }
  const day = Math.max(utcDay(now), safeInt(state.daily.maxDayIndex, safeInt(state.daily.dayIndex, utcDay(now))));
  if (day !== state.daily.dayIndex) {
    state.daily.dayIndex = day;
    state.daily.progress = 0;
    state.daily.claimed = false;
  }
  state.daily.maxDayIndex = day;
  if (!Array.isArray(state.dailyHistory)) state.dailyHistory = [];
  if (state.dailyHistory.includes(dayKey(day))) state.daily.claimed = true;
  const challenge = DAILY_CHALLENGES[((day % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length];
  state.daily.progress = Math.min(challenge.goal, safeNumber(state.daily.progress));
  return challenge;
}
export function getDailyChallenge(state, now = Date.now()) { return syncDaily(state, now); }
export function getUpgrade(id) { return UPGRADE_BY_ID.get(id) ?? null; }
export function getOwned(state, id) { return safeInt(state.owned?.[id]); }
export function totalUpgradeVariety(state) {
  return Object.keys(state.stats.upgradesEver ?? {}).filter((id) => state.stats.upgradesEver[id]).length;
}

export function getClickPower(state) {
  let additive = 1;
  let multiplier = 1;
  for (const upgrade of SPECIAL_UPGRADES) {
    const owned = getOwned(state, upgrade.id);
    if (!owned) continue;
    if (upgrade.kind === 'clickFlat') additive += upgrade.value * owned;
    if (upgrade.kind === 'clickMultiplier') multiplier = boundedMultiply(multiplier, Math.pow(upgrade.value, owned));
  }
  return boundedMultiply(additive, multiplier);
}
export function getBaseProduction(state) {
  let total = 0;
  for (const producer of PRODUCERS) total = boundedAdd(total, boundedMultiply(producer.rate, getOwned(state, producer.id)));
  return boundedMultiply(total, getGlobalMultiplier(state, 0, false));
}
export function getGlobalMultiplier(state, now = Date.now(), includeTimed = true) {
  const sharp = safeInt(state.prestige?.upgrades?.['sharper-minds']);
  const echo = safeInt(state.prestige?.rebirthUpgrades?.echoes);
  const master = getOwned(state, 'whiteboard') ? 1.15 : 1;
  let result = boundedMultiply(boundedMultiply(master, Math.pow(1.2, sharp)), Math.pow(1.25, echo));
  if (includeTimed && state.boosts) {
    if (safeNumber(state.boosts.focusUntil) > now) result = boundedMultiply(result, 2);
    if (safeNumber(state.boosts.rewardUntil) > now) result = boundedMultiply(result, 2);
  }
  return result;
}
export function getProduction(state, now = Date.now()) {
  let timed = 1;
  if (state.boosts?.focusUntil > now) timed *= 2;
  if (state.boosts?.rewardUntil > now) timed *= 2;
  return boundedMultiply(getBaseProduction(state), timed);
}
export function getOfflineEfficiency(state) {
  let value = 0.25 + getOwned(state, 'sleep-math') * 0.1 + getOwned(state, 'offline-planner') * 0.1;
  value += safeInt(state.prestige?.upgrades?.['night-shift']) * 0.08;
  value += safeInt(state.prestige?.rebirthUpgrades?.['long-memory']) * 0.1;
  return Math.min(0.85, value);
}
export function getUpgradeUnlock(upgrade, state) {
  return state.stats.totalEarned >= upgrade.unlockAt
    ? { unlocked: true, requirement: '' }
    : { unlocked: false, requirement: 'Earn ' + formatNumber(upgrade.unlockAt) + ' points in total' };
}
export function getNextCost(state, itemOrId) {
  const item = typeof itemOrId === 'string' ? getUpgrade(itemOrId) : itemOrId;
  if (!item) return MAX_VALUE;
  const owned = getOwned(state, item.id);
  if (owned >= purchaseLimit(item)) return MAX_VALUE;
  if (item.growth === 1) return item.baseCost;
  const factor = Math.pow(item.growth, owned);
  if (!Number.isFinite(factor) || item.baseCost > MAX_VALUE / factor) return MAX_VALUE;
  return Math.min(MAX_VALUE, item.baseCost * factor);
}
function purchaseLimit(item) { return item.rate != null ? 1_000_000 : (item.maxOwned ?? 1); }
function geometricCost(first, growth, quantity) {
  if (quantity <= 0) return 0;
  if (growth === 1) return boundedMultiply(first, quantity);
  const factor = Math.pow(growth, quantity);
  if (!Number.isFinite(factor) || first > MAX_VALUE / factor) return MAX_VALUE;
  const result = first * (factor - 1) / (growth - 1);
  return Number.isFinite(result) ? Math.min(MAX_VALUE, result) : MAX_VALUE;
}
function maximumAffordable(state, item) {
  const owned = getOwned(state, item.id);
  const cap = Math.min(item.rate != null ? 10_000 : Number.MAX_SAFE_INTEGER, Math.max(0, purchaseLimit(item) - owned));
  const first = getNextCost(state, item);
  if (!cap || state.points < first) return 0;
  if (first >= MAX_VALUE) return state.points >= MAX_VALUE ? 1 : 0;
  if (item.growth === 1) return Math.min(cap, Math.floor(state.points / first));
  const ratio = state.points / first;
  const guess = Math.log1p(ratio * (item.growth - 1)) / Math.log(item.growth);
  let quantity = Math.min(cap, Math.max(0, Number.isFinite(guess) ? Math.floor(guess + 1e-10) : cap));
  for (let i = 0; i < 4 && quantity > 0 && geometricCost(first, item.growth, quantity) > state.points; i += 1) quantity -= 1;
  if (quantity < cap && geometricCost(first, item.growth, quantity + 1) <= state.points) quantity += 1;
  return quantity;
}
export function getPurchaseQuote(state, id, mode = '1') {
  const item = getUpgrade(id);
  if (!item) return { id, quantity: 0, cost: 0, affordable: false, unlocked: false, requirement: 'Unknown upgrade' };
  const unlock = getUpgradeUnlock(item, state);
  const cap = Math.min(item.rate != null ? 10_000 : Number.MAX_SAFE_INTEGER, Math.max(0, purchaseLimit(item) - getOwned(state, id)));
  let quantity = mode === 'max' ? maximumAffordable(state, item) : Math.min(mode === '10' ? 10 : 1, cap);
  if (!unlock.unlocked) quantity = 0;
  if (getNextCost(state, item) >= MAX_VALUE && quantity > 1) quantity = 1;
  const cost = quantity ? geometricCost(getNextCost(state, item), item.growth, quantity) : 0;
  return { id, quantity, cost, affordable: quantity > 0 && cost <= state.points, unlocked: unlock.unlocked, requirement: unlock.requirement, soldOut: cap === 0 };
}

export function getMetric(state, metric, now = Date.now()) {
  switch (metric) {
    case 'clicks': return state.stats.totalClicks;
    case 'upgrades': return state.stats.totalUpgradesPurchased;
    case 'lifetime': return state.stats.totalEarned;
    case 'pps': return getProduction(state, now);
    case 'variety': return totalUpgradeVariety(state);
    case 'streak': return state.stats.bestStreak;
    case 'play': return state.stats.totalPlaySeconds;
    case 'challenges': return state.stats.challengesCompleted;
    case 'events': return state.stats.rareEvents;
    case 'prestiges': return state.stats.totalPrestiges;
    case 'rebirths': return state.stats.totalRebirths;
    default: return 0;
  }
}
export function getAchievementProgress(state, achievement, now = Date.now()) {
  const value = Math.min(achievement.goal, getMetric(state, achievement.metric, now));
  return { value, goal: achievement.goal, ratio: achievement.goal > 0 ? Math.min(1, value / achievement.goal) : 1 };
}
export function evaluateAchievements(state, now = Date.now()) {
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements[achievement.id] || getMetric(state, achievement.metric, now) < achievement.goal) continue;
    state.achievements[achievement.id] = now;
    if (achievement.reward > 0) addPointsRaw(state, achievement.reward);
    unlocked.push(achievement);
  }
  return unlocked;
}

function addPointsRaw(state, amount) {
  const gain = safeNumber(amount);
  state.points = boundedAdd(state.points, gain);
  state.runEarned = boundedAdd(state.runEarned, gain);
  state.stats.totalEarned = boundedAdd(state.stats.totalEarned, gain);
}
function increaseDailyProgress(state, metric, amount, now = Date.now()) {
  const challenge = syncDaily(state, now);
  if (challenge.metric !== metric || state.daily.claimed) return;
  if (metric === 'streak') state.daily.progress = Math.max(state.daily.progress, safeNumber(amount));
  else state.daily.progress = Math.min(challenge.goal, boundedAdd(state.daily.progress, safeNumber(amount)));
}
export function addPoints(state, amount, now = Date.now()) {
  const gain = safeNumber(amount);
  if (gain <= 0) return { gain: 0, achievements: [] };
  addPointsRaw(state, gain);
  increaseDailyProgress(state, 'earn', gain, now);
  state.stats.highestProduction = Math.max(state.stats.highestProduction, getProduction(state, now));
  return { gain, achievements: evaluateAchievements(state, now) };
}

export function clickCalculator(state, now = Date.now(), random = Math.random) {
  syncDaily(state, now);
  if (now > state.streak.until) state.streak.count = 0;
  state.streak.count += 1;
  state.streak.until = now + 4_000;
  state.stats.totalClicks += 1;
  state.stats.bestStreak = Math.max(state.stats.bestStreak, state.streak.count);
  increaseDailyProgress(state, 'clicks', 1, now);
  increaseDailyProgress(state, 'streak', state.streak.count, now);
  const steps = Math.floor(state.streak.count / 10);
  const streakBonus = 1 + Math.min(2.5, steps * (0.06 + getOwned(state, 'streak-engine') * 0.08));
  const luckyChance = Math.min(0.35, getOwned(state, 'lucky-theory') * 0.07);
  const critical = random() < luckyChance;
  const factor = streakBonus * (critical ? 5 : 1);
  const rawGain = boundedMultiply(getClickPower(state), factor);
  const multiplier = getGlobalMultiplier(state, now, true);
  const result = addPoints(state, boundedMultiply(rawGain, multiplier), now);
  return { ...result, critical, streak: state.streak.count, multiplier: factor * multiplier };
}
export function buyUpgrade(state, id, mode = '1', now = Date.now()) {
  const quote = getPurchaseQuote(state, id, mode);
  if (!quote.unlocked || !quote.affordable || quote.quantity < 1 || quote.cost > state.points) {
    return { bought: false, quote, achievements: [] };
  }
  const upgrade = getUpgrade(id);
  if (!upgrade) return { bought: false, quote, achievements: [] };
  state.points = Math.max(0, state.points - quote.cost);
  state.owned[id] = getOwned(state, id) + quote.quantity;
  state.stats.totalUpgradesPurchased += quote.quantity;
  state.stats.upgradesEver[id] = true;
  increaseDailyProgress(state, 'buys', quote.quantity, now);
  return { bought: true, quote, upgrade, achievements: evaluateAchievements(state, now) };
}

export function advanceTime(state, deltaSeconds, now = Date.now(), random = Math.random) {
  const dt = safeNumber(deltaSeconds, 0, 0, 1);
  syncDaily(state, now);
  let gain = 0;
  if (dt > 0) {
    gain = boundedMultiply(getProduction(state, now), dt);
    if (gain > 0) {
      addPointsRaw(state, gain);
      increaseDailyProgress(state, 'earn', gain, now);
    }
    state.stats.totalPlaySeconds = boundedAdd(state.stats.totalPlaySeconds, dt);
    increaseDailyProgress(state, 'play', dt, now);
    state.stats.highestProduction = Math.max(state.stats.highestProduction, getProduction(state, now));
  }
  if (state.streak.until <= now) state.streak.count = 0;
  if (state.activeEvent && state.activeEvent.expiresAt <= now) state.activeEvent = null;
  if (!state.activeEvent && state.nextEventAt <= now) {
    state.activeEvent = { id: 'eq-' + Math.floor(now).toString(36), expiresAt: now + 18_000 };
    const radar = getOwned(state, 'event-radar');
    const delay = 60_000 + Math.max(0, Math.min(1, random())) * 75_000;
    state.nextEventAt = now + delay * Math.pow(0.8, radar);
  }
  return { gain, achievements: evaluateAchievements(state, now) };
}

export function collectRareEquation(state, now = Date.now()) {
  if (!state.activeEvent || state.activeEvent.expiresAt <= now) {
    state.activeEvent = null;
    return { collected: false, reason: 'expired', reward: 0, achievements: [] };
  }
  const reward = Math.max(50, getClickPower(state) * 50, getProduction(state, now) * 90);
  state.activeEvent = null;
  state.stats.rareEvents += 1;
  increaseDailyProgress(state, 'events', 1, now);
  state.boosts.rewardUntil = Math.max(state.boosts.rewardUntil, now) + 45_000;
  const result = addPoints(state, reward, now);
  return { collected: true, reward, achievements: result.achievements };
}
export function activateFocus(state, now = Date.now()) {
  if (!getOwned(state, 'focus-mode')) return { activated: false, reason: 'locked' };
  if (state.boosts.focusReadyAt > now) return { activated: false, reason: 'cooldown', readyAt: state.boosts.focusReadyAt };
  state.boosts.focusUntil = now + 15_000;
  state.boosts.focusReadyAt = now + 90_000;
  return { activated: true, until: state.boosts.focusUntil };
}
export function grantRewardedBoost(state, now = Date.now()) {
  if (state.boosts.adReadyAt > now) return { granted: false, reason: 'cooldown' };
  state.boosts.rewardUntil = now + 60_000;
  state.boosts.adReadyAt = now + 180_000;
  return { granted: true, until: state.boosts.rewardUntil };
}
export function buyFocusBoost(state, now = Date.now()) {
  const cost = 1_000;
  if (state.points < cost) return { bought: false, reason: 'funds', cost };
  if (state.boosts.rewardUntil > now) return { bought: false, reason: 'active', cost };
  state.points -= cost;
  state.boosts.rewardUntil = now + 60_000;
  return { bought: true, cost, until: state.boosts.rewardUntil };
}
export function applyOfflineProgress(state, elapsedSeconds, now = Date.now()) {
  const elapsed = safeNumber(elapsedSeconds, 0, 0, MAX_OFFLINE_SECONDS);
  const reward = boundedMultiply(boundedMultiply(getBaseProduction(state), elapsed), getOfflineEfficiency(state));
  const result = addPoints(state, reward, now);
  state.savedAt = now;
  return { elapsed, reward, efficiency: getOfflineEfficiency(state), achievements: result.achievements };
}
export function claimDailyChallenge(state, now = Date.now()) {
  const challenge = syncDaily(state, now);
  const key = dayKey(state.daily.dayIndex);
  if (state.daily.claimed || state.dailyHistory.includes(key)) return { claimed: false, reason: 'already-claimed', challenge };
  if (state.daily.progress < challenge.goal) return { claimed: false, reason: 'incomplete', challenge };
  state.daily.claimed = true;
  state.dailyHistory.push(key);
  state.dailyHistory = state.dailyHistory.slice(-64);
  state.stats.challengesCompleted += 1;
  const result = addPoints(state, challenge.reward, now);
  return { claimed: true, reward: challenge.reward, challenge, achievements: result.achievements };
}

export function prestigeReward(state) {
  return Math.max(0, Math.floor(Math.sqrt(state.runEarned / 250_000)));
}
export function canPrestige(state) { return state.runEarned >= 250_000 && prestigeReward(state) > 0; }
export function performPrestige(state, now = Date.now()) {
  if (!canPrestige(state)) return { performed: false, reason: 'milestone', reward: prestigeReward(state) };
  const reward = prestigeReward(state);
  state.points = 0;
  state.runEarned = 0;
  state.owned = {};
  state.streak = { count: 0, until: 0 };
  state.activeEvent = null;
  state.nextEventAt = now + 45_000;
  state.boosts.focusUntil = 0;
  state.boosts.rewardUntil = 0;
  state.prestige.stars = boundedAdd(state.prestige.stars, reward);
  state.prestige.cycles += 1;
  state.stats.totalPrestiges += 1;
  state.savedAt = now;
  if (state.prestige.upgrades['pocket-money']) addPointsRaw(state, 250);
  return { performed: true, reward, achievements: evaluateAchievements(state, now) };
}
export function purchasePrestigeUpgrade(state, id, now = Date.now()) {
  const upgrade = PRESTIGE_BY_ID.get(id);
  if (!upgrade) return { bought: false, reason: 'unknown' };
  const level = safeInt(state.prestige.upgrades[id]);
  if (level >= upgrade.max) return { bought: false, reason: 'maxed' };
  if (state.prestige.stars < upgrade.cost) return { bought: false, reason: 'funds' };
  state.prestige.stars -= upgrade.cost;
  state.prestige.upgrades[id] = level + 1;
  return { bought: true, upgrade, level: level + 1, achievements: evaluateAchievements(state, now) };
}

export function canRebirth(state) { return state.prestige.cycles >= 5 && state.runEarned >= 500_000_000; }
export function rebirthReward(state) {
  return canRebirth(state) ? Math.max(1, Math.floor(1 + Math.log10(state.runEarned / 500_000_000))) : 0;
}
export function performRebirth(state, now = Date.now()) {
  if (!canRebirth(state)) return { performed: false, reason: 'milestone', reward: 0 };
  const reward = rebirthReward(state);
  state.points = 0;
  state.runEarned = 0;
  state.owned = {};
  state.prestige.stars = 0;
  state.prestige.cycles = 0;
  state.prestige.upgrades = {};
  state.prestige.rebirthTokens = boundedAdd(state.prestige.rebirthTokens, reward);
  state.prestige.rebirths += 1;
  state.stats.totalRebirths += 1;
  state.streak = { count: 0, until: 0 };
  state.activeEvent = null;
  state.nextEventAt = now + 45_000;
  state.boosts.focusUntil = 0;
  state.boosts.rewardUntil = 0;
  state.savedAt = now;
  if (state.prestige.rebirthUpgrades.keepsake) addPointsRaw(state, 2_000);
  return { performed: true, reward, achievements: evaluateAchievements(state, now) };
}
export function purchaseRebirthUpgrade(state, id, now = Date.now()) {
  const upgrade = REBIRTH_BY_ID.get(id);
  if (!upgrade) return { bought: false, reason: 'unknown' };
  const level = safeInt(state.prestige.rebirthUpgrades[id]);
  if (level >= upgrade.max) return { bought: false, reason: 'maxed' };
  if (state.prestige.rebirthTokens < upgrade.cost) return { bought: false, reason: 'funds' };
  state.prestige.rebirthTokens -= upgrade.cost;
  state.prestige.rebirthUpgrades[id] = level + 1;
  return { bought: true, upgrade, level: level + 1, achievements: evaluateAchievements(state, now) };
}

export function formatNumber(value, mode = 'compact') {
  const n = safeNumber(value);
  if (!n || n < 0.0001) return '0';
  if (mode === 'full' && n < 1e15) return n.toLocaleString('en-GB', { maximumFractionDigits: n < 10 ? 2 : 0 });
  if (n < 1_000) return n.toLocaleString('en-GB', { maximumFractionDigits: n < 10 ? 1 : 0 });
  const exponent = Math.floor(Math.log10(n));
  const units = [['', 0], ['K', 3], ['M', 6], ['B', 9], ['T', 12], ['Qa', 15], ['Qi', 18], ['Sx', 21], ['Sp', 24], ['Oc', 27], ['No', 30], ['Dc', 33]];
  const unit = units.filter((entry) => exponent >= entry[1]).at(-1);
  if (exponent < 36) {
    const scaled = n / Math.pow(10, unit[1]);
    const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
    return scaled.toFixed(digits).replace(/\.?0+$/, '') + unit[0];
  }
  return (n / Math.pow(10, exponent)).toFixed(2).replace(/\.?0+$/, '') + 'e' + exponent;
}
export function getUnlockedAchievementCount(state) {
  return Object.keys(state.achievements).filter((id) => ACHIEVEMENT_BY_ID.has(id)).length;
}
export function getActiveBoostRemaining(state, now = Date.now()) {
  return Math.max(0, Math.ceil((state.boosts.rewardUntil - now) / 1_000));
}
export function getFocusRemaining(state, now = Date.now()) {
  return Math.max(0, Math.ceil((state.boosts.focusUntil - now) / 1_000));
}
export function getEventRemaining(state, now = Date.now()) {
  return state.activeEvent ? Math.max(0, Math.ceil((state.activeEvent.expiresAt - now) / 1_000)) : 0;
}
export function getDailyDayKey(state) { return dayKey(state.daily.dayIndex); }
