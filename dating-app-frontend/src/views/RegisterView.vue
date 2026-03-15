<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = '请填写所有字段'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = '请输入有效的邮箱地址'
    return
  }

  if (password.value.length < 8) {
    error.value = '密码至少需要 8 位'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  submitting.value = true

  const result = await authStore.register(email.value, password.value)

  submitting.value = false

  if (result.success) {
    router.push('/mbti')
  } else {
    error.value = result.error || '注册失败，请重试'
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <div class="card-header">
        <div class="logo-wrapper">
          <span class="logo-emoji">💕</span>
        </div>
        <h1 class="card-title">加入 Spark</h1>
        <p class="card-subtitle">创建你的账户，开始遇见缘分</p>
      </div>

      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            :disabled="submitting"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="至少 8 位"
            :disabled="submitting"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="再次输入密码"
            :disabled="submitting"
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <button type="submit" class="btn-submit" :disabled="submitting">
          <span v-if="!submitting">创建账户</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </form>

      <div class="card-footer">
        <p>
          已有账户？
          <router-link to="/login" class="link">去登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.register-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xl);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-md);
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 107, 107, 0.4);
  }
}

.logo-emoji {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--surface);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
}

.form-input:disabled {
  background: var(--background);
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--border-radius-md);
  color: var(--primary-color);
  font-size: 0.875rem;
  animation: shake 0.4s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-icon {
  font-size: 1rem;
}

.btn-submit {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-footer {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.card-footer p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.link {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--primary-dark);
}

@media (max-width: 480px) {
  .register-card {
    padding: var(--spacing-lg);
  }

  .card-title {
    font-size: 1.5rem;
  }

  .logo-wrapper {
    width: 60px;
    height: 60px;
  }

  .logo-emoji {
    font-size: 2rem;
  }
}
</style>
