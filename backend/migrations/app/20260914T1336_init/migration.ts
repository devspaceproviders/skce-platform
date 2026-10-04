@'
#!/usr/bin/env -S node

import type { Contract as End } from '../../snapshots/7906a43f1f6f5f295400684389038f98466408f016c265910d89bcee8f4da1da/contract';

import endContract from '../../snapshots/7906a43f1f6f5f295400684389038f98466408f016c265910d89bcee8f4da1da/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract';

import startContract from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract.json' with { type: 'json' };

import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;

  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // liveSessionParticipation has a foreign key to liveSession.
      // Therefore it must be dropped first.
      this.dropTable({
        schema: 'public',
        table: 'liveSessionParticipation',
      }),

      // Now liveSession can be dropped safely.
      this.dropTable({
        schema: 'public',
        table: 'liveSession',
      }),

      // Remove the obsolete trainer permission.
      this.dropColumn({
        schema: 'public',Set-Content ".\migrations\app\20261003T1746_remove_live_sessions_manual\migration.ts" @"
#!/usr/bin/env -S node

import type { Contract as End } from '../../snapshots/7906a43f1f6f5f295400684389038f98466408f016c265910d89bcee8f4da1da/contract';

import endContract from '../../snapshots/7906a43f1f6f5f295400684389038f98466408f016c265910d89bcee8f4da1da/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract';

import startContract from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract.json' with { type: 'json' };

import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;

  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({
        schema: 'public',
        table: 'liveSessionParticipation',
      }),

      this.dropTable({
        schema: 'public',
        table: 'liveSession',
      }),

      this.dropColumn({
        schema: 'public',
        table: 'trainerCoursePermission',
        column: 'canCreateLiveSessions',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
"@
        table: 'trainerCoursePermission',
        column: 'canCreateLiveSessions',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
'@ | Set-Content ".\migrations\app\20261003T1746_remove_live_sessions_manual\migration.ts"