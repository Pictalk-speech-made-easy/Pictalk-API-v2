import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Collection } from './collection.entity';
import { User } from './user.entity';

@Entity()
export class Picto extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  meaning: string;

  @Column({ nullable: false })
  speech: string;

  @Column()
  image: string;

  @Column({ default: 10, nullable: false })
  priority: number;

  @Column({ nullable: true })
  color: string;

  @ManyToMany(() => Collection, (collection) => collection.pictos)
  collections: Collection[];

  @Column()
  userId: number;

  @Column({ nullable: true })
  pictohubId: number;

  @ManyToOne((type) => User, (user) => user.pictos, { eager: false })
  user: User;

  @Column('text', { default: [], array: true })
  editors: string[];

  @Column('text', { default: [], array: true })
  viewers: string[];

  @Column({ default: false })
  public: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
