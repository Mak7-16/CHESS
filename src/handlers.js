const store = require('./store');
const ui = require('./ui');
const { LESSONS, getLesson } = require('./lessons');
const gameModule = require('./game');
const puzzleModule = require('./puzzle');
const { getTitle } = require('./puzzles');
const { registerFeatures } = require('./features');
const { getProfile, getLevelInfo } = require('./profile');
const { startOnlineGame } = require('./online');

async function safeAnswer(ctx, text) {
  try {
    await ctx.answerCbQuery(text);
  } catch {
    // застарілий callback після перезапуску бота
  }
}

function registerHandlers(bot) {
  bot.catch((err) => {
    console.error('Handler error:', err.message);
  });

  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'друже';
    store.resetSession(ctx.from.id);
    const p = getProfile(ctx.from.id, ctx.from.username);
    const lvl = getLevelInfo(p.xp);
    await ctx.reply(
      `♟️ *Привіт, ${name}!*\n\n` +
        `Твій рівень: ${lvl.emoji} ${lvl.name}\n\n` +
        `🎮 Ігри · 📋 Квести · 🎡 Колесо · ⏱️ Бліц · 🏛 Легенди · 👥 2 гравці`,
      { parse_mode: 'Markdown', ...ui.getMainMenu() }
    );
  });

  bot.command('menu', async (ctx) => {
    store.resetSession(ctx.from.id);
    await ctx.reply('🏠 Головне меню:', ui.getMainMenu());
  });

  bot.action('noop', async (ctx) => safeAnswer(ctx));

  bot.action('back:menu', async (ctx) => {
    await safeAnswer(ctx);
    store.resetSession(ctx.from.id);
    await ctx.editMessageText('🏠 Головне меню:', ui.getMainMenu());
  });

  bot.action('menu:puzzles', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText(
      '🧩 *Шахові загадки*\n\n' +
        'Знайди найсильніший хід! Серія вірних відповідей дає звання — від 🌱 Новачка до 👑 Гросмейстера.',
      { parse_mode: 'Markdown', ...ui.getPuzzleMenu() }
    );
  });

  bot.action('puzzle:start', async (ctx) => {
    await safeAnswer(ctx);
    await puzzleModule.startRandomPuzzle(ctx, ctx.from.id);
  });

  bot.action(/^puzzle:play:(\d+)$/, async (ctx) => {
    await safeAnswer(ctx);
    await puzzleModule.showPuzzle(ctx, ctx.from.id, parseInt(ctx.match[1], 10));
  });

  bot.action('puzzle:hint', async (ctx) => {
    await puzzleModule.showHint(ctx, ctx.from.id);
  });

  bot.action('puzzle:skip', async (ctx) => {
    const stats = puzzleModule.getStats(ctx.from.id);
    stats.streak = 0;
    await safeAnswer(ctx, 'Пропущено');
    await puzzleModule.startRandomPuzzle(ctx, ctx.from.id);
  });

  bot.action('puzzle:stats', async (ctx) => {
    await safeAnswer(ctx);
    const stats = puzzleModule.getStats(ctx.from.id);
    const title = getTitle(stats.solved);
    await ctx.editMessageText(
      `📊 *Твоя статистика*\n\n` +
        `✅ Вирішено: *${stats.solved}*\n` +
        `🔥 Поточна серія: *${stats.streak}*\n` +
        `🏆 Рекорд серії: *${stats.bestStreak}*\n` +
        `🎖️ Звання: ${title}`,
      { parse_mode: 'Markdown', ...ui.getPuzzleMenu() }
    );
  });

  bot.action('menu:lessons', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📚 *Уроки шахів*\n\nОберіть урок:',
      { parse_mode: 'Markdown', ...ui.getLessonsList(LESSONS) }
    );
  });

  bot.action('menu:bot', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🤖 *Гра з ботом*\n\nОберіть рівень складності:',
      { parse_mode: 'Markdown', ...ui.getBotDifficultyMenu() }
    );
  });

  bot.action('menu:online', async (ctx) => {
    await ctx.answerCbQuery();
    const inQueue = store.isInQueue(ctx.from.id);
    await ctx.editMessageText(
      '🌐 *Гра онлайн*\n\nЗнайдіть суперника серед інших гравців бота.',
      { parse_mode: 'Markdown', ...ui.getOnlineMenu(inQueue) }
    );
  });

  bot.action('menu:help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      'ℹ️ *Допомога*\n\n' +
        '• Натисніть фігуру, потім клітинку призначення.\n' +
        '• /menu — головне меню.\n' +
        '• Уроки — теорія з прикладами.\n' +
        '• Квести, колесо удачі, бліц загадки.\n' +
        '• Легендарні партії, ендшпіль, нотація.\n' +
        '• Виклик друга: /challenge та /join КОД.\n' +
        '• 2 гравці на одному телефоні.',
      { parse_mode: 'Markdown', ...ui.getMainMenu() }
    );
  });

  bot.action(/^lesson:(\d+):(\d+)$/, async (ctx) => {
    await safeAnswer(ctx);
    const lessonId = parseInt(ctx.match[1], 10);
    const step = parseInt(ctx.match[2], 10);
    const lesson = getLesson(lessonId);

    if (!lesson || !lesson.steps[step]) {
      await ctx.editMessageText('Урок не знайдено.', ui.getMainMenu());
      return;
    }

    const { text, fen } = lesson.steps[step];
    const board = ui.renderBoard(fen);
    const body = `${text.replace(/\*/g, '')}\n\n${board}`;

    await ctx.editMessageText(body, ui.getLessonNav(lessonId, step, lesson.steps.length));
  });

  bot.action(/^lesson:(\d+):done$/, async (ctx) => {
    await safeAnswer(ctx, 'Урок завершено! 🎉');
    await ctx.editMessageText(
      '✅ Чудово! Спробуйте гру з ботом або онлайн.',
      ui.getMainMenu()
    );
  });

  bot.action(/^bot:(easy|medium|hard)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const difficulty = ctx.match[1];
    await gameModule.startBotGame(ctx, ctx.from.id, difficulty);
  });

  bot.action('online:find', async (ctx) => {
    const userId = ctx.from.id;

    if (store.getUserGame(userId)) {
      await ctx.answerCbQuery('У вас уже є активна гра.');
      return;
    }

    store.addToQueue(userId);
    const session = store.getSession(userId);
    session.mode = 'online_wait';

    const match = store.tryMatch();
    if (match) {
      await startOnlineGame(ctx, match);
      return;
    }

    await ctx.answerCbQuery('Шукаю суперника...');
    await ctx.editMessageText(
      '🌐 *Пошук суперника...*\n\nЗачекайте, поки підключиться інший гравець.',
      { parse_mode: 'Markdown', ...ui.getOnlineMenu(true) }
    );
  });

  bot.action('online:cancel', async (ctx) => {
    store.removeFromQueue(ctx.from.id);
    store.getSession(ctx.from.id).mode = 'menu';
    await ctx.answerCbQuery('Пошук скасовано.');
    await ctx.editMessageText('🌐 Гра онлайн:', ui.getOnlineMenu(false));
  });

  bot.action(/^psq:([a-h][1-8])$/, async (ctx) => {
    const session = store.getSession(ctx.from.id);
    if (['puzzle', 'endgame', 'rush'].includes(session.mode)) {
      await puzzleModule.handlePuzzleSquare(ctx, ctx.from.id, ctx.match[1]);
    }
  });

  bot.action(/^sq:([a-h][1-8])$/, async (ctx) => {
    await gameModule.handleSquareClick(ctx, ctx.from.id, ctx.match[1]);
  });

  bot.action('game:hint', async (ctx) => {
    await gameModule.showHint(ctx, ctx.from.id);
  });

  registerFeatures(bot, { safeAnswer });

  bot.action('game:resign', async (ctx) => {
    const userId = ctx.from.id;
    const game = store.getUserGame(userId);

    if (!game) {
      await ctx.answerCbQuery('Немає активної гри.');
      return;
    }

    const opponent = store.getOpponent(game, userId);
    await ctx.answerCbQuery('Ви здалися.');

    if (game.mode === 'online' && opponent) {
      const color = store.userColor(game, userId);
      const winner = color === 'w' ? 'чорні' : 'білі';
      await ctx.telegram.sendMessage(opponent, `🏳️ Суперник здався. Перемога ${winner}!`);
    }

    store.deleteGame(game.id);
    store.resetSession(userId);
    if (opponent && opponent !== 'bot') store.resetSession(opponent);

    await ctx.editMessageText('Гру завершено. Поверніться в меню:', ui.getMainMenu());
  });

  bot.action('game:exit', async (ctx) => {
    const userId = ctx.from.id;
    const game = store.getUserGame(userId);

    if (game && game.mode === 'online') {
      const opponent = store.getOpponent(game, userId);
      if (opponent) {
        await ctx.telegram.sendMessage(opponent, '⚠️ Суперник вийшов з гри.');
        store.resetSession(opponent);
      }
      store.deleteGame(game.id);
    } else if (game) {
      store.deleteGame(game.id);
    }

    store.removeFromQueue(userId);
    store.resetSession(userId);
    await ctx.answerCbQuery();
    await ctx.editMessageText('🏠 Головне меню:', ui.getMainMenu());
  });
}

module.exports = { registerHandlers };
