<script setup>
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import { useToast } from '../composables/useToast';
import Confirm from './Confirm.vue';

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
  <Confirm
    title="Disconnect SmartThings?"
    :text="[
      'This removes the stored access and refresh tokens. Client ID and Secret in the plugin config are kept.',
      'Restart Homebridge afterwards so the plugin stops using the token still in memory.',
    ]"
    confirm-label="Disconnect"
    @cancel="navigateTo('dashboard')"
    @confirm="confirmDisconnect"
  />
</template>
