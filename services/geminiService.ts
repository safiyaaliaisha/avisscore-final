
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ProductSummary } from "../types";

export const getAIReviewSummary = async (reviews: Review[]): Promise<ProductSummary> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Changed r.content to r.review_text to match Review interface
  const reviewsText = reviews.map(r => `Rating: ${r.rating}/5. Review: ${r.review_text}`).join('\n---\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these product reviews and provide a summary.
    Reviews:
    ${reviewsText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { 
            type: Type.STRING, 
            description: 'Overall sentiment: positive, neutral, or negative' 
          },
          summary: { 
            type: Type.STRING, 
            description: 'A 2-sentence summary of overall customer feedback' 
          },
          pros: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Key strengths mentioned'
          },
          cons: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Common complaints'
          }
        },
        required: ["sentiment", "summary", "pros", "cons"]
      }
    }
  });

  return JSON.parse(response.text);
};
