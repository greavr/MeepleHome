import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const askGeminiAboutGame = async (gameName: string, gameDescription: string, question: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a board game expert. Answer questions about the board game "${gameName}".
  
  Game Description: ${gameDescription}
  
  User Question: ${question}
  
  Provide a helpful, concise answer. If you don't know the specific rules for a detail, suggest where the user might find it in the official rulebook.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to my board game brain right now.";
  }
};
