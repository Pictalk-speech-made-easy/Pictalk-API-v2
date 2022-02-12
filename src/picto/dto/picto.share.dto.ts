import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsOptional, Matches } from "class-validator";
import { usernameRegexp } from "src/utilities/creation";

export class multipleSharePictoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/0|1/, { message: "Sharing should be either 1 or 0'"})
    access: number;
    

    @ApiProperty()
    @IsNotEmpty()
    @Matches(
        usernameRegexp,
        { message: 'Not a valid username', each: true},
      )
    usernames: string[];

    @ApiProperty()
    @IsOptional()
    @Matches(/viewer|editor/, { message: "Role must be either 'viewer' or 'editor'"})
    role: string;
}

export class sharePictoDto {
  access: number;
  username: string;
  role: string;
  constructor(access: number, username: string, role: string){
    this.access= access;
    this.username= username;
    this.role= role;
  }
}