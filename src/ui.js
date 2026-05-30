const { Markup } = require('telegraf');
const { Chess } = require('chess.js');

const PIECES = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function idxToSquare(idx) {
  const file = 'abcdefgh'[idx % 8];
  const rank = 8 - Math.floor(idx / 8);
  return `${file}${rank}`;
}

function squareToIdx(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10);
  return (8 - rank) * 8 + file;
}

function renderBoard(fen, perspective = 'w', selectedSquare = null) {
  const chess = new Chess(fen);
  const board = chess.board();
  const lines = ['  𝗮 𝗯 𝗰 𝗱 𝗲 𝗳 𝗴 𝗵'];

  for (let row = 0; row < 8; row += 1) {
    const rank = perspective === 'w' ? 8 - row : row + 1;
    const rowIdx = perspective === 'w' ? row : 7 - row;
    const cells = [];

    for (let col = 0; col < 8; col += 1) {
      const colIdx = perspective === 'w' ? col : 7 - col;
      const piece = board[rowIdx][colIdx];
      const idx = row * 8 + col;
      const square = idxToSquare(idx);
      let symbol = piece ? PIECES[piece.color][piece.type] : '·';

      if (selectedSquare === square) {
        symbol = `[${symbol}]`;
      }

      cells.push(symbol);
    }

    lines.push(`${rank} ${cells.join(' ')} ${rank}`);
  }

  lines.push('  𝗮 𝗯 𝗰 𝗱 𝗲 𝗳 𝗴 𝗵');
  return lines.join('\n');
}

function getMainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎮 Ігри', 'menu:games'), Markup.button.callback('📚 Навчання', 'menu:learn')],
    [Markup.button.callback('👤 Профіль', 'menu:profile'), Markup.button.callback('📋 Квести', 'menu:quests')],
    [Markup.button.callback('🎡 Колесо', 'menu:wheel'), Markup.button.callback('📆 Серія входів', 'menu:streak')],
    [Markup.button.callback('🏆 Рейтинг', 'menu:leaderboard'), Markup.button.callback('💡 Факти', 'menu:facts')],
    [Markup.button.callback('ℹ️ Допомога', 'menu:help')],
  ]);
}

function getGamesMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🧩 Загадки', 'menu:puzzles'), Markup.button.callback('⏱️ Бліц 2 хв', 'menu:rush')],
    [Markup.button.callback('⚡ Полювання', 'menu:survival'), Markup.button.callback('🎯 Вгадай хід', 'menu:guess')],
    [Markup.button.callback('👥 2 на 1 телефоні', 'menu:hotseat'), Markup.button.callback('🤝 Виклик (/join)', 'menu:challenge')],
    [Markup.button.callback('🤖 Бот', 'menu:bot'), Markup.button.callback('🌐 Онлайн', 'menu:online')],
    [Markup.button.callback('◀️ Меню', 'back:menu')],
  ]);
}

function getLearnMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📚 Уроки', 'menu:lessons'), Markup.button.callback('📖 Дебюти', 'menu:openings')],
    [Markup.button.callback('🏛 Легенди', 'menu:famous'), Markup.button.callback('👑 Ендшпіль', 'menu:endgames')],
    [Markup.button.callback('📝 Нотація', 'menu:notation'), Markup.button.callback('🧠 Вікторина', 'menu:quiz')],
    [Markup.button.callback('📅 Загадка дня', 'menu:daily')],
    [Markup.button.callback('◀️ Меню', 'back:menu')],
  ]);
}

function getProfileMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏆 Рейтинг', 'menu:leaderboard')],
    [Markup.button.callback('◀️ Меню', 'back:menu')],
  ]);
}

function getFactsMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎲 Випадковий факт', 'fact:random')],
    [Markup.button.callback('♟️ Порада тренера', 'fact:tip')],
    [Markup.button.callback('◀️ Меню', 'back:menu')],
  ]);
}

function getPuzzleMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚡ Нова загадка', 'puzzle:start')],
    [Markup.button.callback('📊 Мій рекорд', 'puzzle:stats')],
    [Markup.button.callback('◀️ Назад', 'back:menu')],
  ]);
}

function getPuzzleSolvedMenu(nextIndex) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Наступна загадка', `puzzle:play:${nextIndex}`)],
    [Markup.button.callback('🏠 Меню', 'back:menu')],
  ]);
}

function getPuzzleKeyboard(fen, userColor, selectedSquare = null) {
  const chess = new Chess(fen);
  const board = chess.board();
  const rows = [];

  for (let row = 0; row < 8; row += 1) {
    const rowButtons = [];
    for (let col = 0; col < 8; col += 1) {
      const idx = row * 8 + col;
      const square = idxToSquare(idx);
      const piece = board[row][col];
      let label = piece ? PIECES[piece.color][piece.type] : '·';

      if (selectedSquare === square) {
        label = `▸${label}`;
      }

      const isOwnPiece = piece && piece.color === userColor;
      const enabled = selectedSquare || isOwnPiece;

      rowButtons.push(
        Markup.button.callback(label, enabled ? `psq:${square}` : 'noop')
      );
    }
    rows.push(rowButtons);
  }

  rows.push([
    Markup.button.callback('💡 Підказка', 'puzzle:hint'),
    Markup.button.callback('⏭️ Пропустити', 'puzzle:skip'),
  ]);
  rows.push([Markup.button.callback('🏠 Меню', 'back:menu')]);

  return Markup.inlineKeyboard(rows);
}

function getBotDifficultyMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Легко', 'bot:easy')],
    [Markup.button.callback('🟡 Середньо', 'bot:medium')],
    [Markup.button.callback('🔴 Важко', 'bot:hard')],
    [Markup.button.callback('◀️ Назад', 'back:menu')],
  ]);
}

function getOnlineMenu(inQueue) {
  if (inQueue) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⏳ Шукаю суперника...', 'noop')],
      [Markup.button.callback('❌ Скасувати пошук', 'online:cancel')],
      [Markup.button.callback('◀️ Назад', 'back:menu')],
    ]);
  }

  return Markup.inlineKeyboard([
    [Markup.button.callback('🔍 Знайти суперника', 'online:find')],
    [Markup.button.callback('◀️ Назад', 'back:menu')],
  ]);
}

function getLessonNav(lessonId, step, totalSteps) {
  const buttons = [];

  if (step > 0) {
    buttons.push(Markup.button.callback('◀️ Назад', `lesson:${lessonId}:${step - 1}`));
  }
  if (step < totalSteps - 1) {
    buttons.push(Markup.button.callback('▶️ Далі', `lesson:${lessonId}:${step + 1}`));
  } else {
    buttons.push(Markup.button.callback('✅ Завершити', `lesson:${lessonId}:done`));
  }

  return Markup.inlineKeyboard([
    buttons,
    [Markup.button.callback('📋 Список уроків', 'menu:lessons'), Markup.button.callback('🏠 Меню', 'back:menu')],
  ]);
}

function getLessonsList(lessons) {
  const rows = lessons.map((lesson, i) => [
    Markup.button.callback(`${i + 1}. ${lesson.title}`, `lesson:${i}:0`),
  ]);
  rows.push([Markup.button.callback('◀️ Назад', 'back:menu')]);
  return Markup.inlineKeyboard(rows);
}

function getBoardKeyboard(fen, userColor, selectedSquare = null, canMove = true, showHint = false) {
  const chess = new Chess(fen);
  const board = chess.board();
  const turn = chess.turn();
  const rows = [];

  for (let row = 0; row < 8; row += 1) {
    const rowButtons = [];
    for (let col = 0; col < 8; col += 1) {
      const idx = row * 8 + col;
      const square = idxToSquare(idx);
      const piece = board[row][col];
      let label = piece ? PIECES[piece.color][piece.type] : '·';

      if (selectedSquare === square) {
        label = `▸${label}`;
      }

      const isOwnPiece = piece && piece.color === userColor;
      const enabled = canMove && turn === userColor && (selectedSquare || isOwnPiece);

      rowButtons.push(
        Markup.button.callback(label, enabled ? `sq:${square}` : 'noop')
      );
    }
    rows.push(rowButtons);
  }

  const bottom = [
    Markup.button.callback('🏳️ Здатися', 'game:resign'),
    Markup.button.callback('🏠 Меню', 'game:exit'),
  ];
  if (showHint) {
    rows.push([Markup.button.callback('💡 Підказка ходу', 'game:hint')]);
  }
  rows.push(bottom);

  return Markup.inlineKeyboard(rows);
}

function gameStatusText(fen, userColor, opponentLabel) {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const you = userColor === 'w' ? 'білі' : 'чорні';
  const opponent = userColor === 'w' ? 'чорні' : 'білі';

  if (chess.isCheckmate()) {
    const winner = turn === 'w' ? 'чорні' : 'білі';
    return winner === you ? '🏆 Мат! Ви перемогли!' : '😔 Мат. Перемога суперника.';
  }
  if (chess.isStalemate()) return '🤝 Пат — нічия.';
  if (chess.isDraw()) return '🤝 Нічия.';
  if (chess.isCheck()) {
    return turn === userColor
      ? `⚠️ Шах! Ваш хід (${you}).`
      : `♟️ Хід суперника (${opponentLabel || opponent}).`;
  }

  if (turn === userColor) {
    return `✅ Ваш хід (${you}). Оберіть фігуру.`;
  }
  return `⏳ Хід суперника (${opponentLabel || opponent}).`;
}

module.exports = {
  idxToSquare,
  squareToIdx,
  renderBoard,
  getMainMenu,
  getGamesMenu,
  getLearnMenu,
  getProfileMenu,
  getFactsMenu,
  getPuzzleMenu,
  getPuzzleSolvedMenu,
  getPuzzleKeyboard,
  getBotDifficultyMenu,
  getOnlineMenu,
  getLessonNav,
  getLessonsList,
  getBoardKeyboard,
  gameStatusText,
};
