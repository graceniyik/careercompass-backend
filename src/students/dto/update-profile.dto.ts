import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional({ example: 'University of Rwanda' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  institution?: string;

  @ApiPropertyOptional({ example: 'Year 3' })
  @IsOptional()
  @IsString()
  yearOfStudy?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiPropertyOptional({ example: 'Reading, chess, hiking' })
  @IsOptional()
  @IsString()
  hobbies?: string;

  @ApiPropertyOptional({ example: 'I want to work in software engineering' })
  @IsOptional()
  @IsString()
  careerGoals?: string;

  @ApiPropertyOptional({ example: 'Problem-solving, teamwork' })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({
    example: ['skill-id-1', 'skill-id-2'],
    description: 'Array of Skill IDs the student possesses',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];
}
