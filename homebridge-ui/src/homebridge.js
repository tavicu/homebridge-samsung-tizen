import { useHomebridge } from './composables/useHomebridge';

export function isConfigUiXSupported(minVersion = '5.27.0') {
  const { hb } = useHomebridge();
  const currentVersion = hb?.serverEnv?.env?.packageVersion;

  if (!currentVersion) {
    return true;
  }

  const currentParts = currentVersion.split('.').map(Number);
  const targetParts = minVersion.split('.').map(Number);

  for (let index = 0; index < 3; index++) {
    const current = currentParts[index] || 0;
    const target = targetParts[index] || 0;

    if (current > target) {
      return true;
    }
    if (current < target) {
      return false;
    }
  }

  return true;
}
