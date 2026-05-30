const sessions = new Map();
const games = new Map();
const matchQueue = [];

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      mode: 'menu',
      lessonId: null,
      lessonStep: 0,
      gameId: null,
      selectedSquare: null,
      boardMessageId: null,
      puzzleIndex: null,
      puzzleStep: 0,
      puzzleHintUsed: false,
      puzzleStats: { streak: 0, bestStreak: 0, solved: 0 },
    });
  }
  return sessions.get(userId);
}

function resetSession(userId) {
  const prev = sessions.get(userId);
  const puzzleStats = prev?.puzzleStats || { streak: 0, bestStreak: 0, solved: 0 };
  sessions.set(userId, {
    mode: 'menu',
    lessonId: null,
    lessonStep: 0,
    gameId: null,
    selectedSquare: null,
    boardMessageId: null,
    puzzleIndex: null,
    puzzleStep: 0,
    puzzleHintUsed: false,
    puzzleStats,
  });
}

function createGame({ white, black, mode, difficulty = 'medium' }) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const game = {
    id,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    white,
    black,
    mode,
    difficulty,
    createdAt: Date.now(),
  };
  games.set(id, game);
  return game;
}

function getGame(gameId) {
  return games.get(gameId) || null;
}

function deleteGame(gameId) {
  games.delete(gameId);
}

function getUserGame(userId) {
  for (const game of games.values()) {
    if (game.white === userId || game.black === userId) return game;
  }
  return null;
}

function addToQueue(userId) {
  if (!matchQueue.includes(userId)) matchQueue.push(userId);
}

function removeFromQueue(userId) {
  const idx = matchQueue.indexOf(userId);
  if (idx !== -1) matchQueue.splice(idx, 1);
}

function isInQueue(userId) {
  return matchQueue.includes(userId);
}

function tryMatch() {
  if (matchQueue.length < 2) return null;
  const white = matchQueue.shift();
  const black = matchQueue.shift();
  return createGame({ white, black, mode: 'online' });
}

function getOpponent(game, userId) {
  if (game.white === userId) return game.black;
  if (game.black === userId) return game.white;
  return null;
}

function userColor(game, userId) {
  if (game.white === userId) return 'w';
  if (game.black === userId) return 'b';
  return null;
}

module.exports = {
  getSession,
  resetSession,
  createGame,
  getGame,
  deleteGame,
  getUserGame,
  addToQueue,
  removeFromQueue,
  isInQueue,
  tryMatch,
  getOpponent,
  userColor,
};
