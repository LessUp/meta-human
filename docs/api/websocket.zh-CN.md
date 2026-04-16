# WebSocket API

MetaHuman Engine 实时双向通信。

---

## 概览

WebSocket 端点提供：

- ⚡ **低延迟** 实时通信
- 🔄 **双向** 消息流
- 📊 **流式响应** 实时更新
- 🔌 **持久连接** 会话状态

---

## 连接

### 端点

```
ws://localhost:8000/ws
```

生产环境使用 SSL：

```
wss://your-domain.com/ws
```

### 连接流程

```
┌─────────────┐                      ┌─────────────┐
│    客户端    │ ───── WebSocket ───► │    服务器    │
│   (浏览器)   │ ◄─────────────────── │  (FastAPI)  │
└─────────────┘                      └─────────────┘
       │                                    │
       │ 1. 连接                             │
       │ 2. 发送：对话消息                    │
       │ 3. 接收：令牌流                      │
       │ 4. 接收：完成 + 元数据               │
       │ 5.（可选）发送下一条消息             │
       │ 6. 关闭连接                          │
```

---

## 消息协议

### 客户端 → 服务器

#### 对话消息

```json
{
  "type": "chat",
  "userText": "你好，怎么样？",
  "sessionId": "session-123",
  "meta": {
    "source": "voice"
  }
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `type` | string | 是 | 消息类型：`chat` |
| `userText` | string | 是 | 用户消息 |
| `sessionId` | string | 否 | 会话标识 |
| `meta` | object | 否 | 额外元数据 |

#### 心跳

```json
{
  "type": "ping"
}
```

保持连接活跃（建议每30秒）。

---

### 服务器 → 客户端

#### 令牌流

```json
{
  "type": "token",
  "content": "你好"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `type` | string | `token` |
| `content` | string | 增量文本块 |

#### 完成

```json
{
  "type": "done",
  "replyText": "你好！有什么可以帮您的？",
  "emotion": "happy",
  "action": "wave"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `type` | string | `done` |
| `replyText` | string | 完整回复文本 |
| `emotion` | enum | 情绪状态 |
| `action` | enum | 数字人动作 |

#### 错误

```json
{
  "type": "error",
  "message": "请求超时",
  "code": "TIMEOUT"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `type` | string | `error` |
| `message` | string | 错误描述 |
| `code` | string | 错误代码 |

#### Pong

```json
{
  "type": "pong",
  "timestamp": "2025-04-16T10:00:00Z"
}
```

响应客户端心跳。

---

## 完整流程示例

### 1. 连接

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('已连接到 MetaHuman Engine');
};
```

### 2. 发送对话消息

```javascript
ws.send(JSON.stringify({
  type: 'chat',
  userText: '介绍下你自己',
  sessionId: 'my-session'
}));
```

### 3. 处理流式响应

```javascript
let fullText = '';

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'token':
      // 流式文本到 UI
      fullText += data.content;
      updateChatDisplay(fullText);
      break;
      
    case 'done':
      // 接收到最终响应
      console.log('完成:', data.replyText);
      console.log('情绪:', data.emotion);
      console.log('动作:', data.action);
      
      // 触发数字人
      digitalHumanEngine.perform({
        emotion: data.emotion,
        action: data.action
      });
      
      // 触发语音合成
      ttsService.speak(data.replyText);
      break;
      
    case 'error':
      console.error('错误:', data.message);
      break;
  }
};
```

### 4. 保活

```javascript
// 每30秒发送心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

### 5. 处理断开连接

```javascript
ws.onclose = (event) => {
  console.log('断开连接:', event.code, event.reason);
  
  // 自动重连逻辑
  if (!event.wasClean) {
    setTimeout(connect, 3000);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};
```

---

## 错误代码

| 代码 | 描述 | 操作 |
|------|------|------|
| `TIMEOUT` | 请求超时 | 缩短消息后重试 |
| `RATE_LIMIT` | 请求过多 | 等待后重试 |
| `INVALID_MESSAGE` | 消息格式错误 | 检查消息格式 |
| `SESSION_EXPIRED` | 会话不存在 | 创建新会话 |
| `SERVICE_UNAVAILABLE` | 后端错误 | 重试或使用 HTTP 降级 |

---

## 重连策略

```javascript
class MetaHumanWebSocket {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('已连接');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`${delay}ms 后重连...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('达到最大重连次数');
      // 降级到 HTTP/SSE
    }
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 未连接');
    }
  }
}
```

---

## 与 HTTP/SSE 对比

| 特性 | HTTP | SSE | WebSocket |
|------|------|-----|-----------|
| **延迟** | 较高 | 中等 | 最低 |
| **流式** | 否 | 是（单向） | 是（双向） |
| **连接** | 每次请求 | 持久 | 持久 |
| **适用场景** | 简单请求 | 单向流 | 实时对话 |
| **降级优先级** | 3 | 2 | 1（优先） |

---

## 浏览器支持

| 浏览器 | WebSocket 支持 |
|--------|---------------|
| Chrome 16+ | ✅ 完全 |
| Firefox 11+ | ✅ 完全 |
| Safari 7+ | ✅ 完全 |
| Edge 12+ | ✅ 完全 |

---

<p align="center">
  <a href="../guide/README.zh-CN.md">下一步：用户指南 →</a>
</p>
