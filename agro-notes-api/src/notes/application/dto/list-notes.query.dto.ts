import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class ListNotesQueryDto {
  @ApiPropertyOptional({ example: 'JUAN CARLOS' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  farm?: string;

  @ApiPropertyOptional({ example: '24' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  lot?: string;
}
