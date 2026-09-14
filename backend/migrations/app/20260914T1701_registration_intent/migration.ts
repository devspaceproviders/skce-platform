#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/89c41455328fdf995ff42328a1fb1426b3206fa93ad1fba3599c7c409beb449a/contract';
import endContract from '../../snapshots/89c41455328fdf995ff42328a1fb1426b3206fa93ad1fba3599c7c409beb449a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e69b4f7b53ed2545d17fb3d777d4b04c9663793925ced55f48a813bdf960d66a/contract';
import startContract from '../../snapshots/e69b4f7b53ed2545d17fb3d777d4b04c9663793925ced55f48a813bdf960d66a/contract.json' with { type: 'json' };
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
        table: 'registrationIntent',
        columns: [
          col('courseId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('packageId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('razorpayOrderId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referralId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('CREATED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'registrationIntent_status_check_0feaa862',
            "\"status\" IN ('CREATED', 'PAID', 'EXPIRED', 'FAILED')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment',
        column: col('registrationIntentId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'payment', column: 'userId' }),
      this.addUnique({
        schema: 'public',
        table: 'payment',
        constraint: 'payment_registrationIntentId_key',
        columns: ['registrationIntentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registrationIntent',
        index: 'registrationIntent_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registrationIntent',
        index: 'registrationIntent_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registrationIntent',
        index: 'registrationIntent_packageId_idx_51f866f4',
        columns: ['packageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registrationIntent',
        index: 'registrationIntent_razorpayOrderId_idx_8bcabcd5',
        columns: ['razorpayOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'registrationIntent',
        index: 'registrationIntent_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'registrationIntent',
        foreignKey: {
          name: 'registrationIntent_packageId_fkey',
          columns: ['packageId'],
          references: { schema: 'public', table: 'coursePackage', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'registrationIntent',
        foreignKey: {
          name: 'registrationIntent_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment',
        foreignKey: {
          name: 'payment_registrationIntentId_fkey',
          columns: ['registrationIntentId'],
          references: { schema: 'public', table: 'registrationIntent', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
