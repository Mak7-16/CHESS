require('dotenv').config();
const { Telegraf } = require('telegraf');
const { registerHandlers } = require('./src/handlers');

const token = (process.env.TELEGRAM_TOKEN || '').trim();

if (!token) {
  console.error('Помилка: TELEGRAM_TOKEN не задано в .env');
  process.exit(1);
}

if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
  console.error('Помилка: TELEGRAM_TOKEN має вигляд 123456789:ABCdefGHI...');
  process.exit(1);
}

const bot = new Telegraf(token);
registerHandlers(bot);

bot
  .launch({ dropPendingUpdates: true }, () => {
    console.log('♟️ Шаховий бот запущено');
  })
  .catch((err) => {
    const code = err.response?.error_code;
    if (code === 401 || code === 404) {
      console.error(
        'Помилка: невірний або скасований TELEGRAM_TOKEN.\n' +
          '1. Відкрийте @BotFather у Telegram\n' +
          '2. /mybots → ваш бот → API Token\n' +
          '3. Скопіюйте токен у .env: TELEGRAM_TOKEN=ваш_токен'
      );
    } else if (code === 409) {
      console.error(
        'Помилка: бот уже запущений в іншому вікні терміналу.\n' +
          'Зупиніть попередній процес (Ctrl+C) і запустіть знову: npm start'
      );
    } else {
      console.error('Помилка запуску:', err.message);
    }
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
