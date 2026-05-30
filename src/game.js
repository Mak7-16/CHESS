const { Chess } = require('chess.js');
const store = require('./store');
const ui = require('./ui');
const engine = require('./engine');
const profile = require('./profile');
const quests = require('./quests');

function tryMove(fen, from, to) {
  const chess = new Chess(fen);
  const move = chess.move({ from, to, promotion: 'q' });
  if (!move) return null;
  return { fen: chess.fen(), move, chess };
}

function survivalDifficulty(wins) {
  if (wins >= 6) return 'hard';
  if (wins >= 3) return 'medium';
  return 'easy';
}

function buildGameMessage(game, userId) {
  const color = store.userColor(game, userId);
  const opponentLabel =
    game.mode === 'hotseat'
      ? 'друг (2 гравець)'
      : game.mode === 'bot'
        ? 'бот'
        : game.mode === 'survival'
          ? 'полювання'
          : 'гравець';
  let status = ui.gameStatusText(game.fen, color, opponentLabel);

  if (game.mode === 'survival' && game.survivalWins > 0) {
    status = `⚡ Полювання: ${game.survivalWins} перемог поспіль\n${status}`;
  }

  const board = ui.renderBoard(game.fen, color, null);
  const chess = new Chess(game.fen);
  const canMove = !chess.isGameOver() && chess.turn() === color;

  return {
    text: `${status}\n\n\`\`\`\n${board}\n\`\`\``,
    keyboard: ui.getBoardKeyboard(game.fen, color, null, canMove, game.mode === 'bot' || game.mode === 'survival'),
    parse_mode: 'Markdown',
    isOver: chess.isGameOver(),
  };
}

function checkGameEnd(game, userId) {
  const chess = new Chess(game.fen);
  if (!chess.isGameOver()) return null;

  const color = store.userColor(game, userId);
  const userWon = chess.isCheckmate() && chess.turn() !== color;

  if (game.mode === 'survival') {
    if (userWon) {
      profile.onGameWon(userId);
      game.survivalWins = (game.survivalWins || 0) + 1;
      const p = profile.getProfile(userId);
      if (game.survivalWins > p.stats.survivalBest) p.stats.survivalBest = game.survivalWins;
      profile.checkAchievements(userId);
      return { survivalContinue: true, wins: game.survivalWins };
    }
    const p = profile.getProfile(userId);
    return { survivalEnd: true, wins: game.survivalWins || 0, best: p.stats.survivalBest };
  }

  if (userWon && (game.mode === 'bot' || game.mode === 'survival')) {
    profile.onGameWon(userId);
    const p = profile.getProfile(userId);
    quests.markQuest(p, 'botWin');
    return { userWon: true };
  }

  return { userWon: false };
}

async function updateBoardForUser(ctx, game, userId) {
  const session = store.getSession(userId);
  const msg = buildGameMessage(game, userId);

  if (session.boardMessageId) {
    try {
      await ctx.telegram.editMessageText(
        userId,
        session.boardMessageId,
        undefined,
        msg.text,
        { parse_mode: msg.parse_mode, reply_markup: msg.keyboard.reply_markup }
      );
      return;
    } catch {
      // повідомлення видалено або не змінилось
    }
  }

  const sent = await ctx.telegram.sendMessage(userId, msg.text, {
    parse_mode: msg.parse_mode,
    reply_markup: msg.keyboard.reply_markup,
  });
  session.boardMessageId = sent.message_id;
}

async function notifyBothPlayers(ctx, game) {
  await updateBoardForUser(ctx, game, game.white);
  if (game.black !== 'bot') {
    await updateBoardForUser(ctx, game, game.black);
  }
}

async function handleSquareClick(ctx, userId, square) {
  const session = store.getSession(userId);
  const game = store.getGame(session.gameId);

  if (!game || session.mode !== 'playing') {
    await ctx.answerCbQuery('Немає активної гри.');
    return;
  }

  const color = store.userColor(game, userId);
  const chess = new Chess(game.fen);

  if (chess.isGameOver()) {
    await ctx.answerCbQuery('Гра вже завершена.');
    return;
  }

  if (chess.turn() !== color) {
    await ctx.answerCbQuery('Зараз не ваш хід.');
    return;
  }

  if (!session.selectedSquare) {
    const board = chess.board();
    const idx = ui.squareToIdx(square);
    const piece = board[Math.floor(idx / 8)][idx % 8];
    if (!piece || piece.color !== color) {
      await ctx.answerCbQuery('Оберіть свою фігуру.');
      return;
    }
    session.selectedSquare = square;
    const msg = buildGameMessage(game, userId);
    msg.keyboard = ui.getBoardKeyboard(game.fen, color, square, true, game.mode === 'bot' || game.mode === 'survival');
    await ctx.editMessageText(msg.text, { parse_mode: msg.parse_mode, reply_markup: msg.keyboard.reply_markup });
    await ctx.answerCbQuery(`Обрано: ${square}`);
    return;
  }

  const result = tryMove(game.fen, session.selectedSquare, square);
  session.selectedSquare = null;

  if (!result) {
    await ctx.answerCbQuery('Неможливий хід.');
    const msg = buildGameMessage(game, userId);
    await ctx.editMessageText(msg.text, { parse_mode: msg.parse_mode, reply_markup: msg.keyboard.reply_markup });
    return;
  }

  game.fen = result.fen;
  await ctx.answerCbQuery(`${result.move.from}→${result.move.to}`);

  if (game.mode === 'bot' || game.mode === 'survival') {
    if (game.black === 'bot') {
      const afterUser = new Chess(game.fen);
      if (!afterUser.isGameOver() && afterUser.turn() === 'b') {
        const diff = game.mode === 'survival' ? survivalDifficulty(game.survivalWins || 0) : game.difficulty;
        const botMove = engine.getBotMove(game.fen, diff);
        if (botMove) {
          const botResult = tryMove(game.fen, botMove.from, botMove.to);
          if (botResult) game.fen = botResult.fen;
        }
      }
    }
  }

  await notifyBothPlayers(ctx, game);

  const end = checkGameEnd(game, userId);

  if (end?.survivalContinue) {
    const wins = end.wins;
    store.deleteGame(game.id);
    const diff = survivalDifficulty(wins);
    const newGame = store.createGame({
      white: userId,
      black: 'bot',
      mode: 'survival',
      difficulty: diff,
    });
    newGame.survivalWins = wins;
    session.gameId = newGame.id;
    session.selectedSquare = null;
    session.boardMessageId = null;
    await ctx.telegram.sendMessage(
      userId,
      `🔥 *Перемога ${wins}!* Наступний суперник сильніший (${diff}).\n+50 XP`,
      { parse_mode: 'Markdown' }
    );
    await updateBoardForUser(ctx, newGame, userId);
    return;
  }

  if (end?.survivalEnd) {
    await ctx.telegram.sendMessage(
      userId,
      `💀 *Полювання завершено!*\n\nПеремог поспіль: *${end.wins}*\nРекорд: *${end.best}*`,
      { parse_mode: 'Markdown', ...ui.getGamesMenu() }
    );
    store.deleteGame(game.id);
    session.mode = 'menu';
    return;
  }

  if (end?.userWon && game.mode === 'bot') {
    await ctx.telegram.sendMessage(userId, '🏆 Перемога! +50 XP', { parse_mode: 'Markdown' });
  }
}

async function startBotGame(ctx, userId, difficulty) {
  const existing = store.getUserGame(userId);
  if (existing) store.deleteGame(existing.id);

  const game = store.createGame({ white: userId, black: 'bot', mode: 'bot', difficulty });
  const session = store.getSession(userId);
  session.mode = 'playing';
  session.gameId = game.id;
  session.selectedSquare = null;
  session.boardMessageId = null;

  await ctx.editMessageText('🤖 Гра почалась! Ви граєте білими.');
  await updateBoardForUser(ctx, game, userId);
}

async function startHotseatGame(ctx, userId) {
  const existing = store.getUserGame(userId);
  if (existing) store.deleteGame(existing.id);

  const game = store.createGame({ white: userId, black: userId, mode: 'hotseat', difficulty: 'medium' });
  const session = store.getSession(userId);
  session.mode = 'playing';
  session.gameId = game.id;
  session.selectedSquare = null;
  session.boardMessageId = null;

  await ctx.editMessageText(
    '👥 *Гра на одному телефоні*\n\n' +
      'Білі ходять першими, потім чорні. Передавайте телефон друзям!',
    { parse_mode: 'Markdown' }
  );
  await updateBoardForUser(ctx, game, userId);
}

async function startSurvivalGame(ctx, userId, difficulty) {
  const existing = store.getUserGame(userId);
  if (existing) store.deleteGame(existing.id);

  const game = store.createGame({ white: userId, black: 'bot', mode: 'survival', difficulty });
  game.survivalWins = 0;
  const session = store.getSession(userId);
  session.mode = 'playing';
  session.gameId = game.id;
  session.survivalWins = 0;
  session.selectedSquare = null;
  session.boardMessageId = null;

  await ctx.editMessageText('⚡ *Полювання почалось!* Перемагай бота знову і знову!', {
    parse_mode: 'Markdown',
  });
  await updateBoardForUser(ctx, game, userId);
}

async function showHint(ctx, userId) {
  const session = store.getSession(userId);
  const game = store.getGame(session.gameId);
  if (!game) return;

  const chess = new Chess(game.fen);
  const diff = game.mode === 'survival' ? survivalDifficulty(game.survivalWins || 0) : game.difficulty;
  const botMove = engine.getBotMove(chess.fen(), diff);
  if (!botMove) {
    await ctx.answerCbQuery('Немає підказки.');
    return;
  }
  await ctx.answerCbQuery(`💡 Спробуй: ${botMove.from}→${botMove.to}`, { show_alert: true });
}

module.exports = {
  tryMove,
  buildGameMessage,
  updateBoardForUser,
  notifyBothPlayers,
  handleSquareClick,
  startBotGame,
  startSurvivalGame,
  startHotseatGame,
  showHint,
};
