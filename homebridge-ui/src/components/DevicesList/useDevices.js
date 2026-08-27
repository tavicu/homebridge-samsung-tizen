import { computed } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';

export function useDevices() {
  const { config } = useConfig();
  const { navigateTo } = useRouter();
  const devices = computed(() => config.value?.devices || []);

  function editDevice(index) {
    if (index === -1) {
      navigateTo('device');
    } else {
      navigateTo('device', { action: 'edit', deviceIndex: String(index) });
    }
  }

  return { devices, editDevice };
}
