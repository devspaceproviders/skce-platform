#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/19f2b508a15dee2092cfd7c55ed71d244dc9f7cef51f91e57b90a025ac399a86/contract';
import startContract from '../../snapshots/19f2b508a15dee2092cfd7c55ed71d244dc9f7cef51f91e57b90a025ac399a86/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eb9ac707d5086916286c2018cd883de2617d8954b42347dfa6312cbe2b8d596e/contract';
import endContract from '../../snapshots/eb9ac707d5086916286c2018cd883de2617d8954b42347dfa6312cbe2b8d596e/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'liveSession',
        columns: [
          col('courseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('endAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isPublished', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('meetingUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recordingUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('SCHEDULED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('trainerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'liveSession_status_check_a50348ac',
            "\"status\" IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'liveSessionParticipation',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('joinedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('leftAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('participated', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('sessionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'course',
        column: col('price', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'liveSessionParticipation',
        constraint: 'liveSessionParticipation_sessionId_userId_key',
        columns: ['sessionId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_courseId_startAt_idx_8d058830',
        columns: ['courseId', 'startAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_startAt_idx_8b06bdbe',
        columns: ['startAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_trainerId_idx_3e70f981',
        columns: ['trainerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSessionParticipation',
        index: 'liveSessionParticipation_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSessionParticipation',
        index: 'liveSessionParticipation_sessionId_participated_idx_e5d938f7',
        columns: ['sessionId', 'participated'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSessionParticipation',
        index: 'liveSessionParticipation_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSession',
        foreignKey: {
          name: 'liveSession_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSession',
        foreignKey: {
          name: 'liveSession_trainerId_fkey',
          columns: ['trainerId'],
          references: { schema: 'public', table: 'trainerProfile', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSessionParticipation',
        foreignKey: {
          name: 'liveSessionParticipation_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'liveSession', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSessionParticipation',
        foreignKey: {
          name: 'liveSessionParticipation_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
