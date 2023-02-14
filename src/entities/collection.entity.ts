import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Group } from "./group.entity";

@Entity()
export class Collection extends BaseEntity{
    @PrimaryGeneratedColumn()
    @Index({ unique: true })
    id: number;

    @OneToMany(() => Plext, (plext) => plext.collection, {eager: true, nullable: false, cascade: true})
    @JoinColumn({ name: "meaning_id", referencedColumnName: "id" })
    meaning: Plext[];

    @OneToMany(() => Plext, (plext) => plext.collection, {eager: true, nullable: false, cascade: true})
    @JoinColumn({ name: "speech_id", referencedColumnName: "id" })
    speech: Plext[];

    @Column("text",{nullable: true})
    image: string;

    @Column("text",{default:"#ffffff00", nullable: true})
    color: string;

    @Column("integer",{nullable: true})
    hub_parent: number;

    @Column("jsonb",{nullable: true})
    meta_data: any;
    
    @Index({ unique: true })
    @ManyToMany( () => Collection, collection => collection.collections, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
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

    @ManyToMany( () => Group, group => group.collections, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinTable({
      name: "collection_group", // table name for the junction table of this relation
      joinColumn: {
          name: "collection_id",
          referencedColumnName: "id",
      },
      inverseJoinColumn: {
          name: "group_id",
          referencedColumnName: "id",
      }, 
    })
    groups : Group[]

    @ManyToOne(
        type => User,
        user => user.collections,
        { eager: false },
      )
    user: User;

    @Column({default: false})
    public: boolean;

    @CreateDateColumn()
    createdDate: Date;
    
    @UpdateDateColumn()
    updatedDate: Date;

    createPlextFromJSON(locale_text: object): Plext[]{
      const plexts: Plext[] = [];
      for (const locale in locale_text) {
          const plext = new Plext(locale, locale_text[locale]);
          plexts.push(plext);
      }
      return plexts;
    }
}

@Entity()
export class Plext extends BaseEntity{
    constructor(locale: string, text: string){
        super();
        this.locale = locale;
        this.text = text;
    }
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: false})
    locale : string;

    @Column("text", {default: ""})
    text : string;

    @ManyToOne(
        type => Collection,
        collection => collection.meaning,
        { eager: false, cascade: true, nullable: false },
      )
    collection: Collection;
}