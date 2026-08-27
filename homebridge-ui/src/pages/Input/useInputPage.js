import { computed, reactive, ref, watch } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';

function parseIndex(value) {
  const index = Number(value);
  return value !== undefined && value !== '' && !Number.isNaN(index) ? index : undefined;
}

function toCommands(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => String(item)) : [''];
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim());
  }

  return [''];
}

export function useInputPage() {
  const hb = window.homebridge;
  const { config, updateConfig, cleanConfig } = useConfig();
  const { currentParams, navigateTo } = useRouter();

  const validated = ref(false);
  const form = reactive({
    name: '',
    type: '',
    valueInput: '',
    valueApp: '',
    commands: [''],
  });

  const deviceIndex = computed(() => parseIndex(currentParams.value.deviceIndex));
  const inputIndex = computed(() => parseIndex(currentParams.value.inputIndex));

  const mode = computed(() => {
    if (currentParams.value.action === 'delete') return 'delete';
    if (inputIndex.value !== undefined) return 'edit';
    return 'add';
  });

  const isDeviceScoped = computed(() => deviceIndex.value !== undefined);

  const currentInput = computed(() => {
    if (inputIndex.value === undefined) return null;

    if (deviceIndex.value !== undefined) {
      return config.value?.devices?.[deviceIndex.value]?.inputs?.[inputIndex.value] || null;
    }

    return config.value?.inputs?.[inputIndex.value] || null;
  });

  function resetForm() {
    form.name = '';
    form.type = '';
    form.valueInput = '';
    form.valueApp = '';
    form.commands = [''];
  }

  function fillForm(input) {
    form.name = input.name || '';
    form.type = input.type || '';
    form.valueInput = input.type === 'input' ? String(input.value || '') : '';
    form.valueApp = input.type === 'app' ? String(input.value || '') : '';
    form.commands = input.type === 'command' ? toCommands(input.value) : [''];
  }

  function goBack() {
    if (deviceIndex.value !== undefined) {
      navigateTo('device', { action: 'edit', deviceIndex: String(deviceIndex.value) });
      return;
    }

    navigateTo('dashboard');
  }

  function goToDelete() {
    const params = {
      action: 'delete',
      inputIndex: String(inputIndex.value),
    };

    if (deviceIndex.value !== undefined) {
      params.deviceIndex = String(deviceIndex.value);
    }

    navigateTo('input', params);
  }

  function goToEdit() {
    const params = {
      action: 'edit',
      inputIndex: String(inputIndex.value),
    };

    if (deviceIndex.value !== undefined) {
      params.deviceIndex = String(deviceIndex.value);
    }

    navigateTo('input', params);
  }

  function init() {
    hb?.disableSaveButton();
    validated.value = false;

    if (mode.value === 'add') {
      resetForm();
      return;
    }

    if (!currentInput.value) {
      hb?.toast?.error('Input not found');
      goBack();
      return;
    }

    if (mode.value === 'edit') {
      fillForm(currentInput.value);
    }
  }

  function buildInputData() {
    let value;

    if (form.type === 'command') {
      value = form.commands;
    } else if (form.type === 'app') {
      value = form.valueApp;
    } else {
      value = form.valueInput;
    }

    return cleanConfig({
      name: form.name,
      type: form.type,
      value,
    });
  }

  async function persistInputs(nextInputs) {
    if (deviceIndex.value !== undefined) {
      const updatedDevices = (config.value.devices || []).map((item, index) => {
        if (index !== deviceIndex.value) return item;

        return {
          ...item,
          inputs: nextInputs,
        };
      });

      await updateConfig({ devices: updatedDevices });
      return;
    }

    await updateConfig({ inputs: nextInputs });
  }

  function getCurrentInputs() {
    if (deviceIndex.value !== undefined) {
      return config.value.devices?.[deviceIndex.value]?.inputs || [];
    }

    return config.value.inputs || [];
  }

  async function submit() {
    const inputData = buildInputData();

    try {
      if (mode.value === 'edit') {
        const updatedInputs = getCurrentInputs().map((input, index) => (index === inputIndex.value ? inputData : input));
        await persistInputs(updatedInputs);
        hb?.toast?.success('Input updated successfully');
      } else {
        await persistInputs([...getCurrentInputs(), inputData]);
        hb?.toast?.success('Input added successfully');
      }

      goBack();
    } catch {
      hb?.toast?.error(mode.value === 'edit' ? 'Failed to edit input' : 'Failed to add input');
    }
  }

  async function confirmDelete() {
    try {
      const updatedInputs = getCurrentInputs().filter((_, index) => index !== inputIndex.value);
      await persistInputs(updatedInputs);
      hb?.toast?.success('Input deleted successfully');
      goBack();
    } catch {
      hb?.toast?.error('Failed to delete input');
    }
  }

  function addCommand() {
    form.commands.push('');
  }

  function removeCommand(index) {
    if (form.commands.length === 1) {
      form.commands[0] = '';
      return;
    }

    form.commands.splice(index, 1);
  }

  watch(
    () => [currentParams.value.action, currentParams.value.inputIndex, currentParams.value.deviceIndex],
    () => init(),
    { immediate: true },
  );

  return {
    mode,
    form,
    validated,
    currentInput,
    isDeviceScoped,
    submit,
    goBack,
    goToDelete,
    goToEdit,
    confirmDelete,
    addCommand,
    removeCommand,
  };
}
