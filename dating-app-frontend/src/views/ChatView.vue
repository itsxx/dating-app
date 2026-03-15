<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chatApi, matchApi } from '@/api'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  userId: string
  name: string
  avatar: string
  lastMessage?: string
  unreadCount: number
}

const route = useRoute()

const conversations = ref<Conversation[]>([])
const messages = ref<Message[]>([])
const selectedMatchId = ref<string>('')
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const socket = ref<WebSocket | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

const isConnected = ref(false)

onMounted(async () => {
  await loadConversations()

  // 如果路由中有 matchId，自动选择该对话
  if (route.params.matchId) {
    selectedMatchId.value = route.params.matchId as string
    await loadMessages(selectedMatchId.value)
    connectWebSocket()
  }
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.close()
  }
})

async function loadConversations() {
  loading.value = true
  try {
    const response = await chatApi.getConversations()
    conversations.value = response.data
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

async function selectConversation(matchId: string) {
  selectedMatchId.value = matchId
  await loadMessages(matchId)

  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
    connectWebSocket()
  }

  scrollToBottom()
}

async function loadMessages(matchId: string) {
  messages.value = []
  loading.value = true

  try {
    const response = await chatApi.getMessages(matchId)
    messages.value = response.data
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load messages:', error)
  } finally {
    loading.value = false
  }
}

function connectWebSocket() {
  const token = localStorage.getItem('token')
  const wsUrl = `ws://localhost:3000/ws?token=${token}`

  socket.value = new WebSocket(wsUrl)

  socket.value.onopen = () => {
    isConnected.value = true
    console.log('WebSocket connected')
  }

  socket.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'message') {
      messages.value.push({
        id: data.data.id,
        senderId: data.data.senderId,
        content: data.data.content,
        createdAt: data.data.createdAt,
      })
      scrollToBottom()
    }
  }

  socket.value.onclose = () => {
    isConnected.value = false
    console.log('WebSocket disconnected')
  }

  socket.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedMatchId.value || sending.value) return

  const content = newMessage.value.trim()
  sending.value = true

  // 乐观更新
  const tempMessage: Message = {
    id: `temp_${Date.now()}`,
    senderId: 'me',
    content: content,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(tempMessage)
  newMessage.value = ''
  scrollToBottom()

  try {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({
        type: 'message',
        matchId: selectedMatchId.value,
        content: content,
      }))
    } else {
      // 如果 WebSocket 未连接，使用 HTTP API
      await chatApi.sendMessage(selectedMatchId.value, content)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    // 移除乐观更新的消息
    messages.value = messages.value.filter(m => m.id !== tempMessage.id)
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return '刚刚'
  if (hours < 24) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const currentConversation = ref(() =>
  conversations.value.find(c => c.id === selectedMatchId.value)
)
</script>

<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- 会话列表 -->
      <div class="conversations-panel">
        <div class="panel-header">
          <h2 class="panel-title">消息</h2>
          <span v-if="isConnected" class="connection-status connected">●</span>
          <span v-else class="connection-status disconnected">●</span>
        </div>

        <div v-if="loading" class="loading-list">
          <div class="loading-spinner"></div>
        </div>

        <div v-else class="conversations-list">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            :class="['conversation-item', { active: conv.id === selectedMatchId }]"
            @click="selectConversation(conv.id)"
          >
            <div class="conv-avatar">
              <div class="avatar-placeholder">
                {{ conv.name?.charAt(0).toUpperCase() }}
              </div>
              <div v-if="conv.unreadCount > 0" class="unread-dot"></div>
            </div>

            <div class="conv-info">
              <div class="conv-header">
                <h3 class="conv-name">{{ conv.name }}</h3>
                <span class="conv-time">{{ formatDate(conv.lastMessage?.createdAt || conv.lastMessage || '') }}</span>
              </div>
              <p class="conv-last-message">
                {{ conv.lastMessage?.content || conv.lastMessage || '开始聊天吧' }}
              </p>
            </div>

            <div v-if="conv.unreadCount > 0" class="unread-badge">
              {{ conv.unreadCount }}
            </div>
          </div>

          <div v-if="conversations.length === 0" class="empty-conversations">
            <span class="empty-icon">💬</span>
            <p>暂无消息</p>
            <p class="empty-subtitle">去匹配页面开始聊天吧</p>
          </div>
        </div>
      </div>

      <!-- 聊天窗口 -->
      <div class="chat-panel">
        <div v-if="!selectedMatchId" class="chat-empty">
          <span class="empty-icon">💕</span>
          <h3>选择一段对话</h3>
          <p>从这里开始你们的缘分之旅</p>
        </div>

        <template v-else>
          <div class="chat-header">
            <div class="chat-user-info">
              <div class="user-avatar">
                {{ currentConversation?.name?.charAt(0).toUpperCase() }}
              </div>
              <div class="user-details">
                <h3 class="user-name">{{ currentConversation?.name }}</h3>
                <span class="user-status">在线</span>
              </div>
            </div>
          </div>

          <div ref="messagesContainer" class="messages-container">
            <div v-if="loading" class="messages-loading">
              <div class="loading-spinner"></div>
            </div>

            <div class="messages-list">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="['message', { 'message-me': message.senderId === 'me' }]"
              >
                <div class="message-content">
                  {{ message.content }}
                </div>
                <div class="message-time">
                  {{ formatDate(message.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <div class="message-input-container">
            <textarea
              v-model="newMessage"
              class="message-input"
              placeholder="输入消息..."
              :disabled="sending"
              @keydown="handleKeyPress"
              rows="1"
            ></textarea>
            <button
              @click="sendMessage"
              class="send-button"
              :disabled="!newMessage.trim() || sending"
            >
              <span v-if="!sending">发送</span>
              <span v-else class="sending-spinner"></span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  height: calc(100vh - 80px);
  overflow: hidden;
}

.chat-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  height: 100%;
  background: var(--surface);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.conversations-panel {
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.connection-status {
  font-size: 0.75rem;
}

.connection-status.connected {
  color: #22c55e;
}

.connection-status.disconnected {
  color: var(--text-muted);
}

.loading-list {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 1px solid var(--border-color);
}

.conversation-item:hover {
  background: var(--background);
}

.conversation-item.active {
  background: rgba(255, 107, 107, 0.08);
  border-left: 3px solid var(--primary-color);
}

.conv-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 50px;
  height: 50px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border: 2px solid var(--surface);
  border-radius: 50%;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.conv-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.conv-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.conv-last-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.empty-conversations {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
}

.empty-conversations .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.chat-panel {
  display: flex;
  flex-direction: column;
  background: var(--background);
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.chat-empty .empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.chat-empty h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.chat-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-status {
  font-size: 0.75rem;
  color: #22c55e;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.messages-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  gap: var(--spacing-xs);
}

.message-me {
  align-self: flex-end;
}

.message:not(.message-me) {
  align-self: flex-start;
}

.message-content {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-lg);
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}

.message:not(.message-me) .message-content {
  background: var(--surface);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.message-me .message-content {
  background: var(--primary-gradient);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.message-input-container {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--surface);
  border-top: 1px solid var(--border-color);
}

.message-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  font-size: 0.95rem;
  resize: none;
  max-height: 120px;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.message-input:disabled {
  background: var(--background);
  cursor: not-allowed;
}

.send-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-xl);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sending-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .chat-container {
    grid-template-columns: 1fr;
  }

  .conversations-panel {
    display: none;
  }

  .conversations-panel.show {
    display: flex;
  }
}
</style>
