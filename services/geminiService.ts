
import { GoogleGenAI, Type } from "@google/genai";
import { ProductSummary, Product } from "../types";

export const getAIReviewSummary = async (product: Product): Promise<ProductSummary | null> => {
  // Fix: product type defines 'review_text' (any) as the source of reviews; 'reviews_txt' and 'reviews' do not exist.
  const raw = product.review_text;
  let reviewsContext = "";
  if (Array.isArray(raw)) {
    reviewsContext = raw.map(r => {
      if (typeof r === 'string') return r;
      if (typeof r === 'object' && r !== null) return r.content || r.text || JSON.stringify(r);
      return String(r);
    }).join('\n');
  } else if (typeof raw === 'string') {
    reviewsContext = raw;
  }
  
  if (!reviewsContext || reviewsContext.length < 10) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Tu es un expert en analyse de produits tech et automobile.
Analyse les mémorandums et avis fournis pour générer un résumé JSON ultra-précis.

LOGIQUE FINANCIÈRE (Dashboard Cycle) :
1. score_opportunite: Note sur 10 (ex: "8.5/10") basée sur le prix actuel vs prix de référence.
2. verdict: Doit être strictement choisi parmi (ACHETER / ATTENDRE / EXTRÊME URGENCE).
3. economie: Phrase indiquant le gain réel (ex: "Gain de 120€").

AUTRES RÈGLES :
- review_text: 3 témoignages distincts courts et percutants.
- design_analysis: Analyse basée sur les images jsonb.
- cycle_de_vie: 4 étapes clés du produit.
- fiche_technique: 4 caractéristiques techniques format (Clé: Valeur).
- alternatives: 2 noms de produits.
- Langue: FRANÇAIS. Pas de guillemets.

SANS GUILLEMETS dans les valeurs textes.`;

  const prompt = `Produit: ${product.name}
Prix: ${product.current_price}€ (Ref: ${product.reference_price}€)
Avis: ${reviewsContext.substring(0, 4000)}`;

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
            score_opportunite: { type: Type.STRING },
            verdict: { type: Type.STRING },
            economie: { type: Type.STRING },
            review_text: { type: Type.ARRAY, items: { type: Type.STRING } },
            design_analysis: { type: Type.STRING },
            cycle_de_vie: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_forts: { type: Type.ARRAY, items: { type: Type.STRING } },
            points_faibles: { type: Type.ARRAY, items: { type: Type.STRING } },
            fiche_technique: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            seo_title: { type: Type.STRING },
            seo_description: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return { 
      ...data, 
      sentiment: data.rating >= 8 ? "Excellent" : "Correct" 
    } as ProductSummary;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
