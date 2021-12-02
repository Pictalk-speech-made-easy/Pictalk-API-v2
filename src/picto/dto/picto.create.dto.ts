import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
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
    @IsNumber()
    fatherCollectionId: number; 
}