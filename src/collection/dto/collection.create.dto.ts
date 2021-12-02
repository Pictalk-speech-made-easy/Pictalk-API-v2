import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
export class createCollectionDto {

    @IsNotEmpty()
    meaning: string[];

    @IsNotEmpty()
    language: string[];

    @IsNotEmpty()
    speech: string[];

    @IsOptional()
    pictoIds: number[];

    @IsOptional()
    collectionIds: number[];

    @IsOptional()
    @IsHexColor()
    color: string;

    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 
}