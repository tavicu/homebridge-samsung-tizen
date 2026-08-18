import { cleanData, getConfig, navigateTo, render, updateConfig } from '../../main.js';

let state;
let container;

export async function renderPage({ root, params }) {
  homebridge.disableSaveButton();

  console.log('Rendering inputs page', root, params, state);
}
