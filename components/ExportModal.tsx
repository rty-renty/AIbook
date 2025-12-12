import React, { useState, useEffect } from 'react';
import { Novel } from '../types';
import { Button } from './Button';

interface ExportModalProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ novel, isOpen, onClose }) => {
  const [format, setFormat] = useState<'txt' | 'md'>('txt');
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Default select all
      setSelectedChapters(new Set(novel.chapters.map(c => c.id)));
    }
  }, [isOpen, novel]);

  if (!isOpen) return null;

  const toggleChapter = (id: string) => {
    const newSet = new Set(selectedChapters);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedChapters(newSet);
  };

  const toggleAll = () => {
    if (selectedChapters.size === novel.chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(novel.chapters.map(c => c.id)));
    }
  };

  const handleExport = () => {
    const chaptersToExport = novel.chapters.filter(c => selectedChapters.has(c.id));
    if (chaptersToExport.length === 0) return;

    let content = "";
    if (format === 'md') {
      content += `# ${novel.title}\n\n`;
      content += `> ${novel.premise}\n\n`;
      content += `---\n\n`;
      chaptersToExport.forEach(c => {
        content += `## ${c.title}\n\n`;
        content += `${c.content || "(暂无内容)"}\n\n`;
      });
    } else {
      content += `《${novel.title}》\n\n`;
      content += `简介：${novel.premise}\n\n`;
      content += `====================================\n\n`;
      chaptersToExport.forEach(c => {
        content += `【${c.title}】\n\n`;
        content += `${c.content || "(暂无内容)"}\n\n`;
        content += `\n------------------------------------\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${novel.title}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-up">
        <div className="p-6 border-b border-paper-200">
           <h2 className="text-2xl font-serif font-bold text-ink-900">导出作品</h2>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-2">导出格式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-ink-100 rounded-lg hover:bg-paper-50 transition-colors flex-1">
                <input 
                  type="radio" 
                  checked={format === 'txt'} 
                  onChange={() => setFormat('txt')} 
                  className="text-ink-900 focus:ring-ink-500 w-4 h-4" 
                />
                <span className="font-medium text-ink-800">TXT 文本</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-ink-100 rounded-lg hover:bg-paper-50 transition-colors flex-1">
                <input 
                  type="radio" 
                  checked={format === 'md'} 
                  onChange={() => setFormat('md')} 
                  className="text-ink-900 focus:ring-ink-500 w-4 h-4" 
                />
                <span className="font-medium text-ink-800">Markdown</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-ink-700">选择章节</label>
              <button onClick={toggleAll} className="text-xs text-ink-500 hover:text-ink-800 underline">
                {selectedChapters.size === novel.chapters.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="border border-paper-200 rounded-lg max-h-60 overflow-y-auto p-2 bg-paper-50">
               {novel.chapters.map(chapter => (
                 <label key={chapter.id} className="flex items-center gap-3 p-2 hover:bg-paper-100 rounded cursor-pointer transition-colors">
                   <input 
                     type="checkbox" 
                     checked={selectedChapters.has(chapter.id)}
                     onChange={() => toggleChapter(chapter.id)}
                     className="rounded border-ink-300 text-ink-900 focus:ring-ink-500 w-4 h-4"
                   />
                   <span className="text-sm truncate flex-1 font-medium text-ink-700">{chapter.title}</span>
                   <span className="text-xs text-ink-400 font-mono">
                     {chapter.content ? `${chapter.content.length}字` : '无内容'}
                   </span>
                 </label>
               ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-paper-200 flex justify-end gap-3 bg-paper-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleExport} disabled={selectedChapters.size === 0}>
            确认导出 ({selectedChapters.size})
          </Button>
        </div>
      </div>
    </div>
  );
};