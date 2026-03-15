// API 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 定义通用类型
type JsonObject = { [key: string]: unknown }

// 获取存储的 token
function getToken() {
  return localStorage.getItem('token')
}

// 存储 token
function setToken(token: string) {
  localStorage.setItem('token', token)
}

// 删除 token
function removeToken() {
  localStorage.removeItem('token')
}

// 通用请求处理
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || '请求失败')
  }

  return data
}

// 认证相关 API
export const authApi = {
  // 注册
  register(email: string, password: string) {
    return request<{ data: { user: { id: string; email: string }; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // 登录
  login(email: string, password: string) {
    return request<{ data: { user: { id: string; email: string }; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // 获取当前用户
  getMe() {
    return request<{ data: { id: string; email: string } }>('/auth/me')
  },
}

// 用户相关 API
export const userApi = {
  // 获取我的资料
  getProfile() {
    return request<{ data: JsonObject }>('/users/me')
  },

  // 创建资料
  createProfile(profile: JsonObject) {
    // 字段名映射
    const mappedProfile: JsonObject = {
      displayName: profile.name,
      bio: profile.bio,
      mbtiType: profile.mbtiType,
      avatarUrl: profile.avatar,
      age: profile.age,
      gender: profile.gender,
      // 如果没有 birthday，使用默认值
      birthday: profile.birthday || '2000-01-01',
    }
    return request<{ data: JsonObject }>('/users/me', {
      method: 'POST',
      body: JSON.stringify(mappedProfile),
    })
  },

  // 更新资料
  updateProfile(profile: JsonObject) {
    // 字段名映射
    const mappedProfile: JsonObject = {
      displayName: profile.name,
      bio: profile.bio,
      mbtiType: profile.mbtiType,
      avatarUrl: profile.avatar,
      age: profile.age,
      gender: profile.gender,
      // 如果没有 birthday，使用默认值
      birthday: profile.birthday || '2000-01-01',
    }
    return request<{ data: JsonObject }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(mappedProfile),
    })
  },

  // 获取其他用户资料
  getUserProfile(userId: string) {
    return request<{ data: JsonObject }>(`/users/${userId}`)
  },
}

// MBTI 相关 API
export const mbtiApi = {
  // 获取测试题目
  getQuestions() {
    return request<{ data: { id: number; question: string; options: string[] }[] }>('/mbti/questions')
  },

  // 提交答案
  submitAnswers(answers: { questionId: number; answer: number }[]) {
    return request<{ data: { mbtiType: string } }>('/mbti/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
  },
}

// 推荐相关 API
export const recommendationApi = {
  // 获取推荐列表
  getRecommendations() {
    return request<{ data: JsonObject[] }>('/recommendations')
  },

  // 获取设置
  getSettings() {
    return request<{ data: JsonObject }>('/recommendations/settings')
  },

  // 更新设置
  updateSettings(settings: JsonObject) {
    return request<{ data: JsonObject }>('/recommendations/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },
}

// 匹配相关 API
export const matchApi = {
  // 发送喜欢
  sendLike(targetUserId: string) {
    return request<{ data: { match: boolean; matchId?: string } }>('/matches/likes', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    })
  },

  // 获取收到的喜欢
  getReceivedLikes() {
    return request<{ data: JsonObject[] }>('/matches/likes/received')
  },

  // 获取匹配列表
  getMatches() {
    return request<{ data: JsonObject[] }>('/matches')
  },

  // 删除匹配
  deleteMatch(matchId: string) {
    return request<JsonObject>(`/matches/${matchId}`, {
      method: 'DELETE',
    })
  },
}

// 聊天相关 API
export const chatApi = {
  // 获取对话列表
  getConversations() {
    return request<{ data: JsonObject[] }>('/chat/conversations')
  },

  // 获取消息
  getMessages(matchId: string) {
    return request<{ data: JsonObject[] }>(`/chat/conversations/${matchId}/messages`)
  },

  // 发送消息
  sendMessage(matchId: string, content: string) {
    return request<{ data: JsonObject }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ matchId, content }),
    })
  },
}

export { getToken, setToken, removeToken }
