<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import { useRouter } from 'vue-router'

const router = useRouter()

const authStore = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const success = ref('')
const error = ref('')

const profile = ref({
  name: '',
  age: null as number | null,
  gender: '',
  bio: '',
  mbtiType: '',
  zodiac: '',
  avatar: '',
})

const initialProfile = ref({ ...profile.value })

const hasChanges = computed(() => {
  const currentKeys = Object.keys(profile.value).sort()
  const initialKeys = Object.keys(initialProfile.value).sort()

  for (const key of currentKeys) {
    if (profile.value[key] !== initialProfile.value[key]) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  await loadProfile()
})

async function loadProfile() {
  loading.value = true
  try {
    const response = await userApi.getProfile()
    if (response.data) {
      profile.value = {
        name: response.data.name || '',
        age: response.data.age || null,
        gender: response.data.gender || '',
        bio: response.data.bio || '',
        mbtiType: response.data.mbtiType || '',
        zodiac: response.data.zodiac || '',
        avatar: response.data.avatar || '',
      }
      initialProfile.value = { ...profile.value }
    }
  } catch (e) {
    console.error('Failed to load profile:', e)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    await userApi.updateProfile(profile.value)
    success.value = '资料已更新'
    editing.value = false
    initialProfile.value = { ...profile.value }

    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

function handleEdit() {
  editing.value = true
}

function handleCancel() {
  profile.value = { ...initialProfile.value }
  editing.value = false
  error.value = ''
  success.value = ''
}

function handleStartTest() {
  router.push('/mbti')
}

const zodiacOptions = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
]

const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <span class="avatar-placeholder">{{ profile.name?.charAt(0).toUpperCase() || 'U' }}</span>
        </div>
        <div class="user-info">
          <h1 class="username">{{ profile.name || '未设置昵称' }}</h1>
          <p class="user-meta">
            <span v-if="profile.mbtiType" class="badge-mbti">{{ profile.mbtiType }}</span>
            <span v-if="profile.zodiac" class="badge-zodiac">{{ profile.zodiac }}</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="profile-content">
      <div v-if="success" class="success-message">
        <span class="success-icon">✓</span>
        {{ success }}
      </div>

      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <form @submit.prevent="handleSave" class="profile-form">
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">昵称</label>
              <input
                v-model="profile.name"
                type="text"
                class="form-input"
                :disabled="!editing || saving"
                placeholder="请输入昵称"
              />
            </div>

            <div class="form-group">
              <label class="form-label">年龄</label>
              <input
                v-model.number="profile.age"
                type="number"
                class="form-input"
                :disabled="!editing || saving"
                placeholder="年龄"
                min="18"
                max="100"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">性别</label>
              <select
                v-model="profile.gender"
                class="form-input"
                :disabled="!editing || saving"
              >
                <option value="">请选择</option>
                <option v-for="g in genderOptions" :key="g.value" :value="g.value">
                  {{ g.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">星座</label>
              <select
                v-model="profile.zodiac"
                class="form-input"
                :disabled="!editing || saving"
              >
                <option value="">请选择</option>
                <option v-for="z in zodiacOptions" :key="z" :value="z">
                  {{ z }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">关于我</h3>

          <div class="form-group">
            <textarea
              v-model="profile.bio"
              class="form-textarea"
              :disabled="!editing || saving"
              placeholder="介绍一下自己吧..."
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">人格类型</h3>

          <div class="mbti-display" :class="{ 'clickable': !profile.mbtiType }" @click="handleStartTest">
            <div class="mbti-icon">🧩</div>
            <div class="mbti-info">
              <span class="mbti-type">{{ profile.mbtiType || '未完成测试' }}</span>
              <span class="mbti-desc" v-if="!profile.mbtiType">
                点击开始测试，获取更精准的推荐
                <span class="start-test-btn">开始测试 →</span>
              </span>
              <span class="mbti-desc" v-else>基于你的 MBTI 测试结果显示</span>
            </div>
          </div>
        </div>

        <div class="form-actions" v-if="editing">
          <button type="button" @click="handleCancel" class="btn-cancel" :disabled="saving">
            取消
          </button>
          <button type="submit" class="btn-save" :disabled="saving || !hasChanges">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>

        <div v-else class="form-actions">
          <button type="button" @click="handleEdit" class="btn-edit">
            编辑资料
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.profile-header {
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.avatar-wrapper {
  width: 100px;
  height: 100px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.avatar-placeholder {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.user-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.badge-mbti,
.badge-zodiac {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--border-radius-sm);
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
}

.badge-zodiac {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.profile-content {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-container {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-sm);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-form {
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
}

.form-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--surface);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
}

.form-input:disabled,
.form-textarea:disabled {
  background: var(--background);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.mbbi-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.mbti-display.clickable {
  cursor: pointer;
  border: 2px solid var(--primary-color);
  background: rgba(255, 107, 107, 0.05);
}

.mbti-display.clickable:hover {
  background: rgba(255, 107, 107, 0.1);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.mbti-icon {
  font-size: 2.5rem;
}

.mbti-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mbti-type {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mbti-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.start-test-btn {
  display: inline-block;
  margin-top: var(--spacing-xs);
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.8125rem;
}

.mbti-display.clickable:hover .start-test-btn {
  color: var(--primary-color);
  text-decoration: underline;
}

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.success-icon {
  font-weight: 700;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
}

.error-icon {
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.btn-cancel,
.btn-save,
.btn-edit {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-cancel {
  background: var(--surface);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--text-muted);
}

.btn-save {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-edit {
  background: var(--surface);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-edit:hover {
  background: var(--primary-color);
  color: white;
}

@media (max-width: 600px) {
  .profile-header {
    padding: var(--spacing-lg);
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save,
  .btn-edit {
    width: 100%;
  }
}
</style>
