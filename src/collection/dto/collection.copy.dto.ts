import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class copyCollectionDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    collectionId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number;

}