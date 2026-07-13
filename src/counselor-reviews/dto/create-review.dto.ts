import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatusFlag } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewStatusFlag, example: 'AGREES' })
  @IsEnum(ReviewStatusFlag)
  statusFlag: ReviewStatusFlag;

  @ApiProperty({
    example:
      'This is a strong match given your Investigative profile — consider looking into internships early.',
  })
  @IsString()
  @MinLength(5)
  comment: string;
}
