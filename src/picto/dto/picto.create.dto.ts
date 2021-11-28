import { IsNotEmpty, IsOptional } from 'class-validator';
export class createPictoDto {

    @IsNotEmpty()
    meaning: string[];

    @IsNotEmpty()
    language: string[];

    @IsOptional()
    speech: string[];

    @IsOptional()
    collectionIds: number[];
}