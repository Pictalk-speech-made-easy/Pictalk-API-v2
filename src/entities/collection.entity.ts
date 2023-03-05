import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Picto } from "./picto.entity";
import { User } from "./user.entity";

@Entity()
export class Collection extends BaseEntity{
    @PrimaryGeneratedColumn()
    @Index({ unique: true })
    id: number;

    @Column({nullable: false})
    meaning : string;

    @Column({nullable: false})
    speech : string;

    @Column({nullable: true})
    image: string;

    @Column({default: 10, nullable: false})
    priority: number;

    @Column({nullable: true})
    color: string;

    @ManyToMany( () => Picto, picto => picto.collections)
    @JoinTable({
      name: "p_relations", // table name for the junction table of this relation
      joinColumn: {
          name: "parent",
          referencedColumnName: "id",
      },
      inverseJoinColumn: {
          name: "child",
          referencedColumnName: "id",
      },
    })
    pictos : Picto[];

    @ManyToMany( () => Collection, collection => collection.collections)
    @JoinTable({
      name: "c_relations", // table name for the junction table of this relation
      joinColumn: {
          name: "parent",
          referencedColumnName: "id",
      },
      inverseJoinColumn: {
          name: "child",
          referencedColumnName: "id",
      },
    })
    collections : Collection[]

    @Column()
    userId: number;

    @Column({nullable: true})
    pictohubId: number;

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