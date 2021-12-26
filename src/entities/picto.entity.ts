import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Collection } from "./collection.entity";
import { MLtext } from "./MLtext.entity";
import { User } from "./user.entity";

@Entity()
export class Picto extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "jsonb"})
    meaning : MLtext[];

    @Column({type: "jsonb"})
    speech : MLtext[];

    @Column()
    image: string;

    @Column({default: false})
    starred: boolean;

    @Column({nullable: true})
    color: string;

    @ManyToMany( () => Collection, collection => collection.pictos)
    collections : Collection[];

    @Column()
    userId: number;

    @ManyToOne(
        type => User,
        user => user.pictos,
        { eager: false },
      )
    user: User;

    @Column("text",{default: [], array: true})
    editors: string[];

    @Column("text",{default: [], array: true})
    viewers: string[];

    @Column({default: false})
    public: boolean;
}