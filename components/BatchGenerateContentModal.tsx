import React, { useState, useEffect } from 'react';
import { Novel, Chapter, ChapterStatus } from '../types';
import { Button } from './Button';

interface BatchGenerateContentModalProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (chapterIds: string[]) => void;
  isLoading?: boolean;
}

export const BatchGenerateContentModal: React.FC<BatchGenerateContentModalProps> = ({ novel, isOpen, onClose, onConfirm, isLoading }) => {
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());

  // Automatically select chapters that are drafts and have outlines
  useEffect(() => {
    if (isOpen) {
      const drafts = novel.chapters
        .filter(c => c.status === ChapterStatus.DRAFT && c.outline.trim().length > 0)
        .map(c => c.id);
      setSelectedChapterIds(new Set(drafts));
    }
  }, [isOpen, novel]);

  if (!isOpen) return null;

  const toggleChapter = (id: string) => {
    const newSet = new Set(selectedChapterIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedChapterIds(newSet);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedChapterIds));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-up">
        <div className="p-6 border-b border-paper-200">
          <h2 className="text-xl font-serif font-bold text-ink-900">批量生成正文</h2>
          <p className="text-sm text-ink-500 mt-1">选择已完善大纲的章节，AI 将逐一为您撰写正文。</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-ink-700">待生成章节</label>
            <span className="text-xs text-ink-500">已选: {selectedChapterIds.size}</span>
          </div>
          
          <div className="border border-paper-200 rounded-lg max-h-80 overflow-y-auto p-2 bg-paper-50 space-y-1">
            {novel.chapters.map(chapter => {
              const hasContent = chapter.content.trim().length > 0;
              const hasOutline = chapter.outline.trim().length > 0;
              
              return (
                <label 
                  key={chapter.id} 
                  className={`flex items-center gap-3 p-3 rounded transition-colors border border-transparent ${
                     selectedChapterIds.has(chapter.id) ? 'bg-white border-ink-200 shadow-sm' : 'hover:bg-paper-100'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedChapterIds.has(chapter.id)}
                    onChange={() => toggleChapter(chapter.id)}
                    className="rounded border-ink-300 text-ink-900 focus:ring-ink-500 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-medium text-ink-800 truncate">{chapter.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        hasContent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {hasContent ? '已有正文' : '待生成'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 truncate">
                      {hasOutline ? chapter.outline : "（警告：暂无大纲，生成效果可能不佳）"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-paper-200 flex justify-end gap-3 bg-paper-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>取消</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedChapterIds.size === 0 || isLoading}
            isLoading={isLoading}
          >
            {isLoading ? '生成队列中...' : `开始生成 (${selectedChapterIds.size}章)`}
          </Button>
        </div>
      </div>
    </div>
  );
};