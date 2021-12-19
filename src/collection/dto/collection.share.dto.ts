import { ApiProperty } from "@nestjs/swagger";
import { IsBooleanString, IsNotEmpty, Matches } from "class-validator";

export class shareCollectionDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsBooleanString()
    access: boolean;

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