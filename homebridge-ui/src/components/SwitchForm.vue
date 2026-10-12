<script setup>
import { computed, watch } from 'vue';
import SwitchesIcon from '../assets/icons/switches.svg';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import { createCommand, fromCommandRows, toCommandRows } from '../lib/command';
import ApplicationSelect from './ApplicationSelect.vue';
import Callout from './Callout.vue';
import CommandsField from './CommandsField.vue';
import DocsLink from './DocsLink.vue';
import InputSourceSelect from './InputSourceSelect.vue';
import PictureModeSelect from './PictureModeSelect.vue';
import SmartThingsNotice from './SmartThingsNotice.vue';
import SoundModeSelect from './SoundModeSelect.vue';

const props = defineProps({
  action: {
    type: String,
    default: 'add',
  },
  switchIndex: {
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
  power: false,
  sleep: '',
  mute: '',
  volume: '',
  app: '',
  input: '',
  channel: '',
  picture_mode: '',
  sound_mode: '',
  commands: [createCommand()],
});

function hasAnyAction() {
  return (
    form.power ||
    form.mute !== '' ||
    form.sleep !== '' ||
    form.volume !== '' ||
    form.app.trim() !== '' ||
    form.input.trim() !== '' ||
    form.channel !== '' ||
    form.picture_mode.trim() !== '' ||
    form.sound_mode.trim() !== '' ||
    form.commands.some((command) => command.value.trim() !== '')
  );
}

function fillForm(switchItem = {}) {
  form.name = switchItem.name || '';
  form.power = !!switchItem.power;
  form.sleep = switchItem.sleep !== undefined && switchItem.sleep !== null ? String(switchItem.sleep) : '';
  form.mute = switchItem.mute === true ? 'mute' : switchItem.mute === false ? 'unmute' : '';
  form.volume = switchItem.volume !== undefined && switchItem.volume !== null ? String(switchItem.volume) : '';
  form.app = switchItem.app != null ? String(switchItem.app) : '';
  form.input = switchItem.input || '';
  form.channel = switchItem.channel !== undefined && switchItem.channel !== null ? String(switchItem.channel) : '';
  form.picture_mode = switchItem.picture_mode || '';
  form.sound_mode = switchItem.sound_mode || '';
  form.commands = switchItem.command !== undefined ? toCommandRows(switchItem.command) : [createCommand()];
  markPristine();
}

function getCurrentSwitches() {
  if (props.deviceIndex !== undefined) {
    return device.value?.switches || [];
  }

  return config.value.switches || [];
}

function goBack() {
  navigateBack(...parentRoute('switches', props.deviceIndex));
}

function init() {
  validated.value = false;

  if (isEdit.value) {
    const switchItem = getCurrentSwitches()[props.switchIndex];

    if (!switchItem) {
      toast.error('Switch not found');
      goBack();
      return;
    }

    fillForm(switchItem);
  } else {
    fillForm();
  }
}

function buildSwitchData() {
  const commands = fromCommandRows(form.commands);

  return cleanConfig({
    name: form.name,
    power: form.power || undefined,
    sleep: form.sleep !== '' ? Number(form.sleep) : undefined,
    mute: form.mute === 'mute' ? true : form.mute === 'unmute' ? false : undefined,
    volume: form.volume !== '' ? Number(form.volume) : undefined,
    app: form.app,
    input: form.input,
    channel: form.channel !== '' ? Number(form.channel) : undefined,
    picture_mode: form.picture_mode,
    sound_mode: form.sound_mode,
    command: commands.length > 0 ? commands : undefined,
  });
}

function handleReset() {
  const switchItem = getCurrentSwitches()[props.switchIndex];

  if (!switchItem) {
    return;
  }

  validated.value = false;
  fillForm(switchItem);
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  if (!hasAnyAction()) {
    validated.value = true;
    toast.error('Please configure at least one switch action');
    return;
  }

  const switchData = buildSwitchData();

  try {
    if (isEdit.value) {
      const updatedSwitches = getCurrentSwitches().map((item, index) => (index === props.switchIndex ? switchData : item));
      await updateScoped('switches', props.deviceIndex, updatedSwitches);

      toast.success('Switch updated successfully.');
    } else {
      await updateScoped('switches', props.deviceIndex, [...getCurrentSwitches(), switchData]);

      toast.success('Switch added successfully.');
    }

    goBack();
  } catch {
    toast.error(isEdit.value ? 'Failed to edit switch' : 'Failed to add switch');
  }
}

const submit = withSaving(handleSubmit);

watch(
  () => [props.action, props.switchIndex, props.deviceIndex],
  () => init(),
  { immediate: true },
);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
    <div class="page-title">
      <div class="page-title-icon d-xs-none">
        <SwitchesIcon />
      </div>
      <div>
        <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Switch' : 'Add Switch' }}</h6>
        <div class="text-muted">
          <template v-if="isEdit">
            Update the configuration for <span class="fw-semibold">{{ form.name }}</span> switch
          </template>
          <template v-else-if="deviceIndex !== undefined">Configure a new switch for this device</template>
          <template v-else>Configure a new global switch that applies to all devices</template>
        </div>
      </div>
    </div>

    <div v-if="isEdit" class="d-flex flex-column flex-sm-row gap-2 flex-shrink-0">
      <button type="button" class="btn btn-outline-secondary" @click="goBack">Back</button>
      <button type="button" class="btn btn-outline-danger" @click="navigateTo('switch', { action: 'delete', switchIndex, deviceIndex })">Delete Switch</button>
    </div>
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="submit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">Switch Configuration <DocsLink path="switches" /></h6>
      <p class="small text-secondary mt-1">The name shown in HomeKit, and whether the TV should be turned on first</p>
    </div>

    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Switch Name</label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. Evening Mode" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid switch name.</div>
      </div>

      <div>
        <div class="form-check form-switch">
          <input id="power" v-model="form.power" class="form-check-input" type="checkbox" role="switch" />
          <label class="form-check-label" for="power">Power on TV before running actions</label>
        </div>
        <small class="form-text text-muted">If enabled, the TV is turned on first when this switch is activated.</small>
      </div>
    </div>

    <div class="card-header">
      <h6 class="fw-semibold mb-0">Actions</h6>
      <p class="small text-secondary mt-1">A switch can run multiple actions at once — for example set volume, then open an app</p>
    </div>

    <div class="card-body">
      <div class="mb-3">
        <div class="form-label">Mute</div>
        <div class="btn-group btn-group-sm">
          <input id="mute-none" v-model="form.mute" class="btn-check" type="radio" name="mute" value="" />
          <label class="btn btn-outline-primary" for="mute-none">None</label>

          <input id="mute-on" v-model="form.mute" class="btn-check" type="radio" name="mute" value="mute" />
          <label class="btn btn-outline-primary" for="mute-on">Mute</label>

          <input id="mute-off" v-model="form.mute" class="btn-check" type="radio" name="mute" value="unmute" />
          <label class="btn btn-outline-primary" for="mute-off">Unmute</label>
        </div>
        <small class="form-text text-muted d-block">Choose whether this switch should control the TV mute status.</small>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="sleep" class="form-label">Sleep</label>
          <div class="input-group">
            <input id="sleep" v-model="form.sleep" type="number" class="form-control" min="1" step="1" placeholder="e.g. 60" />
            <span class="input-group-text">minutes</span>
          </div>
          <small class="form-text text-muted">Turn the TV off after the given number of minutes.</small>
        </div>

        <div class="col-md-6">
          <label for="volume" class="form-label">Volume</label>
          <input id="volume" v-model="form.volume" type="number" class="form-control" min="0" max="100" step="1" placeholder="e.g. 10" />
          <small class="form-text text-muted">Sets the speaker volume from 0 to 100.</small>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="app" class="form-label">Application ID</label>

          <ApplicationSelect id="app" v-model="form.app" :device-index="deviceIndex" />
          <small class="form-text text-muted">
            Opens the selected application. See the
            <DocsLink path="applications">application IDs list</DocsLink>.
          </small>
        </div>
        <div class="col-md-6">
          <label for="channel" class="form-label">Channel</label>
          <input id="channel" v-model="form.channel" type="number" class="form-control" min="1" step="1" placeholder="e.g. 13" />
          <small class="form-text text-muted">Tunes the TV to the given channel number.</small>
        </div>
      </div>

      <hr class="my-3" />

      <SmartThingsNotice class="mb-2" :device-index="deviceIndex" />

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="input" class="form-label">Input Source</label>
          <InputSourceSelect id="input" v-model="form.input" :device-index="deviceIndex" />
        </div>

        <div class="col-md-6">
          <label for="picture_mode" class="form-label">Picture Mode</label>
          <PictureModeSelect id="picture_mode" v-model="form.picture_mode" :device-index="deviceIndex" />
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <label for="sound_mode" class="form-label">Sound Mode</label>
          <SoundModeSelect id="sound_mode" v-model="form.sound_mode" :device-index="deviceIndex" />
        </div>
      </div>
    </div>

    <div class="card-header">
      <h6 class="fw-semibold mb-0">Remote Commands <DocsLink path="commands" /></h6>
      <p class="small text-secondary mt-1">Send one or more remote keys after the other actions</p>
    </div>

    <div class="card-body">
      <Callout class="callout-sm mb-2"
        >You can repeat a command with <code class="fw-semibold">KEY_VOLUP*3</code> and hold a key by using <code class="fw-semibold">KEY_POWER*2.5s</code>.</Callout
      >

      <CommandsField v-model="form.commands" />
    </div>

    <div class="card-footer">
      <button v-if="!isEdit" type="button" class="btn btn-outline-secondary" @click="goBack">Cancel</button>
      <small v-else class="small text-muted">Changes are saved to your config file instantly.</small>

      <div class="card-actions">
        <button v-if="isEdit" type="button" class="btn btn-outline-secondary" :disabled="!isDirty" @click="handleReset">Reset</button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving || (isEdit && !isDirty)">
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" />
          {{ isEdit ? 'Save Switch' : 'Add Switch' }}
        </button>
      </div>
    </div>
  </form>
</template>
