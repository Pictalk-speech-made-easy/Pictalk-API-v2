import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Matches } from 'class-validator';

export class publicCollectionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Matches(/0|1/, { message: "publish should be either 1 or 0'" })
  publish: number;
}
