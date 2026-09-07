<script setup>
import { computed, onUnmounted, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useHomebridge } from '../composables/useHomebridge';
import { useKeys } from '../composables/useKeys';
import { useToast } from '../composables/useToast';
import Callout from './Callout.vue';

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const isDeviceScoped = computed(() => props.deviceIndex !== undefined);

const { config, updateConfig, cleanConfig } = useConfig();
const { enableSaveButton, disableSaveButton } = useHomebridge();
const toast = useToast();
const { formEl, validated, checkValidity, createForm, isDirty, markPristine } = useForm();
const { keyGroups, readKeys, toConfigKeys } = useKeys();

const globalKeys = computed(() => readKeys(config.value.keys));

const storedKeys = computed(() => {
  if (!isDeviceScoped.value) {
    return globalKeys.value;
  }

  return readKeys(config.value.devices?.[props.deviceIndex]?.keys);
});

const form = createForm(readKeys());

function fillForm() {
  Object.assign(form, storedKeys.value);
  markPristine();
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  const nextKeys = cleanConfig(toConfigKeys(form));

  try {
    if (isDeviceScoped.value) {
      const updatedDevices = (config.value.devices || []).map((item, index) => (index === props.deviceIndex ? { ...item, keys: nextKeys } : item));

      await updateConfig({ devices: updatedDevices });
    } else {
      await updateConfig({ keys: nextKeys });
    }

    markPristine();
    toast.success('Remote keys updated successfully. Restart Homebridge for the change to take effect.');
  } catch {
    toast.error('Failed to update remote keys');
  }
}

watch(isDirty, (dirty) => {
  if (isDeviceScoped.value) {
    return;
  }

  if (dirty) {
    disableSaveButton();
  } else {
    enableSaveButton();
  }
});

onUnmounted(() => {
  if (!isDeviceScoped.value) {
    enableSaveButton();
  }
});

watch(
  storedKeys,
  (_keys, previous) => {
    if (previous === undefined || !isDirty.value) {
      fillForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Callout class="callout-sm mb-3" text="Leave a field empty to use the default mapping shown in the placeholder." />

  <form ref="formEl" class="card rounded shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <template v-for="group in keyGroups" :key="group.id">
      <div class="card-header">
        <h6 class="fw-semibold mb-0">{{ group.title }}</h6>
        <p class="small text-secondary mt-1">{{ group.description }}</p>
      </div>

      <div class="card-body keys-grid">
        <div v-for="key in group.keys" :key="key.id">
          <label :for="`remote-key-${key.id}`" class="form-label">{{ key.label }}</label>
          <input
            :id="`remote-key-${key.id}`"
            v-model="form[key.id]"
            type="text"
            class="form-control font-monospace text-uppercase"
            :placeholder="globalKeys[key.id] || key.default"
          />
        </div>
      </div>
    </template>

    <div class="card-footer">
      <small class="small text-muted">Changes are saved to your config file instantly.</small>

      <div class="card-actions">
        <button type="button" class="btn btn-outline-secondary" :disabled="!isDirty" @click="fillForm">Reset</button>
        <button type="submit" class="btn btn-primary" :disabled="!isDirty">Save Keys</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.keys-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .keys-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
