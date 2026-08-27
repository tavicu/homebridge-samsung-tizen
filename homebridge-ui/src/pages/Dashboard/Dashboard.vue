<script setup>
import DevicesList from '../../components/DevicesList/DevicesList.vue';
import InputsList from '../../components/InputsList/InputsList.vue';
import SmartThingsStatusCard from '../../components/SmartThingsStatusCard/SmartThingsStatusCard.vue';
import SwitchesList from '../../components/SwitchesList/SwitchesList.vue';
import { useRouter } from '../../composables/useRouter';
import { useDashboard } from './useDashboard';

const { config } = useDashboard();
const { navigateTo } = useRouter();
</script>

<template>
  <p class="small">
    Please read the
    <a href="https://tavicu.github.io/homebridge-samsung-tizen/" target="_blank">documentation</a>
    of the plugin for more informations and step by step instructions on how to configure it.
  </p>

  <div class="mb-4">
    <h5 class="fw-semibold mb-2">SmartThings Integration</h5>

    <SmartThingsStatusCard />
  </div>

  <div class="mb-5">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Devices</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('device')"><i class="fas fa-plus"></i> Add device</button>
    </div>

    <DevicesList />
  </div>

  <div class="mb-5">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Inputs</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('input')"><i class="fas fa-plus"></i> Add input</button>
    </div>

    <InputsList />
  </div>

  <div>
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h5 class="fw-semibold mb-0">Switches</h5>

      <button type="button" class="btn btn-primary" @click="navigateTo('switch')"><i class="fas fa-plus"></i> Add switch</button>
    </div>

    <SwitchesList />
  </div>
</template>
