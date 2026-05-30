const PUZZLES = [
  {
    title: 'Мат у 1',
    fen: '6k1/5ppp/8/8/8/6Q1/8/7K w - - 0 1',
    color: 'w',
    solution: [{ from: 'g3', to: 'g7' }],
    hint: 'Ферзь б’є на g7 — це мат.',
    explanation: 'Qxg7# — король у пастці.',
    rating: 400,
  },
  {
    title: 'Мат турами',
    fen: '6k1/5ppp/8/8/8/8/8/R1K5 w - - 0 1',
    color: 'w',
    solution: [{ from: 'a1', to: 'a8' }],
    hint: 'Тура по лінії a.',
    explanation: 'Ra8# — мат на останній горизонталі.',
    rating: 450,
  },
  {
    title: 'Вилка коня',
    fen: '8/8/8/3p4/8/3N4/8/3K1k2 w - - 0 1',
    color: 'w',
    solution: [{ from: 'd3', to: 'e5' }],
    hint: 'Кінь атакує короля і пішака.',
    explanation: 'Ne5+ — класична вилка!',
    rating: 500,
  },
  {
    title: 'Вічний шах',
    fen: '6k1/5ppp/8/8/8/6Q1/8/7K w - - 0 1',
    color: 'w',
    solution: [{ from: 'g3', to: 'g7' }],
    hint: 'Ферзь зависає над королем (не мат, але виграєш).',
    explanation: 'Qxg7+ — вічний шах! (У цій позиції — виграш пішака з шахом.)',
    rating: 550,
  },
  {
    title: 'Шах слоном',
    fen: '8/8/8/8/4k3/8/4B3/4K3 w - - 0 1',
    color: 'w',
    solution: [{ from: 'e2', to: 'c4' }],
    hint: 'Слон ріже по діагоналі.',
    explanation: 'Bc4+ — сильний шах.',
    rating: 600,
  },
  {
    title: 'Жертва ферзя',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/3P4/8/PPP1PPPP/RNB1KBNR w KQkq - 0 1',
    color: 'w',
    solution: [{ from: 'h5', to: 'f7' }],
    hint: 'Жертва на f7.',
    explanation: 'Qxf7+! — швидка атака.',
    rating: 700,
  },
  {
    title: 'Взяття ферзем',
    fen: '8/8/8/4k3/4p3/8/4Q3/4K3 w - - 0 1',
    color: 'w',
    solution: [{ from: 'e2', to: 'e4' }],
    hint: 'Ферзь з’їдає пішака e4.',
    explanation: 'Qxe4+ — шах і виграш пішака.',
    rating: 800,
  },
  {
    title: 'Мат кінем',
    fen: '6k1/5ppp/8/8/8/5N2/8/6K1 w - - 0 1',
    color: 'w',
    solution: [{ from: 'f3', to: 'h4' }],
    hint: 'Кінь на h4 дає мат.',
    explanation: 'Nh4# — красивий мат!',
    rating: 850,
  },
  {
    title: 'Подвійний удар',
    fen: '4k3/8/8/8/3q4/8/4R3/4K3 w - - 0 1',
    color: 'w',
    solution: [{ from: 'e2', to: 'e8' }],
    hint: 'Тура дає шах на e8.',
    explanation: 'Rxe8+ — виграєте ферзя.',
    rating: 900,
  },
  {
    title: 'Гросмейстерська',
    fen: '6k1/5ppp/8/2B5/8/8/8/6K1 w - - 0 1',
    color: 'w',
    solution: [{ from: 'c5', to: 'e7' }],
    hint: 'Слон з’їдає на e7 — мат!',
    explanation: 'Bxe7# — ти гросмейстер загадок!',
    rating: 1000,
  },
  {
    title: 'Мат ферзем #2',
    fen: '6k1/5ppp/8/8/8/6Q1/8/7K w - - 0 1',
    color: 'w',
    solution: [{ from: 'g3', to: 'g7' }],
    hint: 'Знову ферзь на g7!',
    explanation: 'Qxg7# — бачиш закономірність?',
    rating: 650,
  },
  {
    title: 'Шах турами',
    fen: '4k3/8/8/8/8/8/8/4R2K w - - 0 1',
    color: 'w',
    solution: [{ from: 'e1', to: 'e8' }],
    hint: 'Тура по відкритій вертикалі e.',
    explanation: 'Re8+ — виграєш матеріал або мат.',
    rating: 750,
  },
];

const TITLES = [
  { min: 0, title: '🌱 Новачок' },
  { min: 3, title: '♟️ Учень' },
  { min: 7, title: '⚡ Тактик' },
  { min: 12, title: '🔥 Мисливець за матами' },
  { min: 20, title: '👑 Гросмейстер загадок' },
];

function getPuzzle(index) {
  return PUZZLES[index % PUZZLES.length];
}

function getTitle(solved) {
  let title = TITLES[0].title;
  for (const t of TITLES) {
    if (solved >= t.min) title = t.title;
  }
  return title;
}

function getRandomPuzzleIndex(excludeIndex = -1) {
  if (PUZZLES.length === 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * PUZZLES.length);
  } while (idx === excludeIndex);
  return idx;
}

module.exports = { PUZZLES, TITLES, getPuzzle, getTitle, getRandomPuzzleIndex };
