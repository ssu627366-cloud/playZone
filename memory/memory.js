const images = [
  "../image/emoji1.png",
  "../image/emoji2.png",
  "../image/emoji3.png",
  "../image/emoji4.png",
  "../image/emoji5.png",
  "../image/emoji6.png",
  "../image/emoji7.png",
  "../image/emoji8.png",
  "../image/emoji9.png",
  "../image/emoji10.png",
  "../image/emoji11.png",
  "../image/emoji12.png",
  "../image/emoji13.png",
  "../image/emoji14.png",
  "../image/emoji15.png",
  "../image/emoji17.png",
  "../image/emoji18.png",
  "../image/emojji16.png",
]; //18images
let gridSize = 4;
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let moves = 0;
let score = 0;
let seconds = 0;
let timer = null;
let gameStarted = false;
const gameBoard = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const movesText = document.getElementById("moves");
const timeText = document.getElementById("time");
const newGameButton = document.getElementById("new-game-btn");
const winModal = document.getElementById("win-modal");
const playAgainButton = document.getElementById("play-again-btn");
const finalScore = document.getElementById("final-score");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");

/* image*/
function getImagePool() {
  if (gridSize === 4) {
    return images.slice(0, 8);
  }

  return images.slice(0, 18);
}

/* shuffle*/
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
}

/*creat card*/
function createCards() {
  gameBoard.innerHTML = "";
  let imagePool = getImagePool();
  let cardImages = [...imagePool, ...imagePool]; //create pair
  if (gridSize === 5) {
    cardImages.push(null);
  }
  shuffle(cardImages);
  gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr);`;
  cardImages.forEach((image, index) => {
    const card = document.createElement("div");
    if (image === null) {
      card.classList.add("empty-card");
      gameBoard.appendChild(card);
      return;
    }
    card.className = "card";
    card.dataset.image = image;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <span>🧠</span>
        </div>

        <div class="card-back">
          <img src="${image}" alt="Memory card" />
        </div>
      </div>`;
    card.addEventListener("click", flipCard);
    gameBoard.appendChild(card);
  });
}

/* ================= FLIP CARD ================= */

function flipCard() {
  if (lockBoard || this === firstCard || this.classList.contains("matched")) {
    // 1. Same card twice,Third card while checking
    return;
  }
  if (!gameStarted) {
    startTimer();
    gameStarted = true;
  }

  /*
        Flip card
    */

  this.classList.add("flipped");

  /*
        First card
    */

  if (!firstCard) {
    firstCard = this;

    return;
  }

  /*
        Second card
    */

  secondCard = this;

  moves++;

  movesText.textContent = moves;

  /*
        Check match
    */

  checkMatch();
}

/* ================= CHECK MATCH ================= */

function checkMatch() {
  const isMatch = firstCard.dataset.image === secondCard.dataset.image;

  if (isMatch) {
    /*
            MATCH
        */

    disableCards();
  } else {
    /*
            NOT MATCH
        */

    unflipCards();
  }
}

/* ================= MATCH ================= */

function disableCards() {
  firstCard.classList.add("matched");

  secondCard.classList.add("matched");

  /*
        Score
    */

  score += 20;

  scoreText.textContent = score;

  /*
        Matched pair
    */

  matchedPairs++;

  /*
        Reset
    */

  resetBoard();

  /*
        Check Win
    */

  const totalPairs = getImagePool().length;

  if (matchedPairs === totalPairs) {
    setTimeout(gameWon, 500);
  }
}

/* ================= NOT MATCH ================= */

function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.classList.remove("flipped");

    secondCard.classList.remove("flipped");

    resetBoard();
  }, 800);
}

/* ================= RESET BOARD ================= */

function resetBoard() {
  [firstCard, secondCard] = [null, null];

  lockBoard = false;
}

/* ================= TIMER ================= */

function startTimer() {
  /*
        Prevent multiple timers
    */
  if (timer !== null) {
    return;
  }

  timer = setInterval(() => {
    seconds++;

    updateTime();
  }, 1000);
}

/* ================= UPDATE TIME ================= */

function updateTime() {
  const minutes = Math.floor(seconds / 60);

  const secs = seconds % 60;

  timeText.textContent =
    String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

/* ================= STOP TIMER ================= */

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

/* ================= GAME WON ================= */

function gameWon() {
  stopTimer();

  finalScore.textContent = score;

  finalMoves.textContent = moves;

  finalTime.textContent = timeText.textContent;

  winModal.classList.add("show");
}

/* ================= START GAME ================= */

function startGame() {
  /*
        Stop old timer
    */

  stopTimer();

  /*
        Reset variables
    */

  firstCard = null;

  secondCard = null;

  lockBoard = false;

  matchedPairs = 0;

  moves = 0;

  score = 0;

  seconds = 0;

  gameStarted = false;

  /*
        Reset UI
    */

  scoreText.textContent = "0";

  movesText.textContent = "0";

  timeText.textContent = "00:00";

  /*
        Hide modal
    */

  winModal.classList.remove("show");

  /*
        Create new cards
    */

  createCards();
}

/* ================= GRID BUTTON ================= */

const gridButtons = document.querySelectorAll(".grid-btn");

gridButtons.forEach((button) => {
  button.addEventListener("click", () => {
    /*
                    Remove active
                */

    gridButtons.forEach((btn) => btn.classList.remove("active"));

    /*
                    Add active
                */

    button.classList.add("active");

    /*
                    Get grid size
                */

    gridSize = Number(button.dataset.size);

    /*
                    New game
                */

    startGame();
  });
});

/* ================= DIFFICULTY ================= */

const difficultyButtons = document.querySelectorAll(".difficulty-btn");

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    difficultyButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
  });
});

/* ================= NEW GAME ================= */

newGameButton.addEventListener("click", startGame);

/* ================= PLAY AGAIN ================= */

playAgainButton.addEventListener("click", startGame);

/* ================= START ================= */
startGame();
function goHome() {
  window.location.href = "../chooseGames.html";
}
