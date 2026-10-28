# Browser reliability review — 2026-10-27

## Intent preserved

Keep the intro blur, original music delay, movement-triggered start, and fresh-movement recovery. Relevant history: f19e5b7 (mobile gesture/combo performance), aeed643 and d08467c (intro blur/joystick).

## Changes

Decode active short WAV effects before collision and play buffers after a real gesture, retaining HTML audio fallback. Clear stale keys/joystick and stop hidden sound. Defer music, load only active SFX initially, and avoid hidden tuning updates.

## Validation

7 Node regression tests; production build; desktop Chromium and mobile WebKit lifecycle/play tests; 18-pickup phase progression and restart; cold pickup handler 243 ms before and 0 ms after in one mobile WebKit run.

Mobile checks used WebKit on macOS with a 390×844 touch viewport. Cold-pickup fixtures position collectibles at the player and run the normal collision/score/audio path. Playback was checked through running audio contexts and started buffers, not recorded speaker output. These are not physical iPhone/Android tests. Occasional long cold frames also occur with SFX off; repeat on a real phone before treating overall frame smoothness as resolved.
