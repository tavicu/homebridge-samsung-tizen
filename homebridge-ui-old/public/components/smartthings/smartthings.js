import { getConfig, render, updateConfig } from '../../main.js';

let state;
let container;

const steps = {
  1: {
    onSubmit: async (payload) => {
      try {
        state.credentials = {
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
        };

        const authUrl = await homebridge.request('/smartthings/auth-url', state.credentials);
        state.authUrl = authUrl;

        state.config = await updateConfig({
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
        });

        await goToStep(2);
      } catch (error) {
        homebridge.toast.error('An error occurred while processing your request. Please try again.');
      }
    },
  },
  2: {
    onLoad: () => {
      container.querySelector('[data-step-back]').addEventListener('click', () => goToStep(1));
    },
    onSubmit: async (payload) => {
      homebridge.showSpinner();

      const authorizationCode = payload.authorizationCode.replace(/^["']|["']$/g, '').trim();

      try {
        const authToken = await homebridge.request('/smartthings/auth-token', {
          ...state.credentials,
          authorizationCode,
        });

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

        await goToStep(3);
      }
    },
  },
  3: {
    onLoad: () => {
      container.querySelector('[data-step-retry]')?.addEventListener('click', () => goToStep(2));

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
    container.innerHTML = await render(`components/smartthings/smartthings.tmpl`, state);

    await initStep(stepNumber);
  } catch (error) {
    homebridge.toast.error('An error occurred while rendering the page.');
  } finally {
    homebridge.hideSpinner();
  }
}

async function initStep(stepNumber) {
  const stepConfig = steps[stepNumber];
  if (!stepConfig) return;

  const form = container.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (form.checkValidity() === false) {
        form.classList.add('was-validated');
        return;
      }

      const payload = Object.fromEntries(new FormData(form));

      if (stepConfig.onSubmit) {
        await stepConfig.onSubmit(payload);
      }
    });
  }

  if (stepConfig.onLoad) {
    await stepConfig.onLoad();
  }
}

export async function renderPage({ root, params }) {
  homebridge.disableSaveButton();

  const config = await getConfig();

  state = {
    config,
    currentStep: Number(params.step) || 1,
    credentials: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
    authUrl: null,
  };

  container = root;

  console.log('Rendering smartthings page', root, params, state);

  await goToStep(state.currentStep);
}
