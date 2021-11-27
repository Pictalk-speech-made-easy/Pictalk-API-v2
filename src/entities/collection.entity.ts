import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Picto } from "./picto.entity";
import { User } from "./user.entity";

@Entity()
export class Collection extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    meaning : string;

    @Column({nullable: true})
    speech : string;

    @Column()
    image: string;

    @Column({default: false})
    starred: boolean;

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