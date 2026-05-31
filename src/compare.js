const { Chess } = require('chess.js');

const COMPARE = [
  {
    title: 'Центр у відкритті',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
    color: 'w',
    options: ['Nf3', 'Bc4', 'd4', 'h4'],
    correct: 2,
    explain: 'd4 — найкращий спосіб боротись за центр.',
    moves: { d4: 'd2d4', Nf3: 'g1f3', Bc4: 'f1c4', h4: 'h2h4' },
  },
  {
    title: 'Розвиток фігур',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/3P4/8/PPP1PPPP/RNB1KBNR w KQkq - 0 1',
    color: 'w',
    options: ['Qxf7+', 'Nc3', 'Be2', 'h3'],
    correct: 1,
    explain: 'Nc3 — розвиває фігуру з контролем центру (Qxf7 ризикована).',
    moves: { 'Qxf7+': 'h5f7', Nc3: 'b1c3', Be2: 'f1e2', h3: 'h2h3' },
  },
  {
    title: 'Тактика',
    fen: '8/8/8/3p4/8/3N4/8/3K1k2 w - - 0 1',
    color: 'w',
    options: ['Ne5', 'Nc5', 'Kf2', 'Nf4'],
    correct: 0,
    explain: 'Ne5+ — вилка, найсильніший хід.',
    moves: { Ne5: 'd3e5', Nc5: 'd3c5', Kf2: 'd1f2', Nf4: 'd3f4' },
  },
];

function getCompare(i) {
  return COMPARE[i % COMPARE.length];
}

function randomIndex(ex = -1) {
  let i;
  do {
    i = Math.floor(Math.random() * COMPARE.length);
  } while (i === ex && COMPARE.length > 1);
  return i;
}

function tryMove(fen, sanKey, item) {
  const chess = new Chess(fen);
  const uci = item.moves[sanKey];
  if (!uci) return false;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  try {
    chess.move({ from, to, promotion: 'q' });
    return true;
  } catch {
    return false;
  }
}

module.exports = { COMPARE, getCompare, randomIndex, tryMove };
