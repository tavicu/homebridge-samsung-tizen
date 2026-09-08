<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import Confirm from './Confirm.vue';

const props = defineProps({
  deviceIndex: {
    type: Number,
    required: true,
  },
});

const { config, updateConfig } = useConfig();
const { navigateTo, navigateBack } = useRouter();
const toast = useToast();

const device = computed(() => config.value?.devices?.[props.deviceIndex]);

async function confirmDelete() {
  try {
    const updatedDevices = config.value.devices.filter((_, index) => index !== props.deviceIndex);
    await updateConfig({ devices: updatedDevices });

    toast.success('Device deleted successfully. Restart Homebridge for the change to take effect.');
    navigateTo('dashboard', { tab: 'devices' });
  } catch {
    toast.error('Failed to delete device');
  }
}

watch(
  () => props.deviceIndex,
  (index) => {
    if (!config.value?.devices?.[index]) {
      toast.error('Device not found');
      navigateTo('dashboard', { tab: 'devices' });
    }
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete device" confirm-label="Delete Device" @cancel="navigateBack('device', { action: 'edit', deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the device <span class="fw-semibold">{{ device?.name }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
