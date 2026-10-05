#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4809fb7c6e82101a09374ad0012a2038e72e5619414465f1fefc4c330cc01805/contract';
import endContract from '../../snapshots/4809fb7c6e82101a09374ad0012a2038e72e5619414465f1fefc4c330cc01805/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/652831f095369fd364099741b76b266f7fca0c295732754c2bca76b994273b86/contract';
import startContract from '../../snapshots/652831f095369fd364099741b76b266f7fca0c295732754c2bca76b994273b86/contract.json' with { type: 'json' };
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
        table: 'studentFeedback',
        columns: [
          col('comment', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('packageId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'studentFeedback_status_check_56005a61',
            "\"status\" IN ('PENDING', 'APPROVED', 'REJECTED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'studentFeedback',
        constraint: 'studentFeedback_userId_packageId_key',
        columns: ['userId', 'packageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'studentFeedback',
        index: 'studentFeedback_packageId_idx_51f866f4',
        columns: ['packageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'studentFeedback',
        index: 'studentFeedback_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'studentFeedback',
        index: 'studentFeedback_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'studentFeedback',
        foreignKey: {
          name: 'studentFeedback_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'studentFeedback',
        foreignKey: {
          name: 'studentFeedback_packageId_fkey',
          columns: ['packageId'],
          references: { schema: 'public', table: 'coursePackage', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
