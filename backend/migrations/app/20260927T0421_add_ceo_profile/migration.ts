#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d57c7e971417b1dcc688ed407d11648124ffb78f859c8642a3446220468721a7/contract';
import endContract from '../../snapshots/d57c7e971417b1dcc688ed407d11648124ffb78f859c8642a3446220468721a7/contract.json' with { type: 'json' };
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
        table: 'ceoProfile',
        columns: [
          col('bioParagraph1', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('bioParagraph2', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('designation', 'text', {
            notNull: true,
            default: lit('Founder & CEO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('highlight1', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('highlight2', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
        column: col('profilePhotoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'ceoProfile',
        constraint: 'ceoProfile_userId_key',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ceoProfile',
        foreignKey: {
          name: 'ceoProfile_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
