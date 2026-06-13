/**
 * Generic AI Service for Catalyst V2
 * Centralizes communication with AI providers (OpenRouter by default).
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  }

  /**
   * Calls the AI model with the given messages and options.
   * @param {Array} messages - Chat messages in OpenAI format
   * @param {Object} options - Additional options (temperature, response_format, etc.)
   */
  async callModel(messages, options = {}) {
    if (!this.apiKey) {
      const error = new Error("OPENROUTER_API_KEY is not configured");
      error.statusCode = 500;
      throw error;
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost",
          "X-Title": process.env.OPENROUTER_APP_NAME || "Catalyst CRM",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: options.temperature ?? 0.3,
          response_format: options.response_format || { type: "json_object" },
          messages: messages,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(
          payload?.error?.message || `AI Provider failed with ${response.status}`
        );
        error.statusCode = 502;
        throw error;
      }

      const content = this._extractMessageContent(payload);
      return options.response_format?.type === "json_object" 
        ? this._parseJsonObject(content) 
        : content;

    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  _extractMessageContent(payload) {
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("");
    }

    throw new Error("AI response did not include message content");
  }

  _parseJsonObject(content) {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("AI response must be a JSON object");
      }
      return parsed;
    } catch (error) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw error;
      }
      return JSON.parse(jsonMatch[0]);
    }
  }
}

module.exports = new AIService();
