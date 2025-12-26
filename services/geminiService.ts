import { GoogleGenAI } from "@google/genai";

/**
 * دالة للبحث في الإنترنت عن بيانات المنتج واستخراج الروابط
 */
export const fetchProductInfoFromWeb = async (productName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse détaillée du produit: ${productName}. 
      Donne-moi un score global sur 100, une description technique, 6 points forts, 6 points faibles, le nom du modèle précédent, la durée de vie estimée, et 2 alternatives avec prix approximatifs.
      Réponds UNIQUEMENT au format JSON comme suit: 
      {"score":number, "description":"string", "pros":["string"], "cons":["string"], "predecessorName":"string", "activeLifespanYears":number, "marketAlternatives":[{"name":"string", "price":"string"}], "verdict":"string", "buyerTip":"string"}`,
      config: {
        tools: [{ googleSearch: {} }],
        // ملاحظة: لا نستخدم responseMimeType هنا لضمان استقرار البحث الأرضي (Grounding)
      },
    });

    // استخراج روابط المصادر من Grounding Metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source Web",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    // محاولة استخراج النص كـ JSON
    let aiData = {};
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse search response JSON", e);
    }

    return { aiData, sources };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { aiData: null, sources: [] };
  }
};