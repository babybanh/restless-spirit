export function createInputController(config, shell) {
  const keysDown = new Set();
  const joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    knobX: 0,
    knobY: 0,
    directionX: 0,
    directionY: 0,
    movementNotified: false
  };

  const controller = {
    keysDown,
    joystick,
    debugToggleRequested: false,
    tuningToggleRequested: false,
    onAudioGestureStart: null,
    onMovementGesture: null,
    getDirection,
    resetJoystick,
    resetMovement
  };

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isFirstPress = !keysDown.has(key);
    keysDown.add(key);
    if (isMovementKey(key)) {
      notifyAudioGestureStart(controller);
      notifyMovementGesture(controller);
    }
    if (config.controls.debugToggleKeys.includes(key) && isFirstPress) {
      event.preventDefault();
      controller.debugToggleRequested = true;
    }
    if (config.controls.tuningToggleKeys.includes(key) && isFirstPress) {
      event.preventDefault();
      controller.tuningToggleRequested = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    keysDown.delete(event.key.toLowerCase());
  });

  shell.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-ui-control='true']")) return;
    const point = toDesignPoint(event, shell, config);
    if (!isInControlZone(point, config)) return;
    notifyAudioGestureStart(controller);
    joystick.active = true;
    joystick.baseX = point.x;
    joystick.baseY = point.y;
    updateJoystick(point, joystick, config);
    notifyJoystickMovementIfNeeded(controller);
    shell.setPointerCapture(event.pointerId);
  });

  shell.addEventListener("pointermove", (event) => {
    if (!joystick.active) return;
    const point = toDesignPoint(event, shell, config);
    updateJoystick(point, joystick, config);
    notifyJoystickMovementIfNeeded(controller);
  });

  shell.addEventListener("pointerup", () => resetJoystick());
  shell.addEventListener("pointercancel", () => resetJoystick());
  shell.addEventListener("lostpointercapture", () => resetJoystick());

  function getDirection() {
    let keyboardX = 0;
    let keyboardY = 0;

    if (keysDown.has("arrowleft")) keyboardX -= 1;
    if (keysDown.has("arrowright")) keyboardX += 1;
    if (keysDown.has("arrowup")) keyboardY -= 1;
    if (keysDown.has("arrowdown")) keyboardY += 1;
    if (keysDown.has("a")) keyboardX -= 1;
    if (keysDown.has("d")) keyboardX += 1;
    if (keysDown.has("w")) keyboardY -= 1;
    if (keysDown.has("s")) keyboardY += 1;

    const keyboardLength = Math.hypot(keyboardX, keyboardY);
    if (keyboardLength > 0) {
      return {
        x: keyboardX / keyboardLength,
        y: keyboardY / keyboardLength,
        source: "keyboard"
      };
    }

    return {
      x: joystick.directionX,
      y: joystick.directionY,
      source: joystick.active ? "joystick" : "none"
    };
  }

  function resetJoystick() {
    joystick.active = false;
    joystick.directionX = 0;
    joystick.directionY = 0;
    joystick.knobX = joystick.baseX;
    joystick.knobY = joystick.baseY;
    joystick.movementNotified = false;
  }

  function resetMovement() {
    keysDown.clear();
    resetJoystick();
  }

  return controller;
}

function notifyMovementGesture(controller) {
  if (controller.onMovementGesture) controller.onMovementGesture();
}

function notifyAudioGestureStart(controller) {
  if (controller.onAudioGestureStart) controller.onAudioGestureStart();
}

function notifyJoystickMovementIfNeeded(controller) {
  const joystick = controller.joystick;
  if (joystick.movementNotified) return;
  if (Math.hypot(joystick.directionX, joystick.directionY) <= 0.01) return;
  joystick.movementNotified = true;
  notifyMovementGesture(controller);
}

function isMovementKey(key) {
  return ["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key);
}

function updateJoystick(point, joystick, config) {
  const dx = point.x - joystick.baseX;
  const dy = point.y - joystick.baseY;
  const distance = Math.hypot(dx, dy);
  const limitedDistance = Math.min(distance, config.joystick.maxDistance);
  const angle = Math.atan2(dy, dx);

  joystick.knobX = joystick.baseX + Math.cos(angle) * limitedDistance;
  joystick.knobY = joystick.baseY + Math.sin(angle) * limitedDistance;

  if (distance < config.joystick.deadZone) {
    joystick.directionX = 0;
    joystick.directionY = 0;
    return;
  }

  joystick.directionX = Math.cos(angle) * (limitedDistance / config.joystick.maxDistance);
  joystick.directionY = Math.sin(angle) * (limitedDistance / config.joystick.maxDistance);
}

function isInControlZone(point, config) {
  if (config.controls.playMode === "computer") return false;
  const zone = getActiveControlZone(config);
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.width &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.height
  );
}

function getActiveControlZone(config) {
  const mode = resolveJoystickMode(config);
  if (mode === "left") {
    return {
      x: config.joystick.leftZoneX,
      y: config.joystick.leftZoneY,
      width: config.joystick.leftZoneWidth,
      height: config.joystick.leftZoneHeight
    };
  }
  if (mode === "right") {
    return {
      x: config.joystick.rightZoneX,
      y: config.joystick.rightZoneY,
      width: config.joystick.rightZoneWidth,
      height: config.joystick.rightZoneHeight
    };
  }
  if (mode === "rightBottom") {
    return {
      x: config.joystick.rightBottomZoneX,
      y: config.joystick.rightBottomZoneY,
      width: config.joystick.rightBottomZoneWidth,
      height: config.joystick.rightBottomZoneHeight
    };
  }
  return {
    x: config.joystick.bottomZoneX ?? config.joystick.controlZoneX,
    y: config.joystick.bottomZoneY ?? config.joystick.controlZoneY,
    width: config.joystick.bottomZoneWidth ?? config.joystick.controlZoneWidth,
    height: config.joystick.bottomZoneHeight ?? config.joystick.controlZoneHeight
  };
}

function resolveJoystickMode(config) {
  if (config.joystick.mode !== "auto") return config.joystick.mode;
  return window.innerWidth / Math.max(1, window.innerHeight) >= config.joystick.autoWideAspect ? "right" : "bottom";
}

function toDesignPoint(event, shell, config) {
  const rect = shell.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * config.game.designWidth,
    y: ((event.clientY - rect.top) / rect.height) * config.game.designHeight
  };
}
