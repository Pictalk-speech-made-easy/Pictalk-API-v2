import { IsNotEmpty, IsOptional } from 'class-validator';
export class createPictoDto {

    @IsNotEmpty()
    meaning: string;

    @IsNotEmpty()
    speech: string;

    @IsOptional()
    collectionIds: number[];
}