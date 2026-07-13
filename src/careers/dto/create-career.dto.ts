import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiasecCodeDto {
  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  REALISTIC: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  INVESTIGATIVE: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  ARTISTIC: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  @Max(100)
  SOCIAL: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  ENTERPRISING: number;

  @ApiProperty({ example: 55 })
  @IsNumber()
  @Min(0)
  @Max(100)
  CONVENTIONAL: number;
}

export class RoadmapStepInputDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 'Learn programming fundamentals' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'Start with a language like Python or JavaScript.' })
  @IsString()
  @MinLength(2)
  description: string;
}

export class CreateCareerDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'Designs, builds, and maintains software systems.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ type: RiasecCodeDto })
  @ValidateNested()
  @Type(() => RiasecCodeDto)
  riasecCode: RiasecCodeDto;

  @ApiPropertyOptional({
    example: ['skill-id-1', 'skill-id-2'],
    description: 'Array of Skill IDs required for this career',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkillIds?: string[];

  @ApiPropertyOptional({ type: [RoadmapStepInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoadmapStepInputDto)
  roadmapSteps?: RoadmapStepInputDto[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
