import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateImprovementDto {
  @ApiPropertyOptional({ example: 'Búsqueda full-text' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  title?: string;

  @ApiProperty({ example: 'Estaría bueno poder buscar palabras dentro del texto de las notas.' })
  @IsString()
  @MinLength(1)
  @Length(1, 5000)
  body!: string;
}
