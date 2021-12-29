import { IsNotEmpty, IsString, Matches } from "class-validator";
import { languagesRegex } from "src/utilities/supported.languages";

export class FilterDto {
    @IsNotEmpty()
    @IsString()
    search: string;

    @IsNotEmpty()
    @IsString()
    @Matches(languagesRegex)
    language: string;
}