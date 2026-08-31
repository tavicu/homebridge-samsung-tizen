<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import ConfirmDelete from './ConfirmDelete.vue';

const props = defineProps({
  inputIndex: {
    type: Number,
    required: true,
  },
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config, updateConfig } = useConfig();
const { navigateTo } = useRouter();
const toast = useToast();

const input = computed(() => {
  if (props.deviceIndex !== undefined) {
    return config.value?.devices?.[props.deviceIndex]?.inputs?.[props.inputIndex];
  }

  return config.value?.inputs?.[props.inputIndex];
});

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateTo('device', { action: 'edit', deviceIndex: props.deviceIndex });
    return;
  }

  navigateTo('dashboard');
}

async function confirmDelete() {
  try {
    if (props.deviceIndex !== undefined) {
      const updatedDevices = config.value.devices.map((item, dIndex) => {
        if (dIndex !== props.deviceIndex) {
          return item;
        }

        return {
          ...item,
          inputs: item.inputs.filter((_, index) => index !== props.inputIndex),
        };
      });

      await updateConfig({ devices: updatedDevices });
    } else {
      const updatedInputs = config.value.inputs.filter((_, index) => index !== props.inputIndex);
      await updateConfig({ inputs: updatedInputs });
    }

    toast.success('Input deleted successfully');
    goBack();
  } catch {
    toast.error('Failed to delete input');
  }
}

watch(
  [() => config.value, input],
  ([currentConfig, currentInput]) => {
    if (currentConfig && !currentInput) {
      toast.error('Input not found');
      goBack();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="mb-3">
    <h6 class="fw-bold mb-0">Delete Input</h6>
    <div class="text-muted">Delete the input {{ input?.name }}</div>
  </div>

  <ConfirmDelete
    :title="`Delete input ${input?.name}`"
    :text="`Are you sure you want to delete the input ${input?.name} from configuration?`"
    confirm-label="Delete Input"
    @cancel="navigateTo('input', { action: 'edit', inputIndex, deviceIndex })"
    @confirm="confirmDelete"
  />
</template>
