import { IsNotEmpty, IsNumber, IsNumberString, IsOptional } from 'class-validator';
export class createPictoDto {

    @IsNotEmpty()
    meaning: string[];

    @IsNotEmpty()
    language: string[];

    @IsNotEmpty()
    speech: string[];

    @IsOptional()
    collectionIds: number[];

    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 
}