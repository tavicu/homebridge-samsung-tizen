import { cleanData, getConfig, navigateTo, render, updateConfig } from '../../main.js';

let state;
let container;

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
    const newDevice = cleanData({
      name: payload.name,
      ip: payload.ipAddress,
      mac: payload.macAddress?.toUpperCase(),
      deviceId: payload.deviceId,
    });

    const currentDevices = state.config.devices || [];

    state.config = await updateConfig({
      devices: [...currentDevices, newDevice],
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
    const deviceData = cleanData({
      name: payload.name,
      ip: payload.ipAddress,
      mac: payload.macAddress?.toUpperCase(),
      deviceId: payload.deviceId,
      uuid: payload.uuid,
      options: formData.getAll('options[]'),
    });

    console.log('deviceData', deviceData);

    const updatedDevices = state.config.devices.map((item, index) => (index === state.deviceIndex ? deviceData : item));

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
      devices: state.config.devices.filter((_, index) => index !== state.deviceIndex),
    });

    homebridge.toast.success('Device deleted successfully');
    navigateTo('dashboard');
  } catch {
    homebridge.toast.error('Failed to delete device');
  }
}

async function initDeviceAdd() {
  container.innerHTML = await render('components/devices/templates/add.tmpl', state);

  const form = container.querySelector('form');
  form?.addEventListener('submit', handleDeviceAdd);
}

async function initDeviceEdit() {
  state.device = state.config.devices?.[state.deviceIndex];

  if (!state.device) return;

  container.innerHTML = await render('components/devices/templates/edit.tmpl', state);
  container.querySelector('[data-device-delete]')?.addEventListener('click', () => initDeviceDelete());

  const form = container.querySelector('form');
  form?.addEventListener('submit', handleDeviceEdit);
}

async function initDeviceDelete() {
  state.device = state.config.devices?.[state.deviceIndex];

  if (!state.device) return;

  container.innerHTML = await render('components/devices/templates/delete.tmpl', state);
  container.querySelector('[data-device-cancel]')?.addEventListener('click', () => initDeviceEdit());
  container.querySelector('[data-device-confirm]')?.addEventListener('click', () => handleDeviceDelete());
}

export async function renderPage({ root, params }) {
  homebridge.disableSaveButton();

  state = {
    config: await getConfig(),
    params: params,
    device: null,
    deviceIndex: !isNaN(params.deviceIndex) ? Number(params.deviceIndex) : undefined,
  };

  container = root;

  console.log('Rendering device page', root, params, state);

  if (params.action === 'edit' || state.deviceIndex !== undefined) {
    await initDeviceEdit();
  } else if (params.action === 'delete') {
    await initDeviceDelete();
  } else {
    await initDeviceAdd();
  }
}
