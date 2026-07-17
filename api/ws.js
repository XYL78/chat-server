import { WebSocketServer } from 'ws';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const wss = new WebSocketServer({ noServer: true });
  const roomMap = new Map();

  wss.on('connection', (ws) => {
    let roomId = null;
    let userId = Math.random().toString(36).slice(2, 10);
    let userInfo = { name: "访客", avatar: "", balance: 200 };

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        // 加入房间
        if (data.type === 'join') {
          roomId = data.room.toUpperCase();
          userInfo.name = data.name || "我";
          userInfo.avatar = data.avatar || "";
          userInfo.balance = Number(data.balance) ?? 200;

          if (!roomMap.has(roomId)) roomMap.set(roomId, new Set());
          roomMap.get(roomId).add(ws);

          ws.send(JSON.stringify({
            type: "welcome",
            id: userId,
            text: "成功进入配对房间"
          }));

          broadcast(roomId, {
            type: "system",
            text: `${userInfo.name} 进入房间`
          }, ws);
          return;
        }

        // 用户资料同步
        if (data.type === 'info') {
          userInfo.name = data.name;
          userInfo.avatar = data.avatar;
          userInfo.balance = Number(data.balance);
          broadcast(roomId, {
            type: "info",
            fromId: userId,
            fromName: userInfo.name,
            fromAvatar: userInfo.avatar,
            balance: userInfo.balance
          }, ws);
          return;
        }

        // 文本消息
        if (data.type === 'text') {
          broadcast(roomId, {
            type: "text",
            fromId: userId,
            fromName: userInfo.name,
            fromAvatar: userInfo.avatar,
            text: data.text,
            time: data.time
          }, ws);
          return;
        }

        // 文件/图片/视频消息
        if (data.type === 'file') {
          broadcast(roomId, {
            type: "file",
            fromId: userId,
            fromName: userInfo.name,
            fromAvatar: userInfo.avatar,
            fileType: data.fileType,
            fileName: data.fileName,
            data: data.data,
            time: data.time
          }, ws);
          return;
        }

        // 转账请求
        if (data.type === 'transfer-request') {
          broadcast(roomId, {
            type: "transfer-request",
            fromId: userId,
            fromName: userInfo.name,
            amount: data.amount,
            timestamp: data.timestamp
          }, ws);
          return;
        }
        if (data.type === 'transfer-confirm') {
          broadcast(roomId, {
            type: "transfer-confirm",
            fromId: userId,
            amount: data.amount,
            requestTimestamp: data.requestTimestamp
          }, ws);
          return;
        }

        // WebRTC通话信令
        if (data.type === 'call-request') {
          broadcast(roomId, {
            type: "call-request",
            fromId: userId,
            fromName: userInfo.name,
            isVideo: data.isVideo
          }, ws);
          return;
        }
        if (data.type === 'call-accept') {
          broadcast(roomId, { type: "call-accept", fromId: userId }, ws);
          return;
        }
        if (data.type === 'call-reject') {
          broadcast(roomId, { type: "call-reject", fromId: userId }, ws);
          return;
        }
        if (data.type === 'call-end') {
          broadcast(roomId, { type: "call-end", fromId: userId }, ws);
          return;
        }
        if (data.type === 'signal') {
          broadcast(roomId, {
            type: "signal",
            fromId: userId,
            signal: data.signal
          }, ws);
          return;
        }

      } catch (err) {
        console.error("消息解析错误", err);
      }
    });

    ws.on('close', () => {
      if (!roomId || !roomMap.has(roomId)) return;
      const room = roomMap.get(roomId);
      room.delete(ws);
      if (room.size === 0) roomMap.delete(roomId);

      broadcast(roomId, {
        type: "system",
        text: `${userInfo.name} 已离开房间`
      });
    });

    // 房间广播工具函数
    function broadcast(room, msg, excludeWs = null) {
      if (!roomMap.has(room)) return;
      for (const client of roomMap.get(room)) {
        if (client !== excludeWs && client.readyState === client.OPEN) {
          client.send(JSON.stringify(msg));
        }
      }
    }
  });

  const upgradePromise = new Promise((resolve) => {
    res.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (conn) => {
        wss.emit('connection', conn, request);
        resolve();
      });
    });
  });

  await upgradePromise;
}
