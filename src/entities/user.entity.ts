import {BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Collection } from './collection.entity';
import { Picto } from './picto.entity';
import { Notif } from './notification.entity';
import { defaultSettings } from 'src/utilities/creation';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  username: string;

  @Column({default: ""})
  displayLanguage: string;

  @Column({default: ""})
  language: string;

  @Column({default: ""})
  languages : string

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
  sider: number;

  @Column({nullable : true, unique: true})
  shared: number;

  @Column()
  resetPasswordToken: string;

  @Column()
  validationToken: string;

  @Column()
  resetPasswordExpires: string;

  @Column("text",{default: [], array: true})
  directSharers: string[];

  @Column({type: "jsonb", default: []})
  notifications : Notif[];

  @Column({default: defaultSettings})
  settings : string;

  @Column({default: "[]"})
  mailingList : string;

  @Column({default: false})
  admin: boolean;

  @CreateDateColumn()
  createdDate: Date;
  
  @UpdateDateColumn()
  updatedDate: Date;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
