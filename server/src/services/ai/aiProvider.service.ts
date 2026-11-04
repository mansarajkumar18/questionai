import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../config/db.js';

export class AIProviderService {
  private static async getEffectiveApiKey(): Promise<string> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'GEMINI_API_KEY' },
      });
      if (setting && setting.value.trim().length > 0) {
        return setting.value.trim();
      }
    } catch {
      // ignore db error, fallback to env
    }
    return process.env.GEMINI_API_KEY?.trim() || '';
  }

  private static async getEffectiveModel(): Promise<string> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'GEMINI_MODEL' },
      });
      if (setting && setting.value.trim().length > 0) {
        return setting.value.trim();
      }
    } catch {
      // ignore
    }
    return process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
  }

  public static async testConnection(customApiKey?: string): Promise<{ success: boolean; latencyMs: number; message: string; model: string }> {
    const key = customApiKey || (await this.getEffectiveApiKey());
    if (!key) {
      return {
        success: false,
        latencyMs: 0,
        message: 'No Gemini API Key configured. Please enter your API key in Settings.',
        model: 'None',
      };
    }

    const modelName = await this.getEffectiveModel();
    const startTime = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Respond with only the single word: "READY"');
      const text = result.response.text().trim();
      const latencyMs = Date.now() - startTime;

      if (text.includes('READY')) {
        return {
          success: true,
          latencyMs,
          message: 'Connected successfully to Google Gemini API.',
          model: modelName,
        };
      } else {
        return {
          success: true,
          latencyMs,
          message: `Connected, response: "${text.substring(0, 50)}"`,
          model: modelName,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        message: error.message || 'Failed to authenticate with Gemini API.',
        model: modelName,
      };
    }
  }

  public static async generateStructuredJson<T>(
    prompt: string,
    systemInstruction?: string
  ): Promise<T> {
    const key = await this.getEffectiveApiKey();
    if (!key) {
      throw new Error(
        'Gemini API Key is missing. Please configure your GEMINI_API_KEY in Settings or in server/.env.'
      );
    }

    const modelName = await this.getEffectiveModel();
    const genAI = new GoogleGenerativeAI(key);

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || 'You are an expert academic curriculum analyst and examination question paper architect. Always output strictly valid JSON with no conversational text or markdown code fences.',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    try {
      // Remove any extraneous markdown backticks if any model still outputs them
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (parseErr) {
      console.error('Failed to parse AI JSON response:', rawText);
      throw new Error('AI returned an invalid JSON response structure. Please retry generation.');
    }
  }

  public static async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const key = await this.getEffectiveApiKey();
    if (!key) {
      throw new Error(
        'Gemini API Key is missing. Please configure your GEMINI_API_KEY in Settings or in server/.env.'
      );
    }

    const modelName = await this.getEffectiveModel();
    const genAI = new GoogleGenerativeAI(key);

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

