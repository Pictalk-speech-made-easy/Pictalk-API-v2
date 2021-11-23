import { IsBooleanString, IsOptional } from "class-validator";

export class modifyCollectionDto {
    @IsOptional()
    meaning: string;

    @IsOptional()
    speech: string;

    @IsOptional()
    pictoIds: number[];

    @IsOptional()
    collectionIds: number[];

    @IsOptional()
    @IsBooleanString()
    starred : boolean;
}