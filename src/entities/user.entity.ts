import {BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Collection } from './collection.entity';
import { Picto } from './picto.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  username: string;

  @Column({default: "en-US"})
  language: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @OneToMany(() => Collection, (collection) => collection.user, {eager: false,})
  collections: Collection[];

  @OneToMany(() => Picto, (picto) => picto.user, { eager: false })
  pictos: Picto[];

  @Column({nullable : true, unique: true})
  root: number;

  @Column({nullable : true, unique: true})
  shared: number;

  @Column()
  resetPasswordToken: string;

  @Column()
  resetPasswordExpires: string;

  @Column("text",{default: [], array: true})
  directSharers: string[];

  @Column({type: "jsonb", array: true, default: []})
  notifications : Notification[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
