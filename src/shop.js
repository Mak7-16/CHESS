const TITLES = [
  { id: 't_rookie', name: '🌱 Новачок', cost: 0 },
  { id: 't_hunter', name: '🎯 Мисливець', cost: 150 },
  { id: 't_knight', name: '🐴 Лицар', cost: 300 },
  { id: 't_fire', name: '🔥 Вогняний', cost: 500 },
  { id: 't_legend', name: '🏛 Легенда', cost: 800 },
  { id: 't_dragon', name: '🐉 Дракон', cost: 1200 },
  { id: 't_cosmic', name: '🌌 Космічний ГМ', cost: 2000 },
];

function getTitle(id) {
  return TITLES.find((t) => t.id === id);
}

function buyTitle(profile, titleId) {
  const title = getTitle(titleId);
  if (!title) return { ok: false, msg: 'Титул не знайдено' };
  if (!profile.ownedTitles) profile.ownedTitles = ['t_rookie'];
  if (profile.ownedTitles.includes(titleId)) {
    profile.equippedTitle = titleId;
    return { ok: true, msg: `Титул ${title.name} екіпіровано!` };
  }
  if (profile.xp < title.cost) {
    return { ok: false, msg: `Потрібно ${title.cost} XP (у тебе ${profile.xp})` };
  }
  profile.xp -= title.cost;
  profile.ownedTitles.push(titleId);
  profile.equippedTitle = titleId;
  return { ok: true, msg: `Куплено: ${title.name}! −${title.cost} XP` };
}

function displayTitle(profile) {
  const id = profile.equippedTitle || 't_rookie';
  return getTitle(id)?.name || '🌱 Новачок';
}

module.exports = { TITLES, getTitle, buyTitle, displayTitle };
