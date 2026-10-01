const DOCS_URL = 'https://tavicu.github.io/homebridge-samsung-tizen';

const DOCS = {
  home: '',
  network: 'installation/index.html#network',
  addDevice: 'installation/setting-the-device.html#add-a-tv',
  addToHome: 'installation/adding-to-home-app.html',
  uuid: 'configuration/device-settings.html#uuid',
  options: 'configuration/device-settings.html#options',
  frame: 'configuration/frame-tvs.html',
  artModeInput: 'configuration/frame-tvs.html#art-mode-input',
  inputs: 'features/inputs.html',
  switches: 'features/switches.html',
  keys: 'features/keys.html',
  applications: 'extra/applications.html',
  commands: 'extra/commands.html',
  smartthings: 'smartthings/',
  smartthingsCreateApp: 'smartthings/#create-the-smartthings-app',
  smartthingsAuthorization: 'smartthings/#_2-authorization',
  smartthingsAuthFailed: 'smartthings/#the-wizard-says-authorization-failed',
  smartthingsStatus: 'smartthings/#connection-status',
  smartthingsPickTv: 'smartthings/#pick-the-tv',
  smartthingsFeatures: 'smartthings/features.html',
  smartthingsInputSource: 'smartthings/features.html#input-source',
  tvNotSupported: 'troubleshooting/common-issues.html#tv-is-not-supported',
};

export function docsUrl(path = '') {
  return `${DOCS_URL}/${Object.hasOwn(DOCS, path) ? DOCS[path] : path}`;
}
