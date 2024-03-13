import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class copyPictoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  pictoId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  fatherCollectionId: number;
}
