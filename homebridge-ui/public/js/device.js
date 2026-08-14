import { cleanData, getConfig, navigateTo, render, updateConfig } from './main.js';

let mainContainer = null;

const state = {
  config: {},
  params: {},
};

async function handleDeviceAdd(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = event.currentTarget;

  if (form.checkValidity() === false) {
    form.classList.add('was-validated');
    return;
  }

  const payload = Object.fromEntries(new FormData(form));

  try {
    state.config = await updateConfig({
      devices: [
        ...state.config.devices,
        cleanData({
          name: payload.name,
          ip: payload.ipAddress,
          mac: payload.macAddress?.toUpperCase(),
          device_id: payload.device_id,
        }),
      ],
    });

    homebridge.toast.success('Device added successfully');
    navigateTo('dashboard');
  } catch {
    homebridge.toast.error('Failed to add device');
  }
}

async function handleDeviceEdit(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = event.currentTarget;

  if (form.checkValidity() === false) {
    form.classList.add('was-validated');
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData);

  console.log('handleDeviceEdit', payload);

  try {
    const device = cleanData({
      name: payload.name,
      ip: payload.ipAddress,
      mac: payload.macAddress?.toUpperCase(),
      device_id: payload.device_id,
      uuid: payload.uuid,
      options: formData.getAll('options[]'),
    });

    console.log('device', device);

    const updatedDevices = state.config.devices.map((item, index) => (index === Number(state.params.deviceIndex) ? device : item));

    state.config = await updateConfig({
      devices: updatedDevices,
    });

    homebridge.toast.success('Device updated successfully');
    navigateTo('dashboard');
  } catch {
    homebridge.toast.error('Failed to update device');
  }
}

async function handleDeviceDelete() {
  try {
    state.config = await updateConfig({
      devices: state.config.devices.filter((_, index) => index !== Number(state.params.deviceIndex)),
    });

    homebridge.toast.success('Device deleted successfully');
    navigateTo('dashboard');
  } catch {
    homebridge.toast.error('Failed to delete device');
  }
}

async function initDeviceAdd() {
  mainContainer.innerHTML = await render('templates/device/add.html', state);

  const form = mainContainer.querySelector('form');
  form?.addEventListener('submit', handleDeviceAdd);
}

async function initDeviceEdit() {
  state.device = state.config.devices[state.params.deviceIndex];
  if (!state.device) return;

  console.log('initDeviceEdit', state);

  mainContainer.innerHTML = await render('templates/device/edit.html', state);
  mainContainer.querySelector('[data-device-delete]')?.addEventListener('click', () => initDeviceDelete());

  const form = mainContainer.querySelector('form');
  form?.addEventListener('submit', handleDeviceEdit);
}

async function initDeviceDelete() {
  state.device = state.config.devices[state.params.deviceIndex];
  if (!state.device) return;

  console.log('initDeviceDelete', state);

  mainContainer.innerHTML = await render('templates/device/delete.html', state);
  mainContainer.querySelector('[data-device-cancel]')?.addEventListener('click', () => initDeviceEdit());
  mainContainer.querySelector('[data-device-delete]')?.addEventListener('click', () => handleDeviceDelete());
}

export async function initDevice(container, params = {}) {
  homebridge.disableSaveButton();

  state.params = params;
  state.config = await getConfig();

  console.log('initDevice', state);

  mainContainer = container;

  if (params.deviceIndex !== undefined) {
    initDeviceEdit();
  } else {
    initDeviceAdd();
  }
}
