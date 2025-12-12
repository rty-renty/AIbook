import React, { useState, useEffect, useRef } from 'react';
import { Chapter, ChapterStatus } from '../types';
import { Button } from './Button';

interface EditorProps {
  chapter: Chapter;
  onUpdate: (updatedChapter: Chapter) => void;
  onGenerate: () => void;
  onBrainstorm: (query: string, selectedText?: string) => void;
  onRefine: () => void;
}

export const Editor: React.FC<EditorProps> = ({ chapter, onUpdate, onGenerate, onBrainstorm, onRefine }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'outline'>('outline');
  const [brainstormQuery, setBrainstormQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const outlineRef = useRef<HTMLTextAreaElement>(null);

  const handleUpdate = (updates: Partial<Chapter>) => {
    onUpdate({ ...chapter, ...updates });
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpdate({ title: e.target.value });
  };

  const handleOutlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdate({ outline: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdate({ content: e.target.value });
  };

  const handleBrainstormClick = () => {
    const ref = activeTab === 'content' ? contentRef : outlineRef;
    let selectedText = "";
    
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      if (start !== end) {
        selectedText = ref.current.value.substring(start, end);
      }
    }

    onBrainstorm(brainstormQuery, selectedText);
    setBrainstormQuery('');
  };

  // Sync tab with status initially
  useEffect(() => {
    if (chapter.status === ChapterStatus.DRAFT && !chapter.content) {
      setActiveTab('outline');
    } else {
      setActiveTab('content');
    }
  }, [chapter.id]);

  return (
    <div className="flex flex-col h-full bg-paper-50 relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-paper-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex-1 mr-4 flex items-center">
           <input 
            type="text" 
            value={chapter.title}
            onChange={handleTitleChange}
            className="text-2xl font-serif font-bold bg-transparent border-none outline-none text-ink-900 placeholder-ink-300 w-full"
            placeholder="章节标题"
          />
          {isSaving ? (
             <span className="text-xs text-ink-400 ml-2 whitespace-nowrap animate-pulse">保存中...</span>
          ) : (
             <span className="text-xs text-green-600 ml-2 whitespace-nowrap">已保存</span>
          )}
        </div>
       
        <div className="flex space-x-2 items-center">
           <div className="flex bg-paper-200 rounded-lg p-1 mr-4">
            <button 
              onClick={() => setActiveTab('outline')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                activeTab === 'outline' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-600 hover:text-ink-800'
              }`}
            >
              大纲
            </button>
            <button 
               onClick={() => setActiveTab('content')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                activeTab === 'content' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-600 hover:text-ink-800'
              }`}
            >
              正文
            </button>
          </div>
          
          {activeTab === 'content' && chapter.content && (
            <button 
              onClick={onRefine}
              className="text-ink-500 hover:text-ink-900 p-2 mr-2 rounded-lg hover:bg-paper-200 transition-colors"
              title="AI 重写 / 润色"
              disabled={chapter.status === ChapterStatus.GENERATING}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}

          <Button 
            onClick={onGenerate}
            isLoading={chapter.status === ChapterStatus.GENERATING}
            disabled={chapter.status === ChapterStatus.GENERATING}
          >
            {chapter.status === ChapterStatus.GENERATING ? 'AI 撰写中...' : (chapter.content ? '重新生成' : 'AI 生成正文')}
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* Main Writing Area */}
        <div className="flex-1 h-full overflow-y-auto relative no-scrollbar">
          <div className="max-w-3xl mx-auto px-8 py-8 min-h-full">
            {activeTab === 'outline' ? (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-ink-500 uppercase tracking-wide mb-2">本章大纲 / 细纲</label>
                <div className="mb-4 text-xs text-ink-400 bg-paper-100 p-2 rounded">
                  提示：在此输入本章发生的具体情节，越详细 AI 生成的逻辑越紧密。您可以手动插入关键对白、物品描述等细节。
                </div>
                <textarea
                  ref={outlineRef}
                  value={chapter.outline}
                  onChange={handleOutlineChange}
                  className="w-full h-[60vh] p-6 bg-white rounded-xl shadow-sm border border-paper-200 text-ink-800 text-lg leading-relaxed focus:ring-2 focus:ring-ink-200 outline-none resize-none font-sans"
                  placeholder="例如：主角在拍卖会遇到了宿敌，两人争夺最后一件压轴宝物。主角因为囊中羞涩差点放弃，此时..."
                />
              </div>
            ) : (
              <div className="animate-fade-in h-full flex flex-col">
                <textarea
                  ref={contentRef}
                  value={chapter.content}
                  onChange={handleContentChange}
                  className="w-full flex-1 bg-transparent border-none outline-none text-ink-900 text-xl leading-loose font-serif resize-none placeholder-ink-300"
                  placeholder="正文内容..."
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Creative Assistant (Desktop/Tablet only for now) */}
        <div className="w-80 border-l border-paper-200 bg-white p-4 hidden lg:flex flex-col">
          <div className="mb-4">
            <h3 className="font-serif font-bold text-ink-800 text-lg">灵感助手</h3>
            <p className="text-xs text-ink-500">卡文了吗？问问 AI 吧</p>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4">
             {/* Suggestion slots could go here */}
             <div className="bg-paper-100 p-3 rounded-lg text-sm text-ink-700 italic mb-2">
               提示：选中左侧文字后提问，AI 将针对选段提供优化建议。
             </div>
             {chapter.status === ChapterStatus.GENERATING && (
               <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 animate-pulse">
                 AI 正在根据大纲创作中...
               </div>
             )}
          </div>

          <div className="mt-auto">
            <textarea
              value={brainstormQuery}
              onChange={(e) => setBrainstormQuery(e.target.value)}
              className="w-full p-3 bg-paper-50 rounded-lg border border-paper-200 text-sm focus:ring-1 focus:ring-ink-500 outline-none resize-none mb-2"
              placeholder="例如：这一段如何写得更惊险？"
              rows={3}
            />
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full"
              onClick={handleBrainstormClick}
              disabled={!brainstormQuery.trim()}
            >
              获取灵感
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};