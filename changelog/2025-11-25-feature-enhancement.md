# 2025-11-25 功能完善与可靠性提升

## 状态管理增强

- 新增类型定义：`EmotionType`、`ExpressionType`、`BehaviorType`、`ConnectionStatus`
- 新增状态：`sessionId`（localStorage 持久化）、`chatHistory`、`connectionStatus`
- 新增方法：`setBehavior()`、`setConnectionStatus()`、`initSession()`、`addChatMessage()`、`clearChatHistory()`

## 行为引擎增强

- 类型验证（表情、情感、行为）
- 情感↔表情自动映射
- 动画结束自动恢复 idle
- 新增组合动作：`performGreeting()`、`performThinking()`、`performListening()`

## 语音服务重构

- TTS：Promise 化 `speak()` 方法、`pause()`/`resume()` 支持、配置接口 `TTSConfig`
- ASR：回调接口 `ASRCallbacks`、配置接口 `ASRConfig`、识别结果自动发送后端

## 视觉服务增强

- 状态管理 `VisionStatus`、FPS 计算、摄像头权限检查
- 情感识别扩展：新增 `sad`、`angry` 检测（眼睛开合度 + 眉毛位置 + 嘴角检测）
- VisionMirrorPanel：情感颜色映射、中文+emoji 标签、加载/错误状态

## 页面逻辑完善

- 服务器连接状态检查（启动时 + 定期）
- HUD 显示连接状态、行为状态、会话数
- 错误自动清除（5 秒后）+ 重连按钮
- Quick Actions：打招呼、跳舞、说话、表情

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `R` | 重置 |
| `M` | 静音切换 |
| `V` | 录音切换 |
| `S` | 设置面板 |
| `Esc` | 关闭面板 |
| `1`~`4` | 预设行为 |

## 新增 UI 组件

- `LoadingSpinner`：3 种尺寸 + 自定义文本 + 全屏遮罩
- `ErrorBoundary`：错误捕获 + 友好界面 + 重试/刷新
- `useTouch` Hook：滑动/点击/双击/长按手势检测

## 架构优化

- 页面组件 `React.lazy()` 懒加载
- 全局 ErrorBoundary 错误捕获
- 页面切换加载动画

## 代码清理

- 移除所有 `console.log` / `alert()` 调试语句
- 移除未使用变量
- 录音超时从 10 秒调整为 30 秒
- ControlPanel 系统状态改为实时从 Store 获取
