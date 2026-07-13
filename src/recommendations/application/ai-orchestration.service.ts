import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClientService } from '../infrastructure/gemini-client.service';

const PROMPT_TEMPLATE_ID = 'career-explanation-v2';
const FOLLOWUP_TEMPLATE_ID = 'career-followup-v1';
const MAX_RETRIES = 2;
const MAX_FOLLOWUP_QUESTIONS = 3;

interface ExplanationInput {
  recommendationId: string;
  careerTitle: string;
  careerDescription: string;
  careerRequiredSkills: string[];
  matchScore: number;
  studentSkills: string[];
  studentQualitativeAnswers: string[];
  profileSnapshot: Record<string, unknown>;
}

interface FollowUpInput {
  recommendationId: string;
  careerTitle: string;
  careerDescription: string;
  matchScore: number;
  existingExplanation: string;
  question: string;
}

interface ParsedAiResponse {
  explanation: string;
  roadmap: string[];
}

@Injectable()
export class AiOrchestrationService {
  private readonly logger = new Logger(AiOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiClient: GeminiClientService,
  ) {}

  private buildCacheKey(input: ExplanationInput, careerId: string): string {
    const payload = JSON.stringify({
      promptTemplateId: PROMPT_TEMPLATE_ID,
      careerId,
      profileSnapshot: input.profileSnapshot,
      matchScore: input.matchScore,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  private buildPrompt(input: ExplanationInput): string {
    return `You are a career guidance assistant helping a student understand a career recommendation.

Student context:
- Qualitative answers about interests: ${input.studentQualitativeAnswers.join(' | ')}
- Skills the student currently has: ${input.studentSkills.join(', ') || 'None listed'}

Career being explained: ${input.careerTitle}
Career description: ${input.careerDescription}
Required skills for this career: ${input.careerRequiredSkills.join(', ') || 'None specified'}
Computed match score (already calculated, do not recalculate or restate a different number): ${input.matchScore}%

Write a response as JSON with exactly two fields:
{
  "explanation": "A 3-5 sentence explanation of why this career suits the student, referencing their specific interests and skills where relevant. Do not invent facts about the student not given above. Vary your opening sentence style — avoid starting with generic enthusiasm phrases like 'It's wonderful that' or 'It's fantastic that'. Instead, open directly with a concrete connection between the student and the career.",
  "roadmap": ["An array of 3-5 short, concrete next steps as separate strings, each one sentence, referencing the required skills where relevant. Do not number them yourself, they will be numbered automatically."]
}

Respond with only the JSON object, no additional text.`;
  }

  private buildFollowUpPrompt(input: FollowUpInput): string {
    return `You are a career guidance assistant. A student is asking a follow-up question about a career recommendation they already received.

Career: ${input.careerTitle}
Description: ${input.careerDescription}
Computed match score (fixed, do not recalculate or contradict): ${input.matchScore}%
Original explanation already given to the student: ${input.existingExplanation}

Student's follow-up question: "${input.question}"

Answer the question directly and concisely (2-4 sentences), staying consistent with the match score and explanation already given.

Respond as JSON: {"answer": "your 2-4 sentence answer"}
Respond with only the JSON object, no additional text.`;
  }

  private parseResponse(rawText: string): ParsedAiResponse {
    const parsed = JSON.parse(rawText);
    if (
      typeof parsed.explanation !== 'string' ||
      !Array.isArray(parsed.roadmap)
    ) {
      throw new Error('AI response missing required fields.');
    }
    return parsed;
  }

  async generateExplanation(
    careerId: string,
    input: ExplanationInput,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(input, careerId);

    const cachedLog = await this.prisma.aiCallLog.findFirst({
      where: { cacheKey, succeeded: true },
      orderBy: { createdAt: 'desc' },
    });

    if (cachedLog && cachedLog.rawOutput) {
      try {
        const parsed = this.parseResponse(cachedLog.rawOutput);

        await this.prisma.$transaction([
          this.prisma.aiCallLog.create({
            data: {
              recommendationId: input.recommendationId,
              promptTemplateId: PROMPT_TEMPLATE_ID,
              modelVersion: cachedLog.modelVersion,
              inputs: input as any,
              rawOutput: cachedLog.rawOutput,
              cacheKey,
              cacheHit: true,
              succeeded: true,
            },
          }),
          this.prisma.recommendation.update({
            where: { id: input.recommendationId },
            data: {
              status: 'COMPLETED',
              aiExplanation: parsed.explanation,
              aiRoadmapText: JSON.stringify(parsed.roadmap),
            },
          }),
        ]);

        this.logger.log(
          `Cache hit for recommendation ${input.recommendationId}`,
        );
        return;
      } catch {
        this.logger.warn(
          'Cached AI output failed to parse — calling API fresh.',
        );
      }
    }

    const prompt = this.buildPrompt(input);
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.geminiClient.generateJson(prompt);
        const parsed = this.parseResponse(result.rawText);

        await this.prisma.$transaction([
          this.prisma.aiCallLog.create({
            data: {
              recommendationId: input.recommendationId,
              promptTemplateId: PROMPT_TEMPLATE_ID,
              modelVersion: result.modelVersion,
              inputs: input as any,
              rawOutput: result.rawText,
              cacheKey,
              cacheHit: false,
              succeeded: true,
            },
          }),
          this.prisma.recommendation.update({
            where: { id: input.recommendationId },
            data: {
              status: 'COMPLETED',
              aiExplanation: parsed.explanation,
              aiRoadmapText: JSON.stringify(parsed.roadmap),
            },
          }),
        ]);

        this.logger.log(
          `Generated explanation for recommendation ${input.recommendationId} (attempt ${attempt + 1})`,
        );
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Attempt ${attempt + 1} failed for recommendation ${input.recommendationId}: ${lastError}`,
        );

        await this.prisma.aiCallLog.create({
          data: {
            recommendationId: input.recommendationId,
            promptTemplateId: PROMPT_TEMPLATE_ID,
            modelVersion: this.geminiClient['modelName'] ?? 'unknown',
            inputs: input as any,
            rawOutput: null,
            cacheKey,
            cacheHit: false,
            succeeded: false,
            errorMessage: lastError,
          },
        });

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, (attempt + 1) * 1000),
          );
        }
      }
    }

    await this.prisma.recommendation.update({
      where: { id: input.recommendationId },
      data: { status: 'FAILED' },
    });

    this.logger.error(
      `All attempts failed for recommendation ${input.recommendationId}. Last error: ${lastError}`,
    );
  }

  async answerFollowUp(input: FollowUpInput): Promise<string> {
    const existingCount = await this.prisma.aiCallLog.count({
      where: {
        recommendationId: input.recommendationId,
        promptTemplateId: FOLLOWUP_TEMPLATE_ID,
        succeeded: true,
      },
    });

    if (existingCount >= MAX_FOLLOWUP_QUESTIONS) {
      throw new BadRequestException(
        'You have reached the question limit for this recommendation.',
      );
    }

    const prompt = this.buildFollowUpPrompt(input);
    const cacheKey = crypto
      .createHash('sha256')
      .update(
        `${FOLLOWUP_TEMPLATE_ID}:${input.recommendationId}:${input.question}`,
      )
      .digest('hex');

    try {
      const result = await this.geminiClient.generateJson(prompt);
      const parsed = JSON.parse(result.rawText);

      if (typeof parsed.answer !== 'string') {
        throw new Error('AI response missing answer field.');
      }

      await this.prisma.aiCallLog.create({
        data: {
          recommendationId: input.recommendationId,
          promptTemplateId: FOLLOWUP_TEMPLATE_ID,
          modelVersion: result.modelVersion,
          inputs: input as any,
          rawOutput: result.rawText,
          cacheKey,
          cacheHit: false,
          succeeded: true,
        },
      });

      return parsed.answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.prisma.aiCallLog.create({
        data: {
          recommendationId: input.recommendationId,
          promptTemplateId: FOLLOWUP_TEMPLATE_ID,
          modelVersion: this.geminiClient['modelName'] ?? 'unknown',
          inputs: input as any,
          rawOutput: null,
          cacheKey,
          cacheHit: false,
          succeeded: false,
          errorMessage: message,
        },
      });

      throw new BadRequestException(
        'Failed to generate an answer. Please try again.',
      );
    }
  }
}
