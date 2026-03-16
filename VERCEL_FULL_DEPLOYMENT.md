# Vercel 前后端部署指南

## 架构概述

```
┌─────────────────┐         ┌─────────────────┐
│   前端应用       │         │   后端应用       │
│   (Vue 3/Vite)  │  API    │   (Node.js)     │
│                 │ ───────►│   Express       │
│    Vercel       │         │    Vercel       │
│   (全球 CDN)     │         │  (Serverless)   │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                              ┌─────────────────┐
                              │    数据库        │
                              │  Neon PostgreSQL│
                              │   (免费托管)     │
                              └─────────────────┘
```

**代码已自动适配 SQLite/PostgreSQL**：
- 本地开发：使用 SQLite
- Vercel 部署：自动切换到 PostgreSQL（通过 DATABASE_URL 环境变量检测）

---

## 第一步：创建 Neon PostgreSQL 数据库

1. 访问 [https://neon.tech](https://neon.tech) 并注册（支持 GitHub 登录）
2. 点击 **"Create a project"**
3. 输入项目名称：`dating-app-db`
4. 选择区域：**Asia Pacific (Singapore)** - 离中国最近
5. 点击 **"Create project"**

创建成功后，你会看到一个连接字符串，类似：
```
postgres://user:password@xxx-xxx.ap-southeast-1.pg.neon.tech/neondb?sslmode=require
```

**保存这个连接字符串！** 后面需要用它配置环境变量。

---

## 第二步：初始化数据库表结构

在本地运行以下命令创建 PostgreSQL 数据库表：

```bash
cd dating-app-backend

# 设置环境变量
export DATABASE_URL="你的 Neon 连接字符串"

# 初始化数据库
npm run db:init
```

或者你可以直接在 Neon Dashboard 的 SQL 编辑器中运行：

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  birthday DATE NOT NULL,
  mbti_type TEXT,
  zodiac_sign TEXT,
  latitude REAL,
  longitude REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mbti_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB,
  result_type TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zodiac_filter TEXT DEFAULT 'none',
  mbti_filter TEXT DEFAULT 'none',
  sort_by TEXT DEFAULT 'birthday',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_birthday ON profiles(birthday);
CREATE INDEX idx_profiles_zodiac ON profiles(zodiac_sign);
CREATE INDEX idx_profiles_mbti ON profiles(mbti_type);
CREATE INDEX idx_likes_receiver ON likes(receiver_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

## 第三步：推送代码到 GitHub

确保所有更改已经提交并推送：

```bash
git add .
git commit -m "feat: add PostgreSQL support for Vercel deployment"
git push
```

---

## 第四步：部署后端到 Vercel

### 方法一：通过 Vercel Dashboard（推荐）

1. 登录 [Vercel](https://vercel.com)
2. 点击 **"Add New Project"**
3. 导入 Git Repository：选择 `itsxx/dating-app`
4. 配置项目：
   - **Name**: `dating-app-backend`
   - **Framework Preset**: `Other`
   - **Root Directory**: `dating-app-backend`
   - **Build Command**: `npm install`
   - **Output Directory**: 留空
   - **Install Command**: `npm install`

5. 点击 **"Environment Variables"** 添加以下变量：
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | (你的 Neon 连接字符串) |
   | `JWT_SECRET` | `your-super-secret-jwt-key-change-this-2026` |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | (等前端部署后填入) |

6. 点击 **"Deploy"**

部署完成后，你会获得一个类似这样的地址：
```
https://dating-app-backend-xxxx.vercel.app
```

测试后端：
```
https://dating-app-backend-xxxx.vercel.app/health
```
应该返回：`{"status":"ok","timestamp":"..."}`

---

## 第五步：部署前端到 Vercel

### 通过 Vercel Dashboard

1. 再次点击 **"Add New Project"**
2. 导入同一个 Git Repository：`itsxx/dating-app`
3. 配置项目：
   - **Name**: `dating-app-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `dating-app-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. 点击 **"Environment Variables"** 添加：
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://dating-app-backend-xxxx.vercel.app/api` |

   （将 `xxxx` 替换为你的后端项目地址）

5. 点击 **"Deploy"**

部署完成后，你会获得一个类似这样的地址：
```
https://dating-app-frontend-xxxx.vercel.app
```

---

## 第六步：配置 CORS

回到后端项目的环境变量设置，更新：

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://dating-app-frontend-xxxx.vercel.app` |

然后在 Vercel Dashboard 中点击 **"Redeploy"** 重新部署后端。

---

## 第七步：验证部署

### 测试后端 API

访问：
```
https://dating-app-backend-xxxx.vercel.app/health
```

### 测试前端

访问：
```
https://dating-app-frontend-xxxx.vercel.app
```

打开浏览器控制台（F12），检查是否有 API 请求错误。

---

## 开发工作流

```bash
# 本地开发
cd dating-app-backend
npm run dev

cd ../dating-app-frontend
npm run dev

# 部署
git add .
git commit -m "feat: add new feature"
git push  # Vercel 会自动从 GitHub 同步并部署
```

---

## 注意事项

### 1. WebSocket 限制

Vercel Serverless **不支持 WebSocket**，聊天功能需要降级为 HTTP 轮询。

当前代码中的 WebSocket 部分会在 Vercel 环境下自动禁用（见 `src/index.js` 第 60 行）。

### 2. 数据库

使用 Neon PostgreSQL（免费计划）：
- ✅ 数据持久化
- ✅ 无休眠限制
- ✅ 0.5GB 存储
- ⚠️ 5 分钟无活动会休眠，下次请求需等待约 1 秒唤醒

### 3. Serverless 冷启动

Vercel Serverless 函数在闲置后会冷启动，首次请求可能需要 1-3 秒。

### 4. 数据库自动适配

代码会自动根据 `DATABASE_URL` 环境变量检测数据库类型：
- 有 `DATABASE_URL`：使用 PostgreSQL
- 无 `DATABASE_URL`：使用 SQLite（本地开发）

---

## 环境变量总结

### 后端 (dating-app-backend)
| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `DATABASE_URL` | `postgres://...` | Neon 数据库连接 |
| `JWT_SECRET` | 随机密钥 | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | `15m` | Token 有效期 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | 刷新 Token 有效期 |
| `FRONTEND_URL` | `https://...` | 前端地址（CORS） |

### 前端 (dating-app-frontend)
| Key | Value | 说明 |
|-----|-------|------|
| `VITE_API_BASE_URL` | `https://.../api` | 后端 API 地址 |

---

## 成本

| 服务 | 免费计划 | 说明 |
|------|---------|------|
| Vercel | ✅ 永久免费 | 100GB 带宽/月 |
| Neon | ✅ 永久免费 | 0.5GB 存储 |

**总计：¥0/月**

---

## 常见问题

### 1. CORS 错误

确保 `FRONTEND_URL` 环境变量已正确设置，并且重新部署了后端。

### 2. 数据库连接失败

检查 `DATABASE_URL` 是否正确，确保包含 `?sslmode=require`。

### 3. 404 错误

确保 API 请求路径是 `/api/xxx`，Vercel 配置了正确的路由。

### 4. WebSocket 连接失败

Vercel Serverless 不支持 WebSocket，聊天功能已自动降级为 HTTP 轮询。

---

*最后更新：2026-03-16*
