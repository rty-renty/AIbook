import React from 'react';
import { Novel, Genre } from '../types';
import { Button } from './Button';

interface LibraryProps {
  novels: Novel[];
  onSelectNovel: (id: string) => void;
  onCreateNovel: () => void;
  onDeleteNovel: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ novels, onSelectNovel, onCreateNovel, onDeleteNovel }) => {
  return (
    <div className="min-h-screen bg-paper-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-serif font-bold text-ink-900 mb-2">文枢书库</h1>
            <p className="text-ink-500">您的私人 AI 创作工作室</p>
          </div>
          <Button onClick={onCreateNovel} size="lg" className="shadow-lg">
            <span className="mr-2 text-xl">+</span> 创建新书
          </Button>
        </div>

        {novels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border-2 border-dashed border-paper-300 text-ink-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-lg font-medium">书库空空如也</p>
            <p className="text-sm mt-2">点击右上方按钮开启您的第一部作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <div 
                key={novel.id} 
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl border border-paper-200 hover:border-ink-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                onClick={() => onSelectNovel(novel.id)}
              >
                {/* Book Spine/Cover Effect */}
                <div className="h-3 bg-ink-900 w-full"></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-2 py-1 text-xs font-bold text-ink-600 bg-paper-200 rounded uppercase tracking-wide">
                      {novel.genre}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteNovel(novel.id); }}
                      className="text-paper-400 hover:text-red-500 transition-colors p-1"
                      title="删除作品"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-serif font-bold text-ink-900 mb-2 line-clamp-1 group-hover:text-ink-700 transition-colors">
                    {novel.title}
                  </h3>
                  
                  <p className="text-sm text-ink-500 line-clamp-3 mb-4 flex-1">
                    {novel.premise}
                  </p>
                  
                  <div className="pt-4 border-t border-paper-100 flex justify-between items-center text-xs text-ink-400 font-mono">
                    <span>{novel.chapters.length} 章</span>
                    <span>最后编辑: {new Date(novel.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};