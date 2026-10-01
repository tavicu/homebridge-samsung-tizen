import { computed, ref, toValue, watch } from 'vue';
import { useConfig } from './useConfig';
import { useDevice } from './useDevice';

// Global inputs and switches apply to every TV, so without a device they get the apps of all of them.
export function useApps(deviceIndex) {
  const { config } = useConfig();
  const { getApps } = useDevice();
  const apps = ref([]);

  const devices = computed(() => {
    const index = toValue(deviceIndex);
    return index === undefined ? config.value.devices || [] : [config.value.devices?.[index]];
  });

  watch(
    devices,
    async (list) => {
      apps.value = await getApps(list);
    },
    { immediate: true },
  );

  return apps;
}
