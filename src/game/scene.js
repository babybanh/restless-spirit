import Phaser from "phaser";
import { resetState, updatePhase } from "./state.js";

export class RestlessSpiritScene extends Phaser.Scene {
  constructor() {
    super("RestlessSpiritScene");
  }

  preload() {
    const config = globalThis.restlessSpiritRuntime.config;
    const selectedFullFrame = config.art.fullFrameBackgrounds.find((background) => (
      String(background.id) === String(config.art.selectedFullFrameBackground)
    ));
    const selectedPlayfield = config.art.playfieldBackgrounds.find((background) => (
      String(background.id) === String(config.art.selectedPlayfieldBackground)
    ));

    // Load the intro-critical pieces first so the initial blur/tutorial state appears cleanly.
    if (selectedFullFrame) this.load.image(`full-frame-${selectedFullFrame.id}`, selectedFullFrame.path);
    this.load.image("character-bunbun", config.art.characters.bunbun.path);
    this.load.image("character-banana", config.art.characters.banana.path);
    if (selectedPlayfield) this.load.image(`playfield-${selectedPlayfield.id}`, selectedPlayfield.path);

    if (config.art.consoleFramePath) this.load.image("console-frame", config.art.consoleFramePath);
    for (const background of config.art.fullFrameBackgrounds) {
      if (!selectedFullFrame || String(background.id) !== String(selectedFullFrame.id)) {
        this.load.image(`full-frame-${background.id}`, background.path);
      }
    }
    for (const background of config.art.playfieldBackgrounds) {
      if (!selectedPlayfield || String(background.id) !== String(selectedPlayfield.id)) {
        this.load.image(`playfield-${background.id}`, background.path);
      }
    }
    for (const [name, art] of Object.entries(config.art.characters)) {
      if (name !== "bunbun" && name !== "banana") {
        this.load.image(`character-${name}`, art.path);
      }
    }
  }

  create() {
    const runtime = globalThis.restlessSpiritRuntime;
    this.configData = runtime.config;
    this.state = runtime.state;
    this.inputController = runtime.input;
    this.ui = runtime.ui;
    this.hasStartedOnce = false;

    this.applySmoothTextureFilters();
    this.createWorld();
    this.createCharacters();
    this.connectUi();
    this.resetGameToStart();
    this.updateWorldArt();
    this.syncSprites();
    this.ui.update({ fps: 0 });
    this.finishLoadingWhenIntroReady();
  }

  async finishLoadingWhenIntroReady() {
    await waitForIntroImages();
    await nextPaint();
    await nextPaint();
    document.body.classList.remove("is-loading");
    document.querySelector("#loading-screen")?.remove();
  }

  applySmoothTextureFilters() {
    const textureKeys = [
      `full-frame-${this.configData.art.selectedFullFrameBackground}`,
      ...Object.keys(this.configData.art.characters).map((name) => `character-${name}`)
    ];
    for (const key of textureKeys) {
      const texture = this.textures.get(key);
      if (texture?.setFilter) {
        texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  update(time, deltaMs) {
    if (this.inputController.debugToggleRequested) {
      this.state.debugVisible = !this.state.debugVisible;
      this.inputController.debugToggleRequested = false;
      this.ui.savePanelState();
    }

    if (this.inputController.tuningToggleRequested) {
      this.state.tuningVisible = !this.state.tuningVisible;
      this.inputController.tuningToggleRequested = false;
      this.ui.savePanelState();
    }

    if (this.state.status === "playing") {
      this.updatePlayer(deltaMs);
      this.updateComboTimer(deltaMs);
      this.updateBanana(deltaMs);
      this.updateBombs(deltaMs);
      this.updateGorilla(deltaMs);
      this.updateSecondGorilla(deltaMs);
      this.updateHitVisual(time);
    }

    this.updateWorldArt();
    this.syncSprites();
    this.ui.update({ fps: this.game.loop.actualFps });
  }

  createWorld() {
    const config = this.configData;
    const playArea = config.playArea;

    this.add.rectangle(
      config.game.designWidth / 2,
      config.game.designHeight / 2,
      config.game.designWidth,
      config.game.designHeight,
      0x08112e
    ).setDepth(config.game.backgroundZ);

    this.consoleFrame = this.add.image(
      config.game.designWidth / 2,
      config.game.designHeight / 2,
      `full-frame-${config.art.selectedFullFrameBackground}`
    )
      .setDisplaySize(config.game.designWidth, config.game.designHeight)
      .setVisible(false)
      .setDepth(config.game.backgroundZ + 0.1);

    this.fullFrameBackground = this.add.image(
      config.game.designWidth / 2,
      config.game.designHeight / 2,
      `full-frame-${config.art.selectedFullFrameBackground}`
    )
      .setDisplaySize(config.game.designWidth, config.game.designHeight)
      .setDepth(config.game.backgroundZ + 0.05);

    this.playAreaFallback = this.add.graphics().setDepth(config.game.playAreaZ);
    this.playAreaFallback.fillStyle(0xf4efff, 1);
    this.playAreaFallback.fillRoundedRect(playArea.x, playArea.y, playArea.width, playArea.height, playArea.borderRadius);

    this.playfieldBackground = this.add.image(
      playArea.x + playArea.width / 2,
      playArea.y + playArea.height / 2,
      `full-frame-${config.art.selectedFullFrameBackground}`
    )
      .setDisplaySize(playArea.width, playArea.height)
      .setVisible(false)
      .setDepth(config.game.playAreaZ + 0.1);

    this.playAreaMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    this.playAreaMaskShape.fillStyle(0xffffff, 1);
    this.playAreaMaskShape.fillRoundedRect(playArea.x, playArea.y, playArea.width, playArea.height, playArea.borderRadius);
    this.playfieldBackground.setMask(this.playAreaMaskShape.createGeometryMask());

    this.playAreaBorder = this.add.graphics().setDepth(config.game.playAreaZ + 0.2);
    this.playAreaBorder.lineStyle(4, 0xc7b7ff, 0.88);
    this.playAreaBorder.strokeRoundedRect(playArea.x, playArea.y, playArea.width, playArea.height, playArea.borderRadius);
    this.currentPlayfieldBackground = "";
    this.currentFullFrameBackground = "";
    this.updateWorldArt();
  }

  createCharacters() {
    const config = this.configData;

    this.bananaSprites = [];
    this.banana = this.createBananaSprite();
    this.bombSprites = [];

    this.player = this.createArtContainer("character-bunbun", "bunbun", [
      this.add.ellipse(0, 5, config.player.width, config.player.height, 0xf2bf73).setStrokeStyle(4, 0x101936),
      this.add.ellipse(-14, -28, 16, 34, 0xf2bf73).setStrokeStyle(3, 0x101936),
      this.add.ellipse(14, -28, 16, 34, 0xf2bf73).setStrokeStyle(3, 0x101936),
      this.add.text(0, 8, config.copy.roleLabels.player, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#101936"
      }).setOrigin(0.5)
    ]).setDepth(config.player.zIndex);
    this.player.setRotation(Phaser.Math.DegToRad(config.player.rotation));

    this.bun = this.createArtContainer("character-bun", "bun", [
      this.add.ellipse(0, 5, config.bun.width, config.bun.height, 0xf7f2ff).setStrokeStyle(4, 0x101936),
      this.add.ellipse(-14, -28, 16, 34, 0xf7f2ff).setStrokeStyle(3, 0x101936),
      this.add.ellipse(14, -28, 16, 34, 0xf7f2ff).setStrokeStyle(3, 0x101936),
      this.add.circle(0, -5, 9, 0xc7b7ff).setStrokeStyle(2, 0x101936),
      this.add.text(0, 13, config.copy.roleLabels.lead, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#101936"
      }).setOrigin(0.5)
    ]).setDepth(config.bun.zIndex);
    this.bun.setRotation(Phaser.Math.DegToRad(config.bun.rotation));
    this.bun.setVisible(false);

    this.gorilla = this.createArtContainer("character-gorilla", "gorilla", [
      this.add.ellipse(0, 0, config.gorilla.width, config.gorilla.height, 0x7298b7).setStrokeStyle(4, 0x284e63),
      this.add.text(0, 2, config.copy.roleLabels.chaser, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fff3cf"
      }).setOrigin(0.5)
    ]).setDepth(config.gorilla.zIndex);
    this.gorilla.setRotation(Phaser.Math.DegToRad(config.gorilla.rotation));
    this.gorilla.setVisible(false);

    this.secondGorilla = this.createArtContainer("character-g2", "g2", [
      this.add.ellipse(0, 0, config.secondGorilla.width, config.secondGorilla.height, 0x7a9b48).setStrokeStyle(4, 0x354b23),
      this.add.text(0, 2, config.copy.roleLabels.secondChaser, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#fff3cf"
      }).setOrigin(0.5)
    ]).setDepth(config.secondGorilla.zIndex);
    this.secondGorilla.setVisible(false);
  }

  connectUi() {
    this.ui.onStart = (playMode = this.configData.controls.defaultPlayMode) => {
      this.startGame(playMode);
    };

    this.ui.onRestart = () => {
      this.startGame();
    };
  }

  resetGameToStart() {
    if (!this.configData.flow.startScreenEnabled) {
      this.startGame();
      return;
    }
    this.configData.controls.playMode = this.configData.controls.defaultPlayMode;
    if (this.configData.controls.playMode === "touchscreen") {
      this.configData.joystick.mode = this.configData.joystick.touchscreenDefaultMode;
    }
    resetState(this.state, this.configData);
    this.inputController.resetMovement();
    this.spawnAllBananas();
    this.gorilla.setVisible(false);
    this.secondGorilla.setVisible(false);
    this.bun.setVisible(true);
    this.player.setVisible(false);
    this.player.setScale(1);
    this.player.setAlpha(1);
    this.ui.hideGameOver();
    this.syncSprites();
    this.ui.showStartScreen();
  }

  startGame(playMode = this.configData.controls.playMode) {
    this.configData.controls.playMode = playMode;
    this.state.introActive = false;
    if (playMode === "touchscreen") {
      this.configData.joystick.mode = this.configData.joystick.touchscreenDefaultMode;
    }
    resetState(this.state, this.configData);
    this.inputController.resetMovement();
    this.spawnAllBananas();
    this.gorilla.setVisible(false);
    this.secondGorilla.setVisible(false);
    this.bun.setVisible(true);
    this.player.setVisible(false);
    this.player.setScale(1);
    this.player.setAlpha(1);
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    if (this.hasStartedOnce) {
      this.playSfx("restart");
    }
    this.hasStartedOnce = true;
  }

  updatePlayer(deltaMs) {
    const config = this.configData;
    const seconds = deltaMs / 1000;
    const direction = this.inputController.getDirection();
    if (direction.source === "keyboard" && (Math.abs(direction.x) > 0.01 || Math.abs(direction.y) > 0.01)) {
      this.state.hideJoystickHint = true;
      this.state.joystickHintReturnMs = 1200;
    } else if (this.state.hideJoystickHint) {
      this.state.joystickHintReturnMs = Math.max(0, this.state.joystickHintReturnMs - deltaMs);
      if (this.state.joystickHintReturnMs <= 0) this.state.hideJoystickHint = false;
    }
    if ((Math.abs(direction.x) > 0.01 || Math.abs(direction.y) > 0.01) && this.ui.startMusicFromMovement) {
      this.ui.startMusicFromMovement();
      this.ui.hideStartScreen();
      this.state.introActive = false;
    }
    const lead = this.getLeadCharacter();
    const leadConfig = this.getLeadConfig();
    const leadSize = this.getVisibleSize(leadConfig, this.getLeadArtName());

    lead.x += direction.x * leadConfig.speed * seconds;
    lead.y += direction.y * leadConfig.speed * seconds;

    lead.x = clampToPlayArea(
      lead.x,
      config.playArea.x + leadSize.width / 2,
      config.playArea.x + config.playArea.width - leadSize.width / 2
    );
    lead.y = clampToPlayArea(
      lead.y,
      config.playArea.y + leadSize.height / 2,
      config.playArea.y + config.playArea.height - leadSize.height / 2
    );

    lead.trail.unshift({ x: lead.x, y: lead.y });
    lead.trail.length = Math.min(lead.trail.length, config.player.followerTrailMax);

    if (this.state.followerActive) {
      this.updateFollower(deltaMs);
    } else {
      const restingPoint = this.pointBehindBun(config.follower.minDistance);
      this.state.follower.x = restingPoint.x;
      this.state.follower.y = restingPoint.y;
      this.state.player.x = restingPoint.x;
      this.state.player.y = restingPoint.y;
      this.state.follower.velocityX = 0;
      this.state.follower.velocityY = 0;
    }
  }

  updateBanana(deltaMs) {
    const config = this.configData;
    const collector = this.getLeadCharacter();
    const collectorConfig = this.getLeadConfig();
    const collectorHitbox = this.getHitbox(collectorConfig, this.getLeadArtName());
    const bananaHitbox = this.getHitbox(config.banana, "banana");
    this.ensureBananaCount();

    for (let index = 0; index < this.state.bananas.length; index += 1) {
      const banana = this.state.bananas[index];
      banana.ageMs = (banana.ageMs || 0) + deltaMs;

      if (!boxesOverlap(
        collector,
        collectorHitbox.width,
        collectorHitbox.height,
        banana,
        bananaHitbox.width,
        bananaHitbox.height
      )) {
        continue;
      }

      const comboBonus = this.updateComboOnBananaCollect();
      this.state.score += this.currentBananaScore() + comboBonus;
      this.state.bananaCount += 1;
      this.playSfx("bananaPickup");
      if (comboBonus > 0) {
        this.playSfx("comboBonus");
        this.showComboPopup(`Combo x${this.state.comboCount}! +${comboBonus}`);
      }
      if (this.state.tutorialActive && this.configData.tutorial.completeAfterFirstBanana) {
        this.state.tutorialActive = false;
        this.state.tutorialComplete = true;
      }
      updatePhase(this.state, config);
      this.recalculateTargetBananaCount();

      if (!this.state.gorilla.spawned && this.state.bananaCount >= config.phases.gorillaAppears) {
        this.spawnGorilla();
      }

      if (!this.state.followerActive && this.state.bananaCount >= config.phases.bunAppears) {
        this.activateFollower();
        updatePhase(this.state, config);
      }

      if (!this.state.secondGorilla.spawned && this.state.bananaCount >= config.secondGorilla.spawnAtBananas) {
        this.spawnSecondGorilla();
        updatePhase(this.state, config);
      }

      this.maybeSpawnBomb();

      if (this.state.bananas.length > this.state.targetBananaCount) {
        this.state.bananas.splice(index, 1);
        this.state.bananas.length = this.state.targetBananaCount;
        this.syncPrimaryBanana();
      } else {
        this.spawnBananaAt(index);
      }
      break;
    }
  }

  updateGorilla(deltaMs) {
    if (this.state.gorilla.respawning) {
      this.state.gorilla.respawnTimerMs -= deltaMs;
      if (this.state.gorilla.respawnTimerMs <= 0) this.respawnAidan();
      return;
    }
    if (!this.state.gorilla.spawned) return;

    const config = this.configData;
    const seconds = deltaMs / 1000;
    const gorilla = this.state.gorilla;
    const playArea = config.playArea;

    if (gorilla.behavior === "dash") {
      this.updateGorillaDash(deltaMs);
    } else {
      const speed = Math.hypot(gorilla.velocityX, gorilla.velocityY) || 1;
      gorilla.velocityX = (gorilla.velocityX / speed) * config.gorilla.bounceSpeed;
      gorilla.velocityY = (gorilla.velocityY / speed) * config.gorilla.bounceSpeed;
      gorilla.x += gorilla.velocityX * seconds;
      gorilla.y += gorilla.velocityY * seconds;
    }

    const gorillaSize = this.getVisibleSize(config.gorilla, "gorilla");
    const minX = playArea.x + gorillaSize.width / 2;
    const maxX = playArea.x + playArea.width - gorillaSize.width / 2;
    const minY = playArea.y + gorillaSize.height / 2;
    const maxY = playArea.y + playArea.height - gorillaSize.height / 2;

    if (gorilla.x <= minX || gorilla.x >= maxX) {
      gorilla.x = clampToPlayArea(gorilla.x, minX, maxX);
      gorilla.velocityX *= gorilla.behavior === "dash" ? -config.gorilla.dashWallBounce : -1;
    }

    if (gorilla.y <= minY || gorilla.y >= maxY) {
      gorilla.y = clampToPlayArea(gorilla.y, minY, maxY);
      gorilla.velocityY *= gorilla.behavior === "dash" ? -config.gorilla.dashWallBounce : -1;
    }

    const now = this.time.now;
    if (now >= this.state.invincibleUntil && this.gorillaTouchesProtectedBunny()) {
      this.damagePlayer(now);
    }
  }

  updateSecondGorilla(deltaMs) {
    if (this.state.secondGorilla.respawning) {
      this.state.secondGorilla.respawnTimerMs -= deltaMs;
      if (this.state.secondGorilla.respawnTimerMs <= 0) this.respawnSecondGorilla();
      return;
    }
    if (!this.state.secondGorilla.spawned) return;

    const config = this.configData;
    const g2 = this.state.secondGorilla;
    const seconds = deltaMs / 1000;
    const speed = Math.hypot(g2.velocityX, g2.velocityY) || 1;
    g2.velocityX = (g2.velocityX / speed) * config.secondGorilla.speed;
    g2.velocityY = (g2.velocityY / speed) * config.secondGorilla.speed;
    g2.x += g2.velocityX * seconds;
    g2.y += g2.velocityY * seconds;

    const playArea = config.playArea;
    const g2Size = this.getVisibleSize(config.secondGorilla, "g2");
    const minX = playArea.x + g2Size.width / 2;
    const maxX = playArea.x + playArea.width - g2Size.width / 2;
    const minY = playArea.y + g2Size.height / 2;
    const maxY = playArea.y + playArea.height - g2Size.height / 2;

    if (g2.x <= minX || g2.x >= maxX) {
      g2.x = clampToPlayArea(g2.x, minX, maxX);
      g2.velocityX *= -1;
    }
    if (g2.y <= minY || g2.y >= maxY) {
      g2.y = clampToPlayArea(g2.y, minY, maxY);
      g2.velocityY *= -1;
    }

    const now = this.time.now;
    if (
      now >= this.state.invincibleUntil &&
      this.protectedBunnyTouches(g2, ...this.getHitboxValues(config.secondGorilla, "g2"))
    ) {
      this.damagePlayer(now, config.secondGorilla.damage);
    }
  }

  updateHitVisual(time) {
    const isInvincible = time < this.state.invincibleUntil;
    this.player.setAlpha(isInvincible ? 0.55 : 1);
    this.bun.setAlpha(isInvincible ? 0.55 : 1);
    this.gorilla.setAlpha(this.state.gorilla.respawning ? 0 : 1);
    this.secondGorilla.setAlpha(this.state.secondGorilla.respawning ? 0 : isInvincible ? 0.75 : 1);
  }

  updateWorldArt() {
    const config = this.configData;
    const selectedId = String(config.art.selectedPlayfieldBackground);
    const selectedFullFrameId = String(config.art.selectedFullFrameBackground);
    const textureKey = `playfield-${selectedId}`;
    const fullFrameTextureKey = `full-frame-${selectedFullFrameId}`;
    const hasPlayfieldTexture = this.textures.exists(textureKey);
    const hasFullFrameTexture = this.textures.exists(fullFrameTextureKey);
    const backgroundMode = config.art.backgroundMode;
    const playfieldLayerVisible = config.art.playfieldLayerMode === "on" ||
      (config.art.playfieldLayerMode === "auto" && backgroundMode !== "fullFrame");

    this.consoleFrame.setVisible(Boolean(
      backgroundMode === "console" &&
      config.art.consoleFrameEnabled &&
      this.textures.exists("console-frame")
    ));
    if (hasFullFrameTexture && this.currentFullFrameBackground !== selectedFullFrameId) {
      this.fullFrameBackground.setTexture(fullFrameTextureKey);
      this.currentFullFrameBackground = selectedFullFrameId;
    }
    this.fullFrameBackground.setVisible(Boolean(backgroundMode === "fullFrame" && hasFullFrameTexture));
    this.playAreaFallback.setVisible(Boolean(playfieldLayerVisible && !hasPlayfieldTexture));

    if (hasPlayfieldTexture && this.currentPlayfieldBackground !== selectedId) {
      this.playfieldBackground.setTexture(textureKey);
      this.currentPlayfieldBackground = selectedId;
    }
    this.playfieldBackground.setVisible(Boolean(playfieldLayerVisible && hasPlayfieldTexture));
    this.playAreaBorder.setVisible(Boolean(playfieldLayerVisible));
  }

  createArtContainer(textureKey, artName, fallbackChildren) {
    const container = this.add.container(0, 0);
    container.artName = artName;
    if (this.textures.exists(textureKey)) {
      container.assetImage = this.add.image(0, 0, textureKey).setOrigin(0.5);
      container.add(container.assetImage);
    } else {
      container.add(fallbackChildren);
    }
    return container;
  }

  applyContainerArt(container, width, height) {
    if (!container.assetImage) return;
    const art = this.configData.art.characters[container.artName];
    container.assetImage.setPosition(art.offsetX, art.offsetY);
    container.assetImage.setDisplaySize(width * art.scale, height * art.scale);
  }

  createBananaSprite() {
    const config = this.configData;
    const banana = this.createArtContainer("character-banana", "banana", [
      this.add.ellipse(0, 0, config.banana.width, config.banana.height, 0xffd83d),
      this.add.text(0, 1, config.copy.roleLabels.collectible, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#6c461d"
      }).setOrigin(0.5)
    ]).setDepth(config.banana.zIndex);
    banana.setRotation(Phaser.Math.DegToRad(config.banana.rotation));
    this.bananaSprites.push(banana);
    return banana;
  }

  spawnAllBananas() {
    this.state.bananas = [];
    this.recalculateTargetBananaCount();
    const total = this.state.targetBananaCount;
    for (let index = 0; index < total; index += 1) {
      this.state.bananas.push(this.findBananaSpawn(index));
    }
    this.syncPrimaryBanana();
  }

  ensureBananaCount() {
    const wanted = this.state.targetBananaCount || this.configData.banana.maxOnScreenEarly;
    while (this.state.bananas.length < wanted) {
      this.state.bananas.push(this.findBananaSpawn(this.state.bananas.length));
    }
    if (this.state.bananas.length > wanted) {
      this.state.bananas.length = wanted;
    }
    this.syncPrimaryBanana();
  }

  recalculateTargetBananaCount() {
    const config = this.configData;
    if (this.state.bananaCount < config.banana.multiBananaStartsAt) {
      this.state.targetBananaCount = config.banana.maxOnScreenEarly;
      return;
    }
    const wantsTwo = Math.random() < config.banana.twoBananaChanceAfterThreshold;
    this.state.targetBananaCount = wantsTwo ? config.banana.maxOnScreenLater : config.banana.maxOnScreenEarly;
  }

  spawnBananaAt(index) {
    this.state.bananas[index] = this.findBananaSpawn(index);
    this.syncPrimaryBanana();
  }

  findBananaSpawn(replacingIndex) {
    const config = this.configData;
    const playArea = config.playArea;
    const marginX = Math.max(playArea.spawnMargin, config.banana.edgeSafeInsetX || 0);
    const marginY = Math.max(playArea.spawnMargin, config.banana.edgeSafeInsetY || 0);
    const fallback = {
      x: playArea.x + playArea.width / 2,
      y: playArea.y + playArea.height / 2,
      ageMs: 0
    };
    const centerSpawn = this.state.bananaCount < config.banana.centerSpawnForFirstBananas;
    const spawnBounds = centerSpawn
      ? {
          minX: playArea.x + playArea.width / 2 - config.banana.centerSpawnWidth / 2,
          maxX: playArea.x + playArea.width / 2 + config.banana.centerSpawnWidth / 2,
          minY: playArea.y + playArea.height / 2 - config.banana.centerSpawnHeight / 2,
          maxY: playArea.y + playArea.height / 2 + config.banana.centerSpawnHeight / 2
        }
      : {
          minX: playArea.x + marginX,
          maxX: playArea.x + playArea.width - marginX,
          minY: playArea.y + marginY,
          maxY: playArea.y + playArea.height - marginY
        };

    for (let attempt = 0; attempt < config.banana.spawnAttempts; attempt += 1) {
      const candidate = {
        x: Phaser.Math.Between(spawnBounds.minX, spawnBounds.maxX),
        y: Phaser.Math.Between(spawnBounds.minY, spawnBounds.maxY),
        ageMs: 0
      };
      if (this.isValidBananaPosition(candidate, replacingIndex)) {
        return candidate;
      }
    }

    return fallback;
  }

  isValidBananaPosition(candidate, replacingIndex) {
    const config = this.configData;
    const lead = this.getLeadCharacter();

    if (isTooCloseToPlayAreaCorner(candidate, config.playArea, config.banana.cornerSafeRadius)) return false;

    if (distanceBetween(candidate, lead) < config.banana.minDistanceFromPlayer) return false;

    if (this.state.followerActive && distanceBetween(candidate, this.state.follower) < config.banana.minDistanceFromPlayer) {
      return false;
    }

    if (
      this.state.gorilla.spawned &&
      distanceBetween(candidate, this.state.gorilla) < config.banana.minDistanceFromGorilla
    ) {
      return false;
    }

    if (
      this.state.secondGorilla.spawned &&
      distanceBetween(candidate, this.state.secondGorilla) < config.banana.minDistanceFromGorilla
    ) {
      return false;
    }

    if (this.state.bombs.some((bomb) => distanceBetween(candidate, bomb) < config.banana.minDistanceFromBomb)) {
      return false;
    }

    return this.state.bananas.every((banana, index) => {
      if (index === replacingIndex) return true;
      return distanceBetween(candidate, banana) >= config.banana.minDistanceFromOtherBananas;
    });
  }

  syncPrimaryBanana() {
    const firstBanana = this.state.bananas[0] || { x: 0, y: 0 };
    this.state.banana.x = firstBanana.x;
    this.state.banana.y = firstBanana.y;
  }

  createBombSprite() {
    const config = this.configData;
    const bomb = this.createArtContainer("character-bomb", "bomb", [
      this.add.ellipse(0, 0, config.bomb.width, config.bomb.height, 0x2f2f38).setStrokeStyle(4, 0x101018),
      this.add.text(0, 1, config.copy.roleLabels.hazard, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#fff3cf"
      }).setOrigin(0.5)
    ]).setDepth(config.bomb.zIndex);
    this.bombSprites.push(bomb);
    return bomb;
  }

  maybeSpawnBomb() {
    const config = this.configData;
    if (this.state.bananaCount < config.bomb.startsAtBananas) return;
    if (this.state.bombs.length >= config.bomb.maxOnScreen) return;
    if (this.state.bombRespawnTimerMs > 0) return;
    if (Math.random() > config.bomb.spawnChance) return;
    this.state.bombs.push(this.findBombSpawn());
  }

  findBombSpawn() {
    const config = this.configData;
    const playArea = config.playArea;
    const insetX = Math.max(playArea.spawnMargin, config.bomb.centerSpawnInsetX, config.bomb.edgeSafeInsetX || 0);
    const insetY = Math.max(playArea.spawnMargin, config.bomb.centerSpawnInsetY, config.bomb.edgeSafeInsetY || 0);
    const fallback = {
      x: playArea.x + playArea.width / 2,
      y: playArea.y + playArea.height / 2,
      ageMs: 0
    };

    for (let attempt = 0; attempt < config.bomb.spawnAttempts; attempt += 1) {
      const candidate = {
        x: Phaser.Math.Between(playArea.x + insetX, playArea.x + playArea.width - insetX),
        y: Phaser.Math.Between(playArea.y + insetY, playArea.y + playArea.height - insetY),
        ageMs: 0
      };
      if (this.isValidBombPosition(candidate)) return candidate;
    }

    return fallback;
  }

  isValidBombPosition(candidate) {
    const config = this.configData;
    if (isTooCloseToPlayAreaCorner(candidate, config.playArea, config.bomb.cornerSafeRadius)) return false;
    if (distanceBetween(candidate, this.getLeadCharacter()) < config.bomb.minDistanceFromPlayer) return false;
    if (this.state.followerActive && distanceBetween(candidate, this.state.follower) < config.bomb.minDistanceFromPlayer) return false;
    if (this.state.bananas.some((banana) => distanceBetween(candidate, banana) < config.bomb.minDistanceFromBanana)) return false;
    if (this.state.bombs.some((bomb) => distanceBetween(candidate, bomb) < config.bomb.minDistanceFromBanana)) return false;
    if (this.state.previousBomb && distanceBetween(candidate, this.state.previousBomb) < config.bomb.minDistanceFromPreviousBomb) return false;
    if (this.state.gorilla.spawned && distanceBetween(candidate, this.state.gorilla) < config.bomb.minDistanceFromGorilla) return false;
    if (this.state.secondGorilla.spawned && distanceBetween(candidate, this.state.secondGorilla) < config.bomb.minDistanceFromGorilla) return false;
    return true;
  }

  updateBombs(deltaMs) {
    const config = this.configData;
    this.state.bombRespawnTimerMs = Math.max(0, this.state.bombRespawnTimerMs - deltaMs);

    for (let index = this.state.bombs.length - 1; index >= 0; index -= 1) {
      const bomb = this.state.bombs[index];
      bomb.ageMs = (bomb.ageMs || 0) + deltaMs;
      if (bomb.ageMs >= config.bomb.lifetimeMs) {
        this.removeBomb(index);
        continue;
      }

      if (!bomb.fusePlayed && bomb.ageMs >= config.bomb.lifetimeMs - config.bombWarnings.fuseWarningMs) {
        bomb.fusePlayed = true;
        this.playSfx("bombFuse");
      }

      const now = this.time.now;
      if (
        now >= this.state.invincibleUntil &&
        this.protectedBunnyTouches(bomb, ...this.getHitboxValues(config.bomb, "bomb"))
      ) {
        this.removeBomb(index);
        this.damagePlayer(now, config.bomb.damage);
        continue;
      }

      if (
        this.state.gorilla.spawned &&
        boxesOverlap(
          bomb,
          ...this.getHitboxValues(config.bomb, "bomb"),
          this.state.gorilla,
          ...this.getHitboxValues(config.gorilla, "gorilla")
        )
      ) {
        this.state.score += config.bomb.destroyGorillaScore;
        this.removeBomb(index);
        this.destroyAndRespawnAidan();
        continue;
      }

      if (
        this.state.secondGorilla.spawned &&
        boxesOverlap(
          bomb,
          ...this.getHitboxValues(config.bomb, "bomb"),
          this.state.secondGorilla,
          ...this.getHitboxValues(config.secondGorilla, "g2")
        )
      ) {
        this.removeBomb(index);
        this.destroyAndRespawnSecondGorilla();
      }
    }

    this.maybeSpawnBomb();
  }

  removeBomb(index) {
    const [removed] = this.state.bombs.splice(index, 1);
    if (removed) {
      this.state.previousBomb = { x: removed.x, y: removed.y };
      this.createExplosion(removed.x, removed.y);
      this.playSfx("bombExplosion");
    }
    this.state.bombRespawnTimerMs = this.configData.bomb.respawnDelayMs;
  }

  createExplosion(x, y) {
    const config = this.configData.explosion;
    const flash = this.add.circle(x, y, config.radius * 0.36, config.flashColor, 0.85)
      .setDepth(config.zIndex);
    const ring = this.add.circle(x, y, config.radius * 0.2, config.ringColor, 0.35)
      .setStrokeStyle(5, config.ringColor, 0.9)
      .setDepth(config.zIndex);
    const boom = this.add.text(x, y - 2, "BOOM", {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#8b352c",
      stroke: "#ffe7bd",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(config.zIndex + 1);

    this.tweens.add({
      targets: flash,
      scale: 1.65,
      alpha: 0,
      duration: config.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => flash.destroy()
    });
    this.tweens.add({
      targets: ring,
      scale: config.radius / Math.max(1, config.radius * 0.2),
      alpha: 0,
      duration: config.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy()
    });
    this.tweens.add({
      targets: boom,
      y: boom.y - 22,
      alpha: 0,
      duration: config.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => boom.destroy()
    });

    for (let index = 0; index < config.particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / config.particleCount;
      const particle = this.add.circle(x, y, 5, config.particleColor, 0.9)
        .setDepth(config.zIndex);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * config.particleDistance,
        y: y + Math.sin(angle) * config.particleDistance,
        alpha: 0,
        duration: config.durationMs,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy()
      });
    }

    this.cameras.main.shake(config.screenShakeMs, config.screenShakeIntensity);
  }

  spawnGorilla() {
    const config = this.configData;
    const spawnPoint = this.chooseSafeCorner(
      config.gorilla.spawnCornerPadding,
      config.gorilla.minSpawnDistanceFromPlayer
    );

    this.state.gorilla.spawned = true;
    this.state.gorilla.respawning = false;
    this.state.gorilla.x = spawnPoint.x;
    this.state.gorilla.y = spawnPoint.y;
    const center = {
      x: config.playArea.x + config.playArea.width / 2,
      y: config.playArea.y + config.playArea.height / 2
    };
    const angle = Math.atan2(center.y - spawnPoint.y, center.x - spawnPoint.x);
    this.state.gorilla.velocityX = Math.cos(angle) * config.gorilla.bounceSpeed;
    this.state.gorilla.velocityY = Math.sin(angle) * config.gorilla.bounceSpeed;
    this.state.gorilla.behavior = this.state.bananaCount >= config.phases.dashChase ? "dash" : "bounce";
    this.state.gorilla.dashState = "pause";
    this.state.gorilla.dashTimerMs = config.gorilla.dashPauseMs;
    this.gorilla.setVisible(true);
    this.playSfx("aidanSpawn");
  }

  destroyAndRespawnAidan() {
    const config = this.configData;
    this.playSfx("gorillaDestroyed");
    this.state.gorilla.spawned = false;
    this.state.gorilla.respawning = true;
    this.state.gorilla.respawnTimerMs = config.gorilla.respawnDelayMs;
    this.state.gorilla.velocityX = 0;
    this.state.gorilla.velocityY = 0;
  }

  respawnAidan() {
    this.state.gorilla.respawning = false;
    this.spawnGorilla();
    updatePhase(this.state, this.configData);
  }

  spawnSecondGorilla() {
    const config = this.configData;
    const spawnPoint = this.chooseSafeCorner(config.secondGorilla.spawnPadding, config.gorilla.minSpawnDistanceFromPlayer);
    const g2 = this.state.secondGorilla;
    g2.spawned = true;
    g2.respawning = false;
    g2.x = spawnPoint.x;
    g2.y = spawnPoint.y;
    this.setSecondGorillaDirection();
    this.secondGorilla.setVisible(true);
    this.playSfx("g2Spawn");
  }

  chooseSafeCorner(padding, minDistance) {
    const playArea = this.configData.playArea;
    const corners = [
      { x: playArea.x + padding, y: playArea.y + padding },
      { x: playArea.x + playArea.width - padding, y: playArea.y + padding },
      { x: playArea.x + padding, y: playArea.y + playArea.height - padding },
      { x: playArea.x + playArea.width - padding, y: playArea.y + playArea.height - padding }
    ];
    const protectedBunnies = [this.getLeadCharacter()];
    if (this.state.followerActive) protectedBunnies.push(this.state.follower);

    const scoredCorners = corners.map((corner) => {
      const nearestBunnyDistance = Math.min(...protectedBunnies.map((bunny) => distanceBetween(corner, bunny)));
      return { ...corner, nearestBunnyDistance };
    });
    const farEnough = scoredCorners.filter((corner) => corner.nearestBunnyDistance >= minDistance);
    const choices = farEnough.length > 0 ? farEnough : scoredCorners;
    return choices.sort((a, b) => b.nearestBunnyDistance - a.nearestBunnyDistance)[0];
  }

  destroyAndRespawnSecondGorilla() {
    const config = this.configData;
    this.playSfx("g2Destroyed");
    this.state.secondGorilla.spawned = false;
    this.state.secondGorilla.respawning = true;
    this.state.secondGorilla.respawnTimerMs = config.secondGorilla.respawnDelayMs;
    this.state.secondGorilla.velocityX = 0;
    this.state.secondGorilla.velocityY = 0;
  }

  respawnSecondGorilla() {
    if (this.state.bananaCount < this.configData.secondGorilla.spawnAtBananas) return;
    this.spawnSecondGorilla();
    updatePhase(this.state, this.configData);
  }

  setSecondGorillaDirection() {
    const config = this.configData;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.state.secondGorilla.velocityX = Math.cos(angle) * config.secondGorilla.speed;
    this.state.secondGorilla.velocityY = Math.sin(angle) * config.secondGorilla.speed;
    this.state.secondGorilla.turnTimerMs = config.secondGorilla.wanderTurnMs;
  }

  syncSprites() {
    const config = this.configData;
    const bunbunWidth = this.state.followerActive ? config.follower.width : config.player.width;
    const bunbunHeight = this.state.followerActive ? config.follower.height : config.player.height;
    this.applyContainerArt(this.player, bunbunWidth, bunbunHeight);
    this.applyContainerArt(this.bun, config.bun.width, config.bun.height);
    this.applyContainerArt(this.gorilla, config.gorilla.width, config.gorilla.height);
    this.applyContainerArt(this.secondGorilla, config.secondGorilla.width, config.secondGorilla.height);

    this.player.setPosition(this.state.player.x, this.state.player.y);
    this.player.setScale(1);
    this.player.setVisible(this.state.followerActive);
    this.bun.setPosition(this.state.bun.x, this.state.bun.y);
    this.bun.setVisible(this.state.bunActive);
    while (this.bananaSprites.length < this.state.bananas.length) {
      this.createBananaSprite();
    }
    for (let index = 0; index < this.bananaSprites.length; index += 1) {
      const banana = this.state.bananas[index];
      this.applyContainerArt(this.bananaSprites[index], config.banana.width, config.banana.height);
      this.bananaSprites[index].setVisible(Boolean(banana));
      if (banana) {
        this.bananaSprites[index].setPosition(banana.x, banana.y);
        this.updateBananaCue(this.bananaSprites[index], banana);
      } else {
        this.bananaSprites[index].setScale(1);
        this.bananaSprites[index].setRotation(Phaser.Math.DegToRad(config.banana.rotation));
      }
    }
    this.gorilla.setPosition(this.state.gorilla.x, this.state.gorilla.y);
    this.gorilla.setVisible(this.state.gorilla.spawned);
    this.secondGorilla.setPosition(this.state.secondGorilla.x, this.state.secondGorilla.y);
    this.secondGorilla.setVisible(this.state.secondGorilla.spawned);
    while (this.bombSprites.length < this.state.bombs.length) {
      this.createBombSprite();
    }
    for (let index = 0; index < this.bombSprites.length; index += 1) {
      const bomb = this.state.bombs[index];
      this.applyContainerArt(this.bombSprites[index], config.bomb.width, config.bomb.height);
      this.bombSprites[index].setVisible(Boolean(bomb));
      if (bomb) this.bombSprites[index].setPosition(bomb.x, bomb.y);
    }
  }

  updateBananaCue(sprite, banana) {
    const config = this.configData.banana;
    if (this.state.introActive || (banana.ageMs || 0) < config.idleCueAfterMs) {
      sprite.setScale(1);
      sprite.setRotation(Phaser.Math.DegToRad(config.rotation));
      return;
    }
    const t = this.time.now * config.idleCueSpeed;
    const pulse = Math.sin(t) * config.idleCueScale;
    const wiggle = Math.sin(t * 1.7) * config.idleCueRotation;
    sprite.setScale(1 + Math.max(0, pulse));
    sprite.setRotation(Phaser.Math.DegToRad(config.rotation + wiggle));
  }

  updateFollower(deltaMs) {
    const config = this.configData;
    const seconds = deltaMs / 1000;
    const mode = config.follower.mode;
    if (mode === "spring") {
      this.updateFollowerSpring(seconds);
    } else if (mode === "dash") {
      this.updateFollowerDash(deltaMs, seconds);
    } else if (mode === "directSmooth") {
      this.updateFollowerDirect();
    } else {
      this.updateFollowerTrail(seconds);
    }

    this.clampFollower();
    this.state.player.x = this.state.follower.x;
    this.state.player.y = this.state.follower.y;
  }

  updateFollowerTrail(seconds) {
    const config = this.configData;
    const trail = this.state.bun.trail;
    const delayedPoint = trail[Math.min(config.follower.trailDelayFrames, trail.length - 1)] || this.state.bun;
    const follower = this.state.follower;
    const dx = delayedPoint.x - follower.x;
    const dy = delayedPoint.y - follower.y;
    const distance = Math.hypot(dx, dy);
    const catchup = Math.min(1, config.follower.catchupSpeed * seconds);

    follower.x += dx * catchup;
    follower.y += dy * catchup;

    if (distance > config.follower.maxDistance) {
      const angle = Math.atan2(dy, dx);
      follower.x = delayedPoint.x - Math.cos(angle) * config.follower.maxDistance;
      follower.y = delayedPoint.y - Math.sin(angle) * config.follower.maxDistance;
    }

    if (distance < config.follower.minDistance && trail.length > config.follower.trailDelayFrames) {
      const awayX = follower.x - this.state.bun.x;
      const awayY = follower.y - this.state.bun.y;
      const awayDistance = Math.hypot(awayX, awayY) || 1;
      follower.x = this.state.bun.x + (awayX / awayDistance) * config.follower.minDistance;
      follower.y = this.state.bun.y + (awayY / awayDistance) * config.follower.minDistance;
    }
  }

  updateFollowerSpring(seconds) {
    const config = this.configData;
    const follower = this.state.follower;
    const target = this.pointBehindBun(config.follower.followDistance);
    const dx = target.x - follower.x;
    const dy = target.y - follower.y;

    follower.velocityX += dx * config.follower.springStrength * seconds;
    follower.velocityY += dy * config.follower.springStrength * seconds;
    follower.velocityX *= config.follower.damping;
    follower.velocityY *= config.follower.damping;
    follower.x += follower.velocityX * seconds;
    follower.y += follower.velocityY * seconds;
    this.enforceFollowerMaxDistance();
  }

  updateFollowerDash(deltaMs, seconds) {
    const config = this.configData;
    const follower = this.state.follower;
    const target = this.pointBehindBun(config.follower.followDistance);
    const dx = target.x - follower.x;
    const dy = target.y - follower.y;
    const distance = Math.hypot(dx, dy);

    if (follower.dashState === "dashing") {
      follower.x += follower.dashVelocityX * seconds;
      follower.y += follower.dashVelocityY * seconds;
      follower.dashTimerMs -= deltaMs;
      if (follower.dashTimerMs <= 0) {
        follower.dashState = "cooldown";
        follower.dashCooldownMs = config.follower.dashCooldownMs;
      }
      return;
    }

    if (follower.dashState === "cooldown") {
      follower.dashCooldownMs -= deltaMs;
      if (follower.dashCooldownMs <= 0) follower.dashState = "ready";
    }

    if (distance > config.follower.dashTriggerDistance && follower.dashState === "ready") {
      const safeDistance = distance || 1;
      follower.dashVelocityX = (dx / safeDistance) * config.follower.dashSpeed;
      follower.dashVelocityY = (dy / safeDistance) * config.follower.dashSpeed;
      follower.dashTimerMs = config.follower.dashDurationMs;
      follower.dashState = "dashing";
      return;
    }

    follower.x += dx * Math.min(1, config.follower.lerpAmount);
    follower.y += dy * Math.min(1, config.follower.lerpAmount);
  }

  updateFollowerDirect() {
    const config = this.configData;
    const follower = this.state.follower;
    const target = this.pointBehindBun(config.follower.followDistance);
    follower.x += (target.x - follower.x) * config.follower.lerpAmount;
    follower.y += (target.y - follower.y) * config.follower.lerpAmount;
  }

  pointBehindBun(distance) {
    const trail = this.state.bun.trail;
    const recent = trail[Math.min(6, trail.length - 1)] || this.state.bun;
    const dx = this.state.bun.x - recent.x;
    const dy = this.state.bun.y - recent.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
      return {
        x: this.state.bun.x - distance,
        y: this.state.bun.y
      };
    }
    return {
      x: this.state.bun.x - (dx / length) * distance,
      y: this.state.bun.y - (dy / length) * distance
    };
  }

  enforceFollowerMaxDistance() {
    const config = this.configData;
    const follower = this.state.follower;
    const dx = follower.x - this.state.bun.x;
    const dy = follower.y - this.state.bun.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= config.follower.maxDistance) return;
    const safeDistance = distance || 1;
    follower.x = this.state.bun.x + (dx / safeDistance) * config.follower.maxDistance;
    follower.y = this.state.bun.y + (dy / safeDistance) * config.follower.maxDistance;
  }

  clampFollower() {
    const config = this.configData;
    const follower = this.state.follower;
    const followerSize = this.getVisibleSize(config.follower, "bunbun");

    follower.x = clampToPlayArea(
      follower.x,
      config.playArea.x + followerSize.width / 2,
      config.playArea.x + config.playArea.width - followerSize.width / 2
    );
    follower.y = clampToPlayArea(
      follower.y,
      config.playArea.y + followerSize.height / 2,
      config.playArea.y + config.playArea.height - followerSize.height / 2
    );
  }

  updateGorillaDash(deltaMs) {
    const config = this.configData;
    const gorilla = this.state.gorilla;
    const seconds = deltaMs / 1000;

    gorilla.dashTimerMs -= deltaMs;

    if (gorilla.dashState === "dash") {
      gorilla.x += gorilla.velocityX * seconds;
      gorilla.y += gorilla.velocityY * seconds;
      if (gorilla.dashTimerMs <= 0) {
        gorilla.dashState = "recover";
        gorilla.dashTimerMs = config.gorilla.dashCooldownMs;
        gorilla.velocityX = 0;
        gorilla.velocityY = 0;
      }
      return;
    }

    if (gorilla.dashTimerMs > 0) return;

    if (gorilla.dashState === "pause" || gorilla.dashState === "recover") {
      const dashVector = this.getNextDashVector();
      gorilla.velocityX = dashVector.x * config.gorilla.dashSpeed;
      gorilla.velocityY = dashVector.y * config.gorilla.dashSpeed;
      gorilla.dashState = "dash";
      gorilla.dashTimerMs = config.gorilla.dashDurationMs;
      gorilla.dashCount += 1;
      gorilla.nextDashType = this.getUpcomingDashType();
      this.playSfx("aidanDash");
    }
  }

  getNextDashVector() {
    const config = this.configData;
    const gorilla = this.state.gorilla;
    const dashType = this.getUpcomingDashType();

    if (dashType === "random") {
      const angle = Phaser.Math.FloatBetween(
        config.gorilla.randomDashAnglePadding,
        Math.PI * 2 - config.gorilla.randomDashAnglePadding
      );
      return {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
    }

    const target = this.getGorillaTarget();
    const dx = target.x - gorilla.x;
    const dy = target.y - gorilla.y;
    const distance = Math.hypot(dx, dy) || 1;
    return {
      x: dx / distance,
      y: dy / distance
    };
  }

  getUpcomingDashType() {
    const config = this.configData;
    if (
      this.state.bananaCount >= config.phases.gorillaTargetsBunBun ||
      !config.gorilla.alternateRandomTargetBeforeBunBunPhase
    ) {
      return "targeted";
    }

    return this.state.gorilla.dashCount % 2 === 0 ? "random" : "targeted";
  }

  activateFollower() {
    const config = this.configData;
    this.state.followerActive = true;
    this.state.controlledCharacter = "bun";
    const restingPoint = this.pointBehindBun(config.follower.minDistance);
    this.state.follower.x = restingPoint.x;
    this.state.follower.y = restingPoint.y;
    this.state.player.x = this.state.follower.x;
    this.state.player.y = this.state.follower.y;

    if (!this.state.bunBonusAwarded) {
      this.state.score += config.bun.appearanceScoreBonus;
      this.state.bunBonusAwarded = true;
      this.playSfx("bunAppears");
    }
  }

  gorillaTouchesProtectedBunny() {
    return this.protectedBunnyTouches(
      this.state.gorilla,
      ...this.getHitboxValues(this.configData.gorilla, "gorilla")
    );
  }

  protectedBunnyTouches(hazard, hazardWidth, hazardHeight) {
    const config = this.configData;
    const lead = this.getLeadCharacter();
    const leadConfig = this.getLeadConfig();
    const leadHitbox = this.getHitbox(leadConfig, this.getLeadArtName());
    const followerHitbox = this.getHitbox(config.follower, "bunbun");

    const touchesLead = boxesOverlap(
      lead,
      leadHitbox.width,
      leadHitbox.height,
      hazard,
      hazardWidth,
      hazardHeight
    );

    if (!this.state.followerActive) return touchesLead;

    const touchesFollower = boxesOverlap(
      this.state.follower,
      followerHitbox.width,
      followerHitbox.height,
      hazard,
      hazardWidth,
      hazardHeight
    );

    return touchesLead || touchesFollower;
  }

  damagePlayer(now, damage = this.configData.gorilla.damage) {
    this.playSfx("bunnyHit");
    this.state.hearts = Math.max(0, this.state.hearts - damage);
    this.state.invincibleUntil = now + this.configData.player.invincibilityMs;

    if (this.state.hearts <= 0) {
      this.playSfx("gameOver");
      this.state.status = "game-over";
      this.inputController.resetMovement();
      if (this.configData.flow.gameOverOverlayEnabled) {
        this.ui.showGameOver();
      } else {
        this.time.delayedCall(this.configData.flow.gameOverAutoRestartMs, () => {
          if (this.state.status === "game-over") this.startGame();
        });
      }
    }
  }

  getLeadCharacter() {
    return this.state.bunActive ? this.state.bun : this.state.player;
  }

  getLeadConfig() {
    return this.state.bunActive ? this.configData.bun : this.configData.player;
  }

  getLeadArtName() {
    return this.state.bunActive ? "bun" : "bunbun";
  }

  getArtScale(artName) {
    return this.configData.art.characters[artName]?.scale ?? 1;
  }

  getVisibleSize(entityConfig, artName) {
    const scale = this.getArtScale(artName);
    return {
      width: entityConfig.width * scale,
      height: entityConfig.height * scale
    };
  }

  getHitbox(entityConfig, artName) {
    const artScale = this.getArtScale(artName);
    const strength = this.configData.art.hitboxScaleStrength;
    const scaledHitbox = 1 + (artScale - 1) * strength;
    const hitboxScale = Phaser.Math.Clamp(
      scaledHitbox,
      this.configData.art.minHitboxScale,
      this.configData.art.maxHitboxScale
    );
    return {
      width: entityConfig.hitboxWidth * hitboxScale,
      height: entityConfig.hitboxHeight * hitboxScale
    };
  }

  getHitboxValues(entityConfig, artName) {
    const hitbox = this.getHitbox(entityConfig, artName);
    return [hitbox.width, hitbox.height];
  }

  getGorillaTarget() {
    if (this.state.gorilla.target === "bunbun") {
      return this.state.followerActive ? this.state.follower : this.getLeadCharacter();
    }
    return this.getLeadCharacter();
  }

  currentBananaScore() {
    return this.state.bananaCount >= this.configData.secondGorilla.spawnAtBananas
      ? this.configData.banana.scoreValueTwoGorillas
      : this.configData.banana.scoreValueNormal;
  }

  updateComboTimer(deltaMs) {
    if (this.state.comboCount <= 0) return;
    this.state.comboTimerMs = Math.max(0, this.state.comboTimerMs - deltaMs);
    if (this.state.comboTimerMs <= 0) {
      this.state.comboCount = 0;
      this.state.lastComboBonus = 0;
    }
  }

  updateComboOnBananaCollect() {
    const config = this.configData.combo;
    const now = this.time.now;
    const isInsideWindow = this.state.lastBananaCollectedAt > 0 &&
      now - this.state.lastBananaCollectedAt <= config.windowMs;

    this.state.comboCount = isInsideWindow ? this.state.comboCount + 1 : 1;
    this.state.comboTimerMs = config.windowMs;
    this.state.lastBananaCollectedAt = now;
    this.state.lastComboBonus = this.state.comboCount >= config.minCountForBonus ? config.bonusPoints : 0;
    return this.state.lastComboBonus;
  }

  showComboPopup(text) {
    const config = this.configData;
    const lead = this.getLeadCharacter();
    const popup = this.add.text(lead.x, lead.y - 42, text, {
      fontFamily: "Trebuchet MS, Arial",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#cf4d82",
      stroke: "#fff1dc",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(config.combo.zIndex);

    this.tweens.add({
      targets: popup,
      y: popup.y - config.combo.popupRise,
      alpha: 0,
      duration: config.combo.popupDurationMs,
      ease: "Sine.easeOut",
      onComplete: () => popup.destroy()
    });
  }

  playSfx(name) {
    if (this.ui.playSfx) this.ui.playSfx(name);
  }
}

function boxesOverlap(a, aWidth, aHeight, b, bWidth, bHeight) {
  return (
    Math.abs(a.x - b.x) < (aWidth + bWidth) / 2 &&
    Math.abs(a.y - b.y) < (aHeight + bHeight) / 2
  );
}

function clampToPlayArea(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isTooCloseToPlayAreaCorner(point, playArea, radius = 0) {
  if (!radius || radius <= 0) return false;
  const corners = [
    { x: playArea.x, y: playArea.y },
    { x: playArea.x + playArea.width, y: playArea.y },
    { x: playArea.x, y: playArea.y + playArea.height },
    { x: playArea.x + playArea.width, y: playArea.y + playArea.height }
  ];
  return corners.some((corner) => distanceBetween(point, corner) < radius);
}

async function waitForIntroImages() {
  const imageElements = [
    ...document.querySelectorAll(".start-lifted-object"),
    ...document.querySelectorAll("#game-shell")
  ];
  const decodeJobs = imageElements.map((element) => {
    if (element instanceof HTMLImageElement) {
      if (element.complete && element.naturalWidth > 0) return Promise.resolve();
      return element.decode?.().catch(() => undefined) ?? Promise.resolve();
    }
    const backgroundImage = getComputedStyle(element).backgroundImage;
    const match = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) return Promise.resolve();
    return decodeImage(match[1]);
  });
  await Promise.allSettled(decodeJobs);
}

function decodeImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.decode) {
      image.decode().then(resolve).catch(resolve);
    }
  });
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
