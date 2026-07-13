import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiGenerationResult {
  rawText: string;
  modelVersion: string;
}

@Injectable()
export class GeminiClientService {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateJson(prompt: string): Promise<GeminiGenerationResult> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    return {
      rawText,
      modelVersion: this.modelName,
    };
  }
}
