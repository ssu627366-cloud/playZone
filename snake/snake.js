const boardSize = 60; //
const go = {
  4: 25,
  9: 31,
  20: 38,
  28: 47,
  40: 59,
  50: 60,
  17: 7,
  29: 12,
  35: 16,
  43: 22,
  54: 34,
  58: 44,
};

/* players */
let players = [
  {
    name: "Player 1",
    position: 1,
  },

  {
    name: "Player 2",
    position: 1,
  },
];

/* turn */
let currentPlayer = 0;
let gameOver = false;
let isRolling = false;

/* dice*/
const diceFaces = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

/*create board*/
function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let row = 5; row >= 0; row--) {
    let start = row * 10 + 1;
    let numbers = [];
    for (let i = 0; i < 10; i++) {
      numbers.push(start + i);
    }
    /* Every second row reverses */
    if (row % 2 === 1) {
      numbers.reverse();
    }
    numbers.forEach((number) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${number}`;
      cell.innerHTML = `
                <span>${number}</span>
                <div class="tokens"></div>
            `;
      board.appendChild(cell);
    });
  }

  addObstacles();
  updateTokens();
}

/*go*/

function addObstacles() {
  Object.entries(go).forEach(([start, end]) => {
    const cell = document.getElementById(`cell-${start}`);

    if (cell) {
      const go = document.createElement("div");
      go.className = "obstacle ladder";
      go.innerHTML = `go ${end}`;
      go.style.position = "absolute";
      go.style.fontSize = "15px";
      go.style.right = "2px";
      go.style.bottom = "2px";
      cell.appendChild(go);
    }
  });
}

/*token */

function updateTokens() {
  document.querySelectorAll(".tokens").forEach((container) => {
    container.innerHTML = "";
  });
  addToken(players[0].position, 1);
  addToken(players[1].position, 2);
  document.getElementById("p1Position").innerText = players[0].position;
  document.getElementById("p2Position").innerText = players[1].position;
}
function addToken(position, playerNumber) {
  const cell = document.getElementById(`cell-${position}`);
  if (!cell) return;
  const container = cell.querySelector(".tokens");
  const token = document.createElement("div");
  token.className = playerNumber === 1 ? "token token1" : "token token2";
  token.innerText = playerNumber;
  container.appendChild(token);
}

/* roll dice */
function rollDice() {
  if (isRolling || gameOver) {
    return;
  }
  if (currentPlayer === 1) {
    return;
  }
  isRolling = true;
  const dice = document.getElementById("dice");
  const rollBtn = document.getElementById("rollBtn");
  dice.classList.add("rolling");
  rollBtn.disabled = true;
  let counter = 0;
  const animation = setInterval(() => {
    const random = Math.floor(Math.random() * 6) + 1;
    dice.innerText = diceFaces[random];
    counter++;
    if (counter >= 8) {
      clearInterval(animation);
      const finalNumber = Math.floor(Math.random() * 6) + 1;
      dice.innerText = diceFaces[finalNumber];
      dice.classList.remove("rolling");
      playerMove(finalNumber);
    }
  }, 80);
}

/*play move*/

function playerMove(number) {
  const player = players[currentPlayer];
  const oldPosition = player.position;
  let newPosition = oldPosition + number;
  if (newPosition > boardSize) {
    newPosition = oldPosition;
  }
  moveStepByStep(oldPosition, newPosition, () => {
    checkSnakeOrLadder(); ////////
  });
}

/*step by step movement */

function moveStepByStep(from, to, callback) {
  if (from === to) {
    callback();
    return;
  }
  let current = from;
  const interval = setInterval(() => {
    if (current < to) {
      current++;
    } else {
      current--;
    }
    players[currentPlayer].position = current;
    updateTokens();
    if (current === to) {
      clearInterval(interval);
      setTimeout(callback, 400);
    }
  }, 150);
}

/*check go */

function checkSnakeOrLadder() {
  const player = players[currentPlayer];
  const position = player.position;

  /*
        LADDER
    */

  if (go[position]) {
    const destination = go[position];
    setTimeout(() => {
      player.position = destination;
      updateTokens();
      checkWinner();
    }, 600);
    return;
  }
  checkWinner();
}

/*check winner */

function checkWinner() {
  const player = players[currentPlayer];
  if (player.position >= boardSize) {
    gameOver = true;
    if (currentPlayer === 0) {
      showWinner("you win!");
    } else {
      showWinner("you lose!");
    }
    return;
  }
  changeTurn();
}

/*chg turn*/
function changeTurn() {
  currentPlayer = currentPlayer === 0 ? 1 : 0;
  updateTurnUI();
  isRolling = false;
  const rollBtn = document.getElementById("rollBtn");
  if (currentPlayer === 0) {
    rollBtn.disabled = false;
  } else {
    rollBtn.disabled = true;
    setTimeout(() => {
      autoRoll();
    }, 500);
  }
}
// chg html turn
function updateTurnUI() {
  const turnText = document.getElementById("turnText");
  const p1 = document.getElementById("player1Box");
  const p2 = document.getElementById("player2Box");
  p1.classList.remove("active");
  p2.classList.remove("active");
  if (currentPlayer === 0) {
    turnText.innerText = "Player 1's Turn";
    p1.classList.add("active");
  } else {
    turnText.innerText = "Player 2's Turn";
    p2.classList.add("active");
  }
}

/*player2 auto*/

function autoRoll() {
  if (gameOver) {
    return;
  }
  if (currentPlayer !== 1) {
    return;
  }
  if (isRolling) {
    return;
  }
  isRolling = true;
  const dice = document.getElementById("dice");
  dice.classList.add("rolling");
  let counter = 0;
  const animation = setInterval(() => {
    const random = Math.floor(Math.random() * 6) + 1;
    dice.innerText = diceFaces[random];
    counter++;
    if (counter >= 8) {
      clearInterval(animation);
      const finalNumber = Math.floor(Math.random() * 6) + 1;
      dice.innerText = diceFaces[finalNumber];
      dice.classList.remove("rolling");
      playerMove(finalNumber);
    }
  }, 80);
}

/*show winner*/

function showWinner(messageText) {
  const message = document.getElementById("message");
  message.innerText = messageText;
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 3000);
}

/* new game*/

function newGame() {
  players[0].position = 1;
  players[1].position = 1;
  currentPlayer = 0;
  gameOver = false;
  isRolling = false;
  document.getElementById("dice").innerText = "⚄";
  /*  Update board*/
  updateTokens();
  updateTurnUI();
  document.getElementById("rollBtn").disabled = false;
  /*Hide winner message*/
  document.getElementById("message").classList.remove("show");
}

function goHome() {
  window.location.href = "../index.html";
}

createBoard();

updateTurnUI();
