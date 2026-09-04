<script setup>
import { onMounted } from 'vue';
import SmartThingsIcon from '../assets/icons/smartthings.svg';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';

const { navigateTo } = useRouter();

const { smartthings, isLoading, status, getToken } = useSmartThings();

const statusBadge = {
  connected: { label: 'Connected', class: 'bg-success' },
  expired: { label: 'Expired', class: 'bg-warning text-dark' },
  disconnected: { label: 'Not connected', class: 'bg-secondary' },
};

onMounted(() => {
  getToken();
});

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="hst-card d-flex align-items-center gap-4 shadow">
    <div class="flex-grow-1">
      <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
        <h5 class="fw-semibold mb-0">SmartThings Integration</h5>
        <span v-if="!isLoading" class="badge rounded-pill" :class="statusBadge[status].class">
          {{ statusBadge[status].label }}
        </span>
      </div>

      <div v-if="isLoading" class="text-center">
        <div class="spinner-border" role="status"></div>
      </div>

      <template v-else-if="status === 'connected'">
        <p class="mb-2">Your account is authorized and active. Devices are synchronized via the SmartThings API.</p>
        <button type="button" class="btn btn-primary" @click="navigateTo('smartthings')"><i class="fas fa-pen me-1" /> Edit Credentials</button>
        <button type="button" class="btn btn-disconnect" @click="navigateTo('smartthings', { action: 'disconnect' })">Disconnect</button>
      </template>

      <template v-else-if="status === 'expired'">
        <p class="mb-2">
          Your access token expired on <span class="fw-semibold">{{ formatDate(smartthings.expiresAt) }}</span
          >. Re-authorize to restore full functionality.
        </p>
        <button type="button" class="btn btn-danger" @click="navigateTo('smartthings')"><i class="fas fa-arrows-rotate me-1" /> Re-authorize SmartThings</button>
        <button type="button" class="btn btn-disconnect" @click="navigateTo('smartthings', { action: 'disconnect' })">Disconnect</button>
      </template>

      <template v-else>
        <p class="mb-2">Connect your SmartThings account to control your devices directly from this plugin.</p>
        <button type="button" class="btn btn-success" @click="navigateTo('smartthings')"><i class="fas fa-link me-1" /> Connect to SmartThings</button>
      </template>
    </div>

    <SmartThingsIcon width="52" class="d-none d-sm-block flex-shrink-0 mx-2" />
  </div>
</template>

<style scoped>
.hst-card {
  background: linear-gradient(135deg, rgb(4 121 208 / 100%) 0%, rgb(0 141 247 / 80%) 100%);
  border-radius: 0.375rem;
  box-shadow: 0 1px 4px rgb(0 40 80 / 12%);
  min-height: 7rem;
  padding: 0.825rem;
  color: #fff;
}

.btn-disconnect {
  color: #ffffff;

  &:hover {
    text-decoration: underline;
  }
}
</style>
