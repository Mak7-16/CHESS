const { Markup } = require('telegraf');
const store = require('./store');
const ui = require('./ui');
const profile = require('./profile');
const quizData = require('./quiz');
const { getGuess, randomIndex: randomGuess } = require('./guess');
const { OPENINGS, getOpening } = require('./openings');
const { getPuzzle } = require('./puzzles');
const { randomFact, randomTip } = require('./facts');
const gameModule = require('./game');
const quests = require('./quests');
const { registerMoreFeatures } = require('./moreFeatures');

function dayIndex() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start;
  return Math.floor(diff / 86400000) % 12;
}

function registerFeatures(bot, { safeAnswer }) {
  bot.action('menu:games', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText('🎮 *Режими гри* — обирай пригоду!', {
      parse_mode: 'Markdown',
      ...ui.getGamesMenu(),
    });
  });

  bot.action('menu:learn', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText('📚 *Навчання* — стань сильнішим!', {
      parse_mode: 'Markdown',
      ...ui.getLearnMenu(),
    });
  });

  bot.action('menu:profile', async (ctx) => {
    await safeAnswer(ctx);
    const text = profile.formatProfile(ctx.from.id, ctx.from.username);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...ui.getProfileMenu() });
  });

  bot.action('menu:leaderboard', async (ctx) => {
    await safeAnswer(ctx);
    const board = profile.getLeaderboard(10);
    const lines =
      board.length === 0
        ? '_Поки ніхто не заробив XP — будь першим!_'
        : board
            .map((e, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
              return `${medal} ${e.name} — *${e.xp} XP*`;
            })
            .join('\n');
    await ctx.editMessageText(`🏆 *Топ-10 за XP*\n\n${lines}`, {
      parse_mode: 'Markdown',
      ...ui.getProfileMenu(),
    });
  });

  bot.action('menu:facts', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText(
      '💡 *Факти та поради*\n\nОбери, що хочеш дізнатись:',
      { parse_mode: 'Markdown', ...ui.getFactsMenu() }
    );
  });

  bot.action('fact:random', async (ctx) => {
    await safeAnswer(ctx);
    profile.addXp(ctx.from.id, 5);
    await ctx.editMessageText(`${randomFact()}\n\n_+5 XP_`, {
      parse_mode: 'Markdown',
      ...ui.getFactsMenu(),
    });
  });

  bot.action('fact:tip', async (ctx) => {
    await safeAnswer(ctx);
    profile.addXp(ctx.from.id, 5);
    await ctx.editMessageText(`${randomTip()}\n\n_+5 XP_`, {
      parse_mode: 'Markdown',
      ...ui.getFactsMenu(),
    });
  });

  bot.action('menu:quiz', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.quizIndex = quizData.getRandomIndex(session.quizIndex ?? -1);
    session.mode = 'quiz';
    const q = quizData.getQuestion(session.quizIndex);
    const kb = Markup.inlineKeyboard([
      [
        Markup.button.callback(q.options[0], `quiz:ans:${session.quizIndex}:0`),
        Markup.button.callback(q.options[1], `quiz:ans:${session.quizIndex}:1`),
      ],
      [
        Markup.button.callback(q.options[2], `quiz:ans:${session.quizIndex}:2`),
        Markup.button.callback(q.options[3], `quiz:ans:${session.quizIndex}:3`),
      ],
      [Markup.button.callback('🏠 Меню', 'back:menu')],
    ]);
    await ctx.editMessageText(
      `🧠 *Вікторина*\n\n❓ ${q.q}\n\n+20 XP за правильну відповідь`,
      { parse_mode: 'Markdown', ...kb }
    );
  });

  bot.action(/^quiz:ans:(\d+):(\d+)$/, async (ctx) => {
    const qIdx = parseInt(ctx.match[1], 10);
    const ans = parseInt(ctx.match[2], 10);
    const q = quizData.getQuestion(qIdx);
    const p = profile.getProfile(ctx.from.id);

    if (ans === q.correct) {
      p.stats.quizCorrect += 1;
      quests.markQuest(p, 'quiz');
      profile.addXp(ctx.from.id, 20, ctx);
      profile.checkAchievements(ctx.from.id);
      await safeAnswer(ctx, '✅ Вірно!');
      await ctx.editMessageText(
        `✅ *Правильно!*\n\n❓ ${q.q}\n✔️ ${q.options[q.correct]}\n\n+20 XP · Всього вікторин: ${p.stats.quizCorrect}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступне питання', 'menu:quiz')],
          [Markup.button.callback('🏠 Меню', 'back:menu')],
        ]) }
      );
    } else {
      await safeAnswer(ctx, '❌ Ні...');
      await ctx.editMessageText(
        `❌ *Не те.*\n\nПравильно: *${q.options[q.correct]}*\n\nСпробуй ще!`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Ще питання', 'menu:quiz')],
          [Markup.button.callback('🏠 Меню', 'back:menu')],
        ]) }
      );
    }
  });

  bot.action('menu:guess', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.guessIndex = randomGuess(session.guessIndex ?? -1);
    session.mode = 'guess';
    const g = getGuess(session.guessIndex);
    const board = ui.renderBoard(g.fen, 'w');
    const kb = Markup.inlineKeyboard([
      [
        Markup.button.callback(g.options[0], `guess:ans:${session.guessIndex}:0`),
        Markup.button.callback(g.options[1], `guess:ans:${session.guessIndex}:1`),
      ],
      [
        Markup.button.callback(g.options[2], `guess:ans:${session.guessIndex}:2`),
        Markup.button.callback(g.options[3], `guess:ans:${session.guessIndex}:3`),
      ],
      [Markup.button.callback('🏠 Меню', 'back:menu')],
    ]);
    await ctx.editMessageText(
      `🎯 *${g.title}*\n\n${g.question}\n\n\`\`\`\n${board}\n\`\`\`\n\n+25 XP за вірну відповідь`,
      { parse_mode: 'Markdown', ...kb }
    );
  });

  bot.action(/^guess:ans:(\d+):(\d+)$/, async (ctx) => {
    const gIdx = parseInt(ctx.match[1], 10);
    const ans = parseInt(ctx.match[2], 10);
    const g = getGuess(gIdx);
    const p = profile.getProfile(ctx.from.id);

    if (ans === g.correct) {
      p.stats.guessCorrect += 1;
      profile.addXp(ctx.from.id, 25, ctx);
      profile.checkAchievements(ctx.from.id);
      await safeAnswer(ctx, '🎯 Бінго!');
      await ctx.editMessageText(
        `🎯 *Вірно!*\n\n${g.explain}\n\n+25 XP`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступна', 'menu:guess')],
          [Markup.button.callback('🏠 Меню', 'back:menu')],
        ]) }
      );
    } else {
      await safeAnswer(ctx, '❌');
      await ctx.editMessageText(
        `❌ *Майже.*\n\n${g.explain}\n\nПравильно: *${g.options[g.correct]}*`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Ще раз', 'menu:guess')],
          [Markup.button.callback('🏠 Меню', 'back:menu')],
        ]) }
      );
    }
  });

  bot.action('menu:daily', async (ctx) => {
    await safeAnswer(ctx);
    const idx = dayIndex();
    const puzzle = getPuzzle(idx);
    const p = profile.getProfile(ctx.from.id);
    const today = new Date().toDateString();
    const claimed = p.stats.dailyLast === today;
    const board = ui.renderBoard(puzzle.fen, puzzle.color);

    let bonus = '';
    if (!claimed) {
      p.stats.dailyLast = today;
      profile.addXp(ctx.from.id, 40, ctx);
      profile.unlockAchievement(ctx.from.id, 'daily_done');
      bonus = '\n\n🎁 *+40 XP* за загадку дня!';
    } else {
      bonus = '\n\n_Бонус сьогодні вже отримано — виріши для тренування!_';
    }

    const session = store.getSession(ctx.from.id);
    session.mode = 'puzzle';
    session.puzzleIndex = idx;
    session.puzzleStep = 0;
    session.selectedSquare = null;
    session.puzzleHintUsed = false;

    await ctx.editMessageText(
      `📅 *Загадка дня* · ${new Date().toLocaleDateString('uk-UA')}\n\n` +
        `🧩 ${puzzle.title}\n\n` +
        `\`\`\`\n${board}\n\`\`\`${bonus}`,
      { parse_mode: 'Markdown', ...ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, null) }
    );
  });

  bot.action('menu:openings', async (ctx) => {
    await safeAnswer(ctx);
    const rows = OPENINGS.map((o, i) => [
      Markup.button.callback(`${o.emoji} ${o.name}`, `opening:${i}`),
    ]);
    rows.push([Markup.button.callback('◀️ Назад', 'menu:learn')]);
    await ctx.editMessageText('📖 *Дебюти* — обери, щоб вивчити:', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows),
    });
  });

  bot.action(/^opening:(\d+)$/, async (ctx) => {
    await safeAnswer(ctx);
    const o = getOpening(parseInt(ctx.match[1], 10));
    const p = profile.getProfile(ctx.from.id);
    p.stats.openingsViewed = (p.stats.openingsViewed || 0) + 1;
    quests.markQuest(p, 'opening');
    profile.addXp(ctx.from.id, 10);
    profile.checkAchievements(ctx.from.id);
    const board = ui.renderBoard(o.fen);
    await ctx.editMessageText(
      `${o.emoji} *${o.name}*\n\n` +
        `📜 Ходи: \`${o.moves}\`\n\n` +
        `💡 ${o.tip}\n\n` +
        `\`\`\`\n${board}\n\`\`\`\n\n_+10 XP_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📖 Інші дебюти', 'menu:openings')],
          [Markup.button.callback('🏠 Меню', 'back:menu')],
        ]),
      }
    );
  });

  bot.action('menu:survival', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id);
    await ctx.editMessageText(
      `⚡ *Режим «Полювання»*\n\n` +
        `Грай проти бота без зупинки! Кожна перемога — наступний суперник сильніший.\n\n` +
        `🏆 Твій рекорд: *${p.stats.survivalBest}* перемог поспіль`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔥 Почати полювання', 'survival:start')],
          [Markup.button.callback('◀️ Назад', 'menu:games')],
        ]),
      }
    );
  });

  bot.action('survival:start', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.survivalWins = 0;
    await gameModule.startSurvivalGame(ctx, ctx.from.id, 'easy');
  });

  registerMoreFeatures(bot, { safeAnswer });
}

module.exports = { registerFeatures };
