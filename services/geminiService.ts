
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ProductSummary } from "../types";

/**
 * Agent IA structuré optimisé pour le nouveau design "Mockup Magazine".
 */
export const getAIReviewSummary = async (productName: string, reviews: Review[]): Promise<ProductSummary | null> => {
  if (!reviews || reviews.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const reviewsContext = reviews
    .slice(0, 15)
    .map(r => `Note: ${r.rating}/5, Avis: ${r.review_text}`)
    .join('\n');
  
  const systemInstruction = `Tu es un agent d'analyse produit structuré pour une interface de revue type magazine.
RÈGLES ABSOLUES :
- Sortie UNIQUEMENT en JSON valide. Pas de markdown.
- Langue : Français (France). Ton neutre.
- Ne JAMAIS retourner null.

FORMATAGE DES CHAMPS :
- rating : nombre entre 1 et 5.
- review_text : tableau de EXACTEMENT 4 chaînes.
- cycle_de_vie : tableau de EXACTEMENT 4 chaînes ("Durée d’utilisation : ...", "Support / mises à jour : ...", "Batterie / pièces d’usure : ...", "Avis global : ...").
- points_forts : tableau de EXACTEMENT 4 chaînes courtes.
- points_faibles : tableau de 2 à 4 chaînes courtes.
- fiche_technique : tableau de 4 à 6 chaînes avec labels (Écran: , Processeur: , RAM: , Batterie: , Stockage: ).
- alternative : chaîne au format "Produit — raison courte".
- image_url : règle stricte sur les extensions (.jpg, .png).

SEO :
- seo_title : Titre accrocheur.
- seo_description : Description courte.`;

  const prompt = `Analyse ce produit : ${productName}.
Avis clients :
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
    console.error("Erreur agent Gemini:", error);
    return null;
  }
};
