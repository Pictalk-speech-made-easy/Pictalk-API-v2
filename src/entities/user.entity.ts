import {BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Collection } from './collection.entity';
import { Picto } from './picto.entity';

@Entity()
@Unique(['username', 'root'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @OneToMany(() => Collection, (collection) => collection.user, {eager: false,})
  collections: Collection[];

  @OneToMany(() => Picto, (picto) => picto.user, { eager: false })
  pictos: Picto[];

  @Column({nullable : true})
  root: number;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
