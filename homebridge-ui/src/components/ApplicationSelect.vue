<script setup>
import { computed, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useDevice } from '../composables/useDevice';

const value = defineModel({
  type: String,
  required: true,
});

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  deviceIndex: {
    type: Number,
    default: undefined,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const { config } = useConfig();
const { getApps } = useDevice();
const apps = ref([]);

// Global inputs and switches apply to every TV, so they offer the apps of all of them.
const devices = computed(() => (props.deviceIndex === undefined ? config.value.devices || [] : [config.value.devices?.[props.deviceIndex]]));

const appSelect = computed({
  get() {
    return apps.value.some((app) => String(app.id) === value.value) ? value.value : 'other';
  },
  set(selected) {
    value.value = selected === 'other' ? '' : selected;
  },
});

watch(
  devices,
  async (list) => {
    apps.value = await getApps(list);
  },
  { immediate: true },
);
</script>

<template>
  <select v-if="apps.length" :id="id" v-model="appSelect" class="form-select mb-2">
    <option v-for="app in apps" :key="app.id" :value="String(app.id)">{{ app.name }} ({{ app.id }})</option>
    <option value="other">Other</option>
  </select>

  <input
    v-if="!apps.length || appSelect === 'other'"
    :id="apps.length ? undefined : id"
    v-model="value"
    type="text"
    class="form-control"
    placeholder="e.g. 111299001912"
    :required="required"
  />
</template>
