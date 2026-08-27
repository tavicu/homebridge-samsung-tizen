import { ref } from 'vue';

const currentPage = ref('dashboard');
const currentParams = ref({});

export function useRouter() {
  function navigateTo(page, params = {}) {
    currentPage.value = page;
    currentParams.value = params;
  }

  return {
    currentPage,
    currentParams,
    navigateTo,
  };
}
