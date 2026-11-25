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
          offlineTransactionReceipt: tx.offlineTransactionReceipt,
          transaction: tx.transaction,
          // Only the uniquely named test wallet is changed. Real wallets are never updated.
          wallet: { update: args => tx.wallet.update({ ...args, where: { person } }) },
        }),
      } });
      const input = { id, transaction: { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25', keterangan: `integration-${id}` } };
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 201);
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 200);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 75000);
      assert.equal(await tx.transaction.count({ where: { id } }), 1);
      await tx.transaction.delete({ where: { id } });
      await tx.wallet.update({ where: { person }, data: { balance: { increment: 25000 } } });
      assert.equal((await delivery.deliverOfflineTransaction(input)).status, 200);
      assert.equal(await tx.transaction.count({ where: { id } }), 0);
      assert.equal((await tx.wallet.findUnique({ where: { person } })).balance, 100000);
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.offlineTransactionReceipt.count({ where: { id } }), 0);
  assert.equal(await prisma.wallet.count({ where: { person } }), 0);
  console.log('Database delivery check passed: lock, atomic receipt, duplicate replay and deletion replay; all fixtures rolled back.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
