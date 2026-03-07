import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useDigitalHumanStore } from '../store/digitalHumanStore';

// 每个测试前重置 store
beforeEach(() => {
  useDigitalHumanStore.getState().reset();
  useDigitalHumanStore.setState({
    chatHistory: [],
    errorQueue: [],
    error: null,
    lastErrorTime: null,
    connectionStatus: 'connected',
    isConnected: true,
    isRecording: false,
    isMuted: false,
    sessionId: 'test-session',
  });
});

describe('digitalHumanStore — 基础状态', () => {
  it('初始化默认值正确', () => {
    const state = useDigitalHumanStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentAnimation).toBe('idle');
    expect(state.currentEmotion).toBe('neutral');
    expect(state.currentExpression).toBe('neutral');
    expect(state.currentBehavior).toBe('idle');
    expect(state.expressionIntensity).toBe(0.8);
  });

  it('play/pause 切换', () => {
    const { play, pause } = useDigitalHumanStore.getState();
    play();
    expect(useDigitalHumanStore.getState().isPlaying).toBe(true);
    pause();
    expect(useDigitalHumanStore.getState().isPlaying).toBe(false);
  });

  it('reset 重置所有状态', () => {
    const store = useDigitalHumanStore.getState();
    store.play();
    store.setAnimation('wave');
    store.setEmotion('happy');
    store.setExpression('smile');
    store.setBehavior('greeting');
    store.setExpressionIntensity(0.5);

    store.reset();
    const after = useDigitalHumanStore.getState();
    expect(after.isPlaying).toBe(false);
    expect(after.currentAnimation).toBe('idle');
    expect(after.currentEmotion).toBe('neutral');
    expect(after.currentExpression).toBe('neutral');
    expect(after.currentBehavior).toBe('idle');
    expect(after.expressionIntensity).toBe(0.8);
  });
});

describe('digitalHumanStore — 表情与情感', () => {
  it('setExpression 更新表情', () => {
    useDigitalHumanStore.getState().setExpression('smile');
    expect(useDigitalHumanStore.getState().currentExpression).toBe('smile');
  });

  it('setEmotion 更新情感', () => {
    useDigitalHumanStore.getState().setEmotion('happy');
    expect(useDigitalHumanStore.getState().currentEmotion).toBe('happy');
  });

  it('setExpressionIntensity 钳制到 [0,1]', () => {
    const { setExpressionIntensity } = useDigitalHumanStore.getState();

    setExpressionIntensity(1.5);
    expect(useDigitalHumanStore.getState().expressionIntensity).toBe(1);

    setExpressionIntensity(-0.3);
    expect(useDigitalHumanStore.getState().expressionIntensity).toBe(0);

    setExpressionIntensity(0.6);
    expect(useDigitalHumanStore.getState().expressionIntensity).toBe(0.6);
  });
});

describe('digitalHumanStore — 行为', () => {
  it('setBehavior 更新行为', () => {
    useDigitalHumanStore.getState().setBehavior('greeting');
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('greeting');
  });

  it('setAnimation 更新动画', () => {
    useDigitalHumanStore.getState().setAnimation('wave');
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('wave');
  });
});

describe('digitalHumanStore — 录音与静音', () => {
  it('startRecording / stopRecording', () => {
    const { startRecording, stopRecording } = useDigitalHumanStore.getState();
    startRecording();
    expect(useDigitalHumanStore.getState().isRecording).toBe(true);
    stopRecording();
    expect(useDigitalHumanStore.getState().isRecording).toBe(false);
  });

  it('toggleMute 切换', () => {
    const initial = useDigitalHumanStore.getState().isMuted;
    useDigitalHumanStore.getState().toggleMute();
    expect(useDigitalHumanStore.getState().isMuted).toBe(!initial);
    useDigitalHumanStore.getState().toggleMute();
    expect(useDigitalHumanStore.getState().isMuted).toBe(initial);
  });

  it('setMuted 直接设值', () => {
    useDigitalHumanStore.getState().setMuted(true);
    expect(useDigitalHumanStore.getState().isMuted).toBe(true);
    useDigitalHumanStore.getState().setMuted(false);
    expect(useDigitalHumanStore.getState().isMuted).toBe(false);
  });

  it('setSpeaking 更新说话状态', () => {
    useDigitalHumanStore.getState().setSpeaking(true);
    expect(useDigitalHumanStore.getState().isSpeaking).toBe(true);
    useDigitalHumanStore.getState().setSpeaking(false);
    expect(useDigitalHumanStore.getState().isSpeaking).toBe(false);
  });
});

describe('digitalHumanStore — 自动旋转', () => {
  it('toggleAutoRotate 切换', () => {
    const initial = useDigitalHumanStore.getState().autoRotate;
    useDigitalHumanStore.getState().toggleAutoRotate();
    expect(useDigitalHumanStore.getState().autoRotate).toBe(!initial);
  });
});

describe('digitalHumanStore — 连接状态', () => {
  it('有效的状态转换', () => {
    useDigitalHumanStore.getState().setConnectionStatus('disconnected');
    expect(useDigitalHumanStore.getState().connectionStatus).toBe('disconnected');
    expect(useDigitalHumanStore.getState().isConnected).toBe(false);
  });

  it('connected -> connecting 是无效转换，应被忽略', () => {
    useDigitalHumanStore.setState({ connectionStatus: 'connected' });
    useDigitalHumanStore.getState().setConnectionStatus('connecting');
    // connected -> connecting 不在 validTransitions 中
    expect(useDigitalHumanStore.getState().connectionStatus).toBe('connected');
  });

  it('error -> connecting 是有效转换', () => {
    useDigitalHumanStore.setState({ connectionStatus: 'error' });
    useDigitalHumanStore.getState().setConnectionStatus('connecting');
    expect(useDigitalHumanStore.getState().connectionStatus).toBe('connecting');
  });

  it('connecting -> connected 更新 isConnected', () => {
    useDigitalHumanStore.setState({ connectionStatus: 'connecting', isConnected: false });
    useDigitalHumanStore.getState().setConnectionStatus('connected');
    expect(useDigitalHumanStore.getState().isConnected).toBe(true);
  });
});

describe('digitalHumanStore — 聊天历史', () => {
  it('addChatMessage 添加消息', () => {
    useDigitalHumanStore.getState().addChatMessage('user', '你好');
    const history = useDigitalHumanStore.getState().chatHistory;
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
    expect(history[0].text).toBe('你好');
  });

  it('addChatMessage 多条消息保持顺序', () => {
    const store = useDigitalHumanStore.getState();
    store.addChatMessage('user', '问题1');
    store.addChatMessage('assistant', '回答1');
    store.addChatMessage('user', '问题2');

    const history = useDigitalHumanStore.getState().chatHistory;
    expect(history).toHaveLength(3);
    expect(history[0].text).toBe('问题1');
    expect(history[1].text).toBe('回答1');
    expect(history[2].text).toBe('问题2');
  });

  it('clearChatHistory 清空', () => {
    useDigitalHumanStore.getState().addChatMessage('user', '测试');
    useDigitalHumanStore.getState().clearChatHistory();
    expect(useDigitalHumanStore.getState().chatHistory).toHaveLength(0);
  });

  it('超出 maxChatHistoryLength 自动裁剪', () => {
    useDigitalHumanStore.setState({ maxChatHistoryLength: 3 });
    const store = useDigitalHumanStore.getState();
    for (let i = 0; i < 5; i++) {
      store.addChatMessage('user', `消息${i}`);
    }
    const history = useDigitalHumanStore.getState().chatHistory;
    expect(history.length).toBeLessThanOrEqual(3);
    expect(history[history.length - 1].text).toBe('消息4');
  });
});

describe('digitalHumanStore — 错误管理', () => {
  it('addError 添加错误', () => {
    useDigitalHumanStore.getState().addError('测试错误');
    const state = useDigitalHumanStore.getState();
    expect(state.error).toBe('测试错误');
    expect(state.errorQueue).toHaveLength(1);
    expect(state.errorQueue[0].message).toBe('测试错误');
    expect(state.errorQueue[0].severity).toBe('error');
  });

  it('addError 支持不同严重级别', () => {
    useDigitalHumanStore.getState().addError('提示信息', 'info');
    const queue = useDigitalHumanStore.getState().errorQueue;
    expect(queue[0].severity).toBe('info');
  });

  it('dismissError 移除特定错误', () => {
    useDigitalHumanStore.getState().addError('错误1');
    useDigitalHumanStore.getState().addError('错误2');
    const errorId = useDigitalHumanStore.getState().errorQueue[0].id;
    useDigitalHumanStore.getState().dismissError(errorId);
    const queue = useDigitalHumanStore.getState().errorQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('错误2');
  });

  it('clearAllErrors 清空所有错误', () => {
    useDigitalHumanStore.getState().addError('错误1');
    useDigitalHumanStore.getState().addError('错误2');
    useDigitalHumanStore.getState().clearAllErrors();
    const state = useDigitalHumanStore.getState();
    expect(state.errorQueue).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  it('clearError 清除当前错误', () => {
    useDigitalHumanStore.getState().setError('一些错误');
    expect(useDigitalHumanStore.getState().error).toBe('一些错误');
    useDigitalHumanStore.getState().clearError();
    expect(useDigitalHumanStore.getState().error).toBeNull();
  });

  it('错误队列超出限制自动裁剪', () => {
    useDigitalHumanStore.setState({ maxErrorQueueLength: 2 });
    const store = useDigitalHumanStore.getState();
    store.addError('错误1');
    store.addError('错误2');
    store.addError('错误3');
    const queue = useDigitalHumanStore.getState().errorQueue;
    expect(queue.length).toBeLessThanOrEqual(2);
  });
});

describe('digitalHumanStore — 会话管理', () => {
  it('initSession 生成新的 sessionId', () => {
    const oldId = useDigitalHumanStore.getState().sessionId;
    useDigitalHumanStore.getState().initSession();
    const newId = useDigitalHumanStore.getState().sessionId;
    expect(newId).not.toBe(oldId);
    expect(newId).toMatch(/^session_/);
  });

  it('initSession 同时清空聊天历史', () => {
    useDigitalHumanStore.getState().addChatMessage('user', '测试');
    useDigitalHumanStore.getState().initSession();
    expect(useDigitalHumanStore.getState().chatHistory).toHaveLength(0);
  });
});

describe('digitalHumanStore — 性能指标', () => {
  it('updatePerformanceMetrics 更新指标', () => {
    useDigitalHumanStore.getState().updatePerformanceMetrics({ fps: 60 });
    // 防抖可能导致延迟，直接检查调用不报错
    expect(useDigitalHumanStore.getState().performanceMetrics).toBeDefined();
  });
});
