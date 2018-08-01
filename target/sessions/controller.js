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
const entity_1 = require("./entity");
const index_1 = require("../index");
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
let SessionsController = class SessionsController {
    async getSessions() {
        const sessions = await entity_1.Session.query(`select * from sessions`);
        return sessions;
    }
    async getSession(id) {
        const session = await entity_1.Session.query(`select * from sessions where id=${id}`);
        return session;
    }
    async createSession(session) {
        const entity = await entity_1.Session.create(session);
        const code = getRandomInt(1000, 9999);
        entity.id = code;
        entity.numberOfPieces = entity.numberOfParticipants === undefined ? 0 : entity.numberOfParticipants * 5;
        entity.qualityPieces = entity.numberOfParticipants === undefined ? 0 : entity.numberOfParticipants / 2;
        entity.timePerPiece = (entity.numberOfParticipants === undefined || entity.stimatedTime === undefined) ?
            0 : (entity.stimatedTime * 0.4) / (entity.numberOfParticipants * 5);
        entity.piecesToComplete = entity.numberOfPieces + entity.qualityPieces;
        const newSession = await entity_1.Session.create(entity).save();
        const [payload] = await entity_1.Session.query(`select * from sessions where id=${newSession.id}`);
        return payload;
    }
    async joinSession(sessionId) {
        const session = await entity_1.Session.findOne(sessionId);
        if (!session)
            throw new routing_controllers_1.NotFoundError('Session code is incorrect!');
        if (session.joinedParticipants === session.numberOfParticipants)
            throw new routing_controllers_1.ForbiddenError('The session is already full');
        session.joinedParticipants = session.joinedParticipants + 1;
        const updatedSession = await session.save();
        const participant = await entity_1.Participant.create();
        participant.session = updatedSession;
        await participant.save();
        const [payload] = await entity_1.Session.query(`select * from sessions where id=${updatedSession.id}`);
        index_1.io.emit('UPDATE_SESSION', payload);
        const newParticipant = await entity_1.Participant.query(`select * from participants where id=${participant.id}`);
        return newParticipant;
    }
    async stopSession(id, status) {
        const session = await entity_1.Session.findOne(id);
        if (!session)
            throw new routing_controllers_1.NotFoundError('Session not found!');
        session.status = status;
        const updatedSession = await session.save();
        const [payload] = await entity_1.Session.query(`select * from sessions where id=${updatedSession.id}`);
        index_1.io.emit('UPDATE_SESSION', payload);
        return payload;
    }
};
__decorate([
    routing_controllers_1.Get('/sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSessions", null);
__decorate([
    routing_controllers_1.Get('/sessions/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSession", null);
__decorate([
    routing_controllers_1.HttpCode(201),
    routing_controllers_1.Post('/sessions'),
    __param(0, routing_controllers_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "createSession", null);
__decorate([
    routing_controllers_1.Post('/join'),
    __param(0, routing_controllers_1.BodyParam('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "joinSession", null);
__decorate([
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.Put('/sessions/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.BodyParam('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "stopSession", null);
SessionsController = __decorate([
    routing_controllers_1.JsonController()
], SessionsController);
exports.default = SessionsController;
//# sourceMappingURL=controller.js.map