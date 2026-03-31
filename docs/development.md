# 开发与运行

## 1. 文档目的

本文档用于帮助你在本地启动、联调和排查 MetaHuman Demo/SDK。

适用场景：
- 首次拉起项目
- 启动前后端联调
- 配置 LLM / Mock 模式
- 排查浏览器权限与环境问题

## 2. 环境要求

### 2.1 基础要求
- Node.js >= 18
- npm >= 9
- Python >= 3.10（用于 FastAPI 后端）

### 2.2 推荐环境
- Chromium 系浏览器（语音能力更稳定）
- `localhost` 本地访问环境
- 独立 Python 虚拟环境 `.venv`

## 3. 快速启动

### 3.1 启动前端

安装依赖：

```bash
npm ci
```

启动开发服务：

```bash
npm run dev
```

常用命令：

```bash
npm run build
npm run preview
npm run lint
npm run test:run
```

### 3.2 启动后端

建议在项目根目录创建虚拟环境：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
```

启动 FastAPI 服务：

```bash
uvicorn app.main:app --reload --port 8000
```

启动后默认可访问：
- `GET http://localhost:8000/`
- `GET http://localhost:8000/health`
- `POST http://localhost:8000/v1/chat`

### 3.3 本地联调顺序

推荐顺序：
1. 启动后端
2. 访问 `GET /health` 确认服务可用
3. 启动前端
4. 打开浏览器进入页面
5. 测试文本输入链路
6. 再测试语音与摄像头能力

这样更容易定位问题是在前端、后端还是浏览器权限层。

## 4. 环境变量

## 4.1 前端环境变量

### `VITE_API_BASE_URL`
- 说明：前端请求的后端地址
- 默认值：`http://localhost:8000`
- 用途：连接本地或远端 FastAPI 服务

示例：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 4.2 后端环境变量

### `OPENAI_API_KEY`
- 可选
- 不配置时，后端自动使用智能 Mock 回复

### `OPENAI_MODEL`
- 可选
- 默认值：`gpt-3.5-turbo`
- 用于指定上游模型名

### `OPENAI_BASE_URL`
- 可选
- 支持标准 OpenAI 地址或兼容网关
- 后端会自动规范化为最终的 `/v1/chat/completions`

支持示例：
- `https://api.openai.com`
- `https://api.openai.com/v1`
- `https://api.openai.com/v1/chat/completions`
- `http://localhost:8080`

### `CORS_ALLOW_ORIGINS`
- 可选
- 逗号分隔的 Origin 列表
- 默认允许本地 `5173/3000`

示例：

```env
CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### `LLM_PROVIDER`
- 当前为预留扩展位
- 现阶段仍以 OpenAI 兼容接口流程为主

## 5. 运行模式说明

### 5.1 Mock 模式

触发条件：
- 未配置 `OPENAI_API_KEY`
- 或 LLM 请求失败且触发回退

特点：
- 仍返回结构化结果
- 可继续跑通聊天、动作、表情与播报链路
- 适合本地 UI 演示与前后端联调

可通过 `GET /health` 中的返回判断：
- `services.llm = "mock_mode"`

### 5.2 LLM 模式

触发条件：
- 配置有效的 `OPENAI_API_KEY`
- 上游接口调用成功

特点：
- 回复由上游模型生成
- 后端会把输出收敛为结构化字段

## 6. 浏览器能力说明

### 6.1 语音能力
- 基于 Web Speech API
- 推荐 Chromium 系浏览器
- 不同浏览器、系统、语言环境的 voice 列表可能不同
- 某些环境下 ASR / TTS 能力可能不可用或效果不一致

### 6.2 摄像头 / 麦克风权限
- 通常要求 `localhost` 或 `https`
- 需要用户主动授权
- 权限被拒绝时，应优先检查浏览器设置而不是代码

### 6.3 视觉能力
- 基于 MediaPipe 推理
- 设备性能、光照、摄像头质量会影响识别效果
- 视觉结果用于演示级映射，不应视为高精度识别系统

## 7. 常见开发任务

### 7.1 验证后端是否可用
- 访问 `GET /health`
- 检查 `status` 是否为 `ok`
- 检查 `services.llm` 是 `available` 还是 `mock_mode`

### 7.2 验证前后端联调是否正常
- 前端页面正常打开
- 输入文本可收到回复
- 数字人状态随回复变化
- 未静音时可触发 TTS 播报

### 7.3 验证语音链路
- 浏览器已授权麦克风
- 开始录音后能识别文本
- 识别结果能进入聊天流

### 7.4 验证视觉链路
- 浏览器已授权摄像头
- 可看到视频画面
- 可看到识别结果或映射状态变化

## 8. 常见问题排查

### 8.1 前端能打开，但无法对话
优先检查：
- 后端是否已启动
- `VITE_API_BASE_URL` 是否正确
- `GET /health` 是否返回正常
- 浏览器控制台和后端日志是否有报错

### 8.2 后端可访问，但回复始终像 Mock
优先检查：
- 是否配置了 `OPENAI_API_KEY`
- Key 是否有效
- `OPENAI_BASE_URL` 是否指向正确的兼容接口
- 后端日志是否出现超时、HTTP 错误或请求异常

### 8.3 语音不可用
优先检查：
- 当前浏览器是否支持 Web Speech API
- 是否已授权麦克风
- 是否在 `localhost` 或 `https` 环境运行
- 当前系统是否存在可用语音引擎

### 8.4 摄像头不可用
优先检查：
- 浏览器是否授权摄像头
- 摄像头是否被其他程序占用
- 是否在 `localhost` 或 `https` 环境运行

## 9. 开发建议

- 先验证文本对话链路，再调语音和视觉
- 优先在 Mock 模式下确认 UI 闭环，再接入真实 LLM
- 修改页面逻辑前，先确认是否应放在 `core/` 或 `store/`
- 修改接口契约时，同时更新 `docs/api.md` 与相关实现

## 10. 相关文档

- `docs/architecture.md`：架构说明
- `docs/api.md`：接口契约
- `.trae/documents/digital-human-prd.md`：产品设计
- `.trae/documents/digital-human-technical-architecture.md`：技术设计

## 11. 结论

如果你是第一次接手这个项目，最推荐的理解路径是：

1. 先看 `README.md`
2. 再看 `docs/architecture.md`
3. 然后按本文档启动前后端
4. 最后从 `AdvancedDigitalHumanPage` 和 `dialogueService` 开始读代码

这样最快进入状态。