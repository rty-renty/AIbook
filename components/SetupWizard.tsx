
import React, { useState } from 'react';
import { Genre, Character } from '../types';
import { Button } from './Button';
import { generateNovelOutline } from '../services/geminiService';

interface SetupWizardProps {
  onComplete: (data: { 
    title: string; 
    genre: Genre; 
    premise: string; 
    characters: Character[]; 
    chapters: any[]; 
    coverage: number;
    totalChaptersRequested: number; 
  }) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>(Genre.XUANHUAN);
  const [premise, setPremise] = useState('');
  const [chapterCount, setChapterCount] = useState(20);
  const [coverage, setCoverage] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title || !premise) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateNovelOutline(title, genre, premise, chapterCount, coverage);
      onComplete({
        title,
        genre,
        premise,
        characters: result.characters,
        chapters: result.chapters,
        coverage: coverage,
        totalChaptersRequested: chapterCount
      });
    } catch (e) {
      setError("AI生成大纲失败，请稍后重试。可能是API Key超限或网络问题。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 border border-paper-200">
        <div className="mb-10 text-center">
          <div className="inline-block p-3 bg-ink-900 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h1 className="text-4xl font-serif font-bold text-ink-900 mb-2">构思新篇章</h1>
          <p className="text-ink-500 font-serif italic">“笔下有乾坤，心中存丘壑”</p>
        </div>

        <div className="space-y-8 animate-fade-in">
          <div className="group">
            <label className="block text-sm font-bold text-ink-700 mb-2 uppercase tracking-widest">作品标题</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：从零开始的量化交易员"
              className="w-full px-5 py-3 rounded-xl border border-ink-200 focus:ring-2 focus:ring-ink-900 outline-none bg-paper-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ink-700 mb-2 uppercase tracking-widest">创作题材</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.values(Genre).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-2.5 text-xs rounded-xl border-2 transition-all duration-300 font-medium ${
                    genre === g 
                    ? 'bg-ink-900 text-white border-ink-900 shadow-md' 
                    : 'bg-white text-ink-500 border-paper-200 hover:border-ink-300 hover:bg-paper-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {genre === Genre.HARDCORE_KNOWLEDGE && (
              <p className="text-[10px] text-paper-700 mt-2 bg-paper-100 p-2 rounded-lg italic border-l-4 border-paper-500">
                ✨ 您选择了硬核题材。文枢将启动专家数据库，在情节中融入真实的行业知识与严谨的技术细节。
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-ink-700 mb-2 uppercase tracking-widest">灵感火花 / 核心冲突</label>
            <textarea 
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="描述主角的身份、核心目标，以及他们将面临的第一场重大挑战..."
              className="w-full px-5 py-3 rounded-xl border border-ink-200 focus:ring-2 focus:ring-ink-900 outline-none bg-paper-50 h-32 resize-none transition-all leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-4 bg-paper-50 rounded-2xl border border-paper-200">
              <label className="block text-xs font-bold text-ink-500 mb-3 uppercase">预计全书规模</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="1"
                  max="1000"
                  value={chapterCount}
                  onChange={(e) => setChapterCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-xl font-bold text-ink-900 outline-none border-b-2 border-ink-200 focus:border-ink-900"
                />
                <span className="text-sm font-bold text-ink-400">章</span>
              </div>
            </div>
            <div className="p-4 bg-paper-50 rounded-2xl border border-paper-200">
              <label className="block text-xs font-bold text-ink-500 mb-3 uppercase">初始规划深度 ({coverage}%)</label>
              <input 
                type="range" 
                min="5" 
                max="100" 
                step="5"
                value={coverage}
                onChange={(e) => setCoverage(parseInt(e.target.value))}
                className="w-full accent-ink-900"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 animate-shake">{error}</div>}

          <Button onClick={handleGenerate} disabled={!title || !premise} isLoading={isGenerating} className="w-full py-5 rounded-2xl text-xl font-serif font-bold shadow-xl active:scale-95 transition-transform">
            {isGenerating ? '正在推演世界观...' : '泼墨成章'}
          </Button>
        </div>
      </div>
    </div>
  );
};
