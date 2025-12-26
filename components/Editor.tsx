
import React, { useState, useEffect, useRef } from 'react';
import { Chapter, ChapterStatus, Novel } from '../types';
import { Button } from './Button';

interface AssistantMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface EditorProps {
  novel: Novel;
  chapter: Chapter;
  onUpdate: (updatedChapter: Chapter) => void;
  onGenerate: () => void;
  onBrainstorm: (query: string, selectedText?: string) => Promise<string>;
  onRefine: () => void;
}

export const Editor: React.FC<EditorProps> = ({ novel, chapter, onUpdate, onGenerate, onBrainstorm, onRefine }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'outline'>('outline');
  const [brainstormQuery, setBrainstormQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const outlineRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, isAssistantLoading]);

  const handleUpdate = (updates: Partial<Chapter>) => {
    onUpdate({ ...chapter, ...updates });
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleBrainstormSubmit = async () => {
    if (!brainstormQuery.trim() || isAssistantLoading) return;
    
    const ref = activeTab === 'content' ? contentRef : outlineRef;
    let selectedText = "";
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      if (start !== end) {
        selectedText = ref.current.value.substring(start, end);
      }
    }

    const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: brainstormQuery };
    setAssistantMessages(prev => [...prev, userMsg]);
    setBrainstormQuery('');
    setIsAssistantLoading(true);

    try {
      const result = await onBrainstorm(brainstormQuery, selectedText);
      const aiMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: result };
      setAssistantMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: "灵感捕捉失败，请检查网络。" };
      setAssistantMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-paper-50 relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 border-r border-paper-200">
        <div className="px-8 py-5 border-b border-paper-200 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
          <div className="flex-1 mr-6 flex items-center min-w-0">
             <input 
              type="text" 
              value={chapter.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="text-2xl font-serif font-bold bg-transparent border-none outline-none text-ink-900 placeholder-ink-200 w-full truncate"
              placeholder="请输入章节标题..."
            />
            <div className="flex items-center ml-3">
              <div className={`w-2 h-2 rounded-full mr-2 ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] text-ink-400 uppercase tracking-tighter whitespace-nowrap">{isSaving ? '正在同步云端' : '云端已同步'}</span>
            </div>
          </div>
         
          <div className="flex space-x-3 items-center flex-shrink-0">
             <div className="flex bg-paper-200 rounded-xl p-1 shadow-inner">
              <button 
                onClick={() => setActiveTab('outline')}
                className={`px-4 py-1.5 text-xs rounded-lg transition-all font-bold ${
                  activeTab === 'outline' ? 'bg-white shadow-md text-ink-900' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                剧情细纲
              </button>
              <button 
                 onClick={() => setActiveTab('content')}
                className={`px-4 py-1.5 text-xs rounded-lg transition-all font-bold ${
                  activeTab === 'content' ? 'bg-white shadow-md text-ink-900' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                正文创作
              </button>
            </div>
            
            {activeTab === 'content' && chapter.content && (
              <button 
                onClick={onRefine}
                className="text-ink-400 hover:text-ink-900 p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-paper-300"
                title="AI 润色 / 技术校验"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}

            <Button 
              size="md"
              onClick={onGenerate}
              isLoading={chapter.status === ChapterStatus.GENERATING}
              className="rounded-xl shadow-lg font-serif font-bold px-6"
            >
              {chapter.status === ChapterStatus.GENERATING ? '文枢执笔中...' : (chapter.content ? '重新精修' : '生成初稿')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative no-scrollbar bg-paper-50/30">
          <div className="max-w-4xl mx-auto px-10 py-12 min-h-full">
            {activeTab === 'outline' ? (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-ink-900 pl-4 py-1">
                  <label className="text-xs font-bold text-ink-900 uppercase tracking-[0.2em]">剧情演化逻辑</label>
                  <span className="text-[10px] text-ink-400 bg-white px-2 py-0.5 rounded-full border border-paper-200">大纲内容将指导 AI 生成正文的走向</span>
                </div>
                <textarea
                  ref={outlineRef}
                  value={chapter.outline}
                  onChange={(e) => handleUpdate({ outline: e.target.value })}
                  className="w-full min-h-[65vh] p-10 bg-white rounded-3xl shadow-xl border-none text-ink-800 text-xl leading-relaxed focus:ring-2 focus:ring-ink-100 outline-none resize-none font-serif placeholder-ink-100"
                  placeholder="在此规划本章发生的具体情节、核心冲突或技术细节..."
                />
              </div>
            ) : (
              <div className="animate-fade-in h-full relative">
                 <div className="absolute top-0 left-[-60px] flex flex-col gap-4 opacity-20 hover:opacity-100 transition-opacity">
                   <div className="w-10 h-10 rounded-full bg-paper-300 flex items-center justify-center font-serif text-ink-900">引</div>
                   <div className="w-10 h-10 rounded-full bg-paper-300 flex items-center justify-center font-serif text-ink-900">承</div>
                   <div className="w-10 h-10 rounded-full bg-paper-300 flex items-center justify-center font-serif text-ink-900">转</div>
                   <div className="w-10 h-10 rounded-full bg-paper-300 flex items-center justify-center font-serif text-ink-900">合</div>
                 </div>
                <textarea
                  ref={contentRef}
                  value={chapter.content}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  className="w-full h-full min-h-[80vh] bg-transparent border-none outline-none text-ink-900 text-2xl leading-[2.2] font-serif resize-none placeholder-ink-100 selection:bg-ink-100"
                  placeholder="等待文枢落笔，尽展笔下乾坤..."
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.08)] z-20 border-l border-paper-200">
        <div className="p-6 border-b border-paper-100 bg-paper-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-ink-900"></div>
            <h3 className="font-serif font-bold text-ink-900 text-lg">文枢写作助手</h3>
          </div>
          <button 
            onClick={() => setAssistantMessages([])}
            className="text-[10px] text-ink-400 hover:text-ink-900 uppercase font-bold tracking-widest transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {assistantMessages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-paper-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-sm text-ink-900 font-serif font-bold px-8 leading-relaxed">
                “凡事预则立，不预则废。”
              </p>
              <p className="text-xs text-ink-400 px-10 leading-relaxed">
                您可以向我提问创作思路，或对硬核细节进行逻辑查证。
              </p>
            </div>
          )}
          {assistantMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className={`max-w-[95%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-ink-950 text-paper-50 rounded-tr-none' 
                : 'bg-paper-100 text-ink-800 rounded-tl-none border border-paper-200'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isAssistantLoading && (
            <div className="flex items-center gap-3 px-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-ink-900 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-ink-900 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-ink-900 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] text-ink-400 font-serif italic">正在检索硬核数据库并推演逻辑...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-paper-100 bg-white">
          <div className="relative">
            <textarea
              value={brainstormQuery}
              onChange={(e) => setBrainstormQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleBrainstormSubmit();
                }
              }}
              className="w-full p-5 bg-paper-50 rounded-2xl border border-paper-100 text-sm focus:ring-2 focus:ring-ink-900 focus:bg-white outline-none transition-all resize-none mb-4 shadow-inner min-h-[120px] placeholder-ink-100"
              placeholder="例如：这段代码逻辑是否合理？或者：如何自然地引入杠杆交易的风险说明？"
            />
            <Button 
              size="md" 
              className="w-full py-4 font-serif font-bold shadow-xl rounded-2xl"
              onClick={handleBrainstormSubmit}
              disabled={!brainstormQuery.trim() || isAssistantLoading}
            >
              请求文枢启发
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-ink-300">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            选中文段提问，效果更佳
          </div>
        </div>
      </div>
    </div>
  );
};
