import { getAppRoot } from './helpers.js';

const cacheBust = (path) => import(`${path}?v=${Date.now()}`);

export const ROUTES = {
  dashboard: () => cacheBust('../components/dashboard/dashboard.js'),
  devices: () => cacheBust('../components/devices/devices.js'),
  smartthings: () => cacheBust('../components/smartthings/smartthings.js'),
};

export async function navigateTo(page, params = {}) {
  const root = getAppRoot();
  if (!root) return;

  const loadRoute = ROUTES[page];

  if (!loadRoute) {
    root.innerHTML = `<div class="alert alert-danger">Page "${page}" not found.</div>`;
    return;
  }

  homebridge.showSpinner();

  try {
    homebridge.enableSaveButton();

    const module = await loadRoute();

    if (typeof module.renderPage === 'function') {
      await module.renderPage({ root, params });
    }
  } catch (error) {
    root.innerHTML = `<div class="alert alert-danger">There was an error navigating to ${page}: ${error.message}</div>`;
  } finally {
    homebridge.hideSpinner();
  }
}

export function setupGlobalNavigation() {
  const root = getAppRoot();
  if (!root) return;

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page]');

    if (target) {
      event.preventDefault();

      const { page, ...params } = target.dataset;
      navigateTo(page, params);
    }
  });
}
