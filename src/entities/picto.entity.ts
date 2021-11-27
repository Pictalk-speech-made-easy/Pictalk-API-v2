import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Collection } from "./collection.entity";
import { MLText } from "./text.entity";
import { User } from "./user.entity";

@Entity()
export class Picto extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany( () => MLText)
    @JoinTable()
    meaning : MLText[];

    @ManyToMany( () => MLText)
    @JoinTable()
    speech : MLText[];

    @Column()
    image: string;

    @Column({default: false})
    starred: boolean;

    @ManyToMany( () => Collection, collection => collection.pictos)
    collections : Collection[];

    @ManyToMany( () => MLText)
    @JoinTable()
    texts : MLText[];

    @Column()
    userId: number;

    @ManyToOne(
        type => User,
        user => user.pictos,
        { eager: false },
      )
    user: User;

}