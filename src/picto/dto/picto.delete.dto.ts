import { IsNotEmpty, IsNumberString, IsOptional } from "class-validator";

export class deletePictoDto{
    @IsNotEmpty()
    @IsNumberString()
    pictoId: number;

    @IsOptional()
    @IsNumberString()
    fatherId: number;
}