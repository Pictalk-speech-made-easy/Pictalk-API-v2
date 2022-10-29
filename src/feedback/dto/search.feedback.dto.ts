import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString, Matches } from "class-validator";
export enum Order {
    ASC = "ASC",
    DESC = "DESC",
  }
export class SearchFeedbackDto {
    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    page: number;

    @ApiProperty()
    @IsOptional()
    @IsNumberString()
    per_page: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    sortField: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    sortOrder: Order;
}