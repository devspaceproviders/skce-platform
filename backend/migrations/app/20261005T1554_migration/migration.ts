#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4809fb7c6e82101a09374ad0012a2038e72e5619414465f1fefc4c330cc01805/contract';
import startContract from '../../snapshots/4809fb7c6e82101a09374ad0012a2038e72e5619414465f1fefc4c330cc01805/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/58b931274bde2345859942ae0903d9e6515ffd24d33737f50ced8776d2d3d48f/contract';
import endContract from '../../snapshots/58b931274bde2345859942ae0903d9e6515ffd24d33737f50ced8776d2d3d48f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'studentFeedback',
        constraint: 'studentFeedback_userId_packageId_key',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
