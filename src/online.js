const store = require('./store');
const ui = require('./ui');
const gameModule = require('./game');

async function startOnlineGame(ctx, game) {
  const whiteSession = store.getSession(game.white);
  const blackSession = store.getSession(game.black);
  whiteSession.mode = 'playing';
  blackSession.mode = 'playing';
  whiteSession.gameId = game.id;
  blackSession.gameId = game.id;
  whiteSession.selectedSquare = null;
  blackSession.selectedSquare = null;
  whiteSession.boardMessageId = null;
  blackSession.boardMessageId = null;

  await gameModule.updateBoardForUser(ctx, game, game.white);
  await gameModule.updateBoardForUser(ctx, game, game.black);

  await ctx.telegram.sendMessage(
    game.white,
    `🎮 Гра почалась! Ви граєте *білими*.`,
    { parse_mode: 'Markdown' }
  );
  await ctx.telegram.sendMessage(
    game.black,
    `🎮 Гра почалась! Ви граєте *чорними*.`,
    { parse_mode: 'Markdown' }
  );

  if (ctx.from.id === game.white || ctx.from.id === game.black) {
    try {
      await ctx.editMessageText('✅ Суперника знайдено! Гра почалась.', ui.getMainMenu());
    } catch {
      // повідомлення могло бути звичайним, не inline
    }
  }
}

module.exports = { startOnlineGame };
