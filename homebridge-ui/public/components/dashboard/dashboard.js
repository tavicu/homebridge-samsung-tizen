import { getConfig, render } from '../../main.js';

export async function renderPage({ root, params }) {
  homebridge.enableSaveButton();

  const state = {
    config: await getConfig(),
    smartthings: await homebridge.request('/smartthings/get-token'),
    now: Date.now(),
  };

  root.innerHTML = await render('components/dashboard/dashboard.html', state);

  console.log('Rendering dashboard page', root, params, state);
  console.log('--------------------------------');
}
