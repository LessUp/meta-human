# 2025-12-18 架构统一 + UI 升级 + 文档重构

## 架构与契约统一

- 清理对话服务重试过程中的调试输出
- 后端 `OPENAI_BASE_URL` 规范化：自动补全 `/v1/chat/completions`，兼容多种 URL 格式
- 增强 LLM 请求错误日志（URL、状态码、响应摘要）

## 前端 UI 升级

- Advanced 面板顶部增加"新会话"快捷入口（`initSession()` + 清空输入）
- 修复快捷键监听的声明顺序问题（TypeScript hook 依赖报错）

## 功能补齐

- `VoiceInteractionPanel`：`onSpeak` 改为可选回调
- `VoiceInteractionPanel`：录音/静音状态与全局 Store 同步
- 移除 TTS 测试 `console.log` 回调

## 文档重构

- 删除过期文档，消除"文档承诺 > 代码能力"的误导
- 重建 `docs/` 文档集合：`architecture.md`、`development.md`、`api.md`

## 工程清理

- 移除 `console.log` / `console.debug` 调试输出（保留 `console.error` / `console.warn`）
- 删除未使用文件：`src/pages/Home.tsx`、`src/components/Empty.tsx`
- `GLTFLoader` 引入补全 `.js` 扩展名（兼容 `moduleResolution: bundler`）
- 修复模型加载失败回调的类型错误（`unknown` → 安全访问 `error.message`）
