import { getConfig, render, updateConfig } from './main.js';

let mainContainer = null;

const state = {
  config: {},
  smartthings: null,
  now: Date.now(),
};

export async function initDashboard(container, params = {}) {
  mainContainer = container;

  state.config = await getConfig();
  state.smartthings = await homebridge.request('/smartthings/get-token');

  console.log('dashboard state', state);

  container.innerHTML = await render('templates/dashboard.html', state);
}
