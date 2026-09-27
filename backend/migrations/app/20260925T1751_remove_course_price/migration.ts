#!/usr/bin/env -S node

import type { Contract as End } from '../../snapshots/6aeb9e2e389990f689d95d74fe4b576f975e3c6b594200dad0f249f596eef792/contract';
import endContract from '../../snapshots/6aeb9e2e389990f689d95d74fe4b576f975e3c6b594200dad0f249f596eef792/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/89c41455328fdf995ff42328a1fb1426b3206fa93ad1fba3599c7c409beb449a/contract';
import startContract from '../../snapshots/89c41455328fdf995ff42328a1fb1426b3206fa93ad1fba3599c7c409beb449a/contract.json' with { type: 'json' };

import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({
        schema: 'public',
        table: 'course',
        column: 'price',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);