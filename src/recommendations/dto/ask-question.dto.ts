import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskQuestionDto {
  @ApiProperty({ example: 'Why did I match lower on Software Engineer?' })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  question!: string;
}
