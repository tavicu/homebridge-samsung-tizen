<script setup>
import { computed, reactive, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';

const props = defineProps({
  action: {
    type: String,
    default: 'add',
  },
  inputIndex: {
    type: Number,
    default: undefined,
  },
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

function createCommand(value = '') {
  return { id: crypto.randomUUID(), value };
}

function toCommands(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => createCommand(String(item).trim())) : [createCommand()];
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => createCommand(item.trim()));
  }

  return [createCommand()];
}

const { config, updateConfig, cleanConfig } = useConfig();
const { navigateTo } = useRouter();
const toast = useToast();

const isEdit = computed(() => props.action === 'edit');
const isDeviceScoped = computed(() => props.deviceIndex !== undefined);

const { formEl, validated, checkValidity } = useForm();
const form = reactive({
  name: '',
  type: '',
  valueInput: '',
  valueApp: '',
  commands: [createCommand()],
});

function resetForm() {
  form.name = '';
  form.type = '';
  form.valueInput = '';
  form.valueApp = '';
  form.commands = [createCommand()];
}

function fillForm(input) {
  form.name = input.name || '';
  form.type = input.type || '';
  form.valueInput = input.type === 'input' ? String(input.value || '') : '';
  form.valueApp = input.type === 'app' ? String(input.value || '') : '';
  form.commands = input.type === 'command' ? toCommands(input.value) : [createCommand()];
}

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateTo('device', { action: 'edit', deviceIndex: props.deviceIndex });
    return;
  }

  navigateTo('dashboard', { tab: 'inputs' });
}

function getCurrentInputs() {
  if (props.deviceIndex !== undefined) {
    return config.value.devices?.[props.deviceIndex]?.inputs || [];
  }

  return config.value.inputs || [];
}

function init() {
  validated.value = false;

  if (isEdit.value) {
    const input = getCurrentInputs()[props.inputIndex];

    if (!input) {
      toast.error('Input not found');
      goBack();
      return;
    }

    fillForm(input);
  } else {
    resetForm();
  }
}

function buildInputData() {
  let value;

  if (form.type === 'command') {
    value = form.commands.map((item) => item.value.trim()).filter(Boolean);
  } else if (form.type === 'app') {
    value = form.valueApp.trim();
  } else {
    value = form.valueInput.trim();
  }

  return cleanConfig({
    name: form.name,
    type: form.type,
    value,
  });
}

async function persistInputs(nextInputs) {
  if (props.deviceIndex !== undefined) {
    const updatedDevices = (config.value.devices || []).map((item, index) => {
      if (index !== props.deviceIndex) {
        return item;
      }

      return {
        ...item,
        inputs: nextInputs,
      };
    });

    await updateConfig({ devices: updatedDevices });
  } else {
    await updateConfig({ inputs: nextInputs });
  }
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  const inputData = buildInputData();

  try {
    if (isEdit.value) {
      const updatedInputs = getCurrentInputs().map((input, index) => (index === props.inputIndex ? inputData : input));
      await persistInputs(updatedInputs);

      toast.success('Input updated successfully');
    } else {
      await persistInputs([...getCurrentInputs(), inputData]);

      toast.success('Input added successfully');
    }

    goBack();
  } catch {
    toast.error(isEdit.value ? 'Failed to edit input' : 'Failed to add input');
  }
}

function addCommand() {
  form.commands.push(createCommand());
}

function removeCommand(id) {
  if (form.commands.length === 1) {
    form.commands[0].value = '';
    return;
  }

  form.commands = form.commands.filter((command) => command.id !== id);
}

watch(
  () => [props.action, props.inputIndex, props.deviceIndex],
  () => init(),
  { immediate: true },
);
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

    <button v-if="isEdit" type="button" class="btn btn-outline-danger" @click="navigateTo('input', { action: 'delete', inputIndex, deviceIndex })">Delete Input</button>
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Input Name <strong class="text-danger">*</strong></label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. YouTube" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid input name.</div>
      </div>

      <div class="mb-3">
        <label for="type" class="form-label">Input Type <strong class="text-danger">*</strong></label>
        <select id="type" v-model="form.type" class="form-select" required>
          <option disabled value="">Choose input type ...</option>
          <option value="input">Input</option>
          <option value="app">Application</option>
          <option value="command">Command</option>
        </select>
        <div class="invalid-feedback">Please choose an input type.</div>
      </div>

      <div v-if="form.type === 'input'">
        <label for="value-input" class="form-label">Input Source <strong class="text-danger">*</strong></label>
        <select id="value-input" v-model="form.valueInput" class="form-select" required>
          <option disabled value="">Choose input source ...</option>
          <option value="digitalTv">Digital TV</option>
          <option value="HDMI1">HDMI 1</option>
          <option value="HDMI2">HDMI 2</option>
          <option value="HDMI3">HDMI 3</option>
          <option value="HDMI4">HDMI 4</option>
          <option value="HDMI5">HDMI 5</option>
          <option value="HDMI6">HDMI 6</option>
          <option value="USB">USB</option>
          <option value="USB-C">USB-C</option>
          <option value="Display Port">Display Port</option>
        </select>
        <div class="invalid-feedback">Please choose an input source.</div>
        <small class="form-text text-muted">Requires a SmartThings connection.</small>
      </div>

      <div v-if="form.type === 'app'">
        <label for="value-app" class="form-label">Application ID <strong class="text-danger">*</strong></label>
        <input id="value-app" v-model="form.valueApp" type="text" class="form-control" placeholder="e.g. 111299001912" pattern="^[0-9]+$" inputmode="numeric" required />
        <div class="invalid-feedback">Please enter a valid application ID.</div>
        <small class="form-text text-muted">
          You can find a list of available application IDs in the
          <a href="https://tavicu.github.io/homebridge-samsung-tizen/extra/applications.html" target="_blank" rel="noopener noreferrer">documentation</a>.
        </small>
      </div>

      <div v-if="form.type === 'command'">
        <label class="form-label">Key(s) to execute <strong class="text-danger">*</strong></label>
        <div class="d-flex flex-column gap-2">
          <div v-for="command in form.commands" :key="command.id" class="input-group">
            <input v-model="command.value" type="text" class="form-control font-monospace text-uppercase" placeholder="e.g. KEY_VOLUP" required />
            <button type="button" class="btn btn-outline-danger" @click="removeCommand(command.id)">
              <i class="fas fa-xmark" />
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary mt-2" @click="addCommand"><i class="fas fa-plus" /> Add Command</button>
        <small class="form-text text-muted d-block mt-2"> Repeat a key with <code>KEY_VOLUP*3</code>. Hold it with <code>KEY_POWER*2.5s</code> (time in seconds). </small>
      </div>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="goBack">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Input' : 'Add Input' }} <i class="fas fa-arrow-right" /></button>
    </div>
  </form>
</template>
