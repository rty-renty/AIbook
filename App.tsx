
import { useState, useEffect, useRef } from 'react';
import { Novel, Chapter, ChapterStatus, Genre, Character } from './types';
import { SetupWizard } from './components/SetupWizard';
import { ChapterList } from './components/ChapterList';
import { Editor } from './components/Editor';
import { NovelSettings } from './components/NovelSettings';
import { ExportModal } from './components/ExportModal';
import { RefineModal } from './components/RefineModal';
import { BatchCreateModal } from './components/BatchCreateModal';
import { Library } from './components/Library';
import { BatchGenerateContentModal } from './components/BatchGenerateContentModal';
import { FullOutlineModal } from './components/FullOutlineModal';
import { MindMapModal } from './components/MindMapModal';
import { 
  refineChapterContent, 
  brainstormIdea, 
  generateBatchOutlines, 
  generateSingleChapterOutline,
  generateNovelOutline 
} from './services/geminiService';

type ViewState = 'library' | 'setup' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('library');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  
  const novelsRef = useRef<Novel[]>([]);
  useEffect(() => {
    novelsRef.current = novels;
  }, [novels]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullOutlineOpen, setIsFullOutlineOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  
  const [isBatchOutlineOpen, setIsBatchOutlineOpen] = useState(false);
  const [batchOutlineProgress, setBatchOutlineProgress] = useState({ current: 0, total: 0, percent: 0, status: '' });
  const [isBatchOutlineLoading, setIsBatchOutlineLoading] = useState(false);
  
  const [isBatchContentOpen, setIsBatchContentOpen] = useState(false);
  const [isBatchContentLoading, setIsBatchContentLoading] = useState(false);
  const [isAiSingleOutlineLoading, setIsAiSingleOutlineLoading] = useState(false);

  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem('wenshu_library');
      if (savedLibrary) setNovels(JSON.parse(savedLibrary));
    } catch (e) { console.error("Failed to load library", e); }
  }, []);

  useEffect(() => {
    if (novels.length > 0) {
      localStorage.setItem('wenshu_library', JSON.stringify(novels));
    }
  }, [novels]);

  const currentNovel = novels.find(n => n.id === currentNovelId) || null;
  const currentChapter = currentNovel?.chapters.find(c => c.id === currentChapterId) || currentNovel?.chapters[0] || null;

  const handleUpdateNovel = (updatedNovel: Novel) => {
    setNovels(prev => prev.map(n => n.id === updatedNovel.id ? updatedNovel : n));
  };

  const handleSelectNovel = (id: string) => {
    setCurrentNovelId(id);
    const novel = novelsRef.current.find(n => n.id === id);
    if (novel && novel.chapters.length > 0) {
      setCurrentChapterId(novel.chapters[0].id);
    }
    setView('editor');
  };

  const runBatchOutlineGeneration = async (
    novelId: string, 
    totalCount: number, 
    direction: string, 
    insertAfterId?: string, 
    targetCoverage?: number
  ) => {
    setIsBatchOutlineLoading(true);
    setBatchOutlineProgress({ current: 0, total: totalCount, percent: 0, status: '正在构思剧情脉络...' });

    const CHUNK_SIZE = 15;
    let lastInsertedId = insertAfterId;
    let totalGeneratedSoFar = 0;

    try {
      while (totalGeneratedSoFar < totalCount) {
        const batchSize = Math.min(CHUNK_SIZE, totalCount - totalGeneratedSoFar);
        const latestNovel = novelsRef.current.find(n => n.id === novelId);
        if (!latestNovel) break;
        
        setBatchOutlineProgress(p => ({ ...p, status: `正在规划第 ${totalGeneratedSoFar + 1} - ${totalGeneratedSoFar + batchSize} 章情节...` }));

        const newOutlines = await generateBatchOutlines(
          latestNovel, 
          batchSize, 
          direction, 
          lastInsertedId,
          targetCoverage || 100
        );
        
        if (!newOutlines || newOutlines.length === 0) break;

        const newChapters: Chapter[] = newOutlines.map((out, idx) => ({
          id: `chap-${Date.now()}-${totalGeneratedSoFar + idx}`,
          title: out.title,
          outline: out.outline,
          content: '',
          status: ChapterStatus.DRAFT
        }));

        setNovels(prev => prev.map(n => {
          if (n.id === novelId) {
            const updatedChapters = [...n.chapters];
            let insIdx = updatedChapters.length;
            if (lastInsertedId) {
              const prevIdx = updatedChapters.findIndex(c => c.id === lastInsertedId);
              if (prevIdx !== -1) insIdx = prevIdx + 1;
            }
            updatedChapters.splice(insIdx, 0, ...newChapters);
            
            const startCoverage = latestNovel.currentCoverage || 0;
            const endCoverage = targetCoverage || 100;
            const newProgress = startCoverage + ((totalGeneratedSoFar + batchSize) / totalCount) * (endCoverage - startCoverage);
            
            return { ...n, chapters: updatedChapters, currentCoverage: Math.min(endCoverage, newProgress) };
          }
          return n;
        }));

        lastInsertedId = newChapters[newChapters.length - 1].id;
        totalGeneratedSoFar += newChapters.length;
        
        setBatchOutlineProgress({
          current: totalGeneratedSoFar,
          total: totalCount,
          percent: (totalGeneratedSoFar / totalCount) * 100,
          status: '逻辑校验中...'
        });

        await new Promise(r => setTimeout(r, 800));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBatchOutlineLoading(false);
      setIsBatchOutlineOpen(false);
    }
  };

  const handleSetupComplete = async (data: { 
    title: string; 
    genre: Genre; 
    premise: string; 
    characters: Character[]; 
    chapters: any[]; 
    coverage: number;
    totalChaptersRequested: number; 
  }) => {
    const novelId = `novel-${Date.now()}`;
    const initialChapters: Chapter[] = data.chapters.map((c, i) => ({
      id: `chap-${Date.now()}-${i}`,
      title: c.title,
      outline: c.outline,
      content: '',
      status: ChapterStatus.DRAFT
    }));
    
    const newNovel: Novel = { 
      id: novelId, 
      title: data.title, 
      premise: data.premise, 
      genre: data.genre, 
      styleKeywords: [], 
      characters: data.characters, 
      chapters: initialChapters, 
      createdAt: Date.now(),
      currentCoverage: (initialChapters.length / data.totalChaptersRequested) * data.coverage
    };
    
    setNovels(prev => [...prev, newNovel]);
    setCurrentNovelId(novelId);
    if (initialChapters.length > 0) setCurrentChapterId(initialChapters[0].id);
    setView('editor');

    const remaining = data.totalChaptersRequested - initialChapters.length;
    if (remaining > 0) {
      setIsBatchOutlineOpen(true);
      await runBatchOutlineGeneration(
        novelId, 
        remaining, 
        "顺接前文初始设定，开启精彩的故事旅程。", 
        initialChapters[initialChapters.length - 1].id, 
        data.coverage
      );
    }
  };

  const handleGenerateContent = async (customId?: string) => {
    const novelId = currentNovelId;
    const chapId = customId || currentChapterId;
    if (!novelId || !chapId) return;

    const novel = novelsRef.current.find(n => n.id === novelId);
    const chapter = novel?.chapters.find(c => c.id === chapId);
    if (!chapter?.outline) return;
    
    setNovels(prev => prev.map(n => n.id === novelId ? { 
      ...n, 
      chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.GENERATING, content: '' } : c) 
    } : n));
    
    try {
      let accumulatedContent = "";
      await refineChapterContent(novel!, chapId, "创作生动的正文，严禁废话。", (chunk) => {
        accumulatedContent += chunk;
        setNovels(prev => prev.map(n => n.id === novelId ? { 
          ...n, 
          chapters: n.chapters.map(c => c.id === chapId ? { ...c, content: accumulatedContent } : c) 
        } : n));
      });
      
      setNovels(prev => prev.map(n => n.id === novelId ? { 
        ...n, 
        chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.COMPLETED } : c) 
      } : n));
      
      novelsRef.current = novelsRef.current.map(n => n.id === novelId ? { 
        ...n, 
        chapters: n.chapters.map(c => c.id === chapId ? { ...c, content: accumulatedContent, status: ChapterStatus.COMPLETED } : c) 
      } : n);

    } catch (e) { 
      console.error(e); 
      setNovels(prev => prev.map(n => n.id === novelId ? { 
        ...n, 
        chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.DRAFT } : c) 
      } : n));
    } 
  };

  const handleBatchContent = async (ids: string[]) => {
    setIsBatchContentLoading(true);
    for (const id of ids) {
      await handleGenerateContent(id);
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsBatchContentLoading(false);
    setIsBatchContentOpen(false);
  };

  if (view === 'setup') return <SetupWizard onComplete={handleSetupComplete} />;
  if (view === 'library') return <Library novels={novels} onCreateNovel={() => setView('setup')} onSelectNovel={handleSelectNovel} onDeleteNovel={(id) => setNovels(prev => prev.filter(n => n.id !== id))} />;
  if (!currentNovel || !currentChapter) return <div className="p-8 text-center text-ink-500">正在开启书卷...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50 text-ink-900 font-sans">
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex h-full">
           <div className="w-64 flex-shrink-0">
             <ChapterList 
                chapters={currentNovel.chapters} 
                currentChapterId={currentChapterId} 
                onSelectChapter={setCurrentChapterId}
                onAddChapter={() => {
                  const newId = `chap-${Date.now()}`;
                  const idx = currentNovel.chapters.findIndex(c => c.id === currentChapterId);
                  const newChapters = [...currentNovel.chapters];
                  newChapters.splice(idx + 1, 0, { id: newId, title: '新章节', outline: '', content: '', status: ChapterStatus.DRAFT });
                  handleUpdateNovel({ ...currentNovel, chapters: newChapters });
                  setCurrentChapterId(newId);
                }}
                onBatchAddChapters={() => setIsBatchOutlineOpen(true)}
                onBatchGenerateContent={() => setIsBatchContentOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenFullOutline={() => setIsFullOutlineOpen(true)}
                onOpenMindMap={() => setIsMindMapOpen(true)}
                onExport={() => setIsExportOpen(true)}
                onBack={() => setView('library')}
                onDeleteChapter={(id) => {
                  if (currentNovel.chapters.length <= 1) { alert("至少保留一个章节。"); return; }
                  if (!window.confirm("确定要删除此章节吗？")) return;
                  const newChapters = currentNovel.chapters.filter(c => c.id !== id);
                  if (currentChapterId === id) setCurrentChapterId(newChapters[0].id);
                  handleUpdateNovel({ ...currentNovel, chapters: newChapters });
                }}
              />
           </div>
           <div className="flex-1 min-w-0">
              <Editor 
                novel={currentNovel}
                chapter={currentChapter} 
                onUpdate={(uc) => setNovels(prev => prev.map(n => n.id === currentNovel.id ? { ...n, chapters: n.chapters.map(c => c.id === uc.id ? uc : c) } : n))} 
                onGenerate={() => handleGenerateContent()} 
                onBrainstorm={(q, s) => brainstormIdea(currentNovel, currentChapter, q, s)} 
                onRefine={() => setIsRefineOpen(true)} 
              />
           </div>
        </div>
      </div>

      <BatchCreateModal
        novel={currentNovel}
        currentChapterId={currentChapterId}
        isOpen={isBatchOutlineOpen}
        onClose={() => !isBatchOutlineLoading && setIsBatchOutlineOpen(false)}
        onConfirm={(c, d, i, t) => runBatchOutlineGeneration(currentNovel.id, c, d, i, t)}
        isLoading={isBatchOutlineLoading}
        progress={batchOutlineProgress.percent}
        totalChapters={batchOutlineProgress.total}
        currentGenerated={batchOutlineProgress.current}
        statusText={batchOutlineProgress.status}
      />

      <NovelSettings novel={currentNovel} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onUpdate={handleUpdateNovel} />
      <FullOutlineModal novel={currentNovel} isOpen={isFullOutlineOpen} onClose={() => setIsFullOutlineOpen(false)} onUpdate={handleUpdateNovel} onAiContinue={async (i) => { setIsAiSingleOutlineLoading(true); try { const r = await generateSingleChapterOutline(currentNovel, i); const nc = { id: `chap-${Date.now()}`, title: r.title, outline: r.outline, content: '', status: ChapterStatus.DRAFT }; handleUpdateNovel({ ...currentNovel, chapters: [...currentNovel.chapters, nc] }); return nc; } finally { setIsAiSingleOutlineLoading(false); } }} isAiLoading={isAiSingleOutlineLoading} />
      <MindMapModal novel={currentNovel} isOpen={isMindMapOpen} onClose={() => setIsMindMapOpen(false)} onAiContinue={async (i) => { await generateSingleChapterOutline(currentNovel, i); }} isLoading={isAiSingleOutlineLoading} />
      <ExportModal novel={currentNovel} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <RefineModal isOpen={isRefineOpen} onClose={() => setIsRefineOpen(false)} onConfirm={(inst) => handleGenerateContent()} />
      <BatchGenerateContentModal novel={currentNovel} isOpen={isBatchContentOpen} onClose={() => setIsBatchContentOpen(false)} onConfirm={handleBatchContent} isLoading={isBatchContentLoading} />
    </div>
  );
};

export default App;
