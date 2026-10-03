#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/665a867a3d8c450e7b5ba6f98c2145d2305a8118e3e10e14e850fdd0ed6d125b/contract';
import startContract from '../../snapshots/665a867a3d8c450e7b5ba6f98c2145d2305a8118e3e10e14e850fdd0ed6d125b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bb03663bcf7a85c20efefda60c87baae9e62aff7da3970a7909478a94088ead0/contract';
import endContract from '../../snapshots/bb03663bcf7a85c20efefda60c87baae9e62aff7da3970a7909478a94088ead0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'trainerActivity',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actorUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entityId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('entityType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('metadata', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('trainerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerActivity',
        index: 'trainerActivity_action_idx_cd0d2116',
        columns: ['action'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerActivity',
        index: 'trainerActivity_actorUserId_idx_96dac96c',
        columns: ['actorUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerActivity',
        index: 'trainerActivity_entityType_entityId_idx_ea0fa809',
        columns: ['entityType', 'entityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerActivity',
        index: 'trainerActivity_trainerId_createdAt_idx_992fa8db',
        columns: ['trainerId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerActivity',
        index: 'trainerActivity_trainerId_idx_3e70f981',
        columns: ['trainerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trainerActivity',
        foreignKey: {
          name: 'trainerActivity_trainerId_fkey',
          columns: ['trainerId'],
          references: { schema: 'public', table: 'trainerProfile', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trainerActivity',
        foreignKey: {
          name: 'trainerActivity_actorUserId_fkey',
          columns: ['actorUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
