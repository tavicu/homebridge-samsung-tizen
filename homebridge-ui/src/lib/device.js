const DIGITAL_TV_NAME = 'Digital TV';

export const DEFAULT_INPUT_SOURCES = [
  { id: 'dtv', name: DIGITAL_TV_NAME },
  { id: 'HDMI1', name: 'HDMI 1' },
  { id: 'HDMI2', name: 'HDMI 2' },
  { id: 'HDMI3', name: 'HDMI 3' },
  { id: 'HDMI4', name: 'HDMI 4' },
  { id: 'HDMI5', name: 'HDMI 5' },
  { id: 'HDMI6', name: 'HDMI 6' },
  { id: 'USB', name: 'USB' },
  { id: 'USB-C', name: 'USB-C' },
  { id: 'Display Port', name: 'Display Port' },
];

export const DEFAULT_PICTURE_MODES = [
  { id: 'modeDynamic', name: 'Dynamic' },
  { id: 'modeStandard', name: 'Standard' },
  { id: 'modeNatural', name: 'Natural' },
  { id: 'modeMovie', name: 'Movie' },
];

export const DEFAULT_SOUND_MODES = [
  { id: 'modeStandard', name: 'Standard' },
  { id: 'modeSmart', name: 'Smart' },
  { id: 'modeAmplify', name: 'Amplify' },
];

export function groupInputSources(sources = [], currentValue = '') {
  const available = sources.map((item) => {
    if (item.id === 'dtv') {
      return { id: item.id, name: DIGITAL_TV_NAME };
    }

    return {
      id: item.id,
      name: item.name.includes('(') || item.name === item.id ? item.name : `${item.name} (${item.id})`,
    };
  });

  const availableIds = new Set(available.map((item) => item.id));
  const other = DEFAULT_INPUT_SOURCES.filter((item) => !availableIds.has(item.id));

  if (currentValue === 'digitalTv' && availableIds.has('dtv')) {
    currentValue = 'dtv';
  }

  if (currentValue && !availableIds.has(currentValue) && !other.some((item) => item.id === currentValue)) {
    other.push({ id: currentValue, name: currentValue });
  }

  return { available, other, value: currentValue };
}
