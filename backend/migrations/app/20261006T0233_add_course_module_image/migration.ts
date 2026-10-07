#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0c8bf35af0869191f00ea9f070cee5a46905a76f58370e26b3611c942682835a/contract';
import endContract from '../../snapshots/0c8bf35af0869191f00ea9f070cee5a46905a76f58370e26b3611c942682835a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/58b931274bde2345859942ae0903d9e6515ffd24d33737f50ced8776d2d3d48f/contract';
import startContract from '../../snapshots/58b931274bde2345859942ae0903d9e6515ffd24d33737f50ced8776d2d3d48f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'courseModule',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
