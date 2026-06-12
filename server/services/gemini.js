/**
 * Google Generative AI service.
 * Gemini is used ONLY as an explanation layer.
 * All decisions are made by the Decision Engine.
 * @module services/gemini
 * @see server/engines/decisionEngine.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize ONLY if API key is present
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const insightModel = genAI
  ? genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are CarbonSaathi, a friendly and practical climate coach assisting urban Indian college students to understand and reduce their carbon footprint.',
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    })
  : null;

/**
 * Generates natural language explanation for a decision already made by the Decision Engine.
 * @param {string} prompt - Decision context prompt
 * @returns {Promise<string>} Natural language explanation
 * @throws {Error} When API key missing or call fails
 */
const explainDecision = async (prompt) => {
  if (!insightModel) {
    throw new Error('No API key configured or initialized');
  }
  const result = await insightModel.generateContent(prompt);
  return result.response.text();
};

module.exports = { explainDecision, insightModel };
