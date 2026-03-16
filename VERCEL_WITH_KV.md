# Vercel 全栈部署方案 - 无需外部数据库

## 架构

```
┌─────────────────┐         ┌─────────────────┐
│   前端应用       │         │   后端应用       │
│   (Vue 3/Vite)  │  API    │   (Node.js)     │
│                 │ ───────►│   Express       │
│    Vercel       │         │    Vercel       │
│   (全球 CDN)     │         │  (Serverless)   │
└─────────────────┘         └─────────────────┘
                              │
                              │ 使用 Vercel KV / Upstash Redis
                              ▼
                       ┌─────────────────┐
                       │   Upstash Redis  │
                       │   (免费托管)     │
                       └─────────────────┘
```

---

## 方案选择

### 方案 A：使用 Vercel KV（推荐 - 最简单）
- ✅ 在 Vercel Dashboard 直接创建
- ✅ 无需信用卡
- ✅ 免费 10,000 次读取/天
- ✅ 无需额外注册

### 方案 B：使用 Upstash Redis
- ✅ 免费 10,000 次命令/天
- ✅ 全球 CDN 加速
- ⚠️ 需要单独注册

### 方案 C：使用 SQLite + Vercel Blob
- ✅ 数据持久化到 Vercel Blob
- ⚠️ 需要改造代码

---

## 方案 A：使用 Vercel KV（推荐）

### 1. 部署后端到 Vercel

1. 访问 [vercel.com](https://vercel.com) 登录
2. **Add New Project** → 选择 `itsxx/dating-app`
3. **Root Directory**: `dating-app-backend`
4. **Build Command**: `npm install`
5. 先不添加环境变量，直接 **Deploy**

### 2. 创建 Vercel KV 存储

1. 在 Vercel Dashboard 找到你的后端项目
2. 点击 **"Storage"** 标签
3. 点击 **"Add Database"**
4. 选择 **"KV"**
5. 点击 **"Create"**

创建成功后，Vercel 会自动添加以下环境变量到你的项目：
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 3. 修改后端代码使用 KV

我帮你更新代码，使用 Redis 替代 SQLite：

需要安装的依赖：
```bash
cd dating-app-backend
npm install @vercel/kv
```

---

## 方案 B：使用 Upstash Redis（备选）

### 1. 注册 Upstash

1. 访问 [https://upstash.com](https://upstash.com)
2. 用 GitHub 登录
3. 点击 **"Create Database"**
4. 选择区域：**Asia Pacific (Singapore)**
5. 选择 **"Sandbox"** 免费计划

创建后获得 `UPSTASH_REDIS_REST_URL`

### 2. 部署后端

环境变量添加：
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `UPSTASH_REDIS_REST_URL` | （你的 Upstash URL） |
| `JWT_SECRET` | `your-super-secret-jwt-key-2026` |

---

## 方案 C：使用 Supabase PostgreSQL

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册并创建项目
3. 获取数据库连接字符串

---

## 我的建议

**使用方案 A（Vercel KV）**，原因：
1. 不需要额外注册网站
2. 在 Vercel Dashboard 直接创建
3. 自动配置环境变量
4. 免费额度足够个人项目使用

**但是**需要注意：
- KV 是 Redis（键值存储），不是关系型数据库
- 需要修改代码适配 Redis 数据结构
- 适合简单的数据存储场景

你想要哪个方案？我帮你更新代码。
