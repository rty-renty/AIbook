import React, { useState } from 'react';
import { Genre, Character } from '../types';
import { Button } from './Button';
import { generateNovelOutline } from '../services/geminiService';

interface SetupWizardProps {
  onComplete: (data: { title: string; genre: Genre; premise: string; characters: Character[]; chapters: any[] }) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>(Genre.XUANHUAN);
  const [premise, setPremise] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title || !premise) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateNovelOutline(title, genre, premise);
      onComplete({
        title,
        genre,
        premise,
        characters: result.characters,
        chapters: result.chapters
      });
    } catch (e) {
      setError("AI生成大纲失败，请稍后重试。可能是API Key问题。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-paper-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-ink-900 mb-2">新建作品</h1>
          <p className="text-ink-500">文枢 AI 辅助创作系统</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">小说标题</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：剑道独尊"
                className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 focus:border-transparent outline-none bg-paper-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">题材类型</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Genre).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      genre === g 
                      ? 'bg-ink-900 text-white border-ink-900' 
                      : 'bg-white text-ink-600 border-ink-200 hover:bg-paper-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">核心创意 / 简介</label>
              <textarea 
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                placeholder="输入你的灵感片段。例如：在一个科技高度发达的赛博朋克世界，主角发现了一本记载着失传古武学的羊皮卷..."
                className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 focus:border-transparent outline-none bg-paper-50 h-32 resize-none"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              onClick={handleGenerate} 
              disabled={!title || !premise} 
              isLoading={isGenerating}
              className="w-full py-3 text-lg"
            >
              {isGenerating ? '正在构建世界观与大纲...' : '生成大纲'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};