import { ref } from 'vue';

const currentView = ref('dashboard');
const currentParams = ref({});

export function useRouter() {
  function navigateTo(view, params = {}) {
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== undefined && value !== null));

    currentView.value = view;
    currentParams.value = cleanParams;
  }

  return {
    currentView,
    currentParams,
    navigateTo,
  };
}
