
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ProductSummary } from "../types";

export const getAIReviewSummary = async (productName: string, reviews: Review[]): Promise<ProductSummary | null> => {
  if (!reviews || reviews.length === 0) return null;

  // Initialize with named parameter as required by the SDK
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const reviewsContext = reviews
    .slice(0, 20)
    .map(r => `Source: ${r.source || 'Inconnue'}, Note: ${r.rating}/5, Avis: ${r.review_text}`)
    .join('\n');
  
  const systemInstruction = `Tu es un expert critique certifié spécialisé dans le marché FRANÇAIS.
MISSION : Synthétiser les avis clients en FRANÇAIS de haute qualité.
RÈGLE D'OR : Même si les avis sources sont en anglais ou dans une autre langue, ta réponse doit être à 100% en FRANÇAIS fluide et professionnel.

STRUCTURE DU JSON :
- rating : score moyen calculé à partir des avis (1-5).
- review_text : tableau de EXACTEMENT 4 phrases de synthèse réelle en français (ton expert).
- cycle_de_vie : tableau de EXACTEMENT 4 étapes de vie du produit basées sur l'usure mentionnée.
- points_forts : tableau de EXACTEMENT 3 points positifs réels.
- points_faibles : tableau de EXACTEMENT 3 critiques réelles.
- fiche_technique : tableau de EXACTEMENT 4 caractéristiques (Format: "Clé: Valeur").
- alternative : chaîne "Nom du produit - Pourquoi" (ex: "iPad Air - Meilleur rapport qualité/prix").
- image_url : laisser vide.
- seo_title : Titre SEO accrocheur en français.
- seo_description : Description méta courte en français.`;

  const prompt = `Produit : ${productName}.
Voici les avis clients réels (Fnac, Darty, Boulanger, etc.) à synthétiser obligatoirement en FRANÇAIS :
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

    // Extract text output using the .text property as recommended
    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("No content generated");
    }

    const data = JSON.parse(jsonStr);
    return { ...data, sentiment: data.rating >= 4 ? "Excellent" : "Correct" } as ProductSummary;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
