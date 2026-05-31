const profiles = new Map();

const LEVELS = [
  { min: 0, name: '🌱 Новачок', emoji: '🌱' },
  { min: 100, name: '♟️ Гравець', emoji: '♟️' },
  { min: 300, name: '⚡ Тактик', emoji: '⚡' },
  { min: 600, name: '🔥 Боець', emoji: '🔥' },
  { min: 1000, name: '💎 Майстер', emoji: '💎' },
  { min: 2000, name: '👑 Гросмейстер', emoji: '👑' },
];

const ACHIEVEMENTS = {
  first_puzzle: { id: 'first_puzzle', icon: '🧩', title: 'Перша загадка', xp: 20 },
  streak_5: { id: 'streak_5', icon: '🔥', title: 'Серія 5', xp: 50 },
  streak_10: { id: 'streak_10', icon: '💥', title: 'Серія 10', xp: 100 },
  first_win: { id: 'first_win', icon: '🏆', title: 'Перша перемога', xp: 40 },
  survival_3: { id: 'survival_3', icon: '⚡', title: 'Полювання ×3', xp: 60 },
  quiz_5: { id: 'quiz_5', icon: '🧠', title: 'Ерудит (5 вікторин)', xp: 50 },
  daily_done: { id: 'daily_done', icon: '📅', title: 'Загадка дня', xp: 30 },
  guess_3: { id: 'guess_3', icon: '🎯', title: 'Провидець (3 вгадав)', xp: 45 },
  xp_500: { id: 'xp_500', icon: '💎', title: '500 XP', xp: 0 },
  opening_master: { id: 'opening_master', icon: '📖', title: 'Дебютант', xp: 25 },
};

function defaultProfile() {
  return {
    xp: 0,
    achievements: [],
    stats: {
      puzzlesSolved: 0,
      gamesWon: 0,
      quizCorrect: 0,
      guessCorrect: 0,
      survivalBest: 0,
      dailyLast: null,
      openingsViewed: 0,
      rushBest: 0,
    },
    wheelLast: null,
    loginLast: null,
    loginStreak: 0,
    ownedTitles: ['t_rookie'],
    equippedTitle: 't_rookie',
  };
}

function getProfile(userId, username) {
  if (!profiles.has(userId)) profiles.set(userId, defaultProfile());
  const p = profiles.get(userId);
  if (username) p.username = username;
  return p;
}

function getLevelInfo(xp) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) level = l;
  }
  const next = LEVELS.find((l) => l.min > xp);
  const progress = next
    ? Math.min(100, Math.round(((xp - level.min) / (next.min - level.min)) * 100))
    : 100;
  return { ...level, xp, next: next?.min ?? null, progress };
}

function addXp(userId, amount, ctx) {
  const p = getProfile(userId);
  const before = getLevelInfo(p.xp);
  p.xp += amount;
  const after = getLevelInfo(p.xp);
  const unlocked = checkAchievements(userId);

  if (ctx && after.min > before.min) {
    ctx.telegram
      .sendMessage(userId, `🎉 *Новий рівень!* ${after.name}\n+${amount} XP`, { parse_mode: 'Markdown' })
      .catch(() => {});
  }

  return { xp: amount, levelUp: after.min > before.min, unlocked };
}

function unlockAchievement(userId, key) {
  const p = getProfile(userId);
  if (p.achievements.includes(key)) return null;
  const ach = ACHIEVEMENTS[key];
  if (!ach) return null;
  p.achievements.push(key);
  if (ach.xp > 0) p.xp += ach.xp;
  return ach;
}

function checkAchievements(userId) {
  const p = getProfile(userId);
  const unlocked = [];
  const tryUnlock = (key, cond) => {
    if (cond && !p.achievements.includes(key)) {
      const a = unlockAchievement(userId, key);
      if (a) unlocked.push(a);
    }
  };

  tryUnlock('first_puzzle', p.stats.puzzlesSolved >= 1);
  tryUnlock('streak_5', false);
  tryUnlock('streak_10', false);
  tryUnlock('first_win', p.stats.gamesWon >= 1);
  tryUnlock('survival_3', p.stats.survivalBest >= 3);
  tryUnlock('quiz_5', p.stats.quizCorrect >= 5);
  tryUnlock('guess_3', p.stats.guessCorrect >= 3);
  tryUnlock('xp_500', p.xp >= 500);
  tryUnlock('daily_done', p.stats.dailyLast !== null);
  tryUnlock('opening_master', p.stats.openingsViewed >= 3);

  return unlocked;
}

function onPuzzleSolved(userId, streak) {
  const p = getProfile(userId);
  p.stats.puzzlesSolved += 1;
  const bonus = 15 + Math.min(streak * 2, 20);
  addXp(userId, bonus);
  if (streak >= 5) unlockAchievement(userId, 'streak_5');
  if (streak >= 10) unlockAchievement(userId, 'streak_10');
  checkAchievements(userId);
  return bonus;
}

function onGameWon(userId) {
  const p = getProfile(userId);
  p.stats.gamesWon += 1;
  addXp(userId, 50);
  checkAchievements(userId);
}

function getLeaderboard(limit = 10) {
  return [...profiles.entries()]
    .map(([id, p]) => ({ id, xp: p.xp, name: p.username || `Гравець ${id}` }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

function formatProfile(userId, username) {
  const p = getProfile(userId);
  const shop = require('./shop');
  const title = shop.displayTitle(p);
  const lvl = getLevelInfo(p.xp);
  const bar = '█'.repeat(Math.floor(lvl.progress / 10)) + '░'.repeat(10 - Math.floor(lvl.progress / 10));
  const achList =
    p.achievements.length === 0
      ? '_Ще немає — грай і відкривай!_'
      : p.achievements.map((k) => ACHIEVEMENTS[k]?.icon || '🏅').join(' ');

  return (
    `👤 *Профіль* ${username ? `@${username}` : ''}\n` +
    `🎖 Титул: ${title}\n\n` +
    `${lvl.emoji} *${lvl.name}* · ${p.xp} XP\n` +
    `${bar} ${lvl.progress}%\n\n` +
    `📊 *Статистика:*\n` +
    `🧩 Загадок: ${p.stats.puzzlesSolved}\n` +
    `🏆 Перемог: ${p.stats.gamesWon}\n` +
    `🧠 Вікторина: ${p.stats.quizCorrect}\n` +
    `🎯 Вгадав ходів: ${p.stats.guessCorrect}\n` +
    `⚡ Рекорд полювання: ${p.stats.survivalBest}\n` +
    `⏱️ Бліц загадок: ${p.stats.rushBest || 0}\n\n` +
    `🏅 *Досягнення:* ${achList}`
  );
}

module.exports = {
  getProfile,
  getLevelInfo,
  addXp,
  unlockAchievement,
  checkAchievements,
  onPuzzleSolved,
  onGameWon,
  getLeaderboard,
  formatProfile,
  ACHIEVEMENTS,
};
