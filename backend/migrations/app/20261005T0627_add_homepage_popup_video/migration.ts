#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/652831f095369fd364099741b76b266f7fca0c295732754c2bca76b994273b86/contract';
import endContract from '../../snapshots/652831f095369fd364099741b76b266f7fca0c295732754c2bca76b994273b86/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/be97bf587934175bbfff26bc1c3815e630f1898e6b27b2f88fdc08d57051ebad/contract';
import startContract from '../../snapshots/be97bf587934175bbfff26bc1c3815e630f1898e6b27b2f88fdc08d57051ebad/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'homepagePopup',
        column: col('mediaType', 'text', {
          notNull: true,
          default: lit('IMAGE'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'homepagePopup',
        column: col('videoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'homepagePopup',
        constraint: 'homepagePopup_mediaType_check_f6ce7902',
        expression: "\"mediaType\" IN ('IMAGE', 'VIDEO')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
