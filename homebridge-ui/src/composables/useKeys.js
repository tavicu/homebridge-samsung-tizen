const KEY_GROUPS = [
  {
    id: 'playback',
    title: 'Playback',
    description: 'Commands sent from the iOS remote transport controls',
    keys: [
      { id: 'PLAY_PAUSE', label: 'Play / Pause', default: 'KEY_PLAY_BACK' },
      { id: 'REWIND', label: 'Rewind', default: 'KEY_REWIND' },
      { id: 'FAST_FORWARD', label: 'Fast Forward', default: 'KEY_FF' },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Commands sent from the iOS remote directional pad',
    keys: [
      { id: 'ARROW_UP', label: 'Arrow Up', default: 'KEY_UP' },
      { id: 'ARROW_DOWN', label: 'Arrow Down', default: 'KEY_DOWN' },
      { id: 'ARROW_LEFT', label: 'Arrow Left', default: 'KEY_LEFT' },
      { id: 'ARROW_RIGHT', label: 'Arrow Right', default: 'KEY_RIGHT' },
      { id: 'SELECT', label: 'Select', default: 'KEY_ENTER' },
      { id: 'BACK', label: 'Back', default: 'KEY_RETURN' },
      { id: 'EXIT', label: 'Exit', default: 'KEY_RETURN' },
      { id: 'INFORMATION', label: 'Information', default: 'KEY_INFO' },
    ],
  },
];

const KEYS = KEY_GROUPS.flatMap((group) => group.keys);

function readKeys(keys = {}) {
  const stored = Object.fromEntries(Object.entries(keys).map(([id, value]) => [id.toUpperCase(), value]));

  return Object.fromEntries(
    KEYS.map((key) => [
      key.id,
      String(stored[key.id] || '')
        .trim()
        .toUpperCase(),
    ]),
  );
}

function toConfigKeys(form) {
  return Object.fromEntries(Object.entries(form).map(([id, value]) => [id, value.toUpperCase()]));
}

export function useKeys() {
  return {
    keyGroups: KEY_GROUPS,
    readKeys,
    toConfigKeys,
  };
}
