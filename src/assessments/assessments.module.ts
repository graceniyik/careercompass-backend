import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { RiasecScoringService } from './application/riasec-scoring.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [RecommendationsModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, RiasecScoringService],
})
export class AssessmentsModule {}
