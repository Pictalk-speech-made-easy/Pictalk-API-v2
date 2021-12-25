import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class EditUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    { message: 'Not a valid email address' },
  )
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  language: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString({each: true})
  directSharers: string[];
}
