<script setup>
import { useHomebridge } from '../../composables/useHomebridge';

defineProps({
  status: String,
  error: String,
});

const emit = defineEmits(['success', 'retry']);
const { enableSaveButton } = useHomebridge();

function handleSuccess() {
  enableSaveButton();
  emit('success');
}

function handleRetry() {
  emit('retry');
}
</script>

<template>
  <div v-if="status === 'success'" class="card card-success text-center">
    <div class="card-body">
      <div class="card-icon success mb-3"><i class="fa-solid fa-circle-check"></i></div>
      <h4>Connection successful</h4>
      <p class="mx-auto mb-4" style="max-width: 20rem;">Homebridge is now authorized to access your Samsung SmartThings account.</p>

      <button type="button" class="btn btn-success" @click="handleSuccess">Go to dashboard <i class="fas fa-arrow-right"></i></button>
    </div>
  </div>

  <div v-else class="card card-danger text-center">
    <div class="card-body">
      <div class="card-icon danger mb-3"><i class="fa-solid fa-circle-xmark"></i></div>
      <h4>Authorization failed</h4>
      <p class="mx-auto mb-4" style="max-width: 32rem;">
        {{ error || 'The backend could not exchange your authorization code for an access token. The authorization code may have been incorrect, expired, or already used. Please go back and try again with a fresh authorization code.' }}
      </p>

      <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-danger" @click="handleRetry">Try again</button>
    </div>
  </div>
</template>

<style scoped>
.card-icon {
  font-size: 3rem;
  line-height: 1;
}

.card-icon.success {
  color: #198754;
}

.card-icon.danger {
  color: #dc3545;
}
</style>
