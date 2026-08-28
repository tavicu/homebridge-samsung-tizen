import { computed, ref } from 'vue';

const smartthings = ref(null);
const isLoading = ref(false);

export function useSmartThings() {
  async function fetchSmartThings() {
    isLoading.value = true;

    try {
      smartthings.value = await window.homebridge.request('/smartthings/get-token');
    } catch (err) {
      smartthings.value = null;
    } finally {
      isLoading.value = false;
    }
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
    fetchSmartThings,
  };
}
