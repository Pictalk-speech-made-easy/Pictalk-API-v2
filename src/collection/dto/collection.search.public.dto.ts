import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString, Max, MaxLength, Min} from "class-validator";

export class SearchCollectionDto{
    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(144)
    search: string;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    @Min(1)
    page: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    @Min(4)
    @Max(20)
    per_page: number;
}