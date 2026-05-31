const CARDS = [
  { piece: '♙', name: 'Пішак', move: 'Вперед на 1 (з початку — 2). Б’є по діагоналі.' },
  { piece: '♘', name: 'Кінь', move: 'Буква «Г»: 2+1. Перестрибує фігури.' },
  { piece: '♗', name: 'Слон', move: 'По діагоналі на будь-яку відстань.' },
  { piece: '♖', name: 'Тура', move: 'По горизонталі та вертикалі.' },
  { piece: '♕', name: 'Ферзь', move: 'Тура + слон разом — найсильніша!' },
  { piece: '♔', name: 'Король', move: 'На 1 клітинку в будь-якому напрямку.' },
  { piece: '♙', name: 'Пішак (особливе)', move: 'На 8-му ряді перетворюється на ферзя.' },
  { piece: '♔', name: 'Рокіровка', move: 'Король + тура ходять разом — захист короля.' },
];

function getCard(i) {
  return CARDS[i % CARDS.length];
}

function randomIndex(ex = -1) {
  let i;
  do {
    i = Math.floor(Math.random() * CARDS.length);
  } while (i === ex && CARDS.length > 1);
  return i;
}

module.exports = { CARDS, getCard, randomIndex };
