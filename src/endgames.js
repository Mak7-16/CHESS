const ENDGAMES = [
  {
    title: 'Мат ферзем',
    fen: '8/8/8/8/8/3k4/8/3K2Q1 w - - 0 1',
    color: 'w',
    solution: [{ from: 'g1', to: 'e3' }],
    hint: 'Ферзь підводить мат королю.',
    explanation: 'Qe3# — базовий мат ферзем.',
  },
  {
    title: 'Мат турами',
    fen: '8/8/8/8/8/3k4/8/3KR3 w - - 0 1',
    color: 'w',
    solution: [{ from: 'e1', to: 'e3' }],
    hint: 'Тура дає мат на 3-й вертикалі.',
    explanation: 'Re3# — класичний мат турами.',
  },
  {
    title: 'Мат двома турами',
    fen: '8/8/8/8/8/3k4/8/R3K2R w - - 0 1',
    color: 'w',
    solution: [{ from: 'a1', to: 'a3' }],
    hint: 'Одна тура ставить мат, друга контролює втечу.',
    explanation: 'Ra3# — мат двома турами.',
  },
  {
    title: 'Пішак у ферзя',
    fen: '6k1/4Pp1p/8/8/8/8/8/6K1 w - - 0 1',
    color: 'w',
    solution: [{ from: 'e7', to: 'e8' }],
    hint: 'Пішак перетворюється!',
    explanation: 'e8=Q# — пішак стає ферзем і дає мат.',
  },
  {
    title: 'Король підтримує пішака',
    fen: '8/8/3k4/8/8/3P4/8/3K4 w - - 0 1',
    color: 'w',
    solution: [{ from: 'd1', to: 'c2' }],
    hint: 'Король підходить до пішака.',
    explanation: 'Kc2 — король підтримує прохід пішака.',
  },
];

function getEndgame(i) {
  return ENDGAMES[i % ENDGAMES.length];
}

function randomIndex(exclude = -1) {
  let i;
  do {
    i = Math.floor(Math.random() * ENDGAMES.length);
  } while (i === exclude && ENDGAMES.length > 1);
  return i;
}

module.exports = { ENDGAMES, getEndgame, randomIndex };
