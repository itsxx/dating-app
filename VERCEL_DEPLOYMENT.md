# Vercel 部署指南 - 无需信用卡

## 方案概述

使用 Vercel 部署前后端，完全免费，不需要信用卡。

```
┌─────────────────┐         ┌─────────────────┐
│   前端应用       │         │   后端应用       │
│   (Vue 3/Vite)  │  API    │   (Node.js)     │
│                 │ ───────►│   Express       │
│    Vercel       │         │    Vercel       │
│   (全球 CDN)     │         │  (Serverless)   │
└─────────────────┘         └─────────────────┘
```

---

## 第一步：部署后端到 Vercel

### 1. 登录 Vercel

访问 [vercel.com](https://vercel.com) 并使用 GitHub 登录。

### 2. 导入项目

1. 点击 **"Add New Project"**
2. 选择 **Import Git Repository**
3. 选择你的仓库：`itsxx/dating-app`

### 3. 配置项目

| 设置项 | 值 |
|--------|-----|
| **Framework Preset** | `Other` |
| **Root Directory** | `dating-app-backend` |
| **Build Command** | `npm install` |
| **Output Directory** | 留空 |
| **Install Command** | `npm install` |

### 4. 添加环境变量

点击 **Environment Variables** 添加：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `your-super-secret-key-change-this-2026` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | 留空（等前端部署后填入） |
| `SQLITE_DB_PATH` | `/tmp/dating_app.db` |

### 5. 部署

点击 **"Deploy"**，等待部署完成。

部署成功后，你会获得一个类似这样的地址：
```
https://dating-app-backend-xxxx.vercel.app
```

测试后端：
```
https://dating-app-backend-xxxx.vercel.app/health
```

---

## 第二步：部署前端到 Vercel

### 1. 创建新项目

同样的方式，再次点击 **"Add New Project"**。

### 2. 配置项目

| 设置项 | 值 |
|--------|-----|
| **Framework Preset** | `Vite` |
| **Root Directory** | `dating-app-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3. 添加环境变量

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://dating-app-backend-xxxx.vercel.app/api` |

（将 `xxxx` 替换为你的后端项目地址）

### 4. 部署

点击 **"Deploy"**。

部署成功后，你会获得一个类似这样的地址：
```
https://dating-app-frontend-xxxx.vercel.app
```

---

## 第三步：配置 CORS

回到后端项目的环境变量设置，更新：

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://dating-app-frontend-xxxx.vercel.app` |

然后在 Vercel Dashboard 中点击 **"Redeploy"** 重新部署后端。

---

## 部署命令（可选）

你也可以使用 Vercel CLI 进行部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署后端
cd dating-app-backend
vercel --prod

# 部署前端
cd ../dating-app-frontend
vercel --prod
```

---

## 注意事项

### 1. SQLite 数据持久化

Vercel Serverless 使用临时文件系统 (`/tmp`)，数据**无法持久化**。

解决方案：使用云数据库
- [Neon](https://neon.tech) - 免费 PostgreSQL
- [Supabase](https://supabase.com) - 免费 PostgreSQL
- [Turso](https://turso.tech) - 免费 SQLite (每月 10 亿次读取)

### 2. WebSocket 限制

Vercel Serverless 不支持 WebSocket，聊天功能需要降级为 HTTP 轮询。

### 3. 冷启动

Serverless 函数在闲置后会冷启动，首次请求可能需要 1-3 秒。

---

## 替代平台：Koyeb（无需信用卡）

如果 Vercel 无法满足需求，可以使用 [Koyeb](https://koyeb.com)：

1. 访问 [app.koyeb.com](https://app.koyeb.com/signup) 注册（支持 GitHub 登录）
2. 点击 **"Create Service"**
3. 选择 **"Deploy from Git"**
4. 选择你的仓库
5. 配置：
   - **Service name**: `dating-app-backend`
   - **Build command**: `npm install`
   - **Start command**: `node src/index.js`
   - **Environment variables**: 添加与上面相同的环境变量
6. 选择 **Free 计划**（不需要信用卡）
7. 点击 **"Deploy Service"**

Koyeb 提供：
- 免费 512MB 内存
- 免费 0.1 CPU
- 数据持久化（使用 Koyeb 的 Volume）

---

*最后更新：2026-03-16*
