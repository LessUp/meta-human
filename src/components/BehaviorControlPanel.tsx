import React, { useState, useEffect } from 'react';
import { Activity, Brain, Zap, Target, Clock, TrendingUp } from 'lucide-react';

interface BehaviorState {
  state: string;
  confidence: number;
  lastUpdate: Date;
  activity: string;
  goal: string;
}

interface BehaviorControlPanelProps {
  currentBehavior: string;
  onBehaviorChange: (behavior: string, parameters: any) => void;
}

export default function BehaviorControlPanel({ currentBehavior, onBehaviorChange }: BehaviorControlPanelProps) {
  const [behaviorState, setBehaviorState] = useState<BehaviorState>({
    state: 'idle',
    confidence: 0.8,
    lastUpdate: new Date(),
    activity: '待机',
    goal: '等待用户交互'
  });

  const [isAutoMode, setIsAutoMode] = useState(false);
  const [decisionInterval, setDecisionInterval] = useState(3000);
  const [learningRate, setLearningRate] = useState(0.1);

  const behaviors = [
    {
      name: 'idle',
      label: '待机',
      icon: <Clock size={20} />,
      color: 'bg-gray-500',
      description: '基础待机状态',
      parameters: { idleTime: 5000, breathing: true }
    },
    {
      name: 'greeting',
      label: '打招呼',
      icon: <Target size={20} />,
      color: 'bg-green-500',
      description: '友好的打招呼行为',
      parameters: { wave: true, smile: true, duration: 3000 }
    },
    {
      name: 'listening',
      label: '倾听',
      icon: <Brain size={20} />,
      color: 'bg-blue-500',
      description: '专注倾听状态',
      parameters: { headNod: true, eyeContact: true, attention: 0.9 }
    },
    {
      name: 'thinking',
      label: '思考',
      icon: <Activity size={20} />,
      color: 'bg-yellow-500',
      description: '思考处理状态',
      parameters: { headTilt: true, pause: true, processing: true }
    },
    {
      name: 'speaking',
      label: '说话',
      icon: <TrendingUp size={20} />,
      color: 'bg-purple-500',
      description: '主动说话状态',
      parameters: { mouthMove: true, gestures: true, emphasis: 0.8 }
    },
    {
      name: 'excited',
      label: '兴奋',
      icon: <Zap size={20} />,
      color: 'bg-orange-500',
      description: '兴奋活跃状态',
      parameters: { energy: 0.9, movement: true, animation: 'bounce' }
    }
  ];

  // 自动决策模式
  useEffect(() => {
    if (!isAutoMode) return;

    const interval = setInterval(() => {
      makeAutoDecision();
    }, decisionInterval);

    return () => clearInterval(interval);
  }, [isAutoMode, decisionInterval]);

  const makeAutoDecision = () => {
    // 基于当前状态和时间做出决策
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - behaviorState.lastUpdate.getTime();
    
    let newBehavior = 'idle';
    let newParameters = {};
    let newConfidence = 0.7;

    // 简单的决策逻辑
    if (timeSinceLastUpdate > 10000 && Math.random() > 0.7) {
      newBehavior = 'greeting';
      newConfidence = 0.8;
    } else if (Math.random() > 0.9) {
      newBehavior = 'excited';
      newConfidence = 0.6;
    }

    const selectedBehavior = behaviors.find(b => b.name === newBehavior);
    if (selectedBehavior) {
      newParameters = selectedBehavior.parameters;
    }

    setBehaviorState({
      state: newBehavior,
      confidence: newConfidence,
      lastUpdate: now,
      activity: behaviors.find(b => b.name === newBehavior)?.label || '未知',
      goal: `自动切换到${behaviors.find(b => b.name === newBehavior)?.label}状态`
    });

    onBehaviorChange(newBehavior, newParameters);
  };

  const handleBehaviorClick = (behaviorName: string, parameters: any) => {
    const behavior = behaviors.find(b => b.name === behaviorName);
    if (!behavior) return;

    setBehaviorState({
      state: behaviorName,
      confidence: 0.9,
      lastUpdate: new Date(),
      activity: behavior.label,
      goal: `手动切换到${behavior.label}状态`
    });

    onBehaviorChange(behaviorName, parameters);
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
    if (!isAutoMode) {
      setBehaviorState({
        ...behaviorState,
        goal: '启用自动决策模式'
      });
    } else {
      setBehaviorState({
        ...behaviorState,
        goal: '禁用自动决策模式'
      });
    }
  };

  const resetBehavior = () => {
    setBehaviorState({
      state: 'idle',
      confidence: 0.8,
      lastUpdate: new Date(),
      activity: '待机',
      goal: '重置到默认状态'
    });
    onBehaviorChange('idle', { idleTime: 5000, breathing: true });
    setIsAutoMode(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">行为控制系统</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            behaviorState.state === 'idle' ? 'bg-gray-400' :
            behaviorState.state === 'greeting' ? 'bg-green-400' :
            behaviorState.state === 'listening' ? 'bg-blue-400' :
            behaviorState.state === 'thinking' ? 'bg-yellow-400' :
            behaviorState.state === 'speaking' ? 'bg-purple-400' :
            'bg-orange-400'
          } ${isAutoMode ? 'animate-pulse' : ''}`}></div>
          <span className="text-sm text-gray-600">{behaviorState.activity}</span>
        </div>
      </div>

      {/* 当前状态 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">当前状态</span>
          <span className="text-sm font-semibold text-gray-800 capitalize">{behaviorState.state}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">置信度</span>
          <span className="text-sm font-semibold text-gray-800">{Math.round(behaviorState.confidence * 100)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">目标</span>
          <span className="text-sm text-gray-800">{behaviorState.goal}</span>
        </div>
      </div>

      {/* 行为选择 */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">行为选择</h4>
        <div className="grid grid-cols-2 gap-3">
          {behaviors.map((behavior) => (
            <button
              key={behavior.name}
              onClick={() => handleBehaviorClick(behavior.name, behavior.parameters)}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                currentBehavior === behavior.name
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-full ${behavior.color} text-white`}>
                {behavior.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-800">{behavior.label}</div>
                <div className="text-xs text-gray-600">{behavior.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 自动模式控制 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700">自动决策模式</h4>
          <button
            onClick={toggleAutoMode}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAutoMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {isAutoMode ? '关闭自动' : '启用自动'}
          </button>
        </div>

        {isAutoMode && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                决策间隔: {decisionInterval / 1000}秒
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={decisionInterval}
                onChange={(e) => setDecisionInterval(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                学习率: {learningRate.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 高级控制 */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">高级控制</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBehaviorClick('listening', { headNod: true, eyeContact: true, attention: 0.9 })}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
          >
            专注倾听
          </button>
          <button
            onClick={() => handleBehaviorClick('thinking', { headTilt: true, pause: true, processing: true })}
            className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm transition-colors"
          >
            思考模式
          </button>
          <button
            onClick={() => handleBehaviorClick('speaking', { mouthMove: true, gestures: true, emphasis: 0.8 })}
            className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-colors"
          >
            演讲模式
          </button>
          <button
            onClick={() => handleBehaviorClick('excited', { energy: 0.9, movement: true, animation: 'bounce' })}
            className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
          >
            活跃模式
          </button>
        </div>
      </div>

      {/* 重置按钮 */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={resetBehavior}
          className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          重置行为状态
        </button>
      </div>
    </div>
  );
}