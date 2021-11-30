import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MLtext } from "./MLtext.entity";
import { Picto } from "./picto.entity";
import { User } from "./user.entity";

@Entity()
export class Collection extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;


    @Column({type: "jsonb"})
    meaning : MLtext[];

    @Column({type: "jsonb"})
    speech : MLtext[];

    @Column({nullable: true})
    image: string;

    @Column({default: false})
    starred: boolean;

    @Column({nullable: true})
    color: string;

    @ManyToMany( () => Picto, picto => picto.collections)
    @JoinTable()
    pictos : Picto[];

    @ManyToMany( () => Collection, collection => collection.collections)
    @JoinTable()
    collections : Collection[]

    @Column()
    userId: number;

    @ManyToOne(
        type => User,
        user => user.pictos,
        { eager: false },
      )
    user: User;

}