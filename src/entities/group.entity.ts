import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Collection } from "./collection.entity";
import { User } from "./user.entity";

@Entity()
export class Group extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: false})
    name : string;

    @OneToMany(
        type => Member,
        member => member.group,
        { eager: true, cascade: true },
      )
    members: Member[];

    @ManyToMany( () => Collection, collection => collection.groups)
    collections : Collection[]

    @ManyToOne( () => User, user => user.groups)
    users : Collection[]
}

@Entity()
export class Member extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: false})
    @Index({ unique: true })
    username : string;

    @ManyToOne(
        type => Group,
        group => group.members,
        { eager: false },
      )
    group: Group;
}

