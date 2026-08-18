import { cleanData, getConfig, updateConfig } from './utils/config.js';
import { getAppRoot, isConfigUiXSupported } from './utils/helpers.js';
import { render } from './utils/nunjucks.js';
import { navigateTo, setupGlobalNavigation } from './utils/router.js';

export { render, cleanData, getConfig, updateConfig, getAppRoot, navigateTo };

async function startApp() {
  const root = getAppRoot();
  if (!root) return;

  console.log('homebridge', homebridge);

  if (!isConfigUiXSupported()) {
    root.innerHTML = '';
    homebridge.showSchemaForm();
    return;
  }

  console.log('document', document);

  // hideNativeFooter();

  try {
    const pluginConfig = await getConfig();

    if (!pluginConfig.platform) {
      await updateConfig({ platform: 'SamsungTizen' }, false);
    }

    setupGlobalNavigation();

    await navigateTo('dashboard');
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">There was an error initializing the app: ${err.message}</div>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
