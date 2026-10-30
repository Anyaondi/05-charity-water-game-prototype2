// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');



const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const leverButton = document.getElementById("leverButton");
const leverText = document.getElementById("leverText");
const leverHandle = document.getElementById("leverHandle");
const difficultySelect = document.getElementById("difficulty");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");
const endTitle = document.getElementById("endTitle");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const timerDisplay = document.getElementById("timer");
const roundDisplay = document.getElementById("round");
const targetScoreDisplay = document.getElementById("targetScore");
const finalScoreDisplay = document.getElementById("finalScore");
const progressBar = document.getElementById("progressBar");
const instructions = document.getElementById("instructions");
const trashArea = document.getElementById("trashArea");
const water = document.getElementById("water");

const buckets = document.querySelectorAll(".bucket");
const ropes = document.querySelectorAll(".rope");
const labels = document.querySelectorAll(".bucket-label");

// DIFFICULTY SETTINGS
const difficulties = {
  easy: { time: 90, target: 300, trash: 1 },
  normal: { time: 60, target: 500, trash: 2 },
  hard: { time: 30, target: 700, trash: 3 }
};

// GAME VARIABLES
let score = 0;
let highScore = 0;
let timeLeft = 90;
let round = 1;
let greenBucket = -1;
let gameRunning = false;
let bucketState = "raised";
let timerInterval = null;
let animationTimeout = null;
let settings = difficulties.easy;
let roundToken = 0;

try {
  highScore = Number(localStorage.getItem("highScore")) || 0;
} catch (error) {
  highScore = 0;
}

highScoreDisplay.textContent = highScore;

// SHOW DIFFICULTY SETTINGS
function previewDifficulty() {
  settings = difficulties[difficultySelect.value];
  timerDisplay.textContent = settings.time;
  targetScoreDisplay.textContent = settings.target;
}

difficultySelect.addEventListener("change", previewDifficulty);

// RANDOMLY SELECT GREEN BUCKET
function chooseGreenBucket() {
  let nextBucket;

  // Choose a different bucket from the previous round
  do {
    nextBucket = Math.floor(Math.random() * 3);
  } while (nextBucket === greenBucket);

  greenBucket = nextBucket;

  buckets.forEach((bucket, index) => {
    const isGreen = index === greenBucket;

    bucket.classList.toggle("green", isGreen);

    labels[index].textContent = isGreen
      ? "♻️ TRASH"
      : "💧 WATER";

    labels[index].classList.toggle("trash-label", isGreen);
  });
}

// START GAME
function startGame() {
  clearInterval(timerInterval);
  clearTimeout(animationTimeout);
  roundToken++;

  settings = difficulties[difficultySelect.value];

  score = 0;
  round = 1;
  timeLeft = settings.time;
  greenBucket = -1;
  gameRunning = true;
  bucketState = "raised";

  scoreDisplay.textContent = score;
  roundDisplay.textContent = round;
  timerDisplay.textContent = timeLeft;
  targetScoreDisplay.textContent = settings.target;
  progressBar.style.width = "0%";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  resetBuckets();
  chooseGreenBucket();
  createTrash();

  leverButton.disabled = false;
  leverText.textContent = "LOWER";
  leverHandle.textContent = "🔴";

  instructions.textContent =
    "Click the lever to lower all three buckets!";

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame(false, "Time is up! Try again!");
    }
  }, 1000);
}

// RESET BUCKET POSITIONS
function resetBuckets() {
  buckets.forEach(bucket => {
    bucket.classList.remove("lowered");
  });

  ropes.forEach(rope => {
    rope.classList.remove("lowered");
  });

  labels.forEach(label => {
    label.classList.remove("lowered");
  });
}

// CREATE TRASH IN WATER LANES
function createTrash() {
  trashArea.replaceChildren();

  const trashTypes = ["🦠", "🥫", "🧴", "🗑️", "🍂"];

  for (let lane = 0; lane < 3; lane++) {
    // Green lane starts clean
    if (lane === greenBucket) continue;

    for (let i = 0; i < settings.trash; i++) {
      const item = document.createElement("div");

      item.className = "trash";
      item.textContent = trashTypes[
        Math.floor(Math.random() * trashTypes.length)
      ];

      item.dataset.lane = lane;

      const position = getLaneCenter(lane);
      const offset = (i - (settings.trash - 1) / 2) * 25;

      item.style.left = `${position + offset}px`;
      item.style.top = `${8 + i * 34}px`;
      item.style.transform = "translateX(-50%)";

      trashArea.appendChild(item);
      enableTrashSwipe(item);
    }
  }
}

// GET HORIZONTAL CENTER OF A BUCKET
// Coordinates are relative to the trash area.
function getLaneCenter(lane) {
  const bucketRect = buckets[lane].getBoundingClientRect();
  const areaRect = trashArea.getBoundingClientRect();

  return bucketRect.left +
    bucketRect.width / 2 -
    areaRect.left;
}

// SWIPE TRASH INTO GREEN BUCKET
f
function enableTrashSwipe(item) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originalLeft = 0;
  let originalTop = 0;

  item.addEventListener("pointerdown", (event) => {
    if (!gameRunning || bucketState !== "lowered") return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;

    originalLeft = item.offsetLeft;
    originalTop = item.offsetTop;

    item.classList.add("dragging");
    item.setPointerCapture(event.pointerId);

    event.preventDefault();
  });

  // MAKE TRASH FOLLOW THE MOUSE OR FINGER
  item.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    item.style.left = `${originalLeft + moveX}px`;
    item.style.top = `${originalTop + moveY}px`;
  });

  // CHECK WHERE TRASH WAS DROPPED
  item.addEventListener("pointerup", (event) => {
    if (!dragging) return;

    dragging = false;
    item.classList.remove("dragging");

    if (!gameRunning || bucketState !== "lowered") return;

    const greenRect =
      buckets[greenBucket].getBoundingClientRect();

    const trashRect = item.getBoundingClientRect();

    const trashCenterX =
      trashRect.left + trashRect.width / 2;

    const greenCenterX =
      greenRect.left + greenRect.width / 2;

    // Allow a slightly larger drop area
    const dropDistance = Math.abs(
      trashCenterX - greenCenterX
    );

    const allowedDistance = Math.max(
      greenRect.width / 2 + 35,
      55
    );

    if (dropDistance <= allowedDistance) {
      // SUCCESS: TRASH REACHES GREEN BUCKET
      item.classList.add("removed");
      item.style.pointerEvents = "none";

      addPoints(20);

      instructions.textContent =
        "♻️ Great job! +20 points for collecting trash!";

      setTimeout(() => {
        item.remove();
      }, 200);

      if (score >= settings.target) {
        endGame(
          true,
          "Congratulations! You reached your goal!"
        );
      }

    } else {
      // FAILED DROP: RETURN TRASH TO ORIGINAL POSITION
      item.style.left = `${originalLeft}px`;
      item.style.top = `${originalTop}px`;

      instructions.textContent =
        "Move the trash into the GREEN bucket!";
    }
  });

  item.addEventListener("pointercancel", () => {
    if (!dragging) return;

    dragging = false;
    item.classList.remove("dragging");

    item.style.left = `${originalLeft}px`;
    item.style.top = `${originalTop}px`;
  });
}

// LEVER CONTROLS ALL THREE BUCKETS
function moveLever() {
  if (!gameRunning) return;

  if (bucketState === "raised") {
    lowerAllBuckets();
  } else if (bucketState === "lowered") {
    raiseAllBuckets();
  }
}

function lowerAllBuckets() {
  bucketState = "moving";
  leverButton.disabled = true;

  buckets.forEach(bucket => bucket.classList.add("lowered"));
  ropes.forEach(rope => rope.classList.add("lowered"));
  labels.forEach(label => label.classList.add("lowered"));

  instructions.textContent =
    "Swipe trash from the water lanes into the green bucket!";

  const token = roundToken;

  animationTimeout = setTimeout(() => {
    if (!gameRunning || token !== roundToken) return;

    bucketState = "lowered";
    leverButton.disabled = false;
    leverText.textContent = "RAISE";
    leverHandle.textContent = "🟢";
  }, 700);
}

function raiseAllBuckets() {
  if (!gameRunning) return;

  // Check whether trash remains in either water lane.
  const remainingTrash = Array.from(
    trashArea.querySelectorAll(".trash:not(.removed)")
  );

  if (remainingTrash.length > 0) {
    endGame(
      false,
      "Water contaminated! Clear all trash before raising the buckets."
    );
    return;
  }

  bucketState = "moving";
  leverButton.disabled = true;

  resetBuckets();

  // Two water buckets earn 50 points each.
  addPoints(100);

  if (score >= settings.target) {
    endGame(true, "You reached your clean water goal!");
    return;
  }

  instructions.textContent =
    "💧 +100 points! Both water buckets collected clean water!";

  const token = roundToken;

  animationTimeout = setTimeout(() => {
    if (!gameRunning || token !== roundToken) return;

    nextRound();
  }, 700);
}

// START THE NEXT ROUND
function nextRound() {
  round++;
  roundDisplay.textContent = round;

  bucketState = "raised";

  // Assign green to a different bucket.
  chooseGreenBucket();

  // Create fresh trash in the two water lanes.
  createTrash();

  leverText.textContent = "LOWER";
  leverHandle.textContent = "🔴";
  leverButton.disabled = false;

  instructions.textContent =
    `Round ${round}! The green bucket has moved. Lower all buckets!`;
}

// UPDATE SCORE AND PROGRESS BAR
function addPoints(points) {
  score += points;
  scoreDisplay.textContent = score;

  const progress = Math.min(
    (score / settings.target) * 100,
    100
  );

  progressBar.style.width = `${progress}%`;
  playSound();
}

// SIMPLE COLLECTION SOUND
function playSound() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      500, context.currentTime
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      180, context.currentTime + 0.2
    );

    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001, context.currentTime + 0.25
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
    oscillator.onended = () => context.close();
  } catch (error) {
    console.log("Audio unavailable");
  }
}

// END GAME
function endGame(won, message) {
  if (!gameRunning) return;

  gameRunning = false;
  bucketState = "finished";
  roundToken++;

  clearInterval(timerInterval);
  clearTimeout(animationTimeout);

  leverButton.disabled = true;

  endTitle.textContent = won ? "You Win! 🎉" : "Game Over!";
  gameOverMessage.textContent = message;
  finalScoreDisplay.textContent = score;

  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;

    try {
      localStorage.setItem("highScore", highScore);
    } catch (error) {
      console.log("High score could not be saved");
    }
  }

  gameOverScreen.classList.remove("hidden");
}

// RESTART TO DIFFICULTY SCREEN
function restartGame() {
  clearInterval(timerInterval);
  clearTimeout(animationTimeout);
  roundToken++;

  gameRunning = false;
  bucketState = "raised";

  resetBuckets();
  trashArea.replaceChildren();

  leverButton.disabled = true;
  leverText.textContent = "LOWER";
  leverHandle.textContent = "🔴";

  score = 0;
  scoreDisplay.textContent = 0;
  roundDisplay.textContent = 1;
  progressBar.style.width = "0%";

  previewDifficulty();

  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");

  instructions.textContent =
    "Select a difficulty and press Play!";
}

// EVENT LISTENERS
playButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
leverButton.addEventListener("click", moveLever);

// INITIALIZE
previewDifficulty();
