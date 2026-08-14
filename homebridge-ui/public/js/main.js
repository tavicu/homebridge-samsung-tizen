const nunEnv = new nunjucks.Environment(new nunjucks.WebLoader(''));

nunEnv.addFilter('formatDate', function (value) {
  if (!value) return '';

  const dateObj = new Date(value);

  if (isNaN(dateObj.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
});

function isVersionLower(current, target) {
  if (!current) return true;
  const c = current.split('.').map(Number);
  const t = target.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (t[i] || 0)) return true;
    if ((c[i] || 0) > (t[i] || 0)) return false;
  }
  return false;
}

function isConfigUiXSupported(minVersion = '5.27.0') {
  const currentVersion = homebridge.serverEnv?.env?.packageVersion;
  return !isVersionLower(currentVersion, minVersion);
}

function hideNativeFooter() {
  try {
    const modalFooter = window.parent.document.querySelector('.modal-footer');
    if (modalFooter) {
      modalFooter.style.display = 'none';
    }
  } catch {}
}

export function getAppRoot() {
  return document.querySelector('div[ht-ui-root]');
}

export async function render(templatePath, data) {
  return new Promise((resolve, reject) => {
    nunEnv.render(templatePath, data, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

export function cleanData(data) {
  if (data === null || data === undefined) {
    return undefined;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed !== '' ? trimmed : undefined;
  }

  if (Array.isArray(data)) {
    const cleanedArray = data.map((item) => cleanData(item)).filter((item) => item !== undefined);
    return cleanedArray.length > 0 ? cleanedArray : undefined;
  }

  if (typeof data === 'object') {
    const cleanedEntries = Object.entries(data)
      .map(([key, value]) => [key, cleanData(value)])
      .filter(([_, value]) => value !== undefined);

    return Object.fromEntries(cleanedEntries);
  }

  return data;
}

export async function getConfig() {
  const pluginConfig = await homebridge.getPluginConfig();
  return pluginConfig[0] || {};
}

export async function updateConfig(partialConfig) {
  try {
    const currentConfig = await getConfig();

    const updatedConfig = {
      ...currentConfig,
      ...partialConfig,
    };

    await homebridge.updatePluginConfig([updatedConfig]);
    await homebridge.savePluginConfig();

    return updatedConfig;
  } catch (error) {
    console.error('An error occurred while updating the config:', error);
    homebridge.toast.error('An error occurred while updating the config.');
  }
}

export async function navigateTo(page, params = {}) {
  const root = getAppRoot();
  if (!root) return;

  homebridge.showSpinner();

  try {
    homebridge.enableSaveButton();

    switch (page) {
      case 'dashboard':
        const { initDashboard } = await import(`./dashboard.js?v=${Date.now()}`);
        await initDashboard(root, params);
        break;

      case 'device':
        const { initDevice } = await import(`./device.js?v=${Date.now()}`);
        await initDevice(root, params);
        break;

      case 'smartthings':
        const { initSmartthings } = await import(`./smartthings.js?v=${Date.now()}`);
        await initSmartthings(root, params);
        break;

      default:
        root.innerHTML = '<div class="alert alert-danger">Page not found.</div>';
    }
  } catch (error) {
    root.innerHTML = `<div class="alert alert-danger">There was an error navigating to ${page}: ${error.message}</div>`;
  } finally {
    homebridge.hideSpinner();
  }
}

function setupGlobalNavigation() {
  const root = getAppRoot();
  if (!root) return;

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page]');

    if (target) {
      event.preventDefault();

      const page = target.dataset.page;

      const params = { ...target.dataset };
      delete params.page;

      navigateTo(page, params);
    }
  });
}

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

    if (pluginConfig.length === 0) {
      pluginConfig[0] = {
        platform: 'SamsungTizen',
      };

      await homebridge.updatePluginConfig(pluginConfig);
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

// (async () => {
//   try {
//     const htmlOutput = await render('templates/dashboard.html', {
//       test: 'Hello World',
//     });

//     appRoot.innerHTML = htmlOutput;
//   } catch (error) {
//     console.error('Error rendering template:', error);
//   }

//   try {
//     const response = await homebridge.request('get-stored-data');

//     console.log('🔄 Datele obținute:', response);
//   } catch (error) {
//     console.error('Error getting stored data:', error);
//   }
// })();

// async function updateUi() {
//   try {
//     const homebridge = window.homebridge;
//     const pluginConfig = await homebridge.getPluginConfig();

//     if (pluginConfig.length === 0) {
//       pluginConfig[0] = {
//         platform: 'SamsungTizen',
//       };

//       await homebridge.updatePluginConfig(pluginConfig);
//     }
//   } catch (err) {
//     console.error('updateUi error:', err);
//   }
// }

// updateUi();

// window.homebridge.addEventListener('configChanged', (event) => {
//   console.log('🔄 Configurația a fost actualizată:', event);
//   updateUi();
// });

// (async () => {
//   console.log('🚀 [Homebridge UI] Scriptul main.js a fost încărcat cu succes!');

//   // 1. Verificăm dacă obiectul global injectat de Homebridge există
//   if (typeof window.homebridge !== 'undefined') {
//     console.log("✅ Obiectul global 'homebridge' este disponibil!");

//     // Afișăm în consolă toate metodele pe care le oferă acest obiect (getPluginConfig, request, toast, etc.)
//     console.dir(window.homebridge);

//     try {
//       // 2. Preluăm configurarea curentă direct din sistemul Homebridge
//       const pluginConfig = await window.homebridge.getPluginConfig();
//       console.log('📦 Configurația actuală a plugin-ului (din config.json):', pluginConfig);
//     } catch (error) {
//       console.error('❌ Eroare la citirea datelor din Homebridge:', error);
//     }
//   } else {
//     console.warn("⚠️ Atentat de rulare în afara Homebridge (sau obiectul 'homebridge' nu a fost injectat încă).");
//   }
// })();
