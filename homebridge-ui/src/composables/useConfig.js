import { ref } from 'vue';
import { useHomebridge } from './useHomebridge';

const config = ref({ platform: 'SamsungTizen' });
const restartRequired = ref(false);

export function useConfig() {
  const { hb } = useHomebridge();

  function markRestartRequired() {
    restartRequired.value = true;
  }

  function cleanConfig(data) {
    if (data === null || data === undefined) {
      return undefined;
    }

    if (typeof data === 'string') {
      const trimmed = data.trim();
      return trimmed !== '' ? trimmed : undefined;
    }

    if (Array.isArray(data)) {
      const cleanedArray = data.map((item) => cleanConfig(item)).filter((item) => item !== undefined);
      return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    if (typeof data === 'object') {
      const cleanedEntries = Object.entries(data)
        .map(([key, value]) => [key, cleanConfig(value)])
        .filter(([_, value]) => value !== undefined);

      return Object.fromEntries(cleanedEntries);
    }

    return data;
  }

  async function getConfig() {
    const pluginConfig = await hb.getPluginConfig();

    if (pluginConfig?.length && pluginConfig[0]) {
      config.value = {
        platform: 'SamsungTizen',
        ...pluginConfig[0],
      };
    }

    return config.value;
  }

  async function saveConfig() {
    await hb.savePluginConfig();
    markRestartRequired();
  }

  // Errors are left to the caller, which shows its own message.
  async function updateConfig(partialConfig, save = true) {
    const updatedConfig = JSON.parse(
      JSON.stringify({
        ...config.value,
        ...partialConfig,
      }),
    );

    await hb.updatePluginConfig([updatedConfig]);

    // Homebridge already holds the new config at this point, even if saving it to disk fails below.
    config.value = updatedConfig;

    if (save) {
      await saveConfig();
    }

    return updatedConfig;
  }

  // Saves a setting that exists both globally and per device (inputs, switches, keys): on the device when one is given, globally otherwise.
  async function updateScoped(key, deviceIndex, value) {
    if (deviceIndex === undefined) {
      return updateConfig({ [key]: value });
    }

    const devices = (config.value.devices || []).map((device, index) => (index === deviceIndex ? { ...device, [key]: value } : device));

    return updateConfig({ devices });
  }

  return {
    config,
    restartRequired,
    markRestartRequired,
    getConfig,
    saveConfig,
    cleanConfig,
    updateConfig,
    updateScoped,
  };
}
