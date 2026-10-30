// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highScoreDisplay = document.getElementById("highScore");
const finalScoreDisplay = document.getElementById("finalScore");

const instructions = document.getElementById("instructions");
const trashArea = document.getElementById("trashArea");

const buckets = document.querySelectorAll(".bucket");
const ropes = document.querySelectorAll(".rope");

// GAME VARIABLES
let score = 0;
let time = 0;
let gameRunning = false;
let timerInterval = null;
let activeBucket = null;
let bucketStartTime = 0;
let bucketState = "idle";
let trash = [];

// Load saved high score
let highScore = 0;

try {
  highScore = Number(localStorage.getItem("highScore")) || 0;
} catch (error) {
  highScore = 0;
}

highScoreDisplay.textContent = highScore;

// START GAME
function startGame() {
  score = 0;
  time = 0;
  gameRunning = true;
  activeBucket = null;
  bucketState = "idle";

  clearInterval(timerInterval);

  scoreDisplay.textContent = score;
  timerDisplay.textContent = time;

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  resetBuckets();
  createTrash();

  instructions.textContent =
    "Tap a bucket to lower it into the water!";

  timerInterval = setInterval(() => {
    if (gameRunning) {
      time++;
      timerDisplay.textContent = time;
    }
  }, 1000);
}

// RESET BUCKETS
function resetBuckets() {
  buckets.forEach(bucket => {
    bucket.classList.remove("lowered", "filled");
    bucket.disabled = false;
  });

  ropes.forEach(rope => {
    rope.classList.remove("lowered");
  });
}

// CREATE TRASH
function createTrash() {
  trashArea.innerHTML = "";
  trash = [];

  const trashTypes = ["🦠", "🗑️", "🥫", "🧴", "🍂"];

  // Place trash near the water collection lanes
  const positions = [16, 50, 84];

  positions.forEach((position, index) => {
    const item = document.createElement("div");

    item.classList.add("trash");
    item.textContent = trashTypes[
      Math.floor(Math.random() * trashTypes.length)
    ];

    item.style.left = `calc(${position}% - 18px)`;
    item.style.top = `${10 + (index % 2) * 30}px`;

    item.dataset.lane = index;
    item.dataset.removed = "false";

    trashArea.appendChild(item);
    trash.push(item);

    enableSwipe(item);
  });
}

// ENABLE SWIPE TO REMOVE TRASH
function enableSwipe(item) {
  let startX = 0;
  let startY = 0;

  item.addEventListener("pointerdown", event => {
    if (!gameRunning) return;

    startX = event.clientX;
    startY = event.clientY;

    item.setPointerCapture(event.pointerId);
  });

  item.addEventListener("pointerup", event => {
    if (!gameRunning) return;

    const distanceX = event.clientX - startX;
    const distanceY = event.clientY - startY;

    const distance = Math.hypot(distanceX, distanceY);

    if (distance > 35) {
      item.dataset.removed = "true";
      item.classList.add("removed");

      instructions.textContent =
        "Great! Keep clearing trash to protect the water.";
    }
  });
}

// LOWER OR RAISE BUCKET
function moveBucket(index) {
  if (!gameRunning) return;

  // Only one bucket can be active at a time
  if (activeBucket !== null && activeBucket !== index) {
    return;
  }

  const bucket = buckets[index];
  const rope = ropes[index];

  if (bucketState === "idle") {
    activeBucket = index;
    bucketState = "lowering";
    bucketStartTime = Date.now();

    bucket.classList.add("lowered");
    rope.classList.add("lowered");

    instructions.textContent =
      "Swipe trash away, then tap the bucket again!";

    // Wait for the lowering animation
    setTimeout(() => {
      if (gameRunning && activeBucket === index &&
          bucketState === "lowering") {
        bucketState = "collecting";
        bucket.classList.add("filled");
      }
    }, 800);

  } else if (bucketState === "collecting") {
    checkWater(index);
  }
}

// CHECK WATER FOR CONTAMINATION
function checkWater(index) {
  const contaminated = trash.some(item => {
    return Number(item.dataset.lane) === index &&
           item.dataset.removed === "false";
  });

  if (contaminated) {
    endGame();
    return;
  }

  // Calculate time spent collecting
  const collectionTime = (
    Date.now() - bucketStartTime
  ) / 1000;

  // Faster collection earns more points
  const points = Math.max(
    10,
    Math.round(100 / Math.max(collectionTime, 0.5))
  );

  score += points;
  scoreDisplay.textContent = score;

  playWaterSound();

  const bucket = buckets[index];
  const rope = ropes[index];

  bucketState = "raising";

  bucket.classList.remove("lowered");
  rope.classList.remove("lowered");

  instructions.textContent =
    `Clean water collected! +${points} points!`;

  setTimeout(() => {
    if (!gameRunning) return;

    bucket.classList.remove("filled");

    activeBucket = null;
    bucketState = "idle";

    // Generate a new round of trash
    createTrash();

    instructions.textContent =
      "Choose another bucket and collect more water!";
  }, 800);
}

// WATER SOUND EFFECT
function playWaterSound() {
  // Simple splash-like sound using Web Audio API
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      500, audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      150, audioContext.currentTime + 0.25
    );

    gainNode.gain.setValueAtTime(
      0.15, audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001, audioContext.currentTime + 0.3
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);

    oscillator.onended = () => audioContext.close();
  } catch (error) {
    console.log("Sound unavailable");
  }
}

// GAME OVER
function endGame() {
  gameRunning = false;
  bucketState = "idle";

  clearInterval(timerInterval);

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

  instructions.textContent =
    "Oh no! Trash contaminated your bucket!";

  gameOverScreen.classList.remove("hidden");
}

// EVENT LISTENERS
playButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

buckets.forEach((bucket, index) => {
  bucket.addEventListener("click", () => {
    moveBucket(index);
  });
});
