# Vercel + Supabase 部署指南

## 快速部署（5 分钟完成）

---

## 第一步：创建 Supabase 数据库

1. 访问 [https://supabase.com](https://supabase.com)
2. 用 GitHub 账号登录
3. 点击 **"New project"**
4. 填写：
   - **Organization**: 你的组织
   - **Project name**: `dating-app`
   - **Database password**: 设置强密码（**保存好！**）
   - **Region**: `Singapore (Singapore)` ⭐
5. 点击 **"Create new project"**

---

## 第二步：获取数据库连接字符串

等待项目创建完成（2-3 分钟），然后：

1. 进入项目 Dashboard
2. 左侧菜单 **"Project Settings"**（齿轮图标）
3. 点击 **"Database"**
4. 找到 **"Connection string"**
5. 选择 **"URI"** 标签
6. 复制连接字符串，类似：
   ```
   postgresql://postgres.xxxxxxxxxxxxx:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

---

## 第三步：初始化数据库表

在 Supabase Dashboard：

1. 点击左侧 **"SQL Editor"**
2. 点击 **"New query"**
3. 粘贴以下 SQL 并运行：

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
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

-- MBTI tests table
CREATE TABLE IF NOT EXISTS mbti_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB,
  result_type TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendation settings table
CREATE TABLE IF NOT EXISTS recommendation_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zodiac_filter TEXT DEFAULT 'none',
  mbti_filter TEXT DEFAULT 'none',
  sort_by TEXT DEFAULT 'birthday',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON profiles(birthday);
CREATE INDEX IF NOT EXISTS idx_profiles_zodiac ON profiles(zodiac_sign);
CREATE INDEX IF NOT EXISTS idx_profiles_mbti ON profiles(mbti_type);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
```

4. 点击 **"Run"** 或按 `Ctrl+Enter`

---

## 第四步：部署后端到 Vercel

### 4.1 导入项目

1. 访问 [https://vercel.com](https://vercel.com) 登录
2. 点击 **"Add New Project"**
3. 选择 **"Import Git Repository"**
4. 找到 `itsxx/dating-app` 仓库，点击 **"Import"**

### 4.2 配置项目

| 配置项 | 值 |
|--------|-----|
| **Name** | `dating-app-backend` |
| **Framework Preset** | `Other` |
| **Root Directory** | `dating-app-backend` |
| **Build Command** | `npm install` |
| **Output Directory** | 留空 |
| **Install Command** | `npm install` |

### 4.3 添加环境变量

点击 **"Environment Variables"**，添加：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres.xxx:...` (你的 Supabase 连接字符串) |
| `JWT_SECRET` | `your-super-secret-jwt-key-2026` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |

### 4.4 部署

点击 **"Deploy"**，等待 1-2 分钟。

部署成功后获得地址：
```
https://dating-app-backend-xxxx.vercel.app
```

### 4.5 测试后端

访问：
```
https://dating-app-backend-xxxx.vercel.app/health
```

应该返回：
```json
{"status":"ok","timestamp":"2026-03-17T..."}
```

---

## 第五步：部署前端到 Vercel

### 5.1 导入项目

1. 再次点击 **"Add New Project"**
2. 选择同一个仓库 `itsxx/dating-app`
3. 配置：

| 配置项 | 值 |
|--------|-----|
| **Name** | `dating-app-frontend` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `dating-app-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 5.2 添加环境变量

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://dating-app-backend-xxxx.vercel.app/api` |

（将 `xxxx` 替换为你的后端地址）

### 5.3 部署

点击 **"Deploy"**

---

## 第六步：配置 CORS

回到后端项目：

1. 进入 Vercel Dashboard → 后端项目
2. **Settings** → **Environment Variables**
3. 添加：
   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://dating-app-frontend-xxxx.vercel.app` |
4. 点击 **"Redeploy"** 重新部署后端

---

## 完成！🎉

现在你可以访问前端地址使用应用了。

---

## 常见问题

### Q: Supabase 连接失败
**A**: 检查连接字符串是否包含正确的 password，确保没有多余空格。

### Q: CORS 错误
**A**: 确保 `FRONTEND_URL` 环境变量已设置并重新部署了后端。

### Q: 表不存在
**A**: 在 Supabase SQL Editor 中重新运行第三步的建表 SQL。

---

*最后更新：2026-03-17*
