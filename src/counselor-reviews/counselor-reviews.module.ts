import { Module } from '@nestjs/common';
import { CounselorReviewsController } from './counselor-reviews.controller';
import { CounselorReviewsService } from './counselor-reviews.service';

@Module({
  controllers: [CounselorReviewsController],
  providers: [CounselorReviewsService],
})
export class CounselorReviewsModule {}
