import React, { useState } from 'react';
import { Palette, Eye, Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';

interface ExpressionControl {
  name: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  intensity: number;
}

interface ExpressionControlPanelProps {
  currentExpression: string;
  onExpressionChange: (expression: string, intensity: number) => void;
}

export default function ExpressionControlPanel({ currentExpression, onExpressionChange }: ExpressionControlPanelProps) {
  const [intensity, setIntensity] = useState(0.8);

  const expressions: ExpressionControl[] = [
    { name: 'neutral', label: '自然', icon: <Meh size={20} />, color: 'text-gray-400', intensity: 0.5 },
    { name: 'smile', label: '微笑', icon: <Smile size={20} />, color: 'text-green-400', intensity: 0.7 },
    { name: 'laugh', label: '大笑', icon: <Laugh size={20} />, color: 'text-yellow-400', intensity: 1.0 },
    { name: 'surprise', label: '惊讶', icon: <Smile size={20} />, color: 'text-orange-400', intensity: 0.8 },
    { name: 'sad', label: '悲伤', icon: <Frown size={20} />, color: 'text-blue-400', intensity: 0.6 },
    { name: 'angry', label: '生气', icon: <Angry size={20} />, color: 'text-red-400', intensity: 0.9 },
    { name: 'blink', label: '眨眼', icon: <Eye size={20} />, color: 'text-purple-400', intensity: 0.4 },
  ];

  const handleExpressionClick = (expressionName: string, defaultIntensity: number) => {
    setIntensity(defaultIntensity);
    onExpressionChange(expressionName, defaultIntensity);
  };

  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
    if (currentExpression) {
      onExpressionChange(currentExpression, newIntensity);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">表情控制</h3>
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5">
          <Palette size={14} className="text-slate-500 dark:text-white/60" />
          <span className="text-xs text-slate-700 dark:text-white/80 font-mono uppercase">{currentExpression || 'neutral'}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {expressions.map((expression) => (
          <button
            key={expression.name}
            onClick={() => handleExpressionClick(expression.name, expression.intensity)}
            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 group text-left ${
              currentExpression === expression.name
                ? 'border-blue-500/50 bg-blue-100 dark:bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/10'
            }`}
          >
            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-black/20 ${expression.color}`}>
              {expression.icon}
            </div>
            <div>
              <div className="font-medium text-slate-700 dark:text-gray-200 text-sm">{expression.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-white/40">
                强度: {Math.round(expression.intensity * 100)}%
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Intensity Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">表情强度</label>
          <span className="text-xs font-mono text-blue-500 dark:text-blue-400">{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={intensity}
          onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Advanced Triggers */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">微表情触发</h4>
        <div className="grid grid-cols-2 gap-2">
          {['挑眉', '快速眨眼', '张嘴', '点头'].map((action, i) => {
             const keys = ['eyebrow_raise', 'eye_blink', 'mouth_open', 'head_nod'];
             return (
              <button
                key={action}
                onClick={() => onExpressionChange(keys[i], intensity)}
                className="px-3 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-white/5 rounded-lg text-xs transition-colors"
              >
                {action}
              </button>
             )
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
        <button
          onClick={() => {
            onExpressionChange('neutral', 0.5);
            setIntensity(0.5);
          }}
          className="w-full px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg transition-colors text-sm"
        >
          重置表情
        </button>
      </div>
    </div>
  );
}
