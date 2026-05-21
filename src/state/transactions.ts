export type TransactionSource = "human" | "agent";

export type Transaction = {
  id: string;
  description: string;
  timestamp: string;
  source: TransactionSource;
  patchId?: string;
  providerId?: string;
  modelId?: string;
  operationCount?: number;
};

let _counter = 0;

export const createTransaction = (
  description: string,
  source: TransactionSource = "human",
  metadata: Partial<Omit<Transaction, "id" | "description" | "timestamp" | "source">> = {},
): Transaction => {
  const id = `T-${String(++_counter).padStart(3, "0")}`;
  return { id, description, timestamp: new Date().toISOString(), source, ...metadata };
};

export const resetTransactionCounter = (): void => {
  _counter = 0;
};
