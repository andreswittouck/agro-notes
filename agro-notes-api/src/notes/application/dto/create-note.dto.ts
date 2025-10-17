import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'JUAN CARLOS' })
  @IsString()
  @Length(1, 120)
  farm!: string;

  @ApiProperty({ example: '24' })
  @IsString()
  @Length(1, 60)
  lot!: string;

  @ApiProperty({ type: [String], example: ['gramilla', 'rama negra'] })
  @IsArray()
  @ArrayNotEmpty()
  weeds!: string[];

  @ApiProperty({ type: [String], example: ['2,4-D', 'glifosato'] })
  @IsArray()
  @ArrayNotEmpty()
  applications!: string[];

  @ApiPropertyOptional({ example: 'viento suave' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: -33.123 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: -64.345 })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}
