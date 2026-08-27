<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
});

defineEmits(['cancel', 'confirm']);
</script>

<template>
  <div class="mb-3">
    <h6 class="fw-bold mb-0">Delete Device</h6>
    <div class="text-muted">Delete the device {{ name }}</div>
  </div>

  <div class="card card-danger text-center">
    <div class="card-body">
      <div class="card-icon danger mb-3"><i class="fa-solid fa-circle-xmark"></i></div>
      <h4>Delete device {{ name }}</h4>
      <p class="mx-auto mb-4" style="max-width: 32rem">Are you sure you want to delete the device {{ name }} from configuration?</p>

      <button type="button" class="btn btn-outline-secondary" @click="$emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-danger" @click="$emit('confirm')">Delete Device</button>
    </div>
  </div>
</template>

<style scoped>
.card-icon {
  font-size: 1.75rem;
  background: #eee;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.card-icon.danger {
  background: rgba(var(--bs-danger-rgb), 0.1);
  color: rgba(var(--bs-danger-rgb), 1);
}

.card.card-danger {
  background-color: rgba(var(--bs-danger-rgb), 0.05);
}
</style>
