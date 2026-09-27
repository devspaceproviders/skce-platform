#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/19f2b508a15dee2092cfd7c55ed71d244dc9f7cef51f91e57b90a025ac399a86/contract';
import endContract from '../../snapshots/19f2b508a15dee2092cfd7c55ed71d244dc9f7cef51f91e57b90a025ac399a86/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8d7e6acca9c9db311ee32a3535186bf39274e25e013fabe4afa9f8ae3e03c4d8/contract';
import startContract from '../../snapshots/8d7e6acca9c9db311ee32a3535186bf39274e25e013fabe4afa9f8ae3e03c4d8/contract.json' with { type: 'json' };
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
        table: 'assessment',
        columns: [
          col('courseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dueAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('durationMinutes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('instructions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('totalMarks', 'int4', {
            notNull: true,
            default: lit(100),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('assessment_type_check_65240a52', "\"type\" IN ('ASSIGNMENT', 'QUIZ')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'assessmentQuestion',
        columns: [
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('correctAnswer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('marks', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('optionA', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('optionB', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('optionC', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('optionD', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('question', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'assessmentSubmission',
        columns: [
          col('answers', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('attemptNumber', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('feedback', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('gradedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('score', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('IN_PROGRESS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('submissionComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('submissionFileName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('submissionFileUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('submittedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'assessmentSubmission_status_check_7aef1854',
            "\"status\" IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'assessmentSubmission',
        constraint: 'assessmentSubmission_assessmentId_userId_attemptNumber_key',
        columns: ['assessmentId', 'userId', 'attemptNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_courseId_isActive_idx_12201116',
        columns: ['courseId', 'isActive'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_dueAt_idx_08d8815e',
        columns: ['dueAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentQuestion',
        index: 'assessmentQuestion_assessmentId_idx_1fe05216',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentQuestion',
        index: 'assessmentQuestion_assessmentId_sortOrder_idx_a3229062',
        columns: ['assessmentId', 'sortOrder'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentSubmission',
        index: 'assessmentSubmission_assessmentId_idx_1fe05216',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentSubmission',
        index: 'assessmentSubmission_assessmentId_userId_idx_d0e6a56f',
        columns: ['assessmentId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentSubmission',
        index: 'assessmentSubmission_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessmentSubmission',
        index: 'assessmentSubmission_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessment',
        foreignKey: {
          name: 'assessment_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessmentQuestion',
        foreignKey: {
          name: 'assessmentQuestion_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'assessment', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessmentSubmission',
        foreignKey: {
          name: 'assessmentSubmission_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'assessment', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessmentSubmission',
        foreignKey: {
          name: 'assessmentSubmission_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
