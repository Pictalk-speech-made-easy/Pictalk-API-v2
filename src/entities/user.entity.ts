import {BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  PrimaryColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Collection } from './collection.entity';
import { Notif } from './notification.entity';
import { defaultSettings } from 'src/utilities/creation';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column("text")
  username: string;

  @Column("text", {default: ""})
  displayLanguage: string;

  @Column("text", {default: ""})
  currentLocale: string;

  @OneToMany(
    () => Language,
    language => language.user,
    { eager: true, cascade: true },
  )
  languages: Language[];

  @OneToMany(() => Collection, (collection) => collection.user, {eager: true})
  collections: Collection[];


  @Column({nullable : true, unique: true})
  root: number;

  @Column({nullable : true})
  tabs: Collection[];

  @Column({nullable : true, unique: true})
  shared: number;

// passwords and validation
  @Column("text")
  password: string;

  @Column("text")
  salt: string;

  @Column("text")
  resetPasswordToken: string;

  @Column("text")
  validationToken: string;

  @Column("text")
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

@Entity()
export class Language extends BaseEntity{
    @Column("integer", {generated: "increment" })
    id: number;

    @PrimaryColumn("text", {nullable: false})
    device: string;

    @PrimaryColumn("text", {nullable: false})
    locale: string;

    // @Index(["device", "locale"], { unique: true })
    // compositeIndex: string;

    @Column("text", {nullable: false})
    voiceuri: string;

    @Column("decimal", {nullable: true, default: 1.0, precision: 3, scale: 1})
    picth: number;

    @Column("decimal", {nullable: true, default: 1.0, precision: 3, scale: 1})
    rate: number;

    @ManyToOne(
        () => User,
        user => user.languages,
        { eager: false },
      )
    user: User;
}

