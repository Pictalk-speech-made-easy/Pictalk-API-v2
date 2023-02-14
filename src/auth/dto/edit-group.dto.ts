import { ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Member } from 'src/entities/group.entity';


export class EditGroupDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => Member)
  members: Member[];
}
