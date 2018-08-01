import { JsonController, Post, Get, Param, HttpCode, Body, Put, NotFoundError, BodyParam, ForbiddenError} from 'routing-controllers'
import { Session, Participant } from './entity'
import {io} from '../index'

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

@JsonController()
export default class SessionsController {

    @Get('/sessions')
    async getSessions() {
    
      const sessions = await Session.query(`select * from sessions`)  
      return sessions

    }

    @Get('/sessions/:id')
    async getSession(
      @Param('id') id: number
    ) {
        const session = await Session.query(`select * from sessions where id=${id}`)
         
        return session
    }

    @HttpCode(201)
    @Post('/sessions')
    async createSession(
        @Body() session : Partial<Session>
        ) {

        const entity = await Session.create(session)
        
        const code = getRandomInt(1000,9999)
        entity.id = code
        entity.numberOfPieces = entity.numberOfParticipants === undefined ? 0 : entity.numberOfParticipants * 5
        entity.qualityPieces = entity.numberOfParticipants === undefined ? 0 : Math.ceil(entity.numberOfParticipants / 2)
        entity.timePerPiece = (entity.numberOfParticipants === undefined || entity.stimatedTime === undefined) ?
         0 : (entity.stimatedTime * 0.4) / (entity.numberOfParticipants * 5)
        entity.piecesToComplete = entity.numberOfPieces + entity.qualityPieces
        const newSession = await Session.create(entity).save()
        const [payload] =await Session.query(`select * from sessions where id=${newSession.id}`)

        return payload
    }

    @Post('/join')
    async joinSession(
        @BodyParam('code') sessionId: number
    ) {
        const session = await Session.findOne(sessionId)
        if(!session) throw new NotFoundError('Session code is incorrect!')
        if(session.joinedParticipants === session.numberOfParticipants) throw new ForbiddenError('The session is already full')
        session.joinedParticipants = session.joinedParticipants + 1
      
        
        const updatedSession = await session.save()


        const participant = await Participant.create()
        participant.session = updatedSession
        await participant.save()

        const [payload] =await Session.query(`select * from sessions where id=${updatedSession.id}`)

        io.emit( 'UPDATE_SESSION', payload )
        
        io.emit('action', {
            type: 'UPDATE_SESSION',
            payload: payload
          })

        const newParticipant = await Participant.query(`select * from participants where id=${participant.id}`)

        
        return  newParticipant
    }


    @HttpCode(200)
    @Put('/sessions/:id')
    async stopSession(
        @Param('id') id: number,
        @BodyParam('status') status: string
    ) {

        const session = await Session.findOne(id)
        if(!session) throw new NotFoundError('Session not found!')
        session.status = status
        const updatedSession = await session.save()

        const [payload] = await Session.query(`select * from sessions where id=${updatedSession.id}`)

        io.emit( 'UPDATE_SESSION', payload )

        return payload
    }

    // @Authorized(['admin'])
    // @HttpCode(200)
    // @Delete('/events/:id([0-9]+)')
    // async deleteEvent(
    //     @Param('id') id: number
    // ) {

    //     const event = await Event.findOne(id)
    //     if(!event) throw new NotFoundError('Event not found!')
        
    //     return Event.remove(event)
    // }

      
    


}
