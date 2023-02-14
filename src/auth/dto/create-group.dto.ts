import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Member } from 'src/entities/group.entity';


export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @Type(() => Member)
  members: Member[];
}
