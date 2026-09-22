<script setup>
import { computed } from 'vue';
import Callout from './components/Callout.vue';
import { useConfig } from './composables/useConfig';
import { useRouter } from './composables/useRouter';
import DashboardView from './views/DashboardView.vue';
import DeviceView from './views/DeviceView.vue';
import InputView from './views/InputView.vue';
import SmartThingsView from './views/SmartThingsView.vue';
import SwitchView from './views/SwitchView.vue';

const { restartRequired } = useConfig();
const { currentView } = useRouter();

const routes = {
  dashboard: DashboardView,
  device: DeviceView,
  input: InputView,
  switch: SwitchView,
  smartthings: SmartThingsView,
};

const activeComponent = computed(() => routes[currentView.value]);
</script>

<template>
  <Callout v-if="restartRequired" class="callout-sm mb-3" role="status" state="warning" text="Restart Homebridge for the changes to take effect." icon="fa-arrows-rotate" />

  <component :is="activeComponent" />
</template>
