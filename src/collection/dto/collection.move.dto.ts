import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional } from "class-validator";

export class MoveToCollectionDto {
    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    sourcePictoId: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    sourceCollecionId: number;

    @ApiProperty()
    @IsNumberString()
    targetCollecionId: number;
}