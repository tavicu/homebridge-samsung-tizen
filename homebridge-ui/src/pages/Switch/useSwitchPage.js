import { computed, reactive, ref, watch } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';
import { useHomebridge } from '../../composables/useHomebridge';
import { useToast } from '../../composables/useToast';

function toCommands(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => String(item)) : [''];
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim());
  }

  return [''];
}

function hasAnyAction(form) {
  return (
    form.power ||
    form.mute ||
    form.sleep !== '' ||
    form.volume !== '' ||
    form.app.trim() !== '' ||
    form.input.trim() !== '' ||
    form.channel !== '' ||
    form.picture_mode.trim() !== '' ||
    form.commands.some((command) => command.trim() !== '')
  );
}

export function useSwitchPage() {
  const { config, updateConfig, cleanConfig } = useConfig();
  const { currentParams, navigateTo } = useRouter();
  const { disableSaveButton } = useHomebridge();
  const toast = useToast();

  const validated = ref(false);
  const form = reactive({
    name: '',
    power: false,
    sleep: '',
    mute: false,
    volume: '',
    app: '',
    input: '',
    channel: '',
    picture_mode: '',
    commands: [''],
  });

  const deviceIndex = computed(() => currentParams.value.deviceIndex);
  const switchIndex = computed(() => currentParams.value.switchIndex);

  const mode = computed(() => {
    if (currentParams.value.action === 'delete') {
      return 'delete';
    }
    if (switchIndex.value !== undefined) {
      return 'edit';
    }
    return 'add';
  });

  const isDeviceScoped = computed(() => deviceIndex.value !== undefined);

  const currentSwitch = computed(() => {
    if (switchIndex.value === undefined) {
      return null;
    }

    if (deviceIndex.value !== undefined) {
      return config.value?.devices?.[deviceIndex.value]?.switches?.[switchIndex.value] || null;
    }

    return config.value?.switches?.[switchIndex.value] || null;
  });

  function resetForm() {
    form.name = '';
    form.power = false;
    form.sleep = '';
    form.mute = false;
    form.volume = '';
    form.app = '';
    form.input = '';
    form.channel = '';
    form.picture_mode = '';
    form.commands = [''];
  }

  function fillForm(switchItem) {
    form.name = switchItem.name || '';
    form.power = !!switchItem.power;
    form.sleep = switchItem.sleep !== undefined && switchItem.sleep !== null ? String(switchItem.sleep) : '';
    form.mute = !!switchItem.mute;
    form.volume = switchItem.volume !== undefined && switchItem.volume !== null ? String(switchItem.volume) : '';
    form.app = switchItem.app != null ? String(switchItem.app) : '';
    form.input = switchItem.input || '';
    form.channel = switchItem.channel !== undefined && switchItem.channel !== null ? String(switchItem.channel) : '';
    form.picture_mode = switchItem.picture_mode || '';
    form.commands = switchItem.command !== undefined ? toCommands(switchItem.command) : [''];
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
      switchIndex: String(switchIndex.value),
    };

    if (deviceIndex.value !== undefined) {
      params.deviceIndex = String(deviceIndex.value);
    }

    navigateTo('switch', params);
  }

  function goToEdit() {
    const params = {
      action: 'edit',
      switchIndex: String(switchIndex.value),
    };

    if (deviceIndex.value !== undefined) {
      params.deviceIndex = String(deviceIndex.value);
    }

    navigateTo('switch', params);
  }

  function init() {
    disableSaveButton();
    validated.value = false;

    if (mode.value === 'add') {
      resetForm();
      return;
    }

    if (!currentSwitch.value) {
      toast.error('Switch not found');
      goBack();
      return;
    }

    if (mode.value === 'edit') {
      fillForm(currentSwitch.value);
    }
  }

  function buildSwitchData() {
    const commands = form.commands.map((item) => item.trim()).filter(Boolean);

    return cleanConfig({
      name: form.name,
      power: form.power || undefined,
      sleep: form.sleep !== '' ? Number(form.sleep) : undefined,
      mute: form.mute || undefined,
      volume: form.volume !== '' ? Number(form.volume) : undefined,
      app: form.app,
      input: form.input,
      channel: form.channel !== '' ? Number(form.channel) : undefined,
      picture_mode: form.picture_mode,
      command: commands.length > 0 ? commands : undefined,
    });
  }

  function getCurrentSwitches() {
    if (deviceIndex.value !== undefined) {
      return config.value.devices?.[deviceIndex.value]?.switches || [];
    }

    return config.value.switches || [];
  }

  async function persistSwitches(nextSwitches) {
    if (deviceIndex.value !== undefined) {
      const updatedDevices = (config.value.devices || []).map((item, index) => {
        if (index !== deviceIndex.value) {
          return item;
        }

        return {
          ...item,
          switches: nextSwitches,
        };
      });

      await updateConfig({ devices: updatedDevices });
      return;
    }

    await updateConfig({ switches: nextSwitches });
  }

  async function submit() {
    if (!hasAnyAction(form)) {
      validated.value = true;
      toast.error('Please configure at least one switch action');
      return;
    }

    const switchData = buildSwitchData();

    try {
      if (mode.value === 'edit') {
        const updatedSwitches = getCurrentSwitches().map((item, index) => (index === switchIndex.value ? switchData : item));
        await persistSwitches(updatedSwitches);
        toast.success('Switch updated successfully');
      } else {
        await persistSwitches([...getCurrentSwitches(), switchData]);
        toast.success('Switch added successfully');
      }

      goBack();
    } catch {
      toast.error(mode.value === 'edit' ? 'Failed to edit switch' : 'Failed to add switch');
    }
  }

  async function confirmDelete() {
    try {
      const updatedSwitches = getCurrentSwitches().filter((_, index) => index !== switchIndex.value);
      await persistSwitches(updatedSwitches);
      toast.success('Switch deleted successfully');
      goBack();
    } catch {
      toast.error('Failed to delete switch');
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
    () => [currentParams.value.action, currentParams.value.switchIndex, currentParams.value.deviceIndex],
    () => init(),
    { immediate: true },
  );

  return {
    mode,
    form,
    validated,
    currentSwitch,
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
