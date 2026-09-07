import { computed, ref } from 'vue';
import { useHomebridge } from './useHomebridge';

const INPUT_SOURCES = [
  { value: 'digitalTv', label: 'Digital TV' },
  { value: 'HDMI1', label: 'HDMI 1' },
  { value: 'HDMI2', label: 'HDMI 2' },
  { value: 'HDMI3', label: 'HDMI 3' },
  { value: 'HDMI4', label: 'HDMI 4' },
  { value: 'HDMI5', label: 'HDMI 5' },
  { value: 'HDMI6', label: 'HDMI 6' },
  { value: 'USB', label: 'USB' },
  { value: 'USB-C', label: 'USB-C' },
  { value: 'Display Port', label: 'Display Port' },
];

const PICTURE_MODES = ['Dynamic', 'Standard', 'Natural', 'Movie'];

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
    return serverRequest('/smartthings/save-token', token);
  }

  async function disconnect() {
    await serverRequest('/smartthings/disconnect');
    smartthings.value = null;
  }

  async function getDevices() {
    return serverRequest('/smartthings/get-devices');
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
    inputSources: INPUT_SOURCES,
    pictureModes: PICTURE_MODES,
    getAuthUrl,
    getAuthToken,
    getToken,
    saveToken,
    disconnect,
    getDevices,
  };
}
