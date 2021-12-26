import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Matches } from "class-validator";

export class sharePictoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/0|1/, { message: "Sharing should be either 1 or 0'"})
    access: number;
    

    @ApiProperty()
    @IsNotEmpty()
    @Matches(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        { message: 'Not a valid username' },
      )
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    @Matches(/viewer|editor/, { message: "Role must be either 'viewer' or 'editor'"})
    role: string;
}