<template>
  <div class="ht-callout callout-smartthings d-flex align-items-start gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 55.96" width="52">
      <path
        d="M49.74 6.26C46.32 2.99 41.56 1.2 36.35.46c-4.91-.59-8.33-.44-8.33-.44s-3.42-.15-8.33.45C14.48 1.21 9.72 3 6.3 6.27 3.03 9.68 1.25 14.44.5 19.65c-.74 4.91-.44 8.33-.44 8.33s-.3 3.42.45 8.33c.74 5.21 2.53 9.97 5.8 13.39 3.42 3.27 8.18 5.06 13.39 5.8 4.91.59 8.33.45 8.33.45s3.42.15 8.33-.45c5.21-.74 9.97-2.53 13.39-5.8 3.27-3.42 5.06-8.18 5.8-13.39.6-4.91.45-8.33.45-8.33s.15-3.42-.45-8.33c-.74-5.21-2.53-9.97-5.8-13.39Z"
        style="fill: #008df6"
      />
      <path
        d="M41.56 30.51c2.97 0 5.35-2.38 5.35-5.35s-2.38-5.35-5.35-5.35-5.35 2.38-5.35 5.35l-2.38.74a6.45 6.45 0 0 0-4.31-3.27V20.1c2.08-.74 3.72-2.68 3.72-5.06 0-2.97-2.38-5.35-5.35-5.35s-5.35 2.38-5.35 5.35c0 2.38 1.49 4.46 3.72 5.06v2.53a6.51 6.51 0 0 0-4.31 3.27l-2.38-.74v-.15c0-2.97-2.38-5.35-5.35-5.35s-5.35 2.38-5.35 5.35 2.38 5.35 5.35 5.35c1.78 0 3.27-.89 4.31-2.08l2.53.89v.15c0 1.49.45 2.68 1.19 3.87l-1.78 2.38c-.15 0-.74-.15-1.34-.15-2.97 0-5.35 2.38-5.35 5.35s2.38 5.35 5.35 5.35 5.35-2.38 5.35-5.35c0-1.19-.45-2.38-1.19-3.27l1.49-2.08c.89.45 1.93.74 3.12.74 1.04 0 1.93-.3 2.83-.6l1.64 2.23c-.6.89-.89 1.93-.89 2.97 0 2.97 2.38 5.35 5.35 5.35s5.35-2.38 5.35-5.35-2.38-5.35-5.35-5.35a6.3 6.3 0 0 0-1.78.3l-1.64-2.23a6.55 6.55 0 0 0 1.34-4.02v-.3l2.53-.89c1.04 1.49 2.53 2.38 4.31 2.23Zm0-7.44c1.19 0 2.08.89 2.08 2.08s-.89 2.08-2.08 2.08-2.08-.89-2.08-2.08.89-2.08 2.08-2.08m-27.07 4.31c-1.19 0-2.08-.89-2.08-2.08s.89-2.08 2.08-2.08 2.08.89 2.08 2.08-.89 2.08-2.08 2.08m13.53-14.27c1.19 0 2.08.89 2.08 2.08s-.89 2.08-2.08 2.08-2.08-.89-2.08-2.08.89-2.08 2.08-2.08M19.1 42.85c-1.19 0-2.08-.89-2.08-2.08s.89-2.08 2.08-2.08 2.08.89 2.08 2.08-.89 2.08-2.08 2.08m5.5-13.38c0-1.78 1.49-3.42 3.42-3.42 1.78 0 3.42 1.49 3.42 3.42 0 1.78-1.49 3.42-3.42 3.42-1.78-.15-3.42-1.64-3.42-3.42m14.43 11.3c0 1.19-.89 2.08-2.08 2.08s-2.08-.89-2.08-2.08.89-2.08 2.08-2.08 2.08.89 2.08 2.08"
        style="fill: #fff; fill-rule: evenodd"
      />
    </svg>

    <div>
      <template v-if="smartthings">
        <template v-if="isConnected">
          <div class="fw-semibold">Connected</div>
          <p>Your account is authorized and active. Devices are synchronized via the SmartThings API.</p>
          <button type="button" class="btn btn-primary" @click="goToSmartThings">
            <i class="fas fa-pen me-1"></i> Edit Credentials
          </button>
        </template>

        <template v-else>
          <div class="fw-semibold mb-1">Authorization expired</div>
          <div class="alert alert-warning text-start p-1 px-2 mb-1">
            Your access token expired on <span class="fw-semibold">{{ formatDate(smartthings.expiresAt) }}</span>. Re-authorize to restore full
            functionality.
          </div>
          <p>You can re-authorize using your existing credentials or update them if your Client ID or Secret has changed.</p>
          <button type="button" class="btn btn-danger" @click="goToSmartThings">
            <i class="fas fa-arrows-rotate me-1"></i> Re-authorize SmartThings
          </button>
        </template>
      </template>

      <template v-else>
        <div class="fw-semibold">Not connected</div>
        <p>Connect your SmartThings account to control your devices directly from this plugin.</p>
        <button type="button" class="btn btn-success" @click="goToSmartThings">
          <i class="fas fa-link me-1"></i> Connect to SmartThings
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useSmartThings } from './useSmartThings';

const { smartthings, isConnected, formatDate, goToSmartThings } = useSmartThings();
</script>

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

.ht-callout.callout-smartthings {
  border-left-color: #038df6;
}
</style>
