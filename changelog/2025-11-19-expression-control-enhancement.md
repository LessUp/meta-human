# 2025-11-19 表情控制增强

- **修改内容**
  - 在 `digitalHumanStore` 中增加 `expressionIntensity` 状态及 `setExpressionIntensity` 方法，并在重置时恢复默认值。
  - 为 `DigitalHumanEngine` 增加 `setExpressionIntensity`，统一由引擎更新表情及其强度。
  - 在 `AdvancedDigitalHumanPage` 的 `handleExpressionChange` 中，同时写入表情和强度。
  - 在 `DigitalHumanViewer` 中订阅 `expressionIntensity`，根据当前表情和强度对头部和眼睛做更明显的缩放、位移和旋转：
    - 强化 `smile`、`laugh`、`surprise`、`sad`、`angry` 的视觉差异。
    - 新增对 `blink`/`eye_blink`、`eyebrow_raise`、`mouth_open`、`head_nod` 等表情的处理，实现眨眼、抬头、点头等效果。

- **预期效果**
  - 右侧「面部表情控制」中的按钮现在会明显改变 3D 数字人头部和眼睛的状态。
  - 表情强度滑块会真实影响变化幅度，而不仅是展示数值。

- **注意事项**
  - 当前仍为占位几何体表情模拟，后续接入真实 MetaHuman / blendshape 时，可以沿用 `currentExpression` 与 `expressionIntensity` 这套接口。
