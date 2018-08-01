import 'reflect-metadata'
import { useKoaServer } from 'routing-controllers'
import setupDb from './db'
import * as Koa from 'koa'
import {Server} from 'http'
import * as IO from 'socket.io'
import SessionsController from './sessions/controller';
import TurnsController from './turns/controller';

import { NotFoundError, ForbiddenError, BadRequestError } from 'routing-controllers'
import { Session, Participant } from './sessions/entity'
import Turn from './turns/entity'
const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

const app = new Koa()
const server = new Server(app.callback())
export const io = IO(server)
const port = process.env.PORT || 4000

useKoaServer(app, {
  cors: true,
  controllers: [
    SessionsController,
    TurnsController
  ]
})

io.on('connect', (socket) => {
  

    socket.on('NEW_DB',  async (payload) => {
      const {sessionId , participantId , buffer} = payload
      const session = await Session.findOne(sessionId)
      if(!session) throw new NotFoundError('Session not found')
      if(session.status !== 'started') throw new ForbiddenError("the sessison hasn't started yet")
  
      const participant = await Participant.findOne(participantId)
      if(!participant) throw new NotFoundError('You are not part of this session')
  
      participant.avgDecibels = average(buffer)
      await participant.save()
  
      const [{"max": maxAvg}] = await Participant.query(`select MAX(avg_decibels) from participants where session_id=${sessionId}`)
      const [speaker] = await Participant.query(`select * from participants where avg_decibels=${maxAvg} and session_id=${sessionId}`)
  
      if(participant.avgDecibels > -20 && speaker.id === participantId && participant.participantStatus === 'inactive') {
          
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
  
      if(participant.avgDecibels < -20 && participant.participantStatus === 'active' || participant.avgDecibels > 20 && speaker.id !== participantId && participant.participantStatus === 'active') {
          console.log('working')
          const turn = await Turn.findOne(participant.lastTurnId)
          if(!turn) throw new BadRequestError('turn entity not found')
  
          const endTime = new Date().toISOString()
          turn.endTime = endTime
          await turn.save()
  
          const timeSpoken =  Math.round((new Date(turn.endTime).getTime() - new Date(turn.startTime).getTime())/1000)
  
          participant.timeSpeakingSeconds = participant.timeSpeakingSeconds + timeSpoken
          
          if(participant.timeSpeakingSeconds > session.timePerPiece && participant.timeSpeakingSeconds <= 5*session.timePerPiece){
              participant.numberOfPieces = 5 - Math.trunc(participant.timeSpeakingSeconds/session.timePerPiece)
          }else if(participant.timeSpeakingSeconds > 5*session.timePerPiece) {
              participant.numberOfPieces = 0
  
          }
  
          participant.participantStatus = 'inactive'
          const updatedParticipant = await participant.save()
  
          const [payload] = await Participant.query(`select * from participants where id=${updatedParticipant.id}`)
  
          io.emit('UPDATE_PARTICIPANT', payload)
  
  
  
          const [{'sum': sumpayload}] = await Participant.query(`SELECT SUM(number_of_pieces) FROM participants where session_id=${session.id}`)
  
          session.piecesToComplete = sumpayload
          await session.save()
  
          const [updatedSession] =await Session.query(`select * from sessions where id=${session.id}`)
  
          io.emit( 'UPDATE_SESSION', updatedSession )
  
          return payload
      }
  
      return speaker
      
    });

})  

setupDb()
  .then(_ => {
    server.listen(port)
    console.log(`Listening on port ${port}`)
  })
  .catch(err => console.error(err))