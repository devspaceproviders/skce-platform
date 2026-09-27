#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/eb9ac707d5086916286c2018cd883de2617d8954b42347dfa6312cbe2b8d596e/contract';
import startContract from '../../snapshots/eb9ac707d5086916286c2018cd883de2617d8954b42347dfa6312cbe2b8d596e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f01bc798f15cc246438cec3eeceb2abb40060f750a1f06b17e8b5de315c781b6/contract';
import endContract from '../../snapshots/f01bc798f15cc246438cec3eeceb2abb40060f750a1f06b17e8b5de315c781b6/contract.json' with { type: 'json' };
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
        table: 'batch',
        columns: [
          col('courseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('endDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maxStudents', 'int4', {
            notNull: true,
            default: lit(30),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('mode', 'text', {
            notNull: true,
            default: lit('OFFLINE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('UPCOMING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('trainerId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'batch_mode_check_8ab134e1',
            "\"mode\" IN ('ONLINE', 'OFFLINE', 'HYBRID')",
          ),
          checkExpression(
            'batch_status_check_30cd2ac0',
            "\"status\" IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'INACTIVE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'batchStudent',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('batchId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'batchStudent',
        constraint: 'batchStudent_batchId_studentId_key',
        columns: ['batchId', 'studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_courseId_status_idx_7c6c2bd8',
        columns: ['courseId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_endDate_idx_4a9a40fb',
        columns: ['endDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_startDate_idx_9ce08316',
        columns: ['startDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch',
        index: 'batch_trainerId_idx_3e70f981',
        columns: ['trainerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batchStudent',
        index: 'batchStudent_batchId_idx_84d4b0b9',
        columns: ['batchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batchStudent',
        index: 'batchStudent_batchId_studentId_idx_ef7ac619',
        columns: ['batchId', 'studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batchStudent',
        index: 'batchStudent_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batch',
        foreignKey: {
          name: 'batch_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batch',
        foreignKey: {
          name: 'batch_trainerId_fkey',
          columns: ['trainerId'],
          references: { schema: 'public', table: 'trainerProfile', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batchStudent',
        foreignKey: {
          name: 'batchStudent_batchId_fkey',
          columns: ['batchId'],
          references: { schema: 'public', table: 'batch', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batchStudent',
        foreignKey: {
          name: 'batchStudent_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'studentProfile', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
