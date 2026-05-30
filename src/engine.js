const { Chess } = require('chess.js');

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function evaluate(chess) {
  let score = 0;
  const board = chess.board();

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type];
      score += piece.color === 'w' ? value : -value;
    }
  }

  return score;
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => {
    const captureA = a.captured ? PIECE_VALUES[a.captured] : 0;
    const captureB = b.captured ? PIECE_VALUES[b.captured] : 0;
    return captureB - captureA;
  });
}

function minimax(chess, depth, alpha, beta, maximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      maxEval = Math.max(maxEval, minimax(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of moves) {
    chess.move(move);
    minEval = Math.min(minEval, minimax(chess, depth - 1, alpha, beta, true));
    chess.undo();
    beta = Math.min(beta, minEval);
    if (beta <= alpha) break;
  }
  return minEval;
}

function pickBestMove(chess, depth) {
  const moves = orderMoves(chess.moves({ verbose: true }));
  let bestMove = moves[0];
  let bestScore = chess.turn() === 'w' ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, chess.turn() === 'w');
    chess.undo();

    if (chess.turn() === 'w') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getBotMove(fen, difficulty) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    const captures = moves.filter((m) => m.captured);
    const pool = captures.length > 0 && Math.random() < 0.6 ? captures : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (difficulty === 'medium') {
    return pickBestMove(chess, 2);
  }

  return pickBestMove(chess, 3);
}

module.exports = { getBotMove };
