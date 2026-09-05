<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useDevice } from '../composables/useDevice';
import { useForm } from '../composables/useForm';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import { useToast } from '../composables/useToast';
import Callout from './Callout.vue';
import InputsList from './InputsList.vue';
import SwitchesList from './SwitchesList.vue';

const props = defineProps({
  action: {
    type: String,
    default: 'add',
  },
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config, updateConfig, cleanConfig } = useConfig();
const { isTesting, canTest, testConnection } = useDevice();
const { navigateTo, navigateBack } = useRouter();
const { getDevices } = useSmartThings();
const toast = useToast();

function normalizeMac(mac) {
  return mac?.toUpperCase().replaceAll('-', ':') || '';
}

const isEdit = computed(() => props.action === 'edit');

const { formEl, validated, checkValidity } = useForm();
const form = reactive({
  name: '',
  ip: '',
  mac: '',
  deviceId: '',
  uuid: '',
  options: [],
});

const stDevices = ref([]);
const testResult = ref(null);

const deviceIdSelect = computed({
  get() {
    return stDevices.value.some((device) => device.deviceId === form.deviceId) ? form.deviceId : 'other';
  },
  set(value) {
    form.deviceId = value === 'other' ? '' : value;
  },
});

function resetForm() {
  form.name = '';
  form.ip = '';
  form.mac = '';
  form.deviceId = '';
  form.uuid = '';
  form.options = [];
}

function fillForm(device) {
  form.name = device.name || '';
  form.ip = device.ip || '';
  form.mac = device.mac || '';
  form.deviceId = device.deviceId || device.device_id || '';
  form.uuid = device.uuid || '';
  form.options = Array.isArray(device.options) ? device.options : [];
}

function init() {
  validated.value = false;
  testResult.value = null;

  if (isEdit.value) {
    const device = config.value?.devices?.[props.deviceIndex];

    if (!device) {
      toast.error('Device not found');
      navigateTo('dashboard', { tab: 'devices' });
      return;
    }

    fillForm(device);
  } else {
    resetForm();
  }
}

onMounted(async () => {
  stDevices.value = await getDevices();
});

async function handleTestConnection() {
  if (!canTest(formEl.value?.ip)) {
    return;
  }

  const result = await testConnection(form.ip);

  testResult.value = result;

  if (!form.mac.trim() && result.reachable && result.mac) {
    form.mac = normalizeMac(result.mac);
  }
}

function buildDeviceData(existingDevice = {}) {
  const next = { ...existingDevice };

  Object.keys(form).forEach((key) => {
    delete next[key];
  });
  delete next.device_id;

  const data = {
    name: form.name,
    ip: form.ip,
    mac: normalizeMac(form.mac),
    deviceId: form.deviceId,
    uuid: form.uuid,
    options: form.options,
  };

  return cleanConfig({
    ...next,
    ...data,
  });
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  const currentDevices = config.value?.devices || [];
  const mac = normalizeMac(form.mac);
  const isDuplicate = currentDevices.some((device, index) => (!isEdit.value || index !== props.deviceIndex) && normalizeMac(device.mac) === mac);

  if (isDuplicate) {
    toast.error('A device with this MAC address already exists');
    return;
  }

  try {
    if (isEdit.value) {
      const updatedDevices = currentDevices.map((device, index) => (index === props.deviceIndex ? buildDeviceData(device) : device));
      await updateConfig({ devices: updatedDevices });

      toast.success('Device updated successfully');
    } else {
      const newDevice = buildDeviceData();
      await updateConfig({ devices: [...currentDevices, newDevice] });

      toast.success('Device added successfully');
    }

    navigateTo('dashboard', { tab: 'devices' });
  } catch {
    toast.error(isEdit.value ? 'Failed to update device' : 'Failed to add device');
  }
}

watch(
  () => [props.action, props.deviceIndex],
  () => init(),
  { immediate: true },
);

watch(
  () => form.ip,
  () => {
    testResult.value = null;
  },
);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Device' : 'Add Device' }}</h6>
      <div class="text-muted">
        {{ isEdit ? `Edit the configuration of the device ${form.name}` : 'Configure a new Samsung TV for Homebridge control' }}
      </div>
    </div>

    <div v-if="isEdit" class="d-flex gap-2 flex-shrink-0">
      <button type="button" class="btn btn-outline-secondary" @click="navigateTo('dashboard', { tab: 'devices' })">Back</button>
      <button type="button" class="btn btn-outline-danger" @click="navigateTo('device', { action: 'delete', deviceIndex })">Delete Device</button>
    </div>
  </div>

  <Callout
    v-if="!isEdit"
    class="mb-3"
    state="info"
    title="Just fill in the essential details to add your TV"
    text="This initial step covers basic setup. Additional features (inputs, custom switches, power options) can be fully customized from the Edit Device menu after adding."
  />

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div v-if="isEdit" class="card-header">Main Configuration</div>

    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Device Name</label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. Living Room TV" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid device name.</div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="ipAddress" class="form-label">IP Address</label>
          <input
            id="ipAddress"
            v-model="form.ip"
            name="ip"
            type="text"
            class="form-control"
            placeholder="e.g. 192.168.1.100"
            pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            required
          />
          <div class="invalid-feedback">Please enter a valid IP address</div>
          <small class="form-text text-muted">The IP address of your Samsung TV</small>
        </div>

        <div class="col-md-6">
          <label for="macAddress" class="form-label">MAC Address</label>
          <input
            id="macAddress"
            v-model="form.mac"
            type="text"
            class="form-control"
            placeholder="e.g. AA:BB:CC:DD:EE:FF"
            pattern="([0-9a-fA-F]{2}(:|-)){5}[0-9a-fA-F]{2}"
            required
          />
          <div class="invalid-feedback">Please enter a valid MAC address</div>
          <small class="form-text text-muted">The MAC address of your Samsung TV</small>
        </div>
      </div>

      <div class="mb-3">
        <button type="button" class="btn btn-outline-secondary" :disabled="!canTest(formEl?.ip)" @click="handleTestConnection">
          <i v-if="isTesting" class="fas fa-spinner fa-spin me-1" />
          {{ isTesting ? 'Testing...' : 'Test connection' }}
        </button>
      </div>

      <div v-if="testResult" class="mb-3" :class="testResult.reachable ? 'text-success' : 'text-danger'">{{ testResult.message }}</div>

      <hr class="my-4 text-muted" />

      <div class="mb-3">
        <label for="deviceId" class="form-label">SmartThings Device ID <span class="form-optional">Optional</span></label>

        <select v-if="stDevices.length" id="deviceId" v-model="deviceIdSelect" class="form-select mb-2">
          <option v-for="device in stDevices" :key="device.deviceId" :value="device.deviceId">{{ device.name }} ({{ device.deviceId }})</option>
          <option value="other">Other</option>
        </select>

        <input
          v-if="!stDevices.length || deviceIdSelect === 'other'"
          v-model="form.deviceId"
          type="text"
          class="form-control"
          placeholder="e.g. d3b4f9a1-22cc-4e1f-b8aa-0011aabbccdd"
          pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        />
        <div class="invalid-feedback">Please enter a valid SmartThings device ID</div>
      </div>

      <template v-if="isEdit">
        <div class="mb-3">
          <label for="uuid" class="form-label">UUID <span class="form-optional">Optional</span></label>
          <input id="uuid" v-model="form.uuid" type="text" class="form-control" placeholder="e.g. AX1D" />
          <small class="form-text text-muted">If you have problems adding the TV to Home app, set this field to a unique value</small>
        </div>

        <hr class="my-4 text-muted" />

        <div>
          <label class="hb-uix-switch" for="option.Device.Disable">
            <input id="option.Device.Disable" v-model="form.options" type="checkbox" value="Device.Disable" />
            <span>Disable device from processing</span>
            <span class="hb-uix-slider hb-uix-round" />
          </label>

          <label class="hb-uix-switch" for="option.Switch.DeviceName.Disable">
            <input id="option.Switch.DeviceName.Disable" v-model="form.options" type="checkbox" value="Switch.DeviceName.Disable" />
            <span>Disable prepending device name on custom switches</span>
            <span class="hb-uix-slider hb-uix-round" />
          </label>
        </div>
      </template>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="navigateBack('dashboard', { tab: 'devices' })">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Device' : 'Add Device' }} <i class="fas fa-arrow-right" /></button>
    </div>
  </form>

  <template v-if="isEdit">
    <div class="mt-4">
      <InputsList :device-index="deviceIndex" :description="`These inputs apply to ${form.name || 'this TV'} and are added on top of the global inputs`" />
    </div>
    <div class="mt-4">
      <SwitchesList :device-index="deviceIndex" :description="`These switches apply to ${form.name || 'this TV'} and are added on top of the global switches`" />
    </div>
  </template>
</template>
