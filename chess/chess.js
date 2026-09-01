/* =====================================================
   CHESS GAME
===================================================== */

// ===============================
// HTML ELEMENTS
// ===============================

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

// =====================================================
// CHESS PIECES
// =====================================================

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

// =====================================================
// INITIAL BOARD
// =====================================================

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

// =====================================================
// GAME VARIABLES
// =====================================================

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

// =====================================================
// CASTLING RIGHTS
// =====================================================

let castlingRights = {
  wKing: true,
  wQueen: true,
  bKing: true,
  bQueen: true,
};

// =====================================================
// TIMER
// =====================================================

let whiteTime = 10 * 60;
let blackTime = 10 * 60;

let timerInterval = null;

// =====================================================
// START GAME
// =====================================================

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

  whiteTime = 10 * 60;
  blackTime = 10 * 60;

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

// =====================================================
// CREATE / UPDATE BOARD
// =====================================================

function updateBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");

      square.classList.add("square");

      // Light / Dark
      if ((row + col) % 2 === 0) {
        square.classList.add("light");
      } else {
        square.classList.add("dark");
      }

      square.dataset.row = row;
      square.dataset.col = col;

      // ===============================
      // LAST MOVE
      // ===============================

      if (
        lastMove &&
        ((lastMove.from.row === row && lastMove.from.col === col) ||
          (lastMove.to.row === row && lastMove.to.col === col))
      ) {
        square.classList.add("last-move");
      }

      // ===============================
      // SELECTED SQUARE
      // ===============================

      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        square.classList.add("selected");
      }

      // ===============================
      // VALID MOVES
      // ===============================

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

      // ===============================
      // RANK
      // ===============================

      if (col === 0) {
        const rank = document.createElement("span");

        rank.className = "rank";

        rank.textContent = 8 - row;

        square.appendChild(rank);
      }

      // ===============================
      // FILE
      // ===============================

      if (row === 7) {
        const file = document.createElement("span");

        file.className = "file";

        file.textContent = String.fromCharCode(97 + col);

        square.appendChild(file);
      }

      // ===============================
      // PIECE
      // ===============================

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

      // ===============================
      // CLICK
      // ===============================

      square.addEventListener("click", () => handleSquareClick(row, col));

      boardElement.appendChild(square);
    }
  }
}

// =====================================================
// SQUARE CLICK
// =====================================================

function handleSquareClick(row, col) {
  if (gameOver) {
    return;
  }

  const piece = board[row][col];

  // ===============================
  // MOVE TO VALID SQUARE
  // ===============================

  const move = validMoves.find((m) => m.row === row && m.col === col);

  if (selectedSquare && move) {
    makeMove(selectedSquare.row, selectedSquare.col, row, col);

    return;
  }

  // ===============================
  // SELECT CURRENT PLAYER PIECE
  // ===============================

  if (piece && piece[0] === currentPlayer) {
    selectedSquare = {
      row: row,
      col: col,
    };

    validMoves = getLegalMoves(row, col);

    updateBoard();

    return;
  }

  // ===============================
  // CLEAR SELECTION
  // ===============================

  selectedSquare = null;

  validMoves = [];

  updateBoard();
}

// =====================================================
// GET LEGAL MOVES
// =====================================================

function getLegalMoves(row, col) {
  const piece = board[row][col];

  if (!piece) {
    return [];
  }

  if (piece[0] !== currentPlayer) {
    return [];
  }

  const moves = getPseudoMoves(board, row, col, true);

  return moves.filter((move) => {
    const testBoard = copyBoard(board);

    movePieceOnBoard(testBoard, row, col, move.row, move.col);

    // Castling test
    if (move.castle) {
      if (move.castle === "kingSide") {
        movePieceOnBoard(testBoard, row, 7, row, 5);
      }

      if (move.castle === "queenSide") {
        movePieceOnBoard(testBoard, row, 0, row, 3);
      }
    }

    return !isKingInCheck(testBoard, piece[0]);
  });
}

// =====================================================
// PSEUDO MOVES
// =====================================================

function getPseudoMoves(position, row, col, includeSpecial = true) {
  const piece = position[row][col];

  if (!piece) {
    return [];
  }

  const color = piece[0];

  const type = piece[1];

  const moves = [];

  // ===================================================
  // PAWN
  // ===================================================

  if (type === "P") {
    const direction = color === "w" ? -1 : 1;

    const startRow = color === "w" ? 6 : 1;

    const oneRow = row + direction;

    // ONE STEP

    if (inBoard(oneRow, col) && !position[oneRow][col]) {
      moves.push({
        row: oneRow,
        col: col,
      });

      // TWO STEP

      const twoRow = row + direction * 2;

      if (row === startRow && inBoard(twoRow, col) && !position[twoRow][col]) {
        moves.push({
          row: twoRow,
          col: col,
        });
      }
    }

    // DIAGONAL CAPTURE

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
  }

  // ===================================================
  // KNIGHT
  // ===================================================

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

      if (!inBoard(r, c)) {
        continue;
      }

      if (!position[r][c] || position[r][c][0] !== color) {
        moves.push({
          row: r,
          col: c,
        });
      }
    }
  }

  // ===================================================
  // KING
  // ===================================================

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const r = row + dr;
        const c = col + dc;

        if (!inBoard(r, c)) {
          continue;
        }

        if (!position[r][c] || position[r][c][0] !== color) {
          moves.push({
            row: r,
            col: c,
          });
        }
      }
    }

    // CASTLING

    if (includeSpecial) {
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
    }
  }

  // ===================================================
  // ROOK
  // ===================================================

  if (type === "R") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  // ===================================================
  // BISHOP
  // ===================================================

  if (type === "B") {
    addSlidingMoves(moves, position, row, col, color, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  // ===================================================
  // QUEEN
  // ===================================================

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

// =====================================================
// SLIDING PIECES
// =====================================================

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

// =====================================================
// MAKE MOVE
// =====================================================

function makeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = board[fromRow][fromCol];

  const capturedPiece = board[toRow][toCol];

  // ===============================
  // SAVE FOR UNDO
  // ===============================

  undoHistory.push({
    board: copyBoard(board),

    currentPlayer: currentPlayer,

    moveHistory: [...moveHistory],

    capturedWhite: [...capturedWhite],

    capturedBlack: [...capturedBlack],

    whiteTime: whiteTime,

    blackTime: blackTime,

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

  // ===============================
  // CAPTURE
  // ===============================

  if (capturedPiece) {
    if (capturedPiece[0] === "w") {
      capturedWhite.push(capturedPiece);
    } else {
      capturedBlack.push(capturedPiece);
    }
  }

  // ===============================
  // MOVE PIECE
  // ===============================

  board[toRow][toCol] = movingPiece;

  board[fromRow][fromCol] = null;

  // ===============================
  // UPDATE CASTLING RIGHTS
  // ===============================

  updateCastlingRights(movingPiece, fromRow, fromCol);

  if (capturedPiece) {
    updateCapturedRookRights(capturedPiece, toRow, toCol);
  }

  // ===============================
  // CASTLING
  // ===============================

  if (movingPiece[1] === "K" && Math.abs(toCol - fromCol) === 2) {
    // KING SIDE

    if (toCol > fromCol) {
      board[toRow][5] = board[toRow][7];

      board[toRow][7] = null;
    }

    // QUEEN SIDE
    else {
      board[toRow][3] = board[toRow][0];

      board[toRow][0] = null;
    }
  }

  // ===============================
  // LAST MOVE
  // ===============================

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

  // ===============================
  // NOTATION
  // ===============================

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
    notation: notation,
  });

  // ===============================
  // CLEAR SELECTION
  // ===============================

  selectedSquare = null;

  validMoves = [];

  updateBoard();
  updateUI();

  // ===============================
  // PROMOTION
  // ===============================

  if (movingPiece[1] === "P" && (toRow === 0 || toRow === 7)) {
    pendingPromotion = {
      row: toRow,
      col: toCol,
    };

    promotionModal.classList.add("show");

    return;
  }

  // ===============================
  // NEXT TURN
  // ===============================

  finishTurn();
}

// =====================================================
// CASTLING RIGHTS UPDATE
// =====================================================

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

// =====================================================
// CAPTURED ROOK CASTLING RIGHTS
// =====================================================

function updateCapturedRookRights(piece, row, col) {
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

// =====================================================
// PROMOTION
// =====================================================

document.querySelectorAll(".promotion-options button").forEach((button) => {
  button.addEventListener("click", () => {
    if (!pendingPromotion) {
      return;
    }

    const piece = button.dataset.piece;

    board[pendingPromotion.row][pendingPromotion.col] =
      currentPlayer + piece.toUpperCase();

    promotionModal.classList.remove("show");

    pendingPromotion = null;

    updateBoard();

    finishTurn();
  });
});

// =====================================================
// FINISH TURN
// =====================================================

function finishTurn() {
  currentPlayer = currentPlayer === "w" ? "b" : "w";

  updateUI();
  updateBoard();

  // ===============================
  // CHECKMATE
  // ===============================

  if (isCheckmate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    const winner = currentPlayer === "w" ? "Black" : "White";

    showGameOver(winner + " Wins!", "Checkmate");

    return;
  }

  // ===============================
  // STALEMATE
  // ===============================

  if (isStalemate(currentPlayer)) {
    gameOver = true;

    stopTimer();

    showGameOver("Draw", "Stalemate");

    return;
  }
}

// =====================================================
// KING IN CHECK
// =====================================================

function isKingInCheck(position, color) {
  let king = null;

  // Find king

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

    if (king) {
      break;
    }
  }

  if (!king) {
    return true;
  }

  const opponent = color === "w" ? "b" : "w";

  // Check attacks

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = position[r][c];

      if (piece && piece[0] === opponent) {
        const attacks = getAttackMoves(position, r, c);

        const attacksKing = attacks.some(
          (move) => move.row === king.row && move.col === king.col,
        );

        if (attacksKing) {
          return true;
        }
      }
    }
  }

  return false;
}

// =====================================================
// ATTACK MOVES
// =====================================================

function getAttackMoves(position, row, col) {
  const piece = position[row][col];

  if (!piece) {
    return [];
  }

  const color = piece[0];
  const type = piece[1];

  const moves = [];

  // ===============================
  // PAWN
  // ===============================

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

  // ===============================
  // KNIGHT
  // ===============================

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

  // ===============================
  // KING
  // ===============================

  if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }

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

  // ===============================
  // ROOK
  // ===============================

  let directions = [];

  if (type === "R") {
    directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
  }

  // ===============================
  // BISHOP
  // ===============================

  if (type === "B") {
    directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  // ===============================
  // QUEEN
  // ===============================

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

  // Sliding attacks

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (inBoard(r, c)) {
      moves.push({
        row: r,
        col: c,
      });

      // Stop after first piece

      if (position[r][c]) {
        break;
      }

      r += dr;
      c += dc;
    }
  }

  return moves;
}

// =====================================================
// CHECKMATE
// =====================================================

function isCheckmate(color) {
  if (!isKingInCheck(board, color)) {
    return false;
  }

  return !hasLegalMove(color);
}

// =====================================================
// STALEMATE
// =====================================================

function isStalemate(color) {
  if (isKingInCheck(board, color)) {
    return false;
  }

  return !hasLegalMove(color);
}

// =====================================================
// HAS LEGAL MOVE
// =====================================================

function hasLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];

      if (piece && piece[0] === color) {
        const moves = getPseudoMoves(board, r, c, true);

        for (const move of moves) {
          const test = copyBoard(board);

          movePieceOnBoard(test, r, c, move.row, move.col);

          if (move.castle) {
            if (move.castle === "kingSide") {
              movePieceOnBoard(test, r, 7, r, 5);
            }

            if (move.castle === "queenSide") {
              movePieceOnBoard(test, r, 0, r, 3);
            }
          }

          if (!isKingInCheck(test, color)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// =====================================================
// CASTLING
// =====================================================

function canCastle(position, color, side) {
  const row = color === "w" ? 7 : 0;

  // King must be present

  if (position[row][4] !== color + "K") {
    return false;
  }

  // King cannot castle from check

  if (isKingInCheck(position, color)) {
    return false;
  }

  // ===============================
  // KING SIDE
  // ===============================

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

    // Test square f

    const test1 = copyBoard(position);

    movePieceOnBoard(test1, row, 4, row, 5);

    if (isKingInCheck(test1, color)) {
      return false;
    }

    // Test square g

    const test2 = copyBoard(position);

    movePieceOnBoard(test2, row, 4, row, 6);

    if (isKingInCheck(test2, color)) {
      return false;
    }

    return true;
  }

  // ===============================
  // QUEEN SIDE
  // ===============================

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

    // Test square d

    const test1 = copyBoard(position);

    movePieceOnBoard(test1, row, 4, row, 3);

    if (isKingInCheck(test1, color)) {
      return false;
    }

    // Test square c

    const test2 = copyBoard(position);

    movePieceOnBoard(test2, row, 4, row, 2);

    if (isKingInCheck(test2, color)) {
      return false;
    }

    return true;
  }

  return false;
}

// =====================================================
// MOVE PIECE ON TEST BOARD
// =====================================================

function movePieceOnBoard(position, fromRow, fromCol, toRow, toCol) {
  position[toRow][toCol] = position[fromRow][fromCol];

  position[fromRow][fromCol] = null;
}

// =====================================================
// COPY BOARD
// =====================================================

function copyBoard(position) {
  return position.map((row) => [...row]);
}

// =====================================================
// BOARD CHECK
// =====================================================

function inBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// =====================================================
// NOTATION
// =====================================================

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

// =====================================================
// UPDATE UI
// =====================================================

function updateUI() {
  const name = currentPlayer === "w" ? "White" : "Black";

  turnText.textContent = name + " Turn";

  mobileTurn.textContent = name + "'s Turn";

  renderHistory();

  renderCaptured();

  updateTimers();
}

// =====================================================
// MOVE HISTORY
// =====================================================

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

// =====================================================
// CAPTURED PIECES
// =====================================================

function renderCaptured() {
  whiteCapturedElement.innerHTML = capturedWhite
    .map((piece) => PIECES[piece])
    .join("");

  blackCapturedElement.innerHTML = capturedBlack
    .map((piece) => PIECES[piece])
    .join("");
}

// =====================================================
// TIMER START
// =====================================================

function startTimer() {
  stopTimer();

  timerInterval = setInterval(() => {
    if (gameOver) {
      return;
    }

    // ===============================
    // WHITE TIMER
    // ===============================

    if (currentPlayer === "w") {
      whiteTime--;

      if (whiteTime <= 0) {
        whiteTime = 0;

        gameOver = true;

        stopTimer();

        showGameOver("Black Wins!", "White ran out of time");
      }
    }

    // ===============================
    // BLACK TIMER
    // ===============================
    else {
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

// =====================================================
// STOP TIMER
// =====================================================

function stopTimer() {
  clearInterval(timerInterval);

  timerInterval = null;
}

// =====================================================
// UPDATE TIMER
// =====================================================

function updateTimers() {
  whiteTimerElement.textContent = formatTime(whiteTime);

  blackTimerElement.textContent = formatTime(blackTime);
}

// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);

  const sec = seconds % 60;

  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

// =====================================================
// UNDO
// =====================================================

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

  lastMove = previous.lastMove
    ? {
        from: {
          ...previous.lastMove.from,
        },
        to: {
          ...previous.lastMove.to,
        },
      }
    : null;

  castlingRights = {
    ...previous.castlingRights,
  };

  selectedSquare = null;

  validMoves = [];

  updateBoard();

  updateUI();

  startTimer();
}

// =====================================================
// RESET
// =====================================================

function resetGame() {
  initGame();
}

// =====================================================
// NEW GAME BUTTON
// =====================================================

newGameBtn.addEventListener("click", () => {
  initGame();
});

// =====================================================
// RESET BUTTON
// =====================================================

resetBtn.addEventListener("click", () => {
  initGame();
});

// =====================================================
// UNDO BUTTON
// =====================================================

undoBtn.addEventListener("click", () => {
  undoMove();
});

// =====================================================
// SETTINGS BUTTON
// =====================================================

// HTML ထဲမှာ Settings panel မရှိတဲ့အတွက်
// Error မတက်အောင် button ကို ဒီလိုပဲထားထားတယ်။

settingsBtn.addEventListener("click", () => {
  alert("Settings is not available yet.");
});

// =====================================================
// GAME OVER
// =====================================================

function showGameOver(title, reason) {
  modalTitle.textContent = title;

  modalText.textContent = reason;

  gameModal.classList.add("show");
}

// =====================================================
// PLAY AGAIN
// =====================================================

modalNewGame.addEventListener("click", () => {
  gameModal.classList.remove("show");

  initGame();
});

// =====================================================
// START
// =====================================================

initGame();
