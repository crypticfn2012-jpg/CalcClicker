# Calc Clicker

A single-player browser clicker by PixelForge Studios. Tap the calculator, grow your points-per-second, build a maths lab, collect milestones, finish daily challenges, and decide when to prestige or rebirth.

Calc Clicker is a static HTML/CSS/JavaScript project. It has no build step, backend, login, third-party runtime dependency, or required network connection for ordinary play.

## Play

- Open the published index.html, or serve the folder over HTTP with the local development command below.
- Click or tap the large calculator to earn Calculator Points. The calculator button also works with keyboard focus and Enter/Space.
- Buy calculators for passive production and click tools for stronger hands-on gains.
- Use the Buy 1 / Buy 10 / Buy Max controls to choose a purchase size.
- Keep a streak by clicking regularly. Watch for short-lived rare equations.
- Claim one daily challenge reward per UTC day.
- Prestige at 250,000 points earned in the current run. Rebirth is a deeper reset after five prestige cycles and 500 million current-run points.
- Use Study Break for a point-funded boost; an optional CrazyGames rewarded video appears only when the supported SDK is active.
- Open Settings to change sound, volume, number display and motion; export a JSON copy or reset progress.

All costs and rewards are calculated by engine.js; locked items show their lifetime-points requirement. The first calculator costs 8 points.

## Local development

Requires Node.js 20 or newer. There are no packages to install.

    npm run dev

Open http://127.0.0.1:4173/. The small built-in server serves the project with relative paths and binds only to the local computer. You can choose another port with the PORT environment variable.

Run the automated game-logic and save-validation checks with:

    npm test

The tests cover click rewards, costs, Buy 1/10/Max, locked purchases, number formatting, achievements, daily claims and clock rollback, rare equations, boosts, offline earnings, save validation, prestige and rebirth.

## Project map

- index.html — loading screen, accessible navigation and app shell.
- styles.css — original responsive dark interface, calculator, motion and layout.
- engine.js — central state rules, economy, upgrade definitions, challenges, achievements, random events and resets.
- storage.js — versioned local/platform save interface, validation, recovery copy, offline earnings and export.
- platform.js — CrazyGames SDK v3 loading, environment checks, game lifecycle, data storage and ad adapter.
- main.js — UI rendering, keyboard/pointer interaction, audio, save scheduling and screen navigation.
- tools/server.mjs — dependency-free local HTTP server.
- tests/engine.test.js — automated unit checks.
- assets/calc-clicker.svg — original game mark and favicon.
- assets/pixelforge-studios.png — PixelForge Studios mark from PixelForgeSudios/assets/tung.png.

## Saves and offline play

Standalone hosting saves a versioned JSON record in browser storage. Meaningful changes are debounced; the page also saves when it is hidden or closed. A previous save is kept as a recovery copy when storage permits. Settings include a save export and a confirmed reset.

Offline production is calculated in one step, capped at seven days, and uses the current permanent production rate and offline-efficiency upgrades. Temporary boosts do not count while away. UTC daily progress remembers the latest day it has seen, so moving the device clock backwards does not reopen a claimed day.

On CrazyGames, when its supported Data Module is active, Calc Clicker uses that module as the platform save store. CrazyGames manages guest storage and account synchronization through the Data Module. If SDK initialization or storage fails, gameplay continues and the game attempts a local device copy. The UI reports that as a fallback rather than claiming a successful platform sync.

## CrazyGames SDK v3

The SDK is loaded only on CrazyGames.com hosts, on localhost/127.0.0.1, or when ?useLocalSdk=true is supplied. The game awaits v3 initialization with a timeout and checks the resulting environment; it makes no SDK calls when the environment is disabled. The adapter handles loading start/stop, gameplay start/stop, settings mute, optional happytime(), the Data Module, midgame requests and rewarded video callbacks.

Rewarded video is offered from the separate Study Break screen. A successful adFinished callback grants the 60-second boost. adError, cancellation, a missing SDK and timeouts grant nothing. Game sound is muted only after adStarted, and interactions remain blocked while an ad request is pending. A point-funded boost provides the same reward without an ad.

No midgame ad is automatically requested: this clicker has no level transitions or other natural stop where a midgame placement would fit. The adapter exposes a guarded midgame request for a future genuine break in play.

### SDK test procedure

1. Standalone: open the game on a non-CrazyGames host without the local-SDK query parameter. For local testing, use ?disableSdk=true. Confirm Settings reports standalone mode, purchases work, saves reload and ads are not shown.
2. Local simulation: serve on localhost and open ?useLocalSdk=true if the SDK does not select local simulation automatically. CrazyGames documents demo ads/account data in this mode; that does not prove production monetization or cloud behavior.
3. CrazyGames initialization and lifecycle: upload a private build in the CrazyGames Developer Portal preview, then check initialization status and browser console output for loading/gameplay start-stop calls while opening Study Hall and Settings.
4. Rewarded ad: on a supported preview, complete the video and confirm one boost. Test an unavailable/error/cancelled ad and confirm no reward. Repeat rapidly to verify the cooldown.
5. Data Module: on a supported preview, save progress, reload it, then test guest/sign-in changes on platform-managed accounts. Confirm that SDK failures leave the game usable and the Settings status remains honest.

Production ads, account synchronization and cloud-save conflicts cannot be verified on GitHub Pages or a local SDK simulation; they require the CrazyGames preview environment and a configured game submission.

## GitHub Pages

The publishing root contains index.html and uses relative paths so the same files work at a repository subpath such as:

    https://crypticfn2012-jpg.github.io/CalcClicker/

After pushing the project to its GitHub repository:

1. Open Settings → Pages for that repository.
2. Choose Deploy from a branch, select the publishing branch (normally main) and the /(root) folder.
3. Save, wait for GitHub Pages to finish, then open the published URL and check the browser console.

No build workflow is required for this static project. GitHub repository settings and publication have not been changed from this workspace.

## Adding content

### Upgrades

Add producers to PRODUCERS in engine.js with a unique id, baseCost, growth, rate and unlockAt. The current producer implementation uses the same geometric price curve and per-owned-unit production for every producer. Add click tools to SPECIAL_UPGRADES; one-time tools default to one purchase. mental-math is levelled with an explicit maxOwned. If adding a new kind, update the click, production, offline or event calculation that consumes it and add a UI benefit description in main.js.

### Achievements

Add stable IDs to ACHIEVEMENTS with an existing metric (clicks, upgrades, lifetime, pps, variety, streak, play, challenges, events, prestiges, or rebirths). The engine checks real state values and stores an unlock timestamp. Add a metric in getMetric() before introducing a new condition type.

### Daily challenges and rare equations

Daily goals come from DAILY_CHALLENGES and rotate by UTC day. Each challenge uses an existing progress metric. Rare equations are scheduled in advanceTime() and paid by collectRareEquation(); the event is removed before its reward is applied, so it can only be collected once.

## Limitations

- Records are local to the current browser or the current CrazyGames Data Module account. There is no configured online leaderboard service, so the game does not show a fake global ranking.
- Device-local saves and CrazyGames account saves are separate stores. CrazyGames’ Data Module is the source of truth while its SDK environment is active; the module manages guest-to-account synchronization.
- Production SDK ads, cloud synchronization and the private CrazyGames preview still require platform-side testing. Calc Clicker has not been submitted or approved.
- A manual HTTP/browser check should be repeated after changing layout, SDK behavior or save schema.
- Credits: PixelForge Studios; Ron, main developer. The PixelForge mark is used from the studio’s public repository. The game uses original CSS/SVG artwork and synthesized Web Audio; no external game library or sound asset is included.
