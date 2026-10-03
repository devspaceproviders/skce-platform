#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2fbb0d2ab0dd19c71d09a7d228171f61bd51a85b0dc2656a8e084ab3eec4c91a/contract';
import endContract from '../../snapshots/2fbb0d2ab0dd19c71d09a7d228171f61bd51a85b0dc2656a8e084ab3eec4c91a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/583ece85c955d60f2a2c625123818d8662761a6e905427e05cb7ed388d24dcb9/contract';
import startContract from '../../snapshots/583ece85c955d60f2a2c625123818d8662761a6e905427e05cb7ed388d24dcb9/contract.json' with { type: 'json' };
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
        table: 'meeting',
        columns: [
          col('batchId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('courseId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
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
          col('meetingType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('meetingUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizerUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'meeting_meetingType_check_fd7b9d6e',
            "\"meetingType\" IN ('BATCH_MEETING', 'STUDENT_MEETING', 'INTERNAL_MEETING', 'ONE_TO_ONE', 'OTHER')",
          ),
          checkExpression(
            'meeting_status_check_9eaa8e3a',
            "\"status\" IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'meetingParticipant',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('meetingId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'meetingParticipant',
        constraint: 'meetingParticipant_meetingId_userId_key',
        columns: ['meetingId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_batchId_idx_84d4b0b9',
        columns: ['batchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_batchId_startAt_idx_174e7312',
        columns: ['batchId', 'startAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_endAt_idx_5e9d9e87',
        columns: ['endAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_meetingType_idx_8c31d2f2',
        columns: ['meetingType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_organizerUserId_idx_832288ad',
        columns: ['organizerUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_startAt_idx_8b06bdbe',
        columns: ['startAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meeting',
        index: 'meeting_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meetingParticipant',
        index: 'meetingParticipant_meetingId_idx_ebb79f08',
        columns: ['meetingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meetingParticipant',
        index: 'meetingParticipant_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meeting',
        foreignKey: {
          name: 'meeting_organizerUserId_fkey',
          columns: ['organizerUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meeting',
        foreignKey: {
          name: 'meeting_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meeting',
        foreignKey: {
          name: 'meeting_batchId_fkey',
          columns: ['batchId'],
          references: { schema: 'public', table: 'batch', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meetingParticipant',
        foreignKey: {
          name: 'meetingParticipant_meetingId_fkey',
          columns: ['meetingId'],
          references: { schema: 'public', table: 'meeting', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meetingParticipant',
        foreignKey: {
          name: 'meetingParticipant_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
