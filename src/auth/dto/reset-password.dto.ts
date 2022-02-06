import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { usernameRegexp } from 'src/utilities/creation';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Matches(
    usernameRegexp,
    { message: 'Not a valid email address' },
  )
  username: string;
}
