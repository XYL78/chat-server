// server.js - WebSocket 聊天服务器
// 支持：文本、图片/视频文件（base64）、转账、兑换、信令转发（用于 WebRTC 通话）
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 }, () => {
    console.log('✅ WebSocket 服务器已启动，端口:', process.env.PORT || 3000);
});

// 存储所有客户端连接 { ws, id, name, avatar, balance }
const clients = new Map();
let idCounter = 0;

wss.on('connection', (ws) => {
    const clientId = ++idCounter;
    clients.set(ws, { id: clientId, name: '用户' + clientId, avatar: '', balance: 200 });

    console.log(`🔗 新连接: #${clientId}，当前在线: ${clients.size}`);

    // 广播在线人数（可选）
    broadcastOnlineCount();

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            // ========== 通用消息广播（转发给所有其他客户端） ==========
            // 所有消息都添加发送者信息，并广播给所有人
            const sender = clients.get(ws);
            if (!sender) return;

            // 如果是 'info' 类型，更新服务器存储的用户信息
            if (data.type === 'info') {
                if (data.name) sender.name = data.name;
                if (data.avatar) sender.avatar = data.avatar;
                if (data.balance !== undefined) sender.balance = data.balance;
                // 广播更新后的信息给所有人
                broadcast({
                    type: 'info',
                    fromId: sender.id,
                    name: sender.name,
                    avatar: sender.avatar,
                    balance: sender.balance
                }, ws);
                return;
            }

            // 如果是 'transfer-request' 或 'transfer-confirm'，直接转发
            // 如果是 'call-request', 'call-accept', 'call-reject', 'call-end'，直接转发
            // 如果是 'text' 或 'file'，直接转发
            // 所有消息都带上发送者信息
            const payload = {
                ...data,
                fromId: sender.id,
                fromName: sender.name,
                fromAvatar: sender.avatar
            };

            // 广播给所有其他客户端（不发给发送者自己，避免重复）
            broadcast(payload, ws);

        } catch (e) {
            console.warn('解析消息失败:', e.message);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`❌ 连接断开: #${clientId}，当前在线: ${clients.size}`);
        broadcastOnlineCount();
    });

    ws.on('error', (err) => {
        console.error('WebSocket 错误:', err.message);
    });
});

// 广播给所有客户端（除 sender 外）
function broadcast(data, sender) {
    const message = JSON.stringify(data);
    clients.forEach((client, ws) => {
        if (ws !== sender && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}

// 广播在线人数
function broadcastOnlineCount() {
    const count = clients.size;
    const message = JSON.stringify({ type: 'system', text: `👥 当前在线: ${count} 人`, onlineCount: count });
    clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}

// 心跳保活（每30秒）
setInterval(() => {
    clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    });
}, 30000);

console.log('💬 聊天服务器运行中...');
