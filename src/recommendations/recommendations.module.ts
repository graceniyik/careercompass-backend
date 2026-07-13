import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { MatchingScoreService } from './application/matching-score.service';
import { AiOrchestrationService } from './application/ai-orchestration.service';
import { GeminiClientService } from './infrastructure/gemini-client.service';

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    MatchingScoreService,
    AiOrchestrationService,
    GeminiClientService,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
