import { localDB, AgentMetrics, TransactionRecord } from './supabase';

/**
 * Returns the current ERC-8004 Agent Wallet metadata and metrics
 */
export function getAgentMetrics(): AgentMetrics {
  const metrics = localDB.getAgentMetrics();
  const transactions = localDB.getTransactions();
  
  // Dynamic calculation based on transaction history
  const count = transactions.length + 14; // Seed base transactions
  const activityScore = Math.min(100, 70 + transactions.length * 5);
  const ranking = Math.max(1, 15 - Math.floor(transactions.length / 2));
  
  const updatedMetrics: AgentMetrics = {
    ...metrics,
    transactionCount: count,
    activityScore,
    ranking,
    healthStatus: transactions.length > 0 ? 'Excellent' : 'Good'
  };
  
  localDB.saveAgentMetrics(updatedMetrics);
  return updatedMetrics;
}

/**
 * Logs a new payroll transaction and updates activity scores
 */
export function recordPayrollTransaction(
  employeeName: string,
  amount: number,
  token: 'cUSD' | 'USDC' | 'CELO',
  hash: string
): TransactionRecord {
  const transactions = localDB.getTransactions();
  
  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    employeeName,
    amount,
    token,
    date: new Date().toISOString(),
    status: 'Success',
    hash
  };
  
  localDB.saveTransactions([newTx, ...transactions]);
  
  // Trigger metrics update
  getAgentMetrics();
  
  return newTx;
}

/**
 * Generate a pseudo-random hash to simulate Celo testnet transactions
 * in fallback mode or if the wallet is in simulated execution.
 */
export function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
