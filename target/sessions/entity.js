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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const entity_1 = require("../turns/entity");
let Session = class Session extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryColumn(),
    __metadata("design:type", Number)
], Session.prototype, "id", void 0);
__decorate([
    typeorm_1.Column('text', { nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "topic", void 0);
__decorate([
    typeorm_1.Column({ default: 2 }),
    __metadata("design:type", Number)
], Session.prototype, "numberOfParticipants", void 0);
__decorate([
    typeorm_1.Column({ default: 0 }),
    __metadata("design:type", Number)
], Session.prototype, "joinedParticipants", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeorm_1.Timestamp)
], Session.prototype, "startTime", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Session.prototype, "numberOfPieces", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Session.prototype, "qualityPieces", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Session.prototype, "stimatedTime", void 0);
__decorate([
    typeorm_1.Column('numeric', { default: 0 }),
    __metadata("design:type", Number)
], Session.prototype, "timePerPiece", void 0);
__decorate([
    typeorm_1.Column('text', { nullable: true, default: 'created' }),
    __metadata("design:type", String)
], Session.prototype, "status", void 0);
__decorate([
    typeorm_1.Column({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Session.prototype, "piecesToComplete", void 0);
__decorate([
    typeorm_1.OneToMany(_ => Participant, participant => participant.session),
    __metadata("design:type", Array)
], Session.prototype, "participants", void 0);
__decorate([
    typeorm_1.OneToMany(_ => entity_1.default, turn => turn.session),
    __metadata("design:type", Array)
], Session.prototype, "turns", void 0);
Session = __decorate([
    typeorm_1.Entity()
], Session);
exports.Session = Session;
let Participant = class Participant extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Participant.prototype, "id", void 0);
__decorate([
    typeorm_1.Column({ nullable: true, default: 5 }),
    __metadata("design:type", Number)
], Participant.prototype, "numberOfPieces", void 0);
__decorate([
    typeorm_1.Column({ default: 0 }),
    __metadata("design:type", Number)
], Participant.prototype, "timeSpeakingSeconds", void 0);
__decorate([
    typeorm_1.ManyToOne(_ => Session, session => session.participants),
    __metadata("design:type", Session)
], Participant.prototype, "session", void 0);
__decorate([
    typeorm_1.OneToMany(_ => entity_1.default, turn => turn.participant),
    __metadata("design:type", Array)
], Participant.prototype, "turns", void 0);
__decorate([
    typeorm_1.Column('numeric', { nullable: true }),
    __metadata("design:type", Number)
], Participant.prototype, "avgDecibels", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Participant.prototype, "lastTurnId", void 0);
__decorate([
    typeorm_1.Column('text', { nullable: true, default: 'inactive' }),
    __metadata("design:type", String)
], Participant.prototype, "participantStatus", void 0);
Participant = __decorate([
    typeorm_1.Entity()
], Participant);
exports.Participant = Participant;
//# sourceMappingURL=entity.js.map