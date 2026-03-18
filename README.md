# WebSocket 服务器部署到 Render.com

## 📦 部署步骤

### 1. 准备 Git 仓库

首先，需要将 server 文件夹推送到 GitHub/GitLab：

```bash
cd /Users/limengyun/claude-code-file/play-lemon-svelte/server
git init
git add .
git commit -m "Initial commit: WebSocket server"
```

然后在 GitHub 创建一个新仓库（如 `chess-websocket-server`），并推送：

```bash
git remote add origin https://github.com/你的用户名/chess-websocket-server.git
git branch -M main
git push -u origin main
```

### 2. 在 Render.com 部署

1. 访问 https://render.com/ 并注册/登录
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库（chess-websocket-server）
4. 配置如下：
   - **Name**: `chess-websocket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: 选择 **Free**
5. 点击 "Create Web Service"

### 3. 等待部署完成

部署完成后，Render 会提供一个 URL，如：
```
https://chess-websocket-server.onrender.com
```

WebSocket 地址为：
```
wss://chess-websocket-server.onrender.com
```

### 4. 更新前端 WebSocket 地址

需要修改前端代码中的 WebSocket 地址：

在 `src/lib/OnlineModalWS.svelte` 中：

```javascript
// 修改前
const WS_URL = window.location.hostname === 'localhost'
  ? 'ws://localhost:3001'
  : `ws://${window.location.hostname}:3001`;

// 修改后
const WS_URL = window.location.hostname === 'localhost'
  ? 'ws://localhost:3001'
  : 'wss://chess-websocket-server.onrender.com';  // 替换为你的 Render URL
```

### 5. 重新构建前端并上传到 COS

```bash
cd /Users/limengyun/claude-code-file/play-lemon-svelte
npm run build
# 然后将 dist 文件夹内容上传到腾讯云 COS
```

## ⚠️ 注意事项

1. **免费版限制**：
   - Render 免费版在 15 分钟无活动后会休眠
   - 首次访问需要等待 30 秒唤醒
   - 适合个人项目和测试

2. **保持活跃**（可选）：
   - 可以使用 Cron 服务每 10 分钟 ping 一次服务器防止休眠
   - 或者升级到付费版（$7/月）

3. **SSL/TLS**：
   - Render 自动提供 HTTPS/WSS，无需额外配置
   - 注意使用 `wss://` 而不是 `ws://`

## 🎉 完成

部署完成后：
- 前端：https://playlemon.top
- WebSocket：wss://chess-websocket-server.onrender.com

用户可以正常使用在线对战功能了！
