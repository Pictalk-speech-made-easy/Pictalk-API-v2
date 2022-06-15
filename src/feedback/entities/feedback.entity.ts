import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Feedback extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: false})
    title : string;

    @Column({nullable: false})
    contact : string;

    @Column({nullable: false})
    description : string;

    @Column({nullable: false})
    vuex : string;

    @Column({nullable: false})
    voices : string;

    @Column({nullable: false})
    deviceInfos : string;
}