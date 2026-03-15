# 交友 APP 推荐系统设计文档

**日期:** 2026-03-15
**版本:** 1.0
**状态:** 已批准

---

## 目录

1. [系统架构](#1-系统架构)
2. [前端页面设计](#2-前端页面设计)
3. [API 设计](#3-api-设计)
4. [数据库设计](#4-数据库设计)
5. [推荐算法设计](#5-推荐算法设计)
6. [聊天模块设计](#6-聊天模块设计)
7. [错误处理与安全](#7-错误处理与安全)
8. [测试策略](#8-测试策略)
9. [部署与运维](#9-部署与运维)

---

## 1. 系统架构

### 1.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Expo (React Native + Web) |
| 后端 | Node.js + Express |
| 数据库 | PostgreSQL |
| 实时通信 | WebSocket |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Expo)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 用户界面    │  │ 匹配界面    │  │ 聊天界面            │ │
│  │ - 注册登录  │  │ - 推荐设置  │  │ - 消息列表          │ │
│  │ - 个人资料  │  │ - 推荐列表  │  │ - 一对一聊天        │ │
│  │ - MBTI 测试 │  │ - 喜欢/跳过  │  │ - 已读未读状态      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                         ↕ (REST API)
┌─────────────────────────────────────────────────────────────┐
│                   后端 (Node.js + Express)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 认证模块    │  │ 推荐服务    │  │ 聊天服务            │ │
│  │ - JWT 认证   │  │ - 星座匹配  │  │ - WebSocket 实时消息  │ │
│  │ - 用户管理  │  │ - MBTI 匹配  │  │ - 消息存储          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   MBTI 测试服务                         ││
│  │  - 20-30 题测试题                                         ││
│  │  - 计分算法 (4 维度)                                      ││
│  │  - 返回 MBTI 类型                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────────┐
│                    数据库 (PostgreSQL)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ users    │  │ profiles │  │ matches  │  │ messages  │  │
│  │ - 认证信息│  │ - 个人资料│  │ - 匹配关系│  │ - 聊天记录 │  │
│  │ - 邮箱密码│  │ - 出生日期│  │ - 状态    │  │ - 时间    │  │
│  └──────────┘  │ - MBTI 类型 │  │ - 时间    │  └───────────┘  │
│                │ - 位置    │  └──────────┘                   │
│                └──────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 核心组件

1. **前端 (Expo)**
   - 一套代码编译到 iOS/Android/Web
   - V1 优先部署到 Web
   - 使用 React Navigation 管理页面路由
   - 使用 React Query 管理服务器状态

2. **后端 API (Express)**
   - RESTful API 设计
   - JWT Token 认证
   - WebSocket 用于实时聊天

3. **推荐服务**
   - 根据用户设置的条件筛选
   - 支持按出生日期排序
   - 结果缓存减少重复计算

4. **数据库**
   - PostgreSQL 存储关系型数据
   - 索引优化查询性能
   - 位置信息预留字段

---

## 2. 前端页面设计

### 2.1 应用结构

```
┌─────────────────┐  未认证用户
│  登录页         │  /login
│  注册页         │  /register
└─────────────────┘
        ↕
┌─────────────────┐  已认证用户
│  主页/导航      │  / (根路由)
│  ├─ 推荐        │  /discover
│  ├─ 匹配        │  /matches       (已匹配的人)
│  ├─ 消息        │  /messages    (消息列表)
│  ├─ 我的        │  /profile     (个人资料)
│  └─ 设置        │  /settings    (推荐设置等)
└─────────────────┘

┌─────────────────┐  功能页面
│  MBTI 测试       │  /mbti-test
│  个人资料编辑   │  /profile/edit
│  聊天详情       │  /chat/:userId
│  用户详情       │  /user/:userId
└─────────────────┘
```

### 2.2 页面说明

| 页面 | 功能 | 关键组件 |
|------|------|----------|
| 登录/注册 | 邮箱密码登录 | 表单、验证 |
| 推荐页 | 展示推荐用户列表 | 卡片、筛选器、排序 |
| 匹配页 | 已匹配的用户列表 | 列表、头像、状态 |
| 消息页 | 消息会话列表 | 列表、最后一条消息 |
| 聊天页 | 一对一聊天 | 消息气泡、输入框 |
| 个人资料 | 展示/编辑资料 | 表单、照片上传 |
| MBTI 测试 | 20-30 题测试 | 进度条、选项、计分 |
| 设置页 | 推荐条件设置 | 下拉选择、开关 |

---

## 3. API 设计

### 3.1 认证模块

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/auth/password | 修改密码 |

### 3.2 用户模块

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/users/:id | 获取用户资料 |
| PUT | /api/users/:id | 更新用户资料 |
| GET | /api/users/me | 获取我的完整资料 |
| PUT | /api/users/me | 更新我的资料 |

### 3.3 MBTI 测试模块

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/mbti/questions | 获取测试题目 |
| POST | /api/mbti/submit | 提交测试答案 |

### 3.4 推荐模块

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/recommendations | 获取推荐列表 |
| GET | /api/recommendations/settings | 获取推荐设置 |
| PUT | /api/recommendations/settings | 更新推荐设置 |

**推荐设置数据结构:**

```javascript
{
  zodiacFilter: "same" | "complementary" | "none",
  mbtiFilter: "same" | "complementary" | "none",
  sortBy: "birthday" | "zodiac" | "mbti"
}
```

### 3.5 匹配模块

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/likes | 发送喜欢 |
| GET | /api/likes/received | 获取收到的喜欢 |
| GET | /api/matches | 获取匹配列表 |
| DELETE | /api/matches/:id | 解除匹配 |

### 3.6 聊天模块

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/conversations | 获取会话列表 |
| GET | /api/conversations/:id | 获取会话消息 |
| POST | /api/messages | 发送消息 |
| PUT | /api/messages/:id/read | 标记已读 |

**WebSocket:** `ws:///chat` 实时消息推送

---

## 4. 数据库设计

### 4.1 数据表结构

#### users (用户认证表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | VARCHAR(255) | 唯一邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### profiles (用户资料表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 外键 |
| display_name | VARCHAR(50) | 昵称 |
| avatar_url | VARCHAR(500) | 头像 |
| bio | TEXT | 自我介绍 |
| birthday | DATE | 出生日期 |
| mbti_type | VARCHAR(4) | MBTI 类型 |
| zodiac_sign | VARCHAR(20) | 星座 |
| latitude | DECIMAL(9,6) | 纬度 (预留) |
| longitude | DECIMAL(9,6) | 经度 (预留) |

#### mbti_tests (MBTI 测试记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 外键 |
| answers | JSONB | 答案 |
| result_type | VARCHAR(4) | 结果类型 |
| completed_at | TIMESTAMP | 完成时间 |

#### recommendation_settings (推荐设置)

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 主键 |
| zodiac_filter | VARCHAR(20) | 星座筛选 |
| mbti_filter | VARCHAR(20) | MBTI 筛选 |
| sort_by | VARCHAR(20) | 排序方式 |
| updated_at | TIMESTAMP | 更新时间 |

#### likes (喜欢记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| sender_id | UUID | 发送者 |
| receiver_id | UUID | 接收者 |
| created_at | TIMESTAMP | 创建时间 |

#### matches (匹配记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user1_id | UUID | 用户 1 |
| user2_id | UUID | 用户 2 |
| created_at | TIMESTAMP | 创建时间 |

#### messages (消息表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| match_id | UUID | 匹配 ID |
| sender_id | UUID | 发送者 |
| content | TEXT | 内容 |
| is_read | BOOLEAN | 是否已读 |
| created_at | TIMESTAMP | 创建时间 |

### 4.2 索引设计

```sql
-- 推荐查询优化
CREATE INDEX idx_profiles_birthday ON profiles(birthday);
CREATE INDEX idx_profiles_zodiac ON profiles(zodiac_sign);
CREATE INDEX idx_profiles_mbti ON profiles(mbti_type);

-- 匹配查询优化
CREATE INDEX idx_likes_receiver ON likes(receiver_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);

-- 消息查询优化
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

## 5. 推荐算法设计

### 5.1 推荐流程

```
1. 获取用户推荐设置
2. 筛选候选池 (排除已匹配/已喜欢用户)
3. 应用筛选条件 (星座、MBTI)
4. 计算相似度分数并排序
5. 返回推荐列表
```

### 5.2 星座配对规则

| 星座类型 | 同类型 | 互补类型 |
|----------|--------|----------|
| 火象 (白羊、狮子、射手) | 火象 | 风象 |
| 风象 (双子、天秤、水瓶) | 风象 | 火象 |
| 土象 (金牛、处女、摩羯) | 土象 | 水象 |
| 水象 (巨蟹、天蝎、双鱼) | 水象 | 土象 |

### 5.3 MBTI 互补规则

| 类型 | 互补类型 |
|------|----------|
| INFJ | ENFP |
| INTJ | ENTP |
| INFP | ENFJ |
| INTP | ENTJ |
| ... | ... |

### 5.4 推荐 API 伪代码

```javascript
async function getRecommendations(userId, settings) {
  const user = await getProfile(userId);
  const filters = [];

  if (settings.zodiacFilter === 'same') {
    filters.push(`zodiac_sign = '${user.zodiacSign}'`);
  } else if (settings.zodiacFilter === 'complementary') {
    const complements = getComplementaryZodiac(user.zodiacSign);
    filters.push(`zodiac_sign IN (${complements})`);
  }

  if (settings.mbtiFilter === 'same') {
    filters.push(`mbti_type = '${user.mbtiType}'`);
  } else if (settings.mbtiFilter === 'complementary') {
    filters.push(`mbti_type = '${getComplementaryMBTI(user.mbtiType)}'`);
  }

  let orderBy;
  if (settings.sortBy === 'birthday') {
    orderBy = 'ABS(EXTRACT(EPOCH FROM (birthday - :userBirthday)))';
  }

  const query = `
    SELECT * FROM profiles
    WHERE user_id != :userId
    AND user_id NOT IN (SELECT matched_user FROM matches WHERE user_id = :userId)
    ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
    ORDER BY ${orderBy}
    LIMIT 20
  `;

  return await db.query(query, { userId, userBirthday: user.birthday });
}
```

---

## 6. 聊天模块设计

### 6.1 聊天流程

```
匹配成功 → 创建 match 记录 → 创建 WebSocket 连接 → 开始聊天
```

### 6.2 WebSocket 消息格式

**客户端 → 服务端:**
```javascript
{
  type: 'send_message',
  matchId: 'xxx',
  content: '你好！'
}
```

**服务端 → 客户端 (推送):**
```javascript
{
  type: 'new_message',
  messageId: 'xxx',
  matchId: 'xxx',
  senderId: 'xxx',
  content: '你好！',
  createdAt: '2026-03-15T10:00:00Z'
}
```

### 6.3 数据结构

**会话对象:**
```javascript
{
  id: 'match-uuid',
  partner: {
    id: 'user-uuid',
    displayName: '小明',
    avatarUrl: 'https://...'
  },
  lastMessage: {
    id: 'msg-uuid',
    content: '你好！',
    createdAt: '2026-03-15T10:00:00Z',
    isRead: false,
    isFromMe: false
  },
  unreadCount: 3
}
```

---

## 7. 错误处理与安全

### 7.1 错误响应格式

```javascript
{
  error: {
    code: 'ERROR_CODE',
    message: '用户友好的错误信息',
    details: {}
  }
}
```

### 7.2 常见错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| AUTH_INVALID_EMAIL | 400 | 邮箱格式错误 |
| AUTH_WEAK_PASSWORD | 400 | 密码强度不足 |
| AUTH_USER_EXISTS | 409 | 邮箱已注册 |
| AUTH_INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |
| AUTH_UNAUTHORIZED | 401 | 未登录 |
| MATCH_NOT_FOUND | 404 | 匹配不存在 |
| MBTI_INVALID_ANSWER | 400 | MBTI 答案无效 |
| VALIDATION_ERROR | 400 | 参数验证失败 |

### 7.3 安全措施

| 措施 | 说明 |
|------|------|
| 密码安全 | bcrypt 哈希 (cost 12)，最小 8 位 |
| JWT Token | access 15 分钟，refresh 7 天，HttpOnly Cookie |
| 速率限制 | 登录 5 次/分，消息 60 次/分，推荐 30 次/分 |
| 输入验证 | 参数校验，XSS 过滤，SQL 注入防护 |
| CORS | 只允许指定前端域名 |

---

## 8. 测试策略

### 8.1 测试金字塔

```
         ┌───────┐
        │ E2E   │  少量核心流程
       │ 测试   │
      └─────────┘
     ┌─────────────┐
    │   集成测试    │  关键业务逻辑
   │  (API + DB)   │
  └───────────────┘
 ┌─────────────────┐
│    单元测试      │  工具函数、算法
│   (Jest/Vitest)  │
└─────────────────┘
```

### 8.2 覆盖率目标

| 模块 | 目标覆盖率 |
|------|-----------|
| MBTI 算法 | 100% |
| 星座计算 | 100% |
| 推荐逻辑 | 90%+ |
| API 端点 | 80%+ |
| 前端组件 | 60%+ |

---

## 9. 部署与运维

### 9.1 部署架构

```
用户 → CDN/Vercel Edge → Web 前端 (Vercel) → 后端 API (Docker) → PostgreSQL
```

### 9.2 环境配置

| 环境 | 说明 |
|------|------|
| 开发 | 本地运行，热重载，本地 PostgreSQL |
| Staging | 与生产相同配置，用于测试 |
| Production | Docker 容器化，负载均衡，云数据库 |

### 9.3 监控指标

| 指标 | 告警阈值 |
|------|---------|
| API 响应时间 | P95 > 500ms |
| 错误率 | > 1% |
| WebSocket 连接数 | 突增 50% |
| 数据库连接池 | 使用率 > 80% |
| 内存使用 | > 85% |

### 9.4 CI/CD 流程

```
代码提交 → 运行测试 → 构建镜像 → 部署到 Staging → 人工验证 → 部署到 Production
```

---

## 附录：需求总结

| 模块 | 决策 |
|------|------|
| 平台 | 全平台 (Web + iOS + Android)，V1 优先 Web |
| 技术栈 | Expo + Node.js/Express + PostgreSQL |
| MVP 功能 | 用户系统 + 推荐机制 + 基础聊天 |
| 推荐机制 | 星座 + MBTI + 出生日期 (筛选 + 排序) |
| 匹配规则 | 用户可配置 (同星座/同 MBTI 等) |
| 匹配流程 | 双向确认 (Tinder 模式) |
| 登录方式 | 邮箱密码 (微信登录后续) |
| MBTI 测试 | 简化版 20-30 题 |
| 聊天功能 | 文字聊天 + 已读未读 |
| 地理功能 | 后续版本添加 |
