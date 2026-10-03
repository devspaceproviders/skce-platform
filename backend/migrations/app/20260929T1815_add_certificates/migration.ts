#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/91eddf436ff00b1b5f8e34f4bb5ce1a3b156d54e7bc57ec631bbfac059f73c3f/contract';
import endContract from '../../snapshots/91eddf436ff00b1b5f8e34f4bb5ce1a3b156d54e7bc57ec631bbfac059f73c3f/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bb03663bcf7a85c20efefda60c87baae9e62aff7da3970a7909478a94088ead0/contract';
import startContract from '../../snapshots/bb03663bcf7a85c20efefda60c87baae9e62aff7da3970a7909478a94088ead0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'certificate',
        columns: [
          col('certificateNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('certificateUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('courseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('enrollmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('issuedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'certificate',
        constraint: 'certificate_certificateNumber_key',
        columns: ['certificateNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'certificate',
        constraint: 'certificate_enrollmentId_key',
        columns: ['enrollmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'certificate',
        index: 'certificate_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'certificate',
        index: 'certificate_enrollmentId_idx_ee5e79c5',
        columns: ['enrollmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'certificate',
        index: 'certificate_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'certificate',
        foreignKey: {
          name: 'certificate_enrollmentId_fkey',
          columns: ['enrollmentId'],
          references: { schema: 'public', table: 'enrollment', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'certificate',
        foreignKey: {
          name: 'certificate_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'certificate',
        foreignKey: {
          name: 'certificate_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
