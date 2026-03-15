<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="app">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <RouterLink to="/" class="navbar-logo">
          <span class="logo-icon">💕</span>
          <span class="logo-text">Spark</span>
        </RouterLink>

        <div class="navbar-menu">
          <template v-if="authStore.isAuthenticated">
            <RouterLink to="/recommendations" class="nav-link">
              <span class="nav-icon">🔥</span>
              <span>推荐</span>
            </RouterLink>
            <RouterLink to="/matches" class="nav-link">
              <span class="nav-icon">💫</span>
              <span>匹配</span>
            </RouterLink>
            <RouterLink to="/chat" class="nav-link">
              <span class="nav-icon">💬</span>
              <span>消息</span>
            </RouterLink>
            <RouterLink to="/profile" class="nav-link">
              <span class="nav-icon">👤</span>
              <span>资料</span>
            </RouterLink>
            <button @click="authStore.logout()" class="nav-link btn-logout">
              <span class="nav-icon">🚪</span>
              <span>退出</span>
            </button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="nav-link">登录</RouterLink>
            <RouterLink to="/register" class="btn btn-primary">注册</RouterLink>
          </template>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--primary-color);
  background: rgba(255, 107, 107, 0.05);
}

.nav-link.router-link-active {
  color: var(--primary-color);
  background: rgba(255, 107, 107, 0.08);
}

.nav-icon {
  font-size: 1.2rem;
}

.btn-logout:hover {
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg) 0;
}

@media (max-width: 768px) {
  .navbar-container {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .navbar-menu {
    gap: var(--spacing-xs);
  }

  .nav-link span:not(.nav-icon) {
    display: none;
  }

  .btn-logout span:not(.nav-icon) {
    display: none;
  }
}
</style>
