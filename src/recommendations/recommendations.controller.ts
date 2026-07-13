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
import { RecommendationsService } from './recommendations.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('assessment/:assessmentId')
  @ApiOperation({ summary: 'Get recommendations for a specific assessment' })
  async getForAssessment(
    @Req() req,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.recommendationsService.getForAssessment(
      req.user.userId,
      assessmentId,
    );
  }

  @Post(':recommendationId/ask')
  @ApiOperation({ summary: 'Ask a follow-up question about a recommendation' })
  async ask(
    @Req() req,
    @Param('recommendationId') recommendationId: string,
    @Body() dto: AskQuestionDto,
  ) {
    return this.recommendationsService.askFollowUpQuestion(
      req.user.userId,
      recommendationId,
      dto.question,
    );
  }
}
