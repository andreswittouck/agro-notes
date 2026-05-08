import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ example: 'Campo zona Río Cuarto' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;
}
