import { reactive, ref } from 'vue';
import { useConfig } from '../../composables/useConfig';

export function useSmartThingsWizard() {
  const currentStep = ref(1);
  const { config, updateConfig } = useConfig();
  const state = reactive({
    config: null,
    credentials: {
      clientId: '',
      clientSecret: '',
    },
    authUrl: null,
    status: null,
    error: null,
  });

  async function initWizard() {
    try {
      state.config = config.value;
      state.credentials = {
        clientId: config.value?.clientId || '',
        clientSecret: config.value?.clientSecret || '',
      };
    } catch (error) {
      console.error('Error initializing wizard:', error);
      window.homebridge.toast.error('Failed to initialize wizard');
    }
  }

  async function submitStep1(payload) {
    try {
      state.credentials = {
        clientId: payload.clientId,
        clientSecret: payload.clientSecret,
      };

      const credentials = { clientId: payload.clientId, clientSecret: payload.clientSecret };
      const authUrl = await window.homebridge.request('/smartthings/auth-url', credentials);
      state.authUrl = authUrl;

      await updateConfig({
        clientId: payload.clientId,
        clientSecret: payload.clientSecret,
      });

      currentStep.value = 2;
    } catch (error) {
      console.error('Error in step 1:', error);
      window.homebridge.toast.error('An error occurred while processing your request. Please try again.');
    }
  }

  async function submitStep2(payload) {
    window.homebridge.showSpinner();

    const authorizationCode = payload.authorizationCode.replace(/^["']|["']$/g, '').trim();

    try {
      const requestPayload = {
        clientId: state.credentials.clientId,
        clientSecret: state.credentials.clientSecret,
        authorizationCode,
      };

      const authToken = await window.homebridge.request('/smartthings/auth-token', requestPayload);

      console.log('authToken', authToken);

      if (authToken.error) {
        throw new Error(authToken.error_description || authToken.error);
      }

      await window.homebridge.request('/smartthings/save-token', authToken);

      state.status = 'success';
    } catch (error) {
      console.error('Error in step 2:', error);
      state.status = 'error';
      state.error = error.message;
    } finally {
      window.homebridge.hideSpinner();
      currentStep.value = 3;
    }
  }

  function goBackStep() {
    if (currentStep.value > 1) {
      currentStep.value -= 1;
    }
  }

  function retryStep2() {
    state.status = null;
    state.error = null;
    currentStep.value = 2;
  }

  return {
    currentStep,
    state,
    initWizard,
    submitStep1,
    submitStep2,
    goBackStep,
    retryStep2,
  };
}
