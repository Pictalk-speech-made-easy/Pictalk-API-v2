<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
=======
import { IsHexColor, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
>>>>>>> 93dde3c292aa567a78824332205d27d0bb40ece2
export class createCollectionDto {

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
    pictoIds: number[];

    @ApiProperty()
    @IsOptional()
    collectionIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsHexColor()
    color: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    fatherCollectionId: number; 
}