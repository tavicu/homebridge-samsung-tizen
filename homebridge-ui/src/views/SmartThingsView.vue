<script setup>
import { computed, onMounted } from 'vue';
import SmartThingsIcon from '../assets/icons/smartthings.svg';
import SmartThingsDisconnect from '../components/SmartThingsDisconnect.vue';
import SmartThingsWizard from '../components/SmartThingsWizard.vue';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';

const { disableSaveButton, hideModalFooter } = useHomebridge();
const { currentParams } = useRouter();

const action = computed(() => currentParams.value?.action);

onMounted(() => {
  hideModalFooter();
  disableSaveButton();
});
</script>

<template>
  <SmartThingsDisconnect v-if="action === 'disconnect'" />

  <template v-else>
    <div class="text-center">
      <SmartThingsIcon width="52" />
      <h6 class="fw-bold mt-2 mb-0">SmartThings Authorization</h6>
      <small class="text-muted">Connect your Samsung SmartThings account to Homebridge</small>
    </div>

    <SmartThingsWizard />
  </template>
</template>
