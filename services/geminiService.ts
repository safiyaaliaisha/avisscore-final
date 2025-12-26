
import { GoogleGenAI } from "@google/genai";

export interface WebSource {
  title: string;
  uri: string;
}

/**
 * TURBO ENGINE V9 (Powered by Gemini 3 Flash)
 * محرك البحث فائق السرعة مع تصفح الويب المباشر
 */
export const analyzeProductWithWebSearch = async (productName: string) => {
  // استخدام API KEY من البيئة كما هو مطلوب
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `TURBO MODE V9: Analyse IMMÉDIATE de "${productName}". 
  SOURCES: Amazon, Fnac, Boulanger, Darty, Rakuten.
  EXTRAIRE: Score/100, Pros (6), Cons (6), Prix actuel, Modèle précédent, Durée de vie.
  
  FORMAT JSON STRICT (FRANÇAIS):
  {
    "score": number,
    "description": "phrase courte",
    "pros": ["p1","p2","p3","p4","p5","p6"],
    "cons": ["c1","c2","c3","c4","c5","c6"],
    "predecessorName": "string",
    "activeLifespanYears": number,
    "marketAlternatives": [{"name": "string", "price": "string"}],
    "verdict": "string",
    "buyerTip": "string"
  }
  NO MARKDOWN. FAST RESPONSE ONLY.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // أقصى سرعة وأقل عشوائية
        thinkingConfig: { thinkingBudget: 0 } // تعطيل التفكير العميق لزيادة السرعة اللحظية
      },
    });

    // استخراج الروابط والمصادر
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources: WebSource[] = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source Tech Directe",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    // استخراج JSON
    let data = null;
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    }

    return { data, sources };
  } catch (error) {
    console.error("Turbo V9 Engine Error:", error);
    return { data: null, sources: [] };
  }
};
