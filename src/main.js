import Phaser from "phaser";
import "./styles.css";
import { gameConfig } from "./gameConfig.js";
import { RestlessSpiritScene } from "./game/scene.js";
import { createInitialState } from "./game/state.js";
import { createInputController } from "./game/input.js";
import { createGameUi } from "./game/ui.js";

const shell = document.querySelector("#game-shell");
const gameRoot = document.querySelector("#game-root");
const uiRoot = document.querySelector("#ui-root");

const state = createInitialState(gameConfig);
const input = createInputController(gameConfig, shell);
const ui = createGameUi(gameConfig, uiRoot, state, input);
input.onAudioGestureStart = () => ui.prepareAudioFromGesture();
input.onMovementGesture = () => ui.startMusicFromMovement();

globalThis.restlessSpiritRuntime = {
  config: gameConfig,
  state,
  input,
  ui
};
window.restlessSpiritRuntime = globalThis.restlessSpiritRuntime;

const phaserConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: gameConfig.game.designWidth,
  height: gameConfig.game.designHeight,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  backgroundColor: "#08112e",
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: "high-performance"
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: gameConfig.game.designWidth,
    height: gameConfig.game.designHeight
  },
  scene: [RestlessSpiritScene]
};

new Phaser.Game(phaserConfig);

syncStageRoots();
window.addEventListener("resize", syncStageRoots);
setTimeout(syncStageRoots, 0);

function syncStageRoots() {
  gameRoot.style.transform = "none";
  uiRoot.style.transform = "none";

  requestAnimationFrame(() => {
    const shellRect = shell.getBoundingClientRect();
    const gameRect = gameRoot.getBoundingClientRect();
    const offsetY = shellRect.top - gameRect.top;
    const offsetX = shellRect.left - gameRect.left;

    if (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5) return;

    const transform = `translate(${offsetX}px, ${offsetY}px)`;
    gameRoot.style.transform = transform;
    uiRoot.style.transform = transform;
  });
}
