<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { recommendationApi, matchApi, userApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

interface User {
  id?: string
  user_id?: string
  name?: string
  display_name?: string
  age: number
  gender: string
  bio: string
  mbtiType?: string
  mbti_type?: string
  zodiac?: string
  zodiac_sign?: string
  avatar: string
  matchRate?: number
}

const authStore = useAuthStore()
const router = useRouter()

const recommendations = ref<User[]>([])
const loading = ref(true)
const error = ref('')
const currentIndex = ref(0)
const swiping = ref(false)
const swipeDirection = ref<'left' | 'right' | null>(null)
const showSettings = ref(false)

const settings = ref({
  minAge: 18,
  maxAge: 35,
  gender: 'all',
  distance: 50,
})

onMounted(async () => {
  await loadRecommendations()
})

async function loadRecommendations() {
  loading.value = true
  error.value = ''

  try {
    const response = await recommendationApi.getRecommendations()
    recommendations.value = response.data
    currentIndex.value = 0
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载推荐失败'
  } finally {
    loading.value = false
  }
}

async function handleLike() {
  if (currentIndex.value >= recommendations.value.length) return

  const targetUser = recommendations.value[currentIndex.value]

  try {
    const result = await matchApi.sendLike(targetUser.user_id || targetUser.id)

    swipeDirection.value = 'right'
    await animateSwipe()

    if (result.data.match) {
      // 匹配成功
      if (confirm(`🎉 你们匹配成功了！要和 ${targetUser.display_name || targetUser.name} 聊天吗？`)) {
        router.push(`/chat/${result.data.matchId}`)
      }
    }

    await nextCard()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  }
}

async function handlePass() {
  if (currentIndex.value >= recommendations.value.length) return

  swipeDirection.value = 'left'
  await animateSwipe()
  await nextCard()
}

async function nextCard() {
  swiping.value = false
  swipeDirection.value = null
  currentIndex.value++

  if (currentIndex.value >= recommendations.value.length) {
    await loadRecommendations()
  }
}

function animateSwipe() {
  return new Promise(resolve => {
    swiping.value = true
    setTimeout(resolve, 300)
  })
}

const currentUser = ref(() => recommendations.value[currentIndex.value])

const mbtiCompatibility = ref(() => {
  const user = recommendations.value[currentIndex.value]
  const mbtiType = user?.mbti_type || user?.mbtiType
  if (!mbtiType) return ''

  const compatibleTypes: Record<string, string[]> = {
    'INTJ': ['ENFP', 'ENTP'],
    'INTP': ['ENTJ', 'ESTJ'],
    'ENTJ': ['INTP', 'ISTP'],
    'ENTP': ['INFJ', 'INTJ'],
    'INFJ': ['ENFP', 'ENTP'],
    'INFP': ['ENFJ', 'ESFJ'],
    'ENFJ': ['INFP', 'ISFP'],
    'ENFP': ['INFJ', 'INTJ'],
    'ISTJ': ['ESFP', 'ESTP'],
    'ISFJ': ['ESFP', 'ESTP'],
    'ESTJ': ['ISFP', 'ISTP'],
    'ESFJ': ['ISFP', 'ISFJ'],
    'ISTP': ['ESFJ', 'ESTJ'],
    'ISFP': ['ENFJ', 'ESFJ'],
    'ESTP': ['ISFJ', 'ISTJ'],
    'ESFP': ['ISTJ', 'ISFJ'],
  }

  return compatibleTypes[mbtiType] || []
})
</script>

<template>
  <div class="recommendations-page">
    <div class="page-header">
      <h1 class="page-title">发现</h1>
      <button @click="showSettings = !showSettings" class="btn-settings">
        ⚙️
      </button>
    </div>

    <div v-if="showSettings" class="settings-panel">
      <div class="settings-content">
        <h3>筛选条件</h3>

        <div class="setting-group">
          <label class="setting-label">年龄范围</label>
          <div class="range-inputs">
            <input v-model.number="settings.minAge" type="number" class="setting-input" min="18" max="100" />
            <span class="range-separator">-</span>
            <input v-model.number="settings.maxAge" type="number" class="setting-input" min="18" max="100" />
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">性别</label>
          <div class="gender-options">
            <button
              :class="['gender-btn', { active: settings.gender === 'all' }]"
              @click="settings.gender = 'all'"
            >
              全部
            </button>
            <button
              :class="['gender-btn', { active: settings.gender === 'male' }]"
              @click="settings.gender = 'male'"
            >
              男
            </button>
            <button
              :class="['gender-btn', { active: settings.gender === 'female' }]"
              @click="settings.gender = 'female'"
            >
              女
            </button>
          </div>
        </div>

        <button @click="showSettings = false" class="btn-done">完成</button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在寻找缘分...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <span class="error-icon">😕</span>
      <p>{{ error }}</p>
      <button @click="loadRecommendations" class="btn-retry">重试</button>
    </div>

    <div v-else-if="recommendations.length === 0" class="empty-container">
      <span class="empty-icon">💔</span>
      <p>暂时没有更多推荐了</p>
      <p class="empty-subtitle">稍后再来看看吧</p>
    </div>

    <div v-else class="cards-container">
      <transition name="card">
        <div
          v-if="currentUser"
          :key="currentUser.user_id || currentUser.id"
          :class="['card', {
            'swiping-left': swiping && swipeDirection === 'left',
            'swiping-right': swiping && swipeDirection === 'right'
          }]"
        >
          <div class="card-image">
            <div class="avatar-large">
              {{ (currentUser.display_name || currentUser.name)?.charAt(0).toUpperCase() }}
            </div>
            <div class="match-rate" v-if="currentUser.matchRate">
              {{ currentUser.matchRate }}% 匹配度
            </div>
          </div>

          <div class="card-content">
            <div class="card-header">
              <h2 class="card-name">
                {{ currentUser.display_name || currentUser.name }}
                <span class="card-age">{{ currentUser.age }}</span>
              </h2>
              <div class="card-badges">
                <span class="badge mbti">{{ currentUser.mbti_type || currentUser.mbtiType }}</span>
                <span class="badge zodiac" v-if="currentUser.zodiac_sign || currentUser.zodiac">{{ currentUser.zodiac_sign || currentUser.zodiac }}</span>
              </div>
            </div>

            <p class="card-bio">{{ currentUser.bio || '这个人很神秘，还没有填写自我介绍~' }}</p>

            <div class="compatibility-hint" v-if="currentUser.mbti_type || currentUser.mbtiType">
              <span class="hint-icon">🧩</span>
              <span>人格相容性分析中...</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="!loading && !error && recommendations.length > 0" class="action-buttons">
      <button @click="handlePass" class="btn-pass" :disabled="swiping">
        <span class="btn-icon">✕</span>
      </button>
      <button @click="handleLike" class="btn-like" :disabled="swiping">
        <span class="btn-icon">♥</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.recommendations-page {
  max-width: 500px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-settings {
  background: var(--surface);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-settings:hover {
  background: var(--background);
  transform: rotate(30deg);
}

.settings-panel {
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
}

.settings-content {
  padding: var(--spacing-lg);
}

.settings-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.setting-group {
  margin-bottom: var(--spacing-lg);
}

.setting-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.setting-input {
  width: 80px;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  text-align: center;
}

.range-separator {
  color: var(--text-muted);
}

.gender-options {
  display: flex;
  gap: var(--spacing-sm);
}

.gender-btn {
  flex: 1;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--surface);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.gender-btn.active {
  border-color: var(--primary-color);
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
}

.btn-done {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
}

.loading-container,
.error-container,
.empty-container {
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

.error-icon,
.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.error-container p,
.empty-container p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.btn-retry {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.cards-container {
  position: relative;
  min-height: 400px;
}

.card {
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

.card.swiping-left {
  transform: translateX(-100%) rotate(-20deg);
  opacity: 0;
}

.card.swiping-right {
  transform: translateX(100%) rotate(20deg);
  opacity: 0;
}

.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-image {
  position: relative;
  height: 250px;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-large {
  width: 150px;
  height: 150px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-md);
}

.match-rate {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: rgba(255, 107, 107, 0.9);
  color: white;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.card-content {
  padding: var(--spacing-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-age {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
}

.card-badges {
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.mbti {
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
}

.badge.zodiac {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.card-bio {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.compatibility-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--background);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.hint-icon {
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.btn-pass,
.btn-like {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.btn-pass {
  background: var(--surface);
  color: var(--text-muted);
}

.btn-pass:hover:not(:disabled) {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.1);
}

.btn-like {
  background: var(--primary-gradient);
  color: white;
}

.btn-like:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.btn-pass:disabled,
.btn-like:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.5rem;
}

@media (max-width: 480px) {
  .recommendations-page {
    padding: var(--spacing-md);
  }

  .card-image {
    height: 200px;
  }

  .avatar-large {
    width: 120px;
    height: 120px;
    font-size: 2.5rem;
  }
}
</style>
