<script setup>
defineProps({
  icon: {
    type: [Object, Function],
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  actionLabel: {
    type: String,
    required: true,
  },
});

defineEmits(['action']);
</script>

<template>
  <div class="empty-state d-flex flex-column align-items-center text-center">
    <div v-if="icon" class="empty-state-icon mb-3" aria-hidden="true">
      <component :is="icon" />
    </div>

    <h6 class="empty-state-title fw-semibold m-0">{{ title }}</h6>

    <p v-if="description" class="empty-state-text small text-secondary mt-2 mb-3">{{ description }}</p>

    <button type="button" class="btn btn-primary" @click="$emit('action')"><i class="fas fa-plus" /> {{ actionLabel }}</button>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2.5rem 1.5rem 2.25rem;
  border-top: 1px solid var(--bs-card-border-color);
}

.empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.025);
  color: var(--bs-secondary-color);
}

.empty-state-icon :deep(svg) {
  width: 1.75rem;
  height: 1.75rem;
}

.empty-state-title {
  font-size: 0.875rem;
}

.empty-state-text {
  max-width: 22rem;
}
</style>
