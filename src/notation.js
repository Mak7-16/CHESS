const NOTATION = [
  { move: 'e4', q: 'Що означає хід e4?', options: ['Пішак e4', 'Кінь e4', 'Слон e4', 'Тура e4'], correct: 0 },
  { move: 'Nf3', q: 'Що означає Nf3?', options: ['Кінь на f3', 'Слон на f3', 'Пішак f3', 'Ферзь f3'], correct: 0 },
  { move: 'Bxc6', q: 'Що означає Bxc6?', options: ['Слон б’є на c6', 'Кінь б’є c6', 'Тура c6', 'Пішак c6'], correct: 0 },
  { move: 'O-O', q: 'Що означає O-O?', options: ['Рокіровка', 'Здача', 'Нічия', 'Мат'], correct: 0 },
  { move: 'Qh5+', q: 'Що означає Qh5+?', options: ['Ферзь h5 з шахом', 'Ферзь h5 без шаху', 'Кінь h5', 'Пішак h5'], correct: 0 },
  { move: 'exd5', q: 'Що означає exd5?', options: ['Пішак e бере на d5', 'Пішак d5', 'Слон xd5', 'e5'], correct: 0 },
  { move: 'Rd8#', q: 'Що означає Rd8#?', options: ['Тура d8 мат', 'Тура d8 шах', 'Ферзь d8', 'Слон d8'], correct: 0 },
  { move: 'Nxe4', q: 'Що означає Nxe4?', options: ['Кінь бере на e4', 'Кінь e4', 'Пішак xe4', 'Кінь x4'], correct: 0 },
];

function getNotation(i) {
  return NOTATION[i % NOTATION.length];
}

function randomIndex(exclude = -1) {
  let i;
  do {
    i = Math.floor(Math.random() * NOTATION.length);
  } while (i === exclude && NOTATION.length > 1);
  return i;
}

module.exports = { NOTATION, getNotation, randomIndex };
