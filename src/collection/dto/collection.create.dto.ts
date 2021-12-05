import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
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
    @IsNumber()
    fatherCollectionId: number; 
}