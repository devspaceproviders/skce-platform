#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2fbb0d2ab0dd19c71d09a7d228171f61bd51a85b0dc2656a8e084ab3eec4c91a/contract';
import startContract from '../../snapshots/2fbb0d2ab0dd19c71d09a7d228171f61bd51a85b0dc2656a8e084ab3eec4c91a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/82f7e1ec81a6fe22223501d98d813c4958063b7f764a686f772fd3b210d563a1/contract';
import endContract from '../../snapshots/82f7e1ec81a6fe22223501d98d813c4958063b7f764a686f772fd3b210d563a1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'meeting',
        column: col('meetingPlatform', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'meeting',
        constraint: 'meeting_meetingPlatform_check_b2cec751',
        expression:
          "\"meetingPlatform\" IN ('GOOGLE_MEET', 'MICROSOFT_TEAMS', 'ZOOM', 'WHATSAPP', 'OTHER')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
