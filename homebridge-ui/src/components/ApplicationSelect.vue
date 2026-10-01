<script setup>
import { computed } from 'vue';
import { useApps } from '../composables/useApps';

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

const apps = useApps(() => props.deviceIndex);

const appSelect = computed({
  get() {
    return apps.value.some((app) => String(app.id) === value.value) ? value.value : 'other';
  },
  set(selected) {
    value.value = selected === 'other' ? '' : selected;
  },
});
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
