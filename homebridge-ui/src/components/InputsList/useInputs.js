import { computed } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';

export function useInputs() {
  const { config } = useConfig();
  const { navigateTo } = useRouter();
  const inputs = computed(() => config.value?.inputs || []);

  function editInput(index) {
    if (index === -1) {
      navigateTo('input');
    } else {
      navigateTo('input', { action: 'edit', inputIndex: String(index) });
    }
  }

  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  }

  return { inputs, editInput, formatValue };
}
