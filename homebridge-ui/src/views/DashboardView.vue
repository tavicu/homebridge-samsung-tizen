<script setup>
import { computed, onMounted } from 'vue';
import Callout from '../components/Callout.vue';
import DevicesList from '../components/DevicesList.vue';
import InputsList from '../components/InputsList.vue';
import KeysForm from '../components/KeysForm.vue';
import SmartThingsCard from '../components/SmartThingsCard.vue';
import SwitchesList from '../components/SwitchesList.vue';
import Tabs from '../components/Tabs.vue';
import { useConfig } from '../composables/useConfig';
import { useHomebridge } from '../composables/useHomebridge';

const { config } = useConfig();
const { enableSaveButton, showModalFooter } = useHomebridge();

const hasChildBridgeEnabled = computed(() => Boolean(config.value?._bridge?.username));

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
  <Callout
    v-if="hasChildBridgeEnabled"
    class="mb-3"
    state="warning"
    text="This plugin already publishes devices as external accessories. Enabling the child bridge option for this plugin is unnecessary, and we recommend turning it off."
    icon="fa-exclamation-triangle"
  />

  <SmartThingsCard class="mb-4" />

  <Tabs v-slot="{ currentTab }" :tabs="tabs">
    <DevicesList v-if="currentTab === 'devices'" title="Devices" description="Samsung TVs currently added to this plugin configuration" />
    <InputsList v-else-if="currentTab === 'inputs'" title="Global Inputs" description="These inputs apply to all configured devices" />
    <SwitchesList v-else-if="currentTab === 'switches'" title="Global Switches" description="These switches apply to all configured devices" />
    <KeysForm v-else-if="currentTab === 'keys'" />
  </Tabs>

  <p class="text-center text-secondary small mt-3 mb-0">
    Access the <a href="https://tavicu.github.io/homebridge-samsung-tizen/" target="_blank">documentation</a> of the plugin to see all settings.
  </p>
</template>
