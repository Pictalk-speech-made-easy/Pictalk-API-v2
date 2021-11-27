import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity()
export class MLText extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    texts : string[];

    @Column()
    languages : string[];
}