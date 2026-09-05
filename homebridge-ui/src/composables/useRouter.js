import { ref } from 'vue';

const currentView = ref('dashboard');
const currentParams = ref({});
const previousRoute = ref(null);

function toNumericParam(value) {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

function cleanRouteParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, toNumericParam(value)]),
  );
}

function applyRoute(view, params = {}) {
  currentView.value = view;
  currentParams.value = cleanRouteParams(params);
}

export function useRouter() {
  function navigateTo(view, params = {}) {
    previousRoute.value = {
      view: currentView.value,
      params: { ...currentParams.value },
    };

    applyRoute(view, params);
  }

  function navigateBack(fallbackView = 'dashboard', fallbackParams = {}) {
    if (previousRoute.value) {
      const { view, params } = previousRoute.value;
      previousRoute.value = null;
      applyRoute(view, params);
      return;
    }

    applyRoute(fallbackView, fallbackParams);
  }

  return {
    currentView,
    currentParams,
    navigateTo,
    navigateBack,
  };
}
