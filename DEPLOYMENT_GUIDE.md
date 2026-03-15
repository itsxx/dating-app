# 部署指南 - Vercel + Render 方案

## 架构概述

```
┌─────────────────┐         ┌─────────────────┐
│   前端应用       │         │   后端应用       │
│   (Vue 3/Vite)  │  API    │   (Node.js)     │
│                 │ ───────►│   Express       │
│    Vercel       │         │     Render      │
│   (全球 CDN)     │         │  (Serverless)   │
└─────────────────┘         └─────────────────┘
```

---

## 第一步：部署后端到 Render

### 1. 准备项目

确保你的后端项目已经推送到 GitHub。

### 2. 创建 Render 服务

1. 访问 [Render](https://render.com) 并登录
2. 点击 **"New +"** → **"Web Service"**
3. 连接你的 GitHub 账号并选择 `dating-app-backend` 仓库
4. 配置如下：

| 设置项 | 值 |
|--------|-----|
| **Name** | `dating-app-backend` |
| **Region** | Singapore (新加坡，离中国最近) |
| **Branch** | `main` |
| **Root Directory** | `dating-app-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Instance Type** | `Free` |

### 3. 配置环境变量

在 Render Dashboard 的 **Environment** 标签页添加以下变量：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `JWT_SECRET` | 随机生成一个密钥（如：`your-super-secret-jwt-key-2026`） |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | 留空（等前端部署后填入） |

### 4. 部署

点击 **"Create Web Service"**，等待部署完成。

部署成功后，你会获得一个类似这样的地址：
```
https://dating-app-backend-xxxx.onrender.com
```

**重要提示**：
- 免费服务在 15 分钟无请求后会休眠
- 下次访问时需要等待 30 秒唤醒
- 可使用 [Uptime Robot](https://uptimerobot.com) 每 10 分钟 ping 一次保持活跃

---

## 第二步：部署前端到 Vercel

### 1. 配置 API 地址

在前端项目创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://dating-app-backend-xxxx.onrender.com/api
```

将 `dating-app-backend-xxxx.onrender.com` 替换为你的 Render 后端地址。

### 2. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 3. 登录 Vercel

```bash
vercel login
```

### 4. 部署

```bash
cd dating-app-frontend
vercel
```

首次部署按提示操作：
- **Set up and deploy?** `Y`
- **Which scope?** 选择你的账号
- **Link to existing project?** `N`
- **Which directory?** `.`
- **Want to override the settings?** `N`

### 5. 配置生产环境变量

在 [Vercel Dashboard](https://vercel.com/dashboard) 中：

1. 找到你的项目
2. 进入 **Settings** → **Environment Variables**
3. 添加变量：
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://dating-app-backend-xxxx.onrender.com/api`
   - **Environment**: 选中 `Production` 和 `Preview`

4. 重新部署以应用环境变量

---

## 第三步：配置 CORS

### 更新后端环境变量

回到 Render Dashboard，更新 `FRONTEND_URL` 环境变量：

```
FRONTEND_URL=https://dating-app-frontend-xxxx.vercel.app
```

将 `dating-app-frontend-xxxx.vercel.app` 替换为你的 Vercel 前端地址。

### 重启 Render 服务

在 Render Dashboard 点击 **Manual Deploy** → **Restart Web Service**

---

## 第四步：验证部署

### 测试后端

访问：
```
https://dating-app-backend-xxxx.onrender.com/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T..."
}
```

### 测试前端

访问：
```
https://dating-app-frontend-xxxx.vercel.app
```

打开浏览器控制台，检查是否有 API 请求错误。

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
git push

# Render 和 Vercel 会自动从 GitHub 同步并部署
```

---

## 保持后端活跃（可选）

### 使用 Uptime Robot 防止休眠

1. 注册 [Uptime Robot](https://uptimerobot.com)
2. 添加新监控：
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: dating-app-backend
   - **URL**: `https://dating-app-backend-xxxx.onrender.com/health`
   - **Monitoring Interval**: 5 分钟

这样每 5 分钟会 ping 一次，防止服务休眠。

---

## 成本

| 服务 | 免费计划 | 说明 |
|------|---------|------|
| Vercel | ✅ 永久免费 | 100GB 带宽/月 |
| Render | ✅ 永久免费 | 15 分钟无请求休眠 |
| Uptime Robot | ✅ 免费 | 50 个监控，5 分钟间隔 |

**总计：¥0/月**

---

## 常见问题

### 1. CORS 错误
确保 `FRONTEND_URL` 环境变量已正确设置，并且重启了 Render 服务。

### 2. WebSocket 连接失败
Render 免费计划不支持 WebSocket，聊天功能可能需要降级为轮询。

### 3. 数据库丢失
当前使用 SQLite 本地文件，Render 重启后数据会丢失。建议迁移到云数据库：
- [Neon](https://neon.tech) - 免费 PostgreSQL
- [Supabase](https://supabase.com) - 免费 PostgreSQL + 实时功能

---

*最后更新：2026-03-15*
