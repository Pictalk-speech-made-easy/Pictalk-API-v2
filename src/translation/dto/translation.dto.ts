import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { deeplLangRegex } from "src/utilities/supported.languages";

export class TranslateDto{
    @IsNotEmpty()
    @IsString()
    text: string;
    
    @IsNotEmpty()
    @IsString()
    @Matches(deeplLangRegex)
    targetLang: string;

    @IsNotEmpty()
    @IsString()
    @Matches(deeplLangRegex)
    sourceLang: string;

    @IsOptional()
    @IsString()
    targetService: string;
}