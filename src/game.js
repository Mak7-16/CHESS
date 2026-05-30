const { Chess } = require('chess.js');
const store = require('./store');
const ui = require('./ui');
const engine = require('./engine');

function tryMove(fen, from, to) {
  const chess = new Chess(fen);
  const move = chess.move({ from, to, promotion: 'q' });
  if (!move) return null;
  return { fen: chess.fen(), move, chess };
}

function buildGameMessage(game, userId) {
  const color = store.userColor(game, userId);
  const opponentLabel = game.mode === 'bot' ? 'бот' : 'гравець';
  const status = ui.gameStatusText(game.fen, color, opponentLabel);
  const board = ui.renderBoard(game.fen, color, null);
  const chess = new Chess(game.fen);
  const canMove = !chess.isGameOver() && chess.turn() === color;

  return {
    text: `${status}\n\n\`\`\`\n${board}\n\`\`\``,
    keyboard: ui.getBoardKeyboard(game.fen, color, null, canMove),
    parse_mode: 'Markdown',
    isOver: chess.isGameOver(),
  };
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
    msg.keyboard = ui.getBoardKeyboard(game.fen, color, square, true);
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

  if (game.mode === 'bot' && game.black === 'bot') {
    const afterUser = new Chess(game.fen);
    if (!afterUser.isGameOver() && afterUser.turn() === 'b') {
      const botMove = engine.getBotMove(game.fen, game.difficulty);
      if (botMove) {
        const botResult = tryMove(game.fen, botMove.from, botMove.to);
        if (botResult) game.fen = botResult.fen;
      }
    }
  }

  await notifyBothPlayers(ctx, game);
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

module.exports = {
  tryMove,
  buildGameMessage,
  updateBoardForUser,
  notifyBothPlayers,
  handleSquareClick,
  startBotGame,
};
