const GUESS = [
  {
    title: 'Фішер — «мат століття»',
    fen: '6k1/5ppp/8/2B5/8/8/8/6K1 w - - 0 1',
    question: 'Білі ходять. Який найсильніший хід?',
    options: ['Bc4', 'Bxe7', 'Kg2', 'Kf1'],
    correct: 1,
    explain: 'Bxe7# — мат! Один з найвідоміших матів у історії.',
  },
  {
    title: 'Морфі — розвиток',
    fen: 'r1bqkbnr/pppp1ppp/2n2n2/4p2Q/3P4/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1',
    question: 'Білі атакують f7. Що грати?',
    options: ['Qxf7+', 'Qh4', 'dxe5', 'Bc4'],
    correct: 0,
    explain: 'Qxf7+ — швидка атака на слабкого короля.',
  },
  {
    title: 'Вилка коня',
    fen: '8/8/8/3p4/8/3N4/8/3K1k2 w - - 0 1',
    question: 'Знайди тактичний удар!',
    options: ['Nc5', 'Ne5', 'Kf2', 'Nf4'],
    correct: 1,
    explain: 'Ne5+ — вилка на короля і пішака.',
  },
  {
    title: 'Мат турами',
    fen: '6k1/5ppp/8/8/8/8/8/R1K5 w - - 0 1',
    question: 'Як завершити партію?',
    options: ['Rb8', 'Ra8', 'Kc2', 'Rh1'],
    correct: 1,
    explain: 'Ra8# — класичний мат на останній горизонталі.',
  },
  {
    title: 'Центр',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
    question: 'Найпопулярніший перший хід білих?',
    options: ['d4', 'Nf3', 'e4', 'c4'],
    correct: 2,
    explain: '1.e4 — королівський пішак, контроль центру.',
  },
  {
    title: 'Захист',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    question: 'Чорні зіграли c5. Як називається дебют?',
    options: ['Французька', 'Сицилійська', 'Каро-Кан', 'Алехін'],
    correct: 1,
    explain: '1.e4 c5 — Сицилійський захист!',
  },
];

function getGuess(i) {
  return GUESS[i % GUESS.length];
}

function randomIndex(exclude = -1) {
  let i;
  do {
    i = Math.floor(Math.random() * GUESS.length);
  } while (i === exclude && GUESS.length > 1);
  return i;
}

module.exports = { GUESS, getGuess, randomIndex };
