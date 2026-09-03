const boardElement = document.getElementById("board");

const turnText = document.getElementById("turnText");
const mobileTurn = document.getElementById("mobileTurn");

const whiteTimerElement = document.getElementById("whiteTimer");
const blackTimerElement = document.getElementById("blackTimer");

const moveHistoryElement = document.getElementById("moveHistory");

const whiteCapturedElement = document.getElementById("whiteCaptured");

const blackCapturedElement = document.getElementById("blackCaptured");

const newGameBtn = document.getElementById("newGameBtn");

const resetBtn = document.getElementById("resetBtn");

const undoBtn = document.getElementById("undoBtn");

const settingsBtn = document.getElementById("settingsBtn");

const promotionModal = document.getElementById("promotionModal");

const gameModal = document.getElementById("gameModal");

const modalTitle = document.getElementById("modalTitle");

const modalText = document.getElementById("modalText");

const modalNewGame = document.getElementById("modalNewGame");

/* pieces */

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

/* INITIAL BOARD */

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

let board = [];

let currentPlayer = "w";

let selectedSquare = null;

let validMoves = [];

let moveHistory = [];

let undoHistory = [];

let capturedWhite = [];

let capturedBlack = [];

let lastMove = null;

let pendingPromotion = null;

let gameOver = false;

/*TIMERs */

let whiteTime = 600;

let blackTime = 600;

let timerInterval = null;

/* CASTLING*/

let castlingRights = {
  wKing: true,
  wQueen: true,
  bKing: true,
  bQueen: true,
};

/* stART GAME */

function initGame() {
  board = copyBoard(initialBoard);

  currentPlayer = "w";

  selectedSquare = null;

  validMoves = [];

  moveHistory = [];

  undoHistory = [];

  capturedWhite = [];

  capturedBlack = [];

  lastMove = null;

  pendingPromotion = null;

  gameOver = false;

  whiteTime = 600;

  blackTime = 600;

  castlingRights = {
    wKing: true,
    wQueen: true,
    bKing: true,
    bQueen: true,
  };

  promotionModal.classList.remove("show");

  gameModal.classList.remove("show");

  updateBoard();

  updateUI();

  startTimer();
}

/* draw Move */

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

      /* seleted */

      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        square.classList.add("selected");
      }

      /* valid move */

      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col,
      );

      if (isValidMove) {
        if (board[row][col]) {
          square.classList.add("capture");
        } else {
          square.classList.add("valid");
        }
      }

      /* last move*/

      if (
        lastMove &&
        ((lastMove.from.row === row && lastMove.from.col === col) ||
          (lastMove.to.row === row && lastMove.to.col === col))
      ) {
        square.classList.add("last-move");
      }

      /*COORDINATES */

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

      /* piece */

      const piece = board[row][col];

      if (piece) {
        const pieceElement = document.createElement("span");

        pieceElement.className = "piece";

        pieceElement.textContent = PIECES[piece];

        if (piece[0] === "w") {
          pieceElement.classList.add("white-piece");
        } else {
          pieceElement.classList.add("black-piece");
        }

        square.appendChild(pieceElement);
      }

      /* CLICK */

      square.addEventListener("click", () => handleSquareClick(row, col));

      boardElement.appendChild(square);
    }
  }
}

/*   CLICK SQUARE */

function handleSquareClick(row, col) {
  if (gameOver) {
    return;
  }

  const piece = board[row][col];

  /* IF CLICK VALID MOVE*/

  const clickedMove = validMoves.find(
    (move) => move.row === row && move.col === col,
  );

  if (selectedSquare && clickedMove) {
    makeMove(selectedSquare.row, selectedSquare.col, row, col);

    return;
  }

  /* selete piece*/

  if (piece && piece[0] === currentPlayer) {
    selectedSquare = {
      row: row,
      col: col,
    };

    validMoves = getLegalMoves(row, col);

    updateBoard();

    return;
  }

  /*clean */

  selectedSquare = null;

  validMoves = [];

  updateBoard();
}

/* GET LEGAL MOVES */

function getLegalMoves(row, col) {
  const piece = board[row][col];

  if (!piece) {
    return [];
  }

  if (piece[0] !== currentPlayer) {
    return [];
  }

  const pseudoMoves = getPseudoMoves(board, row, col);

  const legalMoves = [];

  for (const move of pseudoMoves) {
    const testBoard = copyBoard(board);

    /* Move piece */

    testBoard[move.row][move.col] = testBoard[row][col];

    testBoard[row][col] = null;

    /* Castling */

    if (move.castle === "kingSide") {
      testBoard[row][5] = testBoard[row][7];

      testBoard[row][7] = null;
    }

    if (move.castle === "queenSide") {
      testBoard[row][3] = testBoard[row][0];

      testBoard[row][0] = null;
    }

    if (!isKingInCheck(testBoard, piece[0])) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

/* GET PSEUDO MOVE*/

function getPseudoMoves(position, row, col) {
  const piece = position[row][col];

  if (!piece) {
    return [];
  }

  const color = piece[0];

  const type = piece[1];

  const moves = [];

  /*pwan */

  if (type === "P") {
    const direction = color === "w" ? -1 : 1;

    const startRow = color === "w" ? 6 : 1;

    /* ONE STEP */

    const oneRow = row + direction;

    if (inBoard(oneRow, col) && !position[oneRow][col]) {
      moves.push({
        row: oneRow,
        col: col,
      });

      /* TWO STEP */

      const twoRow = row + direction * 2;

      if (row === startRow && !position[twoRow][col]) {
        moves.push({
          row: twoRow,
          col: col,
        });
      }
    }

    /* CAPTURE */

    for (const dc of [-1, 1]) {
      const newRow = row + direction;

      const newCol = col + dc;

      if (!inBoard(newRow, newCol)) {
        continue;
      }

      const target = position[newRow][newCol];

      if (target && target[0] !== color) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      }
    }

    return moves;
  }

  /* knight */

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
      const newRow = row + dr;

      const newCol = col + dc;

      if (!inBoard(newRow, newCol)) {
        continue;
      }

      const target = position[newRow][newCol];

      if (!target || target[0] !== color) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      }
    }

    return moves;
  }

  /* bishop */

  if (type === "B") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);

    return moves;
  }

  /* rock */

  if (type === "R") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);

    return moves;
  }

  /* QUEEN */

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

    return moves;
  }

  /* KING */

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const newRow = row + dr;

        const newCol = col + dc;

        if (!inBoard(newRow, newCol)) {
          continue;
        }

        const target = position[newRow][newCol];

        if (!target || target[0] !== color) {
          moves.push({
            row: newRow,
            col: newCol,
          });
        }
      }
    }

    /* CASTLING */

    if (canCastle(position, color, "kingSide")) {
      moves.push({
        row: row,
        col: col + 2,
        castle: "kingSide",
      });
    }

    if (canCastle(position, color, "queenSide")) {
      moves.push({
        row: row,
        col: col - 2,
        castle: "queenSide",
      });
    }

    return moves;
  }

  return moves;
}

/* SLIDING MOVES*/

function addSlidingMoves(moves, position, row, col, color, directions) {
  for (const [dr, dc] of directions) {
    let newRow = row + dr;

    let newCol = col + dc;

    while (inBoard(newRow, newCol)) {
      const target = position[newRow][newCol];

      /* Empty */

      if (!target) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      } else if (target[0] !== color) {
        /* Enemy */
        moves.push({
          row: newRow,
          col: newCol,
        });

        break;
      } else {
        /* Own piece */
        break;
      }

      newRow += dr;
      newCol += dc;
    }
  }
}

/*make move */

function makeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = board[fromRow][fromCol];

  const capturedPiece = board[toRow][toCol];

  /* SAVE */

  undoHistory.push({
    board: copyBoard(board),

    currentPlayer,

    moveHistory: [...moveHistory],

    capturedWhite: [...capturedWhite],

    capturedBlack: [...capturedBlack],

    whiteTime,

    blackTime,

    lastMove: lastMove
      ? {
          from: { ...lastMove.from },
          to: { ...lastMove.to },
        }
      : null,

    castlingRights: {
      ...castlingRights,
    },
  });

  /* CAPTURE */

  if (capturedPiece) {
    if (capturedPiece[0] === "w") {
      capturedWhite.push(capturedPiece);
    } else {
      capturedBlack.push(capturedPiece);
    }
  }

  /* MOVE */

  board[toRow][toCol] = movingPiece;

  board[fromRow][fromCol] = null;

  /* CASTLING */

  if (movingPiece[1] === "K" && Math.abs(toCol - fromCol) === 2) {
    if (toCol > fromCol) {
      board[toRow][5] = board[toRow][7];

      board[toRow][7] = null;
    } else {
      board[toRow][3] = board[toRow][0];

      board[toRow][0] = null;
    }
  }

  /* UPDATE CASTLING RIGHTS */

  updateCastlingRights(movingPiece, fromRow, fromCol);

  if (capturedPiece) {
    updateCapturedRookRights(capturedPiece, toRow, toCol);
  }

  /* LAST MOVE */

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

  /* HISTORY */

  moveHistory.push({
    color: currentPlayer,
    notation: createNotation(
      movingPiece,
      fromRow,
      fromCol,
      toRow,
      toCol,
      capturedPiece,
    ),
  });

  selectedSquare = null;

  validMoves = [];

  updateBoard();

  updateUI();

  /* PROMOTION */

  if (movingPiece[1] === "P" && (toRow === 0 || toRow === 7)) {
    pendingPromotion = {
      row: toRow,
      col: toCol,
    };

    promotionModal.classList.add("show");

    return;
  }

  finishTurn();
}

/* CASTLING RIGHTS */

function updateCastlingRights(piece, row, col) {
  if (piece === "wK") {
    castlingRights.wKing = false;
    castlingRights.wQueen = false;
  }

  if (piece === "bK") {
    castlingRights.bKing = false;
    castlingRights.bQueen = false;
  }

  if (piece === "wR") {
    if (row === 7 && col === 0) {
      castlingRights.wQueen = false;
    }

    if (row === 7 && col === 7) {
      castlingRights.wKing = false;
    }
  }

  if (piece === "bR") {
    if (row === 0 && col === 0) {
      castlingRights.bQueen = false;
    }

    if (row === 0 && col === 7) {
      castlingRights.bKing = false;
    }
  }
}

function updateCapturedRookRights(piece, row, col) {
  if (piece === "wR" && row === 7 && col === 0) {
    castlingRights.wQueen = false;
  }

  if (piece === "wR" && row === 7 && col === 7) {
    castlingRights.wKing = false;
  }

  if (piece === "bR" && row === 0 && col === 0) {
    castlingRights.bQueen = false;
  }

  if (piece === "bR" && row === 0 && col === 7) {
    castlingRights.bKing = false;
  }
}

/* KING IN CHECK */

function isKingInCheck(position, color) {
  let kingRow = -1;
  let kingCol = -1;

  /* Find King */

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (position[row][col] === color + "K") {
        kingRow = row;
        kingCol = col;
      }
    }
  }

  if (kingRow === -1) {
    return true;
  }

  const enemy = color === "w" ? "b" : "w";

  /* Check enemy pieces */

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = position[row][col];

      if (piece && piece[0] === enemy) {
        const attacks = getAttackMoves(position, row, col);

        const attacksKing = attacks.some(
          (move) => move.row === kingRow && move.col === kingCol,
        );

        if (attacksKing) {
          return true;
        }
      }
    }
  }

  return false;
}

/*ATTACK MOVES */

function getAttackMoves(position, row, col) {
  const piece = position[row][col];

  if (!piece) {
    return [];
  }

  const color = piece[0];

  const type = piece[1];

  const moves = [];

  /* PAWN */

  if (type === "P") {
    const direction = color === "w" ? -1 : 1;

    for (const dc of [-1, 1]) {
      const newRow = row + direction;

      const newCol = col + dc;

      if (inBoard(newRow, newCol)) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      }
    }

    return moves;
  }

  /* KNIGHT */

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
      const newRow = row + dr;

      const newCol = col + dc;

      if (inBoard(newRow, newCol)) {
        moves.push({
          row: newRow,
          col: newCol,
        });
      }
    }

    return moves;
  }

  /* KING */

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const newRow = row + dr;

        const newCol = col + dc;

        if (inBoard(newRow, newCol)) {
          moves.push({
            row: newRow,
            col: newCol,
          });
        }
      }
    }

    return moves;
  }

  /* ROOK / BISHOP / QUEEN */

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
    let newRow = row + dr;

    let newCol = col + dc;

    while (inBoard(newRow, newCol)) {
      moves.push({
        row: newRow,
        col: newCol,
      });

      if (position[newRow][newCol]) {
        break;
      }

      newRow += dr;
      newCol += dc;
    }
  }

  return moves;
}

/*CASTLING*/

function canCastle(position, color, side) {
  const row = color === "w" ? 7 : 0;

  /* King */

  if (position[row][4] !== color + "K") {
    return false;
  }

  /* King already in check */

  if (isKingInCheck(position, color)) {
    return false;
  }

  /* KING SIDE */

  if (side === "kingSide") {
    const allowed = color === "w" ? castlingRights.wKing : castlingRights.bKing;

    if (!allowed) {
      return false;
    }

    if (position[row][7] !== color + "R") {
      return false;
    }

    if (position[row][5] || position[row][6]) {
      return false;
    }

    return true;
  }

  /* QUEEN SIDE */

  if (side === "queenSide") {
    const allowed =
      color === "w" ? castlingRights.wQueen : castlingRights.bQueen;

    if (!allowed) {
      return false;
    }

    if (position[row][0] !== color + "R") {
      return false;
    }

    if (position[row][1] || position[row][2] || position[row][3]) {
      return false;
    }

    return true;
  }

  return false;
}

/* CHECKMATE */

function isCheckmate(color) {
  if (!isKingInCheck(board, color)) {
    return false;
  }

  return !hasAnyLegalMove(color);
}

/*STALEMATE */

function isStalemate(color) {
  if (isKingInCheck(board, color)) {
    return false;
  }

  return !hasAnyLegalMove(color);
}

/*HAS LEGAL MOVE */

function hasAnyLegalMove(color) {
  const oldPlayer = currentPlayer;

  currentPlayer = color;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (piece && piece[0] === color) {
        const moves = getLegalMoves(row, col);

        if (moves.length > 0) {
          currentPlayer = oldPlayer;

          return true;
        }
      }
    }
  }

  currentPlayer = oldPlayer;

  return false;
}

/*FINISH TURN */

function finishTurn() {
  currentPlayer = currentPlayer === "w" ? "b" : "w";

  updateBoard();

  updateUI();

  /* CHECKMATE */

  if (isCheckmate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    const winner = currentPlayer === "w" ? "Black" : "White";

    showGameOver(winner + " Wins!", "Checkmate");

    return;
  }

  /* STALEMATE */

  if (isStalemate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    showGameOver("Draw", "Stalemate");
  }
}

/* PROMOTION */

document.querySelectorAll(".promotion-options button").forEach((button) => {
  button.addEventListener("click", () => {
    if (!pendingPromotion) {
      return;
    }

    const type = button.dataset.piece.toUpperCase();

    board[pendingPromotion.row][pendingPromotion.col] = currentPlayer + type;

    promotionModal.classList.remove("show");

    pendingPromotion = null;

    updateBoard();

    finishTurn();
  });
});

/* MOVE NOTATION */

function createNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
  const files = "abcdefgh";

  const names = {
    K: "K",
    Q: "Q",
    R: "R",
    B: "B",
    N: "N",
    P: "",
  };

  const from = files[fromCol] + (8 - fromRow);

  const to = files[toCol] + (8 - toRow);

  return names[piece[1]] + from + (captured ? "x" : "-") + to;
}

/* UI */

function updateUI() {
  const player = currentPlayer === "w" ? "White" : "Black";

  turnText.textContent = player + " Turn";

  mobileTurn.textContent = player + "'s Turn";

  updateTimers();

  renderHistory();

  renderCaptured();
}

/* history */

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

/* CAPTURED */

function renderCaptured() {
  whiteCapturedElement.textContent = capturedWhite
    .map((piece) => PIECES[piece])
    .join(" ");

  blackCapturedElement.textContent = capturedBlack
    .map((piece) => PIECES[piece])
    .join(" ");
}

/*TIMER */

function startTimer() {
  stopTimer();

  timerInterval = setInterval(() => {
    if (gameOver) {
      return;
    }

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

function stopTimer() {
  clearInterval(timerInterval);

  timerInterval = null;
}

function updateTimers() {
  whiteTimerElement.textContent = formatTime(whiteTime);

  blackTimerElement.textContent = formatTime(blackTime);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);

  const secs = seconds % 60;

  return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

/*  UNDO*/

function undoMove() {
  if (undoHistory.length === 0 || gameOver) {
    return;
  }

  const previous = undoHistory.pop();

  board = copyBoard(previous.board);

  currentPlayer = previous.currentPlayer;

  moveHistory = [...previous.moveHistory];

  capturedWhite = [...previous.capturedWhite];

  capturedBlack = [...previous.capturedBlack];

  whiteTime = previous.whiteTime;

  blackTime = previous.blackTime;

  lastMove = previous.lastMove;

  castlingRights = { ...previous.castlingRights };

  selectedSquare = null;

  validMoves = [];

  updateBoard();

  updateUI();

  startTimer();
}

/* BUTTONS */

newGameBtn.addEventListener("click", initGame);

resetBtn.addEventListener("click", initGame);

undoBtn.addEventListener("click", undoMove);

/* SETTINGS */

settingsBtn.addEventListener("click", () => {
  alert("Settings is not available yet.");
});

/* GAME OVER MODAL */

function showGameOver(title, text) {
  modalTitle.textContent = title;

  modalText.textContent = text;

  gameModal.classList.add("show");
}

/* PLAY AGAIN*/

modalNewGame.addEventListener("click", () => {
  gameModal.classList.remove("show");

  initGame();
});

/* COPY BOARD */

function copyBoard(position) {
  return position.map((row) => [...row]);
}

/*    BOARD CHECK*/

function inBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/* START */

initGame();
