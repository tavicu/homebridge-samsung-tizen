import { cleanData, getConfig, navigateTo, render, updateConfig } from '../../main.js';

let state;
let container;

async function handleInputAdd(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = event.currentTarget;

  if (form.checkValidity() === false) {
    form.classList.add('was-validated');
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData);

  console.log('handleInputAdd', payload);

  try {
    const inputData = cleanData({
      name: payload.name,
      type: payload.type,
      value: payload.type === 'command' ? formData.getAll('command[]') : payload.value,
    });

    console.log('inputData', inputData);

    if (state.deviceIndex !== undefined) {
      const updatedDevices = (state.config.devices || []).map((item, index) => {
        if (index !== state.deviceIndex) {
          return item;
        }

        return {
          ...item,
          inputs: [...(item.inputs || []), inputData],
        };
      });

      console.log('updatedDevices', updatedDevices);

      state.config = await updateConfig({
        devices: updatedDevices,
      });

      navigateTo('devices', { deviceIndex: state.deviceIndex });
    } else {
      const currentInputs = state.config.inputs || [];

      state.config = await updateConfig({
        inputs: [...currentInputs, inputData],
      });

      navigateTo('dashboard');
    }

    homebridge.toast.success('Input added successfully');
  } catch {
    homebridge.toast.error('Failed to add input');
  }
}

async function handleInputEdit(event) {
  event.preventDefault();
  event.stopPropagation();

  const form = event.currentTarget;

  if (form.checkValidity() === false) {
    form.classList.add('was-validated');
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData);

  console.log('handleInputEdit', payload);

  try {
    const inputData = cleanData({
      name: payload.name,
      type: payload.type,
      value: payload.type === 'command' ? formData.getAll('command[]') : payload.value,
    });

    console.log('inputData', inputData);

    if (state.deviceIndex !== undefined) {
      const updatedDevices = (state.config.devices || []).map((item, index) => {
        if (index !== state.deviceIndex) {
          return item;
        }

        return {
          ...item,
          inputs: item.inputs.map((input, index) => (index === state.inputIndex ? inputData : input)),
        };
      });

      console.log('updatedDevices', updatedDevices);

      state.config = await updateConfig({
        devices: updatedDevices,
      });

      navigateTo('devices', { deviceIndex: state.deviceIndex });
    } else {
      const updatedInputs = (state.config.inputs || []).map((input, index) => (index === state.inputIndex ? inputData : input));

      console.log('updatedInputs', updatedInputs);

      state.config = await updateConfig({
        inputs: updatedInputs,
      });

      navigateTo('dashboard');
    }
  } catch {
    homebridge.toast.error('Failed to edit input');
  }
}

async function handleInputDelete() {
  try {
    if (state.deviceIndex !== undefined) {
      const updatedDevices = (state.config.devices || []).map((item, index) => {
        if (index !== state.deviceIndex) {
          return item;
        }

        return {
          ...item,
          inputs: item.inputs.filter((_, index) => index !== state.inputIndex),
        };
      });

      console.log('updatedDevices', updatedDevices);

      state.config = await updateConfig({
        devices: updatedDevices,
      });

      navigateTo('devices', { deviceIndex: state.deviceIndex });
    } else {
      state.config = await updateConfig({
        inputs: state.config.inputs.filter((_, index) => index !== state.inputIndex),
      });

      navigateTo('dashboard');
    }

    homebridge.toast.success('Input deleted successfully');
  } catch {
    homebridge.toast.error('Failed to delete input');
  }
}

function handleInputTypeChange(event) {
  const selectedType = event.target.value;
  const typeGroups = container.querySelectorAll('[data-type]');

  typeGroups.forEach((group) => {
    const isMatch = group.dataset.type === selectedType;
    group.classList.toggle('d-none', !isMatch);

    group.querySelectorAll('input, select, textarea').forEach((input) => {
      input.disabled = !isMatch;
    });
  });
}

function handleInputCommandAdd(event) {
  const list = container.querySelector('[data-command-list]');
  const template = container.querySelector('#command-row-template');

  const clone = template.content.cloneNode(true);
  clone.querySelector('[data-command-remove]')?.addEventListener('click', handleInputCommandRemove);
  list.appendChild(clone);
}

function handleInputCommandRemove(event) {
  const button = event.currentTarget;
  const group = button.closest('.input-group');
  group.remove();
}

async function initInputAdd() {
  container.innerHTML = await render('components/inputs/templates/tmpl.html', state);

  container.querySelector('select[name="type"]')?.addEventListener('change', handleInputTypeChange);
  container.querySelector('[data-command-add]')?.addEventListener('click', handleInputCommandAdd);
  container.querySelector('[data-command-remove]')?.addEventListener('click', handleInputCommandRemove);

  const form = container.querySelector('form');
  form?.addEventListener('submit', handleInputAdd);
}

async function initInputEdit() {
  const device = state.config.devices?.[state.deviceIndex];
  state.input = state.device ? device.inputs?.[state.inputIndex] : state.config.inputs?.[state.inputIndex];

  container.innerHTML = await render('components/inputs/templates/tmpl.html', state);
  container.querySelector('select[name="type"]')?.addEventListener('change', handleInputTypeChange);
  container.querySelector('[data-command-add]')?.addEventListener('click', handleInputCommandAdd);
  container.querySelectorAll('[data-command-remove]').forEach((button) => button.addEventListener('click', handleInputCommandRemove));

  const form = container.querySelector('form');
  form?.addEventListener('submit', handleInputEdit);
}

async function initInputDelete() {
  const device = state.config.devices?.[state.deviceIndex];
  state.input = state.device ? device.inputs?.[state.inputIndex] : state.config.inputs?.[state.inputIndex];

  container.innerHTML = await render('components/inputs/templates/tmpl.html', state);
  container.querySelector('[data-input-cancel]')?.addEventListener('click', () => initInputEdit());
  container.querySelector('[data-input-confirm]')?.addEventListener('click', () => handleInputDelete());
}

export async function renderPage({ root, params }) {
  homebridge.disableSaveButton();

  state = {
    config: await getConfig(),
    params: params,
    input: null,
    inputIndex: !isNaN(params.inputIndex) ? Number(params.inputIndex) : undefined,
    deviceIndex: !isNaN(params.deviceIndex) ? Number(params.deviceIndex) : undefined,
  };

  container = root;

  console.log('Rendering inputs page', root, params, state);

  if (params.action === 'edit' || state.inputIndex !== undefined) {
    await initInputEdit();
  } else if (params.action === 'delete') {
    await initInputDelete();
  } else {
    await initInputAdd();
  }
}
