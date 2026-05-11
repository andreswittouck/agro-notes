import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class CreateFarmShareDto {
  @ApiProperty({
    example: 'JUAN CARLOS',
    description:
      'Nombre de la explotación a compartir. Debe coincidir con el `farm` que usás al crear notas (case-insensitive).',
  })
  @IsString()
  @MinLength(1)
  @Length(1, 255)
  farm!: string;

  @ApiProperty({
    example: 'pedro@ejemplo.com',
    description: 'Email del usuario al que le das acceso de lectura.',
  })
  @IsEmail()
  @Length(3, 320)
  shared_with_email!: string;
}
