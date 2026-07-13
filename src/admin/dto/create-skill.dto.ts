// src/admin/dto/create-skill.dto.ts
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ example: 'Machine Learning' })
  @IsString()
  @MinLength(2)
  name: string;
}
