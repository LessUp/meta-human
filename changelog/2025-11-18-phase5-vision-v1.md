# 2025-11-18 Phase 5：视觉镜像 V1

## 变更内容

- 新增前端视觉模块：
  - `src/core/vision/visionMapper.ts`：
    - 定义 `UserEmotion` 类型：`happy | neutral | surprised`。
    - 基于 MediaPipe Face Mesh 关键点的简单几何规则，将人脸关键点结果映射为表情类别：
      - 通过嘴部上下间距与左右宽度的比值，粗略区分 `neutral`、`happy`、`surprised`。
  - `src/core/vision/visionService.ts`：
    - 通过 `navigator.mediaDevices.getUserMedia` 打开摄像头，并在指定的 `<video>` 元素上播放预览。
    - 通过动态导入 `@mediapipe/face_mesh`，初始化 FaceMesh 模型，并在渲染循环中对视频帧进行推理。
    - 根据推理结果调用 `mapFaceToEmotion`，并将情绪变化通过回调暴露给上层。
- 新增视觉镜像 UI 组件：
  - `src/components/VisionMirrorPanel.tsx`：
    - 提供“开启/关闭摄像头”按钮与视频预览区域。
    - 显示当前检测到的表情（中性/高兴/惊讶）。
    - 在摄像头开启时，调用 `visionService.start`，并在情绪变化时通过 `onEmotionChange` 回调通知页面。
- 集成到高级数字人页面：
  - `AdvancedDigitalHumanPage.tsx`：
    - 引入 `VisionMirrorPanel` 组件。
    - 在标签页中新增 `vision` 选项（"视觉镜像"）。
    - 在 `vision` 标签页中渲染 `VisionMirrorPanel`，并在 `onEmotionChange` 中根据情绪调用 `digitalHumanEngine.setExpression` 和 `setEmotion`：
      - `happy` → `smile`；`surprised` → `surprise`；其他 → `neutral`。
- 更新依赖：
  - `package.json`：在 `dependencies` 中新增 `@mediapipe/face_mesh` 依赖，用于前端视觉模型推理。

## 目的

- 实现视觉镜像 V1：
  - 在浏览器端使用摄像头捕捉用户表情；
  - 基于简化规则估算用户表情为中性/高兴/惊讶；
  - 将结果实时驱动数字人的表情与情绪，实现“我笑它也笑”的基础体验。

## 使用说明

- 前端依赖：
  - 需要在项目根目录安装新增依赖：
    - `npm install @mediapipe/face_mesh`（或使用等价的包管理工具）。
- 运行时：
  - 进入 `AdvancedDigitalHumanPage` 页面。
  - 在右侧标签中切换到“视觉镜像”Tab。
  - 点击“开启摄像头”，授予浏览器摄像头权限后即可看到本地视频预览。
  - 当检测到更大幅度的嘴部张开或笑容时，数字人表情会在中性、开心、惊讶之间切换。

## 备注

- 当前表情识别为基于关键点几何的简化规则，仅用于 Demo 级别的视觉镜像体验，后续可以替换为更精确的情绪识别模型。
