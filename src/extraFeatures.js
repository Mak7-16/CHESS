const { Markup } = require('telegraf');
const ui = require('./ui');
const profile = require('./profile');
const shop = require('./shop');
const trades = require('./trades');
const flashcards = require('./flashcards');
const compare = require('./compare');
const analysis = require('./analysis');
const tournament = require('./tournament');
const store = require('./store');
const { ACHIEVEMENTS } = require('./profile');

function registerExtraFeatures(bot, { safeAnswer }) {
  bot.action('menu:extra', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText('✨ *Ще більше цікавого!*', {
      parse_mode: 'Markdown',
      ...ui.getExtraMenu(),
    });
  });

  bot.action('menu:trades', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.tradeIndex = trades.randomIndex(session.tradeIndex ?? -1);
    session.mode = 'trade';
    const t = trades.getTrade(session.tradeIndex);
    await ctx.editMessageText(
      `⚔️ *Хто виграє обмін?*\n\n${t.q}\n\n+15 XP`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(t.options[0], `trade:ans:${session.tradeIndex}:0`),
            Markup.button.callback(t.options[1], `trade:ans:${session.tradeIndex}:1`),
          ],
          [
            Markup.button.callback(t.options[2], `trade:ans:${session.tradeIndex}:2`),
            Markup.button.callback(t.options[3], `trade:ans:${session.tradeIndex}:3`),
          ],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action(/^trade:ans:(\d+):(\d+)$/, async (ctx) => {
    const t = trades.getTrade(parseInt(ctx.match[1], 10));
    const ans = parseInt(ctx.match[2], 10);
    if (ans === t.correct) {
      profile.addXp(ctx.from.id, 15, ctx);
      await safeAnswer(ctx, '✅');
      await ctx.editMessageText(`✅ *Вірно!*\n\n${t.explain}\n\n+15 XP`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступний', 'menu:trades')],
          [Markup.button.callback('◀️ Меню', 'menu:extra')],
        ]),
      });
    } else {
      await safeAnswer(ctx, '❌');
      await ctx.editMessageText(`❌ ${t.explain}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Ще', 'menu:trades')],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      });
    }
    store.getSession(ctx.from.id).mode = 'menu';
  });

  bot.action('menu:flash', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.flashIndex = flashcards.randomIndex(session.flashIndex ?? -1);
    const card = flashcards.getCard(session.flashIndex);
    await ctx.editMessageText(
      `🃏 *Картка фігури*\n\n${card.piece} *${card.name}*\n\n_Натисни «Показати хід»_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('👁 Показати хід', `flash:show:${session.flashIndex}`)],
          [Markup.button.callback('➡️ Наступна', 'menu:flash')],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action(/^flash:show:(\d+)$/, async (ctx) => {
    const card = flashcards.getCard(parseInt(ctx.match[1], 10));
    profile.addXp(ctx.from.id, 8);
    await safeAnswer(ctx, '👁');
    await ctx.editMessageText(
      `🃏 *${card.name}* ${card.piece}\n\n📜 ${card.move}\n\n_+8 XP_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступна', 'menu:flash')],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action('menu:shop', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id, ctx.from.username);
    if (!p.ownedTitles) p.ownedTitles = ['t_rookie'];
    const lines = shop.TITLES.map((t) => {
      const own = p.ownedTitles.includes(t.id) ? '✅' : `${t.cost} XP`;
      const eq = p.equippedTitle === t.id ? ' 👈' : '';
      return `${t.name} — ${own}${eq}`;
    }).join('\n');
    const rows = shop.TITLES.map((t) => [
      Markup.button.callback(t.name, `shop:buy:${t.id}`),
    ]);
    rows.push([Markup.button.callback('◀️ Назад', 'menu:extra')]);
    await ctx.editMessageText(
      `🛒 *Магазин титулів*\n\n💰 У тебе: *${p.xp} XP*\n\n${lines}`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }
    );
  });

  bot.action(/^shop:buy:(.+)$/, async (ctx) => {
    const p = profile.getProfile(ctx.from.id);
    const result = shop.buyTitle(p, ctx.match[1]);
    await safeAnswer(ctx, result.ok ? '✅' : '❌');
    await ctx.editMessageText(
      result.ok ? `✅ ${result.msg}` : `❌ ${result.msg}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🛒 Магазин', 'menu:shop')],
          [Markup.button.callback('◀️ Меню', 'back:menu')],
        ]),
      }
    );
  });

  bot.action('menu:analyze', async (ctx) => {
    await safeAnswer(ctx);
    const rows = analysis.PRESETS.map((p, i) => [
      Markup.button.callback(`📊 ${p.name}`, `analyze:${i}`),
    ]);
    rows.push([Markup.button.callback('◀️ Назад', 'menu:extra')]);
    await ctx.editMessageText('📊 *Аналіз позиції* — обери:', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows),
    });
  });

  bot.action(/^analyze:(\d+)$/, async (ctx) => {
    await safeAnswer(ctx);
    const preset = analysis.PRESETS[parseInt(ctx.match[1], 10)];
    const a = analysis.analyzeFen(preset.fen);
    const board = ui.renderBoard(preset.fen);
    profile.addXp(ctx.from.id, 5);
    await ctx.editMessageText(
      `📊 *${preset.name}*\n\n${a.status}\n${a.evalText}\n${a.material}\n\n` +
        `${a.pieces}\n\n_Легальних ходів: ${a.moves}_\n\n\`\`\`\n${board}\n\`\`\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📊 Інша', 'menu:analyze')],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action('menu:compare', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    session.compareIndex = compare.randomIndex(session.compareIndex ?? -1);
    const c = compare.getCompare(session.compareIndex);
    const board = ui.renderBoard(c.fen, c.color);
    await ctx.editMessageText(
      `🤔 *${c.title}*\n\nЯкий хід *кращий*?\n\n\`\`\`\n${board}\n\`\`\`\n\n+20 XP`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(c.options[0], `compare:ans:${session.compareIndex}:0`),
            Markup.button.callback(c.options[1], `compare:ans:${session.compareIndex}:1`),
          ],
          [
            Markup.button.callback(c.options[2], `compare:ans:${session.compareIndex}:2`),
            Markup.button.callback(c.options[3], `compare:ans:${session.compareIndex}:3`),
          ],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action(/^compare:ans:(\d+):(\d+)$/, async (ctx) => {
    const c = compare.getCompare(parseInt(ctx.match[1], 10));
    const ans = parseInt(ctx.match[2], 10);
    if (ans === c.correct) {
      profile.addXp(ctx.from.id, 20, ctx);
      await safeAnswer(ctx, '✅');
      await ctx.editMessageText(`✅ *Точно!*\n\n${c.explain}\n\n+20 XP`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Наступний', 'menu:compare')],
          [Markup.button.callback('◀️ Меню', 'menu:extra')],
        ]),
      });
    } else {
      await safeAnswer(ctx, '❌');
      await ctx.editMessageText(
        `❌ Краще: *${c.options[c.correct]}*\n\n${c.explain}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Ще', 'menu:compare')],
            [Markup.button.callback('◀️ Назад', 'menu:extra')],
          ]),
        }
      );
    }
  });

  bot.action('menu:tournament', async (ctx) => {
    await safeAnswer(ctx);
    await ctx.editMessageText(
      '🏟 *Міні-турнір*\n\n4 раунди проти ботів. Симуляція миттєва — натисни «Старт»!',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏁 Старт турніру', 'tournament:start')],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action('tournament:start', async (ctx) => {
    await safeAnswer(ctx);
    const result = tournament.runTournament(ctx.from.id);
    profile.addXp(ctx.from.id, result.xp, ctx);
    const lines = result.rounds
      .map((r) => `Раунд ${r.round}: vs ${r.opponent} — ${r.result}`)
      .join('\n');
    await ctx.editMessageText(
      `🏟 *Турнір завершено!*\n\n${lines}\n\n` +
        `${result.medal} Місце: *${result.place}*\n` +
        `🏆 Перемог: ${result.wins}/4\n⭐ +${result.xp} XP`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Ще раз', 'tournament:start')],
          [Markup.button.callback('◀️ Меню', 'menu:extra')],
        ]),
      }
    );
  });

  bot.action('menu:achievements', async (ctx) => {
    await safeAnswer(ctx);
    const p = profile.getProfile(ctx.from.id);
    const list = Object.values(ACHIEVEMENTS)
      .map((a) => {
        const has = p.achievements.includes(a.id);
        return `${has ? '✅' : '🔒'} ${a.icon} ${a.title}${has ? '' : ' _(закрито)_'}`;
      })
      .join('\n');
    await ctx.editMessageText(`🏅 *Усі досягнення*\n\n${list}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Профіль', 'menu:profile')]]),
    });
  });

  bot.action('menu:memory', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    const { Chess } = require('chess.js');
    const chess = new Chess();
    chess.clear();
    const pieces = [
      { type: 'q', color: 'w' },
      { type: 'n', color: 'b' },
      { type: 'r', color: 'w' },
      { type: 'b', color: 'b' },
      { type: 'p', color: 'w' },
    ];
    const squares = ['e4', 'd5', 'a1', 'h8', 'f6'];
    const sq = squares[Math.floor(Math.random() * squares.length)];
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    chess.put(piece, sq);
    const labels = { q: 'Ферзь', n: 'Кінь', r: 'Тура', b: 'Слон', p: 'Пішак' };
    const colors = { w: 'білий', b: 'чорний' };
    session.memoryAnswer = labels[piece.type];
    session.memorySquare = sq;
    session.memoryFen = chess.fen();
    const board = ui.renderBoard(session.memoryFen);
    await ctx.editMessageText(
      `🧠 *Пам’ять*\n\nЗапам’ятай фігуру на *${sq}*!\n\n\`\`\`\n${board}\n\`\`\``,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('👁 Готово!', 'memory:quiz')]]) }
    );
  });

  bot.action('memory:quiz', async (ctx) => {
    await safeAnswer(ctx);
    const session = store.getSession(ctx.from.id);
    const opts = ['Ферзь', 'Кінь', 'Тура', 'Слон', 'Пішак'];
    const wrong = opts.filter((o) => o !== session.memoryAnswer);
    const pick = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [session.memoryAnswer, ...pick].sort(() => Math.random() - 0.5);
    session.memoryCorrect = options.indexOf(session.memoryAnswer);
    await ctx.editMessageText(
      `🧠 *Яка фігура була на ${session.memorySquare}?*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(options[0], 'memory:ans:0'),
            Markup.button.callback(options[1], 'memory:ans:1'),
          ],
          [
            Markup.button.callback(options[2], 'memory:ans:2'),
            Markup.button.callback(options[3], 'memory:ans:3'),
          ],
          [Markup.button.callback('◀️ Назад', 'menu:extra')],
        ]),
      }
    );
    session.memoryOptions = options;
  });

  bot.action(/^memory:ans:(\d+)$/, async (ctx) => {
    const session = store.getSession(ctx.from.id);
    const ans = parseInt(ctx.match[1], 10);
    const correct = session.memoryOptions[ans] === session.memoryAnswer;
    if (correct) {
      profile.addXp(ctx.from.id, 12, ctx);
      await safeAnswer(ctx, '🧠');
      await ctx.editMessageText(
        `🧠 *Вірно!* ${session.memoryAnswer} на ${session.memorySquare}\n\n+12 XP`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Ще', 'menu:memory')],
            [Markup.button.callback('◀️ Назад', 'menu:extra')],
          ]),
        }
      );
    } else {
      await safeAnswer(ctx, '❌');
      await ctx.editMessageText(
        `❌ Було: *${session.memoryAnswer}* на ${session.memorySquare}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Ще', 'menu:memory')],
            [Markup.button.callback('◀️ Назад', 'menu:extra')],
          ]),
        }
      );
    }
  });
}

module.exports = { registerExtraFeatures };
