import React, { useState, useEffect } from 'react';
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
import { generateChapterContent, refineChapterContent, brainstormIdea, generateBatchOutlines, generateSingleChapterOutline } from './services/geminiService';

type ViewState = 'library' | 'setup' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('library');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullOutlineOpen, setIsFullOutlineOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [isRefineLoading, setIsRefineLoading] = useState(false);
  const [isBatchOutlineOpen, setIsBatchOutlineOpen] = useState(false);
  const [isBatchOutlineLoading, setIsBatchOutlineLoading] = useState(false);
  const [isBatchContentOpen, setIsBatchContentOpen] = useState(false);
  const [isBatchContentLoading, setIsBatchContentLoading] = useState(false);
  const [isAiSingleOutlineLoading, setIsAiSingleOutlineLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem('wenshu_library');
      if (savedLibrary) {
        setNovels(JSON.parse(savedLibrary));
      }
    } catch (e) {
      console.error("Failed to load library", e);
    }
  }, []);

  // Save Library on change
  useEffect(() => {
    localStorage.setItem('wenshu_library', JSON.stringify(novels));
  }, [novels]);

  // Derived state
  const currentNovel = novels.find(n => n.id === currentNovelId) || null;
  const currentChapter = currentNovel?.chapters.find(c => c.id === currentChapterId) || currentNovel?.chapters[0] || null;

  // --- Actions ---

  const handleCreateNovel = () => {
    setView('setup');
  };

  const handleSetupComplete = (data: { 
    title: string; 
    genre: Genre; 
    premise: string; 
    characters: Character[];
    chapters: any[];
  }) => {
    const newChapters: Chapter[] = data.chapters.map((c, i) => ({
      id: `chap-${Date.now()}-${i}`,
      title: c.title,
      outline: c.outline,
      content: '',
      status: ChapterStatus.DRAFT
    }));

    const newNovel: Novel = {
      id: `novel-${Date.now()}`,
      title: data.title,
      premise: data.premise,
      genre: data.genre,
      styleKeywords: [],
      characters: data.characters,
      chapters: newChapters,
      createdAt: Date.now()
    };

    setNovels(prev => [...prev, newNovel]);
    setCurrentNovelId(newNovel.id);
    if (newChapters.length > 0) {
      setCurrentChapterId(newChapters[0].id);
    }
    setView('editor');
  };

  const handleDeleteNovel = (id: string) => {
    if (window.confirm("确定要删除这部作品吗？此操作不可恢复。")) {
      setNovels(prev => prev.filter(n => n.id !== id));
      if (currentNovelId === id) {
        setCurrentNovelId(null);
        setView('library');
      }
    }
  };

  const handleSelectNovel = (id: string) => {
    setCurrentNovelId(id);
    const novel = novels.find(n => n.id === id);
    if (novel && novel.chapters.length > 0) {
      setCurrentChapterId(novel.chapters[0].id);
    }
    setView('editor');
  };

  const handleUpdateNovel = (updatedNovel: Novel) => {
    setNovels(prev => prev.map(n => n.id === updatedNovel.id ? updatedNovel : n));
  };

  const handleUpdateChapter = (updatedChapter: Chapter) => {
    if (!currentNovelId) return;
    setNovels(prev => prev.map(n => {
      if (n.id === currentNovelId) {
        return {
          ...n,
          chapters: n.chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c)
        };
      }
      return n;
    }));
  };

  const handleAddChapter = () => {
    if (!currentNovel) return;
    const newId = `chap-${Date.now()}`;
    const newChapter: Chapter = {
      id: newId,
      title: `新章节`,
      outline: '',
      content: '',
      status: ChapterStatus.DRAFT
    };

    // Find insertion index
    let insertIndex = currentNovel.chapters.length;
    if (currentChapterId) {
      const idx = currentNovel.chapters.findIndex(c => c.id === currentChapterId);
      if (idx !== -1) insertIndex = idx + 1;
    }

    const newChapters = [...currentNovel.chapters];
    newChapters.splice(insertIndex, 0, newChapter);
    
    handleUpdateNovel({
      ...currentNovel,
      chapters: newChapters
    });
    setCurrentChapterId(newId);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!currentNovel) return;
    if (currentNovel.chapters.length <= 1) {
      alert("至少保留一个章节。");
      return;
    }
    if (!window.confirm("确定要删除此章节吗？")) return;

    const newChapters = currentNovel.chapters.filter(c => c.id !== chapterId);
    
    // If we deleted the current chapter, switch to another one
    if (currentChapterId === chapterId) {
       // Try to find the previous one, or next one
       const index = currentNovel.chapters.findIndex(c => c.id === chapterId);
       if (index > 0) {
         setCurrentChapterId(newChapters[index - 1].id);
       } else {
         setCurrentChapterId(newChapters[0].id);
       }
    }

    handleUpdateNovel({
      ...currentNovel,
      chapters: newChapters
    });
  };

  // --- AI Operations ---

  const handleBatchCreateOutlines = async (count: number, direction: string, insertAfterId?: string) => {
    if (!currentNovel) return;
    setIsBatchOutlineLoading(true);
    try {
      const newOutlines = await generateBatchOutlines(currentNovel, count, direction, insertAfterId);
      
      const newGeneratedChapters: Chapter[] = newOutlines.map((c, i) => ({
        id: `chap-${Date.now()}-${i}`,
        title: c.title,
        outline: c.outline,
        content: '',
        status: ChapterStatus.DRAFT
      }));

      // Find insertion index
      let insertIndex = currentNovel.chapters.length;
      if (insertAfterId) {
        const idx = currentNovel.chapters.findIndex(c => c.id === insertAfterId);
        if (idx !== -1) insertIndex = idx + 1;
      }

      const updatedChapters = [...currentNovel.chapters];
      updatedChapters.splice(insertIndex, 0, ...newGeneratedChapters);

      handleUpdateNovel({
        ...currentNovel,
        chapters: updatedChapters
      });
      setIsBatchOutlineOpen(false);
    } catch (error) {
      alert("生成大纲失败，请重试");
    } finally {
      setIsBatchOutlineLoading(false);
    }
  };

  const handleRefineContent = async (instruction: string) => {
    if (!currentNovel || !currentChapterId) return;
    setIsRefineLoading(true);

    const chapterIndex = currentNovel.chapters.findIndex(c => c.id === currentChapterId);
    if (chapterIndex === -1) return;

    // Set status to generating
    let updatedChapters = [...currentNovel.chapters];
    updatedChapters[chapterIndex] = { ...updatedChapters[chapterIndex], status: ChapterStatus.GENERATING, content: '' };
    handleUpdateNovel({ ...currentNovel, chapters: updatedChapters });
    
    setIsRefineOpen(false);

    try {
      await refineChapterContent(
        currentNovel, 
        currentChapterId,
        instruction,
        (chunk) => {
          setNovels(prevNovels => prevNovels.map(n => {
            if (n.id === currentNovel.id) {
               const chaps = [...n.chapters];
               const idx = chaps.findIndex(c => c.id === currentChapterId);
               if (idx !== -1) {
                 chaps[idx] = { ...chaps[idx], content: chaps[idx].content + chunk };
               }
               return { ...n, chapters: chaps };
            }
            return n;
          }));
        }
      );
      
      // Mark complete
      setNovels(prevNovels => prevNovels.map(n => {
        if (n.id === currentNovel.id) {
           const chaps = [...n.chapters];
           const idx = chaps.findIndex(c => c.id === currentChapterId);
           if (idx !== -1) {
             chaps[idx] = { ...chaps[idx], status: ChapterStatus.COMPLETED };
           }
           return { ...n, chapters: chaps };
        }
        return n;
      }));
    } catch (error) {
      console.error(error);
      alert("生成失败");
      // Revert status
      setNovels(prevNovels => prevNovels.map(n => {
        if (n.id === currentNovel.id) {
           const chaps = [...n.chapters];
           const idx = chaps.findIndex(c => c.id === currentChapterId);
           if (idx !== -1) {
             chaps[idx] = { ...chaps[idx], status: ChapterStatus.DRAFT };
           }
           return { ...n, chapters: chaps };
        }
        return n;
      }));
    } finally {
      setIsRefineLoading(false);
    }
  };

  const handleGenerateContent = () => {
    if (!currentNovel || !currentChapterId) return;
    const chapter = currentNovel.chapters.find(c => c.id === currentChapterId);
    if (!chapter?.outline) {
      alert("请先填写大纲");
      return;
    }
    handleRefineContent("Strictly follow the outline to write/rewrite the full chapter content.");
  };

  const handleBatchGenerateContent = async (chapterIds: string[]) => {
    if (!currentNovel) return;
    setIsBatchContentLoading(true);

    setIsBatchContentOpen(false);

    for (const chapId of chapterIds) {
      setCurrentChapterId(chapId); 
      
      setNovels(prev => prev.map(n => {
        if (n.id === currentNovel.id) {
          return {
            ...n,
            chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.GENERATING, content: '' } : c)
          };
        }
        return n;
      }));

      try {
        const getLatestNovel = () => currentNovel; // Simply closure for now

        await refineChapterContent(
          getLatestNovel(), 
          chapId,
          "Strictly follow the outline to write the full chapter content.",
          (chunk) => {
             setNovels(prev => prev.map(n => {
                if (n.id === currentNovel.id) {
                   const chaps = [...n.chapters];
                   const idx = chaps.findIndex(c => c.id === chapId);
                   if (idx !== -1) {
                     chaps[idx] = { ...chaps[idx], content: chaps[idx].content + chunk };
                   }
                   return { ...n, chapters: chaps };
                }
                return n;
             }));
          }
        );

         setNovels(prev => prev.map(n => {
          if (n.id === currentNovel.id) {
            return {
              ...n,
              chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.COMPLETED } : c)
            };
          }
          return n;
        }));

      } catch (e) {
        console.error(`Failed to generate chapter ${chapId}`, e);
         setNovels(prev => prev.map(n => {
          if (n.id === currentNovel.id) {
            return {
              ...n,
              chapters: n.chapters.map(c => c.id === chapId ? { ...c, status: ChapterStatus.DRAFT } : c)
            };
          }
          return n;
        }));
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsBatchContentLoading(false);
    alert("批量生成完成");
  };

  const handleBrainstorm = async (query: string, selectedText?: string) => {
    if (!currentChapter) return;
     try {
       const suggestion = await brainstormIdea(currentChapter.outline + "\n" + currentChapter.content, query, selectedText);
       alert(`灵感建议:\n\n${suggestion}`);
     } catch(e) {
       alert("Brainstorming failed.");
     }
  };

  const handleAiContinueOutline = async (instruction: string): Promise<Chapter | null> => {
     if (!currentNovel) return null;
     setIsAiSingleOutlineLoading(true);
     try {
       const result = await generateSingleChapterOutline(currentNovel, instruction);
       
       const newChapter: Chapter = {
         id: `chap-${Date.now()}`,
         title: result.title,
         outline: result.outline,
         content: '',
         status: ChapterStatus.DRAFT
       };
       
       // Update novel state locally if not handled by caller
       const updatedChapters = [...currentNovel.chapters, newChapter];
       handleUpdateNovel({
         ...currentNovel,
         chapters: updatedChapters
       });
       
       return newChapter;
     } catch (e) {
       alert("AI 续写大纲失败，请重试");
       return null;
     } finally {
       setIsAiSingleOutlineLoading(false);
     }
  };

  // --- Rendering ---

  if (view === 'setup') {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (view === 'library') {
    return (
      <Library 
        novels={novels}
        onCreateNovel={handleCreateNovel}
        onSelectNovel={handleSelectNovel}
        onDeleteNovel={handleDeleteNovel}
      />
    );
  }

  if (!currentNovel || !currentChapter) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50 text-ink-900 font-sans">
      {/* Mobile Sidebar Toggle Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 w-64 bg-paper-100 z-30 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <ChapterList 
          chapters={currentNovel.chapters} 
          currentChapterId={currentChapterId} 
          onSelectChapter={(id) => {
            setCurrentChapterId(id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onAddChapter={handleAddChapter}
          onBatchAddChapters={() => setIsBatchOutlineOpen(true)}
          onBatchGenerateContent={() => setIsBatchContentOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFullOutline={() => setIsFullOutlineOpen(true)}
          onOpenMindMap={() => setIsMindMapOpen(true)}
          onExport={() => setIsExportOpen(true)}
          onBack={() => setView('library')}
          onDeleteChapter={handleDeleteChapter}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
         {/* Mobile Header Toggle */}
         <div className="md:hidden p-4 border-b border-paper-200 flex items-center bg-paper-100">
           <button onClick={() => setIsSidebarOpen(true)} className="text-ink-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <span className="ml-4 font-serif font-bold truncate">{currentNovel.title}</span>
         </div>

         <Editor 
           chapter={currentChapter}
           onUpdate={handleUpdateChapter}
           onGenerate={handleGenerateContent}
           onBrainstorm={handleBrainstorm}
           onRefine={() => setIsRefineOpen(true)}
         />
      </div>

      <NovelSettings 
        novel={currentNovel}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={handleUpdateNovel}
      />
      
      <FullOutlineModal
        novel={currentNovel}
        isOpen={isFullOutlineOpen}
        onClose={() => setIsFullOutlineOpen(false)}
        onUpdate={handleUpdateNovel}
        onAiContinue={handleAiContinueOutline}
        isAiLoading={isAiSingleOutlineLoading}
      />

      <MindMapModal 
        novel={currentNovel}
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
        onAiContinue={async (instruction) => { await handleAiContinueOutline(instruction); }}
        isLoading={isAiSingleOutlineLoading}
      />

      <ExportModal 
        novel={currentNovel}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <RefineModal 
        isOpen={isRefineOpen}
        onClose={() => setIsRefineOpen(false)}
        onConfirm={handleRefineContent}
        isLoading={isRefineLoading}
      />

      <BatchCreateModal
        novel={currentNovel}
        currentChapterId={currentChapterId}
        isOpen={isBatchOutlineOpen}
        onClose={() => setIsBatchOutlineOpen(false)}
        onConfirm={handleBatchCreateOutlines}
        isLoading={isBatchOutlineLoading}
      />

      <BatchGenerateContentModal
        novel={currentNovel}
        isOpen={isBatchContentOpen}
        onClose={() => setIsBatchContentOpen(false)}
        onConfirm={handleBatchGenerateContent}
        isLoading={isBatchContentLoading}
      />
    </div>
  );
};

export default App;