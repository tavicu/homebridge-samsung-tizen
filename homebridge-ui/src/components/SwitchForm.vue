<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';

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
const { navigateTo } = useRouter();
const toast = useToast();

const isEdit = computed(() => props.action === 'edit');
const isDeviceScoped = computed(() => props.deviceIndex !== undefined);

const validated = ref(false);
const formEl = ref(null);
const form = reactive({
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

function resetForm() {
  form.name = '';
  form.power = false;
  form.sleep = '';
  form.mute = false;
  form.volume = '';
  form.app = '';
  form.input = '';
  form.channel = '';
  form.picture_mode = '';
  form.commands = [createCommand()];
}

function fillForm(switchItem) {
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
}

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateTo('device', { action: 'edit', deviceIndex: props.deviceIndex });
    return;
  }

  navigateTo('dashboard');
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
      goBack();
      return;
    }

    fillForm(switchItem);
  } else {
    resetForm();
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

async function handleSubmit() {
  form.name = form.name.trim();

  if (!formEl.value?.checkValidity()) {
    validated.value = true;
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

    goBack();
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
    <div>
      <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Switch' : 'Add Switch' }}</h6>
      <div class="text-muted">
        <template v-if="isEdit">Edit the configuration of the switch {{ form.name }}</template>
        <template v-else-if="isDeviceScoped">Configure a new switch for this device</template>
        <template v-else>Configure a new global switch that applies to all devices</template>
      </div>
    </div>

    <button v-if="isEdit" type="button" class="btn btn-outline-danger" @click="navigateTo('switch', { action: 'delete', switchIndex, deviceIndex })">Delete Switch</button>
  </div>

  <div v-if="!isEdit" class="ht-callout callout-info mb-3">
    <div class="fw-semibold mb-1">Combine one or more actions</div>
    A switch can run multiple actions at once — for example power on the TV, set volume, then send a remote command.
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Switch Name <strong class="text-danger">*</strong></label>
        <input id="name" v-model="form.name" type="text" class="form-control" placeholder="e.g. Evening Mode" maxlength="64" required />
        <div class="invalid-feedback">Please enter a valid switch name.</div>
      </div>

      <hr class="my-4 text-muted" />

      <div class="mb-3">
        <label class="hb-uix-switch mb-0" for="power">
          <input id="power" v-model="form.power" type="checkbox" />
          <span>Power on TV before running actions</span>
          <span class="hb-uix-slider hb-uix-round" />
        </label>
        <small class="form-text text-muted d-block">If enabled, the TV is turned on first when this switch is activated.</small>
      </div>

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
          <label for="volume" class="form-label">Volume <span class="text-muted">(optional)</span></label>
          <input id="volume" v-model="form.volume" type="number" class="form-control" min="0" max="100" step="1" placeholder="e.g. 10" />
          <small class="form-text text-muted">Requires SmartThings. Sets the speaker volume.</small>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="app" class="form-label">Application ID <span class="text-muted">(optional)</span></label>
          <input id="app" v-model="form.app" type="text" class="form-control" placeholder="e.g. 111299001912" pattern="^[0-9]+$" inputmode="numeric" />
          <small class="form-text text-muted">
            Opens the selected application. See the
            <a href="https://tavicu.github.io/homebridge-samsung-tizen/extra/applications.html" target="_blank" rel="noopener noreferrer">application IDs list</a>.
          </small>
        </div>
        <div class="col-md-6">
          <label for="channel" class="form-label">Channel <span class="text-muted">(optional)</span></label>
          <input id="channel" v-model="form.channel" type="number" class="form-control" min="0" step="1" placeholder="e.g. 13" />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="input" class="form-label">Input Source <span class="text-muted">(optional)</span></label>
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
          <small class="form-text text-muted">Requires SmartThings.</small>
        </div>

        <div class="col-md-6">
          <label for="picture_mode" class="form-label">Picture Mode <span class="text-muted">(optional)</span></label>
          <input id="picture_mode" v-model="form.picture_mode" type="text" class="form-control" placeholder="e.g. movie" />
          <small class="form-text text-muted">Requires SmartThings. Enter the exact name shown on the TV (for example movie, standard, or dynamic). Names vary by model.</small>
        </div>
      </div>

      <div>
        <label class="form-label">Key(s) to execute <span class="text-muted">(optional)</span></label>
        <div class="d-flex flex-column gap-2">
          <div v-for="command in form.commands" :key="command.id" class="input-group">
            <input v-model="command.value" type="text" class="form-control font-monospace text-uppercase" placeholder="e.g. KEY_VOLUP" />
            <button type="button" class="btn btn-outline-danger" @click="removeCommand(command.id)">
              <i class="fas fa-xmark" />
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary mt-2" @click="addCommand"><i class="fas fa-plus" /> Add Command</button>
        <small class="form-text text-muted d-block mt-2">
          Repeat a key with <code>KEY_VOLUP*3</code>. Hold it with <code>KEY_POWER*2.5s</code> (time in seconds).
        </small>
      </div>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="goBack">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Switch' : 'Add Switch' }} <i class="fas fa-arrow-right" /></button>
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
