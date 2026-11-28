// Explicit database check: every fixture is created inside one transaction and rolled back.
// Run separately: node --env-file=.env tests/offline-delivery.integration.cjs
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const loadModule = require('./helpers/load-ts.cjs');
const prisma = new PrismaClient();
const id = randomUUID();
const person = `offline-test-${id}`;
const rollback = new Error('ROLLBACK_TEST_FIXTURES');

(async () => {
  try {
    await prisma.$transaction(async tx => {
      await tx.wallet.create({ data: { person, balance: 100000 } });
      const delivery = loadModule('src/app/lib/offline-delivery.ts', { './prisma': {
        $transaction: callback => callback({
          $executeRaw: (...args) => tx.$executeRaw(...args),
          $queryRaw: (...args) => tx.$queryRaw(...args),
          offlineTransactionReceipt: tx.offlineTransactionReceipt,
          transaction: tx.transaction,
          pemasukan: tx.pemasukan,
          // Only the uniquely named test wallet is changed. Real wallets are never updated.
          wallet: { update: args => tx.wallet.update({ ...args, where: { person } }) },
        }),
      } });
      const input = { id, transaction: { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25', keterangan: `integration-${id}` } };
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 201);
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 200);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 75000);
      assert.equal(await tx.transaction.count({ where: { id } }), 1);
      const edit = { id: randomUUID(), kind: 'update', target: { id, expected: input.transaction }, transaction: { ...input.transaction, jumlah: 40000 } };
      assert.equal((await delivery.deliverOfflineTransaction(edit)).status, 201);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 60000);
      assert.equal((await delivery.deliverOfflineTransaction(edit)).status, 200);
      const remove = { id: randomUUID(), kind: 'delete', transaction: edit.transaction, target: { id, expected: edit.transaction } };
      assert.equal((await delivery.deliverOfflineTransaction(remove)).status, 201);
      assert.equal((await delivery.deliverOfflineTransaction(remove)).status, 200);
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 200);
      assert.equal(await tx.transaction.count({ where: { id } }), 0);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 100000);
      const income = { id: randomUUID(), kind: 'income-create', transaction: input.transaction };
      assert.equal((await delivery.deliverOfflineTransaction(income)).status, 201);
      assert.equal((await delivery.deliverOfflineTransaction(income)).status, 200);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 125000);
      const deleteIncome = { id: randomUUID(), kind: 'income-delete', transaction: income.transaction, target: { id: income.id, expected: income.transaction } };
      assert.equal((await delivery.deliverOfflineTransaction(deleteIncome)).status, 201);
      assert.equal((await delivery.deliverOfflineTransaction(deleteIncome)).status, 200);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 100000);
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.offlineTransactionReceipt.count({ where: { id } }), 0);
  assert.equal(await prisma.wallet.count({ where: { person } }), 0);
  console.log('Database delivery check passed: lock, atomic receipt, duplicate replay and deletion replay; all fixtures rolled back.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
