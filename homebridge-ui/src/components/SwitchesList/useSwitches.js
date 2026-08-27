import { computed } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';

const SWITCH_KEYS = ['power', 'sleep', 'mute', 'volume', 'app', 'input', 'channel', 'picture_mode', 'command'];

export function useSwitches() {
  const { config } = useConfig();
  const { navigateTo } = useRouter();
  const switches = computed(() => config.value?.switches || []);

  function editSwitch(index) {
    if (index === -1) {
      navigateTo('switch');
    } else {
      navigateTo('switch', { action: 'edit', switchIndex: String(index) });
    }
  }

  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  }

  function getSwitchValues(switchItem) {
    return SWITCH_KEYS.reduce((acc, key) => {
      if (key in switchItem) {
        acc[key] = switchItem[key];
      }
      return acc;
    }, {});
  }

  return { switches, editSwitch, formatValue, getSwitchValues, SWITCH_KEYS };
}
