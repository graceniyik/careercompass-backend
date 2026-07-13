import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CounselorReviewsService } from './counselor-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('counselor-reviews')
@ApiBearerAuth()
@Controller('counselor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COUNSELOR')
export class CounselorReviewsController {
  constructor(
    private readonly counselorReviewsService: CounselorReviewsService,
  ) {}

  @Get('assessments')
  @ApiOperation({ summary: 'List all student assessments (Counselor only)' })
  async getAllAssessments() {
    return this.counselorReviewsService.getAllAssessments();
  }

  @Get('assessments/:assessmentId')
  @ApiOperation({
    summary: 'Get full detail of one assessment (Counselor only)',
  })
  async getAssessmentDetail(@Param('assessmentId') assessmentId: string) {
    return this.counselorReviewsService.getAssessmentDetail(assessmentId);
  }

  @Get('students/:studentId/history')
  @ApiOperation({
    summary: "Get a student's full assessment history (Counselor only)",
  })
  async getStudentHistory(@Param('studentId') studentId: string) {
    return this.counselorReviewsService.getStudentHistory(studentId);
  }

  @Post('recommendations/:recommendationId/review')
  @ApiOperation({
    summary: 'Add a review to a recommendation (Counselor only)',
  })
  async createReview(
    @Req() req,
    @Param('recommendationId') recommendationId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.counselorReviewsService.createReview(
      req.user.userId,
      recommendationId,
      dto,
    );
  }
}
