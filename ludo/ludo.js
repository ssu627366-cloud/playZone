// ===============================
// LUDO GAME
// Player 1 = Human
// Player 2,3,4 = Auto
// ===============================

// Players
const players = [
  {
    name: "Player 1",
    color: "red",
    className: "red-token",
    start: 19,
    tokens: [],
  },
  {
    name: "Player 2",
    color: "blue",
    className: "blue-token",
    start: 5,
    tokens: [],
  },
  {
    name: "Player 3",
    color: "green",
    className: "green-token",
    start: 45,
    tokens: [],
  },
  {
    name: "Player 4",
    color: "yellow",
    className: "yellow-token",
    start: 32,
    tokens: [],
  },
];

// Game variables
let currentPlayer = 0;
let diceValue = 0;
let gameStarted = false;
let isRolling = false;

const rollBtn = document.getElementById("rollBtn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const dice = document.getElementById("dice");

// All board cells
const cells = document.querySelectorAll("[data-cell]");

// ===============================
// CREATE TOKEN DATA
// ===============================

function initializeTokens() {
  players.forEach((player) => {
    player.tokens = [];

    for (let i = 0; i < 4; i++) {
      player.tokens.push({
        index: i,
        position: -1, // -1 = HOME
        finished: false,
      });
    }
  });
}

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

function rollDice() {
  if (!gameStarted || isRolling) {
    return;
  }

  // Only Player 1 is controlled by human
  if (currentPlayer !== 0) {
    return;
  }

  playTurn();
}

// ===============================
// PLAY TURN
// ===============================

function playTurn() {
  if (isRolling) {
    return;
  }

  isRolling = true;
  rollBtn.disabled = true;

  diceValue = Math.floor(Math.random() * 6) + 1;

  // Dice animation
  let count = 0;

  const animation = setInterval(() => {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    dice.textContent = diceFaces[randomNumber];

    count++;

    if (count >= 8) {
      clearInterval(animation);

      dice.textContent = diceFaces[diceValue];

      setTimeout(() => {
        movePlayerToken();
      }, 400);
    }
  }, 80);
}

// ===============================
// MOVE TOKEN
// ===============================

function movePlayerToken() {
  const player = players[currentPlayer];

  // Find movable token
  const movableToken = findMovableToken(player, diceValue);

  if (movableToken === null) {
    console.log(`${player.name} cannot move`);

    finishTurn();
    return;
  }

  if (movableToken.position === -1) {
    if (diceValue === 6) {
      movableToken.position = 0;
    }
  } else {
    movableToken.position += diceValue;

    // Finish lap
    if (movableToken.position >= 52) {
      movableToken.position = movableToken.position % 52;
    }
  }

  renderTokens();

  // Check winner
  checkWinner(player);

  // 6 = extra turn
  if (diceValue === 6) {
    console.log(`${player.name} got 6 - Extra turn!`);

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
// FIND MOVABLE TOKEN
// ===============================

function findMovableToken(player, dice) {
  // First priority:
  // If dice = 6, bring HOME token out
  if (dice === 6) {
    const homeToken = player.tokens.find((token) => token.position === -1);

    if (homeToken) {
      return homeToken;
    }
  }

  // Find token already on board
  const boardToken = player.tokens.find(
    (token) => token.position !== -1 && !token.finished,
  );

  if (boardToken) {
    return boardToken;
  }

  return null;
}

// ===============================
// RENDER TOKENS
// ===============================

function renderTokens() {
  // Remove all tokens from cells
  cells.forEach((cell) => {
    cell.querySelectorAll(".moving-token").forEach((token) => {
      token.remove();
    });
  });

  players.forEach((player) => {
    player.tokens.forEach((tokenData) => {
      if (tokenData.position === -1 || tokenData.finished) {
        return;
      }

      const cellIndex = getCellIndex(player, tokenData.position);

      const cell = document.querySelector(`[data-cell="${cellIndex}"]`);

      if (!cell) {
        return;
      }

      const token = document.createElement("span");

      token.classList.add("moving-token", player.className);

      token.textContent = "●";

      cell.appendChild(token);
    });
  });
}

// ===============================
// GET CELL INDEX
// ===============================

function getCellIndex(player, position) {
  return (player.start + position) % 52;
}
// ===============================
// NEXT TURN
// ===============================

function finishTurn() {
  isRolling = false;

  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
  }

  updatePlayerUI();

  // Player 1 = Human
  if (currentPlayer === 0) {
    rollBtn.disabled = false;
    return;
  }

  // Player 2,3,4 = Auto
  setTimeout(autoTurn, 800);
}

// ===============================
// AUTO PLAYER
// ===============================

function autoTurn() {
  if (!gameStarted || currentPlayer === 0) {
    return;
  }

  if (isRolling) {
    return;
  }

  console.log(`${players[currentPlayer].name} is playing...`);

  playAutoTurn();
}

// ===============================
// AUTO DICE
// ===============================

function playAutoTurn() {
  isRolling = true;

  const player = players[currentPlayer];

  diceValue = Math.floor(Math.random() * 6) + 1;

  let count = 0;

  const animation = setInterval(() => {
    const randomNumber = Math.floor(Math.random() * 6) + 1;

    dice.textContent = diceFaces[randomNumber];

    count++;

    if (count >= 8) {
      clearInterval(animation);

      dice.textContent = diceFaces[diceValue];

      setTimeout(() => {
        movePlayerToken();
      }, 500);
    }
  }, 80);
}

// ===============================
// PLAYER UI
// ===============================

function updatePlayerUI() {
  document.querySelectorAll(".player").forEach((playerElement) => {
    playerElement.classList.remove("active-player");
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
  const finishedTokens = player.tokens.filter((token) => token.finished).length;

  // Simple winner condition
  // Change this later when HOME path is added
  if (finishedTokens === 4) {
    alert(`${player.name} Wins! 🎉`);
    gameStarted = false;
  }
}

// ===============================
// START GAME
// ===============================

function startGame() {
  gameStarted = true;
  currentPlayer = 0;
  isRolling = false;

  initializeTokens();
  renderTokens();
  updatePlayerUI();

  dice.textContent = "⚄";

  rollBtn.disabled = false;

  console.log("Game Started!");
  console.log("Player 1's turn");
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

  console.log("Game Reset!");
}

// ===============================
// BUTTON EVENTS
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
