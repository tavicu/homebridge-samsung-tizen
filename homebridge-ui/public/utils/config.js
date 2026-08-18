export function cleanData(data) {
  if (data === null || data === undefined) {
    return undefined;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed !== '' ? trimmed : undefined;
  }

  if (Array.isArray(data)) {
    const cleanedArray = data.map((item) => cleanData(item)).filter((item) => item !== undefined);
    return cleanedArray.length > 0 ? cleanedArray : undefined;
  }

  if (typeof data === 'object') {
    const cleanedEntries = Object.entries(data)
      .map(([key, value]) => [key, cleanData(value)])
      .filter(([_, value]) => value !== undefined);

    return Object.fromEntries(cleanedEntries);
  }

  return data;
}

export async function getConfig() {
  const pluginConfig = await homebridge.getPluginConfig();
  return pluginConfig[0] || {};
}

export async function updateConfig(partialConfig, save = true) {
  try {
    const currentConfig = await getConfig();

    const updatedConfig = {
      ...currentConfig,
      ...partialConfig,
    };

    await homebridge.updatePluginConfig([updatedConfig]);

    if (save) {
      await homebridge.savePluginConfig();
    }

    return updatedConfig;
  } catch (error) {
    console.error('An error occurred while updating the config:', error);
    homebridge.toast.error('An error occurred while updating the config.');
  }
}
