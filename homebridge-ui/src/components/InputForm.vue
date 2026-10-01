<script setup>
import { computed, watch } from 'vue';
import InputsIcon from '../assets/icons/inputs.svg';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import { createCommand, fromCommandRows, toCommandRows } from '../lib/command';
import { INPUT_TYPES } from '../lib/device';
import ApplicationSelect from './ApplicationSelect.vue';
import CommandsField from './CommandsField.vue';
import DocsLink from './DocsLink.vue';
import InputSourceSelect from './InputSourceSelect.vue';
import SmartThingsNotice from './SmartThingsNotice.vue';

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

const { config, updateScoped, cleanConfig } = useConfig();
const { navigateTo, navigateBack, parentRoute } = useRouter();
const toast = useToast();
const { formEl, validated, checkValidity, createForm, isDirty, isSaving, markPristine, withSaving } = useForm();

const isEdit = computed(() => props.action === 'edit');
const device = computed(() => (props.deviceIndex === undefined ? undefined : config.value.devices?.[props.deviceIndex]));

const form = createForm({
  name: '',
  type: '',
  valueInput: '',
  valueApp: '',
  commands: [createCommand()],
});

function fillForm(input = {}) {
  form.name = input.name || '';
  form.type = input.type || '';
  form.valueInput = input.type === 'input' ? String(input.value || '') : '';
  form.valueApp = input.type === 'app' ? String(input.value || '') : '';
  form.commands = input.type === 'command' ? toCommandRows(input.value) : [createCommand()];
  markPristine();
}

function getCurrentInputs() {
  if (props.deviceIndex !== undefined) {
    return device.value?.inputs || [];
  }

  return config.value.inputs || [];
}

function goBack() {
  navigateBack(...parentRoute('inputs', props.deviceIndex));
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
    fillForm();
  }
}

function buildInputData() {
  let value;

  if (form.type === 'command') {
    value = fromCommandRows(form.commands);
  } else if (form.type === 'app') {
    value = form.valueApp.trim();
  } else if (form.type === 'input') {
    value = form.valueInput.trim();
  }

  return cleanConfig({
    name: form.name,
    type: form.type,
    value,
  });
}

function handleReset() {
  const input = getCurrentInputs()[props.inputIndex];

  if (!input) {
    return;
  }

  validated.value = false;
  fillForm(input);
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  const inputData = buildInputData();

  try {
    if (isEdit.value) {
      const updatedInputs = getCurrentInputs().map((input, index) => (index === props.inputIndex ? inputData : input));
      await updateScoped('inputs', props.deviceIndex, updatedInputs);

      toast.success('Input updated successfully.');
    } else {
      await updateScoped('inputs', props.deviceIndex, [...getCurrentInputs(), inputData]);

      toast.success('Input added successfully.');
    }

    goBack();
  } catch {
    toast.error(isEdit.value ? 'Failed to edit input' : 'Failed to add input');
  }
}

const submit = withSaving(handleSubmit);

watch(
  () => [props.action, props.inputIndex, props.deviceIndex],
  () => init(),
  { immediate: true },
);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
    <div class="page-title">
      <div class="page-title-icon d-xs-none">
        <InputsIcon />
      </div>
      <div>
        <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Input' : 'Add Input' }}</h6>
        <div class="text-muted">
          <template v-if="isEdit">
            Update the configuration for <span class="fw-semibold">{{ form.name }}</span> input
          </template>
          <template v-else-if="deviceIndex !== undefined">Configure a new input for this device</template>
          <template v-else>Configure a new global input that applies to all devices</template>
        </div>
      </div>
    </div>

    <div v-if="isEdit" class="d-flex flex-column flex-sm-row gap-2 flex-shrink-0">
      <button type="button" class="btn btn-outline-secondary" @click="goBack">Back</button>
      <button type="button" class="btn btn-outline-danger" @click="navigateTo('input', { action: 'delete', inputIndex, deviceIndex })">Delete Input</button>
    </div>
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="submit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">Input Configuration <DocsLink path="inputs" /></h6>
      <p class="small text-secondary mt-1">Name this input and choose what it should do when selected</p>
    </div>

    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Input Name</label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. YouTube" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid input name.</div>
      </div>

      <div class="mb-3">
        <label for="type" class="form-label">Input Type</label>
        <select id="type" v-model="form.type" class="form-select" required>
          <option disabled value="">Choose input type ...</option>
          <option v-for="inputType in INPUT_TYPES" :key="inputType.id" :value="inputType.id">{{ inputType.name }}</option>
        </select>
        <div class="invalid-feedback">Please choose an input type.</div>
        <small v-if="form.type === 'artmode'" class="form-text text-muted">
          This input type is only useful on Frame TVs. It does not need a value.
          <DocsLink path="artModeInput">Learn more</DocsLink>
        </small>
      </div>

      <div v-if="form.type === 'input'">
        <label for="value-input" class="form-label">Input Source</label>
        <InputSourceSelect id="value-input" v-model="form.valueInput" :device-index="deviceIndex" placeholder="Choose input source ..." required />
        <div class="invalid-feedback">Please choose an input source.</div>
        <SmartThingsNotice class="mt-2" :device-index="deviceIndex" />
      </div>

      <div v-if="form.type === 'app'">
        <label for="value-app" class="form-label">Application ID</label>

        <ApplicationSelect id="value-app" v-model="form.valueApp" :device-index="deviceIndex" required />
        <div class="invalid-feedback">Please enter a valid application ID.</div>
        <small class="form-text text-muted">
          You can find a list of available application IDs in the
          <DocsLink path="applications">documentation</DocsLink>.
        </small>
      </div>

      <div v-if="form.type === 'command'">
        <CommandsField v-model="form.commands" required />
        <small class="form-text d-block text-muted mt-2">
          You can repeat a command with <code class="fw-semibold">KEY_VOLUP*3</code> and hold a key by using <code class="fw-semibold">KEY_POWER*2.5s</code>.
          <DocsLink path="commands">See all commands</DocsLink>
        </small>
      </div>
    </div>

    <div class="card-footer">
      <button v-if="!isEdit" type="button" class="btn btn-outline-secondary" @click="goBack">Cancel</button>
      <small v-else class="small text-muted">Changes are saved to your config file instantly.</small>

      <div class="card-actions">
        <button v-if="isEdit" type="button" class="btn btn-outline-secondary" :disabled="!isDirty" @click="handleReset">Reset</button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving || (isEdit && !isDirty)">
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" />
          {{ isEdit ? 'Save Input' : 'Add Input' }}
        </button>
      </div>
    </div>
  </form>
</template>
