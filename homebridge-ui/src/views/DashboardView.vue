<script setup>
import { onMounted } from 'vue';
import Callout from '../components/Callout.vue';
import DevicesList from '../components/DevicesList.vue';
import InputsList from '../components/InputsList.vue';
import KeysForm from '../components/KeysForm.vue';
import SmartThingsCard from '../components/SmartThingsCard.vue';
import SwitchesList from '../components/SwitchesList.vue';
import Tabs from '../components/Tabs.vue';
import { useHomebridge } from '../composables/useHomebridge';

const { enableSaveButton, showModalFooter } = useHomebridge();

const tabs = [
  { id: 'devices', label: 'Devices' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'switches', label: 'Switches' },
  { id: 'keys', label: 'Remote Keys' },
];

onMounted(() => {
  showModalFooter();
  enableSaveButton();
});
</script>

<template>
  <Callout class="mb-3" :text="$t('dashboard.alert', { url: 'https://tavicu.github.io/homebridge-samsung-tizen/' })" />

  <SmartThingsCard class="mb-4" />

  <Tabs v-slot="{ currentTab }" :tabs="tabs">
    <DevicesList v-if="currentTab === 'devices'" description="Samsung TVs currently added to this plugin configuration" />
    <InputsList v-else-if="currentTab === 'inputs'" title="Global Inputs" description="These inputs apply to all configured devices" />
    <SwitchesList v-else-if="currentTab === 'switches'" title="Global Switches" description="These switches apply to all configured devices" />
    <KeysForm v-else-if="currentTab === 'keys'" />
  </Tabs>
</template>
