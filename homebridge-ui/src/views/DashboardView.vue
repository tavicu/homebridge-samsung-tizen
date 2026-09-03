<script setup>
import { onMounted } from 'vue';
import DevicesList from '../components/DevicesList.vue';
import InputsList from '../components/InputsList.vue';
import SmartThingsCard from '../components/SmartThingsCard.vue';
import SwitchesList from '../components/SwitchesList.vue';
import Tabs from '../components/Tabs.vue';
import { useHomebridge } from '../composables/useHomebridge';

const { enableSaveButton, showModalFooter } = useHomebridge();

const tabs = [
  { id: 'devices', label: 'Devices' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'switches', label: 'Switches' },
];

onMounted(() => {
  showModalFooter();
  enableSaveButton();
});
</script>

<template>
  <p class="small" v-html="$t('dashboard.alert', { url: 'https://tavicu.github.io/homebridge-samsung-tizen/' })" />

  <div class="mb-4">
    <SmartThingsCard />
  </div>

  <Tabs v-slot="{ currentTab }" :tabs="tabs">
    <DevicesList v-if="currentTab === 'devices'" />
    <InputsList v-else-if="currentTab === 'inputs'" />
    <SwitchesList v-else-if="currentTab === 'switches'" />
  </Tabs>
</template>
