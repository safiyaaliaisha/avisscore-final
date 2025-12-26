import { GoogleGenAI } from "@google/genai";

export interface WebSource {
  title: string;
  uri: string;
}

/**
 * محرك البحث Turbo V9: يبحث في الإنترنت ويحلل المنتج
 */
export const analyzeProductWithWebSearch = async (productName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyse en profondeur le produit suivant: "${productName}". 
  Recherche sur les sites tech majeurs (Amazon, Fnac, Boulanger, Darty, Rakuten).
  Génère un rapport complet incluant:
  1. Score global sur 100.
  2. Description concise.
  3. EXACTEMENT 6 points forts et 6 points faibles.
  4. Le modèle précédent (predecessor).
  5. Durée de vie estimée en années.
  6. 2 alternatives avec leurs prix.
  7. Un conseil d'achat punchy.

  Réponds EXCLUSIVEMENT au format JSON strict:
  {
    "score": number,
    "description": "string",
    "pros": ["string"],
    "cons": ["string"],
    "predecessorName": "string",
    "activeLifespanYears": number,
    "marketAlternatives": [{"name": "string", "price": "string"}],
    "verdict": "string",
    "buyerTip": "string"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // ملاحظة: Grounding Metadata تتوفر بشكل أفضل عند عدم فرض JSON في الـ Config أحياناً، 
        // لذا سنقوم باستخراج الـ JSON من النص يدوياً لضمان الحصول على الروابط.
      },
    });

    // استخراج الروابط (Sources) من Metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources: WebSource[] = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source Tech",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    // استخراج الـ JSON من النص
    let data = null;
    try {
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("JSON Parsing failed, using fallback text extraction", e);
    }

    return { data, sources };
  } catch (error) {
    console.error("Gemini Web Search Error:", error);
    return { data: null, sources: [] };
  }
};