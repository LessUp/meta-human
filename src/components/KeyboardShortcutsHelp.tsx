import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { key: '空格', description: '播放 / 暂停' },
  { key: 'R', description: '重置数字人' },
  { key: 'M', description: '静音切换' },
  { key: 'V', description: '录音切换' },
  { key: 'S', description: '设置面板开关' },
  { key: 'Esc', description: '关闭设置面板' },
  { key: '1', description: '打招呼' },
  { key: '2', description: '跳舞' },
  { key: '3', description: '说话' },
  { key: '4', description: '表情切换' },
  { key: '5', description: '鞠躬' },
  { key: '6', description: '拍手' },
  { key: '7', description: '点赞' },
  { key: '8', description: '欢呼' },
  { key: '9', description: '耸肩' },
  { key: '0', description: '张望' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm dark:shadow-none"
        title="键盘快捷键"
      >
        <Keyboard className="w-5 h-5 text-slate-600 dark:text-white/80" />
      </button>

      {/* 弹出面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 内容 */}
          <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-slate-800 dark:text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                键盘快捷键
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm text-slate-600 dark:text-white/70">{shortcut.description}</span>
                  <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md text-xs font-mono text-slate-700 dark:text-white/90 min-w-[2rem] text-center">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-slate-400 dark:text-white/30 text-center">
              在输入框内时快捷键不生效
            </p>
          </div>
        </div>
      )}
    </>
  );
}
