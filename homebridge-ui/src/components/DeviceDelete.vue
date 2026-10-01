<script setup>
import { computed, ref, watch } from 'vue';
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

// Kept from when the screen opened: once the delete is saved, the index points at the next device.
const deviceName = ref('');
const device = computed(() => config.value?.devices?.[props.deviceIndex]);

async function confirmDelete() {
  try {
    const updatedDevices = config.value.devices.filter((_, index) => index !== props.deviceIndex);
    await updateConfig({ devices: updatedDevices });

    toast.success('Device deleted successfully.');
    navigateTo('dashboard', { tab: 'devices' });
  } catch {
    toast.error('Failed to delete device');
  }
}

watch(
  () => props.deviceIndex,
  () => {
    if (!device.value) {
      toast.error('Device not found');
      navigateTo('dashboard', { tab: 'devices' });
      return;
    }

    deviceName.value = device.value.name;
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete device" confirm-label="Delete Device" @cancel="navigateBack('device', { action: 'edit', deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the device <span class="fw-semibold">{{ deviceName }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
