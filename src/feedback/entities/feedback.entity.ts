import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { FeedbackState } from "./feedbackstate.enum";

@Entity()
export class Feedback extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: false})
    title : string;

    @Column({nullable: false})
    date: Date;

    @Column({nullable: false})
    blocking: boolean;

    @Column({nullable: false})
    contact : string;

    @Column({nullable: false})
    action : string;

    @Column({nullable: false})
    description : string;

    @Column({nullable: true})
    evolution : string;

    @Column({nullable: false})
    vuex : string;

    @Column({nullable: false})
    voices : string;

    @Column({nullable: false})
    deviceInfos : string;

    @Column({nullable: false})
    state : FeedbackState;

    @CreateDateColumn()
    createdDate: Date;
    
    @UpdateDateColumn()
    updatedDate: Date;
}