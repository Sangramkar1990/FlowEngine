function oneWeekAgoISO() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - 7 * DAY_MS).toISOString();
}

module.exports = { oneWeekAgoISO };