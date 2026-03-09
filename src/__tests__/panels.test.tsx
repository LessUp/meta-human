import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ExpressionControlPanel from "../components/panels/ExpressionControlPanel";
import BehaviorControlPanel from "../components/panels/BehaviorControlPanel";

// Mock lucide-react icons - 使用 Proxy 自动返回所有图标组件
vi.mock("lucide-react", () => {
  const handler = {
    get(_target: any, prop: string) {
      if (prop === "__esModule") return true;
      if (prop === "default") return undefined;
      // 返回一个简单的 SVG 组件
      return (props: any) =>
        React.createElement("svg", { "data-testid": `icon-${prop}`, ...props });
    },
  };
  return new Proxy({}, handler);
});

// =====================
// ExpressionControlPanel
// =====================
describe("ExpressionControlPanel", () => {
  const defaultProps = {
    currentExpression: "neutral",
    onExpressionChange: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onExpressionChange.mockClear();
  });

  it("渲染标题和当前表情", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    expect(screen.getByText("表情控制")).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
  });

  it("渲染所有表情按钮", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    expect(screen.getByText("中性")).toBeInTheDocument();
    expect(screen.getByText("微笑")).toBeInTheDocument();
    expect(screen.getByText("大笑")).toBeInTheDocument();
    expect(screen.getByText("惊讶")).toBeInTheDocument();
    expect(screen.getByText("悲伤")).toBeInTheDocument();
    expect(screen.getByText("愤怒")).toBeInTheDocument();
    expect(screen.getByText("眨眼")).toBeInTheDocument();
  });

  it("点击表情按钮触发 onExpressionChange", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("微笑"));
    expect(defaultProps.onExpressionChange).toHaveBeenCalledWith("smile", 0.7);
  });

  it("点击大笑按钮传递正确的强度", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("大笑"));
    expect(defaultProps.onExpressionChange).toHaveBeenCalledWith("laugh", 1.0);
  });

  it("渲染强度滑块", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    expect(screen.getByText("表情强度")).toBeInTheDocument();
    const slider = screen.getAllByRole("slider")[0];
    expect(slider).toBeInTheDocument();
  });

  it("渲染微表情按钮", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    expect(screen.getByText("抬眉")).toBeInTheDocument();
    expect(screen.getByText("快速眨眼")).toBeInTheDocument();
    expect(screen.getByText("张嘴")).toBeInTheDocument();
    expect(screen.getByText("点头")).toBeInTheDocument();
  });

  it("点击微表情按钮触发回调", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("抬眉"));
    expect(defaultProps.onExpressionChange).toHaveBeenCalledWith(
      "eyebrow_raise",
      expect.any(Number),
    );
  });

  it("渲染重置表情按钮", () => {
    render(<ExpressionControlPanel {...defaultProps} />);
    const resetBtn = screen.getByText("重置表情");
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(defaultProps.onExpressionChange).toHaveBeenCalledWith(
      "neutral",
      0.5,
    );
  });

  it("当前表情按钮高亮显示", () => {
    render(
      <ExpressionControlPanel {...defaultProps} currentExpression="smile" />,
    );
    // 显示 smile 标签
    expect(screen.getByText("smile")).toBeInTheDocument();
  });

  it("强度滑块变化触发回调", () => {
    render(
      <ExpressionControlPanel {...defaultProps} currentExpression="smile" />,
    );
    // 先选择一个表情
    fireEvent.click(screen.getByText("微笑"));
    // 修改滑块
    const slider = screen.getAllByRole("slider")[0];
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(defaultProps.onExpressionChange).toHaveBeenCalledWith("smile", 0.5);
  });
});

// =====================
// BehaviorControlPanel
// =====================
describe("BehaviorControlPanel", () => {
  const defaultProps = {
    currentBehavior: "idle",
    onBehaviorChange: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onBehaviorChange.mockClear();
  });

  it("渲染标题", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("行为引擎")).toBeInTheDocument();
  });

  it("渲染状态监控区域", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.getByText("置信度")).toBeInTheDocument();
    expect(screen.getByText("目标")).toBeInTheDocument();
  });

  it("渲染所有行为按钮", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("待机")).toBeInTheDocument();
    expect(screen.getByText("打招呼")).toBeInTheDocument();
    expect(screen.getByText("倾听")).toBeInTheDocument();
    expect(screen.getByText("思考")).toBeInTheDocument();
    expect(screen.getByText("说话")).toBeInTheDocument();
    expect(screen.getByText("兴奋")).toBeInTheDocument();
  });

  it("渲染新增动作按钮", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("鞠躬")).toBeInTheDocument();
    expect(screen.getByText("拍手")).toBeInTheDocument();
    expect(screen.getByText("点赞")).toBeInTheDocument();
    expect(screen.getByText("歪头")).toBeInTheDocument();
    expect(screen.getByText("耸肩")).toBeInTheDocument();
    expect(screen.getByText("张望")).toBeInTheDocument();
    expect(screen.getByText("欢呼")).toBeInTheDocument();
    expect(screen.getByText("打瞌睡")).toBeInTheDocument();
    expect(screen.getByText("抱臂")).toBeInTheDocument();
    expect(screen.getByText("指向")).toBeInTheDocument();
  });

  it("点击行为按钮触发回调", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("打招呼"));
    expect(defaultProps.onBehaviorChange).toHaveBeenCalledWith(
      "greeting",
      expect.objectContaining({}),
    );
  });

  it("点击鞠躬按钮触发正确行为", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("鞠躬"));
    expect(defaultProps.onBehaviorChange).toHaveBeenCalledWith(
      "bow",
      expect.objectContaining({}),
    );
  });

  it("点击欢呼按钮触发正确行为", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("欢呼"));
    expect(defaultProps.onBehaviorChange).toHaveBeenCalledWith(
      "cheer",
      expect.objectContaining({}),
    );
  });

  it("渲染自动驾驶按钮", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("开启自动驾驶")).toBeInTheDocument();
  });

  it("切换自动驾驶模式", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    const autoBtn = screen.getByText("开启自动驾驶");
    fireEvent.click(autoBtn);
    expect(screen.getByText("关闭自动驾驶")).toBeInTheDocument();
  });

  it("手动/自动模式标签正确显示", () => {
    render(<BehaviorControlPanel {...defaultProps} />);
    expect(screen.getByText("手动")).toBeInTheDocument();
    fireEvent.click(screen.getByText("开启自动驾驶"));
    expect(screen.getByText("自动")).toBeInTheDocument();
  });
});
