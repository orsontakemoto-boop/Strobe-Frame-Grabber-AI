import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a video frame (image) using Gemini 2.5 Flash.
 * @param base64Image The base64 data of the image (without the data:image/png;base64, prefix)
 * @param mimeType The mime type of the image
 */
export const analyzeFrameContent = async (
  base64Image: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Describe this video frame concisely in Portuguese. Focus on the main action or subject.",
          },
        ],
      },
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing frame.";
  }
};
