<template>
  <Dashboard v-if="currentPage === 'dashboard'" />
  <SmartThings v-else-if="currentPage === 'smartthings'" />
  <Device v-else-if="currentPage === 'device'" />
  <Input v-else-if="currentPage === 'input'" />
  <Switch v-else-if="currentPage === 'switch'" />
</template>

<script setup>
import { useRouter } from './composables/useRouter';
import Dashboard from './pages/Dashboard/Dashboard.vue';
import Device from './pages/Device/Device.vue';
import Input from './pages/Input/Input.vue';
import SmartThings from './pages/SmartThings/SmartThings.vue';
import Switch from './pages/Switch/Switch.vue';

const { currentPage } = useRouter();
</script>
