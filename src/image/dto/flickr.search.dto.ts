import { IsNotEmpty, IsString } from "class-validator";

export class FilterDto {
    @IsNotEmpty()
    @IsString()
    search: string;

    @IsNotEmpty()
    @IsString()
    language: string;
}