import { computed, ref } from 'vue';
import { useHomebridge } from './useHomebridge';

const smartthings = ref(null);
const isLoading = ref(false);

export function useSmartThings() {
  const { serverRequest } = useHomebridge();

  async function fetchSmartThings() {
    isLoading.value = true;

    try {
      smartthings.value = await serverRequest('/smartthings/get-token');
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
