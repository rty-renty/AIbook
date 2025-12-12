import React, { useState, useEffect } from 'react';
import { Novel, Chapter, ChapterStatus } from '../types';
import { Button } from './Button';

interface FullOutlineModalProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedNovel: Novel) => void;
  onAiContinue: (instruction: string) => Promise<Chapter | null>;
  isAiLoading: boolean;
}

export const FullOutlineModal: React.FC<FullOutlineModalProps> = ({ novel, isOpen, onClose, onUpdate, onAiContinue, isAiLoading }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setChapters(JSON.parse(JSON.stringify(novel.chapters))); // Deep copy
    }
  }, [isOpen, novel]);

  if (!isOpen) return null;

  const handleChapterChange = (id: string, field: 'title' | 'outline', value: string) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chap-${Date.now()}`,
      title: `第${chapters.length + 1}章`,
      outline: '',
      content: '',
      status: ChapterStatus.DRAFT
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (id: string) => {
    if (window.confirm("确定删除该章节吗？此操作将删除对应的大纲和正文。")) {
      setChapters(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    onUpdate({ ...novel, chapters });
    onClose();
  };

  const handleAiGenerate = async () => {
    const newChapter = await onAiContinue(aiInstruction);
    if (newChapter) {
      setChapters(prev => [...prev, newChapter]);
      setAiInstruction('');
      setShowAiInput(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set a custom drag image if needed, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIndex === null || draggedIndex === index) return;

    // Move the item in the array
    const newChapters = [...chapters];
    const draggedItem = newChapters[draggedIndex];
    
    // Remove from old index
    newChapters.splice(draggedIndex, 1);
    // Insert at new index
    newChapters.splice(index, 0, draggedItem);

    setChapters(newChapters);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-paper-200">
          <h2 className="text-2xl font-serif font-bold text-ink-900">全文大纲管理</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-50/50 space-y-4">
          {chapters.map((chapter, index) => (
            <div 
              key={chapter.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white p-4 rounded-lg border shadow-sm flex gap-4 group transition-all duration-200 ${
                draggedIndex === index 
                  ? 'border-ink-500 border-dashed opacity-50 bg-paper-100' 
                  : 'border-paper-200 hover:border-ink-300'
              }`}
            >
              {/* Drag Handle & Index */}
              <div className="w-10 pt-2 flex flex-col items-center gap-1 cursor-move text-ink-300 hover:text-ink-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="font-bold text-lg select-none">{index + 1}</span>
              </div>

              <div className="flex-1 space-y-2">
                 <input 
                    value={chapter.title}
                    onChange={(e) => handleChapterChange(chapter.id, 'title', e.target.value)}
                    className="w-full text-lg font-bold text-ink-900 border-none outline-none focus:ring-0 placeholder-ink-300 bg-transparent"
                    placeholder="章节标题"
                  />
                  <textarea 
                    value={chapter.outline}
                    onChange={(e) => handleChapterChange(chapter.id, 'outline', e.target.value)}
                    className="w-full h-24 p-3 bg-paper-50 rounded border border-ink-100 focus:border-ink-500 outline-none resize-none text-sm text-ink-700"
                    placeholder="输入本章大纲..."
                  />
              </div>
               <button 
                  onClick={() => removeChapter(chapter.id)}
                  className="text-ink-400 hover:text-red-500 p-2 self-start transition-colors"
                  title="删除章节"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
          ))}

          {/* Action Area */}
          <div className="flex gap-4">
             <button 
              onClick={addChapter}
              className="flex-1 py-4 border-2 border-dashed border-ink-200 rounded-lg text-ink-500 hover:border-ink-400 hover:text-ink-700 flex items-center justify-center font-medium transition-colors bg-white hover:bg-paper-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              手动添加新章节
            </button>
            
            <div className="flex-1 relative">
                {!showAiInput ? (
                   <button 
                    onClick={() => setShowAiInput(true)}
                    className="w-full h-full border-2 border-dashed border-purple-200 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 flex items-center justify-center font-medium transition-colors bg-white"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    AI 续写下一章大纲
                  </button>
                ) : (
                  <div className="absolute bottom-0 left-0 w-full bg-white border border-purple-200 rounded-lg p-3 shadow-lg z-10">
                     <textarea
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="输入剧情走向（可选），留空则由 AI 自由发挥..."
                        className="w-full h-20 p-2 mb-2 bg-paper-50 rounded border border-ink-100 text-sm resize-none focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setShowAiInput(false)}>取消</Button>
                        <Button size="sm" onClick={handleAiGenerate} isLoading={isAiLoading}>生成</Button>
                      </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-paper-200 bg-white flex justify-end gap-3">
          <div className="flex-1 flex items-center text-xs text-ink-400">
             提示：拖动序号可调整章节顺序；操作完成后请点击保存。
          </div>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存全部大纲</Button>
        </div>
      </div>
    </div>
  );
};