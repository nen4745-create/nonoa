
import { GoogleGenAI, Type } from "@google/genai";

export const generateChecklist = async (prompt: string) => {
  // Directly use process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
