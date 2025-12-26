
import { GoogleGenAI, Type } from "@google/genai";
import { Novel, Genre, Character, Chapter } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_NOVELIST = `
你是一位名为“文枢”的顶级全能作家。你不仅擅长文学创作，还是多领域的专家（计算机科学、金融分析、生物医学、历史考据等）。

核心创作宪法：
1. **事实一致性（FATAL CONSISTENCY）**：
   - 严禁修改已设定的任何专有名词。如果前文设定游戏叫《一天》，整本书必须叫《一天》。
   - 保持环境的一致性。如果主角在新手村，严禁出现逻辑上不该出现的顶级势力。
2. **硬核知识流准则（HARDCORE KNOWLEDGE）**：
   - 当题材为“硬核纪实/知识流”时，必须包含真实的行业知识。
   - 写技术：描述具体的代码逻辑、算法原理、硬件架构。
   - 写金融：描述真实的交易策略、财务报表分析、市场博弈逻辑。
   - 确保读者在阅读过程中能真实学到知识，拒绝伪科学和降智情节。
3. **阶梯式成长逻辑**：
   - 严格遵守进度比例。前10%的章节只能处理基础知识和小型冲突。严禁新手期出现跨维度的顶级战力。
4. **纯净正文**：
   - 输出必须直接是小说内容，禁止包含任何沟通词（如“好的”、“为您生成”）。
`;

const getNovelContext = (novel: Novel) => {
  return `
【当前作品档案 - 必须严格遵守】
书名：《${novel.title}》
题材：${novel.genre}
核心设定：${novel.premise}
当前总进度：${novel.currentCoverage || 0}%

【已定专有名词（严禁更改）】
${novel.title}、${novel.characters.map(c => c.name).join('、')}

【核心角色库】
${novel.characters.map(c => `- ${c.name} [${c.role}]: ${c.description}`).join('\n')}

【最近剧情逻辑（用于确保连贯性）】
${novel.chapters.slice(-5).map((c, i) => `章节: ${c.title} | 关键事件: ${c.outline}`).join('\n')}
`;
};

export const generateNovelOutline = async (
  title: string, 
  genre: Genre, 
  premise: string, 
  chapterCount: number, 
  coverage: number
): Promise<{ characters: Character[]; chapters: any[] }> => {
  const initialCount = Math.min(chapterCount, 15);
  const prompt = `
    为小说《${title}》创建初始架构。
    题材：${genre}。
    创意：${premise}。
    任务：
    1. 设定3-5名核心人物。
    2. 构思前 ${initialCount} 章的“教学相长”式大纲，如果是硬核题材，请标注每章将涉及的核心知识点。
    请以 JSON 格式输出。
  `;
  const responseSchema = { 
    type: Type.OBJECT, 
    properties: { 
      characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['name', 'role', 'description'] } },
      chapters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, outline: { type: Type.STRING } }, required: ['title', 'outline'] } }
    }, 
    required: ['characters', 'chapters'] 
  };
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: prompt, 
    config: { systemInstruction: SYSTEM_INSTRUCTION_NOVELIST, responseMimeType: "application/json", responseSchema: responseSchema } 
  });
  return JSON.parse(response.text || "{}");
};

export const refineChapterContent = async (
  novel: Novel, 
  chapterId: string, 
  instruction: string, 
  onStream: (chunk: string) => void
): Promise<string> => {
  const currentIdx = novel.chapters.findIndex(c => c.id === chapterId);
  const current = novel.chapters[currentIdx];
  const prev = currentIdx > 0 ? novel.chapters[currentIdx - 1] : null;
  const prevContentSnippet = prev?.content ? `\n【必须衔接的上章结尾】：\n...${prev.content.slice(-1500)}\n` : '【首章开卷】';

  const context = `
${getNovelContext(novel)}
${prevContentSnippet}

【本章任务】：
- 标题：${current.title}
- 进度百分比：${((currentIdx + 1) / novel.chapters.length * 100).toFixed(1)}%
- 详细细纲：${current.outline}
- 额外要求：${instruction}

【特别注意】：如果是硬核题材，请在正文中通过情节自然地展示专业知识（如具体的代码实现、财务计算过程等），不要一笔带过。
【输出规则】：禁止任何题外话，直接输出正文。
`;
  
  const result = await ai.models.generateContentStream({ 
    model: 'gemini-3-pro-preview', 
    contents: context, 
    config: { systemInstruction: SYSTEM_INSTRUCTION_NOVELIST, temperature: 0.7 } 
  });
  
  let full = "";
  for await (const chunk of result) { 
    if (chunk.text) { full += chunk.text; onStream(chunk.text); } 
  }
  return full;
};

export const brainstormIdea = async (novel: Novel, chapter: Chapter, query: string, selectedText?: string): Promise<string> => {
  const context = `
${getNovelContext(novel)}
当前位置：${chapter.title}
用户问题：${query}
${selectedText ? `针对选中文段："${selectedText}"` : ""}

请提供3个具有实操性的灵感方案，如果是硬核流派，请提供相关的真实专业知识作为参考。
`;
  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: context,
    config: { systemInstruction: "你是一位全能跨领域专家级文学导师。" }
  });
  return response.text || "文枢正在查阅资料库...";
};

export const generateBatchOutlines = async (novel: Novel, count: number, direction: string, insertAfterChapterId?: string, targetCoverage: number = 100): Promise<{ title: string; outline: string }[]> => {
  let chapterIndex = novel.chapters.length - 1;
  if (insertAfterChapterId) chapterIndex = novel.chapters.findIndex(c => c.id === insertAfterChapterId);
  const precedingContext = novel.chapters.slice(Math.max(0, chapterIndex - 15), chapterIndex + 1).map((c, i) => `[第 ${chapterIndex - 14 + i} 章] ${c.title}: ${c.outline}`).join('\n');
  
  const prompt = `
${getNovelContext(novel)}
【已定前情】：
${precedingContext}

任务：为接下来的 ${count} 章规划符合逻辑的硬核知识进阶路径。
目标进度：${targetCoverage}%
方向：${direction}
规则：严禁改名，严禁战力/势力突变，必须符合该阶段应有的逻辑。
请以 JSON 数组输出。`;

  const responseSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, outline: { type: Type.STRING } }, required: ['title', 'outline'] } };
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { systemInstruction: SYSTEM_INSTRUCTION_NOVELIST, responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.8 } });
  return JSON.parse(response.text || "[]");
};

export const generateSingleChapterOutline = async (novel: Novel, instruction?: string): Promise<{ title: string; outline: string }> => {
  const context = `${getNovelContext(novel)}\n指令：${instruction}\n生成下一章大纲 JSON。`;
  const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, outline: { type: Type.STRING } }, required: ['title', 'outline'] };
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: context, config: { responseMimeType: "application/json", responseSchema: schema } });
  return JSON.parse(response.text || "{}");
};
