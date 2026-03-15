<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleGetStarted() {
  if (authStore.isAuthenticated) {
    router.push('/recommendations')
  } else {
    router.push('/register')
  }
}

function handleLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <div class="badge-wrapper">
          <span class="badge">✨ 智能匹配 · 真实相遇</span>
        </div>

        <h1 class="hero-title">
          遇见你的
          <span class="gradient-text">专属 Spark</span>
        </h1>

        <p class="hero-subtitle">
          基于 MBTI 人格匹配和星座共鸣，帮你找到真正合拍的那个人。
          告别无效社交，让每一次相遇都充满可能。
        </p>

        <div class="hero-actions">
          <button @click="handleGetStarted" class="btn-primary-large">
            <span>开始相遇</span>
            <span class="arrow">→</span>
          </button>
          <button @click="handleLogin" class="btn-secondary-large" v-if="!authStore.isAuthenticated">
            已有账户？登录
          </button>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">10K+</span>
            <span class="stat-label">活跃用户</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">50K+</span>
            <span class="stat-label">成功匹配</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">98%</span>
            <span class="stat-label">好评率</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-container">
          <div class="floating-card card-1">
            <span class="card-emoji">💕</span>
          </div>
          <div class="floating-card card-2">
            <span class="card-emoji">✨</span>
          </div>
          <div class="floating-card card-3">
            <span class="card-emoji">🔥</span>
          </div>
          <div class="floating-card card-4">
            <span class="card-emoji">💫</span>
          </div>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">为什么选择 Spark？</h2>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🧩</div>
          <h3>MBTI 人格匹配</h3>
          <p>通过专业的 MBTI 性格测试，找到与你人格互补的理想伴侣</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⭐</div>
          <h3>星座共鸣</h3>
          <p>结合星座特质分析，发现天作之合的浪漫可能</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <h3>真实认证</h3>
          <p>严格的身份验证机制，确保每个用户都是真实存在</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3>即时聊天</h3>
          <p>匹配成功后立即开启对话，让缘分不再等待</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  align-items: center;
  min-height: 500px;
  padding: var(--spacing-xl) 0;
}

.hero-content {
  animation: fadeInLeft 0.6s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.badge-wrapper {
  margin-bottom: var(--spacing-md);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--border-radius-md);
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.gradient-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.btn-primary-large {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.btn-primary-large:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.btn-primary-large .arrow {
  transition: transform var(--transition-fast);
}

.btn-primary-large:hover .arrow {
  transform: translateX(4px);
}

.btn-secondary-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary-large:hover {
  border-color: var(--primary-color);
  background: rgba(255, 107, 107, 0.05);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color);
}

.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInRight 0.6s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.visual-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.floating-card {
  position: absolute;
  width: 80px;
  height: 80px;
  background: var(--surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

.card-emoji {
  font-size: 2.5rem;
}

.card-1 {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  animation-delay: 0.5s;
}

.card-3 {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 1s;
}

.card-4 {
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(-50%);
  }
  50% {
    transform: translateY(-10px) translateX(-50%);
  }
}

.features-section {
  padding: var(--spacing-xl) 0;
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  background: var(--surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-content {
    order: 2;
  }

  .hero-visual {
    order: 1;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    margin: 0 auto var(--spacing-xl);
  }

  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-stats {
    justify-content: center;
  }

  .stat-divider {
    display: none;
  }
}
</style>
