export function createGameUi(config, root, state, input) {
  const defaultConfig = structuredClone(config);
  applySavedTuning(config);
  applySavedPanelState(config, state);

  const layer = document.createElement("div");
  layer.className = "ui-design-layer";
  layer.style.width = px(config.game.designWidth);
  layer.style.height = px(config.game.designHeight);
  root.append(layer);

  const elements = {};
  const audio = createAudioController(config);
  state.soundMuted = !audio.musicEnabled;
  const uiApi = {
    showStartScreen,
    hideStartScreen,
    showGameOver,
    hideGameOver,
    update,
    resetTuningToDefaults,
    prepareAudioFromGesture: audio.prepareFromGesture,
    startMusicFromMovement: audio.startFromMovement,
    playSfx: audio.playSfx,
    previewSfx: audio.previewSfx,
    toggleSfx: audio.toggleSfx,
    isSfxEnabled: () => audio.sfxEnabled,
    savePanelState: () => savePanelState(config, state),
    onStart: null,
    onRestart: null
  };

  createHud(elements, layer, config, state, audio);
  elements.title.addEventListener("click", showConceptOverlay);
  elements.credits.addEventListener("click", showCreditsOverlay);
  warmOptionalImage(config.concept.imagePath);
  createJoystick(elements, layer, config);
  createTutorialPrompt(elements, layer, config);
  createDebugPanel(elements, layer, config);
  createTuningPanel(elements, layer, config, audio);
  createTools(elements, layer, config, state, uiApi);
  elements.restart.addEventListener("click", () => {
    if (uiApi.onRestart) uiApi.onRestart();
  });
  resizeLayer(config, root, layer);
  window.addEventListener("resize", () => resizeLayer(config, root, layer));

  return uiApi;

  function showStartScreen() {
    if (elements.startScreen) elements.startScreen.remove();

    const overlay = document.createElement("div");
    overlay.className = "start-overlay";

    const blurLayer = document.createElement("div");
    blurLayer.className = "start-blur-layer";

    const prompt = document.createElement("div");
    prompt.className = "start-control-prompt";
    prompt.textContent = config.startScreen.promptText;
    setCenteredText(prompt, config.startScreen.promptX, config.startScreen.promptY, config.startScreen.promptWidth, config.startScreen.promptFontSize);

    const leadMirror = document.createElement("img");
    leadMirror.className = "start-lifted-object";
    leadMirror.alt = "";
    leadMirror.src = config.art.characters.bun.path;

    const bananaMirror = document.createElement("img");
    bananaMirror.className = "start-lifted-object";
    bananaMirror.alt = "";
    bananaMirror.src = config.art.characters.banana.path;

    const credits = document.createElement("button");
    credits.className = "start-small-button";
    credits.dataset.uiControl = "true";
    credits.textContent = config.copy.creditsLabel;
    setButtonRect(credits, {
      x: config.buttons.creditsButtonX,
      y: config.buttons.creditsButtonY,
      width: config.buttons.creditsButtonWidth,
      height: config.buttons.creditsButtonHeight
    }, config);
    credits.addEventListener("click", showCreditsOverlay);

    overlay.append(blurLayer, leadMirror, bananaMirror, prompt, credits);
    layer.append(overlay);
    elements.startScreen = overlay;
    elements.startLeadMirror = leadMirror;
    elements.startBananaMirror = bananaMirror;
    updateStartSpotlight(elements, state, config);
  }

  function makeStartChoice(choice) {
    const button = document.createElement("button");
    button.className = "start-choice";
    button.dataset.uiControl = "true";
    setRect(button, choice.rect);
    button.style.borderRadius = px(config.playArea.borderRadius);

    const title = document.createElement("span");
    title.className = "start-choice-title";
    title.textContent = choice.title;
    title.style.fontSize = px(config.startScreen.choiceTitleFontSize);

    const text = document.createElement("span");
    text.className = "start-choice-text";
    text.textContent = choice.text;
    text.style.fontSize = px(config.startScreen.choiceTextFontSize);

    button.append(title, text);
    button.addEventListener("click", () => {
      if (uiApi.onStart) uiApi.onStart(choice.mode);
    });
    return button;
  }

  function hideStartScreen() {
    if (elements.startScreen) elements.startScreen.remove();
    elements.startScreen = null;
  }

  function showGameOver() {
    if (elements.gameOver) elements.gameOver.remove();

    const overlay = document.createElement("div");
    overlay.className = "screen-overlay";

    const panel = document.createElement("div");
    panel.className = "game-over-panel";
    setRect(panel, {
      x: config.gameOver.panelX,
      y: config.gameOver.panelY,
      width: config.gameOver.panelWidth,
      height: config.gameOver.panelHeight
    });
    panel.style.borderRadius = px(config.playArea.borderRadius);

    const title = document.createElement("div");
    title.className = "game-over-title";
    title.textContent = config.copy.gameOverTitle;
    setCenteredText(title, config.gameOver.panelX + config.gameOver.panelWidth / 2, config.gameOver.panelY + 72, config.gameOver.textWidth, config.gameOver.titleFontSize);

    const text = document.createElement("div");
    text.className = "game-over-text";
    text.textContent = `${config.copy.roleLabels.collectiblePlural}: ${state.bananaCount}   ${config.copy.scoreLabel}: ${state.score}`;
    setCenteredText(text, config.gameOver.panelX + config.gameOver.panelWidth / 2, config.gameOver.panelY + 140, config.gameOver.textWidth, config.gameOver.textFontSize);

    const restart = document.createElement("button");
    restart.className = "screen-button";
    restart.textContent = config.copy.restartLabel;
    setButtonRect(restart, {
      x: config.gameOver.panelX + (config.gameOver.panelWidth - config.buttons.startButtonWidth) / 2,
      y: config.gameOver.panelY + 180,
      width: config.buttons.startButtonWidth,
      height: config.buttons.startButtonHeight
    }, config);
    restart.addEventListener("click", () => {
      if (uiApi.onRestart) uiApi.onRestart();
    });

    overlay.append(panel, title, text, restart);
    layer.append(overlay);
    elements.gameOver = overlay;
  }

  function hideGameOver() {
    if (elements.gameOver) elements.gameOver.remove();
    elements.gameOver = null;
  }

  function update(debugData) {
    updatePageBackdrop(config);
    elements.score.textContent = `${config.copy.scoreLabel}: ${state.score}`;
    elements.bananaCount.textContent = `${config.copy.roleLabels.collectiblePlural}: ${state.bananaCount}`;
    elements.hearts.textContent = "♥".repeat(state.hearts);
    elements.sound.textContent = state.soundMuted ? config.copy.musicOffLabel : config.copy.musicOnLabel;
    elements.tutorialPrompt.style.display = state.tutorialActive ? "block" : "none";
    elements.debug.style.display = state.debugVisible ? "block" : "none";
    elements.tuning.style.display = state.tuningVisible ? "block" : "none";
    elements.toolsPanel.style.display = state.toolsVisible ? "block" : "none";
    elements.bottomControls.classList.toggle("bottom-controls--clear", config.art.backgroundMode === "fullFrame");
    updateStartSpotlight(elements, state, config);

    updateJoystickView(elements, input.joystick, config, state);
    updateTuningValues(elements, config);

    if (state.debugVisible) {
      elements.debugText.textContent = formatDebugText(debugData, state, input, config);
    }
  }

  function resetTuningToDefaults() {
    localStorage.removeItem(config.tuningPanel.localStorageKey);
    copyConfigValues(defaultConfig, config);
    audio.resetToConfig();
    updateTuningValues(elements, config);
  }

  function showConceptOverlay() {
    showSoftModal({
      className: "concept-modal",
      title: config.concept.title,
      subtitle: config.concept.subtitle,
      body: (modal) => {
        const image = document.createElement("img");
        image.className = "concept-image";
        image.decoding = "async";
        image.loading = "eager";
        image.src = config.concept.imagePath;
        image.alt = config.copy.conceptAlt;
        image.style.setProperty("--concept-image-width", px(config.concept.imageWidth));
        image.style.setProperty("--concept-image-max-height", px(config.concept.imageHeight));
        modal.append(image);
      }
    });
  }

  function showCreditsOverlay() {
    showSoftModal({
      className: "credits-modal",
      title: config.credits.contestTitle,
      titleHref: config.credits.contestUrl,
      subtitle: "",
      body: (modal) => {
        const original = document.createElement("p");
        original.className = "credits-copy";
        const studentCredit = config.credits.musicUrl
          ? `<a href="${config.credits.musicUrl}" target="_blank" rel="noreferrer">${config.credits.studentName}</a>`
          : `<span class="credits-name">${config.credits.studentName}</span>`;
        original.innerHTML = `<span>Original music and characters by</span>${studentCredit}`;

        const design = document.createElement("p");
        design.className = "credits-copy";
        design.innerHTML = `<span>Game design and development by</span><a href="mailto:${config.credits.designerEmail}">${config.credits.designerName}</a>`;

        modal.append(original, design);
      }
    });
  }

  function showSoftModal({ className, title, titleHref, subtitle, ariaLabel, body }) {
    if (elements.softModal) elements.softModal.remove();

    const overlay = document.createElement("div");
    overlay.className = `soft-modal-overlay ${className}`;
    overlay.dataset.uiControl = "true";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title || ariaLabel || "Dialog");

    const modal = document.createElement("div");
    modal.className = "soft-modal-card";

    const close = document.createElement("button");
    close.className = "modal-close";
    close.dataset.uiControl = "true";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => {
      overlay.remove();
      elements.softModal = null;
    });

    const heading = document.createElement(titleHref ? "a" : "div");
    heading.className = "modal-title";
    heading.textContent = title;
    if (titleHref) {
      heading.href = titleHref;
      heading.target = "_blank";
      heading.rel = "noreferrer";
    }

    modal.append(close);
    if (title) modal.append(heading);
    if (subtitle) {
      const sub = document.createElement("div");
      sub.className = "modal-subtitle";
      sub.textContent = subtitle;
      modal.append(sub);
    }
    body(modal);
    overlay.append(modal);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.remove();
        elements.softModal = null;
      }
    });
    layer.append(overlay);
    elements.softModal = overlay;
  }

}

function warmOptionalImage(src) {
  if (!src || typeof window === "undefined") return;
  const warm = () => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = src;
    image.decode?.().catch(() => undefined);
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warm, { timeout: 1500 });
    return;
  }
  window.setTimeout(warm, 350);
}

function createHud(elements, layer, config, state, audio) {
  const bottomControls = document.createElement("div");
  bottomControls.className = "bottom-controls";
  setRect(bottomControls, config.bottomControls);
  bottomControls.style.zIndex = config.bottomControls.zIndex;

  const joystickHint = document.createElement("div");
  joystickHint.className = "joystick-hint";
  setCircle(joystickHint, config.bottomControls.joystickHintX, config.bottomControls.joystickHintY, config.bottomControls.joystickHintRadius);
  joystickHint.style.zIndex = config.bottomControls.zIndex + 1;

  const topBar = document.createElement("div");
  topBar.className = "top-bar";
  setRect(topBar, {
    x: config.uiTopBar.topBarX,
    y: config.uiTopBar.topBarY,
    width: config.uiTopBar.topBarWidth,
    height: config.uiTopBar.topBarHeight
  });
  topBar.style.borderRadius = px(config.playArea.borderRadius);

  const title = document.createElement("button");
  title.className = "hud-title";
  title.dataset.uiControl = "true";
  title.textContent = config.copy.title;
  title.title = config.concept.buttonLabel;
  setPosition(title, config.uiTopBar.titleX, config.uiTopBar.titleY);
  title.style.fontSize = px(config.uiTopBar.titleFontSize);

  const score = document.createElement("div");
  score.className = "hud-label";
  setPosition(score, config.uiTopBar.scoreX, config.uiTopBar.scoreY);
  score.style.fontSize = px(config.uiTopBar.scoreFontSize);

  const bananaCount = document.createElement("div");
  bananaCount.className = "hud-label";
  setPosition(bananaCount, config.uiTopBar.bananaCountX, config.uiTopBar.bananaCountY);
  bananaCount.style.fontSize = px(config.uiTopBar.bananaCountFontSize);
  bananaCount.style.display = "none";

  const hearts = document.createElement("div");
  hearts.className = "hearts";
  setPosition(hearts, config.uiTopBar.heartsX, config.uiTopBar.heartsY);
  hearts.style.fontSize = px(config.uiTopBar.heartSize);
  hearts.style.color = "#cf4d82";
  hearts.style.width = "76px";
  hearts.style.textAlign = "right";

  const sound = document.createElement("button");
  sound.className = "game-button";
  sound.dataset.uiControl = "true";
  setButtonRect(sound, {
    x: config.buttons.soundButtonX,
    y: config.buttons.soundButtonY,
    width: config.buttons.soundButtonWidth,
    height: config.buttons.soundButtonHeight
  }, config);
  sound.addEventListener("click", () => {
    const enabled = audio.toggleMusic();
    state.soundMuted = !enabled;
  });

  const credits = document.createElement("button");
  credits.className = "game-button";
  credits.dataset.uiControl = "true";
  credits.textContent = config.copy.creditsLabel;
  setButtonRect(credits, {
    x: config.buttons.creditsButtonX,
    y: config.buttons.creditsButtonY,
    width: config.buttons.creditsButtonWidth,
    height: config.buttons.creditsButtonHeight
  }, config);

  const restart = document.createElement("button");
  restart.className = "game-button";
  restart.dataset.uiControl = "true";
  restart.textContent = config.copy.restartLabel;
  setButtonRect(restart, {
    x: config.buttons.restartButtonX,
    y: config.buttons.restartButtonY,
    width: config.buttons.restartButtonWidth,
    height: config.buttons.restartButtonHeight
  }, config);
  restart.style.display = "none";

  layer.append(bottomControls, joystickHint, topBar, title, score, bananaCount, hearts, sound, credits, restart);
  elements.bottomControls = bottomControls;
  elements.joystickHint = joystickHint;
  elements.title = title;
  elements.score = score;
  elements.bananaCount = bananaCount;
  elements.hearts = hearts;
  elements.sound = sound;
  elements.credits = credits;
  elements.restart = restart;
}

function createTutorialPrompt(elements, layer, config) {
  if (!config.tutorial.enabled) {
    elements.tutorialPrompt = { style: { display: "none" } };
    return;
  }
  const prompt = document.createElement("div");
  prompt.className = "tutorial-prompt";
  prompt.dataset.uiControl = "true";
  prompt.textContent = config.tutorial.promptText;
  setRect(prompt, {
    x: config.tutorial.promptX - config.tutorial.promptWidth / 2,
    y: config.tutorial.promptY,
    width: config.tutorial.promptWidth
  });
  prompt.style.fontSize = px(config.tutorial.promptFontSize);
  prompt.style.zIndex = config.game.uiZ;
  prompt.style.display = "none";
  layer.append(prompt);
  elements.tutorialPrompt = prompt;
}

function createJoystick(elements, layer, config) {
  const base = document.createElement("div");
  const knob = document.createElement("div");
  base.style.position = "absolute";
  knob.style.position = "absolute";
  base.style.borderRadius = "50%";
  knob.style.borderRadius = "50%";
  base.style.background = "rgba(255, 238, 211, 0.58)";
  base.style.border = "5px solid rgba(53, 36, 31, 0.4)";
  knob.style.background = "rgba(255, 119, 87, 0.88)";
  knob.style.border = "4px solid rgba(53, 36, 31, 0.55)";
  base.style.opacity = config.joystick.opacity;
  knob.style.opacity = config.joystick.opacity;
  base.style.zIndex = config.joystick.zIndex;
  knob.style.zIndex = config.joystick.zIndex + 1;
  base.style.display = "none";
  knob.style.display = "none";
  setCircle(base, 0, 0, config.joystick.baseRadius);
  setCircle(knob, 0, 0, config.joystick.knobRadius);
  layer.append(base, knob);
  elements.joystickBase = base;
  elements.joystickKnob = knob;
}

function createDebugPanel(elements, layer, config) {
  const debug = document.createElement("div");
  debug.className = "debug-panel";
  debug.dataset.uiControl = "true";
  setRect(debug, {
    x: config.debugPanel.x,
    y: config.debugPanel.y,
    width: config.debugPanel.width
  });
  debug.style.fontSize = px(config.debugPanel.fontSize);
  debug.style.zIndex = config.debugPanel.zIndex;
  const close = document.createElement("button");
  close.className = "panel-close";
  close.dataset.uiControl = "true";
  close.textContent = "Hide";
  close.addEventListener("click", () => {
    window.restlessSpiritRuntime.state.debugVisible = false;
    savePanelState(config, window.restlessSpiritRuntime.state);
  });
  const text = document.createElement("pre");
  text.className = "debug-text";
  debug.append(close, text);
  layer.append(debug);
  elements.debug = debug;
  elements.debugText = text;
}

function createTuningPanel(elements, layer, config, audio) {
  const tuning = document.createElement("div");
  tuning.className = "tuning-panel";
  tuning.dataset.uiControl = "true";
  setRect(tuning, {
    x: config.tuningPanel.x,
    y: config.tuningPanel.y,
    width: config.tuningPanel.width
  });
  tuning.style.fontSize = px(config.tuningPanel.fontSize);
  tuning.style.zIndex = config.tuningPanel.zIndex;

  const title = document.createElement("div");
  title.className = "tuning-title";
  title.textContent = "Tuning (T)";
  const close = document.createElement("button");
  close.className = "panel-close";
  close.dataset.uiControl = "true";
  close.textContent = "Hide";
  close.addEventListener("click", () => {
    window.restlessSpiritRuntime.state.tuningVisible = false;
    savePanelState(config, window.restlessSpiritRuntime.state);
  });
  tuning.append(title, close);

  elements.tuningControls = [];
  const roles = config.copy.roleLabels;
  const controls = [
    { section: "Gameplay feel" },
    { label: `${roles.player} speed`, path: "player.speed", min: 180, max: 380, step: 5 },
    { label: `${roles.lead} speed`, path: "bun.speed", min: 180, max: 400, step: 5 },
    { label: "Follower mode", path: "follower.mode", type: "select", options: ["spring", "trail", "dash", "directSmooth"] },
    { label: "Follower catch-up", path: "follower.catchupSpeed", min: 2, max: 18, step: 0.5 },
    { label: "Follow distance", path: "follower.followDistance", min: 24, max: 130, step: 2 },
    { label: "Follower max dist", path: "follower.maxDistance", min: 70, max: 260, step: 5 },
    { label: "Spring strength", path: "follower.springStrength", min: 3, max: 35, step: 1 },
    { label: "Spring damping", path: "follower.damping", min: 0.5, max: 0.98, step: 0.01 },
    { label: "Dash trigger", path: "follower.dashTriggerDistance", min: 60, max: 240, step: 5 },
    { label: "Follower dash speed", path: "follower.dashSpeed", min: 160, max: 620, step: 10 },
    { label: `${roles.chaser} bounce`, path: "gorilla.bounceSpeed", min: 60, max: 240, step: 5 },
    { label: `${roles.chaser} dash speed`, path: "gorilla.dashSpeed", min: 120, max: 380, step: 5 },
    { label: "Dash pause", path: "gorilla.dashPauseMs", min: 300, max: 1800, step: 50 },
    { label: "Dash duration", path: "gorilla.dashDurationMs", min: 180, max: 800, step: 20 },
    { label: "Dash cooldown", path: "gorilla.dashCooldownMs", min: 200, max: 1400, step: 50 },
    { label: `Two ${roles.collectible.toLowerCase()} chance`, path: "banana.twoBananaChanceAfterThreshold", min: 0, max: 1, step: 0.05 },
    { label: "Min from player", path: "banana.minDistanceFromPlayer", min: 40, max: 220, step: 10 },
    { label: `Min from ${roles.collectiblePlural.toLowerCase()}`, path: "banana.minDistanceFromOtherBananas", min: 40, max: 240, step: 10 },
    { label: `Min from ${roles.chaser}`, path: "banana.minDistanceFromGorilla", min: 40, max: 240, step: 10 },
    { label: `${roles.collectible} edge X`, path: "banana.edgeSafeInsetX", min: 40, max: 160, step: 5 },
    { label: `${roles.collectible} edge Y`, path: "banana.edgeSafeInsetY", min: 40, max: 160, step: 5 },
    { label: `${roles.collectible} corner gap`, path: "banana.cornerSafeRadius", min: 80, max: 240, step: 10 },
    { label: `${roles.hazard} chance`, path: "bomb.spawnChance", min: 0, max: 1, step: 0.05 },
    { label: `${roles.hazard} max`, path: "bomb.maxOnScreen", min: 0, max: 4, step: 1 },
    { label: `${roles.hazard} lifetime`, path: "bomb.lifetimeMs", min: 1500, max: 9000, step: 250 },
    { label: `${roles.hazard} respawn`, path: "bomb.respawnDelayMs", min: 0, max: 4000, step: 100 },
    { label: `${roles.hazard} inset X`, path: "bomb.centerSpawnInsetX", min: 40, max: 220, step: 10 },
    { label: `${roles.hazard} inset Y`, path: "bomb.centerSpawnInsetY", min: 40, max: 220, step: 10 },
    { label: `${roles.hazard} edge X`, path: "bomb.edgeSafeInsetX", min: 80, max: 240, step: 10 },
    { label: `${roles.hazard} edge Y`, path: "bomb.edgeSafeInsetY", min: 80, max: 240, step: 10 },
    { label: `${roles.hazard} corner gap`, path: "bomb.cornerSafeRadius", min: 120, max: 320, step: 10 },
    { label: `${roles.hazard} previous gap`, path: "bomb.minDistanceFromPreviousBomb", min: 0, max: 260, step: 10 },
    { label: `${roles.secondChaser} speed`, path: "secondGorilla.speed", min: 40, max: 180, step: 5 },
    { label: `${roles.secondChaser} turn ms`, path: "secondGorilla.wanderTurnMs", min: 400, max: 2600, step: 100 },
    { label: "Combo window", path: "combo.windowMs", min: 1000, max: 6000, step: 250 },
    { label: "Combo bonus", path: "combo.bonusPoints", min: 0, max: 10, step: 1 },
    { label: "Combo starts at", path: "combo.minCountForBonus", min: 2, max: 6, step: 1 },
    { label: "Joystick mode", path: "joystick.mode", type: "select", options: ["auto", "bottom", "left", "right", "rightBottom"] },
    { section: "Controls layout" },
    { label: "Joy hint X", path: "bottomControls.joystickHintX", min: 120, max: 620, step: 5 },
    { label: "Joy hint Y", path: "bottomControls.joystickHintY", min: 610, max: 805, step: 5 },
    { label: "Joy hint size", path: "bottomControls.joystickHintRadius", min: 38, max: 86, step: 2 },
    { label: "Joy zone X", path: "joystick.bottomZoneX", min: 0, max: 360, step: 10 },
    { label: "Joy zone Y", path: "joystick.bottomZoneY", min: 520, max: 740, step: 10 },
    { label: "Joy zone width", path: "joystick.bottomZoneWidth", min: 180, max: 720, step: 10 },
    { label: "Joy zone height", path: "joystick.bottomZoneHeight", min: 90, max: 320, step: 10 },
    { label: `${roles.collectible} sound`, path: "audio.bananaSfxPreset", type: "select", options: ["softChime", "bubblePop", "tinyBell"], preview: "bananaPickup" },
    { label: `${roles.hazard} sound`, path: "audio.bombSfxPreset", type: "select", options: ["softBoom", "cartoonPop", "lowThump"], preview: "bombExplosion" },
    { label: "Music volume", path: "audio.musicVolume", min: 0, max: 1, step: 0.05 },
    { label: "SFX volume", path: "audio.sfxVolume", min: 0, max: 1, step: 0.05 },
    { section: "Artwork testing" },
    { label: "Background mode", path: "art.backgroundMode", type: "select", options: [
      { value: "console", label: "console frame" },
      { value: "fullFrame", label: "full-frame art" },
      { value: "plain", label: "plain color" }
    ] },
    { label: "Console frame", path: "art.consoleFrameEnabled", type: "select", valueType: "boolean", options: [
      { value: true, label: "on" },
      { value: false, label: "off" }
    ] },
    { label: "Full-frame art", path: "art.selectedFullFrameBackground", type: "select", options: config.art.fullFrameBackgrounds.map((background) => ({
      value: background.id,
      label: `${background.id}: ${background.label}`
    })) },
    { label: "Playfield art", path: "art.selectedPlayfieldBackground", type: "select", options: config.art.playfieldBackgrounds.map((background) => ({
      value: background.id,
      label: `${background.id}: ${background.label}`
    })) },
    { label: "Playfield layer", path: "art.playfieldLayerMode", type: "select", options: [
      { value: "auto", label: "auto" },
      { value: "on", label: "show" },
      { value: "off", label: "hide" }
    ] },
    { label: "Hitbox follows art", path: "art.hitboxScaleStrength", min: 0, max: 1, step: 0.05 },
    { label: "Max hitbox scale", path: "art.maxHitboxScale", min: 1, max: 3, step: 0.05 },
    { label: `${roles.player} art scale`, path: "art.characters.bunbun.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.player} art X`, path: "art.characters.bunbun.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.player} art Y`, path: "art.characters.bunbun.offsetY", min: -40, max: 40, step: 1 },
    { label: `${roles.lead} art scale`, path: "art.characters.bun.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.lead} art X`, path: "art.characters.bun.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.lead} art Y`, path: "art.characters.bun.offsetY", min: -40, max: 40, step: 1 },
    { label: `${roles.collectible} art scale`, path: "art.characters.banana.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.collectible} art X`, path: "art.characters.banana.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.collectible} art Y`, path: "art.characters.banana.offsetY", min: -40, max: 40, step: 1 },
    { label: `${roles.hazard} art scale`, path: "art.characters.bomb.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.hazard} art X`, path: "art.characters.bomb.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.hazard} art Y`, path: "art.characters.bomb.offsetY", min: -40, max: 40, step: 1 },
    { label: `${roles.chaser} art scale`, path: "art.characters.gorilla.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.chaser} art X`, path: "art.characters.gorilla.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.chaser} art Y`, path: "art.characters.gorilla.offsetY", min: -40, max: 40, step: 1 },
    { label: `${roles.secondChaser} art scale`, path: "art.characters.g2.scale", min: 0.4, max: 3, step: 0.05 },
    { label: `${roles.secondChaser} art X`, path: "art.characters.g2.offsetX", min: -40, max: 40, step: 1 },
    { label: `${roles.secondChaser} art Y`, path: "art.characters.g2.offsetY", min: -40, max: 40, step: 1 }
  ];

  for (const control of controls) {
    if (control.section) {
      const section = document.createElement("div");
      section.className = "tuning-section";
      section.textContent = control.section;
      tuning.append(section);
      continue;
    }

    const row = document.createElement("label");
    row.className = "tuning-row";

    const label = document.createElement("span");
    label.textContent = control.label;

    const value = document.createElement("output");
    value.textContent = formatControlValue(getConfigValue(config, control.path));
    let field;

    if (control.type === "select") {
      field = document.createElement("select");
      for (const option of control.options) {
        const optionEl = document.createElement("option");
        const optionValue = typeof option === "object" ? option.value : option;
        optionEl.value = String(optionValue);
        optionEl.textContent = typeof option === "object" ? option.label : option;
        field.append(optionEl);
      }
      field.value = String(getConfigValue(config, control.path));
      field.addEventListener("change", () => {
        const nextValue = control.valueType === "boolean" ? field.value === "true" : field.value;
        setConfigValue(config, control.path, nextValue);
        value.textContent = formatControlValue(nextValue);
        if (control.preview) audio.previewSfx(control.preview);
        saveTuning(config, controls);
      });
    } else {
      field = document.createElement("input");
      field.type = "range";
      field.min = control.min;
      field.max = control.max;
      field.step = control.step;
      field.value = getConfigValue(config, control.path);
      field.addEventListener("input", () => {
        const numericValue = Number(field.value);
        setConfigValue(config, control.path, numericValue);
        value.textContent = numericValue;
        if (control.path === "audio.musicVolume") audio.setMusicVolume(numericValue);
        saveTuning(config, controls);
      });
    }
    field.dataset.uiControl = "true";

    row.append(label, value, field);
    tuning.append(row);
    elements.tuningControls.push({ ...control, value, field });
  }

  const note = document.createElement("div");
  note.className = "tuning-note";
  note.textContent = "Values update live. Copy good numbers into src/gameConfig.js.";
  tuning.append(note);

  tuning.style.display = "none";
  layer.append(tuning);
  elements.tuning = tuning;
}

function createTools(elements, layer, config, state, uiApi) {
  const button = document.createElement("button");
  button.className = "tools-button";
  button.dataset.uiControl = "true";
  button.textContent = "Tools";
  setRect(button, config.toolsButton);
  button.style.fontSize = px(config.toolsButton.fontSize);
  button.style.zIndex = config.toolsButton.zIndex;
  if (!config.toolsButton.visible) {
    button.style.display = "none";
    state.toolsVisible = false;
  }
  button.addEventListener("click", () => {
    state.toolsVisible = !state.toolsVisible;
    savePanelState(config, state);
  });

  const panel = document.createElement("div");
  panel.className = "tools-panel";
  panel.dataset.uiControl = "true";
  panel.style.display = "none";
  setRect(panel, {
    x: config.toolsPanel.x,
    y: config.toolsPanel.y,
    width: config.toolsPanel.width
  });
  panel.style.fontSize = px(config.toolsPanel.fontSize);
  panel.style.zIndex = config.toolsPanel.zIndex;

  const tune = makeToolButton("Toggle tuning", () => {
    state.tuningVisible = !state.tuningVisible;
    savePanelState(config, state);
  });
  const debug = makeToolButton("Toggle debug", () => {
    state.debugVisible = !state.debugVisible;
    savePanelState(config, state);
  });
  const sfx = makeToolButton(uiApi.isSfxEnabled() ? "SFX: On" : "SFX: Off", () => {
    const enabled = uiApi.toggleSfx();
    sfx.textContent = enabled ? "SFX: On" : "SFX: Off";
  });
  const bananaTest = makeToolButton(`Test ${config.copy.roleLabels.collectible.toLowerCase()}`, () => {
    uiApi.previewSfx("bananaPickup");
  });
  const bombTest = makeToolButton(`Test ${config.copy.roleLabels.hazard.toLowerCase()}`, () => {
    uiApi.previewSfx("bombExplosion");
  });
  const reset = makeToolButton("Reset tuning", () => {
    uiApi.resetTuningToDefaults();
  });

  panel.append(tune, debug, sfx, bananaTest, bombTest, reset);
  layer.append(button, panel);
  elements.toolsPanel = panel;
}

function resizeLayer(config, root, layer) {
  const rect = root.getBoundingClientRect();
  const scale = Math.min(rect.width / config.game.designWidth, rect.height / config.game.designHeight);
  layer.style.left = px((rect.width - config.game.designWidth * scale) / 2);
  layer.style.top = px((rect.height - config.game.designHeight * scale) / 2);
  layer.style.transform = `scale(${scale})`;
}

function updateJoystickView(elements, joystick, config, state) {
  setCircle(elements.joystickHint, config.bottomControls.joystickHintX, config.bottomControls.joystickHintY, config.bottomControls.joystickHintRadius);
  elements.joystickHint.classList.toggle("joystick-hint--intro", Boolean(elements.startScreen) && !joystick.active);
  elements.joystickHint.style.opacity = joystick.active || state.hideJoystickHint ? "0" : "1";
  elements.joystickBase.style.display = joystick.active ? "block" : "none";
  elements.joystickKnob.style.display = joystick.active ? "block" : "none";
  if (!joystick.active) return;
  setCircle(elements.joystickBase, joystick.baseX, joystick.baseY, config.joystick.baseRadius);
  setCircle(elements.joystickKnob, joystick.knobX, joystick.knobY, config.joystick.knobRadius);
}

function updateStartSpotlight(elements, state, config) {
  if (!elements.startScreen) return;
  const banana = state.bananas[0] || state.banana;
  positionLiftedObject(
    elements.startLeadMirror,
    state.bun.x,
    state.bun.y,
    config.bun.width * config.art.characters.bun.scale,
    config.bun.height * config.art.characters.bun.scale
  );
  positionLiftedObject(
    elements.startBananaMirror,
    banana.x || config.startScreen.bananaX,
    banana.y || config.startScreen.bananaY,
    config.banana.width * config.art.characters.banana.scale,
    config.banana.height * config.art.characters.banana.scale
  );
  elements.startScreen.style.setProperty("--spot-joy-x", px(config.bottomControls.joystickHintX));
  elements.startScreen.style.setProperty("--spot-joy-y", px(config.bottomControls.joystickHintY));
  elements.startScreen.style.setProperty("--spot-joy-r", px(config.bottomControls.joystickHintRadius + 12));
}

function positionLiftedObject(element, centerX, centerY, width, height) {
  if (!element) return;
  element.style.left = px(centerX - width / 2);
  element.style.top = px(centerY - height / 2);
  element.style.width = px(width);
  element.style.height = px(height);
}

function formatDebugText(debugData, state, input, config) {
  const roles = config.copy.roleLabels;
  const gorillaText = state.gorilla.spawned
    ? `${state.gorilla.x.toFixed(1)}, ${state.gorilla.y.toFixed(1)}`
    : "not spawned";
  const bananaText = state.bananas.length > 0
    ? state.bananas.map((banana) => `${banana.x.toFixed(0)},${banana.y.toFixed(0)}`).join(" | ")
    : `${state.banana.x.toFixed(1)}, ${state.banana.y.toFixed(1)}`;
  const direction = input.getDirection();
  const lead = state.bunActive ? state.bun : state.player;
  const leadLabel = state.bunActive ? roles.lead.toLowerCase() : roles.player.toLowerCase();
  const followerDistance = state.followerActive ? Math.hypot(state.bun.x - state.follower.x, state.bun.y - state.follower.y) : 0;
  const g2Text = state.secondGorilla.spawned
    ? `${state.secondGorilla.x.toFixed(1)}, ${state.secondGorilla.y.toFixed(1)}`
    : state.secondGorilla.respawning
      ? `respawning ${Math.max(0, state.secondGorilla.respawnTimerMs).toFixed(0)}ms`
      : "not spawned";
  const comboRemaining = Math.max(0, state.comboTimerMs || 0);

  return [
    `${leadLabel}: ${lead.x.toFixed(1)}, ${lead.y.toFixed(1)}`,
    `follower: ${state.followerActive ? "active" : "hidden"} ${state.follower.x.toFixed(1)}, ${state.follower.y.toFixed(1)}`,
    `follower mode: ${config.follower.mode} d=${followerDistance.toFixed(0)} ${state.follower.dashState}`,
    `${roles.collectiblePlural.toLowerCase()}(${state.bananas.length}/${state.targetBananaCount}): ${bananaText}`,
    `two ${roles.collectible.toLowerCase()} ok: ${state.bananaCount >= config.banana.multiBananaStartsAt}`,
    `${roles.collectible.toLowerCase()} score: ${state.bananaCount >= config.secondGorilla.spawnAtBananas ? config.banana.scoreValueTwoGorillas : config.banana.scoreValueNormal}`,
    `combo: x${state.comboCount} ${comboRemaining.toFixed(0)}ms +${state.lastComboBonus}`,
    `${roles.hazard.toLowerCase()}s: ${state.bombs.length} wait:${Math.max(0, state.bombRespawnTimerMs).toFixed(0)}ms`,
    `${roles.chaser.toLowerCase()}: ${gorillaText}`,
    `${roles.chaser.toLowerCase()} mode: ${state.gorilla.behavior}/${state.gorilla.dashState}`,
    `${roles.chaser.toLowerCase()} respawn: ${state.gorilla.respawning}`,
    `${roles.chaser.toLowerCase()} target: ${state.gorilla.target}`,
    `next dash: ${state.gorilla.nextDashType}`,
    `${roles.secondChaser.toLowerCase()} active: ${state.secondGorilla.spawned}`,
    `${roles.secondChaser.toLowerCase()}: ${g2Text}`,
    `score: ${state.score}`,
    `${roles.collectible.toLowerCase()}Count: ${state.bananaCount}`,
    `hearts: ${state.hearts}`,
    `phase: ${state.phase}`,
    `move: ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)} ${direction.source}`,
    `tutorial: ${state.tutorialActive}`,
    `joystick: ${config.joystick.mode}`,
    `panels T:${state.tuningVisible} D:${state.debugVisible}`,
    `speeds: P${config.player.speed} B${config.bun.speed} D${config.gorilla.dashSpeed}`,
    `dash ms: ${config.gorilla.dashPauseMs}/${config.gorilla.dashDurationMs}/${config.gorilla.dashCooldownMs}`,
    `fps: ${debugData.fps.toFixed(0)}`
  ].join("\n");
}

function createAudioController(config) {
  const savedMusicPreference = localStorage.getItem(config.audio.storageKey);
  const savedSfxPreference = localStorage.getItem(config.audio.sfxStorageKey);
  let musicEnabled = savedMusicPreference === null ? true : savedMusicPreference === "true";
  let sfxEnabled = savedSfxPreference === null ? config.audio.sfxEnabled : savedSfxPreference === "true";
  let started = false;
  let interactionUnlocked = false;
  let audioPrimed = false;
  let loopTimer = null;
  let startTimer = null;
  let audioContext = null;
  const audio = new Audio(config.audio.musicPath);
  audio.volume = config.audio.musicVolume;
  audio.preload = "auto";
  audio.playsInline = true;
  audio.load();

  audio.addEventListener("ended", () => {
    if (!musicEnabled || !started) return;
    window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(() => {
      if (musicEnabled && started) play();
    }, config.audio.loopGapMs);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    window.clearTimeout(startTimer);
    if (!audio.paused) {
      window.clearTimeout(loopTimer);
      audio.pause();
      started = false;
      audioPrimed = false;
    }
  });

  function play() {
    audio.volume = config.audio.musicVolume;
    audio.muted = false;
    audio.play().catch(() => {
      started = false;
    });
  }

  function prepareFromGesture() {
    interactionUnlocked = true;
    unlockAudioContext();
    if (audioPrimed || started || !musicEnabled || !config.audio.startOnFirstMovement) return;
    audioPrimed = true;

    audio.muted = true;
    audio.volume = 0;
    const prime = audio.play();
    if (prime?.then) {
      prime.catch(() => {
        if (!started) {
          audioPrimed = false;
          audio.muted = false;
          audio.volume = config.audio.musicVolume;
        }
      });
    }
  }

  function startFromMovement() {
    interactionUnlocked = true;
    unlockAudioContext();
    if (!musicEnabled || started || !config.audio.startOnFirstMovement) return;
    started = true;
    window.clearTimeout(startTimer);
    window.clearTimeout(loopTimer);
    audio.pause();
    audio.currentTime = 0;
    audioPrimed = false;
    startTimer = window.setTimeout(() => {
      if (musicEnabled && started) play();
    }, config.audio.startDelayMs || 0);
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem(config.audio.storageKey, String(musicEnabled));
    if (!musicEnabled) {
      window.clearTimeout(startTimer);
      window.clearTimeout(loopTimer);
      audio.pause();
      audio.currentTime = 0;
      started = false;
      audioPrimed = false;
      audio.muted = false;
      audio.volume = config.audio.musicVolume;
    } else if (started) {
      play();
    }
    return musicEnabled;
  }

  function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem(config.audio.sfxStorageKey, String(sfxEnabled));
    return sfxEnabled;
  }

  function setMusicVolume(volume) {
    audio.volume = volume;
  }

  function playSfx(name) {
    if (!sfxEnabled || !interactionUnlocked) return;
    playGeneratedSfx(name);
  }

  function previewSfx(name) {
    interactionUnlocked = true;
    playGeneratedSfx(name);
  }

  function playGeneratedSfx(name) {
    const sfx = config.sfx[name];
    if (!sfx) return;
    const presetName = name === "bananaPickup" ? config.audio.bananaSfxPreset : config.audio.bombSfxPreset;
    const preset = sfx.presets?.[presetName];
    if (!preset) return;
    const context = unlockAudioContext();
    if (!context) return;

    const now = context.currentTime;
    for (const note of preset.notes || []) {
      const start = now + (note.delayMs || 0) / 1000;
      const duration = note.durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, start);
      if (note.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, config.audio.sfxVolume * note.volume), start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    if (preset.noise) {
      playNoise(context, now, preset.noise, config.audio.sfxVolume);
    }
  }

  function playNoise(context, start, noise, masterVolume) {
    const duration = noise.durationMs / 1000;
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(0.0001, masterVolume * noise.volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(start);
    source.stop(start + duration);
  }

  function unlockAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function resetToConfig() {
    audio.volume = config.audio.musicVolume;
  }

  return {
    prepareFromGesture,
    startFromMovement,
    toggleMusic,
    toggleSfx,
    playSfx,
    previewSfx,
    setMusicVolume,
    resetToConfig,
    get musicEnabled() {
      return musicEnabled;
    },
    get sfxEnabled() {
      return sfxEnabled;
    },
    get started() {
      return started;
    }
  };
}

function updateTuningValues(elements, config) {
  if (!elements.tuningControls) return;

  for (const control of elements.tuningControls) {
    const value = getConfigValue(config, control.path);
    if (control.field.tagName === "SELECT") {
      control.field.value = String(value);
    } else if (Number(control.field.value) !== value) {
      control.field.value = value;
    }
    control.value.textContent = formatControlValue(value);
  }
}

function updatePageBackdrop(config) {
  const selected = config.art.fullFrameBackgrounds.find((background) => (
    String(background.id) === String(config.art.selectedFullFrameBackground)
  ));
  const path = config.art.backgroundMode === "fullFrame" && selected ? selected.path : "";
  document.body.style.setProperty("--page-backdrop-image", path ? `url("${path}")` : "none");
  document.body.style.setProperty("--game-frame-image", path ? `url("${path}")` : "none");
  document.body.classList.toggle("has-game-backdrop", Boolean(path));
}

function applySavedTuning(config) {
  try {
    const saved = JSON.parse(localStorage.getItem(config.tuningPanel.localStorageKey) || "{}");
    for (const [path, value] of Object.entries(saved)) {
      setConfigValue(config, path, value);
    }
  } catch {
    localStorage.removeItem(config.tuningPanel.localStorageKey);
  }
}

function saveTuning(config, controls) {
  const values = {};
  for (const control of controls) {
    if (!control.path) continue;
    values[control.path] = getConfigValue(config, control.path);
  }
  localStorage.setItem(config.tuningPanel.localStorageKey, JSON.stringify(values));
}

function applySavedPanelState(config, state) {
  try {
    const saved = JSON.parse(localStorage.getItem(config.toolsPanel.localStorageKey) || "{}");
    state.tuningVisible = Boolean(saved.tuningVisible);
    state.debugVisible = saved.debugVisible ?? state.debugVisible;
    state.toolsVisible = Boolean(saved.toolsVisible);
    if (config.toolsButton?.visible === false) {
      state.tuningVisible = false;
      state.toolsVisible = false;
    }
  } catch {
    localStorage.removeItem(config.toolsPanel.localStorageKey);
  }
}

function savePanelState(config, state) {
  localStorage.setItem(config.toolsPanel.localStorageKey, JSON.stringify({
    tuningVisible: state.tuningVisible,
    debugVisible: state.debugVisible,
    toolsVisible: state.toolsVisible
  }));
}

function copyConfigValues(source, target) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, structuredClone(source));
}

function makeToolButton(label, onClick) {
  const button = document.createElement("button");
  button.className = "tool-menu-button";
  button.dataset.uiControl = "true";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function getConfigValue(config, path) {
  return path.split(".").reduce((current, key) => current[key], config);
}

function setConfigValue(config, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const parent = keys.reduce((current, key) => current[key], config);
  parent[lastKey] = value;
}

function formatControlValue(value) {
  if (typeof value === "boolean") return value ? "on" : "off";
  return value;
}

function setRect(element, rect) {
  element.style.left = px(rect.x);
  element.style.top = px(rect.y);
  if (rect.width !== undefined) element.style.width = px(rect.width);
  if (rect.height !== undefined) element.style.height = px(rect.height);
}

function setButtonRect(element, rect, config) {
  setRect(element, rect);
  element.style.borderRadius = px(config.buttons.buttonBorderRadius);
  element.style.fontSize = px(config.buttons.buttonFontSize);
}

function setPosition(element, x, y) {
  element.style.left = px(x);
  element.style.top = px(y);
  element.style.transform = "translateY(-50%)";
}

function setCenteredText(element, x, y, width, fontSize) {
  element.style.left = px(x);
  element.style.top = px(y);
  element.style.width = px(width);
  element.style.transform = "translate(-50%, -50%)";
  element.style.fontSize = px(fontSize);
}

function setCircle(element, centerX, centerY, radius) {
  element.style.left = px(centerX - radius);
  element.style.top = px(centerY - radius);
  element.style.width = px(radius * 2);
  element.style.height = px(radius * 2);
}

function px(value) {
  return `${value}px`;
}
