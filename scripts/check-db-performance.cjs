const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');
const { performance } = require('node:perf_hooks');

loadEnvConfig(process.cwd());
const db = new PrismaClient({ log: [] });

async function measure(label, query) {
  const started = performance.now();
  const rows = await query();
  console.log(JSON.stringify({ query: label, ms: Math.round(performance.now() - started), rows: rows.length,
    jsonBytes: Buffer.byteLength(JSON.stringify(rows)) }));
}

async function main() {
  // Read only. Log counts, payload sizes, and timings without financial records or credentials.
  for (const pass of ['cold', 'warm']) {
    await Promise.all([
      measure(`${pass}:wallets`, () => db.wallet.findMany()),
      measure(`${pass}:transactions`, () => db.transaction.findMany({ orderBy: { createdAt: 'desc' } })),
      measure(`${pass}:income`, () => db.pemasukan.findMany({ orderBy: { createdAt: 'desc' } })),
    ]);
  }
}

main().catch(error => {
  console.error('Database check failed:', error.code || error.name);
  console.error(String(error.message).replace(/postgres(?:ql)?:\/\/\S+/gi, '[connection redacted]'));
  process.exitCode = 1;
}).finally(() => db.$disconnect());
