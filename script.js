// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');


const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const difficultySelect = document.getElementById("difficulty");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highScoreDisplay = document.getElementById("highScore");
const finalScoreDisplay = document.getElementById("finalScore");
const targetScoreDisplay = document.getElementById("targetScore");
const progressBar = document.getElementById("progressBar");

const instructions = document.getElementById("instructions");
const trashArea = document.getElementById("trashArea");

const buckets = document.querySelectorAll(".bucket");
const ropes = document.querySelectorAll(".rope");

// DIFFICULTY SETTINGS
const difficulties = {
  easy: {
    time: 90,
    target: 300,
    trashPerLane: 1
  },
  normal: {
    time: 60,
    target: 500,
    trashPerLane: 2
  },
  hard: {
    time: 30,
    target: 700,
    trashPerLane: 3
  }
};

// GAME VARIABLES
let score = 0;
let timeLeft = 90;
let gameRunning = false;
let timerInterval = null;
let animationTimeout = null;
let activeBucket = null;
let bucketState = "idle";
let bucketStartTime = 0;
let currentDifficulty = difficulties.easy;

let highScore = 0;

try {
  highScore = Number(localStorage.getItem("highScore")) || 0;
} catch (error) {
  console.log("Local storage unavailable.");
}

highScoreDisplay.textContent = highScore;

// UPDATE DIFFICULTY PREVIEW
function updateDifficultyPreview() {
  const settings = difficulties[difficultySelect.value];

  timerDisplay.textContent = settings.time;
  targetScoreDisplay.textContent = settings.target;
}

difficultySelect.addEventListener(
  "change",
  updateDifficultyPreview
);

// START GAME
function startGame() {
  clearInterval(timerInterval);
  clearTimeout(animationTimeout);

  currentDifficulty = difficulties[difficultySelect.value];

  score = 0;
  timeLeft = currentDifficulty.time;
  gameRunning = true;
  activeBucket = null;
  bucketState = "idle";

  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  targetScoreDisplay.textContent = currentDifficulty.target;
  progressBar.style.width = "0%";

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  resetBuckets();
  createTrash();

  instructions.textContent =
    "Tap a bucket to lower it into the water!";

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame(false, "Time is up! Try again!");
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

// CREATE TRASH FOR EACH WELL
function createTrash() {
  trashArea.replaceChildren();

  const trashTypes = ["🦠", "🗑️", "🥫", "🧴", "🍂"];
  const positions = [16, 50, 84];

  positions.forEach((position, lane) => {
    for (
      let i = 0;
      i < currentDifficulty.trashPerLane;
      i++
    ) {
      const item = document.createElement("div");

      item.classList.add("trash");

      item.textContent = trashTypes[
        Math.floor(Math.random() * trashTypes.length)
      ];

      const offset = (
        i - (currentDifficulty.trashPerLane - 1) / 2
      ) * 5;

      item.style.left =
        `calc(${position + offset}% - 18px)`;

      item.style.top = `${8 + i * 32}px`;

      item.dataset.lane = lane;

      trashArea.appendChild(item);

      enableSwipe(item);
    }
  });
}

// SWIPE TRASH TO REMOVE IT
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

    const distance = Math.hypot(
      distanceX,
      distanceY
    );

    if (distance > 35) {
      // Fade out the trash
      item.classList.add("removed");

      // Remove the element from the DOM
      setTimeout(() => {
        item.remove();
      }, 300);

      instructions.textContent =
        "Great job! You removed some trash!";
    }
  });
}

// LOWER AND RAISE BUCKETS
function moveBucket(index) {
  if (!gameRunning) return;

  if (
    activeBucket !== null &&
    activeBucket !== index
  ) {
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
      "Swipe away trash, then tap again!";

    animationTimeout = setTimeout(() => {
      if (
        gameRunning &&
        activeBucket === index &&
        bucketState === "lowering"
      ) {
        bucketState = "collecting";
        bucket.classList.add("filled");

        instructions.textContent =
          "Tap the bucket again to collect water!";
      }
    }, 800);

  } else if (bucketState === "collecting") {
    checkWater(index);
  }
}

// CHECK IF WATER IS CLEAN
function checkWater(index) {
  const contaminated = Array.from(
    trashArea.querySelectorAll(".trash")
  ).some(item => {
    return (
      Number(item.dataset.lane) === index &&
      !item.classList.contains("removed")
    );
  });

  if (contaminated) {
    endGame(
      false,
      "Oh no! Trash contaminated your bucket!"
    );
    return;
  }

  // Calculate points based on speed
  const collectionTime = (
    Date.now() - bucketStartTime
  ) / 1000;

  const points = Math.max(
    10,
    Math.round(100 / Math.max(collectionTime, 0.5))
  );

  score += points;
  scoreDisplay.textContent = score;

  // Update progress bar
  const progress = Math.min(
    (score / currentDifficulty.target) * 100,
    100
  );

  progressBar.style.width = `${progress}%`;

  playWaterSound();

  // CHECK WIN CONDITION
  if (score >= currentDifficulty.target) {
    endGame(
      true,
      "Congratulations! You reached your water goal!"
    );
    return;
  }

  const bucket = buckets[index];
  const rope = ropes[index];

  bucketState = "raising";

  bucket.classList.remove("lowered");
  rope.classList.remove("lowered");

  instructions.textContent =
    `Clean water collected! +${points} points!`;

  animationTimeout = setTimeout(() => {
    if (!gameRunning) return;

    bucket.classList.remove("filled");

    activeBucket = null;
    bucketState = "idle";

    createTrash();

    instructions.textContent =
      "Choose another bucket and collect more water!";
  }, 800);
}

// WATER SOUND EFFECT
function playWaterSound() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      500,
      audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      150,
      audioContext.currentTime + 0.25
    );

    gainNode.gain.setValueAtTime(
      0.15,
      audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.3
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);

    oscillator.onended = () => audioContext.close();
  } catch (error) {
    console.log("Sound unavailable.");
  }
}

// WIN OR LOSE
function endGame(won, message) {
  gameRunning = false;
  bucketState = "idle";
  activeBucket = null;

  clearInterval(timerInterval);
  clearTimeout(animationTimeout);

  finalScoreDisplay.textContent = score;
  gameOverMessage.textContent = message;

  const heading = gameOverScreen.querySelector("h2");
  heading.textContent = won ? "You Win! 🎉" : "Game Over!";

  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;

    try {
      localStorage.setItem("highScore", highScore);
    } catch (error) {
      console.log("High score could not be saved.");
    }
  }

  instructions.textContent = won
    ? "Amazing! You collected enough clean water!"
    : "Try again and protect the water!";

  gameOverScreen.classList.remove("hidden");
}

// BUTTON EVENT LISTENERS
playButton.addEventListener("click", startGame);

// Return to difficulty selection on replay
restartButton.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");

  resetBuckets();
  trashArea.replaceChildren();

  score = 0;
  scoreDisplay.textContent = score;
  progressBar.style.width = "0%";

  updateDifficultyPreview();

  instructions.textContent =
    "Choose your difficulty and press Play!";
});

buckets.forEach((bucket, index) => {
  bucket.addEventListener("click", () => {
    moveBucket(index);
  });
});

// INITIAL DISPLAY
updateDifficultyPreview();
