# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal strength & cardio training log. The entire app is one self-contained
file, `index.html` — no build step, no dependencies, no package manager, no
framework. It is developed by describing changes to Claude Code rather than
hand-editing (that's the point of the project).

## Running / verifying changes

There is no build, lint, or test tooling. To check a change:

- Open `index.html` directly in a browser (double-click, or `python3 -m http.server 8000` then visit `http://localhost:8000`).
- Exercise the tab you changed, and watch the browser console — the whole script
  is one IIFE that runs on load, so a reference to a missing element id throws
  immediately and visibly.
- The in-editor preview pane renders this file as a **static snapshot** (it lives
  outside a served project), and each browser/tab has its **own `localStorage`**,
  so test data does not carry between the preview and a real browser.

`gh` CLI is not installed in this environment.

## Architecture

`index.html` is three parts in one file:

1. **`<style>`** — CSS-variable theming. Colors are defined three times: bare
   `:root` (light), `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`,
   and `:root[data-theme="dark"]`. All three must stay in sync when adding a token.
2. **HTML body** — topbar (day-streak chip + backup button), `.tab-rail` nav, and
   the three views: `#view-log`, `#view-calendar`, `#view-history`. Plus the
   backup/restore modal and a toast element.
3. **`<script>`** — a single `"use strict"` IIFE holding all logic.

### Data

Everything lives in one object persisted to `localStorage` under
`trainingLedger.v1`:

```js
data = { strength: [], cardio: [], planned: [] }
```

- **strength** record: `{ id, date, title, note }`
- **cardio** record: `{ id, date, title, activity, note }`
- **planned** record: same fields plus `type: 'strength' | 'cardio'`

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

- Keep it dependency-free and single-file. Google Fonts is the only external
  resource.
- Element ids `camelCase`; CSS classes `kebab-case`.
- Any color goes through a CSS variable so both themes work.
- Match the existing vanilla style — `el()` for DOM, plain functions, no
  classes/modules.
