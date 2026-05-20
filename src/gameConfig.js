export const gameConfig = {
  copy: {
    title: "Restless Spirit",
    startPrompt: "Move Ghost. Coin joins at 9 lights.",
    gameOverTitle: "Game Over",
    restartLabel: "Restart",
    scoreLabel: "Score",
    musicOnLabel: "Music: On",
    musicOffLabel: "Music: Off",
    creditsLabel: "Credits",
    conceptAlt: "Haunted mansion game art for Restless Spirit",
    roleLabels: {
      player: "Coin",
      lead: "Ghost",
      collectible: "Spirit Light",
      collectiblePlural: "Spirit Lights",
      chaser: "Bat",
      secondChaser: "Pumpkin",
      hazard: "Trap"
    }
  },

  game: {
    designWidth: 720,
    designHeight: 840,
    responsiveMode: "fit",
    backgroundZ: 0,
    playAreaZ: 1,
    itemsZ: 10,
    charactersZ: 20,
    effectsZ: 30,
    uiZ: 40,
    debugZ: 99
  },

  flow: {
    startScreenEnabled: true,
    gameOverOverlayEnabled: false,
    gameOverAutoRestartMs: 900
  },

  tutorial: {
    enabled: false,
    promptX: 360,
    promptY: 628,
    promptWidth: 460,
    promptFontSize: 15,
    promptText: "Use the joystick or arrow keys to move the player.",
    completeAfterFirstBanana: true
  },

  playArea: {
    x: 40,
    y: 96,
    width: 640,
    height: 584,
    borderRadius: 28,
    spawnMargin: 52
  },

  player: {
    width: 42,
    height: 42,
    hitboxWidth: 30,
    hitboxHeight: 30,
    speed: 310,
    rotation: 0,
    zIndex: 20,
    invincibilityMs: 1200,
    startX: 140,
    startY: 380,
    followerTrailMax: 180
  },

  bun: {
    width: 64,
    height: 72,
    hitboxWidth: 42,
    hitboxHeight: 48,
    speed: 335,
    rotation: 0,
    zIndex: 22,
    appearanceScoreBonus: 5
  },

  follower: {
    mode: "directSmooth",
    width: 42,
    height: 42,
    hitboxWidth: 32,
    hitboxHeight: 32,
    rotation: 0,
    zIndex: 21,
    trailDelayFrames: 22,
    followerDelayMs: 320,
    catchupSpeed: 9,
    followerCatchupSpeed: 9,
    followDistance: 36,
    minDistance: 34,
    maxDistance: 85,
    springStrength: 22,
    damping: 0.82,
    dashTriggerDistance: 130,
    dashSpeed: 360,
    dashDurationMs: 260,
    dashCooldownMs: 520,
    lerpAmount: 0.12,
    bounceAmount: 3,
    bounceSpeed: 0.008
  },

  banana: {
    width: 42,
    height: 42,
    hitboxWidth: 34,
    hitboxHeight: 34,
    rotation: 0,
    zIndex: 10,
    scoreValueNormal: 1,
    scoreValueTwoGorillas: 3,
    maxOnScreen: 2,
    multiBananaStartsAt: 10,
    maxOnScreenEarly: 1,
    maxOnScreenLater: 2,
    twoBananaChanceAfterThreshold: 0.4,
    minDistanceFromOtherBananas: 210,
    minDistanceFromPlayer: 170,
    minDistanceFromGorilla: 160,
    minDistanceFromBomb: 105,
    edgeSafeInsetX: 76,
    edgeSafeInsetY: 76,
    cornerSafeRadius: 150,
    spawnAttempts: 30,
    centerSpawnForFirstBananas: 2,
    centerSpawnWidth: 260,
    centerSpawnHeight: 210,
    idleCueAfterMs: 3000,
    idleCueScale: 0.12,
    idleCueRotation: 7,
    idleCueSpeed: 0.008
  },

  gorilla: {
    width: 96,
    height: 56,
    hitboxWidth: 54,
    hitboxHeight: 38,
    speed: 80,
    bounceSpeed: 80,
    damage: 1,
    rotation: 0,
    zIndex: 20,
    spawnCornerPadding: 80,
    minSpawnDistanceFromPlayer: 260,
    preferFarthestCorner: true,
    startVelocityX: -120,
    startVelocityY: 96,
    dashPauseMs: 1350,
    dashDurationMs: 540,
    dashSpeed: 220,
    dashCooldownMs: 1050,
    dashTargetLead: 0,
    dashWallBounce: 0.55,
    alternateRandomTargetBeforeBunBunPhase: true,
    randomDashAnglePadding: 0.35,
    respawnDelayMs: 1500
  },

  bomb: {
    startsAtBananas: 15,
    width: 42,
    height: 42,
    hitboxWidth: 34,
    hitboxHeight: 34,
    damage: 2,
    maxOnScreen: 1,
    spawnChance: 0.75,
    lifetimeMs: 6000,
    respawnDelayMs: 1500,
    centerSpawnInsetX: 120,
    centerSpawnInsetY: 120,
    edgeSafeInsetX: 136,
    edgeSafeInsetY: 136,
    cornerSafeRadius: 210,
    minDistanceFromPlayer: 130,
    minDistanceFromBanana: 115,
    minDistanceFromGorilla: 125,
    minDistanceFromPreviousBomb: 170,
    spawnAttempts: 30,
    destroyGorillaScore: 3,
    zIndex: 12
  },

  secondGorilla: {
    spawnAtBananas: 18,
    width: 72,
    height: 72,
    hitboxWidth: 50,
    hitboxHeight: 50,
    speed: 80,
    damage: 1,
    wanderTurnMs: 1200,
    spawnPadding: 90,
    zIndex: 19,
    respawnDelayMs: 1500,
    bombAvoidanceRadius: 70,
    bombAvoidanceStrength: 1
  },

  combo: {
    windowMs: 3500,
    minCountForBonus: 3,
    bonusPoints: 3,
    popupDurationMs: 850,
    popupRise: 38,
    zIndex: 35
  },

  audio: {
    musicPath: "/assets/audio/music/restless-spirit-theme.mp3",
    musicVolume: 0.5,
    loopGapMs: 1000,
    startDelayMs: 300,
    startOnFirstMovement: true,
    storageKey: "restlessSpirit.musicEnabled",
    sfxEnabled: true,
    sfxVolume: 0.45,
    sfxStorageKey: "restlessSpirit.sfxEnabled",
    bananaSfxPreset: "softChime",
    bombSfxPreset: "softBoom"
  },

  art: {
    backgroundMode: "fullFrame",
    consoleFrameEnabled: false,
    consoleFramePath: "",
    hitboxScaleStrength: 0.25,
    minHitboxScale: 0.75,
    maxHitboxScale: 2.4,
    selectedFullFrameBackground: "default",
    fullFrameBackgrounds: [
      { id: "default", label: "Haunted mansion", path: "/assets/images/restless-spirit/backgrounds/background-default.png" }
    ],
    selectedPlayfieldBackground: "",
    playfieldLayerMode: "off",
    playfieldBackgrounds: [],
    characters: {
      bunbun: {
        path: "/assets/images/restless-spirit/characters/follower.png",
        scale: 1.45,
        offsetX: 0,
        offsetY: 0
      },
      bun: {
        path: "/assets/images/restless-spirit/characters/lead.png",
        scale: 1.7,
        offsetX: 0,
        offsetY: -2
      },
      banana: {
        path: "/assets/images/restless-spirit/characters/collectible.png",
        scale: 1.4,
        offsetX: 0,
        offsetY: 0
      },
      bomb: {
        path: "/assets/images/restless-spirit/characters/hazard.png",
        scale: 1.8,
        offsetX: 0,
        offsetY: 0
      },
      gorilla: {
        path: "/assets/images/restless-spirit/characters/chaser-a.png",
        scale: 1.55,
        offsetX: 0,
        offsetY: 0
      },
      g2: {
        path: "/assets/images/restless-spirit/characters/chaser-b.png",
        scale: 1.55,
        offsetX: 0,
        offsetY: 0
      }
    }
  },

  sfx: {
    bananaPickup: {
      presets: {
        softChime: {
          label: "Soft chime",
          path: "/assets/audio/sfx/restless-spirit-pickup-soft-chime.wav"
        },
        bubblePop: {
          label: "Bubble pop",
          path: "/assets/audio/sfx/restless-spirit-pickup-bubble-pop.wav"
        },
        tinyBell: {
          label: "Tiny bell",
          path: "/assets/audio/sfx/restless-spirit-pickup-tiny-bell.wav"
        }
      }
    },
    bombExplosion: {
      presets: {
        softBoom: {
          label: "Soft boom",
          path: "/assets/audio/sfx/restless-spirit-hazard-soft-boom.wav"
        },
        cartoonPop: {
          label: "Cartoon pop",
          path: "/assets/audio/sfx/restless-spirit-hazard-cartoon-pop.wav"
        },
        lowThump: {
          label: "Low thump",
          path: "/assets/audio/sfx/restless-spirit-hazard-low-thump.wav"
        }
      }
    },
    bunnyHit: {
      path: "/assets/audio/sfx/restless-spirit-hit.wav"
    }
  },

  explosion: {
    radius: 74,
    durationMs: 420,
    flashColor: 0xffe7a8,
    ringColor: 0xff7755,
    particleColor: 0xffb04f,
    particleCount: 10,
    particleDistance: 56,
    screenShakeMs: 90,
    screenShakeIntensity: 0.004,
    zIndex: 31
  },

  bombWarnings: {
    fuseWarningMs: 1100
  },

  phases: {
    gorillaAppears: 3,
    dashChase: 6,
    bunAppears: 9,
    gorillaTargetsBunBun: 12,
    bombsAppear: 15,
    secondGorilla: 18
  },

  uiTopBar: {
    topBarX: 40,
    topBarY: 24,
    topBarWidth: 640,
    topBarHeight: 56,
    titleX: 64,
    titleY: 52,
    titleFontSize: 21,
    scoreX: 382,
    scoreY: 52,
    scoreFontSize: 18,
    bananaCountX: 450,
    bananaCountY: 58,
    bananaCountFontSize: 18,
    heartsX: 574,
    heartsY: 52,
    heartSize: 25,
    heartsGap: 2
  },

  buttons: {
    startButtonWidth: 220,
    startButtonHeight: 64,
    startButtonX: 250,
    startButtonY: 450,
    restartButtonWidth: 84,
    restartButtonHeight: 44,
    restartButtonX: 596,
    restartButtonY: 30,
    soundButtonWidth: 92,
    soundButtonHeight: 44,
    soundButtonX: 152,
    soundButtonY: 716,
    creditsButtonWidth: 92,
    creditsButtonHeight: 44,
    creditsButtonX: 40,
    creditsButtonY: 716,
    buttonBorderRadius: 22,
    buttonFontSize: 15
  },

  joystick: {
    mode: "bottom",
    touchscreenDefaultMode: "bottom",
    autoWideAspect: 1.12,
    controlZoneX: 0,
    controlZoneY: 360,
    controlZoneWidth: 720,
    controlZoneHeight: 360,
    bottomZoneX: 0,
    bottomZoneY: 610,
    bottomZoneWidth: 720,
    bottomZoneHeight: 230,
    leftZoneX: 0,
    leftZoneY: 220,
    leftZoneWidth: 360,
    leftZoneHeight: 500,
    rightZoneX: 360,
    rightZoneY: 220,
    rightZoneWidth: 360,
    rightZoneHeight: 500,
    rightBottomZoneX: 300,
    rightBottomZoneY: 696,
    rightBottomZoneWidth: 420,
    rightBottomZoneHeight: 144,
    baseRadius: 64,
    knobRadius: 28,
    maxDistance: 70,
    deadZone: 8,
    opacity: 0.65,
    zIndex: 50
  },

  bottomControls: {
    x: 0,
    y: 696,
    width: 720,
    height: 144,
    joystickHintX: 500,
    joystickHintY: 738,
    joystickHintRadius: 62,
    zIndex: 39
  },

  debugPanel: {
    enabledByDefault: false,
    x: 470,
    y: 612,
    width: 218,
    fontSize: 10,
    zIndex: 99
  },

  controls: {
    playMode: "touchscreen",
    defaultPlayMode: "touchscreen",
    debugToggleKeys: ["f2", "`"],
    tuningToggleKeys: ["t"]
  },

  toolsButton: {
    x: 604,
    y: 88,
    width: 76,
    height: 34,
    fontSize: 13,
    zIndex: 80,
    visible: false
  },

  toolsPanel: {
    x: 486,
    y: 126,
    width: 194,
    fontSize: 12,
    zIndex: 101,
    localStorageKey: "restlessSpirit.panels.v1"
  },

  concept: {
    imagePath: "/assets/images/restless-spirit/concept/concept.png",
    title: "Game Art",
    subtitle: "Hannah's haunted mansion stage art",
    buttonLabel: "Tap title to view the game art",
    imageX: 360,
    imageY: 378,
    imageWidth: 340,
    imageHeight: 392
  },

  credits: {
    studentName: "Hannah",
    contestTitle: "PIK Composition Contest 2026",
    contestUrl: "https://youtube.com/playlist?list=PLhhleIn9mEjhNAztK55u86m13lu6xpqoM&si=9kGz8asDtaMO3Wy8",
    linkLabel: "Hannah - Restless Spirit",
    musicUrl: "https://www.youtube.com/watch?v=Woz_xv3eIcM",
    designerName: "Le Binh Anh Nguyen",
    designerEmail: "binhanhpiano96@gmail.com",
    line1: "Original music and characters by Hannah",
    line2: "Playable browser-game adaptation by Beita and Codex"
  },

  tuningPanel: {
    x: 20,
    y: 118,
    width: 292,
    fontSize: 11,
    zIndex: 100,
    localStorageKey: "restlessSpirit.tuning.v1"
  },

  startScreen: {
    titleX: 360,
    titleY: 152,
    titleWidth: 640,
    titleFontSize: 34,
    subtitleX: 360,
    subtitleY: 206,
    subtitleWidth: 520,
    subtitleFontSize: 18,
    bunbunX: 268,
    bunbunY: 390,
    bunbunSize: 138,
    bananaX: 452,
    bananaY: 388,
    bananaSize: 78,
    joystickX: 500,
    joystickY: 738,
    joystickRadius: 62,
    promptX: 360,
    promptY: 610,
    promptWidth: 500,
    promptFontSize: 15,
    promptText: "Move Ghost. Coin joins at 9 lights.",
    tapText: "Tap the player to play",
    tapTextY: 470,
    computerButtonX: 130,
    computerButtonY: 330,
    computerButtonWidth: 220,
    computerButtonHeight: 170,
    touchscreenButtonX: 370,
    touchscreenButtonY: 330,
    touchscreenButtonWidth: 220,
    touchscreenButtonHeight: 170,
    choiceTitleFontSize: 25,
    choiceTextFontSize: 16,
    instructionsX: 360,
    instructionsY: 285,
    instructionsWidth: 560,
    instructionsFontSize: 20
  },

  gameOver: {
    panelX: 130,
    panelY: 220,
    panelWidth: 460,
    panelHeight: 260,
    textWidth: 420,
    titleFontSize: 48,
    textFontSize: 22
  }
};
