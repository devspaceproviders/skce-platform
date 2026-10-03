#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4f6d095e811702a72f3d5f00b87a47e0732a7ab557f4519c4a7b5705a839d439/contract';
import endContract from '../../snapshots/4f6d095e811702a72f3d5f00b87a47e0732a7ab557f4519c4a7b5705a839d439/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/91eddf436ff00b1b5f8e34f4bb5ce1a3b156d54e7bc57ec631bbfac059f73c3f/contract';
import startContract from '../../snapshots/91eddf436ff00b1b5f8e34f4bb5ce1a3b156d54e7bc57ec631bbfac059f73c3f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'certificate',
        constraint: 'certificate_enrollmentId_key',
      }),
      this.addColumn({
        schema: 'public',
        table: 'certificate',
        column: col('certificateType', 'text', {
          notNull: true,
          default: lit('COURSE'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'certificate',
        column: col('packageId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'certificate', column: 'courseId' }),
      this.createIndex({
        schema: 'public',
        table: 'certificate',
        index: 'certificate_certificateType_idx_175a7841',
        columns: ['certificateType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'certificate',
        index: 'certificate_packageId_idx_51f866f4',
        columns: ['packageId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'certificate',
        foreignKey: {
          name: 'certificate_packageId_fkey',
          columns: ['packageId'],
          references: { schema: 'public', table: 'coursePackage', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
