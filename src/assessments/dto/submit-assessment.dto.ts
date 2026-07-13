import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssessmentAnswerInputDto {
  @ApiProperty({ example: 'question-id-here' })
  @IsString()
  questionId: string;

  @ApiProperty({
    example: 4,
    required: false,
    description: 'Required for LIKERT questions (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  likertValue?: number;

  @ApiProperty({
    example: 'I enjoyed building a small app for my final project.',
    required: false,
    description:
      'Required for QUALITATIVE questions (min 20 characters, per BR-2.4)',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  textAnswer?: string;
}

export class SubmitAssessmentDto {
  @ApiProperty({ type: [AssessmentAnswerInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerInputDto)
  answers: AssessmentAnswerInputDto[];
}
