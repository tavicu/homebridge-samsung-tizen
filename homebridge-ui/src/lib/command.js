// What the plugin's parseCommands understands: a key, a key repeated N times (KEY_VOLUP*3) or held for N seconds (KEY_POWER*2.5s).
export const COMMAND_PATTERN = '[A-Za-z0-9_]+(\\*([1-9][0-9]*|[0-9]*\\.?[0-9]+[sS]))?';

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
