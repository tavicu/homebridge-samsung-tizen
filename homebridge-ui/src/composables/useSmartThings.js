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

  const isExpired = computed(() => {
    if (!smartthings.value?.expiresAt) {
      return true;
    }

    return smartthings.value.expiresAt <= Date.now();
  });

  return {
    smartthings,
    isLoading,
    isExpired,
    getAuthUrl,
    getAuthToken,
    getToken,
    saveToken,
  };
}
