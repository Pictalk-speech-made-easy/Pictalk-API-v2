import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { usernameRegexp } from 'src/utilities/creation';

export class AuthCredentialsDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(usernameRegexp, { message: 'Not a valid email address' })
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;
}
