#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/82f7e1ec81a6fe22223501d98d813c4958063b7f764a686f772fd3b210d563a1/contract';
import startContract from '../../snapshots/82f7e1ec81a6fe22223501d98d813c4958063b7f764a686f772fd3b210d563a1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract';
import endContract from '../../snapshots/dd45a0d2af30fbab69adc1fa0512521a8280a1aadd61e565959869da913ececd/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'trainerAvailability',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dayOfWeek', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endMinute', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('startMinute', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('timezone', 'text', {
            notNull: true,
            default: lit('Asia/Kolkata'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('trainerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'trainerAvailability_dayOfWeek_check_45d2c9c5',
            "\"dayOfWeek\" IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'trainerAvailability',
        constraint: 'trainerAvailability_trainerId_dayOfWeek_startMinute_endMinute_key',
        columns: ['trainerId', 'dayOfWeek', 'startMinute', 'endMinute'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerAvailability',
        index: 'trainerAvailability_trainerId_dayOfWeek_idx_764badcc',
        columns: ['trainerId', 'dayOfWeek'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerAvailability',
        index: 'trainerAvailability_trainerId_idx_3e70f981',
        columns: ['trainerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'trainerAvailability',
        index: 'trainerAvailability_trainerId_isActive_idx_d3b35e8a',
        columns: ['trainerId', 'isActive'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'trainerAvailability',
        foreignKey: {
          name: 'trainerAvailability_trainerId_fkey',
          columns: ['trainerId'],
          references: { schema: 'public', table: 'trainerProfile', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
