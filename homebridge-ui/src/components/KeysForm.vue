<script setup>
import { computed, reactive, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useKeys } from '../composables/useKeys';
import { useToast } from '../composables/useToast';
import Callout from './Callout.vue';

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config, updateConfig, cleanConfig } = useConfig();
const toast = useToast();
const { formEl, validated, checkValidity } = useForm();
const { keyGroups, readKeys, toConfigKeys } = useKeys();

const globalKeys = computed(() => readKeys(config.value.keys));

const storedKeys = computed(() => {
  if (props.deviceIndex === undefined) {
    return globalKeys.value;
  }

  return readKeys(config.value.devices?.[props.deviceIndex]?.keys);
});

const form = reactive(readKeys());
const isDirty = computed(() => Object.keys(form).some((id) => form[id] !== storedKeys.value[id]));

function fillForm() {
  Object.assign(form, storedKeys.value);
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  const nextKeys = cleanConfig(toConfigKeys(form));

  try {
    if (props.deviceIndex !== undefined) {
      const updatedDevices = (config.value.devices || []).map((item, index) => (index === props.deviceIndex ? { ...item, keys: nextKeys } : item));

      await updateConfig({ devices: updatedDevices });
    } else {
      await updateConfig({ keys: nextKeys });
    }

    toast.success('Remote keys updated successfully');
  } catch {
    toast.error('Failed to update remote keys');
  }
}

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
  <Callout class="mb-3" text="Leave a field empty to use the default mapping shown in the placeholder." />

  <form ref="formEl" class="card rounded shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <template v-for="group in keyGroups" :key="group.id">
      <div class="card-header">
        <h6 class="fw-semibold mb-0">{{ group.title }}</h6>
        <p class="small text-secondary mt-1">{{ group.description }}</p>
      </div>

      <div class="card-body keys-grid">
        <div v-for="key in group.keys" :key="key.id">
          <label :for="`remote-key-${key.id}`" class="form-label">{{ key.label }}</label>
          <input :id="`remote-key-${key.id}`" v-model="form[key.id]" type="text" class="form-control font-monospace text-uppercase" :placeholder="globalKeys[key.id] || key.default" />
        </div>
      </div>
    </template>

    <div class="card-footer justify-content-end">
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
