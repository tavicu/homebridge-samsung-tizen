<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import Confirm from './Confirm.vue';

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
const { navigateBack } = useRouter();
const toast = useToast();

const inputItem = computed(() => {
  if (props.deviceIndex !== undefined) {
    return config.value?.devices?.[props.deviceIndex]?.inputs?.[props.inputIndex];
  }

  return config.value?.inputs?.[props.inputIndex];
});

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateBack('device', { action: 'edit', deviceIndex: props.deviceIndex, tab: 'inputs' });
    return;
  }

  navigateBack('dashboard', { tab: 'inputs' });
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
  () => [props.inputIndex, props.deviceIndex],
  () => {
    if (!inputItem.value) {
      toast.error('Input not found');
      goBack();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete input" confirm-label="Delete Input" @cancel="navigateBack('input', { action: 'edit', inputIndex, deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the input <span class="fw-semibold">{{ inputItem?.name }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
