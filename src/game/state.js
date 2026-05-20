export function createInitialState(config) {
  return {
    status: "start",
    score: 0,
    bananaCount: 0,
    hearts: 3,
    phase: "collect-bananas",
    invincibleUntil: 0,
    soundMuted: false,
    comboCount: 0,
    comboTimerMs: 0,
    lastBananaCollectedAt: 0,
    lastComboBonus: 0,
    tutorialActive: Boolean(config.tutorial?.enabled),
    tutorialComplete: false,
    introActive: Boolean(config.flow?.startScreenEnabled),
    debugVisible: config.debugPanel.enabledByDefault,
    tuningVisible: false,
    toolsVisible: false,
    playMode: config.controls.defaultPlayMode,
    hideJoystickHint: false,
    joystickHintReturnMs: 0,
    bunActive: true,
    followerActive: false,
    bunBonusAwarded: false,
    controlledCharacter: "bun",
    player: {
      x: config.player.startX,
      y: config.player.startY,
      trail: []
    },
    bun: {
      x: config.player.startX,
      y: config.player.startY,
      trail: []
    },
    follower: createFollowerState(config),
    banana: {
      x: 0,
      y: 0
    },
    bananas: [],
    targetBananaCount: config.banana.maxOnScreenEarly,
    bombs: [],
    bombRespawnTimerMs: 0,
    previousBomb: null,
    gorilla: createGorillaState(config),
    secondGorilla: createSecondGorillaState(config)
  };
}

export function resetState(state, config) {
  state.status = "playing";
  state.score = 0;
  state.bananaCount = 0;
  state.hearts = 3;
  state.phase = "collect-bananas";
  state.invincibleUntil = 0;
  state.comboCount = 0;
  state.comboTimerMs = 0;
  state.lastBananaCollectedAt = 0;
  state.lastComboBonus = 0;
  state.tutorialActive = Boolean(config.tutorial?.enabled);
  state.tutorialComplete = false;
  state.introActive = Boolean(config.flow?.startScreenEnabled);
  state.playMode = config.controls.playMode;
  state.hideJoystickHint = false;
  state.joystickHintReturnMs = 0;
  state.bunActive = true;
  state.followerActive = false;
  state.bunBonusAwarded = false;
  state.controlledCharacter = "bun";
  state.player.x = config.player.startX;
  state.player.y = config.player.startY;
  state.player.trail = [];
  state.bun.x = config.player.startX;
  state.bun.y = config.player.startY;
  state.bun.trail = [];
  Object.assign(state.follower, createFollowerState(config));
  state.banana.x = 0;
  state.banana.y = 0;
  state.bananas = [];
  state.targetBananaCount = config.banana.maxOnScreenEarly;
  state.bombs = [];
  state.bombRespawnTimerMs = 0;
  state.previousBomb = null;
  Object.assign(state.gorilla, createGorillaState(config));
  Object.assign(state.secondGorilla, createSecondGorillaState(config));
}

export function updatePhase(state, config) {
  if (state.bananaCount >= config.secondGorilla.spawnAtBananas) {
    state.phase = "two-gorilla-chaos";
  } else if (state.bananaCount >= config.bomb.startsAtBananas) {
    state.phase = "bombs-active";
  } else if (state.bananaCount >= config.phases.gorillaTargetsBunBun) {
    state.phase = "dash-target-bunbun";
  } else if (state.bananaCount >= config.phases.bunAppears) {
    state.phase = "bun-leads-bunbun-follows";
  } else if (state.bananaCount >= config.phases.dashChase) {
    state.phase = "gorilla-dash-chase";
  } else if (state.bananaCount >= config.phases.gorillaAppears) {
    state.phase = "gorilla-bounce";
  } else {
    state.phase = "collect-bananas";
  }

  state.gorilla.behavior = state.bananaCount >= config.phases.dashChase ? "dash" : "bounce";
  state.gorilla.target = state.bananaCount >= config.phases.gorillaTargetsBunBun && state.followerActive ? "bunbun" : "lead";
  state.gorilla.nextDashType = state.bananaCount >= config.phases.gorillaTargetsBunBun
    ? "targeted"
    : state.gorilla.nextDashType;
}

function createFollowerState(config) {
  return {
    x: config.player.startX,
    y: config.player.startY,
    velocityX: 0,
    velocityY: 0,
    dashState: "ready",
    dashTimerMs: 0,
    dashCooldownMs: 0,
    dashVelocityX: 0,
    dashVelocityY: 0
  };
}

function createGorillaState(config) {
  return {
    spawned: false,
    respawning: false,
    respawnTimerMs: 0,
    x: 0,
    y: 0,
    velocityX: config.gorilla.startVelocityX,
    velocityY: config.gorilla.startVelocityY,
    behavior: "bounce",
    dashState: "pause",
    dashTimerMs: config.gorilla.dashPauseMs,
    target: "lead",
    nextDashType: "random",
    dashCount: 0
  };
}

function createSecondGorillaState(config) {
  return {
    spawned: false,
    respawning: false,
    respawnTimerMs: 0,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    turnTimerMs: config.secondGorilla.wanderTurnMs
  };
}
