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
const entity_1 = require("../sessions/entity");
const class_transformer_1 = require("class-transformer");
let Turn = class Turn extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Turn.prototype, "id", void 0);
__decorate([
    class_transformer_1.Exclude({ toPlainOnly: true }),
    typeorm_1.ManyToOne(_ => entity_1.Participant, participant => participant.turns),
    __metadata("design:type", entity_1.Participant)
], Turn.prototype, "participant", void 0);
__decorate([
    class_transformer_1.Exclude({ toPlainOnly: true }),
    typeorm_1.ManyToOne(_ => entity_1.Session, session => session.turns),
    __metadata("design:type", entity_1.Session)
], Turn.prototype, "session", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], Turn.prototype, "startTime", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], Turn.prototype, "endTime", void 0);
__decorate([
    typeorm_1.Column({ default: 0, nullable: true }),
    __metadata("design:type", Number)
], Turn.prototype, "contributionCount", void 0);
Turn = __decorate([
    typeorm_1.Entity()
], Turn);
exports.default = Turn;
//# sourceMappingURL=entity.js.map