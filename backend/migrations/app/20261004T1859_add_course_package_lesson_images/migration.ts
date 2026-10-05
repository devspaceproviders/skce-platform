#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9d8d2193b0fcdb102d000653d1d6a874f7c76b99c77f499dddd6debe94db4478/contract';
import startContract from '../../snapshots/9d8d2193b0fcdb102d000653d1d6a874f7c76b99c77f499dddd6debe94db4478/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b891dcdf79290958460dd24e525348c9ad03469a18c2c77efd8f10f13f5eec31/contract';
import endContract from '../../snapshots/b891dcdf79290958460dd24e525348c9ad03469a18c2c77efd8f10f13f5eec31/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'course',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'coursePackage',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
