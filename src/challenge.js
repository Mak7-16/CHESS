const pending = new Map();

function create(userId) {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  pending.set(code, { host: userId, createdAt: Date.now() });
  setTimeout(() => pending.delete(code), 10 * 60 * 1000);
  return code;
}

function join(code, guestId) {
  const entry = pending.get(code.toUpperCase());
  if (!entry) return { error: 'Код не знайдено або застарів.' };
  if (entry.host === guestId) return { error: 'Не можна грати сам із собою.' };
  pending.delete(code.toUpperCase());
  return { host: entry.host, guest: guestId };
}

function cancel(code) {
  pending.delete(code.toUpperCase());
}

module.exports = { create, join, cancel };
