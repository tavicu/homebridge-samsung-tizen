<script setup>
import { ref } from 'vue';

defineProps({
  title: {
    type: String,
    default: 'Are you sure?',
  },
  text: {
    type: String,
    default: 'This action cannot be undone.',
  },
  confirmLabel: {
    type: String,
    default: 'Confirm Delete',
  },
  cancelLabel: {
    type: String,
    default: 'Cancel',
  },
});

const emit = defineEmits(['cancel', 'confirm']);

const isDeleting = ref(false);

function handleConfirm() {
  if (isDeleting.value) {
    return;
  }

  isDeleting.value = true;
  emit('confirm');
}
</script>

<template>
  <div>
    <div class="danger mb-3"><i class="fa-solid fa-circle-xmark" /></div>
    <h4>{{ title }}</h4>
    <p class="mb-4">{{ text }}</p>

    <button type="button" class="btn btn-outline-secondary" :disabled="isDeleting" @click="emit('cancel')">{{ cancelLabel }}</button>
    <button type="button" class="btn btn-danger" :disabled="isDeleting" @click="handleConfirm">
      <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      {{ confirmLabel }}
    </button>
  </div>
</template>
