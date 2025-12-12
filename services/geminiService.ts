import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Novel, Chapter, Genre, Character } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instructions to ensure high quality literary output
const SYSTEM_INSTRUCTION_NOVELIST = `
You are "Wen Shu" (文枢), a world-class literary editor and ghostwriter. 
Your goal is to assist the user in writing high-quality Chinese novels.
Key Principles:
1. **Show, Don't Tell**: Use sensory details rather than abstract adjectives.
2. **Coherence**: Maintain strict logical consistency with the provided outline and previous chapters.
3. **Style**: Avoid mechanical, repetitive AI phrasing. Mimic the nuance of human writers. Vary sentence length.
4. **Deep POV**: Write from deep within the character's perspective.
`;

export const generateNovelOutline = async (
  title: string,
  genre: Genre,
  premise: string
): Promise<{ characters: Character[]; chapters: any[] }> => {
  
  const prompt = `
    Create a detailed novel outline for a "${genre}" novel titled "${title}".
    Premise: ${premise}
    
    Tasks:
    1. Create 3-5 main characters with depth.
    2. Create a chapter-by-chapter outline (10-15 chapters initially) that forms a complete, logical arc.
    
    Output strictly in JSON format.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ['name', 'role', 'description']
        }
      },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            outline: { type: Type.STRING, description: "Detailed summary of what happens in this chapter" },
          },
          required: ['title', 'outline']
        }
      }
    },
    required: ['characters', 'chapters']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is sufficient for structural outlining
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_NOVELIST,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Outline generation failed:", error);
    throw error;
  }
};

export const generateChapterContent = async (
  novel: Novel,
  chapterId: string,
  onStream: (chunk: string) => void
): Promise<string> => {
  return refineChapterContent(novel, chapterId, "Write the full content based on the outline.", onStream);
};

export const refineChapterContent = async (
  novel: Novel,
  chapterId: string,
  instruction: string,
  onStream: (chunk: string) => void
): Promise<string> => {
  
  const currentChapterIndex = novel.chapters.findIndex(c => c.id === chapterId);
  if (currentChapterIndex === -1) throw new Error("Chapter not found");

  const currentChapter = novel.chapters[currentChapterIndex];
  const previousChapter = currentChapterIndex > 0 ? novel.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < novel.chapters.length - 1 ? novel.chapters[currentChapterIndex + 1] : null;

  // Construct Context - Crucial for long memory
  const context = `
    **Novel Title:** ${novel.title}
    **Genre:** ${novel.genre}
    **Premise:** ${novel.premise}
    
    **Main Characters:**
    ${novel.characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')}
    
    **Global Story Arc (Chapter List):**
    ${novel.chapters.map((c, i) => `${i + 1}. ${c.title}: ${c.outline}`).join('\n')}
    
    **Previous Chapter Summary:**
    ${previousChapter ? previousChapter.outline : "This is the first chapter."}
    ${previousChapter ? `(Last 500 words of previous chapter: ...${previousChapter.content.slice(-500)})` : ""}

    **Next Chapter Outline (for foreshadowing):**
    ${nextChapter ? nextChapter.outline : "None"}
    
    **CURRENT CHAPTER: ${currentChapter.title}**
    **Outline:** ${currentChapter.outline}
    
    **Existing Content (if any):**
    ${currentChapter.content ? currentChapter.content : "(No content yet)"}
    
    **USER INSTRUCTION:**
    ${instruction}
    
    **Requirements:**
    - Write in Chinese.
    - If rewriting, completely integrate the instructions into the narrative.
    - If expanding, ensure the new content flows naturally.
    - Maintain the style and tone of the novel.
    - Output ONLY the story content (no "Here is the rewritten text" prefixes).
  `;

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview', 
      contents: context,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_NOVELIST,
        temperature: 0.8,
      }
    });

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onStream(chunkText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Chapter generation/refinement failed:", error);
    throw error;
  }
};

export const generateSingleChapterOutline = async (
  novel: Novel,
  instruction?: string
): Promise<{ title: string; outline: string }> => {
  
  // Get up to 5 previous chapters for context
  const contextChapters = novel.chapters.slice(-5);
  const precedingContext = contextChapters.map((c, i) => `${i + 1}. ${c.title}: ${c.outline}`).join('\n');
  
  const prompt = `
    Context:
    Title: ${novel.title}
    Genre: ${novel.genre}
    Premise: ${novel.premise}
    
    Recent Chapters Context:
    ${precedingContext}
    
    **TASK:**
    Generate the outline for the NEXT single chapter (Chapter ${novel.chapters.length + 1}).
    
    **User Hint/Direction:**
    ${instruction || "Continue the story naturally based on the premise."}
    
    Output strictly in JSON format.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      outline: { type: Type.STRING, description: "Detailed summary" },
    },
    required: ['title', 'outline']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_NOVELIST,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Single chapter outline generation failed:", error);
    throw error;
  }
};

export const generateBatchOutlines = async (
  novel: Novel,
  count: number,
  direction: string,
  insertAfterChapterId?: string
): Promise<{ title: string; outline: string }[]> => {
  
  // Determine context based on where we are inserting
  let precedingContext = "";
  let chapterIndex = novel.chapters.length - 1; // Default to end

  if (insertAfterChapterId) {
    chapterIndex = novel.chapters.findIndex(c => c.id === insertAfterChapterId);
  }

  // Get up to 5 previous chapters for context
  const startContextIdx = Math.max(0, chapterIndex - 4);
  const contextChapters = novel.chapters.slice(startContextIdx, chapterIndex + 1);

  precedingContext = contextChapters.map((c, i) => `${startContextIdx + i + 1}. ${c.title}: ${c.outline}`).join('\n');
  
  const prompt = `
    Context:
    Title: ${novel.title}
    Genre: ${novel.genre}
    Premise: ${novel.premise}
    
    Recent Chapters Context:
    ${precedingContext}
    
    **TASK:**
    Generate outlines for ${count} NEW chapters that immediately follow the chapters listed above.
    
    **Direction/Guidance for these new chapters:**
    ${direction || "Continue the story naturally based on the premise."}
    
    Output strictly in JSON format.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        outline: { type: Type.STRING, description: "Detailed summary" },
      },
      required: ['title', 'outline']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_NOVELIST,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Batch outline generation failed:", error);
    throw error;
  }
};


export const brainstormIdea = async (
  contextText: string,
  query: string,
  selectedText?: string
): Promise<string> => {
  const prompt = `
    Context of the story so far:
    ${contextText.slice(0, 2000)}... (truncated)

    ${selectedText ? `**USER SELECTED TEXT:** "${selectedText}"\nThe user is specifically asking about this section.` : ""}

    User Query: ${query}

    Provide 3 creative, distinct options or suggestions in Chinese.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a creative brainstorming partner. Be bold and imaginative.",
    }
  });

  return response.text || "Sorry, I couldn't think of anything.";
};