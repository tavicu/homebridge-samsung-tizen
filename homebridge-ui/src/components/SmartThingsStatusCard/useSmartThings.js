import { ref, computed, onMounted } from 'vue';
import { useRouter } from '../../composables/useRouter';

export function useSmartThings() {
  const smartthings = ref(null);
  const now = ref(Date.now());
  const { navigateTo } = useRouter();

  const isConnected = computed(() => {
    return smartthings.value && smartthings.value.expiresAt > now.value;
  });

  onMounted(async () => {
    try {
      smartthings.value = await window.homebridge.request('/smartthings/get-token');
    } catch (error) {
      console.error('Error fetching SmartThings token:', error);
    }
  });

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function goToSmartThings() {
    navigateTo('smartthings');
  }

  return { smartthings, isConnected, formatDate, goToSmartThings };
}
