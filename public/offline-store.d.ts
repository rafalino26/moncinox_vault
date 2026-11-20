export type StoredSnapshot<T> = { version: 1; updatedAt: number; data: T };
export type FinancePersistence<T> = {
  read(): Promise<StoredSnapshot<T> | undefined>;
  write(record: StoredSnapshot<T>): Promise<unknown>;
};
export function createFinancePersistence<T>(key: 'wallets' | 'transactions' | 'income'): FinancePersistence<T> & { clear(): Promise<unknown> };
export function validRecord(key: string, record: unknown): boolean;
