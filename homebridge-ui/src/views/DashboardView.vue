<script setup>
import DevicesList from '../components/DevicesList.vue';
import InputsList from '../components/InputsList.vue';
import SmartThingsCard from '../components/SmartThingsCard.vue';
import SwitchesList from '../components/SwitchesList.vue';
import { useRouter } from '../composables/useRouter';

const { navigateTo } = useRouter();
</script>

<template>
  <p class="small">
    Please read the <a href="https://tavicu.github.io/homebridge-samsung-tizen/" target="_blank">documentation</a>
    of the plugin for more informations and step by step instructions on how to configure it.
  </p>

  <div class="mb-4">
    <h5 class="fw-semibold mb-2">SmartThings Integration</h5>

    <SmartThingsCard />
  </div>

  <div class="mb-5">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Devices</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('device', { action: 'add' })"><i class="fas fa-plus" /> Add device</button>
    </div>

    <DevicesList />
  </div>

  <div class="mb-5">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Inputs</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('input', { action: 'add' })"><i class="fas fa-plus" /> Add input</button>
    </div>

    <InputsList />
  </div>

  <div>
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Switches</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('switch', { action: 'add' })"><i class="fas fa-plus" /> Add switch</button>
    </div>

    <SwitchesList />
  </div>
</template>
