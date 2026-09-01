/* =====================================================
   CHESS GAME
===================================================== */

const boardElement = document.getElementById("board");

const turnText = document.getElementById("turnText");
const mobileTurn = document.getElementById("mobileTurn");

const whiteTimerElement = document.getElementById("whiteTimer");
const blackTimerElement = document.getElementById("blackTimer");

const moveHistoryElement = document.getElementById("moveHistory");

const whiteCapturedElement = document.getElementById("whiteCaptured");

const blackCapturedElement = document.getElementById("blackCaptured");

/* =====================================================
   PIECES
===================================================== */

const PIECES = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",

  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

/* =====================================================
   INITIAL BOARD
===================================================== */

const initialBoard = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],

  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],

  [null, null, null, null, null, null, null, null],

  [null, null, null, null, null, null, null, null],

  [null, null, null, null, null, null, null, null],

  [null, null, null, null, null, null, null, null],

  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],

  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

/* =====================================================
   GAME VARIABLES
===================================================== */

let board = []; //chess board save mae array

let currentPlayer = "w";

let selectedSquare = null; //current choice square

let validMoves = []; //can move pieces

let moveHistory = []; //play kae tat board state save

let undoHistory = []; //undo loke phoe ayin board state save
//kill lik tat pieces
let capturedWhite = [];
let capturedBlack = [];

let gameOver = false;
let lastMove = null;
let pendingPromotion = null;
let soundEnabled = true;

/* =====================================================
   TIMER
===================================================== */

let whiteTime = 10 * 60;
let blackTime = 10 * 60;

let timerInterval = null;

/*start game */
function initGame() {
  board = initialBoard.map((row) => [...row]);
  currentPlayer = "w";
  selectedSquare = null;
  validMoves = [];
  moveHistory = [];
  undoHistory = [];
  capturedWhite = [];
  capturedBlack = [];
  gameOver = false;
  lastMove = null;
  pendingPromotion = null;
  whiteTime = 10 * 60;
  blackTime = 10 * 60;
  updateBoard();
  updateUI();
  startTimer();
}

/* create board */
function updateBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");

      if ((row + col) % 2 === 0) {
        square.classList.add("light");
      } else {
        square.classList.add("dark");
      }
      square.dataset.row = row;
      square.dataset.col = col;
      /* Last move highlight*/
      if (
        lastMove &&
        ((lastMove.from.row === row && lastMove.from.col === col) ||
          (lastMove.to.row === row && lastMove.to.col === col))
      ) {
        square.classList.add("last-move");
      }
      /* Selecte highlight */
      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        square.classList.add("selected");
      }

      /* Valid move */
      const isValid = validMoves.some(
        (move) => move.row === row && move.col === col,
      );
      if (isValid) {
        if (board[row][col]) {
          square.classList.add("capture");
        } else {
          square.classList.add("valid");
        }
      }
      /* Coordinates */
      if (col === 0) {
        const rank = document.createElement("span");
        rank.className = "rank";
        rank.textContent = 8 - row;
        square.appendChild(rank);
      }
      if (row === 7) {
        const file = document.createElement("span");
        file.className = "file";
        file.textContent = String.fromCharCode(97 + col);
        square.appendChild(file);
      }

      /* Piece */
      const piece = board[row][col];
      if (piece) {
        const pieceElement = document.createElement("span");
        pieceElement.classList.add("piece");
        if (piece[0] === "w") {
          pieceElement.classList.add("white-piece");
        } else {
          pieceElement.classList.add("black-piece");
        }
        pieceElement.textContent = PIECES[piece];
        square.appendChild(pieceElement);
      }
      square.addEventListener("click", () => handleSquareClick(row, col));
      boardElement.appendChild(square);
    }
  }
}
/*square click*/
function handleSquareClick(row, col) {
  if (gameOver) return;
  const piece = board[row][col];
  /* If square is a valid move */
  const move = validMoves.find((m) => m.row === row && m.col === col);
  if (selectedSquare && move) {
    makeMove(selectedSquare.row, selectedSquare.col, row, col);
    return;
  }
  /* Select current player's piece */
  if (piece && piece[0] === currentPlayer) {
    selectedSquare = {
      row,
      col,
    };
    validMoves = getLegalMoves(row, col);
    updateBoard();
    return;
  }
  /* Clear selection */
  selectedSquare = null;
  validMoves = [];
  updateBoard();
}
/* get legal move */
function getLegalMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  if (piece[0] !== currentPlayer) return [];
  const moves = getPseudoMoves(board, row, col, true); //move shar
  return moves.filter((move) => {
    const testBoard = copyBoard(board);
    movePieceOnBoard(testBoard, row, col, move.row, move.col);
    return !isKingInCheck(testBoard, piece[0]);
  });
}

/*pseudoMove*/
function getPseudoMoves(position, row, col, includeSpecial = true) {
  const piece = position[row][col];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const moves = [];
  /* pawn*/
  if (type === "P") {
    const direction = color === "w" ? -1 : 1;

    const startRow = color === "w" ? 6 : 1;

    const oneRow = row + direction;

    if (inBoard(oneRow, col) && !position[oneRow][col]) {
      moves.push({
        row: oneRow,
        col,
      });

      const twoRow = row + direction * 2;

      if (row === startRow && !position[twoRow][col]) {
        moves.push({
          row: twoRow,
          col,
        });
      }
    }

    /* Diagonal captures */

    for (const dc of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + dc;

      if (!inBoard(newRow, newCol)) continue;

      const target = position[newRow][newCol];

      if (target && target[0] !== color) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      }
    }
  }

  /* ================= KNIGHT ================= */

  if (type === "N") {
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    for (const [dr, dc] of knightMoves) {
      const r = row + dr;
      const c = col + dc;

      if (!inBoard(r, c)) continue;

      if (!position[r][c] || position[r][c][0] !== color) {
        moves.push({
          row: r,
          col: c,
        });
      }
    }
  }

  /* ================= KING ================= */

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const r = row + dr;
        const c = col + dc;

        if (!inBoard(r, c)) continue;

        if (!position[r][c] || position[r][c][0] !== color) {
          moves.push({
            row: r,
            col: c,
          });
        }
      }
    }

    /* Castling */

    if (includeSpecial) {
      if (canCastle(position, color, "kingSide")) {
        moves.push({
          row,
          col: col + 2,
          castle: "kingSide",
        });
      }

      if (canCastle(position, color, "queenSide")) {
        moves.push({
          row,
          col: col - 2,
          castle: "queenSide",
        });
      }
    }
  }

  /* ================= ROOK ================= */

  if (type === "R") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  /* ================= BISHOP ================= */

  if (type === "B") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  /* ================= QUEEN ================= */

  if (type === "Q") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  return moves;
}

/* =====================================================
   SLIDING PIECES
===================================================== */

function addSlidingMoves(moves, position, row, col, color, directions) {
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (inBoard(r, c)) {
      if (!position[r][c]) {
        moves.push({
          row: r,
          col: c,
        });
      } else {
        if (position[r][c][0] !== color) {
          moves.push({
            row: r,
            col: c,
          });
        }

        break;
      }

      r += dr;
      c += dc;
    }
  }
}

/* =====================================================
   MAKE MOVE
===================================================== */

function makeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = board[fromRow][fromCol];

  const capturedPiece = board[toRow][toCol];

  /* Save state for Undo */

  undoHistory.push({
    board: copyBoard(board),
    currentPlayer,
    moveHistory: [...moveHistory],
    capturedWhite: [...capturedWhite],
    capturedBlack: [...capturedBlack],
    whiteTime,
    blackTime,
    lastMove,
  });

  /* Capture */

  if (capturedPiece) {
    if (capturedPiece[0] === "w") {
      capturedWhite.push(capturedPiece);
    } else {
      capturedBlack.push(capturedPiece);
    }
  }

  /* Move */

  board[toRow][toCol] = board[fromRow][fromCol];

  board[fromRow][fromCol] = null;

  /* Castling */

  if (movingPiece[1] === "K" && Math.abs(toCol - fromCol) === 2) {
    if (toCol > fromCol) {
      /* King side */

      board[toRow][5] = board[toRow][7];

      board[toRow][7] = null;
    } else {
      /* Queen side */

      board[toRow][3] = board[toRow][0];

      board[toRow][0] = null;
    }
  }

  /* Pawn promotion */

  if (movingPiece[1] === "P" && (toRow === 0 || toRow === 7)) {
    pendingPromotion = {
      row: toRow,
      col: toCol,
    };

    document.getElementById("promotionModal").classList.add("show");
  }

  /* Last move */

  lastMove = {
    from: {
      row: fromRow,
      col: fromCol,
    },
    to: {
      row: toRow,
      col: toCol,
    },
  };

  /* History */

  const notation = createNotation(
    movingPiece,
    fromRow,
    fromCol,
    toRow,
    toCol,
    capturedPiece,
  );

  moveHistory.push({
    color: currentPlayer,
    notation,
  });

  selectedSquare = null;
  validMoves = [];

  playSound();

  updateBoard();

  updateUI();

  /* Promotion waits */

  if (pendingPromotion) return;

  finishTurn();
}

/* =====================================================
   PROMOTION
===================================================== */

document.querySelectorAll(".promotion-options button").forEach((button) => {
  button.addEventListener("click", () => {
    if (!pendingPromotion) return;

    const piece = button.dataset.piece;

    board[pendingPromotion.row][pendingPromotion.col] =
      currentPlayer + piece.toUpperCase();

    document.getElementById("promotionModal").classList.remove("show");

    pendingPromotion = null;

    updateBoard();

    finishTurn();
  });
});

/* =====================================================
   FINISH TURN
===================================================== */

function finishTurn() {
  currentPlayer = currentPlayer === "w" ? "b" : "w";

  updateUI();

  updateBoard();

  /* Checkmate */

  if (isCheckmate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    const winner = currentPlayer === "w" ? "Black" : "White";

    showGameOver(winner + " Wins!", "Checkmate");

    return;
  }

  /* Stalemate */

  if (isStalemate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    showGameOver("Draw", "Stalemate");
  }
}

/* =====================================================
   CHECK
===================================================== */

function isKingInCheck(position, color) {
  let king = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (position[r][c] === color + "K") {
        king = {
          row: r,
          col: c,
        };

        break;
      }
    }

    if (king) break;
  }

  if (!king) return true;

  const opponent = color === "w" ? "b" : "w";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = position[r][c];

      if (piece && piece[0] === opponent) {
        const attacks = getAttackMoves(position, r, c);

        if (
          attacks.some((move) => move.row === king.row && move.col === king.col)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/* =====================================================
   ATTACK MOVES
===================================================== */

function getAttackMoves(position, row, col) {
  const piece = position[row][col];

  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];

  const moves = [];

  if (type === "P") {
    const direction = color === "w" ? -1 : 1;

    for (const dc of [-1, 1]) {
      const r = row + direction;
      const c = col + dc;

      if (inBoard(r, c)) {
        moves.push({
          row: r,
          col: c,
        });
      }
    }

    return moves;
  }

  if (type === "N") {
    const dirs = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    return dirs
      .map(([dr, dc]) => ({
        row: row + dr,
        col: col + dc,
      }))
      .filter((move) => inBoard(move.row, move.col));
  }

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const r = row + dr;
        const c = col + dc;

        if (inBoard(r, c)) {
          moves.push({
            row: r,
            col: c,
          });
        }
      }
    }

    return moves;
  }

  let directions = [];

  if (type === "R") {
    directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
  }

  if (type === "B") {
    directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  if (type === "Q") {
    directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (inBoard(r, c)) {
      moves.push({
        row: r,
        col: c,
      });

      if (position[r][c]) break;

      r += dr;
      c += dc;
    }
  }

  return moves;
}

/* =====================================================
   CHECKMATE
===================================================== */

function isCheckmate(color) {
  if (!isKingInCheck(board, color)) return false;

  return !hasLegalMove(color);
}

/* =====================================================
   STALEMATE
===================================================== */

function isStalemate(color) {
  if (isKingInCheck(board, color)) return false;

  return !hasLegalMove(color);
}

/* =====================================================
   HAS LEGAL MOVE
===================================================== */

function hasLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];

      if (piece && piece[0] === color) {
        const moves = getPseudoMoves(board, r, c);

        for (const move of moves) {
          const test = copyBoard(board);

          movePieceOnBoard(test, r, c, move.row, move.col);

          if (!isKingInCheck(test, color)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/* =====================================================
   CASTLING
===================================================== */

function canCastle(position, color, side) {
  const row = color === "w" ? 7 : 0;

  const opponent = color === "w" ? "b" : "w";

  /* King */

  if (position[row][4] !== color + "K") return false;

  if (isKingInCheck(position, color)) return false;

  if (side === "kingSide") {
    if (position[row][7] !== color + "R") return false;

    if (position[row][5] || position[row][6]) return false;

    const test1 = copyBoard(position);

    movePieceOnBoard(test1, row, 4, row, 5);

    if (isKingInCheck(test1, color)) return false;

    const test2 = copyBoard(position);

    movePieceOnBoard(test2, row, 4, row, 6);

    if (isKingInCheck(test2, color)) return false;

    return true;
  }

  if (side === "queenSide") {
    if (position[row][0] !== color + "R") return false;

    if (position[row][1] || position[row][2] || position[row][3]) return false;

    const test1 = copyBoard(position);

    movePieceOnBoard(test1, row, 4, row, 3);

    if (isKingInCheck(test1, color)) return false;

    const test2 = copyBoard(position);

    movePieceOnBoard(test2, row, 4, row, 2);

    if (isKingInCheck(test2, color)) return false;

    return true;
  }

  return false;
}

/* =====================================================
   MOVE PIECE ON TEST BOARD
===================================================== */

function movePieceOnBoard(position, fromRow, fromCol, toRow, toCol) {
  position[toRow][toCol] = position[fromRow][fromCol];

  position[fromRow][fromCol] = null;
}

/* =====================================================
   COPY BOARD
===================================================== */

function copyBoard(position) {
  return position.map((row) => [...row]);
}

/* =====================================================
   BOARD CHECK
===================================================== */

function inBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/* =====================================================
   NOTATION
===================================================== */

function createNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
  const files = "abcdefgh";

  const pieceNames = {
    K: "K",
    Q: "Q",
    R: "R",
    B: "B",
    N: "N",
    P: "",
  };

  const from = files[fromCol] + (8 - fromRow);

  const to = files[toCol] + (8 - toRow);

  const capture = captured ? "x" : "-";

  return pieceNames[piece[1]] + from + capture + to;
}

/* =====================================================
   UPDATE UI
===================================================== */

function updateUI() {
  const name = currentPlayer === "w" ? "White" : "Black";

  turnText.textContent = name + " Turn";

  mobileTurn.textContent = name + "'s Turn";

  renderHistory();

  renderCaptured();

  updateTimers();
}

/* =====================================================
   MOVE HISTORY
===================================================== */

function renderHistory() {
  if (moveHistory.length === 0) {
    moveHistoryElement.innerHTML = `<p class="empty-history">
                No moves yet
            </p>`;

    return;
  }

  moveHistoryElement.innerHTML = "";

  for (let i = 0; i < moveHistory.length; i += 2) {
    const row = document.createElement("div");

    row.className = "history-row";

    const number = document.createElement("span");

    number.textContent = i / 2 + 1 + ".";

    const white = document.createElement("span");

    white.textContent = moveHistory[i] ? moveHistory[i].notation : "";

    const black = document.createElement("span");

    black.textContent = moveHistory[i + 1] ? moveHistory[i + 1].notation : "";

    row.append(number, white, black);

    moveHistoryElement.appendChild(row);
  }
}

/* =====================================================
   CAPTURED
===================================================== */

function renderCaptured() {
  whiteCapturedElement.innerHTML = capturedWhite
    .map((piece) => PIECES[piece])
    .join("");

  blackCapturedElement.innerHTML = capturedBlack
    .map((piece) => PIECES[piece])
    .join("");
}

/* =====================================================
   TIMER
===================================================== */

function startTimer() {
  stopTimer();

  timerInterval = setInterval(() => {
    if (gameOver) return;

    if (currentPlayer === "w") {
      whiteTime--;

      if (whiteTime <= 0) {
        whiteTime = 0;

        gameOver = true;

        stopTimer();

        showGameOver("Black Wins!", "White ran out of time");
      }
    } else {
      blackTime--;

      if (blackTime <= 0) {
        blackTime = 0;

        gameOver = true;

        stopTimer();

        showGameOver("White Wins!", "Black ran out of time");
      }
    }

    updateTimers();
  }, 1000);
}

/* =====================================================
   STOP TIMER
===================================================== */

function stopTimer() {
  clearInterval(timerInterval);
}

/* =====================================================
   UPDATE TIMER
===================================================== */

function updateTimers() {
  whiteTimerElement.textContent = formatTime(whiteTime);

  blackTimerElement.textContent = formatTime(blackTime);
}

/* =====================================================
   FORMAT TIME
===================================================== */

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);

  const sec = seconds % 60;

  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

/* =====================================================
   UNDO
===================================================== */

function undoMove() {
  if (undoHistory.length === 0 || gameOver) return;

  const previous = undoHistory.pop();

  board = copyBoard(previous.board);

  currentPlayer = previous.currentPlayer;

  moveHistory = [...previous.moveHistory];

  capturedWhite = [...previous.capturedWhite];

  capturedBlack = [...previous.capturedBlack];

  whiteTime = previous.whiteTime;

  blackTime = previous.blackTime;

  lastMove = previous.lastMove;

  selectedSquare = null;

  validMoves = [];

  updateBoard();

  updateUI();
}

/* =====================================================
   RESET
===================================================== */

function resetGame() {
  initGame();
}

/* =====================================================
   NEW GAME
===================================================== */

document.getElementById("newGameBtn").addEventListener("click", initGame);

document.getElementById("playNowBtn").addEventListener("click", initGame);

document.getElementById("playAgainBtn").addEventListener("click", () => {
  document.getElementById("gameModal").classList.remove("show");

  initGame();
});

document.getElementById("modalNewGame").addEventListener("click", () => {
  document.getElementById("gameModal").classList.remove("show");

  initGame();
});

document.getElementById("resetBtn").addEventListener("click", resetGame);

document.getElementById("resetGameBtn").addEventListener("click", resetGame);

document.getElementById("undoBtn").addEventListener("click", undoMove);

/* =====================================================
   RESIGN
===================================================== */

document.getElementById("resignBtn").addEventListener("click", () => {
  if (gameOver) return;

  const winner = currentPlayer === "w" ? "Black" : "White";

  gameOver = true;

  stopTimer();

  showGameOver(
    winner + " Wins!",
    currentPlayer === "w" ? "White resigned" : "Black resigned",
  );
});

/* =====================================================
   GAME OVER
===================================================== */

function showGameOver(title, reason) {
  document.getElementById("resultTitle").textContent = title;

  document.getElementById("resultReason").textContent = reason;

  document.getElementById("resultMoves").textContent = moveHistory.length;

  document.getElementById("resultTime").textContent =
    currentPlayer === "w" ? formatTime(whiteTime) : formatTime(blackTime);

  document.getElementById("modalTitle").textContent = title;

  document.getElementById("modalText").textContent = reason;

  document.getElementById("gameModal").classList.add("show");
}

/* =====================================================
   SETTINGS
===================================================== */

const settingsPanel = document.getElementById("settingsPanel");

document.getElementById("settingsBtn").addEventListener("click", () => {
  settingsPanel.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
});

document.getElementById("closeSettings").addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

/* =====================================================
   BOARD THEME
===================================================== */

document.querySelectorAll(".board-theme").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".board-theme")
      .forEach((btn) => btn.classList.remove("selected"));

    button.classList.add("selected");

    const theme = button.dataset.theme;

    if (theme === "classic") {
      document.documentElement.style.setProperty("--light-square", "#e8f1ff");

      document.documentElement.style.setProperty("--dark-square", "#6688c7");
    }

    if (theme === "blue") {
      document.documentElement.style.setProperty("--light-square", "#dce7ff");

      document.documentElement.style.setProperty("--dark-square", "#4568aa");
    }

    if (theme === "brown") {
      document.documentElement.style.setProperty("--light-square", "#f0d9b5");

      document.documentElement.style.setProperty("--dark-square", "#b58863");
    }

    if (theme === "green") {
      document.documentElement.style.setProperty("--light-square", "#eeeed2");

      document.documentElement.style.setProperty("--dark-square", "#769656");
    }

    if (theme === "purple") {
      document.documentElement.style.setProperty("--light-square", "#e6dcff");

      document.documentElement.style.setProperty("--dark-square", "#754dcc");
    }

    updateBoard();
  });
});

/* =====================================================
   PIECE STYLE
===================================================== */

document.querySelectorAll(".piece-style").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".piece-style")
      .forEach((btn) => btn.classList.remove("selected"));

    button.classList.add("selected");
  });
});

/* =====================================================
   SOUND
===================================================== */

document.getElementById("soundToggle").addEventListener("change", (event) => {
  soundEnabled = event.target.checked;
});

function playSound() {
  if (!soundEnabled) return;

  /*
       Browser audio can only be created
       after user interaction.
    */

  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    const oscillator = audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.frequency.value = 500;

    gain.gain.setValueAtTime(0.04, audioContext.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.08,
    );

    oscillator.start();

    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    console.log(error);
  }
}

/* =====================================================
   GAME MODE
===================================================== */

document.querySelectorAll(".mode-option").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".mode-option")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    const mode = button.dataset.mode;

    console.log("Selected mode:", mode);
  });
});

/* =====================================================
   LEARN TABS
===================================================== */

document.querySelectorAll(".learn-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".learn-tabs button")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
  });
});

/* =====================================================
   MOBILE MENU
===================================================== */

/* =====================================================
   START
===================================================== */

initGame();
