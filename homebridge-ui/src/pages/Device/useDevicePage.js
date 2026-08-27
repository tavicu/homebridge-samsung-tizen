import { computed, reactive, ref, watch } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useRouter } from '../../composables/useRouter';

function parseIndex(value) {
  const index = Number(value);
  return value !== undefined && value !== '' && !Number.isNaN(index) ? index : undefined;
}

export function useDevicePage() {
  const hb = window.homebridge;
  const { config, updateConfig, cleanConfig } = useConfig();
  const { currentParams, navigateTo } = useRouter();

  const validated = ref(false);
  const form = reactive({
    name: '',
    ip: '',
    mac: '',
    deviceId: '',
    uuid: '',
    disableSwitchDeviceName: false,
  });

  const deviceIndex = computed(() => parseIndex(currentParams.value.deviceIndex));

  const mode = computed(() => {
    if (currentParams.value.action === 'delete') return 'delete';
    if (deviceIndex.value !== undefined) return 'edit';
    return 'add';
  });

  const currentDevice = computed(() => {
    if (deviceIndex.value === undefined) return null;
    return config.value?.devices?.[deviceIndex.value] || null;
  });

  function resetForm() {
    form.name = '';
    form.ip = '';
    form.mac = '';
    form.deviceId = '';
    form.uuid = '';
    form.disableSwitchDeviceName = false;
  }

  function fillForm(device) {
    form.name = device.name || '';
    form.ip = device.ip || '';
    form.mac = device.mac || '';
    form.deviceId = device.deviceId || device.device_id || '';
    form.uuid = device.uuid || '';
    form.disableSwitchDeviceName = Array.isArray(device.options) && device.options.includes('Switch.DeviceName.Disable');
  }

  function goBack() {
    navigateTo('dashboard');
  }

  function goToDelete() {
    navigateTo('device', { action: 'delete', deviceIndex: String(deviceIndex.value) });
  }

  function goToEdit() {
    navigateTo('device', { action: 'edit', deviceIndex: String(deviceIndex.value) });
  }

  function init() {
    hb?.disableSaveButton();
    validated.value = false;

    if (mode.value === 'add') {
      resetForm();
      return;
    }

    if (!currentDevice.value) {
      hb?.toast?.error('Device not found');
      goBack();
      return;
    }

    if (mode.value === 'edit') {
      fillForm(currentDevice.value);
    }
  }

  function buildDeviceData() {
    const data = {
      name: form.name,
      ip: form.ip,
      mac: form.mac?.toUpperCase(),
      deviceId: form.deviceId,
    };

    if (mode.value === 'edit') {
      data.uuid = form.uuid;
      data.options = form.disableSwitchDeviceName ? ['Switch.DeviceName.Disable'] : undefined;
    }

    return cleanConfig(data);
  }

  async function submit() {
    const deviceData = buildDeviceData();
    const currentDevices = config.value.devices || [];

    try {
      if (mode.value === 'edit') {
        const updatedDevices = currentDevices.map((item, index) => {
          if (index !== deviceIndex.value) {
            return item;
          }

          const next = { ...item, ...deviceData };

          if (!deviceData.options) {
            delete next.options;
          }

          return next;
        });

        await updateConfig({ devices: updatedDevices });
        hb?.toast?.success('Device updated successfully');
      } else {
        await updateConfig({ devices: [...currentDevices, deviceData] });
        hb?.toast?.success('Device added successfully');
      }

      goBack();
    } catch {
      hb?.toast?.error(mode.value === 'edit' ? 'Failed to update device' : 'Failed to add device');
    }
  }

  async function confirmDelete() {
    try {
      const updatedDevices = (config.value.devices || []).filter((_, index) => index !== deviceIndex.value);
      await updateConfig({ devices: updatedDevices });
      hb?.toast?.success('Device deleted successfully');
      goBack();
    } catch {
      hb?.toast?.error('Failed to delete device');
    }
  }

  watch(
    () => [currentParams.value.action, currentParams.value.deviceIndex],
    () => init(),
    { immediate: true },
  );

  return {
    mode,
    form,
    validated,
    currentDevice,
    submit,
    goBack,
    goToDelete,
    goToEdit,
    confirmDelete,
  };
}
