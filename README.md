# Training Ledger

A personal strength and cardio training log, built from scratch as a learning
project for working with Claude Code / vibe coding.

## What it does

- **Log** — record a session as a date, an optional free-text title, and notes.
  Strength sessions just take those three fields (put the exercises, sets and
  weights in the notes); cardio sessions also pick an activity (Run, Bike, …)
  and put duration and distance in the notes. Titles like "Maximum Strength" or
  "Long trail run" label the session in History and the Calendar.
- **Calendar** — a monthly view of your training. Plan a strength or cardio
  session ahead of time for any date (same fields as logging), see planned vs.
  completed sessions at a glance, and turn a plan into a real log entry with
  "Log now" once you've done it.
- **History** — every completed session, grouped by date, with edit and delete.

The header shows a running day streak. All numbers beyond that (per-exercise or
per-activity trends, weekly totals) now live in the notes you write.

## How it's built

All the app code — HTML, CSS, JavaScript — is in one page, `index.html`: no
build step, no dependencies.

- **HTML** — the page structure (forms, tabs, history list, calendar).
- **CSS** (inside `<style>`) — the look, including a light/dark theme that
  follows your system setting.
- **JavaScript** (inside `<script>`) — the app logic: reading and writing your
  data and rendering each tab.

A small PWA layer sits alongside it — `manifest.webmanifest`, `sw.js` (a
service worker), and icon files — so the app can be installed to a phone's home
screen and works with no connection. On a phone, open the live link and choose
"Add to Home Screen".

All data is saved to the browser's `localStorage` — by default nothing is sent
to a server, so it lives only in the browser you use it in. Use the backup
button (⇅) in the app to copy your data out as text if you want to move it or
keep a safety copy — or turn on **Sync** (below) to do that automatically.

## Running it

Live version: **https://t0b1as-coder.github.io/training-ledger/**

Every push to `main` redeploys it via the workflow in
`.github/workflows/deploy.yml`. (`localStorage` is per-origin, so the hosted
site and a local copy keep separate data — move data between them with the
backup button.)

To run it locally, just open `index.html` in a browser — double-click it, or
run a tiny local server if you prefer:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Syncing across devices

By default, your phone and your laptop each have their own separate copy of
your data. The **Sync** tab (inside the backup ⇅ button) keeps them in step
automatically, through a private [GitHub Gist](https://gist.github.com) — a
small private file GitHub hosts for you.

To turn it on:

1. Create a GitHub [personal access token](https://github.com/settings/tokens?type=beta)
   scoped to **gist only** — don't grant it anything else.
2. Open the app → ⇅ → **Sync** → paste the token → **Connect**.
3. Repeat step 2 on each other device, using the same token.

That token is a secret — treat it like a password. It's stored only in that
device's browser storage, never in this repository, and never leaves your
devices except to talk to `api.github.com`. Anyone who got hold of it could
read or change your synced training data, but nothing else on your GitHub
account (assuming it's scoped to `gist` only, as above).

**Known limitation:** conflicts are resolved by whichever device saved most
recently — there's no merging. If you log something on two devices at the
exact same time while both are offline, one set of changes wins and the other
is lost. For a personal training log this is rare and low-stakes, but worth
knowing.

## Testing

The app itself has no test tooling built in — but there's a Playwright
end-to-end suite (`tests/`) that drives the real page in a browser: logging
sessions, editing, deleting, planning from the Calendar, backup/restore, sync,
and the day streak. It's dev-only (needs [Node.js](https://nodejs.org)); the
shipped app is unaffected either way. The sync tests fake GitHub's API rather
than calling it for real — there's no real token or gist involved in CI.

```
npm install
npx playwright install --with-deps chromium
npm test
```

Runs automatically on every pull request via
`.github/workflows/test.yml`.

## Status

Personal project, actively used and evolving. Changes get made by describing
what should change to Claude Code rather than hand-editing — that's the point
of the project.
