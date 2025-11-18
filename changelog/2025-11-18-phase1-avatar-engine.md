# 2025-11-18 Phase 1 前端重构：DigitalHumanEngine 与页面接入

## 变更内容

- 新增 `src/core/avatar/DigitalHumanEngine.ts`：
  - 封装数字人核心控制方法：`play`、`pause`、`reset`、`setExpression`、`setEmotion`、`playAnimation`。
  - 内部通过 `useDigitalHumanStore.getState()` 调用现有 store 的动作，暂不直接操作 3D 模型，作为统一控制入口。
- 更新页面逻辑：
  - `DigitalHumanPage.tsx`：
    - 引入 `digitalHumanEngine`，`handlePlayPause` 与 `handleReset` 通过 engine 调用，而不再直接调用 store 的 `play`/`pause`/`reset`。
    - 精简未使用的 store action 解构。
  - `AdvancedDigitalHumanPage.tsx`：
    - 引入 `digitalHumanEngine`，`handlePlayPause` 与 `handleReset` 改为通过 engine 控制。
    - 语音命令与表情面板中的表情/情绪控制改为调用 engine 的 `setExpression`、`setEmotion`，不再直接调用 store 的 setter。
    - 精简未使用的 store action 解构。

## 目的

- 建立独立的 `DigitalHumanEngine` 层，作为数字人行为与表情控制的统一入口，为后续：
  - 对接 3D 模型具体动画；
  - 将视觉镜像、对话意图等高层指令统一落到 Engine；
  打下清晰的架构基础。
- 保持当前 UI 行为与交互体验不变，仅重构内部调用路径。

## 备注

- 当前 Engine 仍然只是一层对 store 的轻封装，后续可以逐步将 3D 模型控制与多模态驱动逻辑收缩到 Engine 内实现。
