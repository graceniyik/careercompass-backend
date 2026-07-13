import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Get all active assessment questions' })
  async getQuestions() {
    return this.assessmentsService.getActiveQuestions();
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment submitted and scored' })
  @ApiResponse({ status: 400, description: 'Missing or invalid answers' })
  async submit(@Req() req, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentsService.submit(req.user.userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: "Get the student's assessment history" })
  async getHistory(@Req() req) {
    return this.assessmentsService.getHistory(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full details of one assessment' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getById(@Req() req, @Param('id') id: string) {
    return this.assessmentsService.getById(req.user.userId, id);
  }
}
