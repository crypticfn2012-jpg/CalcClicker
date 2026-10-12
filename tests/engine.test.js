import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS, DAILY_CHALLENGES, MAX_OFFLINE_SECONDS, PRESTIGE_UPGRADES,
  REBIRTH_UPGRADES, UPGRADES, activateFocus, addPoints, advanceTime,
  applyOfflineProgress, buyUpgrade, canPrestige, canRebirth, claimDailyChallenge,
  clickCalculator, collectRareEquation, createFreshState, evaluateAchievements,
  formatNumber, getBaseProduction, getClickPower, getDailyChallenge,
  getEventRemaining, getNextCost, getOfflineEfficiency, getProduction,
  getPurchaseQuote, getUpgrade, performPrestige, performRebirth, prestigeReward,
  purchasePrestigeUpgrade, purchaseRebirthUpgrade, rebirthReward, syncDaily,
  totalUpgradeVariety, validateSave,
} from '../engine.js';
import { exportSave } from '../storage.js';

test('the starting click adds one point and unlocks its first earned milestone', () => {
  const state = createFreshState(1_000);
  const result = clickCalculator(state, 1_000, () => 0.5);
  assert.equal(result.gain, 1);
  assert.equal(result.critical, false);
  assert.equal(state.stats.totalClicks, 1);
  assert.equal(state.achievements['first-click'], 1_000);
  assert.equal(state.points, 6); // click plus the one-time milestone reward
});

test('the first pocket calculator is affordable early and produces passively', () => {
  const state = createFreshState(1_000);
  state.points = 8;
  const result = buyUpgrade(state, 'pocket', '1', 1_000);
  assert.equal(result.bought, true);
  assert.equal(state.owned.pocket, 1);
  assert.equal(getBaseProduction(state), 0.2);
  assert.equal(getProduction(state), 0.2);
  assert.equal(state.points, 10); // purchase followed by the first-upgrade reward
});

test('buy 10 computes a geometric price and applies exactly ten producer units', () => {
  const state = createFreshState(1_000);
  state.points = 10_000;
  const quote = getPurchaseQuote(state, 'pocket', '10');
  const expected = 8 * (Math.pow(1.15, 10) - 1) / 0.15;
  assert.equal(quote.quantity, 10);
  assert.ok(Math.abs(quote.cost - expected) < 1e-9);
  const result = buyUpgrade(state, 'pocket', '10', 1_000);
  assert.equal(result.bought, true);
  assert.equal(state.owned.pocket, 10);
  assert.equal(state.stats.totalUpgradesPurchased, 10);
});

test('buy max stops at the last affordable price', () => {
  const state = createFreshState(1_000);
  state.points = 1_000;
  const quote = getPurchaseQuote(state, 'pocket', 'max');
  assert.ok(quote.quantity > 0);
  assert.ok(quote.cost <= state.points);
  const remaining = state.points - quote.cost;
  const nextCost = 8 * Math.pow(1.15, quote.quantity);
  assert.ok(nextCost > remaining);
  assert.ok(quote.quantity <= 10_000);
});

test('insufficient funds and locked upgrades do not mutate state', () => {
  const state = createFreshState(1_000);
  state.points = 7;
  const before = JSON.stringify(state);
  assert.equal(buyUpgrade(state, 'pocket', '1', 1_000).bought, false);
  assert.equal(JSON.stringify(state), before);
  state.points = 1e9;
  const result = buyUpgrade(state, 'scientific', '1', 1_000);
  assert.equal(result.bought, false);
  assert.equal(state.owned.scientific, undefined);
});

test('single purchase upgrades cannot be bought twice; mental maths remains levelled', () => {
  const state = createFreshState(1_000);
  state.points = 100_000;
  assert.equal(buyUpgrade(state, 'keycaps', '1', 1_000).bought, true);
  const sold = getPurchaseQuote(state, 'keycaps', '1');
  assert.equal(sold.soldOut, true);
  assert.equal(buyUpgrade(state, 'keycaps', 'max', 1_000).bought, false);
  assert.equal(state.owned.keycaps, 1);
  state.stats.totalEarned = 30_000_000;
  state.points = 100_000_000;
  assert.equal(getPurchaseQuote(state, 'mental-math', '10').quantity, 8);
});

test('upgrade costs stay finite and do not fall to zero at extreme quantities', () => {
  const state = createFreshState(1_000);
  state.owned.pocket = 10_000;
  assert.equal(getNextCost(state, 'pocket'), Number.MAX_VALUE > 1e300 ? 1e300 : Number.MAX_VALUE);
  state.points = 1e300;
  const quote = getPurchaseQuote(state, 'pocket', 'max');
  assert.ok(Number.isFinite(quote.cost));
  assert.ok(quote.quantity > 0 && quote.quantity <= 1);
});

test('critical calculations multiply gains; invalid values never enter state', () => {
  const state = createFreshState(1_000);
  state.owned['lucky-theory'] = 1;
  const result = clickCalculator(state, 1_000, () => 0);
  assert.equal(result.critical, true);
  assert.equal(result.gain, 5);
  assert.ok(Number.isFinite(state.points));
  const gain = addPoints(state, Number.POSITIVE_INFINITY, 1_000);
  assert.equal(gain.gain, 0);
  assert.ok(Number.isFinite(state.points));
});

test('number formatting covers suffixes, scientific display and corrupt input', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(1_250), '1.25K');
  assert.equal(formatNumber(1e6), '1M');
  assert.equal(formatNumber(1e36), '1e36');
  assert.equal(formatNumber(1e100), '1e100');
  assert.equal(formatNumber(1e300), '1e300');
  assert.equal(formatNumber(Number.NaN), '0');
  assert.equal(formatNumber(Number.POSITIVE_INFINITY), '0');
  assert.equal(formatNumber(1250, 'full'), '1,250');
});

test('achievement checks unlock from game events and never reward the same milestone twice', () => {
  const state = createFreshState(1_000);
  assert.equal(Object.keys(state.achievements).length, 0);
  for (let i = 0; i < 25; i += 1) clickCalculator(state, 1_000 + i * 100, () => 0.5);
  assert.ok(state.achievements['first-click']);
  assert.ok(state.achievements['clicks-25']);
  const earned = state.stats.totalEarned;
  const again = evaluateAchievements(state, 10_000);
  assert.equal(again.length, 0);
  assert.equal(state.stats.totalEarned, earned);
  assert.ok(ACHIEVEMENTS.length >= 30);
});

test('achievement history survives the versioned save round trip', () => {
  const state = createFreshState(1_000);
  state.achievements['first-click'] = 1_000;
  state.points = 1234;
  state.stats.totalEarned = 4321;
  state.owned.pocket = 3;
  const exported = exportSave(state, 2_000);
  const loaded = validateSave(JSON.parse(exported), 3_000);
  assert.equal(loaded.points, 1234);
  assert.equal(loaded.stats.totalEarned, 4321);
  assert.equal(loaded.owned.pocket, 3);
  assert.equal(loaded.achievements['first-click'], 1_000);
});

test('malformed saves recover into a fresh schema and ignore unknown fields', () => {
  assert.equal(validateSave(null), null);
  assert.equal(validateSave({ version: 999, points: 9 }), null);
  const loaded = validateSave({
    version: 1, points: 'not a number', runEarned: -10,
    owned: { pocket: 2.5, 'unknown-upgrade': 9 },
    achievements: { unknown: 1 }, settings: { volume: 4, numberMode: 'strange' },
  }, 50_000);
  assert.equal(loaded.points, 0);
  assert.equal(loaded.runEarned, 0);
  assert.equal(loaded.owned.pocket, 2);
  assert.equal(loaded.owned['unknown-upgrade'], undefined);
  assert.deepEqual(loaded.achievements, {});
  assert.equal(loaded.settings.volume, 1);
  assert.equal(loaded.settings.numberMode, 'compact');
});

test('daily challenge progress, claim and duplicate claim protection work', () => {
  const state = createFreshState(1_000);
  const challenge = getDailyChallenge(state, 1_000);
  assert.equal(challenge.metric, 'clicks');
  for (let i = 0; i < challenge.goal; i += 1) clickCalculator(state, 1_000 + i * 100, () => 0.5);
  assert.equal(state.daily.progress, challenge.goal);
  const first = claimDailyChallenge(state, 10_000);
  assert.equal(first.claimed, true);
  assert.equal(state.stats.challengesCompleted, 1);
  const second = claimDailyChallenge(state, 11_000);
  assert.equal(second.claimed, false);
  assert.equal(second.reason, 'already-claimed');
  assert.equal(state.stats.challengesCompleted, 1);
});

test('daily progression rolls forward once and resists a simple clock rollback', () => {
  const day = 20_000;
  const state = createFreshState(day * 86_400_000);
  syncDaily(state, (day + 1) * 86_400_000);
  assert.equal(state.daily.dayIndex, day + 1);
  syncDaily(state, (day - 1) * 86_400_000);
  assert.equal(state.daily.dayIndex, day + 1);
});

test('active simulation produces points and rare equations grant once', () => {
  const state = createFreshState(1_000);
  state.owned.pocket = 1;
  state.nextEventAt = 2_000;
  const progress = advanceTime(state, 0.5, 2_000, () => 0.5);
  assert.equal(progress.gain, 0.1);
  assert.equal(state.stats.totalPlaySeconds, 0.5);
  assert.equal(state.activeEvent.id, 'eq-1jk');
  assert.equal(getEventRemaining(state, 2_001), 18);
  const collected = collectRareEquation(state, 2_001);
  assert.equal(collected.collected, true);
  assert.equal(state.stats.rareEvents, 1);
  assert.equal(collectRareEquation(state, 2_002).collected, false);
  assert.equal(state.stats.rareEvents, 1);
});

test('expired rare equations do not pay, and focus has a real cooldown', () => {
  const state = createFreshState(1_000);
  state.activeEvent = { id: 'old', expiresAt: 1_500 };
  assert.equal(collectRareEquation(state, 2_000).collected, false);
  assert.equal(state.points, 0);
  assert.equal(activateFocus(state, 2_000).reason, 'locked');
  state.owned['focus-mode'] = 1;
  assert.equal(activateFocus(state, 2_000).activated, true);
  assert.equal(getProduction({ ...state, owned: { pocket: 1 } }, 2_001), 0.4);
  assert.equal(activateFocus(state, 2_002).reason, 'cooldown');
});

test('offline earnings are analytical, capped and respect permanent efficiency only', () => {
  const state = createFreshState(0);
  state.owned.pocket = 1;
  state.boosts.rewardUntil = 100_000;
  const result = applyOfflineProgress(state, MAX_OFFLINE_SECONDS * 4, 10_000);
  assert.equal(result.elapsed, MAX_OFFLINE_SECONDS);
  assert.equal(result.efficiency, 0.25);
  assert.equal(result.reward, 30_240);
  assert.equal(result.reward, 30_240);
  assert.equal(state.points, 30_380); // Analytical reward plus newly earned point milestones
  assert.equal(state.savedAt, 10_000);
  state.owned['sleep-math'] = 1;
  assert.equal(getOfflineEfficiency(state), 0.35);
});

test('prestige requires the milestone, awards the correct stars and retains permanent data', () => {
  const state = createFreshState(1_000);
  state.runEarned = 1_000_000;
  state.points = 900;
  state.owned.pocket = 4;
  state.stats.totalEarned = 1_000_000;
  state.achievements['first-click'] = 1_000;
  state.settings.volume = 0.25;
  assert.equal(canPrestige(state), true);
  assert.equal(prestigeReward(state), 2);
  const result = performPrestige(state, 2_000);
  assert.equal(result.performed, true);
  assert.equal(result.reward, 2);
  assert.equal(state.runEarned, 2_440); // One-time lifetime milestone rewards after the reset
  assert.deepEqual(state.owned, {});
  assert.equal(state.prestige.stars, 2);
  assert.equal(state.prestige.cycles, 1);
  assert.equal(state.stats.totalPrestiges, 1);
  assert.equal(state.achievements['first-click'], 1_000);
  assert.equal(state.settings.volume, 0.25);
});

test('prestige tree uses its own currency and applies lasting bonuses', () => {
  const state = createFreshState(1_000);
  assert.equal(purchasePrestigeUpgrade(state, PRESTIGE_UPGRADES[0].id).reason, 'funds');
  state.prestige.stars = 2;
  assert.equal(purchasePrestigeUpgrade(state, 'pocket-money').bought, true);
  assert.equal(state.prestige.stars, 1);
  state.runEarned = 250_000;
  performPrestige(state, 2_000);
  assert.equal(state.points, 1_260); // 250-point start plus first-prestige and 100-point milestones
});

test('rebirth is distinct, requires both gates and preserves its separate tree', () => {
  const state = createFreshState(1_000);
  state.prestige.cycles = 4;
  state.runEarned = 500_000_000;
  assert.equal(canRebirth(state), false);
  state.prestige.cycles = 5;
  assert.equal(canRebirth(state), true);
  assert.equal(rebirthReward(state), 1);
  state.prestige.stars = 7;
  state.prestige.upgrades['sharper-minds'] = 2;
  state.owned.pocket = 5;
  const result = performRebirth(state, 2_000);
  assert.equal(result.performed, true);
  assert.equal(state.prestige.rebirthTokens, 1);
  assert.equal(state.prestige.cycles, 0);
  assert.equal(state.prestige.stars, 0);
  assert.deepEqual(state.prestige.upgrades, {});
  assert.deepEqual(state.owned, {});
  assert.equal(state.stats.totalRebirths, 1);
  assert.equal(state.points, 15_000); // one-time rebirth achievement
  assert.equal(purchaseRebirthUpgrade(state, 'echoes', 3_000).bought, true);
  assert.equal(getProduction({ ...state, owned: { pocket: 1 } }, 4_000), 0.25);
});

test('all upgrade ids and achievement ids are stable and unique', () => {
  assert.equal(new Set(UPGRADES.map((item) => item.id)).size, UPGRADES.length);
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.id)).size, ACHIEVEMENTS.length);
  assert.equal(new Set(DAILY_CHALLENGES.map((item) => item.id)).size, DAILY_CHALLENGES.length);
  assert.equal(new Set(REBIRTH_UPGRADES.map((item) => item.id)).size, REBIRTH_UPGRADES.length);
  assert.equal(totalUpgradeVariety(createFreshState()), 0);
});
