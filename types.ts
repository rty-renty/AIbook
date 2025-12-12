export enum Genre {
  XUANHUAN = '玄幻/仙侠',
  URBAN = '都市/职场',
  SCIFI = '科幻/未来',
  HISTORY = '历史/架空',
  SUSPENSE = '悬疑/推理',
  ROMANCE = '言情/纯爱'
}

export enum ChapterStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED'
}

export interface Chapter {
  id: string;
  title: string;
  outline: string; // The specific outline for this chapter
  content: string; // The full generated text
  status: ChapterStatus;
}

export interface Novel {
  id: string;
  title: string;
  premise: string;
  genre: Genre;
  styleKeywords: string[]; // e.g., "Humorous", "Dark", "Fast-paced"
  characters: Character[];
  chapters: Chapter[];
  createdAt: number;
}

export interface Character {
  name: string;
  role: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}