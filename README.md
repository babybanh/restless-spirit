# Restless Spirit

Fast local reskin of the successful Catch Me If You Can game foundation.

This first pass keeps the proven movement, collecting, chasing, hazard, credits, tuning, loading, modal, and restart behavior from the Banana Monkey/Catch Me line. It intentionally uses the Banana Monkey role flow: the lead character is active from the start, and the companion appears later as a follower. The current artwork and audio are placeholders copied from the previous working template so the game can be published and tested before final Restless Spirit assets arrive.

## Run Locally

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Main Editing File

Start here:

```text
src/gameConfig.js
```

That file controls the title/copy, credits, music path, stage backgrounds, character sizes, speeds, hitboxes, UI positions, joystick zone, z-order, spawn margins, phase thresholds, and tuning storage keys.

## Role Map

The game still uses the Catch Me mechanics internally, but the Restless Spirit skin maps the v1 roles like this:

| Restless Spirit role | Current internal role | Browser-ready file |
| --- | --- | --- |
| Companion follower | `bunbun` / `player` | `public/assets/images/restless-spirit/characters/follower.png` |
| Restless Spirit lead | `bun` / `lead` | `public/assets/images/restless-spirit/characters/lead.png` |
| Spirit Light collectible | `banana` | `public/assets/images/restless-spirit/characters/collectible.png` |
| Trap hazard | `bomb` | `public/assets/images/restless-spirit/characters/hazard.png` |
| Shadow first chaser | `gorilla` | `public/assets/images/restless-spirit/characters/chaser-a.png` |
| Night Watcher second chaser | `g2` | `public/assets/images/restless-spirit/characters/chaser-b.png` |
| Default background | full-frame background | `public/assets/images/restless-spirit/backgrounds/background-default.png` |
| Alternate background | full-frame background option | `public/assets/images/restless-spirit/backgrounds/background-alt.png` |
| Concept modal image | concept image | `public/assets/images/restless-spirit/concept/concept.webp` |
| Placeholder theme | background music | `public/assets/audio/music/restless-spirit-theme.mp3` |

Original/source placeholder files are archived in `asset-sources/restless-spirit/`. Final uploaded source files should also be kept in `/Users/ba/Desktop/A-Z/Projects/Codex/Assets/Raw/restless-spirit/`. Only optimized game-ready copies should live under `public/assets/images/restless-spirit/`.

## Current Draft

- Default background is active; alternate background is available in the tuning panel.
- Restless Spirit starts as the lead character.
- Companion appears after 9 spirit lights and follows the lead.
- Keyboard movement with arrow keys and WASD.
- Floating joystick for mouse/touch.
- Spirit Light scoring, hearts, two staged chasers, trap hazard, combo bonus, invincibility, auto-restart, and music toggle.
- Credits are placeholder-safe until the final student/public credit and link are provided.
- Debug panel toggles with backtick or F2; tuning panel toggles with `T`.

## Publish Notes

- GitHub repository: `https://github.com/babybanh/restless-spirit.git`
- Live Vercel link: `https://restless-spirit.vercel.app`
- First prototype commit: `6679987` (`Build Restless Spirit prototype`)
- Keep deployment and gameplay commits easy to review.

## First-Pass Boundaries

- Working prototype first; final art/audio swap next.
- Placeholder assets must be replaced before the final student-facing release.
- Do not copy from Attack of Ziziphus for this project.
