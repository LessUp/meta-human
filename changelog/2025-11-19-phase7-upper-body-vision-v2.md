# 2025-11-19 Phase 7 视觉 V2：上半身动作镜像

## 变更内容

- 扩展视觉服务 `visionService`：
  - 在保留原有人脸表情 + 点头/摇头检测（基于 MediaPipe FaceMesh）的前提下，引入 MediaPipe Pose：
    - 通过动态 import `@mediapipe/pose`，基于 `poseLandmarks` 检测肩膀与手腕位置。
    - 新增上半身动作检测逻辑 `detectUpperBodyMotion`：
      - 当手腕明显高于对应肩膀时，认为处于“举手”姿态；
      - 在举手状态下，若手腕在水平方向上有较大来回摆动，则判定为“挥手”。
    - 为避免抖动和频繁触发，引入手腕 X 坐标滑动窗口与时间冷却（约 800ms）。
  - 扩展 motion 回调类型：
    - 原：`'nod' | 'shakeHead'`；
    - 现：`'nod' | 'shakeHead' | 'raiseHand' | 'waveHand'`。
  - 在同一个 `onMotion` 回调中上报所有动作，保持 API 简洁：
    - 点头：`'nod'`；
    - 摇头：`'shakeHead'`；
    - 举手：`'raiseHand'`；
    - 挥手：`'waveHand'`。

- 更新 `VisionMirrorPanel` 组件：
  - 扩展 `onHeadMotion` 的类型定义以支持新动作，但调用方式不变：
    - 仍然将 motion 直接传出，由上层决定如何映射到数字人动画。

## 使用说明

- 前端逻辑：
  - `AdvancedDigitalDigitalHumanPage` 中仍使用：
    - `onHeadMotion={(motion) => digitalHumanEngine.playAnimation(motion)}`，
    - 新增的 `raiseHand` / `waveHand` 会自动映射为同名动画 clip，只要 3D 模型中存在对应动画即可。

- 依赖说明：
  - 本次新增使用 MediaPipe Pose，请在项目根目录执行：
    - `npm install @mediapipe/pose`
  - 安装完成后重启或刷新 Vite dev 服务器，即可在“视觉镜像” Tab 中体验举手/挥手动作驱动数字人。

## 备注

- 本阶段实现遵循 KISS 原则，使用简单几何规则与短窗口统计实现上半身动作的大致识别，并通过冷却时间避免频繁触发。
- 如需更细腻的动作识别（如左右手区分、多种手势），可在后续迭代中在 `detectUpperBodyMotion` 基础上逐步扩展。
