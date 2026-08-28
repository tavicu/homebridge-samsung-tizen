<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import ConfirmDelete from './ConfirmDelete.vue';

const props = defineProps({
  deviceIndex: {
    type: Number,
    required: true,
  },
});

const { config, updateConfig } = useConfig();
const { navigateTo } = useRouter();
const toast = useToast();

const device = computed(() => config.value?.devices?.[props.deviceIndex]);

async function confirmDelete() {
  try {
    const updatedDevices = config.value.devices.filter((_, index) => index !== props.deviceIndex);
    await updateConfig({ devices: updatedDevices });

    toast.success('Device deleted successfully');
    navigateTo('dashboard');
  } catch {
    toast.error('Failed to delete device');
  }
}

watch(
  () => [config.value, props.deviceIndex],
  ([currentConfig, index]) => {
    if (currentConfig && !currentConfig.devices?.[index]) {
      toast.error('Device not found');
      navigateTo('dashboard');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="mb-3">
    <h6 class="fw-bold mb-0">Delete Device</h6>
    <div class="text-muted">Delete the device {{ device?.name }}</div>
  </div>

  <ConfirmDelete
    :title="`Delete device ${device?.name}`"
    :text="`Are you sure you want to delete the device ${device?.name} from configuration?`"
    confirm-label="Delete Device"
    @cancel="navigateTo('device', { action: 'edit', deviceIndex })"
    @confirm="confirmDelete"
  />
</template>
