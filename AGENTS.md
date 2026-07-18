# AGENTS.md — study-together / GRIND

## Repo layout

- **Root** is the active copy. `study-app/` is a stale divergent copy — never edit it.
- All source code is in `src/`. App.js wires the screen navigator.

## Tech stack

- Expo ~54 + React Native 0.81 + React 19 — plain JavaScript (no TypeScript).
- npm only. No yarn/pnpm.
- **No test framework, no linter, no formatter, no typecheck, no CI.** `npm test` and similar commands will not work.

## Commands

| Command | Action |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run web` | Start with web target |
| `npm run deploy` | Export web build → deploy to GitHub Pages via `gh-pages` |

`predeploy` runs `expo export -p web` and writes `dist/.nojekyll`.

## Architecture notes

- `src/context/StudyContext.js` is the central state hub — all 12 AsyncStorage keys load on mount and auto-persist via `useEffect`.
- `src/utils/supabase.js` has raw anon key and URL — treat as public/frontend-only.
- `src/utils/storage.js` — AsyncStorage wrapper, key names are the source of truth for persistence keys.
- `src/theme.js` — light/dark themes, subject color palette, 5 background palettes.
- `src/components/Anatomy3D.js` is **web-only** (Three.js, wraps in `Platform.OS === 'web'` guard).
- `app.json` sets `experiments.baseUrl: "/hehe"` — unusual, affects web routing.

## App entrypoint

`App.js` in root uses 8 bottom tabs (no Anatomy tab wired), but `AnatomyScreen.js` and `Anatomy3D.js` files still exist in `src/`. The `study-app/` subdirectory has 9 tabs (includes Anatomy).

## Testing

No test infrastructure exists. Manual testing only (preview via `npm start` or `npm run web`).
