import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user (Admin only)' })
  async deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a user (Admin only)' })
  async reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  @Get('skills')
  @ApiOperation({ summary: 'List all skills (Admin only)' })
  async listSkills() {
    return this.adminService.listSkills();
  }

  @Post('skills')
  @ApiOperation({ summary: 'Create a new skill (Admin only)' })
  async createSkill(@Body() dto: CreateSkillDto) {
    return this.adminService.createSkill(dto);
  }

  @Patch('skills/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a skill (Admin only)' })
  async deactivateSkill(@Param('id') id: string) {
    return this.adminService.deactivateSkill(id);
  }

  @Get('questions')
  @ApiOperation({ summary: 'List all assessment questions (Admin only)' })
  async listQuestions() {
    return this.adminService.listQuestions();
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create a new assessment question (Admin only)' })
  async createQuestion(@Body() dto: CreateQuestionDto) {
    return this.adminService.createQuestion(dto);
  }

  @Patch('questions/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate an assessment question (Admin only)' })
  async deactivateQuestion(@Param('id') id: string) {
    return this.adminService.deactivateQuestion(id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get system-wide analytics (Admin only)' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
