import { createApp } from 'vue';
import App from './App.vue';
import { useConfig } from './composables/useConfig';
import { isConfigUiXSupported } from './homebridge';
import './assets/main.css';

async function startApp() {
  const root = document.querySelector('#app-tizen');
  if (!root) {
    return;
  }

  if (!isConfigUiXSupported()) {
    window.homebridge?.showSchemaForm();
    return;
  }

  try {
    const { getConfig } = useConfig();
    await getConfig();

    createApp(App).mount(root);
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">There was an error initializing the app: ${err.message}</div>`;
  }
}

startApp();
