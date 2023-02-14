import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Collection } from "./collection.entity";
import { User } from "./user.entity";

@Entity()
export class Group extends BaseEntity{
    constructor(name: string, members: Member[]){
        super()
        this.name = name
        for(let member of members){
            this.members.push(new Member(member.username, member.role));
        }
    }
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

    @ManyToOne( () => User, user => user.groups,
    {
      onDelete: 'CASCADE', orphanedRowAction: "delete"
    })
    user : User
}

@Entity()
export class Member extends BaseEntity{
    constructor(username: string, role: number = 1){
        super()
        this.username = username
        this.role = role
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: false})
    @Index({ unique: true })
    username : string;

    @Column({default: 1,  nullable: false})
    role : number;

    @ManyToOne(
        type => Group,
        group => group.members,
        { onDelete: 'CASCADE', orphanedRowAction: "delete" },
      )
    group: Group;
}

