# Darts Counter

A fast, mobile-first darts scoring app built with **React + TypeScript + Vite** and **SCSS**. Fully static and offline — state persists in **LocalStorage** and finished games are archived in **IndexedDB**.

**Live app:** https://huldacz.github.io/darts-counter-/

## Features

- **Game modes:** X01 (301 / 501 / 701 with optional double-out), Cricket, and Around the Clock.
- **Multiple players** (1–8) with editable names.
- **Intuitive keypad input** — pick a multiplier (Single/Double/Triple) then a number, plus Miss / 25 / Bull.
- **Automatic round switch** after 3 darts (or on a bust / checkout).
- **Undo** any dart, live checkout suggestions for X01, and per-player stats.
- **Persistence:** current game auto-saves to LocalStorage; completed games are stored in IndexedDB history.
- Mobile-first, responsive dark UI.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app and publishes `dist/` to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**.

## Project structure

```
src/
  game/       # pure engine: modes, reducer, checkout solver, types
  db/         # IndexedDB history wrapper
  hooks/      # useLocalStorage
  state/      # AppContext (navigation + persistence)
  components/ # Home, Setup, Game, Keypad, PlayerCard, History
  styles/     # SCSS (tokens, mixins, per-screen partials)
```