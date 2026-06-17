import { createClient } from '@supabase/supabase-js';

// Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  walletAddress: string;
  monthlySalary: number; // in token unit
  paymentType: 'cUSD' | 'USDC' | 'CELO';
  country: string;
  status: 'Active' | 'Inactive';
  category: 'Designer' | 'Developer' | 'Contractor' | 'Management' | 'Other';
}

export interface PayrollBatch {
  id: string;
  amount: number;
  stablecoin: 'cUSD' | 'USDC' | 'CELO';
  timestamp: string;
  status: 'Pending' | 'Executed' | 'Cancelled';
  employeeCount: number;
  transactionHash?: string;
  recipients: { employeeId: string; name: string; walletAddress: string; amount: number }[];
}

export interface TransactionRecord {
  id: string;
  employeeName: string;
  amount: number;
  token: 'cUSD' | 'USDC' | 'CELO';
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
  hash: string;
}

export interface AgentMetrics {
  agentId: string;
  organizationId: string;
  walletAddress: string;
  transactionCount: number;
  activityScore: number;
  ranking: number;
  name: string;
  healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Critical';
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
}

// Initial Demo Employees Data
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Alice Chen',
    email: 'alice@stableflow.ai',
    role: 'Lead Blockchain Developer',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    monthlySalary: 8500,
    paymentType: 'cUSD',
    country: 'United States',
    status: 'Active',
    category: 'Developer',
  },
  {
    id: 'emp-2',
    name: 'Bob Smith',
    email: 'bob@stableflow.ai',
    role: 'Senior UI/UX Designer',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    monthlySalary: 6200,
    paymentType: 'USDC',
    country: 'Canada',
    status: 'Active',
    category: 'Designer',
  },
  {
    id: 'emp-3',
    name: 'Charlie Brown',
    email: 'charlie@stableflow.ai',
    role: 'Technical Writer',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    monthlySalary: 3500,
    paymentType: 'CELO',
    country: 'United Kingdom',
    status: 'Active',
    category: 'Contractor',
  },
  {
    id: 'emp-4',
    name: 'Diana Prince',
    email: 'diana@stableflow.ai',
    role: 'Product Owner',
    walletAddress: '0x15d34AAf54a67C68101F40973C648B3e52A77284',
    monthlySalary: 7800,
    paymentType: 'cUSD',
    country: 'Germany',
    status: 'Active',
    category: 'Management',
  },
  {
    id: 'emp-5',
    name: 'Evan Wright',
    email: 'evan@stableflow.ai',
    role: 'QA Engineer',
    walletAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    monthlySalary: 4800,
    paymentType: 'USDC',
    country: 'France',
    status: 'Inactive',
    category: 'Developer',
  }
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Unified client-side LocalStorage DB for fallback operations
class LocalStorageDB {
  private get<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    const item = localStorage.getItem(key);
    if (!item) {
      this.set(key, defaultVal);
      return defaultVal;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  }

  getEmployees(): Employee[] {
    return this.get<Employee[]>('stableflow_employees', INITIAL_EMPLOYEES);
  }

  saveEmployees(employees: Employee[]) {
    this.set('stableflow_employees', employees);
  }

  getPayrollBatches(): PayrollBatch[] {
    return this.get<PayrollBatch[]>('stableflow_batches', []);
  }

  savePayrollBatches(batches: PayrollBatch[]) {
    this.set('stableflow_batches', batches);
  }

  getTransactions(): TransactionRecord[] {
    return this.get<TransactionRecord[]>('stableflow_transactions', []);
  }

  saveTransactions(transactions: TransactionRecord[]) {
    this.set('stableflow_transactions', transactions);
  }

  getAgentMetrics(): AgentMetrics {
    const defaultMetrics: AgentMetrics = {
      agentId: 'agent-8004-stableflow-x19',
      organizationId: 'org-flow-99a',
      walletAddress: '0xFE3B557E8FB62b89F4916B721be55cEb828dBd73',
      transactionCount: 14,
      activityScore: 88,
      ranking: 12,
      name: 'StableFlow payroll agent',
      healthStatus: 'Excellent'
    };
    return this.get<AgentMetrics>('stableflow_agent_metrics', defaultMetrics);
  }

  saveAgentMetrics(metrics: AgentMetrics) {
    this.set('stableflow_agent_metrics', metrics);
  }

  getNotifications(): AppNotification[] {
    const defaultNotifs: AppNotification[] = [
      { id: '1', message: 'June payroll cycle is due in 3 days.', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'warning' },
      { id: '2', message: 'StableFlow AI health status checked: 100% operational.', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'success' }
    ];
    return this.get<AppNotification[]>('stableflow_notifications', defaultNotifs);
  }

  saveNotifications(notifs: AppNotification[]) {
    this.set('stableflow_notifications', notifs);
  }
}

export const localDB = new LocalStorageDB();

// Live Supabase Sync Helpers
export async function fetchEmployeesFromSupabase(): Promise<Employee[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        walletAddress: item.wallet_address,
        monthlySalary: Number(item.monthly_salary),
        paymentType: item.payment_type,
        country: item.country,
        status: item.status,
        category: item.category
      }));
    }
  } catch (err) {
    console.error('Supabase fetch employees error:', err);
  }
  return null;
}

export async function saveEmployeeToSupabase(emp: Employee) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('employees').upsert({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      wallet_address: emp.walletAddress,
      monthly_salary: emp.monthlySalary,
      payment_type: emp.paymentType,
      country: emp.country,
      status: emp.status,
      category: emp.category
    });
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save employee error:', err);
  }
}

export async function deleteEmployeeFromSupabase(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase delete employee error:', err);
  }
}

export async function fetchTransactionsFromSupabase(): Promise<TransactionRecord[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    if (data) {
      return data.map((item: any) => ({
        id: item.id,
        employeeName: item.employee_name,
        amount: Number(item.amount),
        token: item.token,
        date: item.date,
        status: item.status,
        hash: item.hash
      }));
    }
  } catch (err) {
    console.error('Supabase fetch transactions error:', err);
  }
  return null;
}

export async function saveTransactionToSupabase(tx: TransactionRecord) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('transactions').upsert({
      id: tx.id,
      employee_name: tx.employeeName,
      amount: tx.amount,
      token: tx.token,
      date: tx.date,
      status: tx.status,
      hash: tx.hash
    });
    if (error) throw error;
  } catch (err) {
    console.error('Supabase save transaction error:', err);
  }
}

