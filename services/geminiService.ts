
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

export const generateChecklist = async (prompt: string) => {
  if (!API_KEY) throw new Error("API Key is missing.");
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `사용자가 다음 목표를 위한 체크리스트를 요청했습니다: "${prompt}". 
    이 목표를 달성하기 위해 필요한 구체적이고 실행 가능한 단계들을 리스트로 만들어주세요. 
    각 항목은 명확해야 하며 카테고리별로 분류해주세요.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                categoryName: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["categoryName", "items"]
            }
          }
        },
        required: ["title", "categories"]
      },
    },
  });

  return JSON.parse(response.text);
};

export const getMotivationalQuote = async (progress: number, taskCount: number) => {
  if (!API_KEY) return "오늘도 힘내세요!";
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `사용자의 현재 할 일 진행률은 ${progress}% 이며 총 ${taskCount}개의 할 일이 있습니다. 
    이 사용자를 격려하고 동기를 부여할 수 있는 짧고 강력한 한 문장의 응원 메시지를 한국어로 작성해주세요.`,
  });

  return response.text?.trim() || "오늘도 멋진 하루 되세요!";
};
