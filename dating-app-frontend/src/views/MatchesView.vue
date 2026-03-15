<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { matchApi } from '@/api'
import { useRouter } from 'vue-router'

interface Match {
  id: string
  userId: string
  name: string
  age: number
  avatar: string
  mbtiType: string
  zodiac: string
  matchedAt: string
  lastMessage?: string
}

const router = useRouter()

const matches = ref<Match[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref<'matches' | 'likes'>('matches')
const receivedLikes = ref<any[]>([])

onMounted(async () => {
  await loadMatches()
})

async function loadMatches() {
  loading.value = true
  error.value = ''

  try {
    if (activeTab.value === 'matches') {
      const response = await matchApi.getMatches()
      matches.value = response.data
    } else {
      const response = await matchApi.getReceivedLikes()
      receivedLikes.value = response.data
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function handleTabChange(tab: 'matches' | 'likes') {
  activeTab.value = tab
  loadMatches()
}

function openChat(matchId: string) {
  router.push(`/chat/${matchId}`)
}

async function handleUnmatch(matchId: string, event: Event) {
  event.stopPropagation()

  if (!confirm('确定要取消这个匹配吗？')) return

  try {
    await matchApi.deleteMatch(matchId)
    await loadMatches()
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="matches-page">
    <div class="page-header">
      <h1 class="page-title">匹配</h1>
    </div>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'matches' }]"
        @click="handleTabChange('matches')"
      >
        💫 互相喜欢
      </button>
      <button
        :class="['tab', { active: activeTab === 'likes' }]"
        @click="handleTabChange('likes')"
      >
        💝 喜欢你的人
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <span class="error-icon">😕</span>
      <p>{{ error }}</p>
      <button @click="loadMatches" class="btn-retry">重试</button>
    </div>

    <div v-else-if="activeTab === 'matches' && matches.length === 0" class="empty-container">
      <span class="empty-icon">💔</span>
      <h3>还没有匹配</h3>
      <p>去推荐页面发现更多可能吧</p>
      <button @click="router.push('/recommendations')" class="btn-discover">
        去发现
      </button>
    </div>

    <div v-else-if="activeTab === 'likes' && receivedLikes.length === 0" class="empty-container">
      <span class="empty-icon">💌</span>
      <h3>暂时还没有人喜欢你</h3>
      <p>继续努力，你的缘分就在路上</p>
    </div>

    <div v-else class="matches-grid">
      <div
        v-for="match in activeTab === 'matches' ? matches : receivedLikes"
        :key="match.id"
        class="match-card"
        @click="openChat(match.id)"
      >
        <div class="match-avatar">
          <div class="avatar-placeholder">
            {{ match.name?.charAt(0).toUpperCase() }}
          </div>
          <div v-if="activeTab === 'matches'" class="online-indicator"></div>
        </div>

        <div class="match-info">
          <div class="match-header">
            <h3 class="match-name">
              {{ match.name }}
              <span class="match-age">{{ match.age }}</span>
            </h3>
            <span class="match-time">{{ formatDate(match.matchedAt) }}</span>
          </div>

          <div class="match-details">
            <span class="badge mbti">{{ match.mbtiType }}</span>
            <span class="badge zodiac" v-if="match.zodiac">{{ match.zodiac }}</span>
          </div>

          <p v-if="match.lastMessage" class="last-message">
            {{ match.lastMessage }}
          </p>
          <p v-else class="no-message">
            {{ activeTab === 'matches' ? '开始聊天吧' : '看看 TA 的主页' }}
          </p>
        </div>

        <div v-if="activeTab === 'matches'" class="match-actions">
          <button
            @click="handleUnmatch(match.id, $event)"
            class="btn-unmatch"
            title="取消匹配"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matches-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.tabs {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--surface);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-sm);
}

.tab {
  flex: 1;
  padding: var(--spacing-md);
  border: none;
  background: transparent;
  border-radius: var(--border-radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-sm);
}

.tab:hover:not(.active) {
  background: var(--background);
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

.error-container p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.btn-retry {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.empty-container h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-container p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.btn-discover {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
}

.matches-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.match-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.match-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.match-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 64px;
  height: 64px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-sm);
}

.online-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border: 2px solid var(--surface);
  border-radius: 50%;
}

.match-info {
  flex: 1;
  min-width: 0;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.match-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.match-age {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-muted);
}

.match-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.match-details {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.badge {
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.mbti {
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
}

.badge.zodiac {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.last-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-message {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
}

.match-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-unmatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--background);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-unmatch:hover {
  background: #fee2e2;
  color: #ef4444;
}

@media (max-width: 480px) {
  .matches-page {
    padding: var(--spacing-md);
  }

  .match-card {
    padding: var(--spacing-sm);
  }

  .avatar-placeholder {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
}
</style>
