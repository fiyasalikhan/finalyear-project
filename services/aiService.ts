
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

/**
 * Service to handle chat interactions with the Gemini API.
 * Uses gemini-3-pro-preview for complex reasoning and tasks.
 */
export const chatWithAI = async (messages: Message[]): Promise<string> => {
  // Always use process.env.API_KEY and initialize inside the function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Separate system instructions from the chat history
  const systemMsg = messages.find(m => m.role === 'system');
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      // Gemini uses 'model' role for AI responses
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: chatHistory,
      config: {
        systemInstruction: systemMsg?.content,
        temperature: 0.7,
      },
    });

    // Access the .text property directly as per SDK guidelines
    const text = response.text;
    if (!text) {
      throw new Error('Received an empty response from the AI.');
    }
    
    return text;
  } catch (error) {
    console.error('AI Service Error:', error);
    if (error instanceof Error) {
      throw new Error(`AI request failed: ${error.message}`);
    }
    throw new Error('An unexpected error occurred during the AI request.');
  }
};
