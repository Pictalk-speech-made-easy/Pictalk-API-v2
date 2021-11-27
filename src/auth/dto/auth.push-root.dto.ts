import { IsNotEmpty } from "class-validator";

export class UserRootDto {
    @IsNotEmpty()
    root: number;
}