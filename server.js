const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 联机专用：支持多玩家数据同步，无内容/长度限制
const variables = {};

wss.on('connection', (ws) => {
  // 新玩家连接时，同步当前所有云变量数据
  Object.entries(variables).forEach(([name, value]) => {
    ws.send(JSON.stringify({ type: 'set', name, value }));
  });

  // 接收玩家数据并同步给所有人
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'set') {
        variables[msg.name] = msg.value;
        // 广播给所有在线玩家
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'set', name: msg.name, value: msg.value }));
          }
        });
      }
    } catch (e) {}
  });
});

// 启动服务器
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`联机服务器已启动：http://localhost:${PORT}`);
  console.log(`其他玩家连接地址：http://你的内网IP:${PORT}`);
});