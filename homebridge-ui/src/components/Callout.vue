<script setup>
const props = defineProps({
  state: {
    type: String,
    default: 'info',
    validator: (value) => ['primary', 'secondary', 'danger', 'success', 'info', 'warning'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div class="callout" :class="`callout-${props.state}`">
    <div v-if="title" class="callout-title fw-semibold" :class="{ 'mb-1': text || $slots.default }">{{ title }}</div>

    <div v-if="text || $slots.default" class="callout-text">
      <slot>
        <div v-html="text" />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.callout {
  --callout-color: var(--bs-info);

  padding: 0.75rem 1rem;
  border: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.125));
  border-left-width: 3px;
  border-left-color: var(--callout-color);
  border-radius: 0.4rem;
  background-color: color-mix(in srgb, var(--callout-color) 5%, transparent);
}

.callout-text {
  font-size: 0.825rem;
}

.callout-primary {
  --callout-color: var(--bs-primary);
}

.callout-secondary {
  --callout-color: var(--bs-secondary);
}

.callout-success {
  --callout-color: var(--bs-success);
}

.callout-danger {
  --callout-color: var(--bs-danger);
}

.callout-warning {
  --callout-color: var(--bs-warning);
}

.callout-info {
  --callout-color: var(--bs-info);
}

.dark-mode .callout {
  background-color: color-mix(in srgb, var(--callout-color) 12%, transparent);
}
</style>
