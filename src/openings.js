const OPENINGS = [
  {
    name: 'Італійська партія',
    emoji: '🇮🇹',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4',
    tip: 'Білий розвиває слона на c4, тиснучи на слабку точку f7.',
    fen: 'r1bqkbnr/pppp1ppp/2n2n2/4p2b/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
  },
  {
    name: 'Сицилійський захист',
    emoji: '🐉',
    moves: '1.e4 c5',
    tip: 'Чорні борються за центр асиметрично — дуже популярний дебют.',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  },
  {
    name: 'Ферзовий гамбіт',
    emoji: '👑',
    moves: '1.d4 d5 2.c4',
    tip: 'Білий жертвує пішака c4 за контроль центру.',
    fen: 'rnbqkbnr/pppppppp/8/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
  },
  {
    name: 'Захист Німцовича',
    emoji: '🛡️',
    moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4',
    tip: 'Чорний слон перев’язує коня c3 — гнучкий план.',
    fen: 'rnbqk2r/pppp1pp1/4pn1p/8/1b1P4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4',
  },
  {
    name: 'Королівський гамбіт',
    emoji: '⚔️',
    moves: '1.e4 e5 2.f4',
    tip: 'Агресивна жертва пішака f4 за швидку атаку.',
    fen: 'rnbqkbnr/pppppppp/8/8/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f0 0 2',
  },
  {
    name: 'Каталонська',
    emoji: '🏰',
    moves: '1.d4 Nf6 2.c4 e6 3.g3',
    tip: 'Білий готує fianchetto слона g2 — позиційний тиск.',
    fen: 'rnbqkb1r/pppp1pp1/4pn1p/8/2PP4/6P1/PP3PPP/RNBQKBNR b KQkq - 0 3',
  },
  {
    name: 'Славянський захист',
    emoji: '🧱',
    moves: '1.d4 d5 2.c4 c6',
    tip: 'Чорні підтримують d5 пішаком c6 — міцний центр.',
    fen: 'rnbqkbnr/pp1ppppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
  },
  {
    name: 'Англійський початок',
    emoji: '🎩',
    moves: '1.c4',
    tip: 'Гнучкий хід — білі контролюють d5 без фіксації центру.',
    fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
  },
];

function getOpening(i) {
  return OPENINGS[i % OPENINGS.length];
}

module.exports = { OPENINGS, getOpening };
