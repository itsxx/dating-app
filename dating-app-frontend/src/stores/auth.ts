import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, setToken, removeToken, getToken } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const token = ref<string | null>(getToken())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(email, password)
      user.value = response.data.user
      token.value = response.data.token
      setToken(response.data.token)
      return { success: true }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '登录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.register(email, password)
      user.value = response.data.user
      token.value = response.data.token
      setToken(response.data.token)
      return { success: true }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '注册失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return

    loading.value = true
    try {
      const response = await authApi.getMe()
      user.value = response.data
    } catch (e: unknown) {
      // Token 可能已过期
      logout()
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    removeToken()
  }

  // 初始化时尝试恢复登录状态
  if (token.value && !user.value) {
    fetchUser()
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  }
})
