# 后端 API 契约

本文档描述当前 MetaHuman Demo/SDK 使用的最小后端接口契约。

设计目标：
- 让前端依赖稳定、简单、可预测的结构
- 将上游 LLM 的不稳定性收敛在后端
- 保证无 LLM 配置或调用失败时，前端仍能继续演示

## 1. 约定原则

### 1.1 契约范围
当前文档只覆盖当前仓库实际使用的接口：
- `GET /`
- `GET /health`
- `POST /v1/chat`

### 1.2 设计原则
- 前端只依赖结构化结果，不直接依赖上游模型协议
- 后端负责做 LLM 输出收敛、异常处理与回退
- 接口变更应保持与前端实现和文档同步

## 2. GET /

### 用途
返回服务基本信息，便于快速确认服务已启动。

### 响应示例

```json
{
  "service": "MetaHuman Digital Human Service",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

### 说明
- 该接口主要用于人工确认服务状态
- 不承担业务逻辑

## 3. GET /health

### 用途
用于：
- 健康检查
- 判断后端是否可达
- 判断当前是否处于 LLM 可用模式或 Mock 模式

### 响应示例

```json
{
  "status": "ok",
  "uptime_seconds": 12.34,
  "version": "1.0.0",
  "services": {
    "chat": "available",
    "llm": "available"
  }
}
```

### 字段说明
- `status`：服务状态，当前正常值为 `ok`
- `uptime_seconds`：服务启动后的运行秒数
- `version`：服务版本
- `services.chat`：对话服务是否可用
- `services.llm`：当前 LLM 状态

### `services.llm` 取值
- `available`：检测到 `OPENAI_API_KEY`
- `mock_mode`：未配置 key，将走 Mock 回复

### 典型用途
- 前端启动后检查后端连接状态
- UI 展示“已连接 / 降级模式”
- 开发者判断是否已正确接入 LLM

## 4. POST /v1/chat

### 用途
输入用户文本，返回用于驱动聊天区、数字人状态和播报的结构化结果。

### 请求体

```json
{
  "sessionId": "optional-session-id",
  "userText": "你好",
  "meta": {
    "timestamp": 1234567890
  }
}
```

### 请求字段说明
- `sessionId`：可选；用于多轮对话上下文
- `userText`：必填；用户输入文本
- `meta`：可选；附加上下文信息，例如页面状态、场景信息、视觉状态等

### 响应体

```json
{
  "replyText": "您好！很高兴见到您，有什么可以帮助您的吗？",
  "emotion": "happy",
  "action": "wave"
}
```

### 响应字段说明
- `replyText`：给用户展示和播报的自然语言回复
- `emotion`：数字人情绪标签
- `action`：数字人动作标签

### `emotion` 枚举值
- `neutral`
- `happy`
- `surprised`
- `sad`
- `angry`

### `action` 枚举值
- `idle`
- `wave`
- `greet`
- `think`
- `nod`
- `shakeHead`
- `dance`
- `speak`

## 5. 服务行为说明

### 5.1 正常流程
1. 前端发送 `userText`
2. 后端根据 `sessionId` 组装上下文
3. 调用上游 LLM 或本地 Mock
4. 将结果收敛为 `replyText / emotion / action`
5. 返回给前端

### 5.2 Mock 回退策略
在以下场景中，后端会自动回退到智能 Mock：
- 未配置 `OPENAI_API_KEY`
- 请求超时
- 网络请求异常
- 上游 HTTP 错误
- 其他未捕获异常

目标：
- 保持前端链路不断
- 让 Demo 在无外部依赖时依然可演示

### 5.3 非法 LLM 输出处理
如果上游模型返回内容不是合法 JSON：
- 后端会尽量将内容退化为 `replyText`
- `emotion` 默认回退为 `neutral`
- `action` 默认回退为 `idle`

这样可以避免前端因格式问题直接失败。

## 6. 会话语义

### 6.1 `sessionId`
- 由前端传入
- 用于关联多轮对话上下文
- 当前实现基于内存维护会话消息

### 6.2 当前限制
- 会话历史不持久化
- 服务重启后历史会丢失
- 不适合多实例生产部署

## 7. 错误与兼容策略

### 7.1 当前策略
本项目当前优先保证“可演示”而非“严格失败暴露”：
- 后端尽量自己消化上游错误
- 前端尽量收到可消费结果
- 真正不可恢复的情况再由前端展示错误

### 7.2 对前端的意义
前端在大多数情况下可以假设：
- `/v1/chat` 返回结构基本稳定
- 即使上游异常，也大概率能拿到降级结果

## 8. 配置相关

影响 API 行为的主要环境变量：
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `CORS_ALLOW_ORIGINS`
- `LLM_PROVIDER`（当前为扩展预留）

其中：
- `OPENAI_BASE_URL` 支持多种输入形式
- 后端会自动规范化为最终的 `/v1/chat/completions`

## 9. 对接建议

### 前端对接建议
- 始终按结构化字段消费响应
- 不要假设后端一定返回原始模型文本格式
- 使用 `/health` 作为启动后的基础联通性检查

### 后端扩展建议
如果未来要扩展更多动作或情绪：
- 先更新后端可接受枚举
- 再更新前端映射和表现层
- 同时更新本文件与相关架构文档

## 10. 结论

当前 API 的核心价值，不是“功能多”，而是：

> 用尽量小的契约，稳定支撑数字人 Demo/SDK 的前后端闭环。

只要继续维持这一点，前端体验和后续演进都会更可控。