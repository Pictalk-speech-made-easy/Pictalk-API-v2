import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Picto } from "./picto.entity";
import { User } from "./user.entity";

@Entity()
export class Collection extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: false})
    meaning : string;

    @Column({nullable: false})
    speech : string;

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

    @Column("text",{default: [], array: true})
    editors: string[];

    @Column("text",{default: [], array: true})
    viewers: string[];

    @Column({default: false})
    public: boolean;

    @CreateDateColumn()
    createdDate: Date;
    
    @UpdateDateColumn()
    updatedDate: Date;
}