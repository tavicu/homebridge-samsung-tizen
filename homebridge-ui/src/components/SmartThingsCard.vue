<script setup>
import { onMounted } from 'vue';
import SmartThingsIcon from '../assets/icons/smartthings.svg';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';

const { navigateTo } = useRouter();

const { smartthings, isLoading, isExpired, fetchSmartThings } = useSmartThings();

onMounted(() => {
  fetchSmartThings();
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
  <div>
    <SmartThingsIcon width="52" />

    <div v-if="isLoading">Loading ...</div>

    <template v-else-if="smartthings && !isExpired">
      <div>Connected</div>
      <p>Your account is authorized and active. Devices are synchronized via the SmartThings API.</p>
      <button type="button" class="btn btn-primary" @click="navigateTo('smartthings')"><i class="fas fa-pen me-1" /> Edit Credentials</button>
    </template>

    <template v-else-if="smartthings && isExpired">
      <div>Authorization expired</div>
      <p>
        Your access token expired on <span class="fw-semibold">{{ formatDate(smartthings.expiresAt) }}</span
        >. Re-authorize to restore full functionality.
      </p>
      <p>You can re-authorize using your existing credentials or update them if your Client ID or Secret has changed.</p>
      <button type="button" class="btn btn-danger" @click="navigateTo('smartthings')"><i class="fas fa-arrows-rotate me-1" /> Re-authorize SmartThings</button>
    </template>

    <template v-else>
      <div>Not connected</div>
      <p>Connect your SmartThings account to control your devices directly from this plugin.</p>
      <button type="button" class="btn btn-success" @click="navigateTo('smartthings')"><i class="fas fa-link me-1" /> Connect to SmartThings</button>
    </template>
  </div>
</template>
