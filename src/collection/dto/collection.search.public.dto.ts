import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString, Matches, MaxLength } from "class-validator";
export const numberRegexp = RegExp(`^[1-9]+\d*$`);

export class SearchCollectionDto{
    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(144)
    search: string;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    page: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    per_page: number;
}