<template>
  <div class="token-page">
    <div class="token-card">
      <h1>SmartThings Authorization</h1>

      <div v-if="code" class="token-success">
        <p>Your authorization code:</p>
        <div class="code-container">
          <code class="code-value">{{ code }}</code>
          <button class="copy-button" @click="copyCode" :class="{ copied }">
            {{ copied ? "✓ Copied!" : "Copy" }}
          </button>
        </div>
        <p class="hint">
          Copy this code and paste it in your plugin configuration.
        </p>
      </div>

      <div v-else-if="error" class="token-error">
        <div class="status-icon">❌</div>
        <p>Authorization was denied.</p>
        <p>
          SmartThings returned: <code>{{ error }}</code>
        </p>
        <p>
          Please try the authorization process again and make sure to allow
          access.
        </p>
      </div>

      <div v-else class="token-warning">
        <div class="status-icon">⚠️</div>
        <p>No authorization code found in the URL.</p>
        <p>
          Make sure you arrived here from the SmartThings authorization flow.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      code: "",
      error: "",
      copied: false,
    };
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get("code") || "";
    this.error = params.get("error") || "";
  },
  methods: {
    copyCode() {
      navigator.clipboard.writeText(this.code).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
  },
};
</script>

<style scoped>
.token-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f9fafb;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    sans-serif;
  padding: 80px 2rem 2rem;
}

.token-card {
  background: #fff;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 2.5rem;
  max-width: 520px;
  width: 100%;
  text-align: center;
}

.token-card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
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
  text-align: left;
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

.token-success p,
.token-error p,
.token-warning p {
  margin: 0.4rem 0 0;
  line-height: 1.5;
}

.status-icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.token-error,
.token-warning {
  padding: 1.25rem 1rem;
  border-radius: 8px;
  text-align: center;
}

.token-error {
  background: #ffeef0;
  border: 1px solid #fdaeb7;
}

.token-warning {
  background: #fff8e1;
  border: 1px solid #ffe082;
}
</style>
