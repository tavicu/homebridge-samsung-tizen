import { getConfig, render, updateConfig } from './main.js';

let mainContainer = null;

const state = {
  config: {},
  currentStep: 1,
  credentials: {},
  authUrl: null,
};

const steps = {
  1: {
    onSubmit: async (formData) => {
      state.credentials = {
        clientId: formData.client_id,
        clientSecret: formData.client_secret,
      };

      const authUrl = await homebridge.request('/smartthings/auth-url', state.credentials);
      state.authUrl = authUrl;

      state.config = await updateConfig({
        client_id: formData.client_id,
        client_secret: formData.client_secret,
      });

      goToStep(2);
    },
  },
  2: {
    onLoad: () => {
      mainContainer.querySelector('[data-step-back]').addEventListener('click', () => goToStep(1));
    },
    onSubmit: async (formData) => {
      homebridge.showSpinner();

      const authorizationCode = formData.authorizationCode.replace(/^["']|["']$/g, '').trim();

      try {
        const authToken = await homebridge.request('/smartthings/auth-token', { ...state.credentials, authorizationCode });

        console.log('authToken', authToken);

        if (authToken.error) {
          throw new Error(authToken.error_description || authToken.error);
        }

        await homebridge.request('/smartthings/save-token', authToken);

        state.status = 'success';
      } catch (error) {
        state.status = 'error';
        state.error = error.message;
      } finally {
        homebridge.hideSpinner();

        goToStep(3);
      }
    },
  },
  3: {
    onLoad: () => {
      mainContainer.querySelector('[data-step-retry]')?.addEventListener('click', () => goToStep(2));

      if (state.status === 'success') {
        homebridge.enableSaveButton();
      }
    },
  },
};

async function goToStep(stepNumber) {
  const stepConfig = steps[stepNumber];
  if (!stepConfig) return;

  homebridge.showSpinner();

  state.currentStep = stepNumber;

  try {
    mainContainer.innerHTML = await render(`templates/smartthings.html`, state);

    initStep(stepNumber);
  } catch (error) {
    homebridge.toast.error('An error occurred while rendering the page.');
  } finally {
    homebridge.hideSpinner();
  }
}

async function initStep(stepNumber) {
  const stepConfig = steps[stepNumber];
  if (!stepConfig) return;

  const form = mainContainer.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (form.checkValidity() === false) {
        form.classList.add('was-validated');
        return;
      }

      const formData = Object.fromEntries(new FormData(form));

      if (stepConfig.onSubmit) {
        await stepConfig.onSubmit(formData);
      }
    });
  }

  if (stepConfig.onLoad) {
    await stepConfig.onLoad();
  }
}

export async function initSmartthings(container, params = {}) {
  homebridge.disableSaveButton();

  state.config = await getConfig();

  mainContainer = container;
  mainContainer.innerHTML = await render('templates/smartthings.html', state);

  initStep(state.currentStep);
}
