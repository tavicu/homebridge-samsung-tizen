<script setup>
import { computed, watch } from 'vue';
import SwitchesIcon from '../assets/icons/switches.svg';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import Callout from './Callout.vue';

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
const { navigateTo, navigateBack } = useRouter();
const toast = useToast();

const isEdit = computed(() => props.action === 'edit');
const isDeviceScoped = computed(() => props.deviceIndex !== undefined);

const { formEl, validated, checkValidity, createForm, isDirty, markPristine } = useForm();
const form = createForm({
  name: '',
  power: false,
  sleep: '',
  mute: false,
  volume: '',
  app: '',
  input: '',
  channel: '',
  picture_mode: '',
  commands: [createCommand()],
});

function hasAnyAction() {
  return (
    form.power ||
    form.mute ||
    form.sleep !== '' ||
    form.volume !== '' ||
    form.app.trim() !== '' ||
    form.input.trim() !== '' ||
    form.channel !== '' ||
    form.picture_mode.trim() !== '' ||
    form.commands.some((command) => command.value.trim() !== '')
  );
}

function fillForm(switchItem = {}) {
  form.name = switchItem.name || '';
  form.power = !!switchItem.power;
  form.sleep = switchItem.sleep !== undefined && switchItem.sleep !== null ? String(switchItem.sleep) : '';
  form.mute = !!switchItem.mute;
  form.volume = switchItem.volume !== undefined && switchItem.volume !== null ? String(switchItem.volume) : '';
  form.app = switchItem.app != null ? String(switchItem.app) : '';
  form.input = switchItem.input || '';
  form.channel = switchItem.channel !== undefined && switchItem.channel !== null ? String(switchItem.channel) : '';
  form.picture_mode = switchItem.picture_mode || '';
  form.commands = switchItem.command !== undefined ? toCommands(switchItem.command) : [createCommand()];
  markPristine();
}

function getCurrentSwitches() {
  if (props.deviceIndex !== undefined) {
    return config.value.devices?.[props.deviceIndex]?.switches || [];
  }

  return config.value.switches || [];
}

function init() {
  validated.value = false;

  if (isEdit.value) {
    const switchItem = getCurrentSwitches()[props.switchIndex];

    if (!switchItem) {
      toast.error('Switch not found');
      navigateBack('dashboard', { tab: 'switches' });
      return;
    }

    fillForm(switchItem);
  } else {
    fillForm();
  }
}

function buildSwitchData() {
  const commands = form.commands.map((item) => item.value.trim()).filter(Boolean);

  return cleanConfig({
    name: form.name,
    power: form.power || undefined,
    sleep: form.sleep !== '' ? Number(form.sleep) : undefined,
    mute: form.mute || undefined,
    volume: form.volume !== '' ? Number(form.volume) : undefined,
    app: form.app,
    input: form.input,
    channel: form.channel !== '' ? Number(form.channel) : undefined,
    picture_mode: form.picture_mode,
    command: commands.length > 0 ? commands : undefined,
  });
}

async function persistSwitches(nextSwitches) {
  if (props.deviceIndex !== undefined) {
    const updatedDevices = (config.value.devices || []).map((item, index) => {
      if (index !== props.deviceIndex) {
        return item;
      }

      return {
        ...item,
        switches: nextSwitches,
      };
    });

    await updateConfig({ devices: updatedDevices });
  } else {
    await updateConfig({ switches: nextSwitches });
  }
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
      await persistSwitches(updatedSwitches);

      toast.success('Switch updated successfully');
    } else {
      await persistSwitches([...getCurrentSwitches(), switchData]);

      toast.success('Switch added successfully');
    }

    navigateBack('dashboard', { tab: 'switches' });
  } catch {
    toast.error(isEdit.value ? 'Failed to edit switch' : 'Failed to add switch');
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
  () => [props.action, props.switchIndex, props.deviceIndex],
  () => init(),
  { immediate: true },
);
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div class="page-title">
      <div class="page-title-icon text-muted">
        <SwitchesIcon />
      </div>
      <div>
        <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Switch' : 'Add Switch' }}</h6>
        <div class="text-muted">
          <template v-if="isEdit">
            Update the configuration for <span class="fw-semibold">{{ form.name }}</span> switch
          </template>
          <template v-else-if="isDeviceScoped">Configure a new switch for this device</template>
          <template v-else>Configure a new global switch that applies to all devices</template>
        </div>
      </div>
    </div>

    <div v-if="isEdit" class="d-flex gap-2 flex-shrink-0">
      <button type="button" class="btn btn-outline-secondary" @click="navigateBack('dashboard', { tab: 'switches' })">Back</button>
      <button type="button" class="btn btn-outline-danger" @click="navigateTo('switch', { action: 'delete', switchIndex, deviceIndex })">Delete Switch</button>
    </div>
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">Switch Configuration</h6>
      <p class="small text-secondary mt-1">The name shown in HomeKit, and whether the TV should be turned on first</p>
    </div>

    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Switch Name</label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. Evening Mode" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid switch name.</div>
      </div>

      <div>
        <label class="hb-uix-switch mb-0" for="power">
          <input id="power" v-model="form.power" type="checkbox" />
          <span>Power on TV before running actions</span>
          <span class="hb-uix-slider hb-uix-round" />
        </label>
        <small class="form-text text-muted d-block">If enabled, the TV is turned on first when this switch is activated.</small>
      </div>
    </div>

    <div class="card-header">
      <h6 class="fw-semibold mb-0">Actions</h6>
      <p class="small text-secondary mt-1">A switch can run multiple actions at once — for example set volume, then open an app</p>
    </div>

    <div class="card-body">
      <div class="mb-3">
        <label class="hb-uix-switch mb-0" for="mute">
          <input id="mute" v-model="form.mute" type="checkbox" />
          <span>Mute</span>
          <span class="hb-uix-slider hb-uix-round" />
        </label>
        <small class="form-text text-muted d-block">Sends the mute toggle command to the TV.</small>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="sleep" class="form-label">Sleep <span class="text-muted">(minutes)</span></label>
          <input id="sleep" v-model="form.sleep" type="number" class="form-control" min="1" step="1" placeholder="e.g. 60" />
          <small class="form-text text-muted">Turn the TV off after the given number of minutes.</small>
        </div>

        <div class="col-md-6">
          <label for="volume" class="form-label">Volume <span class="form-optional">Optional</span></label>
          <input id="volume" v-model="form.volume" type="number" class="form-control" min="0" max="100" step="1" placeholder="e.g. 10" />
          <small class="form-text text-muted">Requires SmartThings. Sets the speaker volume.</small>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="app" class="form-label">Application ID <span class="form-optional">Optional</span></label>
          <input id="app" v-model="form.app" type="text" class="form-control" placeholder="e.g. 111299001912" pattern="^[0-9]+$" inputmode="numeric" />
          <small class="form-text text-muted">
            Opens the selected application. See the
            <a href="https://tavicu.github.io/homebridge-samsung-tizen/extra/applications.html" target="_blank" rel="noopener noreferrer">application IDs list</a>.
          </small>
        </div>
        <div class="col-md-6">
          <label for="channel" class="form-label">Channel <span class="form-optional">Optional</span></label>
          <input id="channel" v-model="form.channel" type="number" class="form-control" min="1" step="1" placeholder="e.g. 13" />
        </div>
      </div>

      <hr class="mx-2 my-3" />

      <Callout class="callout-sm mb-2" state="warning">These actions require a SmartThings integration.</Callout>

      <div class="row">
        <div class="col-md-6">
          <label for="input" class="form-label">Input Source <span class="form-optional">Optional</span></label>
          <select id="input" v-model="form.input" class="form-select">
            <option value="">None</option>
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
        </div>

        <div class="col-md-6">
          <label for="picture_mode" class="form-label">Picture Mode <span class="form-optional">Optional</span></label>
          <input id="picture_mode" v-model="form.picture_mode" type="text" class="form-control" placeholder="e.g. movie" />
        </div>
      </div>
    </div>

    <div class="card-header">
      <h6 class="fw-semibold mb-0">Remote Commands</h6>
      <p class="small text-secondary mt-1">Send one or more remote keys after the other actions</p>
    </div>

    <div class="card-body">
      <Callout class="callout-sm mb-2">You can repeat a command with <code class="fw-semibold">KEY_VOLUP*3</code> and hold a key by using <code class="fw-semibold">KEY_POWER*2.5s</code>.</Callout>

      <label class="form-label">Key(s) to execute <span class="form-optional">Optional</span></label>
      <div class="d-flex flex-column gap-2">
        <div v-for="command in form.commands" :key="command.id" class="input-group input-group-sm">
          <input v-model="command.value" type="text" class="form-control font-monospace text-uppercase" placeholder="e.g. KEY_VOLUP" />
          <button type="button" class="btn btn-outline-danger" @click="removeCommand(command.id)">
            <i class="fas fa-xmark" />
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addCommand"><i class="fas fa-plus" /> Add Command</button>
    </div>

    <div class="card-footer">
      <button v-if="!isEdit" type="button" class="btn btn-outline-secondary" @click="navigateBack('dashboard', { tab: 'switches' })">Cancel</button>
      <small v-else class="small text-muted">Changes are saved to your config file instantly.</small>

      <div class="card-actions">
        <button v-if="isEdit" type="button" class="btn btn-outline-secondary" :disabled="!isDirty" @click="handleReset">Reset</button>
        <button type="submit" class="btn btn-primary" :disabled="isEdit && !isDirty">{{ isEdit ? 'Save Switch' : 'Add Switch' }}</button>
      </div>
    </div>
  </form>
</template>
