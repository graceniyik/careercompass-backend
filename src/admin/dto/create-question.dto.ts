// src/admin/dto/create-question.dto.ts
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, RiasecDimension } from '@prisma/client';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: 'LIKERT' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'I enjoy analyzing data to find patterns.' })
  @IsString()
  @MinLength(5)
  text: string;

  @ApiPropertyOptional({ enum: RiasecDimension, example: 'INVESTIGATIVE' })
  @IsOptional()
  @IsEnum(RiasecDimension)
  riasecDimension?: RiasecDimension;

  @ApiProperty({ example: 22 })
  @IsInt()
  order: number;
}
