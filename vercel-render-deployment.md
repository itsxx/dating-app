# Vercel + Render 免费部署方案

## 架构概述

```
┌─────────────────┐         ┌─────────────────┐
│     前端应用     │         │     后端应用     │
│   (React/Vue)   │  API    │    (Java)       │
│                 │ ───────►│   Spring Boot   │
│    Vercel       │  调用   │     Render      │
│   (全球 CDN)     │         │  (Serverless)   │
└─────────────────┘         └─────────────────┘
```

## 平台选择

### 前端：Vercel
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动 CI/CD（Git push 即部署）
- ✅ 免费 `*.vercel.app` 域名
- 📏 限制：100GB 带宽/月

### 后端：Render
- ✅ 完全免费
- ✅ 支持 Java/Spring Boot
- ✅ 自动部署
- ⚠️ 注意：15 分钟无请求会休眠，下次请求需等待 30 秒唤醒

---

## 前端部署步骤（Vercel）

### 1. 准备项目

```bash
# 创建前端项目（以 Vite + React 为例）
npm create vite@latest my-frontend
cd my-frontend
npm install
```

### 2. 配置 API 地址

```javascript
// src/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```

```env
# .env
VITE_API_URL=https://your-app.onrender.com
```

### 3. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

### 4. 设置环境变量

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
- `VITE_API_URL`: 你的 Render 后端地址

---

## 后端部署步骤（Render）

### 1. 准备 Spring Boot 项目

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

### 2. 配置 CORS

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addAllowedOriginPattern("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(false);
    }
}
```

### 3. 配置 application.yml

```yaml
server:
  port: ${PORT:8080}  # Render 需要读取 PORT 环境变量

spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/mydb}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:password}
```

### 4. 创建 render.yaml

```yaml
services:
  - type: web
    name: my-backend
    env: java
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: java -jar target/my-app.jar
    envVars:
      - key: PORT
        value: 8080
      - key: SPRING_PROFILES_ACTIVE
        value: prod
```

### 5. 部署到 Render

1. 登录 [Render](https://render.com)
2. 连接 GitHub 仓库
3. 点击 "New +" → "Web Service"
4. 选择你的仓库
5. 配置：
   - **Name**: 你的应用名称
   - **Environment**: Java
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/my-app.jar`
6. 添加环境变量（如数据库连接等）
7. 点击 "Create Web Service"

---

## 开发工作流

```bash
# 前端开发
cd frontend
npm run dev

# 后端开发
cd backend
./mvnw spring-boot:run

# 部署
git add .
git commit -m "feat: add new feature"
git push  # 自动触发 Vercel 和 Render 部署
```

---

## 常见问题

### 1. Render 服务休眠问题
- **现象**: 15 分钟无请求后服务休眠，下次请求需等待 30 秒
- **解决**:
  - 使用 [Uptime Robot](https://uptimerobot.com) 每 10 分钟 ping 一次
  - 或升级到付费计划 ($7/月起)

### 2. CORS 错误
- 确保后端配置了正确的 CORS 允许来源
- 开发环境和生产环境分别配置

### 3. 数据库连接
- Render 提供免费的 PostgreSQL 数据库（90 天免费）
- 或使用免费的云数据库：
  - [Neon](https://neon.tech) - PostgreSQL
  - [PlanetScale](https://planetscale.com) - MySQL
  - [MongoDB Atlas](https://mongodb.com/atlas) - MongoDB

---

## 成本估算

| 服务 | 免费计划 | 升级选项 |
|------|---------|---------|
| Vercel | ✅ 永久免费 | $20/月（商业项目） |
| Render | ✅ 永久免费（会休眠） | $7/月（不休眠） |
| 数据库 | 90 天免费 | $7/月起 |

**总计**: $0/月（个人项目完全够用）

---

## 参考资源

- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://render.com/docs)
- [Spring Boot 部署指南](https://spring.io/guides)

---

*最后更新：2026-03-15*
