import { IsNotEmpty, IsNumberString, IsOptional } from "class-validator";

export class deleteCollectionDto{
    @IsNotEmpty()
    @IsNumberString()
    collectionId: number;

    @IsOptional()
    @IsNumberString()
    fatherId: number;
}