import React, { useState } from 'react';
import { Button } from './Button';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instruction: string) => void;
  isLoading?: boolean;
}

export const RefineModal: React.FC<RefineModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  if (!isOpen) return null;

  const quickOptions = [
    "润色文笔，使其更具文学性",
    "扩写细节，增加环境描写和心理活动",
    "增加人物之间的对话冲突",
    "让节奏更紧凑，更有张力"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-up">
        <div className="p-6 border-b border-paper-200">
          <h2 className="text-xl font-serif font-bold text-ink-900">AI 重写 / 润色</h2>
          <p className="text-sm text-ink-500 mt-1">告诉 AI 你希望如何调整当前章节</p>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => setInstruction(opt)}
                className="px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-ink-700 text-xs rounded-full transition-colors border border-paper-300"
              >
                {opt}
              </button>
            ))}
          </div>

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-32 p-3 bg-paper-50 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none resize-none text-sm text-ink-900 placeholder-ink-400"
            placeholder="例如：把这一章写得更悲伤一些，重点描述主角的无助感..."
          />
        </div>

        <div className="p-4 border-t border-paper-200 flex justify-end gap-3 bg-paper-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>取消</Button>
          <Button 
            onClick={() => onConfirm(instruction)} 
            disabled={!instruction.trim() || isLoading}
            isLoading={isLoading}
          >
            {isLoading ? '正在重写...' : '开始重写'}
          </Button>
        </div>
      </div>
    </div>
  );
};