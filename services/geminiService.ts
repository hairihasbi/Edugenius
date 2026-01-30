
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from "./db";
import { QuizQuestion, QuizType, CognitiveLevel, Difficulty } from "../types";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

export const GeminiService = {
  async getRotatingApiKey(): Promise<string> {
    const keys = await DB.getApiKeys();
    const activeKeys = keys.filter(k => k.status === 'ACTIVE');
    
    if (activeKeys.length === 0) {
      return process.env.API_KEY || "";
    }

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
      BUATKAN ${params.numQuestions} SOAL DALAM FORMAT JSON.
      Mata Pelajaran: ${params.subject}
      Kelas: ${params.grade}
      Topik: ${params.topic}
      Tipe Soal: ${params.type}
      Tingkat Kesulitan: ${params.difficulty}
      Level Kognitif: ${params.cognitiveLevel}
      ${params.summary ? `REFERENSI MATERI: ${params.summary}` : ''}

      INSTRUKSI KHUSUS:
      1. Kembalikan HANYA array JSON sesuai schema.
      2. Gunakan LaTeX standar untuk rumus matematika/kimia.
      3. Pastikan kunci jawaban dan pembahasan akurat sesuai kurikulum merdeka.
    `;

    try {
      const response = await ai.models.generateContent({
        model: params.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT_TEMPLATE(params.subject, params.language) + "\nOUTPUT MUST BE A VALID JSON ARRAY.",
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
        await DB.addLog('INFO', `Memulai AI Fact Checker untuk paket: ${params.topic}`);
        quizData = await this.factCheckQuiz(quizData, params.subject, params.language);
      }

      return quizData;
    } catch (error: any) {
      await DB.addLog('ERROR', `Gagal Generate (${params.modelName}): ${error.message}`);
      throw error;
    }
  },

  async factCheckQuiz(quiz: QuizQuestion[], subject: string, language: string): Promise<QuizQuestion[]> {
    const apiKey = await this.getRotatingApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const factCheckPrompt = `Verifikasi soal-soal berikut. Koreksi jika ada kesalahan fakta atau kunci jawaban. Data: ${JSON.stringify(quiz)}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: factCheckPrompt,
        config: {
          systemInstruction: "Anda adalah editor ahli. Kembalikan data soal yang sudah dikoreksi dengan tambahan status verifikasi.",
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
      await DB.addLog('WARNING', `Fact Checker Gagal: ${error.message}`);
      return quiz;
    }
  }
};
