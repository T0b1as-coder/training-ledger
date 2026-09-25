# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal strength & cardio training log. All app code — HTML, CSS, JS — is in
one file, `index.html`: no build step, no dependencies, no package manager, no
framework. It is developed by describing changes to Claude Code rather than
hand-editing (that's the point of the project).

Alongside `index.html` the repo also ships a small PWA layer so the app is
installable and works offline: `manifest.webmanifest`, `sw.js` (service
worker), and `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` (a white
"T" on `#C4571F`, regenerable with Pillow). The service worker caches the app
shell (`index.html`) plus the manifest, icons, and Google Font files. It is
**stale-while-revalidate for navigations**, so the first load after a deploy
serves the previous `index.html` and picks up the new one on the next launch.
Bump `CACHE` in `sw.js` to force old caches to be dropped.

Deployed to GitHub Pages (`.github/workflows/deploy.yml`) on every push to
`main`: https://t0b1as-coder.github.io/training-ledger/

Optionally syncs across devices through a private GitHub Gist (Backup &
Restore → **Sync** tab) — see **Sync** below. This is the app's first genuine
external-service dependency beyond Google Fonts (`api.github.com`, reached
directly from the browser with a user-supplied personal access token).

There is a Playwright end-to-end test suite (`tests/`) that drives the real
`index.html` in a browser — see **Tests** below. It's dev-only tooling: the
shipped app still has zero runtime dependencies, only the test suite uses npm.

## Running / verifying changes

There is no build or lint tooling. To check a change by hand:

- Open `index.html` directly in a browser (double-click, or `python3 -m http.server 8000` then visit `http://localhost:8000`).
- Exercise the tab you changed, and watch the browser console — the whole script
  is one IIFE that runs on load, so a reference to a missing element id throws
  immediately and visibly.
- The service worker only registers over `http(s)`/`localhost`, never `file://`,
  so to test PWA/offline behaviour use `python3 -m http.server`. Once a service
  worker is active it will serve a cached `index.html`; hard-reload (or bump
  `CACHE` in `sw.js`) to see edits, and use an incognito window to start clean.
- The in-editor preview pane renders this file as a **static snapshot** (it lives
  outside a served project), and each browser/tab has its **own `localStorage`**,
  so test data does not carry between the preview and a real browser.

`gh` CLI is not installed in this environment. Neither is Node/npm as of this
writing — if you need to run the test suite yourself and `node`/`npm` aren't on
PATH, say so rather than assuming a passing run; CI (`.github/workflows/test.yml`)
is what actually verifies it on every PR.

## Tests

`npm install && npx playwright install --with-deps chromium && npm test` runs
the suite once (`playwright.config.js` starts `tests/static-server.js` — a
~30-line dependency-free Node script — and points Chromium at it; no server
needs to be started by hand). `npm run test:ui` opens Playwright's UI mode for
picking through failures interactively.

Each spec drives the page like a user would (fill the real form, click the
real button, assert on the real rendered DOM) rather than calling internal
functions — nothing in the IIFE is exported, and that's deliberate. Add a new
`tests/*.spec.js` file per feature area; each test gets a fresh browser context
(so fresh `localStorage`) automatically.

**No `package-lock.json` yet** — it needs `npm install` to generate, which
this environment couldn't run. CI uses `npm install` (not `npm ci`) until one
exists; commit the lockfile the first time you run `npm install` somewhere
with Node.

## Sync

Reuses the existing backup JSON: the Sync tab pushes/pulls that same shape
to/from one private Gist (filename `trainingLedger.json`) via `api.github.com`,
using a GitHub personal access token (scope: `gist` only) the user pastes in.

- The token + gist id live in **`trainingLedger.sync.v1`**, a separate
  `localStorage` key from the training data. Never merge this into `data` or
  include it in a backup export — it's a credential.
- Conflict handling is **last-write-wins on the whole blob**, via a top-level
  `data.lastModified` (epoch ms, set in `saveData()`). No per-record merge.
  Two devices editing while both offline at the same moment can silently lose
  one side's changes — this is a documented, accepted limitation, not a bug
  to "fix" by adding merge logic unless asked.
- `saveData()` always bumps `lastModified` and schedules a debounced push
  (`scheduleSyncPush`, ~1.5s). Adopting a remote copy that's newer calls
  `persistLocalOnly()` instead (keeps the remote's own `lastModified`, doesn't
  re-push what the gist already has).
- On load, the app renders immediately with whatever's on-device, then
  quietly pulls and swaps in a newer remote copy if one shows up
  (`syncPullAndAdopt`) — startup never blocks on the network.
- Tests (`tests/gist-sync.spec.js`) mock `api.github.com` with
  `page.route()` and set `serviceWorkers: 'block'` for that file. **Never**
  add a real GitHub token as a CI secret for this — mocking is the correct
  and sufficient way to test this integration in a public repo.

## Architecture

`index.html` is three parts in one file:

1. **`<style>`** — CSS-variable theming. Colors are defined three times: bare
   `:root` (light), `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`,
   and `:root[data-theme="dark"]`. All three must stay in sync when adding a token.
2. **HTML body** — topbar (day-streak chip + backup button), `.tab-rail` nav, and
   the three views: `#view-log`, `#view-calendar`, `#view-history`. Plus the
   backup/restore modal and a toast element.
3. **`<script>`** — a single `"use strict"` IIFE holding all app logic, followed
   by a tiny second `<script>` that only registers the service worker.

### Data

Everything lives in one object persisted to `localStorage` under
`trainingLedger.v1`:

```js
data = { strength: [], cardio: [], planned: [], lastModified }
```

- **strength** record: `{ id, date, title, note }`
- **cardio** record: `{ id, date, title, activity, note }`
- **planned** record: same fields plus `type: 'strength' | 'cardio'`
- **lastModified**: epoch ms, set by `saveData()` on every save. Used only for
  Sync's last-write-wins comparison — nothing else reads it.

`date` is a local `YYYY-MM-DD` string. Use `toISODate()` / `parseISO()` for date
work — never `new Date(isoString)` (UTC-parsing bug). Record ids come from `uid()`.

Fields have been deliberately trimmed over time (strength lost its exercise/set
builder; cardio lost duration/distance). Older records in a user's storage or
backup may still carry legacy keys (`exercises`, `duration`, `distance`); render
code tolerates their absence. Do not reintroduce inputs for removed fields
unless asked.

### Rendering

- No templating. DOM is built with the `el(tag, attrs, ...children)` helper
  (`on*` attrs attach listeners, `class` sets className, `html` sets innerHTML).
- `state` object holds the active tab, current filter, and `state.editing`.
  `renderAll()` re-renders whichever tab is active after any data change.
- **The two Log forms serve four modes**, selected by `state.editing`:
  new entry (`null`), edit an existing log (`source:'log'`), plan ahead
  (`source:'planned'`), and complete a plan (`source:'planned', complete:true`).
  `beginEditStrength/Cardio` and `beginPlanStrength/Cardio` set this up and
  repoint the submit handler.
- The Calendar reads all three arrays to draw day dots and the day panel;
  "Log now" moves a `planned` record into `strength`/`cardio`.
- Backup = `JSON.stringify(data)`; restore replaces `data` wholesale after an
  array-shape check.

## Conventions

- Keep the app dependency-free (no npm packages, build step, or framework in
  what ships). All app code stays in `index.html`; the only other shipped
  files are the PWA layer (manifest, `sw.js`, icons). `tests/`, `package.json`,
  and CI are dev-only and never ship. The app's own external calls: Google
  Fonts, plus `api.github.com` when Sync is connected.
- Any resource `index.html` or `sw.js` references must be relative (the site is
  served from the `/training-ledger/` subpath, not a domain root).
- Element ids `camelCase`; CSS classes `kebab-case`.
- Any color goes through a CSS variable so both themes work.
- Match the existing vanilla style — `el()` for DOM, plain functions, no
  classes/modules.
