<script setup>
import { computed } from 'vue';
import { useRouter } from './composables/useRouter';
import DashboardView from './views/DashboardView.vue';
import DeviceView from './views/DeviceView.vue';
import InputView from './views/InputView.vue';
import SmartThingsView from './views/SmartThingsView.vue';
import SwitchView from './views/SwitchView.vue';

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
  <component :is="activeComponent" />
</template>
