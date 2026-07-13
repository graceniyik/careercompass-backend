import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/profile')
  @ApiOperation({ summary: "Get the logged-in student's profile" })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMyProfile(@Req() req) {
    return this.studentsService.getProfile(req.user.userId);
  }

  @Put('me/profile')
  @ApiOperation({ summary: "Update the logged-in student's profile" })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.studentsService.updateProfile(req.user.userId, dto);
  }
}
