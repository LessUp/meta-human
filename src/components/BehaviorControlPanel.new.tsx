import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Brain, Zap, Target, Clock, TrendingUp } from 'lucide-react';

interface BehaviorState {
  state: string;
  confidence: number;
  lastUpdate: Date;
  activity: string;
  goal: string;
}

type BehaviorParameters = Record<string, unknown>;

interface BehaviorControlPanelProps {
  currentBehavior: string;
  onBehaviorChange: (behavior: string, parameters: BehaviorParameters) => void;
}

export default function BehaviorControlPanel({ currentBehavior, onBehaviorChange }: BehaviorControlPanelProps) {
  const [behaviorState, setBehaviorState] = useState<BehaviorState>({
    state: 'idle',
    confidence: 0.8,
    lastUpdate: new Date(),
    activity: '待机',
    goal: '等待输入'
  });

  const [isAutoMode, setIsAutoMode] = useState(false);
  const decisionInterval = 3000;

  const behaviors = useMemo(
    () => [
      {
        name: 'idle',
        label: '待机',
        icon: <Clock size={20} />,
        color: 'text-gray-400',
        description: '基础待机循环',
        parameters: { idleTime: 5000, breathing: true },
      },
      {
        name: 'greeting',
        label: '打招呼',
        icon: <Target size={20} />,
        color: 'text-green-400',
        description: '友好挥手微笑',
        parameters: { wave: true, smile: true, duration: 3000 },
      },
      {
        name: 'listening',
        label: '倾听',
        icon: <Brain size={20} />,
        color: 'text-blue-400',
        description: '专注聆听状态',
        parameters: { headNod: true, eyeContact: true, attention: 0.9 },
      },
      {
        name: 'thinking',
        label: '思考',
        icon: <Activity size={20} />,
        color: 'text-yellow-400',
        description: '思考处理动画',
        parameters: { headTilt: true, pause: true, processing: true },
      },
      {
        name: 'speaking',
        label: '说话',
        icon: <TrendingUp size={20} />,
        color: 'text-purple-400',
        description: '主动对话状态',
        parameters: { mouthMove: true, gestures: true, emphasis: 0.8 },
      },
      {
        name: 'excited',
        label: '兴奋',
        icon: <Zap size={20} />,
        color: 'text-orange-400',
        description: '高能量状态',
        parameters: { energy: 0.9, movement: true, animation: 'bounce' },
      },
    ],
    []
  );

  const makeAutoDecision = useCallback(() => {
    const now = new Date();
    let newBehavior = 'idle';
    let newParameters: BehaviorParameters = {};
    let newConfidence = 0.7;

    if (Math.random() > 0.7) {
      newBehavior = 'greeting';
      newConfidence = 0.8;
    } else if (Math.random() > 0.9) {
      newBehavior = 'excited';
      newConfidence = 0.6;
    }

    const selectedBehavior = behaviors.find(b => b.name === newBehavior);
    if (selectedBehavior) newParameters = selectedBehavior.parameters;

    setBehaviorState({
      state: newBehavior,
      confidence: newConfidence,
      lastUpdate: now,
      activity: behaviors.find(b => b.name === newBehavior)?.label || '未知',
      goal: `自动切换: ${behaviors.find(b => b.name === newBehavior)?.label}`
    });

    onBehaviorChange(newBehavior, newParameters);
  }, [behaviors, onBehaviorChange]);

  // 自动决策
  useEffect(() => {
    if (!isAutoMode) return;
    const interval = setInterval(() => {
      makeAutoDecision();
    }, decisionInterval);
    return () => clearInterval(interval);
  }, [decisionInterval, isAutoMode, makeAutoDecision]);

  const handleBehaviorClick = (behaviorName: string, parameters: BehaviorParameters) => {
    const behavior = behaviors.find(b => b.name === behaviorName);
    if (!behavior) return;

    setBehaviorState({
      state: behaviorName,
      confidence: 0.9,
      lastUpdate: new Date(),
      activity: behavior.label,
      goal: `手动切换: ${behavior.label}`
    });

    onBehaviorChange(behaviorName, parameters);
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
    setBehaviorState(prev => ({
      ...prev,
      goal: !isAutoMode ? '自动驾驶已启动' : '手动控制'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-lg font-medium text-white">行为引擎</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`}></div>
          <span className="text-xs text-white/60">{isAutoMode ? '自动' : '手动'}</span>
        </div>
      </div>

      {/* 状态监控 */}
      <div className="bg-black/40 rounded-xl p-4 space-y-2 border border-white/5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-white/40">状态</span>
          <span className="text-green-400 uppercase">{behaviorState.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">置信度</span>
          <span className="text-blue-400">{Math.round(behaviorState.confidence * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">目标</span>
          <span className="text-white/60 truncate max-w-[150px] text-right">{behaviorState.goal}</span>
        </div>
      </div>

      {/* 行为网格 */}
      <div className="grid grid-cols-2 gap-3">
        {behaviors.map((behavior) => (
          <button
            key={behavior.name}
            onClick={() => handleBehaviorClick(behavior.name, behavior.parameters)}
            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all text-left ${
              currentBehavior === behavior.name
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/5 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`p-2 rounded-lg bg-black/20 ${behavior.color}`}>
              {behavior.icon}
            </div>
            <div>
              <div className="font-medium text-gray-200 text-sm">{behavior.label}</div>
              <div className="text-[10px] text-white/40">{behavior.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 自动切换 */}
      <div className="pt-4 border-t border-white/10">
         <button
            onClick={toggleAutoMode}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
              isAutoMode
                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {isAutoMode ? '关闭自动驾驶' : '开启自动驾驶'}
          </button>
      </div>
    </div>
  );
}
