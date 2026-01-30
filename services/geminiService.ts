
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from "./db";
import { QuizQuestion, QuizType, CognitiveLevel, Difficulty } from "../types";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

export const GeminiService = {
  async getRotatingApiKey(): Promise<string> {
    const keys = await DB.getApiKeys();
    const activeKeys = keys.filter(k => k.status === 'ACTIVE');
    
    if (activeKeys.length === 0) {
      // Fallback to default injected key if no manual keys provided
      return process.env.API_KEY || "";
    }

    // Pick a key (simple random rotation)
    const picked = activeKeys[Math.floor(Math.random() * activeKeys.length)];
    await DB.updateApiKeyUsage(picked.key);
    return picked.key;
  },

  async generateQuiz(params: {
    subject: string;
    grade: string;
    topic: string;
    numQuestions: number;
    type: QuizType;
    cognitiveLevel: CognitiveLevel;
    difficulty: Difficulty;
    summary?: string;
    language: string;
    modelName: string;
  }): Promise<QuizQuestion[]> {
    const apiKey = await this.getRotatingApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const settings = await DB.getSettings();
    
    const prompt = `
      Buatkan ${params.numQuestions} soal ${params.type} untuk mata pelajaran ${params.subject} kelas ${params.grade}.
      Topik: ${params.topic}.
      Tingkat Kesulitan: ${params.difficulty}.
      Level Kognitif: ${params.cognitiveLevel}.
      ${params.summary ? `Gunakan ringkasan materi berikut sebagai acuan: ${params.summary}` : ''}
    `;

    try {
      const response = await ai.models.generateContent({
        model: params.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT_TEMPLATE(params.subject, params.language),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                indicator: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING },
              },
              required: ["id", "question", "answer", "explanation", "indicator", "cognitiveLevel"]
            }
          }
        }
      });

      let quizData: QuizQuestion[] = JSON.parse(response.text || '[]');

      if (settings.aiFactChecker && quizData.length > 0) {
        await DB.addLog('INFO', `Memulai AI Fact Checker untuk ${quizData.length} soal...`);
        quizData = await this.factCheckQuiz(quizData, params.subject, params.language);
      }

      return quizData;
    } catch (error: any) {
      await DB.addLog('ERROR', `Gemini API Error: ${error.message}`);
      throw error;
    }
  },

  async factCheckQuiz(quiz: QuizQuestion[], subject: string, language: string): Promise<QuizQuestion[]> {
    const apiKey = await this.getRotatingApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const factCheckPrompt = `
      Anda adalah pakar peninjau soal (Editor Ahli) untuk mata pelajaran ${subject}.
      Tugas Anda adalah memverifikasi fakta, ketepatan kunci jawaban, dan kejelasan pembahasan.
      Data soal: ${JSON.stringify(quiz)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: factCheckPrompt,
        config: {
          systemInstruction: "Tinjau keakuratan soal. Kembalikan data dalam format JSON yang sama namun tambahkan field 'factCheckStatus' dan 'factCheckComment'.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                factCheckStatus: { type: Type.STRING },
                factCheckComment: { type: Type.STRING },
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "factCheckStatus"]
            }
          }
        }
      });

      const checks = JSON.parse(response.text || '[]');
      return quiz.map(q => {
        const check = checks.find((c: any) => c.id === q.id);
        return check ? { ...q, ...check } : q;
      });
    } catch (error: any) {
      await DB.addLog('WARNING', `AI Fact Checker gagal: ${error.message}`);
      return quiz;
    }
  },

  async generateImage(prompt: string): Promise<string> {
    const apiKey = await this.getRotatingApiKey();
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: `Create an educational illustration for: ${prompt}. Clean style.`,
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return 'SVG_FALLBACK';
    } catch (error: any) {
      return 'SVG_FALLBACK';
    }
  }
};
