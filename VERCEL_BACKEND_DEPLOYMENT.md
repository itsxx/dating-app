# Vercel 后端部署步骤

## 快速部署（通过 Vercel Dashboard）

### 1. 登录 Vercel

访问：[https://vercel.com/login](https://vercel.com/login)

使用 GitHub 账号登录（推荐），这样可以直接导入 GitHub 仓库。

---

### 2. 导入项目

1. 登录后，点击 **"Add New Project"**
2. 在 "Import Git Repository" 下，点击 **"Continue With GitHub"**
3. 搜索并选择 `itsxx/dating-app` 仓库
4. 点击 **"Import"**

---

### 3. 配置后端项目

按以下配置填写：

| 配置项 | 值 |
|--------|-----|
| **Name** | `dating-app-backend`（或你喜欢的名字） |
| **Framework Preset** | `Other` |
| **Root Directory** | `dating-app-backend` |
| **Build Command** | `npm install` |
| **Output Directory** | 留空 |
| **Install Command** | `npm install` |

---

### 4. 添加环境变量

点击 **"Environment Variables"**，添加以下变量：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgres://user:password@xxx-xxx.ap-southeast-1.pg.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-2026` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | （暂时留空，等前端部署后再填） |

**注意**：`DATABASE_URL` 需要替换为你自己的 Neon 数据库连接字符串。

---

### 5. 部署

点击 **"Deploy"** 按钮。

等待部署完成（大约 1-2 分钟）。

部署成功后，你会看到：
- 部署状态：**Ready**
- 访问地址：`https://dating-app-backend-xxxx.vercel.app`

---

### 6. 测试后端

在浏览器中访问：
```
https://dating-app-backend-xxxx.vercel.app/health
```

应该返回：
```json
{"status":"ok","timestamp":"2026-03-16T..."}
```

---

### 7. 初始化数据库（如果需要）

在 Vercel Dashboard 中：
1. 进入项目页面
2. 点击 **"Storage"** 标签
3. 如果还没有创建数据库，点击 **"Add Database"** 创建 Neon PostgreSQL

或者手动在 Neon Dashboard 运行建表 SQL（见 `VERCEL_FULL_DEPLOYMENT.md`）。

---

## 部署后的项目地址

部署成功后，你的后端会有以下地址：

- **开发预览**: `https://dating-app-backend-git-master-xxxx.vercel.app`
- **生产环境**: `https://dating-app-backend-xxxx.vercel.app`

---

## 常见问题

### Q: 部署失败，提示 "No output"
**A**: 这是正常的，因为后端是 API 服务，不输出静态文件。确保：
- Root Directory 设置为 `dating-app-backend`
- Build Command 设置为 `npm install`

### Q: 500 Error - Cannot find module 'pg'
**A**: 确保 `pg` 在 `package.json` 的 dependencies 中：
```json
"dependencies": {
  "pg": "^8.11.3"
}
```

### Q: 数据库连接失败
**A**: 检查：
1. `DATABASE_URL` 是否正确
2. 确保连接字符串包含 `?sslmode=require`
3. 在 Neon Dashboard 确认数据库已创建

---

## 下一步：部署前端

后端部署成功后，继续部署前端：

1. 返回 Vercel Dashboard
2. 点击 **"Add New Project"**
3. 选择同一个仓库 `itsxx/dating-app`
4. Root Directory: `dating-app-frontend`
5. 添加环境变量 `VITE_API_BASE_URL`: `https://你的后端地址.vercel.app/api`
6. 点击 **"Deploy"**

---

需要帮助？查看完整文档：`VERCEL_FULL_DEPLOYMENT.md`
