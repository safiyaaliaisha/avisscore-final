
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ProductSummary } from "../types";

export const getAIReviewSummary = async (productName: string, reviews: Review[]): Promise<ProductSummary | null> => {
  if (!reviews || reviews.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const reviewsContext = reviews
    .slice(0, 20)
    .map(r => `Note: ${r.rating}/5, Avis: ${r.review_text}`)
    .join('\n');
  
  const systemInstruction = `Tu es un expert critique certifié. Ta mission est de synthétiser EXCLUSIVEMENT les avis clients fournis en FRANÇAIS.
INTERDICTIONS :
- Ne jamais inventer de faits non présents dans les avis.
- Ne jamais retourner de placeholders ou données de démonstration.
- Ne jamais répondre dans une langue autre que le FRANÇAIS.
- Si une information technique est absente, indique "Non mentionné".

STRUCTURE DU JSON :
- rating : score moyen calculé à partir des avis (1-5).
- review_text : tableau de EXACTEMENT 4 phrases de synthèse réelle en français.
- cycle_de_vie : tableau de EXACTEMENT 4 chaînes basées sur les retours d'utilisation longue durée en français.
- points_forts : tableau de EXACTEMENT 3 points réels cités par les clients en français.
- points_faibles : tableau de EXACTEMENT 3 critiques réelles citées par les clients en français.
- fiche_technique : tableau de EXACTEMENT 4 caractéristiques mentionnées (Format: "Clé: Valeur") en français.
- alternative : chaîne "Nom du produit - Pourquoi" si mentionnée ou pertinente en français.
- image_url : laisser vide si non sûr.
- seo_title : Titre optimisé en français.
- seo_description : Description courte en français.`;

  const prompt = `Produit : ${productName}.
Voici les avis clients réels pour synthèse :
${reviewsContext}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.NUMBER },
            review_text: { type: Type.ARRAY, items: { type: Type.STRING } },
            cycle_de_vie: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_forts: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_faibles: { type: Type.ARRAY, items: { type: Type.STRING } },
            fiche_technique: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternative: { type: Type.STRING },
            image_url: { type: Type.STRING },
            seo_title: { type: Type.STRING },
            seo_description: { type: Type.STRING }
          },
          required: ["rating", "review_text", "cycle_de_vie", "points_forts", "points_faibles", "fiche_technique", "alternative", "image_url", "seo_title", "seo_description"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return { ...data, sentiment: data.rating >= 4 ? "Excellent" : "Correct" } as ProductSummary;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
