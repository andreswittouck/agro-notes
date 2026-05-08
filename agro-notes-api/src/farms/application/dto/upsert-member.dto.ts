import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, Length } from 'class-validator';

export class UpsertMemberDto {
  @ApiProperty({ example: 'pedro@ejemplo.com' })
  @IsEmail()
  @Length(3, 320)
  email!: string;

  @ApiProperty({
    enum: ['reader', 'editor'],
    description:
      'reader = solo lectura. editor = puede crear/editar/borrar notas y editar la farm.',
  })
  @IsIn(['reader', 'editor'])
  @IsString()
  role!: 'reader' | 'editor';
}
