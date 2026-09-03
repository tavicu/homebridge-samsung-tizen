import { computed, ref } from 'vue';
import { useHomebridge } from './useHomebridge';

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
    getAuthUrl,
    getAuthToken,
    getToken,
    saveToken,
    disconnect,
    getDevices,
  };
}
