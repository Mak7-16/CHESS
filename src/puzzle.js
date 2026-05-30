const { Markup } = require('telegraf');
const { Chess } = require('chess.js');
const store = require('./store');
const ui = require('./ui');
const { getPuzzle, getTitle, getRandomPuzzleIndex } = require('./puzzles');
const { getEndgame } = require('./endgames');
const profile = require('./profile');
const quests = require('./quests');

function getStats(userId) {
  const session = store.getSession(userId);
  if (!session.puzzleStats) {
    session.puzzleStats = { streak: 0, bestStreak: 0, solved: 0 };
  }
  return session.puzzleStats;
}

function getActivePuzzle(session) {
  if (session.mode === 'endgame') return getEndgame(session.endgameIndex);
  return getPuzzle(session.puzzleIndex);
}

function buildPuzzleMessage(puzzle, stats, extra = '') {
  const colorLabel = puzzle.color === 'w' ? 'білих' : 'чорних';
  const board = ui.renderBoard(puzzle.fen, puzzle.color);
  const title = getTitle(stats.solved);

  return (
    `🧩 *${puzzle.title}* · ${title}\n` +
    `🔥 Серія: ${stats.streak} · 🏆 Рекорд: ${stats.bestStreak} · ✅ Вирішено: ${stats.solved}\n\n` +
    `🎯 Хід *${colorLabel}*. Знайди найсильніший хід!${extra}\n\n` +
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
  if (!['puzzle', 'endgame', 'rush'].includes(session.mode)) {
    await ctx.answerCbQuery('Немає активної загадки.');
    return;
  }

  const puzzle = getActivePuzzle(session);
  const stats = getStats(userId);
  const chess = new Chess(puzzle.fen);

  if (session.mode === 'rush' && Date.now() > session.rushEnd) {
    await finishRush(ctx, userId, session);
    return;
  }

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
    const extra =
      session.mode === 'rush'
        ? `\n\n⏱️ ${rushTimeLeft(session)} · 🔥 ${session.rushScore || 0}`
        : '';
    const text =
      session.mode === 'endgame'
        ? `👑 *${puzzle.title}*\n\n\`\`\`\n${ui.renderBoard(puzzle.fen, puzzle.color)}\n\`\`\``
        : buildPuzzleMessage(puzzle, stats, extra);
    const keyboard = ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, square);
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup,
    });
    await ctx.answerCbQuery(`Обрано: ${square}`);
    return;
  }

  const expected = puzzle.solution[session.puzzleStep];
  const correct = session.selectedSquare === expected.from && square === expected.to;
  session.selectedSquare = null;

  if (!correct) {
    if (session.mode !== 'rush') stats.streak = 0;
    await ctx.answerCbQuery('❌ Не те! Спробуй ще.');
    const board = ui.renderBoard(puzzle.fen, puzzle.color);
    await ctx.editMessageText(
      `😔 *Майже!*\n\n${puzzle.explanation}\n\n\`\`\`\n${board}\n\`\`\``,
      { parse_mode: 'Markdown', ...ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, null) }
    );
    return;
  }

  session.puzzleStep += 1;
  if (session.puzzleStep < puzzle.solution.length) {
    await ctx.answerCbQuery('✅ Вірно! Продовжуй...');
    return;
  }

  await ctx.answerCbQuery('🎉 Вірно!');

  if (session.mode === 'rush') {
    session.rushScore = (session.rushScore || 0) + 1;
    if (Date.now() >= session.rushEnd) {
      await finishRush(ctx, userId, session);
      return;
    }
    session.puzzleIndex = getRandomPuzzleIndex(session.puzzleIndex);
    session.puzzleStep = 0;
    const next = getPuzzle(session.puzzleIndex);
    const board = ui.renderBoard(next.fen, next.color);
    await ctx.editMessageText(
      `⏱️ *Бліц* · ⏳ ${rushTimeLeft(session)} · 🔥 *${session.rushScore}*\n\n` +
        `🧩 ${next.title}\n\n\`\`\`\n${board}\n\`\`\``,
      { parse_mode: 'Markdown', ...ui.getPuzzleKeyboard(next.fen, next.color, null) }
    );
    return;
  }

  if (session.mode === 'endgame') {
    profile.addXp(userId, 20, ctx);
    const p = profile.getProfile(userId);
    quests.markQuest(p, 'puzzle');
    await ctx.editMessageText(
      `✅ *${puzzle.explanation}*\n\n+20 XP`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступний ендшпіль', 'menu:endgames')],
          [Markup.button.callback('◀️ Меню', 'back:menu')],
        ]),
      }
    );
    session.mode = 'menu';
    return;
  }

  stats.solved += 1;
  stats.streak += 1;
  if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
  const xpGain = profile.onPuzzleSolved(userId, stats.streak);
  const p = profile.getProfile(userId);
  quests.markQuest(p, 'puzzle');

  const nextIndex = getRandomPuzzleIndex(session.puzzleIndex);
  const nextPuzzle = getPuzzle(nextIndex);
  const title = getTitle(stats.solved);

  session.puzzleIndex = nextIndex;
  session.puzzleStep = 0;

  await ctx.editMessageText(
    `✅ *Розв’язано!*\n\n${puzzle.explanation}\n\n` +
      `📊 Серія: *${stats.streak}* · ⭐ +${xpGain} XP\n` +
      `➡️ Наступна: *${nextPuzzle.title}*`,
    { parse_mode: 'Markdown', ...ui.getPuzzleSolvedMenu(nextIndex) }
  );
}

function rushTimeLeft(session) {
  const sec = Math.max(0, Math.ceil((session.rushEnd - Date.now()) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

async function finishRush(ctx, userId, session) {
  const score = session.rushScore || 0;
  const p = profile.getProfile(userId);
  if (score > (p.stats.rushBest || 0)) p.stats.rushBest = score;
  const xp = score * 10;
  profile.addXp(userId, xp, ctx);
  session.mode = 'menu';
  await ctx.editMessageText(
    `⏱️ *Час вийшов!*\n\n🔥 Розв’язано: *${score}*\n🏆 Рекорд: *${p.stats.rushBest}*\n⭐ +${xp} XP`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Ще раз', 'menu:rush')],
        [Markup.button.callback('◀️ Меню', 'back:menu')],
      ]),
    }
  );
}

async function showHint(ctx, userId) {
  const session = store.getSession(userId);
  const puzzle = getActivePuzzle(session);

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
