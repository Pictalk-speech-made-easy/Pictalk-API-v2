import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { languagesRegex } from 'src/utilities/supported.languages';

export class FilterDto {
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsNotEmpty()
  @IsString()
  @Matches(languagesRegex)
  language: string;

  @IsOptional()
  @IsNumberString()
  @Min(1)
  @Max(20)
  perPage: number;
}
