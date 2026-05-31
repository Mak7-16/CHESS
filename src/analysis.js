const { Chess } = require('chess.js');

const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function countMaterial(chess) {
  const board = chess.board();
  let w = 0;
  let b = 0;
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (!p || p.type === 'k') continue;
      const v = VALUES[p.type];
      if (p.color === 'w') w += v;
      else b += v;
    }
  }
  return { w, b };
}

function analyzeFen(fen) {
  const chess = new Chess(fen);
  const { w, b } = countMaterial(chess);
  const diff = w - b;
  const turn = chess.turn() === 'w' ? 'білих' : 'чорних';
  const board = chess.board();
  let pieces = { w: {}, b: {} };
  for (const row of board) {
    for (const p of row) {
      if (!p || p.type === 'k') continue;
      const side = p.color;
      pieces[side][p.type] = (pieces[side][p.type] || 0) + 1;
    }
  }

  let evalText;
  if (diff > 2) evalText = '⬜ Білі значно сильніші';
  else if (diff > 0) evalText = '⬜ Білі трохи краще';
  else if (diff < -2) evalText = '⬛ Чорні значно сильніші';
  else if (diff < 0) evalText = '⬛ Чорні трохи краще';
  else evalText = '⚖️ Матеріал рівний';

  let status = '';
  if (chess.isCheckmate()) status = '☠️ Мат на дошці!';
  else if (chess.isCheck()) status = '⚠️ Шах!';
  else if (chess.isStalemate()) status = '🤝 Пат';
  else if (chess.isDraw()) status = '🤝 Нічия';
  else status = `Хід: *${turn}*`;

  const fmt = (side, emoji) => {
    const p = pieces[side];
    const parts = [];
    if (p.q) parts.push(`ферзь×${p.q}`);
    if (p.r) parts.push(`тура×${p.r}`);
    if (p.b) parts.push(`слони×${p.b}`);
    if (p.n) parts.push(`кінь×${p.n}`);
    if (p.p) parts.push(`пішаки×${p.p}`);
    return `${emoji}: ${parts.join(', ') || 'немає фігур'}`;
  };

  return {
    evalText,
    status,
    material: `⬜ ${w} vs ⬛ ${b} (пішаки=1, кінь/сл=3, тура=5, ферзь=9)`,
    pieces: `${fmt('w', '⬜')}\n${fmt('b', '⬛')}`,
    moves: chess.moves().length,
  };
}

const PRESETS = [
  { name: 'Старт', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  { name: 'Сицилійська', fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
  { name: 'Мат 1', fen: '6k1/5ppp/8/8/8/6Q1/8/7K w - - 0 1' },
  { name: 'Ендшпіль K+P', fen: '8/8/8/8/8/3P4/8/3K2k1 w - - 0 1' },
];

module.exports = { analyzeFen, PRESETS };
