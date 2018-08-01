import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Participant, Session } from '../sessions/entity';
import { Exclude } from 'class-transformer';


@Entity()
export default class Turn extends BaseEntity {
   
    @PrimaryGeneratedColumn()
    id?: number

    @Exclude({toPlainOnly:true})
    @ManyToOne(_ => Participant, participant => participant.turns )
    participant: Participant

    @Exclude({toPlainOnly:true})
    @ManyToOne(_ => Session, session => session.turns)
    session: Session

    @Column({type: 'timestamp' , nullable: true})
    startTime: string

    @Column({type: 'timestamp' , nullable: true})
    endTime: string

    @Column({default: 0, nullable: true})
    contributionCount: number

}