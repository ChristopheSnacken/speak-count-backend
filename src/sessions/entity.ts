import { BaseEntity, PrimaryGeneratedColumn, Column, Entity, OneToMany, ManyToOne, PrimaryColumn, Timestamp } from 'typeorm'
import Turn from '../turns/entity';

@Entity()
export class Session extends BaseEntity {

  @PrimaryColumn()
  id?: number

  @Column('text',{nullable: true})
  topic: string

  @Column({default: 2})
  numberOfParticipants: number

  @Column({ default: 0})
  joinedParticipants: number

  @Column({type: 'timestamp', nullable: true})
  startTime: Timestamp

  @Column({nullable: true})
  numberOfPieces: number

  @Column({nullable: true})
  qualityPieces: number

  @Column({nullable: true})
  stimatedTime: number

  @Column('numeric',{ default: 0})
  timePerPiece: number

  @Column('text',{nullable: true, default: 'created'})
  status: string

  @Column({nullable: true, default: 0})
  piecesToComplete: number

  @OneToMany(_ => Participant, participant => participant.session)
  participants: Participant[]

  @OneToMany(_ => Turn, turn => turn.session)
  turns: Turn[]

}


@Entity()
export class Participant extends BaseEntity {

  @PrimaryGeneratedColumn()
  id?: number

  @Column({nullable: true, default: 5})
  numberOfPieces: number

  @Column({default: 0})
  timeSpeakingSeconds: number

  @ManyToOne(_ => Session, session => session.participants)
  session: Session

  @OneToMany(_ => Turn, turn => turn.participant)
  turns: Turn[]

  @Column('numeric', {nullable: true})
  avgDecibels: number

  @Column({nullable: true})
  lastTurnId?: number

  @Column('text',{nullable: true, default: 'inactive'})
  participantStatus: string

}
