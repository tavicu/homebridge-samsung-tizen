import { ref } from 'vue';

const currentView = ref('dashboard');
const currentParams = ref({});

function toNumericParam(value) {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

export function useRouter() {
  function navigateTo(view, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, toNumericParam(value)]),
    );

    currentView.value = view;
    currentParams.value = cleanParams;
  }

  return {
    currentView,
    currentParams,
    navigateTo,
  };
}
