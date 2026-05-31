const BOT_NAMES = ['🤖 Рookie', '🤖 Tactician', '🤖 Master', '🤖 Champion'];

function runTournament(userId) {
  let wins = 0;
  const rounds = [];
  for (let i = 0; i < 4; i += 1) {
    const userWins = Math.random() < 0.55 + wins * 0.05;
    if (userWins) wins += 1;
    rounds.push({
      round: i + 1,
      opponent: BOT_NAMES[i],
      result: userWins ? '✅ Перемога' : '❌ Поразка',
    });
  }
  const place = wins === 4 ? 1 : wins >= 3 ? 2 : wins >= 2 ? 3 : 4;
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  const xp = wins * 25 + (place === 1 ? 50 : 0);
  return { rounds, wins, place, medal: medals[place - 1], xp };
}

module.exports = { runTournament, BOT_NAMES };
