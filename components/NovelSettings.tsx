import React, { useState, useEffect } from 'react';
import { Novel, Character, Genre } from '../types';
import { Button } from './Button';

interface NovelSettingsProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedNovel: Novel) => void;
}

export const NovelSettings: React.FC<NovelSettingsProps> = ({ novel, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'characters'>('characters');
  const [editedNovel, setEditedNovel] = useState<Novel>(novel);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setEditedNovel(novel);
      // Default to characters tab if opening from editor usually implies checking world info
    }
  }, [isOpen, novel]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate(editedNovel);
    onClose();
  };

  const handleCharacterChange = (index: number, field: keyof Character, value: string) => {
    const newChars = [...editedNovel.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setEditedNovel({ ...editedNovel, characters: newChars });
  };

  const addCharacter = () => {
    setEditedNovel({
      ...editedNovel,
      characters: [...editedNovel.characters, { name: '新角色', role: '配角', description: '' }]
    });
  };

  const removeCharacter = (index: number) => {
    const newChars = editedNovel.characters.filter((_, i) => i !== index);
    setEditedNovel({ ...editedNovel, characters: newChars });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-paper-200">
          <h2 className="text-2xl font-serif font-bold text-ink-900">作品设定</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-paper-200 px-6 bg-paper-50">
          <button 
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
          >
            基本信息
          </button>
          <button 
            onClick={() => setActiveTab('characters')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'characters' ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-700'}`}
          >
            人物小传 <span className="ml-1 px-1.5 py-0.5 bg-paper-200 text-ink-600 rounded-full text-xs">{editedNovel.characters.length}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-50/50">
          {activeTab === 'info' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">书名</label>
                <input 
                  value={editedNovel.title}
                  onChange={(e) => setEditedNovel({ ...editedNovel, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">题材</label>
                 <select 
                  value={editedNovel.genre}
                  onChange={(e) => setEditedNovel({ ...editedNovel, genre: e.target.value as Genre })}
                  className="w-full px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none bg-white"
                >
                  {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">核心创意 / 简介</label>
                <textarea 
                  value={editedNovel.premise}
                  onChange={(e) => setEditedNovel({ ...editedNovel, premise: e.target.value })}
                  className="w-full h-40 px-4 py-2 rounded-lg border border-ink-200 focus:ring-2 focus:ring-ink-500 outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {editedNovel.characters.map((char, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-paper-200 shadow-sm flex gap-4 items-start group hover:border-ink-300 transition-colors">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-ink-500 mb-1">姓名</label>
                        <input 
                          value={char.name}
                          onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded border border-ink-100 focus:border-ink-500 outline-none bg-paper-50 focus:bg-white"
                          placeholder="角色名"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-500 mb-1">角色定位</label>
                        <input 
                          value={char.role}
                          onChange={(e) => handleCharacterChange(index, 'role', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded border border-ink-100 focus:border-ink-500 outline-none bg-paper-50 focus:bg-white"
                          placeholder="例如：男主角"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-9">
                      <label className="block text-xs font-medium text-ink-500 mb-1">人物设定 / 背景 / 性格</label>
                      <textarea 
                        value={char.description}
                        onChange={(e) => handleCharacterChange(index, 'description', e.target.value)}
                        className="w-full h-24 px-3 py-2 text-sm rounded border border-ink-100 focus:border-ink-500 outline-none resize-none bg-paper-50 focus:bg-white"
                        placeholder="详细描述该角色的外貌、性格、金手指或重要经历..."
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeCharacter(index)}
                    className="text-ink-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除角色"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={addCharacter}
                className="w-full py-3 border-2 border-dashed border-ink-200 rounded-lg text-ink-500 hover:border-ink-400 hover:text-ink-700 flex items-center justify-center font-medium transition-colors bg-white hover:bg-paper-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                添加新角色
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-paper-200 bg-white flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存更改</Button>
        </div>
      </div>
    </div>
  );
};