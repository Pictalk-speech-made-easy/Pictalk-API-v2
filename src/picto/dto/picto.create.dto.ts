<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
=======
import { IsNotEmpty, IsNumber, IsNumberString, IsOptional } from 'class-validator';
>>>>>>> 93dde3c292aa567a78824332205d27d0bb40ece2
export class createPictoDto {

    @ApiProperty()
    @IsNotEmpty()
    meaning: string[];

    @ApiProperty()
    @IsNotEmpty()
    language: string[];

    @ApiProperty()
    @IsNotEmpty()
    speech: string[];

    @ApiProperty()
    @IsOptional()
    collectionIds: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 
}