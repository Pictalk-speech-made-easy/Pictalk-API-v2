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
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Collection } from './collection.entity';
import { defaultSettings } from 'src/utilities/creation';
import { Group } from './group.entity';

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


  @Column({nullable : true,})
  root: Collection;

  @Column({nullable : true})
  tabs: Collection[];

  @Column({nullable : true})
  shared: Collection;

// passwords and validation
  @Column("text", {nullable : false})
  password: string;

  @Column("text", {nullable : false})
  salt: string;

  @Column("text", {nullable : true})
  resetPasswordToken: string;

  @Column("text", {nullable : true})
  resetPasswordExpires: string;

  @Column("text", {nullable : false, generated: "uuid", unique: true })
  validationToken: string;


  @OneToMany(
    () => Group,
    group => group.user,
    
  )
  @JoinColumn({ name: "group_id", referencedColumnName: "id" })
  groups: Group[];

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
    constructor(device: string, locale: string, voiceuri: string, picth: number = 1.0, rate: number = 1.0){
        super();
        this.device = device;
        this.locale = locale;
        this.voiceuri = voiceuri;
        this.picth = picth;
        this.rate = rate;
    }

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
        { eager: false, onDelete: 'CASCADE', orphanedRowAction: "delete" },
      )
    user: User;
}

