import {IsOptional} from 'class-validator';

export class modifyPictoDto {
    @IsOptional()
    meaning: string;

    @IsOptional()
    speech: string;

    @IsOptional()
    collectionIds: number[];

    @IsOptional()
    starred : boolean;
}