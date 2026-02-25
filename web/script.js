const gameArea = document.getElementById("gameArea");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const levelEl = document.getElementById("level");
const targetEl = document.getElementById("target");
const goalTextEl = document.getElementById("goalText");
const phaseTextEl = document.getElementById("phaseText");
const startBtn = document.getElementById("startBtn");
const soundBtn = document.getElementById("soundBtn");

let score = 0;
let totalScore = 0;
let level = 1;
let currentLevelIndex = 0;
let remainingTime = 30;
let gameRunning = false;
let timerId = null;
let balloonSpawnerId = null;
let transitionId = null;
let spawnIntervalMs = 600;
let spawnCount = 0;
let soundEnabled = true;
let audioCtx = null;
let lastTouchEndAt = 0;
let layoutTimerId = null;

const LEVELS = [
  { target: 18, time: 30, spawnInterval: 640, monsterEvery: 5 },
  { target: 30, time: 28, spawnInterval: 570, monsterEvery: 5 },
  { target: 44, time: 26, spawnInterval: 510, monsterEvery: 4 },
  { target: 60, time: 24, spawnInterval: 450, monsterEvery: 4 },
  { target: 78, time: 22, spawnInterval: 400, monsterEvery: 3 },
  { target: 98, time: 20, spawnInterval: 350, monsterEvery: 3 },
];

const balloonColors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];
const monsterTypes = [
  { name: "dino", color: "#22d3ee" },
  { name: "goblin", color: "#84cc16" },
  { name: "troll", color: "#06b6d4" },
  { name: "ghost", color: "#e2e8f0" },
  { name: "dragon", color: "#f97316" },
  { name: "ostrich", color: "#a855f7" },
];
const monsterBonus = 5;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyViewportHeight() {
  const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
  document.documentElement.style.setProperty("--app-vh", `${vh}px`);
}

function clearGameTimers() {
  clearInterval(timerId);
  clearInterval(balloonSpawnerId);
  clearInterval(transitionId);
}

function setPhaseText(text) {
  if (phaseTextEl) phaseTextEl.textContent = text;
}

function getCurrentLevelConfig() {
  return LEVELS[currentLevelIndex];
}

function refreshGoalUI() {
  const config = getCurrentLevelConfig();
  if (!config) return;

  levelEl.textContent = String(level);
  targetEl.textContent = String(config.target);
  goalTextEl.textContent = `Goal: Reach ${config.target} points in ${config.time} seconds.`;
}

function handleLayoutChange() {
  applyViewportHeight();
  if (!gameRunning) return;

  clearTimeout(layoutTimerId);
  layoutTimerId = setTimeout(() => {
    clearGameArea();
    createBalloon();
    restartSpawner();
  }, 140);
}

function installGestureGuards() {
  document.addEventListener(
    "dblclick",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEndAt < 320) {
        event.preventDefault();
      }
      lastTouchEndAt = now;
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playPopSound() {
  if (!soundEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(420, now);
  oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.07);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function playMonsterSound() {
  if (!soundEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(240, now);
  oscillator.frequency.exponentialRampToValueAtTime(510, now + 0.07);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}

function spawnSparks(x, y, color) {
  const sparkCount = 9;
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.background = color;

    const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.35;
    const distance = randomBetween(24, 54);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    spark.style.setProperty("--dx", `${dx}px`);
    spark.style.setProperty("--dy", `${dy}px`);
    spark.addEventListener("animationend", () => spark.remove());
    gameArea.appendChild(spark);
  }
}

function showBonusText(x, y, points) {
  const bonus = document.createElement("span");
  bonus.className = "bonus-text";
  bonus.style.left = `${x}px`;
  bonus.style.top = `${y}px`;
  bonus.textContent = `+${points}`;
  bonus.addEventListener("animationend", () => bonus.remove());
  gameArea.appendChild(bonus);
}

function restartSpawner() {
  clearInterval(balloonSpawnerId);
  balloonSpawnerId = setInterval(createBalloon, spawnIntervalMs);
}

function shouldSpawnMonster() {
  const config = getCurrentLevelConfig();
  spawnCount += 1;
  return spawnCount % config.monsterEvery === 0;
}

function createBalloon() {
  if (!gameRunning) return;

  const balloon = document.createElement("button");
  const isMonster = shouldSpawnMonster();
  const monsterType = monsterTypes[randomBetween(0, monsterTypes.length - 1)];

  balloon.className = isMonster ? `monster-target monster-${monsterType.name}` : "balloon";
  balloon.setAttribute("aria-label", isMonster ? "Mini monster" : "Balloon");
  const targetWidth = isMonster ? 78 : 58;
  const maxLeft = Math.max(8, gameArea.clientWidth - (targetWidth + 8));
  balloon.style.left = `${randomBetween(8, maxLeft)}px`;
  balloon.style.bottom = "-82px";
  balloon.dataset.popColor = monsterType.color;

  if (isMonster) {
    balloon.style.background = "transparent";
  } else {
    const color = balloonColors[randomBetween(0, balloonColors.length - 1)];
    balloon.style.background = color;
    balloon.dataset.popColor = color;
    balloon.style.backgroundImage = "none";
    balloon.textContent = "";
  }

  const maxDuration = Math.max(2.6, 6.2 - currentLevelIndex * 0.42);
  const minDuration = Math.max(1.8, maxDuration - 1.8);
  balloon.style.animationDuration = `${
    randomBetween(Math.floor(minDuration * 10), Math.floor(maxDuration * 10)) / 10
  }s`;

  balloon.addEventListener("click", () => {
    if (!gameRunning) return;

    const areaRect = gameArea.getBoundingClientRect();
    const balloonRect = balloon.getBoundingClientRect();
    const centerX = balloonRect.left - areaRect.left + balloonRect.width / 2;
    const centerY = balloonRect.top - areaRect.top + balloonRect.height / 2;

    const gainedPoints = isMonster ? monsterBonus : 1;
    score += gainedPoints;
    totalScore += gainedPoints;
    scoreEl.textContent = String(score);

    if (isMonster) {
      playMonsterSound();
      showBonusText(centerX, centerY, gainedPoints);
    } else {
      playPopSound();
    }

    spawnSparks(centerX, centerY, balloon.dataset.popColor || "#ffffff");
    balloon.classList.add("pop");
    setTimeout(() => balloon.remove(), 160);
  });

  balloon.addEventListener("animationend", () => {
    balloon.remove();
  });

  gameArea.appendChild(balloon);
}

function clearGameArea() {
  gameArea.querySelectorAll(".balloon, .monster-target, .spark, .bonus-text").forEach((node) => node.remove());
}

function scheduleNextLevel() {
  gameRunning = false;
  clearGameTimers();
  clearGameArea();

  let countdown = 3;
  setPhaseText(`Level ${level} complete. Next level in ${countdown}...`);
  startBtn.disabled = true;
  startBtn.textContent = "Preparing next level...";

  transitionId = setInterval(() => {
    countdown -= 1;

    if (countdown <= 0) {
      clearInterval(transitionId);
      transitionId = null;
      startLevel(currentLevelIndex + 1);
      return;
    }

    setPhaseText(`Level ${level} complete. Next level in ${countdown}...`);
  }, 1000);
}

function handleLevelTimeout() {
  const config = getCurrentLevelConfig();
  gameRunning = false;
  clearGameTimers();
  clearGameArea();

  if (score >= config.target) {
    const isFinalLevel = currentLevelIndex === LEVELS.length - 1;

    if (isFinalLevel) {
      setPhaseText(`Mission complete. Final score: ${totalScore}.`);
      startBtn.disabled = false;
      startBtn.textContent = "Play Again";
      alert(`You win! Final score: ${totalScore}.`);
    } else {
      scheduleNextLevel();
    }
    return;
  }

  setPhaseText(`Game Over. Needed ${config.target}, got ${score}.`);
  startBtn.disabled = false;
  startBtn.textContent = "Retry Run";
  alert(`Game Over. You needed ${config.target} points but reached ${score}.`);
}

function startLevel(nextLevelIndex) {
  currentLevelIndex = nextLevelIndex;
  level = currentLevelIndex + 1;

  const config = getCurrentLevelConfig();
  if (!config) return;

  score = 0;
  remainingTime = config.time;
  spawnIntervalMs = config.spawnInterval;
  spawnCount = 0;
  gameRunning = true;

  scoreEl.textContent = "0";
  timeEl.textContent = String(remainingTime);
  refreshGoalUI();

  startBtn.disabled = true;
  startBtn.textContent = "Game in progress...";
  setPhaseText(`Level ${level} started. Hit the target score.`);

  clearGameArea();
  createBalloon();
  restartSpawner();

  clearInterval(timerId);
  timerId = setInterval(() => {
    remainingTime -= 1;
    timeEl.textContent = String(remainingTime);

    if (remainingTime <= 0) {
      handleLevelTimeout();
    }
  }, 1000);
}

function startGame() {
  ensureAudioContext();
  clearGameTimers();

  totalScore = 0;
  startLevel(0);
}

startBtn.addEventListener("click", startGame);
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
  if (soundEnabled) ensureAudioContext();
});

refreshGoalUI();
handleLayoutChange();
installGestureGuards();
window.addEventListener("resize", handleLayoutChange);
window.addEventListener("orientationchange", handleLayoutChange);
window.visualViewport?.addEventListener("resize", handleLayoutChange);

if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";

  window.addEventListener("load", () => {
    if (isLocalhost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((reg) => reg.unregister())))
        .catch(() => {});

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  });
}
