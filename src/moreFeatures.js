const { Markup } = require('telegraf');
const { Chess } = require('chess.js');
const store = require('./store');
const ui = require('./ui');
const profile = require('./profile');
const quests = require('./quests');
const { getFamous, FAMOUS } = require('./famous');
const { getEndgame, randomIndex: randomEndgame } = require('./endgames');
const { getNotation, randomIndex: randomNotation } = require('./notation');
const challenge = require('./challenge');
const { getPuzzle, getRandomPuzzleIndex } = require('./puzzles');
const gameModule = require('./game');
const { startOnlineGame } = require('./online');

const WHEEL_PRIZES = [15, 25, 35, 50, 75, 100, 10, 20];

function registerMoreFeatures(bot, { safeAnswer }) {
  bot.action('menu:quests', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id, ctx.from.username);
    await ctx.editMessageText(quests.formatQuestsText(p), {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🎁 Забрати нагороду', 'quests:claim')],
        [Markup.button.callback('◀️ Меню', 'back:menu')],
      ]),
    });
  });

  bot.action('quests:claim', async (ctx) => {
    const p = profile.getProfile(ctx.from.id);
    const q = quests.ensureQuests(p);
    const { complete } = quests.questsProgress(q);
    if (!complete) {
      await safeAnswer(ctx, 'Ще не всі квести виконані!');
      return;
    }
    if (q.claimed) {
      await safeAnswer(ctx, 'Вже отримано сьогодні.');
      return;
    }
    q.claimed = true;
    profile.addXp(ctx.from.id, 80, ctx);
    await safeAnswer(ctx, '🎁 +80 XP!');
    await ctx.editMessageText(quests.formatQuestsText(p), {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'back:menu')]]),
    });
  });

  bot.action('menu:wheel', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id);
    const today = new Date().toDateString();
    const spun = p.wheelLast === today;
    await ctx.editMessageText(
      `🎡 *Колесо удачі*\n\n` +
        (spun
          ? '_Сьогодні вже крутив. Повернись завтра!_'
          : '_Один безкоштовний спін на день — натисни кнопку!_'),
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(spun ? '🎡 Вже крутив' : '🎡 Крутити!', 'wheel:spin')],
          [Markup.button.callback('◀️ Меню', 'back:menu')],
        ]),
      }
    );
  });

  bot.action('wheel:spin', async (ctx) => {
    const p = profile.getProfile(ctx.from.id);
    const today = new Date().toDateString();
    if (p.wheelLast === today) {
      await safeAnswer(ctx, 'Сьогодні вже крутив!');
      return;
    }
    p.wheelLast = today;
    const prize = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)];
    profile.addXp(ctx.from.id, prize, ctx);
    await safeAnswer(ctx, `🎡 +${prize} XP!`);
    await ctx.editMessageText(
      `🎡 *Колесо зупинилось!*\n\n🎉 Ти виграв *${prize} XP*!\n\n_Завтра — новий спін._`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'back:menu')]]),
      }
    );
  });

  bot.action('menu:famous', async (ctx) => {
    await safeAnswer(ctx);
    const rows = FAMOUS.map((f, i) => [
      Markup.button.callback(`🏛 ${f.title}`, `famous:${i}:0`),
    ]);
    rows.push([Markup.button.callback('◀️ Назад', 'menu:learn')]);
    await ctx.editMessageText('🏛 *Легендарні партії* — крок за кроком:', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows),
    });
  });

  bot.action(/^famous:(\d+):(\d+)$/, async (ctx) => {
    await safeAnswer(ctx);
    const game = getFamous(parseInt(ctx.match[1], 10));
    const step = parseInt(ctx.match[2], 10);
    const s = game.steps[step];
    if (!s) return;
    const board = ui.renderBoard(s.fen);
    const nav = [];
    if (step > 0) nav.push(Markup.button.callback('◀️', `famous:${ctx.match[1]}:${step - 1}`));
    if (step < game.steps.length - 1) {
      nav.push(Markup.button.callback('▶️', `famous:${ctx.match[1]}:${step + 1}`));
    } else {
      nav.push(Markup.button.callback('✅', `famous:${ctx.match[1]}:done`));
    }
    profile.addXp(ctx.from.id, 5);
    await ctx.editMessageText(
      `🏛 *${game.title}*\n_${game.players}_\n\n${s.text}\n\n\`\`\`\n${board}\n\`\`\`\n\n_+5 XP_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([nav, [Markup.button.callback('📋 Список', 'menu:famous')]]),
      }
    );
  });

  bot.action(/^famous:(\d+):done$/, async (ctx) => {
    await safeAnswer(ctx, '🏛 Круто!');
    await ctx.editMessageText('✅ Партію переглянуто! +15 XP', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏛 Інша партія', 'menu:famous')],
        [Markup.button.callback('◀️ Меню', 'back:menu')],
      ]),
    });
    profile.addXp(ctx.from.id, 15);
  });

  bot.action('menu:endgames', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.endgameIndex = randomEndgame(session.endgameIndex ?? -1);
    session.mode = 'endgame';
    session.puzzleStep = 0;
    session.selectedSquare = null;
    const eg = getEndgame(session.endgameIndex);
    const board = ui.renderBoard(eg.fen, eg.color);
    await ctx.editMessageText(
      `👑 *Ендшпіль: ${eg.title}*\n\nЗнайди правильний хід!\n\n\`\`\`\n${board}\n\`\`\``,
      { parse_mode: 'Markdown', ...ui.getPuzzleKeyboard(eg.fen, eg.color, null) }
    );
  });

  bot.action('menu:notation', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.notationIndex = randomNotation(session.notationIndex ?? -1);
    session.mode = 'notation';
    const n = getNotation(session.notationIndex);
    await ctx.editMessageText(
      `📝 *Нотація*\n\nХід: \`${n.move}\`\n\n❓ ${n.q}\n\n+15 XP`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(n.options[0], `notation:ans:${session.notationIndex}:0`),
            Markup.button.callback(n.options[1], `notation:ans:${session.notationIndex}:1`),
          ],
          [
            Markup.button.callback(n.options[2], `notation:ans:${session.notationIndex}:2`),
            Markup.button.callback(n.options[3], `notation:ans:${session.notationIndex}:3`),
          ],
          [Markup.button.callback('◀️ Меню', 'back:menu')],
        ]),
      }
    );
  });

  bot.action(/^notation:ans:(\d+):(\d+)$/, async (ctx) => {
    const n = getNotation(parseInt(ctx.match[1], 10));
    const ans = parseInt(ctx.match[2], 10);
    if (ans === n.correct) {
      profile.addXp(ctx.from.id, 15, ctx);
      await safeAnswer(ctx, '✅');
      await ctx.editMessageText(
        `✅ *Вірно!* \`${n.move}\` — ${n.options[n.correct]}\n\n+15 XP`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➡️ Наступний', 'menu:notation')],
            [Markup.button.callback('◀️ Меню', 'back:menu')],
          ]),
        }
      );
    } else {
      await safeAnswer(ctx, '❌');
      await ctx.editMessageText(
        `❌ Правильно: *${n.options[n.correct]}*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Ще', 'menu:notation')],
            [Markup.button.callback('◀️ Меню', 'back:menu')],
          ]),
        }
      );
    }
  });

  bot.action('menu:rush', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.mode = 'rush';
    session.rushEnd = Date.now() + 120000;
    session.rushScore = 0;
    session.puzzleIndex = getRandomPuzzleIndex(-1);
    session.puzzleStep = 0;
    session.selectedSquare = null;
    const puzzle = getPuzzle(session.puzzleIndex);
    const board = ui.renderBoard(puzzle.fen, puzzle.color);
    await ctx.editMessageText(
      `⏱️ *Бліц загадки* — 2 хвилини!\n\n` +
        `🔥 Рахунок: 0\n\n` +
        `🧩 ${puzzle.title}\n\n\`\`\`\n${board}\n\`\`\``,
      { parse_mode: 'Markdown', ...ui.getPuzzleKeyboard(puzzle.fen, puzzle.color, null) }
    );
  });

  bot.action('menu:hotseat', async (ctx) => {
    await safeAnswer(ctx);
    await gameModule.startHotseatGame(ctx, ctx.from.id);
  });

  bot.action('menu:challenge', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText(
      '🤝 *Виклик друга*\n\n' +
        '• `/challenge` — створити код кімнати\n' +
        '• `/join ABCD` — приєднатись за кодом\n\n' +
        '_Код діє 10 хвилин._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🆕 Створити код', 'challenge:create')],
          [Markup.button.callback('◀️ Меню', 'menu:games')],
        ]),
      }
    );
  });

  bot.action('challenge:create', async (ctx) => {
    const code = challenge.create(ctx.from.id);
    await safeAnswer(ctx, `Код: ${code}`);
    await ctx.editMessageText(
      `🤝 *Кімната створена!*\n\n` +
        `Код: \`${code}\`\n\n` +
        `Надішли другу:\n\`/join ${code}\`\n\n` +
        `_Чекаємо суперника..._`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'back:menu')]]) }
    );
  });

  bot.command('challenge', async (ctx) => {
    const code = challenge.create(ctx.from.id);
    await ctx.reply(
      `🤝 Код кімнати: \`${code}\`\n\nДруг пише: /join ${code}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('join', async (ctx) => {
    const code = (ctx.message.text.split(' ')[1] || '').trim();
    if (!code) {
      await ctx.reply('Напиши: /join КОД');
      return;
    }
    const result = challenge.join(code, ctx.from.id);
    if (result.error) {
      await ctx.reply(result.error);
      return;
    }
    const game = store.createGame({
      white: result.host,
      black: result.guest,
      mode: 'online',
    });
    await startOnlineGame(ctx, game);
    await ctx.reply('🎮 Ви в грі! Перевір повідомлення з дошкою.');
    await ctx.telegram.sendMessage(result.host, `🎮 Суперник приєднався за кодом ${code}!`);
  });

  bot.action('menu:streak', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (p.loginLast === today) {
      await ctx.editMessageText(
        `📆 *Серія входів: ${p.loginStreak || 1} днів*\n\n_Сьогодні вже заходив — молодець!_`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'back:menu')]]) }
      );
      return;
    }
    if (p.loginLast === yesterday) {
      p.loginStreak = (p.loginStreak || 0) + 1;
    } else {
      p.loginStreak = 1;
    }
    p.loginLast = today;
    const bonus = 10 + Math.min(p.loginStreak * 5, 50);
    profile.addXp(ctx.from.id, bonus, ctx);
    await ctx.editMessageText(
      `📆 *Серія: ${p.loginStreak} днів!*\n\n🎁 +${bonus} XP за вхід`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'back:menu')]]) }
    );
  });
}

module.exports = { registerMoreFeatures };
