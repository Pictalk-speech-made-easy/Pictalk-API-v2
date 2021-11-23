
import { IsNotEmpty, IsOptional } from 'class-validator';
export class createCollectionDto {

    @IsNotEmpty()
    meaning: string;

    @IsOptional()
    speech: string;

    @IsOptional()
    pictoIds: number[];

    @IsOptional()
    collectionIds: number[];
}