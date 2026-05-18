export type TransactionSource = "human" | "agent";

export type Transaction = {
  id: string;
  description: string;
  timestamp: string;
  source: TransactionSource;
};

let _counter = 0;

export const createTransaction = (
  description: string,
  source: TransactionSource = "human",
): Transaction => {
  const id = `T-${String(++_counter).padStart(3, "0")}`;
  return { id, description, timestamp: new Date().toISOString(), source };
};

export const resetTransactionCounter = (): void => {
  _counter = 0;
};
