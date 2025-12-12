import React, { useState } from 'react';
import { Novel, Character } from '../types';
import { Button } from './Button';

interface MindMapModalProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
  onAiContinue: (instruction: string) => Promise<void>;
  isLoading: boolean;
}

export const MindMapModal: React.FC<MindMapModalProps> = ({ novel, isOpen, onClose, onAiContinue, isLoading }) => {
  const [instruction, setInstruction] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in overflow-hidden">
      <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col animate-scale-up border border-paper-200">
        
        {/* Header */}
        <div className="p-4 border-b border-paper-200 flex justify-between items-center bg-white rounded-t-xl">
          <h2 className="text-xl font-serif font-bold text-ink-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            思维导图 / 故事脉络
          </h2>
          <Button variant="ghost" onClick={onClose} size="sm">关闭</Button>
        </div>

        {/* Mind Map Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-10 bg-paper-100 relative">
          <div className="min-w-max flex gap-12 items-start">
            
            {/* Root Node: Novel Info */}
            <div className="flex flex-col gap-4 sticky left-0 z-10">
              <div className="w-64 bg-ink-900 text-white p-6 rounded-2xl shadow-lg border-2 border-ink-800">
                <h3 className="text-2xl font-serif font-bold mb-2">{novel.title}</h3>
                <div className="text-xs text-ink-300 uppercase tracking-widest mb-4">{novel.genre}</div>
                <p className="text-sm text-ink-200 line-clamp-4">{novel.premise}</p>
              </div>
              
              {/* Character Branch */}
              <div className="w-64 bg-white p-4 rounded-xl shadow-md border-l-4 border-yellow-500">
                <h4 className="font-bold text-ink-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  主要角色
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {novel.characters.map((char, i) => (
                    <div key={i} className="text-sm p-2 bg-paper-50 rounded">
                      <span className="font-bold text-ink-900">{char.name}</span>
                      <span className="text-xs text-ink-500 ml-1">({char.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connecting Line */}
            <div className="w-12 h-1 bg-ink-300 self-start mt-20 rounded-full"></div>

            {/* Chapters Flow */}
            <div className="flex gap-6 items-start">
               {novel.chapters.map((chapter, index) => (
                 <div key={chapter.id} className="group relative flex items-center">
                    <div className="w-64 flex flex-col">
                      {/* Node */}
                      <div className="bg-white p-5 rounded-xl shadow-md border border-paper-300 hover:border-ink-500 hover:shadow-lg transition-all cursor-pointer relative z-10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-ink-400 uppercase">Chapter {index + 1}</span>
                          {chapter.content && <span className="w-2 h-2 rounded-full bg-green-500" title="已生成正文"></span>}
                        </div>
                        <h4 className="font-bold text-lg text-ink-900 mb-2 leading-tight">{chapter.title}</h4>
                        <p className="text-sm text-ink-600 line-clamp-4 h-20">{chapter.outline || "暂无大纲..."}</p>
                      </div>
                      
                      {/* Connector Line to next */}
                      {index < novel.chapters.length - 1 && (
                        <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-ink-300 z-0 transform -translate-y-1/2"></div>
                      )}
                    </div>
                    {/* Visual spacer for layout */}
                    {index < novel.chapters.length - 1 && <div className="w-6"></div>}
                 </div>
               ))}

               {/* AI Add Node */}
               <div className="w-6 h-0.5 bg-ink-300 self-center"></div>
               <div className="w-64 flex-shrink-0 self-start">
                 {!showAiInput ? (
                    <button 
                      onClick={() => setShowAiInput(true)}
                      className="w-full h-48 border-2 border-dashed border-ink-300 rounded-xl flex flex-col items-center justify-center text-ink-500 hover:text-ink-700 hover:border-ink-500 hover:bg-white/50 transition-all gap-2"
                    >
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                      <span className="font-medium">AI 续写下一章</span>
                    </button>
                 ) : (
                   <div className="bg-white p-4 rounded-xl shadow-lg border border-ink-200 animate-scale-up">
                      <h4 className="font-bold text-ink-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI 构思下一章
                      </h4>
                      <textarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="输入剧情走向（可选），留空则由 AI 自由发挥..."
                        className="w-full h-24 p-2 mb-3 bg-paper-50 rounded border border-ink-200 text-sm resize-none focus:ring-1 focus:ring-ink-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowAiInput(false)}
                          className="flex-1"
                        >
                          取消
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => onAiContinue(instruction)}
                          isLoading={isLoading}
                          className="flex-1"
                        >
                          生成
                        </Button>
                      </div>
                   </div>
                 )}
               </div>

            </div>
          </div>
        </div>
        
        <div className="p-3 bg-white border-t border-paper-200 text-xs text-ink-400 text-center">
          提示：拖动区域可查看完整脉络
        </div>
      </div>
    </div>
  );
};