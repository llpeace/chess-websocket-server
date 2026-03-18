import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({
  port: PORT,
  host: '0.0.0.0' // 监听所有网络接口
});

// 房间管理
const rooms = new Map(); // roomId -> { host, guest, hostWs, guestWs }
const connections = new Map(); // ws -> { roomId, role }

console.log(`🚀 WebSocket 服务器运行在 ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('📱 新客户端连接');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (err) {
      console.error('❌ 消息解析错误:', err);
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
    }
  });

  ws.on('close', () => {
    console.log('📴 客户端断开连接');
    handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket 错误:', err);
  });
});

function handleMessage(ws, message) {
  const { type, data } = message;

  switch (type) {
    case 'create_room':
      createRoom(ws);
      break;
    case 'join_room':
      joinRoom(ws, data.roomId);
      break;
    case 'move':
      console.log('📨 服务器收到move:', data);
      broadcastToRoom(ws, { type: 'move', data: data.move });
      break;
    case 'chat':
      broadcastToRoom(ws, { type: 'chat', data: data.message });
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: '未知消息类型' }));
  }
}

function createRoom(ws) {
  const roomId = nanoid(10); // 生成10位房间号

  rooms.set(roomId, {
    hostWs: ws,
    guestWs: null,
    createdAt: Date.now()
  });

  connections.set(ws, { roomId, role: 'host' });

  console.log(`✅ 房间创建成功: ${roomId}`);

  ws.send(JSON.stringify({
    type: 'room_created',
    data: {
      roomId,
      role: 'host',
      color: 'red'
    }
  }));
}

function joinRoom(ws, roomId) {
  const room = rooms.get(roomId);

  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间不存在'
    }));
    return;
  }

  if (room.guestWs) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间已满'
    }));
    return;
  }

  // 加入房间
  room.guestWs = ws;
  connections.set(ws, { roomId, role: 'guest' });

  console.log(`✅ 玩家加入房间: ${roomId}`);

  // 通知加入者
  ws.send(JSON.stringify({
    type: 'room_joined',
    data: {
      roomId,
      role: 'guest',
      color: 'black'
    }
  }));

  // 通知房主
  room.hostWs.send(JSON.stringify({
    type: 'opponent_joined',
    data: {
      message: '对手已加入'
    }
  }));
}

function broadcastToRoom(ws, message) {
  const conn = connections.get(ws);

  if (!conn) {
    console.error('❌ 未找到连接信息');
    return;
  }

  const room = rooms.get(conn.roomId);

  if (!room) {
    console.error('❌ 未找到房间');
    return;
  }

  // 发送给对手
  const targetWs = conn.role === 'host' ? room.guestWs : room.hostWs;

  if (targetWs && targetWs.readyState === 1) { // OPEN
    targetWs.send(JSON.stringify(message));
    console.log(`📤 消息转发: ${message.type}`);
  }
}

function handleDisconnect(ws) {
  const conn = connections.get(ws);

  if (!conn) return;

  const room = rooms.get(conn.roomId);

  if (room) {
    // 通知对手
    const opponentWs = conn.role === 'host' ? room.guestWs : room.hostWs;

    if (opponentWs && opponentWs.readyState === 1) {
      opponentWs.send(JSON.stringify({
        type: 'opponent_disconnected',
        data: { message: '对手已断开连接' }
      }));
    }

    // 删除房间
    rooms.delete(conn.roomId);
    console.log(`🗑️  房间已删除: ${conn.roomId}`);
  }

  connections.delete(ws);
}

// 定期清理过期房间（1小时未使用）
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > oneHour && !room.guestWs) {
      rooms.delete(roomId);
      console.log(`🧹 清理过期房间: ${roomId}`);
    }
  }
}, 10 * 60 * 1000); // 每10分钟检查一次
