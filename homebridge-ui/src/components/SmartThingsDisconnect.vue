<script setup>
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import { useToast } from '../composables/useToast';
import ConfirmDelete from './ConfirmDelete.vue';

const { showSpinner, hideSpinner } = useHomebridge();
const { navigateTo } = useRouter();
const { disconnect } = useSmartThings();
const toast = useToast();

async function confirmDisconnect() {
  showSpinner();

  try {
    await disconnect();

    toast.success('SmartThings disconnected. Restart Homebridge so the plugin drops the in-memory token.');
    navigateTo('dashboard');
  } catch {
    toast.error('Failed to disconnect SmartThings');
  } finally {
    hideSpinner();
  }
}
</script>

<template>
  <div class="mb-3">
    <h6 class="fw-bold mb-0">Disconnect SmartThings</h6>
    <div class="text-muted">Remove the stored SmartThings tokens</div>
  </div>

  <ConfirmDelete
    title="Disconnect SmartThings?"
    text="This removes the stored access and refresh tokens. Client ID and Secret in the plugin config are kept. Restart Homebridge afterwards so the plugin stops using the token still in memory."
    confirm-label="Disconnect"
    @cancel="navigateTo('dashboard')"
    @confirm="confirmDisconnect"
  />
</template>
