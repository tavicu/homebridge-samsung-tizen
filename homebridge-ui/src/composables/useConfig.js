import { ref } from 'vue';
import { useHomebridge } from './useHomebridge';
import { useToast } from './useToast';

const config = ref({ platform: 'SamsungTizen' });

export function useConfig() {
  const { hb } = useHomebridge();
  const toast = useToast();

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
  }

  async function updateConfig(partialConfig, save = true) {
    try {
      const updatedConfig = JSON.parse(
        JSON.stringify({
          ...config.value,
          ...partialConfig,
        }),
      );

      await hb.updatePluginConfig([updatedConfig]);

      if (save) {
        await hb.savePluginConfig();
      }

      config.value = updatedConfig;
      return updatedConfig;
    } catch (error) {
      toast.error('An error occurred while updating the config.');
      throw error;
    }
  }

  return {
    config,
    getConfig,
    saveConfig,
    cleanConfig,
    updateConfig,
  };
}
