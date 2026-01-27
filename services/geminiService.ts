
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ProductSummary, Product } from "../types";

/**
 * Génère une synthèse IA complète du produit en utilisant les avis, les prix et les 6 images (jsonb).
 */
export const getAIReviewSummary = async (product: Product): Promise<ProductSummary | null> => {
  const reviews = product.reviews || [];
  if (!reviews || reviews.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const reviewsContext = reviews
    .slice(0, 20)
    .map(r => `Source: ${r.source || 'Inconnue'}, Note: ${r.rating}/5, Avis: ${r.review_text}`)
    .join('\n');

  // Formatage des images pour le prompt
  const imagesArray = Array.isArray(product.image_url) ? product.image_url : [product.image_url];
  
  // Instructions Système - Focus sur les 6 images et le format jsonb
  const systemInstruction = `أنت خبير مراجعات تقنية متكامل (Expert Critique Tech).
يجب أن تفهم أن حقل الصور image_url في قاعدة البيانات (Supabase) أصبح الآن نوعه jsonb.
هذا الحقل يحتوي الآن على مصفوفة (Array) تضم 6 روابط صور مختلفة لنفس المنتج من زوايا متعددة.

MISSION :
1. DESIGN ANALYSIS : استخدم الصور الستة لتحليل تصميم المنتج من جميع الزوايا وتقديم وصف دقيق وتفصيلي (Ergonomie, finitions, esthétique).
2. RATING : Retourne obligatoirement une note sur une échelle de 10. Si aucune donnée: 0.0.
3. RAPPORT PRIX : Analyse basée sur current_price vs reference_price.
4. ALTERNATIVES : Propose EXACTEMENT 2 produits alternatifs (Format: "Nom - Pourquoi").
5. SANS GUILLEMETS : Ne jamais utiliser de " " ou « » dans les textes.
6. LANGUE : La réponse doit être en FRANÇAIS professionnel.

STRUCTURE DU JSON UNIQUE :
- rating: nombre (0-10).
- review_text: tableau de 4 phrases de synthèse.
- design_analysis: analyse approfondie du design basée sur les 6 angles de vue (min 40 mots).
- cycle_de_vie: tableau de 4 étapes.
- points_forts: tableau de 3 points.
- points_faibles: tableau de 3 points.
- fiche_technique: tableau de 4 caractéristiques (Clé: Valeur).
- alternatives: tableau de 2 chaînes.
- seo_title: texte optimisé.
- seo_description: texte court.`;

  const priceData = `Prix actuel: ${product.current_price || 'N/A'}€ | Prix de référence: ${product.reference_price || 'N/A'}€`;
  const prompt = `Produit : ${product.name}.
Données de prix : ${priceData}
Images du produit (6 angles) : ${JSON.stringify(imagesArray)}
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
            design_analysis: { type: Type.STRING },
            cycle_de_vie: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_forts: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_faibles: { type: Type.ARRAY, items: { type: Type.STRING } },
            fiche_technique: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            seo_title: { type: Type.STRING },
            seo_description: { type: Type.STRING }
          },
          required: ["rating", "review_text", "design_analysis", "cycle_de_vie", "points_forts", "points_faibles", "fiche_technique", "alternatives", "seo_title", "seo_description"]
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No content generated");

    const data = JSON.parse(jsonStr);
    const finalRating = typeof data.rating === 'number' ? data.rating : 0.0;

    return { 
      ...data, 
      rating: finalRating,
      sentiment: finalRating >= 8 ? "Excellent" : "Correct" 
    } as ProductSummary;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
