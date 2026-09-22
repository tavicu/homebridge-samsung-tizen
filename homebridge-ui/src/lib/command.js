export function normalizeCommand(value) {
  const trimmed = String(value).trim();
  const star = trimmed.indexOf('*');

  if (star === -1) {
    return trimmed.toUpperCase();
  }

  const key = trimmed.slice(0, star).trim().toUpperCase();
  const suffix = trimmed.slice(star + 1).trim();

  return `${key}*${suffix}`;
}
