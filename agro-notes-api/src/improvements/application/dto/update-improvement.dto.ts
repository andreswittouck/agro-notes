import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateImprovementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  body?: string;
}
