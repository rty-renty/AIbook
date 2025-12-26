
import React, { useState } from 'react';
import { Novel } from '../types';
import { Button } from './Button';

interface BatchCreateModalProps {
  novel: Novel;
  currentChapterId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number, direction: string, insertAfterId?: string, targetCoverage?: number) => void;
  isLoading?: boolean;
  progress?: number; 
  totalChapters?: number;
  currentGenerated?: number;
  statusText?: string;
}

export const BatchCreateModal: React.FC<BatchCreateModalProps> = ({ 
  novel, 
  currentChapterId, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  progress = 0,
  totalChapters = 0,
  currentGenerated = 0,
  statusText = ''
}) => {
  const [count, setCount] = useState(20);
  const [direction, setDirection] = useState('');
  const [insertAfterId, setInsertAfterId] = useState<string>('');
  const [targetCoverage, setTargetCoverage] = useState(100);

  React.useEffect(() => {
    if (isOpen) {
      if (currentChapterId) {
        setInsertAfterId(currentChapterId);
      } else if (novel.chapters.length > 0) {
        setInsertAfterId(novel.chapters[novel.chapters.length - 1].id);
      }
      setTargetCoverage(Math.min(100, (novel.currentCoverage || 0) + 20));
    }
  }, [isOpen, currentChapterId, novel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-up">
        <div className="p-6 border-b border-paper-200">
          <h2 className="text-xl font-serif font-bold text-ink-900">批量大纲规划</h2>
          <p className="text-sm text-ink-500 mt-1">
            {isLoading ? '正在进行大规模逻辑演算...' : '设置生成的章节数量和剧情方向'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-paper-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
                      className="text-ink-900 transition-all duration-700 ease-out" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-ink-900">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-ink-900 font-bold">已生成 {currentGenerated} / {totalChapters} 章</p>
                <p className="text-xs text-ink-400 animate-pulse">{statusText || '正在规划剧情流向...'}</p>
              </div>
              <div className="bg-paper-50 p-3 rounded-lg border border-paper-200">
                <p className="text-[10px] text-ink-400 italic">
                  提示：超大批量生成可能需要数分钟，请保持窗口开启。AI 正在分片处理以确保每一章大纲的质量。
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">插入位置</label>
                <select 
                  value={insertAfterId}
                  onChange={(e) => setInsertAfterId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none bg-white text-sm"
                >
                  {novel.chapters.map((chap, idx) => (
                    <option key={chap.id} value={chap.id}>
                      第{idx + 1}章: {chap.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">生成章节数</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={count} 
                    onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">目标故事进度</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min={Math.round(novel.currentCoverage || 0)} 
                      max="100" 
                      value={targetCoverage} 
                      onChange={(e) => setTargetCoverage(parseInt(e.target.value))}
                      className="flex-1 accent-ink-900"
                    />
                    <span className="text-xs font-bold w-10">{targetCoverage}%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">后续剧情方向 (可选)</label>
                <textarea
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full h-24 p-3 bg-paper-50 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none resize-none text-sm"
                  placeholder="例如：进入帝国学院篇，主角需要隐藏实力并调查身世之谜..."
                />
              </div>
            </>
          )}
        </div>

        {!isLoading && (
          <div className="p-4 border-t border-paper-200 flex justify-end gap-3 bg-paper-50 rounded-b-xl">
            <Button variant="ghost" onClick={onClose}>取消</Button>
            <Button onClick={() => onConfirm(count, direction, insertAfterId, targetCoverage)}>
              确认生成
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
