const { Chess } = require('chess.js');
const store = require('./store');
const ui = require('./ui');
const { getPuzzle, getTitle, getRandomPuzzleIndex } = require('./puzzles');

function getStats(userId) {
  const session = store.getSession(userId);
  if (!session.puzzleStats) {
    session.puzzleStats = { streak: 0, bestStreak: 0, solved: 0 };
  }
  return session.puzzleStats;
}

function buildPuzzleMessage(puzzle, stats) {
  const colorLabel = puzzle.color === 'w' ? 'білих' : 'чорних';
  const board = ui.renderBoard(puzzle.fen, puzzle.color);
  const title = getTitle(stats.solved);

  return (
    `🧩 *${puzzle.title}* · ${title}\n` +
    `🔥 Серія: ${stats.streak} · 🏆 Рекорд: ${stats.bestStreak} · ✅ Вирішено: ${stats.solved}\n\n` +
    `🎯 Хід *${colorLabel}*. Знайди найсильніший хід!\n\n` +
    `\`\`\`\n${board}\n\`\`\``
  );
}

async function showPuzzle(ctx, userId, puzzleIndex) {
  const session = store.getSession(userId);
  const puzzle = getPuzzle(puzzleIndex);
  const stats = getStats(userId);

  session.mode = 'puzzle';
  session.puzzleIndex = puzzleIndex;
  session.puzzleStep = 0;
  session.selectedSquare = null;
  session.puzzleHintUsed = false;

  const text = buildPuzzleMessage(puzzle, stats);
  const keyboard = ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, null);

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.reply_markup,
  });
}

async function startRandomPuzzle(ctx, userId) {
  const session = store.getSession(userId);
  const index = getRandomPuzzleIndex(session.puzzleIndex ?? -1);
  await showPuzzle(ctx, userId, index);
}

async function handlePuzzleSquare(ctx, userId, square) {
  const session = store.getSession(userId);
  const puzzle = getPuzzle(session.puzzleIndex);
  const stats = getStats(userId);
  const chess = new Chess(puzzle.fen);

  if (chess.turn() !== puzzle.color) {
    await ctx.answerCbQuery('Помилка позиції.');
    return;
  }

  if (!session.selectedSquare) {
    const board = chess.board();
    const idx = ui.squareToIdx(square);
    const piece = board[Math.floor(idx / 8)][idx % 8];
    if (!piece || piece.color !== puzzle.color) {
      await ctx.answerCbQuery('Оберіть свою фігуру.');
      return;
    }
    session.selectedSquare = square;
    const text = buildPuzzleMessage(puzzle, stats);
    const keyboard = ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, square);
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup,
    });
    await ctx.answerCbQuery(`Обрано: ${square}`);
    return;
  }

  const expected = puzzle.solution[session.puzzleStep];
  const correct =
    session.selectedSquare === expected.from && square === expected.to;

  session.selectedSquare = null;

  if (!correct) {
    stats.streak = 0;
    await ctx.answerCbQuery('❌ Не те! Спробуй ще.');
    const colorLabel = puzzle.color === 'w' ? 'білих' : 'чорних';
    const board = ui.renderBoard(puzzle.fen, puzzle.color);
    const text =
      `😔 *Майже!*\n\n${puzzle.explanation}\n\n` +
      `🎯 Хід *${colorLabel}*:\n\n\`\`\`\n${board}\n\`\`\``;
    const keyboard = ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, null);
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup,
    });
    return;
  }

  session.puzzleStep += 1;

  if (session.puzzleStep < puzzle.solution.length) {
    await ctx.answerCbQuery('✅ Вірно! Продовжуй...');
    return;
  }

  stats.solved += 1;
  stats.streak += 1;
  if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;

  const milestone =
    stats.streak === 3
      ? '\n\n🔥 *3 вірних поспіль — ти в ударі!*'
      : stats.streak === 5
        ? '\n\n⚡ *5 поспіль — справжній тактик!*'
        : stats.streak === 10
          ? '\n\n👑 *10 поспіль — легенда!*'
          : '';

  await ctx.answerCbQuery('🎉 Вірно!');

  const nextIndex = getRandomPuzzleIndex(session.puzzleIndex);
  const nextPuzzle = getPuzzle(nextIndex);
  const title = getTitle(stats.solved);

  const text =
    `✅ *Розв’язано!*\n\n${puzzle.explanation}${milestone}\n\n` +
    `📊 Серія: *${stats.streak}* · Рекорд: *${stats.bestStreak}*\n` +
    `Звання: ${title}\n\n` +
    `➡️ Наступна: *${nextPuzzle.title}*`;

  session.puzzleIndex = nextIndex;
  session.puzzleStep = 0;

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...ui.getPuzzleSolvedMenu(nextIndex),
  });
}

async function showHint(ctx, userId) {
  const session = store.getSession(userId);
  const puzzle = getPuzzle(session.puzzleIndex);

  if (session.puzzleHintUsed) {
    await ctx.answerCbQuery('Підказку вже використано.');
    return;
  }

  session.puzzleHintUsed = true;
  await ctx.answerCbQuery(`💡 ${puzzle.hint}`, { show_alert: true });
}

module.exports = {
  showPuzzle,
  startRandomPuzzle,
  handlePuzzleSquare,
  showHint,
  getStats,
};
