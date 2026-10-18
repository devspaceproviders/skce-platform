#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0c8bf35af0869191f00ea9f070cee5a46905a76f58370e26b3611c942682835a/contract';
import startContract from '../../snapshots/0c8bf35af0869191f00ea9f070cee5a46905a76f58370e26b3611c942682835a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f5a12edf46f5a695714f7ee33a9c5729acecb5e2236eee24a5830e5d8d4ce47b/contract';
import endContract from '../../snapshots/f5a12edf46f5a695714f7ee33a9c5729acecb5e2236eee24a5830e5d8d4ce47b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'phoneOtpChallenge',
        columns: [
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('codeHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('consumedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('destinationPhone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastSentAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('purpose', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
        table: 'user',
        column: col('phoneVerifiedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'phoneOtpChallenge',
        index: 'phoneOtpChallenge_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'phoneOtpChallenge',
        index: 'phoneOtpChallenge_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'phoneOtpChallenge',
        index: 'phoneOtpChallenge_userId_purpose_idx_e49c32f0',
        columns: ['userId', 'purpose'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'phoneOtpChallenge',
        foreignKey: {
          name: 'phoneOtpChallenge_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
