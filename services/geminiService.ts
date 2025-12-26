
import { GoogleGenAI, Type } from "@google/genai";

/**
 * TURBO ENGINE V9.5 - POWERED BY GEMINI
 * المحرك النفاث للتحليل الفوري للمنتجات باستخدام Gemini 3 Flash
 */

export interface WebSource {
  title: string;
  uri: string;
}

export const analyzeProductWithWebSearch = async (productName: string) => {
  // Use the mandatory API key from process.env.API_KEY exclusively.
  // We initialize the client inside the call to ensure it uses the most current context.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Analyze product: "${productName}"
  Focus on: Amazon, Fnac, Boulanger, Darty, Rakuten.
  Task: Immediate deep technical analysis + Market Scoring.
  Return the results as a clean JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // Use Google Search grounding for real-time market data
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.NUMBER,
              description: "Product score from 0 to 100"
            },
            description: { 
              type: Type.STRING,
              description: "A short, punchy summary sentence"
            },
            pros: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of exactly 6 key strengths"
            },
            cons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of exactly 6 key weaknesses"
            },
            predecessorName: { 
              type: Type.STRING,
              description: "Name of the previous model/version"
            },
            activeLifespanYears: { 
              type: Type.NUMBER,
              description: "Expected useful lifespan in years"
            },
            marketAlternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING }
                }
              },
              description: "Competitor products with prices"
            },
            verdict: { 
              type: Type.STRING,
              description: "A comprehensive final verdict"
            },
            buyerTip: { 
              type: Type.STRING,
              description: "Crucial advice for a potential buyer"
            }
          },
          required: ["score", "description", "pros", "cons", "verdict", "buyerTip"]
        }
      }
    });

    // Access the text property directly (do not call it as a function)
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const content = JSON.parse(text);

    // Extract grounding chunks from Google Search tool to display as sources
    // Guidelines: "If Google Search is used, you MUST ALWAYS extract the URLs from groundingChunks"
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: WebSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source Web",
        uri: chunk.web.uri
      }));

    // Fallback if no specific search sources are returned
    if (sources.length === 0) {
      sources.push(
        { title: "Amazon Search", uri: `https://www.amazon.fr/s?k=${encodeURIComponent(productName)}` },
        { title: "Fnac Search", uri: `https://www.fnac.com/recherche/${encodeURIComponent(productName)}` },
        { title: "Darty Search", uri: `https://www.darty.com/nav/recherche/${encodeURIComponent(productName)}` }
      );
    }

    return { data: content, sources };
  } catch (error) {
    console.error("Gemini Turbo Engine Error:", error);
    return { data: null, sources: [] };
  }
};
