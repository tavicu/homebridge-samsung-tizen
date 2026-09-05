<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  state: {
    type: String,
    default: 'danger',
    validator: (value) => ['danger', 'success', 'info', 'warning'].includes(value),
  },
  title: {
    type: String,
    default: 'Are you sure?',
  },
  text: {
    type: [String, Array],
    default: 'This action cannot be undone.',
  },
  confirmLabel: {
    type: String,
    default: 'Confirm',
  },
  cancelLabel: {
    type: String,
    default: 'Cancel',
  },
});

const emit = defineEmits(['cancel', 'confirm']);

const isConfirming = ref(false);

const stateIcons = {
  danger: 'fa-regular fa-circle-xmark',
  success: 'fa-regular fa-circle-check',
  info: 'fa-regular fa-circle-info',
  warning: 'fa-regular fa-circle-exclamation',
};

const paragraphs = computed(() => (Array.isArray(props.text) ? props.text : [props.text]));

function handleConfirm() {
  if (isConfirming.value) {
    return;
  }

  isConfirming.value = true;
  emit('confirm');
}
</script>

<template>
  <div class="d-flex flex-column align-items-center text-center">
    <div class="confirm-icon mt-2 mb-4" :class="`text-${state}`">
      <i :class="stateIcons[state]" />
    </div>

    <h4 class="fw-normal">{{ title }}</h4>

    <div class="confirm-text text-secondary mt-2 mb-4">
      <slot>
        <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
      </slot>
    </div>

    <div class="d-flex gap-2">
      <button type="button" class="btn btn-outline-secondary" :disabled="isConfirming" @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button type="button" class="btn" :class="`btn-${state}`" :disabled="isConfirming" @click="handleConfirm">
        <span v-if="isConfirming" class="spinner-border spinner-border-sm me-1" />
        {{ confirmLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.confirm-icon {
  font-size: 3.5rem;
}

.confirm-text {
  max-width: 22rem;
  margin-left: auto;
  margin-right: auto;
}
</style>
