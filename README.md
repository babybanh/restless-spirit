# Restless Spirit

Fast local reskin of the successful Catch Me If You Can game foundation.

This prototype keeps the proven Banana Monkey mechanic flow: the Ghost is playable from the start, the Coin appears later as the follower, the Bat is the first chaser, and the Pumpkin is the second chaser. Hannah's haunted mansion art and theme music are now active in the published build.

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

That file controls the title/copy, credits, music path, stage background, character sizes, speeds, hitboxes, UI positions, joystick zone, z-order, spawn margins, phase thresholds, SFX file choices, and tuning storage keys.

## Role Map

The game still uses the Catch Me mechanics internally, but the Restless Spirit skin maps the v1 roles like this:

| Restless Spirit role | Current internal role | Browser-ready file |
| --- | --- | --- |
| Coin follower | `bunbun` / `player` | `public/assets/images/restless-spirit/characters/follower.png` |
| Ghost lead | `bun` / `lead` | `public/assets/images/restless-spirit/characters/lead.png` |
| Spirit Light collectible | `banana` | `public/assets/images/restless-spirit/characters/collectible.png` |
| Trap hazard | `bomb` | `public/assets/images/restless-spirit/characters/hazard.png` |
| Bat first chaser | `gorilla` | `public/assets/images/restless-spirit/characters/chaser-a.png` |
| Pumpkin second chaser | `g2` | `public/assets/images/restless-spirit/characters/chaser-b.png` |
| Haunted mansion background | full-frame background | `public/assets/images/restless-spirit/backgrounds/background-default.png` |
| Game art modal image | concept image | `public/assets/images/restless-spirit/concept/game-art.png` |
| Hannah theme | background music | `public/assets/audio/music/restless-spirit-theme.mp3` |
| File-based event SFX | pickup / hit / hazard sounds | `public/assets/audio/sfx/` |

Original/source files are archived in `asset-sources/restless-spirit/`. The uploaded `restless-spirit-original-drawing.jpg` is intentionally excluded from the game and archive for this pass.

## Current Draft

- Haunted mansion is the only active background in the tuning selector.
- Ghost starts as the lead character.
- Coin appears after 9 spirit lights and follows the lead.
- Keyboard movement with arrow keys and WASD.
- Floating joystick for mouse/touch.
- Spirit Light scoring, hearts, two staged chasers, trap hazard, combo bonus, invincibility, auto-restart, and music toggle.
- Soundtrack starts only from real movement. Event SFX use file-based WAV clips so mobile joystick movement unlocks music and SFX together.
- Credits show Hannah's YouTube music link and Le Binh Anh Nguyen game design/development credit.
- Debug panel toggles with backtick or F2; tuning panel toggles with `T`.

## Credits

- Original music and characters by Hannah: `https://www.youtube.com/watch?v=Woz_xv3eIcM`
- Game design and development by Le Binh Anh Nguyen and Codex.

## Publish Notes

- GitHub repository: `https://github.com/babybanh/restless-spirit.git`
- Live Vercel link: `https://restless-spirit.vercel.app`
- First prototype commit: `6679987` (`Build Restless Spirit prototype`)
- Final asset swap commit: recorded in git history after this pass.
