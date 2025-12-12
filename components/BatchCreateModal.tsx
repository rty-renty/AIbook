import React, { useState } from 'react';
import { Novel } from '../types';
import { Button } from './Button';

interface BatchCreateModalProps {
  novel: Novel;
  currentChapterId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number, direction: string, insertAfterId?: string) => void;
  isLoading?: boolean;
}

export const BatchCreateModal: React.FC<BatchCreateModalProps> = ({ novel, currentChapterId, isOpen, onClose, onConfirm, isLoading }) => {
  const [count, setCount] = useState(5);
  const [direction, setDirection] = useState('');
  const [insertAfterId, setInsertAfterId] = useState<string>('');

  // Default to inserting after the last chapter, or the current one if specified
  React.useEffect(() => {
    if (isOpen) {
      if (currentChapterId) {
        setInsertAfterId(currentChapterId);
      } else if (novel.chapters.length > 0) {
        setInsertAfterId(novel.chapters[novel.chapters.length - 1].id);
      }
    }
  }, [isOpen, currentChapterId, novel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-up">
        <div className="p-6 border-b border-paper-200">
          <h2 className="text-xl font-serif font-bold text-ink-900">批量生成章节</h2>
          <p className="text-sm text-ink-500 mt-1">AI 将根据你的指引自动规划后续章节大纲</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">插入位置 (在此章节后生成)</label>
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

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">生成数量</label>
            <div className="flex gap-4 items-center">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="flex-1 accent-ink-900"
              />
              <span className="w-12 text-center font-bold text-ink-900 border border-paper-300 rounded px-2 py-1">{count} 章</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">剧情走向（可选）</label>
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full h-32 p-3 bg-paper-50 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none resize-none text-sm text-ink-900 placeholder-ink-400"
              placeholder="例如：主角进入了一个上古秘境，遭遇了敌对门派的伏击，虽然身受重伤但因祸得福..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-paper-200 flex justify-end gap-3 bg-paper-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>取消</Button>
          <Button 
            onClick={() => onConfirm(count, direction, insertAfterId)} 
            isLoading={isLoading}
          >
            {isLoading ? '正在规划...' : '生成大纲'}
          </Button>
        </div>
      </div>
    </div>
  );
};