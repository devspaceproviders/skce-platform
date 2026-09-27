#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/aedc7d6f14a258dd05ce52d7b997cb0310b215dc6885623408ba8b5c1536a055/contract';
import endContract from '../../snapshots/aedc7d6f14a258dd05ce52d7b997cb0310b215dc6885623408ba8b5c1536a055/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f01bc798f15cc246438cec3eeceb2abb40060f750a1f06b17e8b5de315c781b6/contract';
import startContract from '../../snapshots/f01bc798f15cc246438cec3eeceb2abb40060f750a1f06b17e8b5de315c781b6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'trainerCoursePermission',
        columns: [
          col('canCreateAssessments', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canCreateLiveSessions', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canManageContent', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canTeach', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('courseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('trainerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'assessment',
        column: col('approvalStatus', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'assessment',
        column: col('createdByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'assessment',
        column: col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'assessment',
        column: col('reviewedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'assessment',
        column: col('reviewedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('approvalStatus', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('createdByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('reviewedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('reviewedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('approvalStatus', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('createdByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('reviewedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('reviewedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'liveSession',
        column: col('approvalStatus', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'liveSession',
        column: col('createdByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'liveSession',
        column: col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'liveSession',
        column: col('reviewedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'liveSession',
        column: col('reviewedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('profilePhotoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'assessment',
        constraint: 'assessment_approvalStatus_check_5f777b7a',
        expression:
          "\"approvalStatus\" IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'ARCHIVED')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'courseModule',
        constraint: 'courseModule_approvalStatus_check_5f777b7a',
        expression:
          "\"approvalStatus\" IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'ARCHIVED')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'lesson',
        constraint: 'lesson_approvalStatus_check_5f777b7a',
        expression:
          "\"approvalStatus\" IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'ARCHIVED')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'liveSession',
        constraint: 'liveSession_approvalStatus_check_5f777b7a',
        expression:
          "\"approvalStatus\" IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'ARCHIVED')",
      }),
      this.addUnique({
        schema: 'public',
        table: 'trainerCoursePermission',
        constraint: 'trainerCoursePermission_trainerId_courseId_key',
        columns: ['trainerId', 'courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_approvalStatus_idx_d15e1cde',
        columns: ['approvalStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'assessment',
        index: 'assessment_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'courseModule',
        index: 'courseModule_approvalStatus_idx_d15e1cde',
        columns: ['approvalStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'courseModule',
        index: 'courseModule_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'courseModule',
        index: 'courseModule_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_approvalStatus_idx_d15e1cde',
        columns: ['approvalStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_approvalStatus_idx_d15e1cde',
        columns: ['approvalStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'liveSession',
        index: 'liveSession_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerCoursePermission',
        index: 'trainerCoursePermission_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerCoursePermission',
        index: 'trainerCoursePermission_trainerId_canTeach_idx_4aa55427',
        columns: ['trainerId', 'canTeach'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerCoursePermission',
        index: 'trainerCoursePermission_trainerId_idx_3e70f981',
        columns: ['trainerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessment',
        foreignKey: {
          name: 'assessment_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'assessment',
        foreignKey: {
          name: 'assessment_reviewedByUserId_fkey',
          columns: ['reviewedByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'courseModule',
        foreignKey: {
          name: 'courseModule_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'courseModule',
        foreignKey: {
          name: 'courseModule_reviewedByUserId_fkey',
          columns: ['reviewedByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson',
        foreignKey: {
          name: 'lesson_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson',
        foreignKey: {
          name: 'lesson_reviewedByUserId_fkey',
          columns: ['reviewedByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSession',
        foreignKey: {
          name: 'liveSession_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'liveSession',
        foreignKey: {
          name: 'liveSession_reviewedByUserId_fkey',
          columns: ['reviewedByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trainerCoursePermission',
        foreignKey: {
          name: 'trainerCoursePermission_trainerId_fkey',
          columns: ['trainerId'],
          references: { schema: 'public', table: 'trainerProfile', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trainerCoursePermission',
        foreignKey: {
          name: 'trainerCoursePermission_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
