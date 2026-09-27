#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b5f12c6fabc88285a74759a75bfb2aece7cc5d51923df834d315d2a805c727da/contract';
import endContract from '../../snapshots/b5f12c6fabc88285a74759a75bfb2aece7cc5d51923df834d315d2a805c727da/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d57c7e971417b1dcc688ed407d11648124ffb78f859c8642a3446220468721a7/contract';
import startContract from '../../snapshots/d57c7e971417b1dcc688ed407d11648124ffb78f859c8642a3446220468721a7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'ceoProfile',
        column: col('displayName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-ceoProfile-displayName', {
        check: () => placeholder('backfill-ceoProfile-displayName:check'),
        run: () => placeholder('backfill-ceoProfile-displayName:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'ceoProfile', column: 'displayName' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
