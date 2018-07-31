import { JsonController, Post, HttpCode, Body, NotFoundError, ForbiddenError, BadRequestError} from 'routing-controllers'
import { Session, Participant } from '../sessions/entity'
import Turn from './entity'
import { IsNumber, IsOptional } from 'class-validator'
import {io} from '../index'

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

class AuthenticatePayload {
    @IsNumber()
    sessionId: number

    @IsNumber()
    participantId: number

    @IsOptional()
    sample: number[]
}
    

@JsonController()
export default class TurnsController {

    @HttpCode(201)
    @Post('/turns')
    async createTurn(
        @Body() { sessionId , participantId , sample} : AuthenticatePayload
        ) {
            const session = await Session.findOne(sessionId)
            if(!session) throw new NotFoundError('Session not found')
            if(session.status !== 'started') throw new ForbiddenError("the sessison hasn't started yet")

            const participant = await Participant.findOne(participantId)
            if(!participant) throw new NotFoundError('You are not part of this session')

            participant.avgDecibels = average(sample)
            await participant.save()

            const [{"max": maxAvg}] = await Participant.query(`select MAX(avg_decibels) from participants where session_id=${sessionId}`)
            const [speaker] = await Participant.query(`select * from participants where avg_decibels=${maxAvg} and session_id=${sessionId}`)

            if(participant.avgDecibels > 20 && speaker.id === participantId && participant.participantStatus === 'inactive') {
                
                const turn =  await Turn.create()
                

                turn.session = session
                turn.participant = participant

                
                const startTime = new Date().toISOString()
                turn.startTime = startTime
                
                
                const newTurn = await turn.save()

                participant.lastTurnId = newTurn.id
                participant.participantStatus = 'active'

                const updatedParticipant = await participant.save()

                const [payload] = await Participant.query(`select * from participants where id=${updatedParticipant.id}`)

                io.emit('UPDATE_PARTICIPANT', payload)

                return payload


            }

            if(participant.avgDecibels < 20 && participant.participantStatus === 'active' || participant.avgDecibels > 20 && speaker.id !== participantId && participant.participantStatus === 'active') {
                console.log('working')
                const turn = await Turn.findOne(participant.lastTurnId)
                if(!turn) throw new BadRequestError('turn entity not found')

                const endTime = new Date().toISOString()
                turn.endTime = endTime

                const timeSpoken =  Math.round((new Date(turn.endTime).getTime() - new Date(turn.startTime).getTime())/1000)

                participant.timeSpeakingSeconds = participant.timeSpeakingSeconds + timeSpoken
                if(participant.timeSpeakingSeconds > session.timePerPiece && participant.timeSpeakingSeconds <= 5*session.timePerPiece){
                participant.numberOfPieces = 5 - Math.trunc(participant.timeSpeakingSeconds/session.timePerPiece)
                }

                participant.participantStatus = 'inactive'
                const updatedParticipant = await participant.save()

                const [payload] = await Participant.query(`select * from participants where id=${updatedParticipant.id}`)

                // io.emit('UPDATE_PARTICIPANT', payload)

                return payload
            }

            return speaker




            
            
           

            
            
            


            

            // const [{'sum': sumpayload}] = await Participant.query(`SELECT SUM(number_of_pieces) FROM participants where session_id=${session.id}`)

            // session.piecesToComplete = sumpayload
            // await session.save()

            // const [updatedSession] =await Session.query(`select * from sessions where id=${session.id}`)

            // io.emit( 'UPDATE_SESSION', updatedSession )

            
            // return newTurn
        }
   



}
