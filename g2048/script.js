let board;
let score = 0;
let best = Number(localStorage.getItem("2048-best")) || 0;
let undoCount = 3;
let previousBoard = null;
let previousScore = 0;
let gameFinished = false;

const gameBoard = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const undoButton = document.getElementById("undo");
const restartButton = document.getElementById("restart");
const settingsButton = document.getElementById("settings");
const undoCountText = document.getElementById("undo-count");
const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageButton = document.getElementById("message-button");

/* start*/

function startGame() {
  board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  score = 0;
  undoCount = 3;
  previousBoard = null;
  previousScore = 0;
  gameFinished = false;
  message.classList.remove("show");

  updateScore();
  updateUndo();
  addRandomTile();
  addRandomTile();
  drawBoard();
}

/*  board*/
function drawBoard() {
  gameBoard.innerHTML = "";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let tile = document.createElement("div");
      tile.classList.add("tile");
      let value = board[row][col];

      if (value !== 0) {
        tile.textContent = value; //insert title
        tile.classList.add("tile-" + value); //css value
      }
      gameBoard.appendChild(tile); //insert html
    }
  }
}

/* random*/

function addRandomTile() {
  let empty = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === 0) {
        empty.push({
          row: row,
          col: col,
        }); //insert empty
      }
    }
  }

  if (empty.length === 0) {
    return;
  } //no work

  let random = Math.floor(Math.random() * empty.length); //empty place random
  let cell = empty[random];
  board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
}

/* move */

function move(direction) {
  if (gameFinished) {
    return;
  }

  let oldBoard = JSON.stringify(board);
  let oldScore = score;

  if (direction === "left") {
    moveLeft();
  } else if (direction === "right") {
    moveRight();
  } else if (direction === "up") {
    moveUp();
  } else if (direction === "down") {
    moveDown();
  }

  let newBoard = JSON.stringify(board);

  if (oldBoard !== newBoard) {
    previousBoard = JSON.parse(oldBoard); //array change
    previousScore = oldScore;
    addRandomTile();
    drawBoard();
    updateScore();
    checkWin();
    checkGameOver();
  }
}
/* left */
function moveLeft() {
  for (let row = 0; row < 4; row++) {
    let line = board[row];
    line = slide(line); //remove 0
    line = merge(line); //same number add
    line = slide(line);
    board[row] = line; //chg p tar ko insert board
  }
}

/* right */
function moveRight() {
  for (let row = 0; row < 4; row++) {
    let line = [...board[row]].reverse(); // 2 0 2 4==>4 2 0 2left ko default,right ko reverse
    line = slide(line);
    line = merge(line);
    line = slide(line);
    board[row] = line.reverse(); //rever lok htr lo reverse lok p ma htat tr
  }
}
/* up*/
function moveUp() {
  for (let col = 0; col < 4; col++) {
    let line = [];
    for (let row = 0; row < 4; row++) {
      line.push(board[row][col]); //current value ko line htat
    }
    line = slide(line);
    line = merge(line);
    line = slide(line);
    for (let row = 0; row < 4; row++) {
      board[row][col] = line[row];
    }
  }
}

/*down */

function moveDown() {
  for (let col = 0; col < 4; col++) {
    let line = [];

    for (let row = 0; row < 4; row++) {
      line.push(board[row][col]);
    }
    line.reverse();
    line = slide(line);
    line = merge(line);
    line = slide(line);
    line.reverse();
    for (let row = 0; row < 4; row++) {
      board[row][col] = line[row];
    }
  }
}

/* slide */
function slide(line) {
  let result = line.filter((value) => value !== 0); //0 nae nosame a yuu
  while (result.length < 4) {
    result.push(0); //empty place 0
  }
  return result;
}

/*merge */
function merge(line) {
  let result = [];

  for (let i = 0; i < 4; i++) {
    if (i < 3 && line[i] !== 0 && line[i] === line[i + 1]) {
      let value = line[i] * 2;
      result.push(value);
      score += value;
      i++;
    } else {
      result.push(line[i]);
    }
  }

  while (result.length < 4) {
    result.push(0);
  }
  return result;
}

/* score*/
function updateScore() {
  scoreText.textContent = score; //Js==>html
  if (score > best) {
    best = score;
    localStorage.setItem("2048-best", best);
  }
  bestText.textContent = best;
}

/*undo*/
function undo() {
  if (previousBoard === null || undoCount <= 0) {
    return;
  }
  board = previousBoard;
  score = previousScore;
  previousBoard = null;
  undoCount--;
  gameFinished = false;
  message.classList.remove("show");
  updateScore();
  updateUndo();
  drawBoard();
}

function updateUndo() {
  undoCountText.textContent = undoCount;
  if (undoCount === 0) {
    undoButton.style.opacity = "0.5";
  } else {
    undoButton.style.opacity = "1";
  }
}

/*resert*/
restartButton.addEventListener("click", function () {
  startGame();
});

/* undobutton */
undoButton.addEventListener("click", function () {
  undo();
});

/*seletings */
settingsButton.addEventListener("click", function () {
  window.location.href = "../chooseGames.html";
});

/* win */
function checkWin() {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === 2048) {
        gameFinished = true;
        showMessage("You Win! 🎉");
        return;
      }
    }
  }
}

/* game over*/
function checkGameOver() {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === 0) {
        return;
      }
      if (col < 3 && board[row][col] === board[row][col + 1]) {
        return;
      } //left-right
      if (row < 3 && board[row][col] === board[row + 1][col]) {
        return;
      } //up-down
    }
  }
  gameFinished = true;
  showMessage("Game Over!");
}

/*message*/
function showMessage(text) {
  messageTitle.textContent = text;
  message.classList.add("show");
}

messageButton.addEventListener("click", function () {
  startGame();
});

/* keyboard*/
document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    move("left");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    move("right");
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    move("up");
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    move("down");
  }
});

/*for mobile */
let startX = 0;
let startY = 0;
gameBoard.addEventListener("touchstart", function (event) {
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
});

gameBoard.addEventListener("touchend", function (event) {
  let endX = event.changedTouches[0].clientX;
  let endY = event.changedTouches[0].clientY;
  let diffX = endX - startX;
  let diffY = endY - startY;
  if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) {
    return;
  }
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      move("right");
    } else {
      move("left");
    }
  } else {
    if (diffY > 0) {
      move("down");
    } else {
      move("up");
    }
  }
});
// go home
settingsButton.addEventListener("click", function () {
  window.location.href = "../index.html";
});
startGame();
