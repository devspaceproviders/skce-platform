#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b891dcdf79290958460dd24e525348c9ad03469a18c2c77efd8f10f13f5eec31/contract';
import startContract from '../../snapshots/b891dcdf79290958460dd24e525348c9ad03469a18c2c77efd8f10f13f5eec31/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/be97bf587934175bbfff26bc1c3815e630f1898e6b27b2f88fdc08d57051ebad/contract';
import endContract from '../../snapshots/be97bf587934175bbfff26bc1c3815e630f1898e6b27b2f88fdc08d57051ebad/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'homepagePopup',
        columns: [
          col('buttonLink', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('buttonText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'int4', { notNull: true, default: lit(1), codecRef: { codecId: 'pg/int4@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
