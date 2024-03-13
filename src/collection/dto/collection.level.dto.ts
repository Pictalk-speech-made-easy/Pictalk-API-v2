import { IsOptional } from 'class-validator';
import { Collection } from 'src/entities/collection.entity';

export class levelCollectionDto {
  @IsOptional()
  levelA: Collection;

  @IsOptional()
  levelB: Collection;

  @IsOptional()
  levelC: Collection;
}
