<template>
  <div class="smartthings-token">
    <div v-if="code" class="token-success">
      <p>Your SmartThings authorization code:</p>
      <div class="code-container">
        <code class="code-value">{{ code }}</code>
        <button class="copy-button" @click="copyCode" :class="{ copied }">
          {{ copied ? '✓ Copied!' : 'Copy' }}
        </button>
      </div>
      <p class="hint">Copy this code and paste it in your plugin configuration.</p>
    </div>
    <div v-else-if="error" class="token-error">
      <p>❌ Authorization was denied.</p>
      <p>SmartThings returned: <code>{{ error }}</code></p>
      <p>Please try the authorization process again and make sure to allow access.</p>
    </div>
    <div v-else class="token-warning">
      <p>⚠️ No authorization code found in the URL.</p>
      <p>Make sure you arrived here from the SmartThings authorization flow.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      error: '',
      copied: false
    }
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get('code') || '';
    this.error = params.get('error') || '';
  },
  methods: {
    copyCode() {
      navigator.clipboard.writeText(this.code).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false }, 2000);
      });
    }
  }
}
</script>

<style scoped>
.smartthings-token {
  margin-top: 1.5rem;
}

.code-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
}

.code-value {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 600;
  word-break: break-all;
  color: #2c3e50;
  background: none;
  padding: 0;
}

.copy-button {
  flex-shrink: 0;
  padding: 0.5rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  background: #3eaf7c;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-button:hover {
  background: #359468;
}

.copy-button.copied {
  background: #2c7a5b;
}

.hint {
  color: #6a737d;
  font-size: 0.9rem;
}

.token-error {
  padding: 1rem;
  background: #ffeef0;
  border: 1px solid #fdaeb7;
  border-radius: 8px;
}

.token-warning {
  padding: 1rem;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
}
</style>
