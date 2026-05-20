# Restless Spirit Assets

Optimized browser-ready artwork and audio for Hannah's Restless Spirit prototype.

Source archive:

`asset-sources/restless-spirit/`

| Game role | Optimized file | Source file | Notes |
| --- | --- | --- | --- |
| Ghost lead | `characters/lead.png` | `asset-sources/restless-spirit/source-lead-ghost.png` | Main playable character from the start. |
| Shiny Coin follower | `characters/follower.png` | `asset-sources/restless-spirit/source-follower-shiny-coin.png` | Appears after 9 coins. |
| Star Coins collectible | `characters/collectible.png` | `asset-sources/restless-spirit/source-collectible-star-coins.png` | First/solo collectible on the field. |
| Diamond Coins collectible | `characters/collectible-alt.png` | `asset-sources/restless-spirit/source-collectible-diamond-coins.png` | Second collectible art when two coins are on the field. |
| Trap hazard | `characters/hazard.png` | Previous prototype placeholder | Kept until a final hazard is supplied. |
| Bat first chaser | `characters/chaser-a.png` | `asset-sources/restless-spirit/source-chaser-bat.png` | First staged chaser. |
| Pumpkin second chaser | `characters/chaser-b.png` | `asset-sources/restless-spirit/source-chaser-pumpkin.png` | Second staged chaser. |
| Haunted mansion background | `backgrounds/background-default.png` | `asset-sources/restless-spirit/source-background-haunted-mansion.png` | Source upload was named `hunated-mansion.png`; this is the only active background. |
| Original ghost concept | `concept/original-ghost-concept.jpg` | `asset-sources/restless-spirit/source-original-ghost-concept.jpg` | Title-click concept modal image. |

Audio:

| Game role | Optimized file | Source file | Notes |
| --- | --- | --- | --- |
| Background music | `public/assets/audio/music/restless-spirit-theme.mp3` | `asset-sources/restless-spirit/source-theme-hannah-restless-spirit.mp3` | `(8bit) Hannah - Restless Spirit.mp3`. |
| Pickup SFX | `public/assets/audio/sfx/restless-spirit-pickup-*.wav` | Generated tiny WAV clips | File-based SFX for mobile unlock reliability. |
| Hazard/hit SFX | `public/assets/audio/sfx/restless-spirit-hazard-*.wav`, `public/assets/audio/sfx/restless-spirit-hit.wav` | Generated tiny WAV clips | Replaces generated Web Audio oscillator SFX. |

Excluded from this pass:

- The old alternate beach/background placeholder.

Do not use Attack of Ziziphus assets or context in this project.
