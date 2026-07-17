const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
const roomMap = new Map();

wss.on('connection', (ws) => {
  let roomId = null;
  const userId = Math.random().toString(36).slice(2,10);
  let userInfo = { name: "访客", avatar: "", balance: 200 };

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'join') {
        roomId = data.room.toUpperCase();
        userInfo = {
          name: data.name || "我",
          avatar: data.avatar || "",
          balance: Number(data.balance) || 200
        };
        if (!roomMap.has(roomId)) roomMap.set(roomId, new Set());
        roomMap.get(roomId).add(ws);
        ws.send(JSON.stringify({type:"welcome",id:userId,text:"连接本地服务成功"}));
        broadcast(roomId, {type:"system",text:`${userInfo.name}加入房间`}, ws);
        return;
      }
      broadcast(roomId, data, ws);
    } catch(e) {}
  });

  ws.on('close', () => {
    if (!roomId || !roomMap.has(roomId)) return;
    const room = roomMap.get(roomId);
    room.delete(ws);
    if (room.size === 0) roomMap.delete(roomId);
    broadcast(roomId, {type:"system",text:`${userInfo.name}离开房间`});
  });

  function broadcast(room, msg, exclude=null) {
    if (!roomMap.has(room)) return;
    for (const c of roomMap.get(room)) {
      if (c !== exclude && c.readyState === c.OPEN) c.send(JSON.stringify(msg));
    }
  }
});

console.log("本地WS服务启动于 ws://127.0.0.1:3000");
