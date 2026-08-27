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
  isDeviceScoped: {
    type: Boolean,
    default: false,
  },
  validated: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'invalid', 'cancel', 'delete', 'add-command', 'remove-command']);
const formEl = ref(null);

function handleSubmit() {
  if (!formEl.value?.checkValidity()) {
    emit('invalid');
    return;
  }

  emit('submit');
}

function handleRemoveCommand(index) {
  emit('remove-command', index);
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Input' : 'Add Input' }}</h6>
      <div class="text-muted">
        <template v-if="isEdit">Edit the configuration of the input {{ form.name }}</template>
        <template v-else-if="isDeviceScoped">Configure a new input for this device</template>
        <template v-else>Configure a new global input that applies to all devices</template>
      </div>
    </div>

    <button v-if="isEdit" type="button" class="btn btn-outline-danger" @click="emit('delete')">Delete Input</button>
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Input Name <strong class="text-danger">*</strong></label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-control"
          name="name"
          placeholder="e.g. YouTube"
          pattern="^[a-zA-Z0-9 ]+$"
          required
        />
        <div class="invalid-feedback">Please enter a valid input name.</div>
      </div>

      <div class="mb-3">
        <label for="type" class="form-label">Input Type <strong class="text-danger">*</strong></label>
        <select id="type" v-model="form.type" class="form-select" name="type" required>
          <option disabled value="">Choose input type ...</option>
          <option value="input">Input</option>
          <option value="app">Application</option>
          <option value="command">Command</option>
        </select>
        <div class="invalid-feedback">Please choose an input type.</div>
      </div>

      <div v-show="form.type === 'input'">
        <label for="value-input" class="form-label">Input Value <strong class="text-danger">*</strong></label>
        <input
          id="value-input"
          v-model="form.valueInput"
          type="text"
          class="form-control"
          name="value"
          placeholder="e.g. digitalTv"
          :required="form.type === 'input'"
          :disabled="form.type !== 'input'"
        />
        <div class="invalid-feedback">Please enter a valid input value.</div>
        <small class="form-text text-muted">
          This type of input requires a SmartThings connection. Possible values for this input type: digitalTv, USB, HDMI1, HDMI2, HDMI3, HDMI4,
          HDMI5, HDMI6
        </small>
      </div>

      <div v-show="form.type === 'app'">
        <label for="value-app" class="form-label">Application ID <strong class="text-danger">*</strong></label>
        <input
          id="value-app"
          v-model="form.valueApp"
          type="text"
          class="form-control"
          name="value"
          placeholder="e.g. 111299001912"
          pattern="^[0-9]+$"
          inputmode="numeric"
          :required="form.type === 'app'"
          :disabled="form.type !== 'app'"
        />
        <div class="invalid-feedback">Please enter a valid application ID.</div>
        <small class="form-text text-muted">You can find a list with available application IDs over here.</small>
      </div>

      <div v-show="form.type === 'command'">
        <label class="form-label">Key(s) to execute <strong class="text-danger">*</strong></label>
        <div class="d-flex flex-column gap-2">
          <div v-for="(_, index) in form.commands" :key="index" class="input-group">
            <input
              v-model="form.commands[index]"
              type="text"
              name="command[]"
              class="form-control font-monospace text-uppercase"
              placeholder="e.g. KEY_VOLUP"
              :required="form.type === 'command'"
              :disabled="form.type !== 'command'"
            />
            <button type="button" class="btn btn-outline-danger" @click="handleRemoveCommand(index)">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary mt-2" @click="emit('add-command')"><i class="fas fa-plus"></i> Add Command</button>
      </div>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Input' : 'Add Input' }} <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>
</template>
