<script setup>
import { onMounted } from 'vue';
import SmartThingsWizard from '../components/SmartThingsWizard.vue';
import { useHomebridge } from '../composables/useHomebridge';

const { disableSaveButton } = useHomebridge();

onMounted(() => {
  disableSaveButton();
});
</script>

<template>
  <div>
    <SmartThingsIcon width="52" />
    <h6 class="fw-bold mt-2 mb-0">SmartThings Authorization</h6>
    <small class="text-muted">Connect your Samsung SmartThings account to Homebridge</small>
  </div>

  <SmartThingsWizard />
</template>
