"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
const db_1 = require("./db");
const Koa = require("koa");
const http_1 = require("http");
const IO = require("socket.io");
const controller_1 = require("./sessions/controller");
const controller_2 = require("./turns/controller");
const routing_controllers_2 = require("routing-controllers");
const entity_1 = require("./sessions/entity");
const entity_2 = require("./turns/entity");
const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
const app = new Koa();
const server = new http_1.Server(app.callback());
exports.io = IO(server);
const port = process.env.PORT || 4000;
routing_controllers_1.useKoaServer(app, {
    cors: true,
    controllers: [
        controller_1.default,
        controller_2.default
    ]
});
exports.io.on('connect', (socket) => {
    socket.on('NEW_DB', async (payload) => {
        const { sessionId, participantId, buffer } = payload;
        const session = await entity_1.Session.findOne(sessionId);
        if (!session)
            throw new routing_controllers_2.NotFoundError('Session not found');
        if (session.status !== 'started')
            throw new routing_controllers_2.ForbiddenError("the sessison hasn't started yet");
        const participant = await entity_1.Participant.findOne(participantId);
        if (!participant)
            throw new routing_controllers_2.NotFoundError('You are not part of this session');
        participant.avgDecibels = average(buffer);
        await participant.save();
        const [{ "max": maxAvg }] = await entity_1.Participant.query(`select MAX(avg_decibels) from participants where session_id=${sessionId}`);
        const [speaker] = await entity_1.Participant.query(`select * from participants where avg_decibels=${maxAvg} and session_id=${sessionId}`);
        if (participant.avgDecibels > -30 && speaker.id === participantId && participant.participantStatus === 'inactive') {
            const turn = await entity_2.default.create();
            turn.session = session;
            turn.participant = participant;
            const startTime = new Date().toISOString();
            turn.startTime = startTime;
            const newTurn = await turn.save();
            participant.lastTurnId = newTurn.id;
            participant.participantStatus = 'active';
            const updatedParticipant = await participant.save();
        }
        if (participant.avgDecibels < -30 && participant.participantStatus === 'active' || participant.avgDecibels > 20 && speaker.id !== participantId && participant.participantStatus === 'active') {
            console.log('working');
            const turn = await entity_2.default.findOne(participant.lastTurnId);
            if (!turn)
                throw new routing_controllers_2.BadRequestError('turn entity not found');
            const endTime = new Date().toISOString();
            turn.endTime = endTime;
            await turn.save();
            const timeSpoken = Math.round((new Date(turn.endTime).getTime() - new Date(turn.startTime).getTime()) / 1000);
            participant.timeSpeakingSeconds = participant.timeSpeakingSeconds + timeSpoken;
            if (participant.timeSpeakingSeconds > session.timePerPiece && participant.timeSpeakingSeconds <= 5 * session.timePerPiece) {
                participant.numberOfPieces = 5 - Math.trunc(participant.timeSpeakingSeconds / session.timePerPiece);
            }
            else if (participant.timeSpeakingSeconds > 5 * session.timePerPiece) {
                participant.numberOfPieces = 0;
            }
            participant.participantStatus = 'inactive';
            const updatedParticipant = await participant.save();
            const [payload] = await entity_1.Participant.query(`select * from participants where id=${updatedParticipant.id}`);
            exports.io.emit('UPDATE_PARTICIPANT', payload);
            const [{ 'sum': sumpayload }] = await entity_1.Participant.query(`SELECT SUM(number_of_pieces) FROM participants where session_id=${session.id}`);
            session.piecesToComplete = sumpayload;
            await session.save();
            const [updatedSession] = await entity_1.Session.query(`select * from sessions where id=${session.id}`);
            exports.io.emit('UPDATE_SESSION', updatedSession);
        }
    });
});
db_1.default()
    .then(_ => {
    server.listen(port);
    console.log(`Listening on port ${port}`);
})
    .catch(err => console.error(err));
//# sourceMappingURL=index.js.map