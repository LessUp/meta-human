// Slider — 通用标签滑块
// 从 VoiceInteractionPanel / ExpressionControlPanel 中提取
interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

export default function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.1,
  format,
  onChange,
}: SliderProps) {
  const displayValue = format ? format(value) : `${Math.round(value * 100)}%`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-500 dark:text-white/50">{label}</label>
        <span className="text-xs font-mono text-blue-500 dark:text-blue-400">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}
