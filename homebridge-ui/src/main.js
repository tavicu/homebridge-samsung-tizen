import { createApp } from 'vue';
import App from './App.vue';
import { useConfig } from './composables/useConfig';
import { useHomebridge } from './composables/useHomebridge';
import { isConfigUiXSupported } from './lib/homebridge';
import { setupI18n } from './lib/i18n';
import './assets/main.css';

async function startApp() {
  const root = document.querySelector('#app-tizen');
  if (!root) {
    return;
  }

  const { moveModalPadding, showSchemaForm } = useHomebridge();

  if (!isConfigUiXSupported()) {
    showSchemaForm();
    return;
  }

  try {
    const app = createApp(App);

    const { getConfig } = useConfig();

    await Promise.all([getConfig(), setupI18n(app)]);

    moveModalPadding(root);
    app.mount(root);
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">There was an error initializing the app: ${err.message}</div>`;
  }
}

startApp();
