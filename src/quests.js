function todayKey() {
  return new Date().toDateString();
}

function ensureQuests(profile) {
  if (!profile.dailyQuests || profile.dailyQuests.date !== todayKey()) {
    profile.dailyQuests = {
      date: todayKey(),
      puzzle: false,
      botWin: false,
      quiz: false,
      opening: false,
      claimed: false,
    };
  }
  return profile.dailyQuests;
}

function markQuest(profile, key) {
  const q = ensureQuests(profile);
  q[key] = true;
  return q;
}

function questsProgress(q) {
  const done = [q.puzzle, q.botWin, q.quiz, q.opening].filter(Boolean).length;
  return { done, total: 4, complete: done === 4 };
}

function formatQuestsText(profile) {
  const q = ensureQuests(profile);
  const { done, total } = questsProgress(q);
  const icon = (ok) => (ok ? '✅' : '⬜');

  return (
    `📋 *Щоденні квести* (${done}/${total})\n\n` +
    `${icon(q.puzzle)} Виріши 1 загадку\n` +
    `${icon(q.botWin)} Переможи бота\n` +
    `${icon(q.quiz)} Відповідай у вікторині\n` +
    `${icon(q.opening)} Вивчи 1 дебют\n\n` +
    (q.claimed
      ? '_Нагороду вже отримано сьогодні._'
      : done === total
        ? '🎁 *Усі виконано!* Забери +80 XP'
        : '_Нагорода: +80 XP за всі 4_')
  );
}

module.exports = { ensureQuests, markQuest, questsProgress, formatQuestsText };
