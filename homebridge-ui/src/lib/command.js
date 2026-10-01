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

let lastCommandId = 0;

// One editable row of a command list. The id only keeps the rows stable while they are added and removed.
export function createCommand(value = '') {
  lastCommandId += 1;
  return { id: lastCommandId, value };
}

// Turns the command value from the config (an array or a comma separated string) into editable rows.
export function toCommandRows(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item) => createCommand(String(item).trim()));
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => createCommand(item.trim()));
  }

  return [createCommand()];
}

// Turns the rows back into the list saved in the config, leaving out the empty ones.
export function fromCommandRows(rows) {
  return rows.map((row) => normalizeCommand(row.value)).filter(Boolean);
}
