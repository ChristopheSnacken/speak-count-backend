"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const entity_1 = require("../sessions/entity");
const entity_2 = require("./entity");
const class_validator_1 = require("class-validator");
const index_1 = require("../index");
const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
class AuthenticatePayload {
}
__decorate([
    class_validator_1.IsNumber(),
    __metadata("design:type", Number)
], AuthenticatePayload.prototype, "sessionId", void 0);
__decorate([
    class_validator_1.IsNumber(),
    __metadata("design:type", Number)
], AuthenticatePayload.prototype, "participantId", void 0);
__decorate([
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], AuthenticatePayload.prototype, "sample", void 0);
let TurnsController = class TurnsController {
    async createTurn({ sessionId, participantId, sample }) {
        const session = await entity_1.Session.findOne(sessionId);
        if (!session)
            throw new routing_controllers_1.NotFoundError('Session not found');
        if (session.status !== 'started')
            throw new routing_controllers_1.ForbiddenError("the sessison hasn't started yet");
        const participant = await entity_1.Participant.findOne(participantId);
        if (!participant)
            throw new routing_controllers_1.NotFoundError('You are not part of this session');
        participant.avgDecibels = average(sample);
        await participant.save();
        const [{ "max": maxAvg }] = await entity_1.Participant.query(`select MAX(avg_decibels) from participants where session_id=${sessionId}`);
        const [speaker] = await entity_1.Participant.query(`select * from participants where avg_decibels=${maxAvg} and session_id=${sessionId}`);
        if (participant.avgDecibels > -20 && speaker.id === participantId && participant.participantStatus === 'inactive') {
            const turn = await entity_2.default.create();
            turn.session = session;
            turn.participant = participant;
            const startTime = new Date().toISOString();
            turn.startTime = startTime;
            const newTurn = await turn.save();
            participant.lastTurnId = newTurn.id;
            participant.participantStatus = 'active';
            const updatedParticipant = await participant.save();
            const [payload] = await entity_1.Participant.query(`select * from participants where id=${updatedParticipant.id}`);
            index_1.io.emit('UPDATE_PARTICIPANT', payload);
            return payload;
        }
        if (participant.avgDecibels < -20 && participant.participantStatus === 'active' || participant.avgDecibels > 20 && speaker.id !== participantId && participant.participantStatus === 'active') {
            console.log('working');
            const turn = await entity_2.default.findOne(participant.lastTurnId);
            if (!turn)
                throw new routing_controllers_1.BadRequestError('turn entity not found');
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
            index_1.io.emit('UPDATE_PARTICIPANT', payload);
            const [{ 'sum': sumpayload }] = await entity_1.Participant.query(`SELECT SUM(number_of_pieces) FROM participants where session_id=${session.id}`);
            session.piecesToComplete = sumpayload;
            await session.save();
            const [updatedSession] = await entity_1.Session.query(`select * from sessions where id=${session.id}`);
            index_1.io.emit('UPDATE_SESSION', updatedSession);
            return payload;
        }
        return speaker;
    }
    async contribution(sessionId, timestamp) {
        const session = await entity_1.Session.findOne(sessionId);
        if (!session)
            throw new routing_controllers_1.NotFoundError('session not found');
        const isoTime = new Date(timestamp).toISOString();
        const [{ "id": turnId }] = await entity_2.default.query(`select id from turns where start_time < '${isoTime}'::timestamp  and end_time > '${isoTime}'::timestamp and session_id=${sessionId}`);
        const turn = await entity_2.default.findOne(turnId);
        if (!turn)
            throw new routing_controllers_1.NotFoundError('turn id not found');
        turn.contributionCount = turn.contributionCount + 1;
        const updatedTurn = await turn.save();
        if (turn.contributionCount === 2 && session.qualityPieces > 0) {
            session.qualityPieces = session.qualityPieces - 1;
            await session.save();
        }
        return updatedTurn;
    }
};
__decorate([
    routing_controllers_1.HttpCode(201),
    routing_controllers_1.Post('/turns'),
    __param(0, routing_controllers_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AuthenticatePayload]),
    __metadata("design:returntype", Promise)
], TurnsController.prototype, "createTurn", null);
__decorate([
    routing_controllers_1.Post('/turns/:sessionId/contribute'),
    __param(0, routing_controllers_1.Param('sessionId')),
    __param(1, routing_controllers_1.BodyParam('likeTimestamp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], TurnsController.prototype, "contribution", null);
TurnsController = __decorate([
    routing_controllers_1.JsonController()
], TurnsController);
exports.default = TurnsController;
//# sourceMappingURL=controller.js.map