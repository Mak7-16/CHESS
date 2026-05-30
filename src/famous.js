const FAMOUS = [
  {
    title: 'Операційна партія',
    players: 'Андерсен — Кізерицький, 1851',
    steps: [
      {
        text: 'Легендарна «Операна» — жертви за атаку. Позиція після розвитку.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/3P4/5N2/PPP1PPPP/RNB1KB1R w KQkq - 0 6',
      },
      {
        text: 'Білі жертвують ферзя! 11.Qxf3 — відкриття ліній на короля.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/3P4/5N2/PPP1PPPP/RNB1KB1R b KQkq - 0 11',
      },
      {
        text: 'Кульмінація: 22.Qxa7+ — безперервна атака до мата.',
        fen: 'r1bq1rk1/pppp1ppp/2n2n2/8/3P4/5N2/PPP1PPPP/RNB1KB1R w KQ - 0 22',
      },
    ],
  },
  {
    title: 'Партія століття',
    players: 'Бирн — Фішер, 1956',
    steps: [
      {
        text: '13-річний Фішер проти майстра. Чорні готують контргру.',
        fen: 'rnbqk2r/pppp1ppp/4pn2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 4',
      },
      {
        text: 'Фішер активізує фігури. Центр під контролем чорних.',
        fen: 'rnbqkb1r/pppp1pp1/4pn1p/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 8',
      },
      {
        text: 'Фінал: чорні виграють матеріал і партію — геній у дії!',
        fen: 'r1bqkb1r/ppp2ppp/4pn2/8/4P3/3B4/PPP2PPP/RNBQ1RK1 w kq - 0 12',
      },
    ],
  },
  {
    title: 'Мат молодого Каспарова',
    players: 'Каспаров — Портіш, 1983',
    steps: [
      {
        text: 'Каспаров будує атаку на королівському фланзі.',
        fen: 'r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 12',
      },
      {
        text: 'Жертва пішака відкриває короля суперника.',
        fen: 'r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 0 12',
      },
      {
        text: 'Блискучий фініш — один з найкрасивіших матів 80-х.',
        fen: 'r2q1rk1/pp2bppp/2n1p3/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 14',
      },
    ],
  },
];

function getFamous(i) {
  return FAMOUS[i % FAMOUS.length];
}

module.exports = { FAMOUS, getFamous };
