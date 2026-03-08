import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Brain, Zap, Target, Clock, TrendingUp, Hand, ThumbsUp, Eye, ArrowUp, HelpCircle, PartyPopper, Moon, Crosshair, Pointer } from 'lucide-react';

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
      { name: 'idle', label: '待机', icon: <Clock size={20} />, color: 'text-gray-400', description: '基础待机循环', parameters: { idleTime: 5000, breathing: true } },
      { name: 'greeting', label: '打招呼', icon: <Target size={20} />, color: 'text-green-400', description: '友好挥手微笑', parameters: { wave: true, smile: true, duration: 3000 } },
      { name: 'listening', label: '倾听', icon: <Brain size={20} />, color: 'text-blue-400', description: '专注聆听状态', parameters: { headNod: true, eyeContact: true, attention: 0.9 } },
      { name: 'thinking', label: '思考', icon: <Activity size={20} />, color: 'text-yellow-400', description: '思考处理动画', parameters: { headTilt: true, pause: true, processing: true } },
      { name: 'speaking', label: '说话', icon: <TrendingUp size={20} />, color: 'text-purple-400', description: '主动对话状态', parameters: { mouthMove: true, gestures: true, emphasis: 0.8 } },
      { name: 'excited', label: '兴奋', icon: <Zap size={20} />, color: 'text-orange-400', description: '高能量状态', parameters: { energy: 0.9, movement: true, animation: 'bounce' } },
      { name: 'bow', label: '鞠躬', icon: <ArrowUp size={20} className="rotate-180" />, color: 'text-cyan-400', description: '礼貌鞠躬致意', parameters: { depth: 0.8, duration: 3000 } },
      { name: 'clap', label: '拍手', icon: <Hand size={20} />, color: 'text-pink-400', description: '鼓掌赞赏', parameters: { speed: 1, duration: 3000 } },
      { name: 'thumbsUp', label: '点赞', icon: <ThumbsUp size={20} />, color: 'text-emerald-400', description: '竖起大拇指', parameters: { hand: 'right', duration: 3000 } },
      { name: 'headTilt', label: '歪头', icon: <HelpCircle size={20} />, color: 'text-amber-400', description: '好奇歪头动作', parameters: { angle: 0.25, duration: 2500 } },
      { name: 'shrug', label: '耸肩', icon: <HelpCircle size={20} />, color: 'text-slate-400', description: '不确定耸肩', parameters: { intensity: 0.8, duration: 2500 } },
      { name: 'lookAround', label: '张望', icon: <Eye size={20} />, color: 'text-teal-400', description: '左右环顾张望', parameters: { range: 0.5, duration: 4000 } },
      { name: 'cheer', label: '欢呼', icon: <PartyPopper size={20} />, color: 'text-rose-400', description: '双手举起欢呼', parameters: { energy: 1, duration: 4000 } },
      { name: 'sleep', label: '打瞌睡', icon: <Moon size={20} />, color: 'text-indigo-400', description: '低头打瞌睡', parameters: { depth: 0.6, duration: 5000 } },
      { name: 'crossArms', label: '抱臂', icon: <Crosshair size={20} />, color: 'text-red-400', description: '双手交叉抱胸', parameters: { stance: 'firm', duration: 3000 } },
      { name: 'point', label: '指向', icon: <Pointer size={20} />, color: 'text-sky-400', description: '伸手指向前方', parameters: { direction: 'forward', duration: 3000 } },
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

  // Auto Decision Mock
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
      goal: !isAutoMode ? '自动模式已开启' : '手动控制'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">行为引擎</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? 'bg-green-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`}></div>
          <span className="text-xs text-slate-500 dark:text-white/60">{isAutoMode ? '自动' : '手动'}</span>
        </div>
      </div>

      {/* State Monitor */}
      <div className="bg-slate-50 dark:bg-black/40 rounded-xl p-4 space-y-2 border border-slate-200 dark:border-white/5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-white/40">状态</span>
          <span className="text-green-500 dark:text-green-400 uppercase">{behaviorState.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-white/40">置信度</span>
          <span className="text-blue-500 dark:text-blue-400">{Math.round(behaviorState.confidence * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-white/40">目标</span>
          <span className="text-slate-500 dark:text-white/60 truncate max-w-[150px] text-right">{behaviorState.goal}</span>
        </div>
      </div>

      {/* Behavior Grid */}
      <div className="grid grid-cols-3 gap-3">
        {behaviors.map((behavior) => (
          <button
            key={behavior.name}
            onClick={() => handleBehaviorClick(behavior.name, behavior.parameters)}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center ${
              currentBehavior === behavior.name
                ? 'border-blue-500/50 bg-blue-100 dark:bg-blue-500/10'
                : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-black/20 ${behavior.color}`}>
              {behavior.icon}
            </div>
            <div className="mt-1.5">
              <div className="font-medium text-slate-700 dark:text-gray-200 text-sm">{behavior.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-white/40">{behavior.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Auto Switch */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
         <button
            onClick={toggleAutoMode}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
              isAutoMode
                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/50'
                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
            }`}
          >
            {isAutoMode ? '关闭自动模式' : '开启自动模式'}
          </button>
      </div>
    </div>
  );
}
