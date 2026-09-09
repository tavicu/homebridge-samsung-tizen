import { computed, ref } from 'vue';
import { useCache } from './useCache';
import { useHomebridge } from './useHomebridge';

const deviceCache = useCache();

const smartthings = ref(null);
const isLoading = ref(false);

export function useSmartThings() {
  const { serverRequest } = useHomebridge();

  async function getAuthUrl(credentials) {
    return serverRequest('/smartthings/auth-url', credentials);
  }

  async function getAuthToken(payload) {
    return serverRequest('/smartthings/auth-token', payload);
  }

  async function getToken() {
    isLoading.value = true;

    try {
      smartthings.value = await serverRequest('/smartthings/get-token');
    } catch (err) {
      smartthings.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveToken(token) {
    deviceCache.clear();
    return serverRequest('/smartthings/save-token', token);
  }

  async function disconnect() {
    await serverRequest('/smartthings/disconnect');
    smartthings.value = null;
    deviceCache.clear();
  }

  async function getDevices() {
    return deviceCache.get('st:devices', () => serverRequest('/smartthings/get-devices'));
  }

  async function getDeviceStatus(deviceId) {
    if (!deviceId) {
      return {};
    }

    return deviceCache.get(`st:${deviceId}`, () => serverRequest('/smartthings/get-device-status', { deviceId }));
  }

  async function getInputSources(deviceId) {
    const deviceStatus = await getDeviceStatus(deviceId);
    return Array.isArray(deviceStatus?.supportedInputSourcesMap) ? deviceStatus.supportedInputSourcesMap : [];
  }

  async function getPictureModes(deviceId) {
    const deviceStatus = await getDeviceStatus(deviceId);
    return Array.isArray(deviceStatus?.supportedPictureModesMap) ? deviceStatus.supportedPictureModesMap : [];
  }

  const status = computed(() => {
    if (!smartthings.value) {
      return 'disconnected';
    }

    if (!smartthings.value.expiresAt || smartthings.value.expiresAt <= Date.now()) {
      return 'expired';
    }

    return 'connected';
  });

  return {
    smartthings,
    isLoading,
    status,
    getAuthUrl,
    getAuthToken,
    getToken,
    saveToken,
    disconnect,
    getDevices,
    getDeviceStatus,
    getInputSources,
    getPictureModes,
  };
}
