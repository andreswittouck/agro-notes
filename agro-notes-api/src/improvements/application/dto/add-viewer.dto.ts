import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length } from 'class-validator';

export class AddViewerDto {
  @ApiProperty({ example: 'pedro@ejemplo.com' })
  @IsEmail()
  @Length(3, 320)
  email!: string;
}
