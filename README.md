# Training Ledger

A personal strength and cardio training log, built from scratch as a learning
project for working with Claude Code / vibe coding.

## What it does

- **Log** — record a strength session (date, an optional free-text title, and
  notes — put the exercises, sets and weights in the notes) or a cardio session
  (activity, duration, distance — pace is calculated for you), which also takes
  an optional title. Titles like "Maximum Strength" or "Long trail run" label
  the session in History and the Calendar.
- **Calendar** — a monthly view of your training. Plan a strength or cardio
  session ahead of time for any date (same level of detail as logging), see
  planned vs. completed sessions at a glance, and turn a plan into a real log
  entry with "Log now" once you've done it.
- **History** — every completed session, grouped by date, with edit and delete.
- **Progress** — a day streak, this week's stats, and a trend chart per cardio
  activity (distance, duration, or pace).

## How it's built

It's a single self-contained page (`index.html`) — no build step, no dependencies.

- **HTML** — the page structure (forms, tabs, history list, chart containers).
- **CSS** (inside `<style>`) — the look, including a light/dark theme that
  follows your system setting.
- **JavaScript** (inside `<script>`) — the app logic: reading and writing your
  data, rendering each tab, and drawing the progress charts as inline SVG.

All data is saved to the browser's `localStorage` — nothing is sent to a
server. That means your data lives only in the browser you use it in; use the
backup button (⇅) in the app to copy your data out as text if you want to move
it or keep a safety copy.

## Running it

Just open `index.html` in a browser — double-click it, or run a tiny local
server if you prefer:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Status

Personal project, actively used and evolving. Changes get made by describing
what should change to Claude Code rather than hand-editing — that's the point
of the project.
