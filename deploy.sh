#!/bin/bash

# 部署脚本 - 需要根据你的服务器信息修改

# ===== 配置部分 - 请修改这里 =====
SERVER_USER="root"                          # 服务器用户名
SERVER_HOST="your-server-ip"                # 服务器 IP 或域名
SERVER_PATH="/var/www/chess-server"         # 服务器部署路径
# ==================================

echo "📦 开始部署 WebSocket 服务器..."

# 1. 打包服务器文件
echo "📦 打包文件..."
cd "$(dirname "$0")"
tar -czf server.tar.gz server.js package.json package-lock.json

# 2. 上传到服务器
echo "📤 上传到服务器..."
scp server.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# 3. 在服务器上部署
echo "🚀 在服务器上部署..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
# 创建目录
mkdir -p /var/www/chess-server
cd /var/www/chess-server

# 解压文件
tar -xzf /tmp/server.tar.gz
rm /tmp/server.tar.gz

# 安装依赖
npm install --production

# 安装 PM2（如果没有）
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 停止旧进程
pm2 stop chess-websocket-server 2>/dev/null || true
pm2 delete chess-websocket-server 2>/dev/null || true

# 启动服务
pm2 start server.js --name chess-websocket-server

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机自启
pm2 startup | tail -n 1 | bash

echo "✅ 部署完成！"
pm2 status
ENDSSH

# 清理本地打包文件
rm server.tar.gz

echo "🎉 部署完成！WebSocket 服务器运行在 ws://$SERVER_HOST:3001"
