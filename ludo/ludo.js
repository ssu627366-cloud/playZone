// ===============================
// LUDO GAME
// P1 = Human
// P2, P3, P4 = Auto
// ===============================

// ===============================
// PLAYERS
// ===============================

const players = [
  {
    name: "Player 1",
    color: "red",
    className: "red-token",

    // Start cell
    start: 41,

    // Red middle lane
    home: ["r1", "r2", "r3", "r4", "r5"],

    tokens: [],
  },

  {
    name: "Player 2",
    color: "blue",
    className: "blue-token",

    start: 2,

    // Blue middle lane
    home: ["b1", "b2", "b3", "b4", "b5"],

    tokens: [],
  },

  {
    name: "Player 3",
    color: "green",
    className: "green-token",

    start: 28,

    // Green middle lane
    home: ["g1", "g2", "g3", "g4", "g5"],

    tokens: [],
  },

  {
    name: "Player 4",
    color: "yellow",
    className: "yellow-token",

    start: 15,

    // Yellow middle lane
    home: ["y1", "y2", "y3", "y4", "y5"],

    tokens: [],
  },
];

// ===============================
// GAME VARIABLES
// ===============================

let currentPlayer = 0;
let diceValue = 0;
let gameStarted = false;
let isRolling = false;

// ===============================
// HTML
// ===============================

const rollBtn = document.getElementById("rollBtn");

const startBtn = document.getElementById("startBtn");

const resetBtn = document.getElementById("resetBtn");

const dice = document.getElementById("dice");

const cells = document.querySelectorAll("[data-cell]");

// ===============================
// DICE
// ===============================

const diceFaces = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

// ===============================
// CREATE TOKENS
// ===============================

function initializeTokens() {
  players.forEach((player) => {
    player.tokens = [];

    for (let i = 0; i < 4; i++) {
      player.tokens.push({
        index: i,

        // Base
        position: -1,

        // How many steps moved
        steps: 0,

        // Middle lane index
        homeStep: -1,

        // base / board / home / finished
        state: "base",

        finished: false,
      });
    }
  });
}

// ===============================
// ROLL DICE
// ===============================

function rollDice() {
  if (!gameStarted || isRolling) {
    return;
  }

  // Only P1 can click
  if (currentPlayer !== 0) {
    return;
  }

  playTurn();
}

// ===============================
// PLAYER TURN
// ===============================
function playTurn() {
  if (isRolling) {
    return;
  }

  isRolling = true;

  rollBtn.disabled = true;

  // 🎲 Player 1 Dice
  if (currentPlayer === 0) {
    // 50% chance = 6
    if (Math.random() < 0.5) {
      diceValue = 6;
    } else {
      diceValue = Math.floor(Math.random() * 5) + 1;
    }
  } else {
    // Auto players = normal random
    diceValue = Math.floor(Math.random() * 6) + 1;
  }

  diceAnimation(() => {
    movePlayerToken();
  });
}

// ===============================
// DICE ANIMATION
// ===============================

function diceAnimation(callback) {
  let count = 0;

  const animation = setInterval(() => {
    const random = Math.floor(Math.random() * 6) + 1;

    dice.textContent = diceFaces[random];

    count++;

    if (count >= 8) {
      clearInterval(animation);

      dice.textContent = diceFaces[diceValue];

      // 🎲 Show dice result
      setTimeout(() => {
        alert(`${players[currentPlayer].name} က ${diceValue} ကျပါတယ် 🎲`);

        callback();
      }, 400);
    }
  }, 80);
}
// ===============================
// MOVE TOKEN
// ===============================

function movePlayerToken() {
  const player = players[currentPlayer];

  const token = findMovableToken(player, diceValue);

  // No token
  if (token === null) {
    console.log(`${player.name} cannot move`);

    finishTurn();

    return;
  }

  // =============================
  // BASE
  // =============================

  if (token.state === "base") {
    if (diceValue === 6) {
      token.state = "board";

      // OUT = start cell
      token.steps = 0;

      token.position = player.start;

      console.log(`${player.name} OUT at ${player.start}`);
    }
  }

  // =============================
  // BOARD
  // =============================
  else if (token.state === "board") {
    moveOnBoard(player, token);
  }

  // =============================
  // MIDDLE LANE
  // =============================
  else if (token.state === "home") {
    moveInHome(player, token);
  }

  renderTokens();

  checkWinner(player);

  // =============================
  // 6 = EXTRA TURN
  // =============================

  if (diceValue === 6) {
    isRolling = false;

    if (currentPlayer === 0) {
      rollBtn.disabled = false;
    } else {
      setTimeout(autoTurn, 800);
    }

    return;
  }

  finishTurn();
}

// ===============================
// BOARD MOVEMENT
// ===============================

function moveOnBoard(player, token) {
  const newSteps = token.steps + diceValue;

  // =================================
  // 51 STEPS NOT COMPLETED
  // =================================

  if (newSteps <= 51) {
    token.steps = newSteps;

    // Actual board cell
    token.position = (player.start + token.steps) % 52;

    console.log(`${player.name} → cell ${token.position}`);

    return;
  }

  // =================================
  // ENTER MIDDLE LANE
  // =================================

  const homeStep = newSteps - 52;

  // Middle lane has 5 cells
  if (homeStep < player.home.length) {
    token.state = "home";

    token.homeStep = homeStep;

    token.position = player.home[homeStep];

    console.log(`${player.name} entered ${token.position}`);

    return;
  }

  // =================================
  // FINISH
  // =================================

  if (homeStep === player.home.length) {
    token.state = "finished";

    token.finished = true;

    token.position = -1;

    console.log(`${player.name} token finished 🏆`);
  }
}

// ===============================
// MOVE IN MIDDLE LANE
// ===============================

function moveInHome(player, token) {
  const newHomeStep = token.homeStep + diceValue;

  // Too far
  if (newHomeStep > player.home.length) {
    console.log("Cannot move - exact number required");

    return;
  }

  // Finish
  if (newHomeStep === player.home.length) {
    token.state = "finished";

    token.finished = true;

    token.position = -1;

    console.log(`${player.name} finished token 🏆`);

    return;
  }

  // Move inside middle lane
  token.homeStep = newHomeStep;

  token.position = player.home[newHomeStep];
}

// ===============================
// FIND MOVABLE TOKEN
// ===============================

function findMovableToken(player, dice) {
  // 6 → Base token first
  if (dice === 6) {
    const baseToken = player.tokens.find((token) => token.state === "base");

    if (baseToken) {
      return baseToken;
    }
  }

  // Middle lane token
  const homeToken = player.tokens.find((token) => token.state === "home");

  if (homeToken) {
    return homeToken;
  }

  // Board token
  const boardToken = player.tokens.find((token) => token.state === "board");

  if (boardToken) {
    return boardToken;
  }

  return null;
}

// ===============================
// RENDER TOKENS
// ===============================

function renderTokens() {
  // Remove moving tokens
  cells.forEach((cell) => {
    cell.querySelectorAll(".moving-token").forEach((token) => {
      token.remove();
    });
  });

  // Render
  players.forEach((player) => {
    player.tokens.forEach((tokenData) => {
      // Base
      if (tokenData.state === "base") {
        return;
      }

      // Finished
      if (tokenData.state === "finished") {
        return;
      }

      const cell = document.querySelector(
        `[data-cell="${tokenData.position}"]`,
      );

      if (!cell) {
        return;
      }

      const token = document.createElement("span");

      token.classList.add("moving-token", player.className);

      token.textContent = "";

      cell.appendChild(token);
    });
  });
}

// ===============================
// NEXT PLAYER
// ===============================

function finishTurn() {
  isRolling = false;

  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
  }

  updatePlayerUI();

  // P1
  if (currentPlayer === 0) {
    rollBtn.disabled = false;

    return;
  }

  // P2/P3/P4
  setTimeout(autoTurn, 800);
}

// ===============================
// AUTO PLAYER
// ===============================

function autoTurn() {
  if (!gameStarted || currentPlayer === 0 || isRolling) {
    return;
  }

  playAutoTurn();
}

// ===============================
// AUTO DICE
// ===============================

function playAutoTurn() {
  isRolling = true;

  diceValue = Math.floor(Math.random() * 6) + 1;

  diceAnimation(() => {
    movePlayerToken();
  });
}

// ===============================
// PLAYER UI
// ===============================

function updatePlayerUI() {
  document.querySelectorAll(".player").forEach((element) => {
    element.classList.remove("active-player");
  });

  const activePlayer = document.getElementById(`player${currentPlayer + 1}`);

  if (activePlayer) {
    activePlayer.classList.add("active-player");
  }
}

// ===============================
// WINNER
// ===============================

function checkWinner(player) {
  const finished = player.tokens.filter((token) => token.finished).length;

  if (finished === 4) {
    if (currentPlayer === 0) {
      alert("YOU WIN! 🎉");
    } else {
      alert(`${player.name} WINS! 🎉`);
    }

    gameStarted = false;

    rollBtn.disabled = true;
  }
}

// ===============================
// START GAME
// ===============================

function startGame() {
  gameStarted = true;

  currentPlayer = 0;

  diceValue = 0;

  isRolling = false;

  initializeTokens();

  renderTokens();

  updatePlayerUI();

  dice.textContent = "⚄";

  rollBtn.disabled = false;

  console.log("Game Started!");
}

// ===============================
// RESET GAME
// ===============================

function resetGame() {
  gameStarted = false;

  currentPlayer = 0;

  diceValue = 0;

  isRolling = false;

  initializeTokens();

  renderTokens();

  updatePlayerUI();

  dice.textContent = "⚄";

  rollBtn.disabled = true;
}

// ===============================
// EVENTS
// ===============================

startBtn.addEventListener("click", startGame);

resetBtn.addEventListener("click", resetGame);

rollBtn.addEventListener("click", rollDice);

// ===============================
// INITIAL STATE
// ===============================

initializeTokens();

rollBtn.disabled = true;

updatePlayerUI();
function goHome() {
  window.location.href = "../index.html";
}
