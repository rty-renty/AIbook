
import React, { useState, useMemo } from 'react';
import { Chapter, ChapterStatus } from '../types';

interface ChapterListProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onBatchAddChapters: () => void;
  onBatchGenerateContent: () => void;
  onOpenSettings: () => void;
  onOpenFullOutline: () => void;
  onOpenMindMap: () => void;
  onExport: () => void;
  onBack: () => void;
  onDeleteChapter: (id: string) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({ 
  chapters, 
  currentChapterId, 
  onSelectChapter,
  onAddChapter,
  onBatchAddChapters,
  onBatchGenerateContent,
  onOpenSettings,
  onOpenFullOutline,
  onOpenMindMap,
  onExport,
  onBack,
  onDeleteChapter
}) => {
  // Track expanded groups
  // We use strings like "100s-1" or "10s-5" as keys
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['10s-0', '100s-0']));

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group chapters into 100s, then 10s
  const groupedStructure = useMemo(() => {
    const structure: any[] = [];
    const useHundredGroups = chapters.length > 100;

    if (useHundredGroups) {
      for (let i = 0; i < chapters.length; i += 100) {
        const hundredIdx = Math.floor(i / 100);
        const hundredChapters = chapters.slice(i, i + 100);
        const subGroups = [];
        
        for (let j = 0; j < hundredChapters.length; j += 10) {
          const tenIdx = Math.floor(j / 10);
          subGroups.push({
            id: `10s-${hundredIdx}-${tenIdx}`,
            label: `第 ${i + j + 1} - ${Math.min(i + j + 10, i + hundredChapters.length)} 章`,
            items: hundredChapters.slice(j, j + 10),
            startIndex: i + j
          });
        }

        structure.push({
          id: `100s-${hundredIdx}`,
          label: `第 ${i + 1} - ${Math.min(i + 100, chapters.length)} 章`,
          subGroups
        });
      }
    } else {
      // Just 10s
      for (let i = 0; i < chapters.length; i += 10) {
        const tenIdx = Math.floor(i / 10);
        structure.push({
          id: `10s-${tenIdx}`,
          label: `第 ${i + 1} - ${Math.min(i + 10, chapters.length)} 章`,
          items: chapters.slice(i, i + 10),
          startIndex: i
        });
      }
    }
    return structure;
  }, [chapters]);

  return (
    <div className="flex flex-col h-full bg-paper-100 border-r border-paper-300">
      {/* Navigation Header */}
      <div className="p-4 border-b border-paper-200 flex items-center justify-between">
         <button 
          onClick={onBack}
          className="flex items-center text-ink-600 hover:text-ink-900 transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          书库
        </button>
        <h2 className="font-serif text-lg font-bold text-ink-900">目录</h2>
        <div className="w-5"></div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-paper-200 flex justify-end gap-1 bg-paper-50/50">
         <button onClick={onOpenMindMap} className="text-ink-500 hover:text-ink-800 p-1.5 rounded-lg hover:bg-paper-200" title="思维导图"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></button>
         <button onClick={onOpenFullOutline} className="text-ink-500 hover:text-ink-800 p-1.5 rounded-lg hover:bg-paper-200" title="全文管理"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></button>
         <button onClick={onExport} className="text-ink-500 hover:text-ink-800 p-1.5 rounded-lg hover:bg-paper-200" title="导出作品"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
         <button onClick={onOpenSettings} className="text-ink-500 hover:text-ink-800 p-1.5 rounded-lg hover:bg-paper-200" title="设定"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {groupedStructure.map((group: any) => (
          <div key={group.id} className="space-y-1">
            {/* 100 Group Header */}
            {group.subGroups ? (
              <>
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-2 text-xs font-bold text-ink-500 hover:bg-paper-200 rounded uppercase tracking-widest transition-colors"
                >
                  <span>{group.label}</span>
                  <svg className={`w-3 h-3 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedGroups.has(group.id) && (
                  <div className="pl-2 space-y-1 border-l border-paper-300 ml-1">
                    {group.subGroups.map((sub: any) => (
                      <div key={sub.id} className="space-y-1">
                        <button 
                          onClick={() => toggleGroup(sub.id)}
                          className="w-full flex items-center justify-between p-2 text-[10px] font-bold text-ink-400 hover:bg-paper-200 rounded uppercase tracking-wider transition-colors"
                        >
                          <span>{sub.label}</span>
                          <svg className={`w-3 h-3 transition-transform ${expandedGroups.has(sub.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {expandedGroups.has(sub.id) && (
                          <div className="space-y-1">
                            {sub.items.map((chapter: Chapter, idx: number) => (
                              <ChapterItem 
                                key={chapter.id} 
                                chapter={chapter} 
                                index={sub.startIndex + idx} 
                                isActive={currentChapterId === chapter.id}
                                onSelect={onSelectChapter}
                                onDelete={onDeleteChapter}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Just 10 Group
              <>
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-2 text-xs font-bold text-ink-500 hover:bg-paper-200 rounded uppercase tracking-widest transition-colors"
                >
                  <span>{group.label}</span>
                  <svg className={`w-3 h-3 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedGroups.has(group.id) && (
                  <div className="space-y-1">
                    {group.items.map((chapter: Chapter, idx: number) => (
                      <ChapterItem 
                        key={chapter.id} 
                        chapter={chapter} 
                        index={group.startIndex + idx} 
                        isActive={currentChapterId === chapter.id}
                        onSelect={onSelectChapter}
                        onDelete={onDeleteChapter}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-paper-200 space-y-2">
         <button onClick={onBatchGenerateContent} className="w-full py-2 bg-ink-900 text-paper-50 rounded-lg hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          按大纲生成正文
        </button>
         <button onClick={onBatchAddChapters} className="w-full py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI 扩写后续章节
        </button>
        <button onClick={onAddChapter} className="w-full py-2 border-2 border-dashed border-ink-300 text-ink-500 rounded-lg hover:border-ink-500 hover:text-ink-700 transition-colors flex items-center justify-center gap-2 font-medium">
          <span>+</span> 手动添加章节
        </button>
      </div>
    </div>
  );
};

// Helper Sub-component
const ChapterItem = ({ chapter, index, isActive, onSelect, onDelete }: any) => (
  <div
    className={`w-full text-left p-3 rounded-lg transition-colors group relative cursor-pointer ${
      isActive ? 'bg-white shadow-sm border border-paper-200' : 'hover:bg-paper-200 text-ink-600'
    }`}
    onClick={() => onSelect(chapter.id)}
  >
    <div className="flex justify-between items-start mb-1">
      <span className={`text-sm font-medium ${isActive ? 'text-ink-900' : 'text-ink-700'}`}>
        第{index + 1}章
      </span>
      <div className="flex items-center gap-1">
        <span className={`text-[10px] px-1 py-0.5 rounded ${
          chapter.status === ChapterStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
          chapter.status === ChapterStatus.GENERATING ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {chapter.status === ChapterStatus.COMPLETED ? '完成' : 
           chapter.status === ChapterStatus.GENERATING ? '生成' : '草稿'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }}
          className="p-1 text-ink-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
    <div className={`text-xs truncate ${isActive ? 'text-ink-800 font-medium' : 'text-ink-500'}`}>
      {chapter.title}
    </div>
  </div>
);
