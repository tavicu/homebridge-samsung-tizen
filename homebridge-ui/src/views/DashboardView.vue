<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Callout from '../components/Callout.vue';
import DevicesList from '../components/DevicesList.vue';
import InputsList from '../components/InputsList.vue';
import KeysForm from '../components/KeysForm.vue';
import SmartThingsCard from '../components/SmartThingsCard.vue';
import SwitchesList from '../components/SwitchesList.vue';
import Tabs from '../components/Tabs.vue';
import { useConfig } from '../composables/useConfig';
import { useHomebridge } from '../composables/useHomebridge';

const { t } = useI18n();
const { config } = useConfig();
const { enableSaveButton, showModalFooter } = useHomebridge();

const hasChildBridgeEnabled = computed(() => Boolean(config.value?._bridge?.username));

const tabs = computed(() => [
  { id: 'devices', label: t('dashboard.tabs.devices.label') },
  { id: 'inputs', label: t('dashboard.tabs.inputs.label') },
  { id: 'switches', label: t('dashboard.tabs.switches.label') },
  { id: 'keys', label: t('dashboard.tabs.keys.label') },
]);

onMounted(() => {
  showModalFooter();
  enableSaveButton();
});
</script>

<template>
  <Callout v-if="hasChildBridgeEnabled" class="mb-3" state="warning" :text="$t('dashboard.childBridge')" icon="fa-exclamation-triangle" />

  <SmartThingsCard class="mb-4" />

  <Tabs v-slot="{ currentTab }" :tabs="tabs">
    <DevicesList v-if="currentTab === 'devices'" :title="$t('dashboard.tabs.devices.title')" :description="$t('dashboard.tabs.devices.description')" />
    <InputsList v-else-if="currentTab === 'inputs'" :title="$t('dashboard.tabs.inputs.title')" :description="$t('dashboard.tabs.inputs.description')" />
    <SwitchesList v-else-if="currentTab === 'switches'" :title="$t('dashboard.tabs.switches.title')" :description="$t('dashboard.tabs.switches.description')" />
    <KeysForm v-else-if="currentTab === 'keys'" />
  </Tabs>

  <p class="text-center text-secondary small mt-3 mb-0" v-html="$t('dashboard.documentation', { url: 'https://tavicu.github.io/homebridge-samsung-tizen/' })" />
</template>
