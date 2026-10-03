#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4f6d095e811702a72f3d5f00b87a47e0732a7ab557f4519c4a7b5705a839d439/contract';
import startContract from '../../snapshots/4f6d095e811702a72f3d5f00b87a47e0732a7ab557f4519c4a7b5705a839d439/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/583ece85c955d60f2a2c625123818d8662761a6e905427e05cb7ed388d24dcb9/contract';
import endContract from '../../snapshots/583ece85c955d60f2a2c625123818d8662761a6e905427e05cb7ed388d24dcb9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'certificateSetting',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('logoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('signatureUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
