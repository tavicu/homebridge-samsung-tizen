<script setup>
import { ref } from 'vue';

defineProps({
  form: {
    type: Object,
    required: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  validated: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'invalid', 'cancel', 'delete']);
const formEl = ref(null);

function handleSubmit() {
  if (!formEl.value?.checkValidity()) {
    emit('invalid');
    return;
  }

  emit('submit');
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Device' : 'Add Device' }}</h6>
      <div class="text-muted">
        {{ isEdit ? `Edit the configuration of the device ${form.name}` : 'Configure a new Samsung TV for Homebridge control' }}
      </div>
    </div>

    <button v-if="isEdit" type="button" class="btn btn-outline-danger" @click="emit('delete')">Delete Device</button>
  </div>

  <div v-if="!isEdit" class="ht-callout callout-info mb-3">
    <div class="fw-semibold mb-1">Just fill in the essential details to add your TV</div>
    This initial step covers basic setup. Additional features (inputs, custom switches, power options) can be fully customized from the Edit Device
    menu after adding.
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div v-if="isEdit" class="card-header">Main Configuration</div>

    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Device Name <strong class="text-danger">*</strong></label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-control"
          name="name"
          placeholder="e.g. Living Room TV"
          pattern="^[a-zA-Z0-9 ]+$"
          required
        />
        <div class="invalid-feedback">Please enter a valid device name.</div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="ipAddress" class="form-label">IP Address <strong class="text-danger">*</strong></label>
          <input
            id="ipAddress"
            v-model="form.ip"
            type="text"
            class="form-control"
            name="ipAddress"
            placeholder="e.g. 192.168.1.100"
            pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            required
          />
          <div class="invalid-feedback">Please enter a valid IP address</div>
          <small class="form-text text-muted">The IP address of your Samsung TV</small>
        </div>

        <div class="col-md-6">
          <label for="macAddress" class="form-label">MAC Address <strong class="text-danger">*</strong></label>
          <input
            id="macAddress"
            v-model="form.mac"
            type="text"
            class="form-control"
            name="macAddress"
            placeholder="e.g. AA:BB:CC:DD:EE:FF"
            pattern="([0-9a-fA-F]{2}(:|-)){5}[0-9a-fA-F]{2}"
            required
          />
          <div class="invalid-feedback">Please enter a valid MAC address</div>
          <small class="form-text text-muted">The MAC address of your Samsung TV</small>
        </div>
      </div>

      <hr class="my-4 text-muted" />

      <div class="mb-3">
        <label for="deviceId" class="form-label">SmartThings Device ID <span class="text-muted">(optional)</span></label>
        <input
          id="deviceId"
          v-model="form.deviceId"
          type="text"
          class="form-control"
          name="deviceId"
          placeholder="e.g. d3b4f9a1-22cc-4e1f-b8aa-0011aabbccdd"
          pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        />
        <div class="invalid-feedback">Please enter a valid SmartThings device ID</div>
      </div>

      <template v-if="isEdit">
        <div class="mb-3">
          <label for="uuid" class="form-label">UUID <span class="text-muted">(optional)</span></label>
          <input id="uuid" v-model="form.uuid" type="text" class="form-control" name="uuid" placeholder="e.g. AX1D" />
          <small class="form-text text-muted">If you have problems adding the TV to Home app, set this field to a unique value</small>
        </div>

        <hr class="my-4 text-muted" />

        <div>
          <label class="hb-uix-switch" for="option.Switch.DeviceName.Disable">
            <input
              id="option.Switch.DeviceName.Disable"
              v-model="form.disableSwitchDeviceName"
              type="checkbox"
              name="options[]"
              value="Switch.DeviceName.Disable"
            />
            <span>Disable prepending device name on custom switches</span>
            <span class="hb-uix-slider hb-uix-round"></span>
          </label>
        </div>
      </template>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Device' : 'Add Device' }} <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>
</template>

<style scoped>
.ht-callout {
  background: var(--bs-light);
  border: 1px solid #e7e9eb;
  border-left: 3px solid var(--bs-gray-200);
  border-radius: 0.375rem;
  padding: 0.7rem 0.875rem;
  font-size: 0.8rem;
  line-height: 1.25rem;
}

.ht-callout.callout-info {
  border-left-color: var(--bs-info);
}
</style>
