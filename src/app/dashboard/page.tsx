'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSendTransaction, useWriteContract, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { parseEther, parseUnits } from 'viem';

// ERC-8004 Identity Registry ABI definition
const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "tokenURI",
        type: "string"
      }
    ],
    name: "register",
    outputs: [
      {
        internalType: "uint256",
        name: "agentId",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "agentId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "tokenURI",
        type: "string"
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "Registered",
    type: "event"
  }
] as const;

import { QRCodeSVG } from 'qrcode.react';
import { 
  localDB, 
  Employee, 
  PayrollBatch, 
  TransactionRecord, 
  AgentMetrics, 
  AppNotification, 
  INITIAL_EMPLOYEES,
  fetchEmployeesFromSupabase,
  saveEmployeeToSupabase,
  deleteEmployeeFromSupabase,
  fetchTransactionsFromSupabase,
  saveTransactionToSupabase
} from '@/lib/supabase';
import { getAgentMetrics, recordPayrollTransaction, generateTxHash } from '@/lib/agentWallet';
import { stableFlowAIChat, AIChatMessage, AIProposal } from '@/lib/ai';
import { STABLECOINS, ERC20_ABI } from '@/lib/web3';
import {
  Users,
  CreditCard,
  MessageSquare,
  History,
  BarChart2,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  FileDown,
  Upload,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Info,
  QrCode,
  Globe,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';

// Charts client-side only wrapper
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationTx, setRegistrationTx] = useState<string>('');
  const [registeredAgentId, setRegisteredAgentId] = useState<string>('');


  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'payroll' | 'ai-agent' | 'transactions' | 'analytics' | 'settings'>('overview');

  // DB State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    email: '',
    role: '',
    walletAddress: '',
    monthlySalary: 1000,
    paymentType: 'cUSD',
    country: 'United States',
    status: 'Active',
    category: 'Developer'
  });
  
  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // AI State
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Payroll Proposal State
  const [pendingProposal, setPendingProposal] = useState<AIProposal | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payProgress, setPayProgress] = useState<string[]>([]);
  const [selectedStablecoin, setSelectedStablecoin] = useState<'cUSD' | 'USDC' | 'CELO'>('cUSD');

  // MiniPay QR State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);

  // Search filter
  const [empSearch, setEmpSearch] = useState('');

  // Demo Sandbox state
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Hydrate client-side
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Initial localDB hydration for instant render
    setEmployees(localDB.getEmployees());
    setBatches(localDB.getPayrollBatches());
    setTransactions(localDB.getTransactions());
    setAgentMetrics(getAgentMetrics());
    setNotifications(localDB.getNotifications());

    // Sync from live Supabase connection
    const syncDb = async () => {
      const supEmps = await fetchEmployeesFromSupabase();
      if (supEmps && supEmps.length > 0) {
        setEmployees(supEmps);
        localDB.saveEmployees(supEmps);
      }
      const supTxs = await fetchTransactionsFromSupabase();
      if (supTxs && supTxs.length > 0) {
        setTransactions(supTxs);
        localDB.saveTransactions(supTxs);
      }
    };
    syncDb();
    
    // Check url search params for pre-loaded action
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setIsDemoMode(true);
      // Prompt initial welcome message from AI
      setChatMessages([
        {
          sender: 'agent',
          text: `Hello! I have preloaded the **StableFlow AI** demo environment with **5 pre-registered employees**.\n\nYou can manage them in the **Employees** tab or run payroll by speaking with me directly in this chat!\n\nTry prompting me: \`"Pay all engineering developers in cUSD"\``,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Update DB State & localDB
  const syncEmployees = (newEmpList: Employee[]) => {
    localDB.saveEmployees(newEmpList);
    setEmployees(newEmpList);
    setAgentMetrics(getAgentMetrics());
  };

  const syncTransactions = (newTxList: TransactionRecord[]) => {
    localDB.saveTransactions(newTxList);
    setTransactions(newTxList);
    setAgentMetrics(getAgentMetrics());
  };

  // Add Employee Handler
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.walletAddress || !newEmployee.monthlySalary) {
      alert('Please fill out all required fields.');
      return;
    }

    const employee: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmployee.name,
      email: newEmployee.email || `${newEmployee.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
      role: newEmployee.role || 'Contributor',
      walletAddress: newEmployee.walletAddress,
      monthlySalary: Number(newEmployee.monthlySalary),
      paymentType: newEmployee.paymentType as 'cUSD' | 'USDC' | 'CELO',
      country: newEmployee.country || 'Global',
      status: (newEmployee.status || 'Active') as 'Active' | 'Inactive',
      category: (newEmployee.category || 'Developer') as any,
    };

    const updated = [employee, ...employees];
    syncEmployees(updated);
    saveEmployeeToSupabase(employee);
    setShowAddModal(false);
    
    // Add Notification
    addNotification(`Added employee: ${employee.name} (${employee.role})`, 'success');
  };

  // Delete Employee Handler
  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      const updated = employees.filter(e => e.id !== id);
      syncEmployees(updated);
      deleteEmployeeFromSupabase(id);
      addNotification('Removed employee from payroll database.', 'info');
    }
  };

  // CSV Bulk Importer
  const handleCsvImport = () => {
    try {
      const lines = csvText.split('\n');
      const newEmployeesList: Employee[] = [];
      
      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('name')) return; // skip header
        if (!line.trim()) return;
        
        const cols = line.split(',');
        if (cols.length >= 4) {
          const name = cols[0].trim();
          const email = cols[1].trim();
          const role = cols[2].trim();
          const salary = parseFloat(cols[3].trim());
          const wallet = cols[4]?.trim() || '0x0000000000000000000000000000000000000000';
          const token = (cols[5]?.trim() || 'cUSD') as any;

          newEmployeesList.push({
            id: `emp-csv-${Date.now()}-${index}`,
            name,
            email,
            role,
            monthlySalary: isNaN(salary) ? 1000 : salary,
            walletAddress: wallet,
            paymentType: token,
            country: 'Global',
            status: 'Active',
            category: 'Developer'
          });
        }
      });

      if (newEmployeesList.length === 0) {
        alert('Invalid CSV format. Expected: Name,Email,Role,Salary,WalletAddress,Stablecoin');
        return;
      }

      const updated = [...newEmployeesList, ...employees];
      syncEmployees(updated);
      newEmployeesList.forEach(e => saveEmployeeToSupabase(e));
      setShowCsvModal(false);
      setCsvText('');
      addNotification(`Successfully imported ${newEmployeesList.length} employees from CSV.`, 'success');
    } catch (e) {
      alert('Error parsing CSV. Please review format.');
    }
  };

  // Send Notification Helper
  const addNotification = (message: string, type: 'info' | 'warning' | 'success') => {
    const list = localDB.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      type
    };
    const updated = [newNotif, ...list].slice(0, 10);
    localDB.saveNotifications(updated);
    setNotifications(updated);
  };

  // Register KIMO on ERC-8004 Identity Registry
  const handleRegisterKimo = async () => {
    setIsRegistering(true);
    setRegistrationTx('');
    setRegisteredAgentId('');
    
    try {
      if (!isConnected || !address) {
        alert('Please connect your Web3 wallet first.');
        return;
      }
      
      if (chainId !== 42220) {
        // Switch to Celo Mainnet
        try {
          await switchChainAsync({ chainId: 42220 });
        } catch (switchErr: any) {
          alert(`Please switch your wallet network to Celo Mainnet manually. Error: ${switchErr.message}`);
          setIsRegistering(false);
          return;
        }
      }

      const agentURI = `${window.location.origin}/api/agent-metadata`;
      
      addNotification('Initiating ERC-8004 Agent Registration...', 'info');

      const hash = await writeContractAsync({
        address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'register',
        args: [agentURI],
      });

      setRegistrationTx(hash);
      addNotification(`Registration broadcasted. Tx: ${hash.substring(0, 10)}...`, 'info');

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Find Registered event log to extract agentId
        let agentIdStr = '';
        
        // Loop logs to parse event
        for (const log of receipt.logs) {
          try {
            // Check Transfer topic
            const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            if (log.topics[0] === transferTopic) {
              const tokenIdHex = log.topics[3];
              if (tokenIdHex) {
                agentIdStr = BigInt(tokenIdHex).toString();
              }
            }
          } catch (logErr) {
            console.error('Error parsing log:', logErr);
          }
        }
        
        if (!agentIdStr) {
          agentIdStr = 'Registered';
        }

        setRegisteredAgentId(agentIdStr);
        addNotification(`KIMO Registered on-chain! Agent ID: ${agentIdStr}`, 'success');

        // Save to metrics
        if (agentMetrics) {
          const updatedMetrics = {
            ...agentMetrics,
            agentId: agentIdStr,
          };
          localDB.saveAgentMetrics(updatedMetrics);
          setAgentMetrics(updatedMetrics);
        }
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(`Registration failed: ${err.message || err}`);
    } finally {
      setIsRegistering(false);
    }
  };


  // Reset demo databases
  const handleResetData = () => {
    if (confirm('Reset payroll database to default 5 mock profiles?')) {
      localDB.saveEmployees(INITIAL_EMPLOYEES);
      localDB.saveTransactions([]);
      localDB.savePayrollBatches([]);
      setEmployees(INITIAL_EMPLOYEES);
      setTransactions([]);
      setBatches([]);
      setAgentMetrics(getAgentMetrics());
      addNotification('Database reset to demo state.', 'info');
    }
  };

  // AI Messaging Handler
  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || chatInput;
    if (!queryText.trim()) return;

    const userMsg: AIChatMessage = {
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: queryText,
          history: chatMessages,
          employees: employees
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI chat response');
      }

      const response = await res.json();
      
      setChatMessages(prev => [...prev, response]);
      
      if (response.proposal) {
        setPendingProposal(response.proposal);
        setSelectedStablecoin(response.proposal.stablecoin);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, {
        sender: 'agent',
        text: 'Sorry, I encountered an issue processing that query. Please try again later or check server configuration.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Execute Payroll Batch
  const handleExecutePayroll = async () => {
    if (!pendingProposal) return;
    setIsPaying(true);
    setPayProgress(['Starting payroll contract generation...', 'Initiating Celo network broadcast...']);

    const batchId = pendingProposal.batchId;
    const recipients = pendingProposal.recipients;

    try {
      if (isConnected && address) {
        setPayProgress(prev => [...prev, `Wallet connected: ${address.substring(0, 6)}...${address.substring(38)}`]);
        
        const hashes: string[] = [];
        
        for (let i = 0; i < recipients.length; i++) {
          const r = recipients[i];
          setPayProgress(prev => [
            ...prev, 
            `[${i + 1}/${recipients.length}] Preparing payment of ${r.amount} ${selectedStablecoin} to ${r.name}...`
          ]);

          try {
            let hash: `0x${string}`;
            if (selectedStablecoin === 'CELO') {
              hash = await sendTransactionAsync({
                to: r.walletAddress as `0x${string}`,
                value: parseEther(r.amount.toString()),
              });
            } else {
              const activeStablecoins = STABLECOINS[chainId as keyof typeof STABLECOINS] || STABLECOINS[44787];
              const token = activeStablecoins[selectedStablecoin as keyof typeof activeStablecoins];
              if (!token || !token.address) {
                throw new Error(`Token config not found for ${selectedStablecoin}`);
              }
              const parsedAmount = parseUnits(r.amount.toString(), token.decimals);
              
              hash = await writeContractAsync({
                address: token.address,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [r.walletAddress as `0x${string}`, parsedAmount],
              });
            }

            setPayProgress(prev => [...prev, `✓ Success! Tx: ${hash.substring(0, 10)}...`]);
            hashes.push(hash);

            // Log single recipient transaction record on chain
            const txRecord = recordPayrollTransaction(r.name, r.amount, selectedStablecoin, hash);
            await saveTransactionToSupabase(txRecord);

          } catch (itemErr: any) {
            console.error(`Error processing payment for ${r.name}:`, itemErr);
            setPayProgress(prev => [
              ...prev, 
              `⚠️ Transaction failed/rejected for ${r.name}: ${itemErr.message || 'Signature rejected'}`
            ]);
            throw itemErr;
          }
        }

        addNotification(`On-chain Payroll batch executed: ${pendingProposal.totalAmount} ${selectedStablecoin} distributed.`, 'success');

      } else {
        // Full Simulated Execution (No Wallet Connected)
        setPayProgress(prev => [...prev, 'Running in autonomous Agent Simulation Mode (no wallet connected)...']);
        await new Promise(r => setTimeout(r, 1000));
        setPayProgress(prev => [...prev, 'Deploying autonomous x402 payment agreement template...']);
        await new Promise(r => setTimeout(r, 1000));
        
        const simHash = generateTxHash();
        setPayProgress(prev => [...prev, `Batch execution broadcasted successfully. Transaction: ${simHash}`]);
        
        recipients.forEach(r => {
          const tx = recordPayrollTransaction(r.name, r.amount, selectedStablecoin, simHash);
          saveTransactionToSupabase(tx);
        });
        
        addNotification(`Autonomous Payroll batch #${batchId} completed.`, 'success');
      }

      // Record batch history
      const savedBatches = localDB.getPayrollBatches();
      const newBatch: PayrollBatch = {
        id: batchId,
        amount: pendingProposal.totalAmount,
        stablecoin: selectedStablecoin,
        timestamp: new Date().toISOString(),
        status: 'Executed',
        employeeCount: recipients.length,
        transactionHash: transactions[0]?.hash || generateTxHash(),
        recipients: recipients
      };
      localDB.savePayrollBatches([newBatch, ...savedBatches]);
      setBatches([newBatch, ...savedBatches]);

      // Complete
      setPayProgress(prev => [...prev, '🎉 Payroll cycle execution finished! Check transactions tab.']);
      setTransactions(localDB.getTransactions());
      setAgentMetrics(getAgentMetrics());
      setPendingProposal(null);

    } catch (err: any) {
      setPayProgress(prev => [...prev, `❌ Error executing batch: ${err.message || err}`]);
    } finally {
      setIsPaying(false);
    }
  };

  if (!isMounted) return null;

  if (!isConnected && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex flex-col justify-center items-center p-4">
        <div className="neo-card max-w-lg w-full bg-white p-8 space-y-6 text-center animate-pop-in">
          {/* Brand */}
          <div className="flex justify-center items-center gap-3 mb-2">
            <svg className="w-10 h-10 shrink-0 animate-spin" style={{ animationDuration: '8s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="#000000" />
              <circle cx="16" cy="16" r="11" fill="#FFD600" />
              <path d="M10 16 C 12 12, 14 12, 16 16 S 20 20, 22 16" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="16" r="3.5" fill="#B6FF00" stroke="#000000" strokeWidth="2" />
            </svg>
            <span className="text-3xl font-black tracking-tighter">StableFlow <span className="bg-[#B6FF00] text-black px-2 py-0.5 border-2 border-black text-xs font-mono">AI</span></span>
          </div>

          <h2 className="text-2xl font-black uppercase text-black">Secure Web3 Portal</h2>
          <p className="text-sm text-gray-600 leading-relaxed font-bold">
            Connect your corporate Web3 wallet to manage payroll distributions, inspect employee databases, and run AI commands.
          </p>

          <div className="bg-[#FFD600]/10 border-2 border-black p-4 text-xs text-left font-mono space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Celo Alfajores Testnet Supported</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Autonomous Payroll Automated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Supabase Database Connected</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <div className="scale-125 border-4 border-black p-2 bg-white shadow-neo">
              <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter employees
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.role.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F0F0F0] text-black overflow-hidden font-bold select-none">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 border-r-4 border-black bg-white flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b-4 border-black bg-[#FFD600] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-6 h-6 shrink-0 animate-spin" style={{ animationDuration: '8s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#000000" />
                <circle cx="16" cy="16" r="11" fill="#FFD600" />
                <path d="M10 16 C 12 12, 14 12, 16 16 S 20 20, 22 16" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="16" cy="16" r="3.5" fill="#B6FF00" stroke="#000000" strokeWidth="2" />
              </svg>
              <span className="text-xl font-extrabold tracking-tighter">StableFlow <span className="text-xs bg-black text-[#B6FF00] px-1 py-0.5 border border-black font-mono">AI</span></span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Globe },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'payroll', label: 'Payroll Engine', icon: CreditCard },
              { id: 'ai-agent', label: 'AI Chat Agent', icon: MessageSquare },
              { id: 'transactions', label: 'Transactions Log', icon: History },
              { id: 'analytics', label: 'Financial Analytics', icon: BarChart2 },
              { id: 'settings', label: 'Settings & Keys', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left p-3 flex items-center gap-3 border-2 border-black tab-transition ${
                    active 
                      ? 'bg-[#FFD600] translate-x-[-2px] translate-y-[-2px] shadow-neo-sm' 
                      : 'bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mini Agent Dashboard Widget */}
        <div className="m-4 p-4 bg-[#B6FF00] border-4 border-black shadow-neo-sm text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold">AGENT METRICS</span>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div className="space-y-1">
            <div>ID: <span className="underline">{agentMetrics?.agentId}</span></div>
            <div>TX Count: {agentMetrics?.transactionCount}</div>
            <div>Score: {agentMetrics?.activityScore}/100</div>
            <div>8004 Rank: #{agentMetrics?.ranking}</div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top bar */}
        <header className="h-20 border-b-4 border-black bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <span className="bg-[#FFD600] border-2 border-black p-1 text-xs">SF</span>
            <span className="font-extrabold">StableFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-[#F0F0F0] border-2 border-black px-3 py-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Celo Alfajores Testnet
            </span>
            <span className="text-gray-400">|</span>
            <span>Agent Wallet: <span className="underline">0xFE...Bd73</span></span>
          </div>

          {/* Quick Connect / Settings */}
          <div className="flex items-center gap-3 scale-90 md:scale-100">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-2 border-2 border-black hover:bg-[#B6FF00] bg-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tabs for mobile layout (hidden on desktop) */}
        <div className="md:hidden flex overflow-x-auto bg-white border-b-2 border-black font-mono text-xs p-2 gap-2 flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'employees', label: 'Employees' },
            { id: 'payroll', label: 'Payroll' },
            { id: 'ai-agent', label: 'AI Agent' },
            { id: 'transactions', label: 'TX' },
            { id: 'analytics', label: 'Charts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 border-2 border-black shrink-0 ${activeTab === tab.id ? 'bg-[#FFD600]' : 'bg-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Content Workspace */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* A. OVERVIEW VIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Headline Banner */}
              <div className="neo-card bg-[#FFD600] p-6 relative overflow-hidden animate-pop-in shadow-neo-lg">
                <h2 className="text-3xl md:text-4xl font-black mb-2 uppercase">StableFlow Command Center</h2>
                <p className="max-w-xl text-sm md:text-base">
                  Manage stablecoin distributions automatically using KIMO Personal AI Agent. Execute multi-token payroll batches directly on Celo Alfajores testnet.
                </p>
                <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none hidden md:block">
                  <Globe className="w-48 h-48" />
                </div>
              </div>

              {/* Main Content Grid: Left side metrics, Right side KIMO Chat */}
              <div className="grid lg:grid-cols-5 gap-6">
                
                {/* Left Side: Stats and Info (3/5 width) */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="neo-card neo-card-interactive p-4">
                      <div className="text-gray-500 text-xs mb-1 uppercase font-bold">Total Active Payroll</div>
                      <div className="text-2xl md:text-3xl font-black">
                        {employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.monthlySalary, 0).toLocaleString()} <span className="text-sm font-bold">cUSD</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">recurring monthly spend</div>
                    </div>

                    <div className="neo-card neo-card-interactive p-4">
                      <div className="text-gray-500 text-xs mb-1 uppercase font-bold">Employees Enrolled</div>
                      <div className="text-2xl md:text-3xl font-black">{employees.length}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{employees.filter(e => e.status === 'Active').length} Active | {employees.filter(e => e.status === 'Inactive').length} Inactive</div>
                    </div>

                    <div className="neo-card neo-card-interactive p-4 bg-[#B6FF00]/10">
                      <div className="text-gray-500 text-xs mb-1 uppercase font-bold">Onchain Executions</div>
                      <div className="text-2xl md:text-3xl font-black">{agentMetrics?.transactionCount}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">registered on 8004scan</div>
                    </div>

                    <div className="neo-card neo-card-interactive p-4 bg-[#FFD600]/10">
                      <div className="text-gray-500 text-xs mb-1 uppercase font-bold">Agent Health</div>
                      <div className="text-2xl md:text-3xl font-black text-green-600 flex items-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        {agentMetrics?.healthStatus}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">Telemetry OK</div>
                    </div>
                  </div>

                  {/* 8004scan panel */}
                  <div className="neo-card neo-card-interactive p-6 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-black pb-3">
                      <h3 className="text-lg font-black flex items-center gap-2 uppercase">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        8004Scan Agent Tracker
                      </h3>
                      <span className="bg-black text-[#B6FF00] font-mono text-xs px-2.5 py-1">
                        Rank #{agentMetrics?.ranking}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-bold leading-relaxed">
                      ERC-8004 standard registers autonomous agent telemetry directly to 8004scan.io, scoring performance by monthly payment volume and code verified integrations.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border-2 border-black p-3 bg-gray-50 font-mono text-xs space-y-1">
                        <div>Agent ID: <span className="underline">{agentMetrics?.agentId}</span></div>
                        <div>Wallet: <span className="underline">{agentMetrics?.walletAddress.substring(0, 8)}...</span></div>
                        <div>Telemetry: <span className="text-green-600 font-extrabold">Active</span></div>
                      </div>
                      <div className="border-2 border-black p-3 bg-gray-50 font-mono text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Activity Score:</span>
                          <span className="font-extrabold">{agentMetrics?.activityScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 border border-black">
                          <div 
                            className="bg-[#B6FF00] h-full border-r border-black" 
                            style={{ width: `${agentMetrics?.activityScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Target Explorer: http://8004scan.io</span>
                      <a 
                        href={`http://8004scan.io/agent/${agentMetrics?.agentId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="neo-btn-white py-1.5 px-3 flex items-center gap-1.5 text-xs text-black"
                      >
                        View on 8004scan
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                </div>

                {/* Right Side: Interactive KIMO Chat (2/5 width) */}
                <div className="lg:col-span-2 flex flex-col h-[520px] border-4 border-black bg-white shadow-neo-lg animate-pop-in">
                  
                  {/* Chat Header */}
                  <div className="p-4 border-b-4 border-black bg-[#B6FF00] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <img src="/kimo-logo.png" alt="KIMO Logo" className="w-8 h-8 rounded-full border-2 border-black shrink-0" />
                      <div>
                        <h3 className="font-extrabold uppercase text-sm leading-tight">KIMO</h3>
                        <span className="text-[10px] text-gray-600 font-bold block">Personal AI Agent</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Active
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F0F0F0]/30 font-mono text-xs">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-3">
                        <img src="/kimo-logo.png" alt="KIMO Logo" className="w-16 h-16 rounded-full border-4 border-black shadow-neo animate-bounce" style={{ animationDuration: '3s' }} />
                        <div>
                          <h4 className="font-black text-sm uppercase">KIMO Personalized Agent</h4>
                          <p className="text-gray-500 text-[10px] max-w-xs mt-1 leading-relaxed">
                            I am KIMO, your personal payroll assistant. Ask me to pay developers, generate proposals, or look up Celo documentation!
                          </p>
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        {msg.sender === 'agent' && (
                          <img src="/kimo-logo.png" alt="KIMO Avatar" className="w-6 h-6 rounded-full border border-black shrink-0 mt-1" />
                        )}
                        <div className="flex flex-col">
                          <div className={`p-3 border-2 border-black shadow-neo-sm text-left leading-relaxed ${
                            msg.sender === 'user' ? 'bg-[#B6FF00]' : 'bg-white'
                          }`}>
                            <p className="whitespace-pre-line font-medium text-black">
                              {msg.text}
                            </p>
                            
                            {msg.proposal && (
                              <div className="mt-3 border-t-2 border-black pt-2 space-y-1">
                                <span className="bg-black text-white text-[9px] px-1.5 py-0.5">BATCH #{msg.proposal.batchId} READY</span>
                                <div className="text-[10px] space-y-0.5">
                                  <div>Recipients: **{msg.proposal.recipients.length}**</div>
                                  <div>Volume: **{msg.proposal.totalAmount} {msg.proposal.stablecoin}**</div>
                                  <div>Gas Estimate: **{msg.proposal.estimatedGas} CELO**</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveTab('payroll');
                                  }}
                                  className="neo-btn py-1 px-2 text-[10px] w-full mt-2 inline-block text-center uppercase"
                                >
                                  Review & Execute Proposal →
                                </button>
                              </div>
                            )}
                          </div>
                          <span className={`text-[8px] text-gray-400 mt-0.5 font-mono ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {isAiLoading && (
                      <div className="flex items-center gap-1.5 p-2 bg-white border border-black w-fit font-bold text-[10px]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>KIMO is thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t-4 border-black bg-white flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Ask KIMO to pay designers..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      className="neo-input flex-1 font-bold text-xs bg-[#F0F0F0]/50 p-2"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      className="neo-btn px-4 uppercase text-xs"
                    >
                      Send ⚡
                    </button>
                  </div>

                </div>

              </div>

              {/* Feed & Faucets Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Notifications Log */}
                <div className="neo-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-black uppercase border-b-2 border-black pb-3 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Active Alerts & logs
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="border-2 border-black p-3 bg-white flex items-start gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          notif.type === 'warning' ? 'bg-orange-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></span>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-800">{notif.message}</p>
                          <span className="text-gray-400 font-mono">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testnet Celo Faucet card */}
                <div className="neo-card p-6 bg-[#FFD600]/10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-black uppercase border-b-2 border-black pb-3 mb-4">Alfajores Faucet</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Executing transactions requires test tokens. Open the official faucet to mint testnet CELO, cUSD, and USDC to your connected wallet.
                    </p>
                  </div>
                  <a 
                    href="https://faucet.celo.org/alfajores" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="neo-btn w-full py-3 text-center text-sm inline-block"
                  >
                    Get Test Tokens ⚡
                  </a>
                </div>

              </div>

            </div>
          )}

          {/* B. EMPLOYEES VIEW */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase">Freelancer & Employee database</h2>
                  <p className="text-sm text-gray-600">Register workers and inspect their wallet addresses and payment configurations.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => setShowAddModal(true)} className="neo-btn px-4 py-2 text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Worker
                  </button>
                  <button onClick={() => setShowCsvModal(true)} className="neo-btn-accent px-4 py-2 text-sm flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Import CSV
                  </button>
                  <button onClick={handleResetData} className="neo-btn-white px-4 py-2 text-sm flex items-center gap-1.5 text-red-600 border-red-600">
                    <RefreshCw className="w-4 h-4" /> Reset Demo
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search workers by name, role, or category..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="neo-input w-full pl-11 text-sm font-bold bg-white"
                />
              </div>

              {/* Employee table */}
              <div className="neo-card overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#F0F0F0] border-b-4 border-black font-extrabold">
                    <tr>
                      <th className="p-4 border-r-2 border-black">Name</th>
                      <th className="p-4 border-r-2 border-black">Role / Category</th>
                      <th className="p-4 border-r-2 border-black">Stablecoin</th>
                      <th className="p-4 border-r-2 border-black text-right">Salary</th>
                      <th className="p-4 border-r-2 border-black">Wallet Address</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                          No workers match your filter parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="row-hover-effect border-b border-black/10 transition-colors">
                          <td className="p-4 border-r-2 border-black">
                            <div>
                              <div className="font-extrabold text-base">{emp.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{emp.email}</div>
                            </div>
                          </td>
                          <td className="p-4 border-r-2 border-black">
                            <div>
                              <span className="bg-[#B6FF00]/10 border border-black text-[10px] uppercase font-mono px-2 py-0.5 rounded-none mr-2">
                                {emp.category}
                              </span>
                              <span className="font-semibold text-gray-700">{emp.role}</span>
                            </div>
                          </td>
                          <td className="p-4 border-r-2 border-black font-mono font-extrabold text-center">
                            <span className={`px-2 py-1 border-2 border-black ${
                              emp.paymentType === 'cUSD' ? 'bg-[#FFD600]/20' : emp.paymentType === 'USDC' ? 'bg-blue-100' : 'bg-[#B6FF00]/20'
                            }`}>
                              {emp.paymentType}
                            </span>
                          </td>
                          <td className="p-4 border-r-2 border-black text-right font-mono font-extrabold text-base">
                            {emp.monthlySalary.toLocaleString()}
                          </td>
                          <td className="p-4 border-r-2 border-black font-mono text-xs">
                            <span className="underline cursor-pointer" title={emp.walletAddress}>
                              {emp.walletAddress.substring(0, 6)}...{emp.walletAddress.substring(38)}
                            </span>
                          </td>
                          <td className="p-4 text-center space-x-2">
                            <button
                              onClick={() => {
                                setQrEmployee(emp);
                                setShowQrModal(true);
                              }}
                              className="px-2 py-1 border-2 border-black bg-white hover:bg-gray-100 text-xs inline-flex items-center gap-1"
                              title="Show QR Code for MiniPay"
                            >
                              <QrCode className="w-3.5 h-3.5" /> MiniPay
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="px-2 py-1 border-2 border-black bg-red-100 hover:bg-red-200 text-red-700 text-xs inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* C. PAYROLL VIEW */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              
              <div className="border-b-4 border-black pb-4">
                <h2 className="text-2xl md:text-3xl font-black uppercase">Celo Payroll Execution Engine</h2>
                <p className="text-sm text-gray-600">Review prepared batch proposals and approve smart contract distribution commands.</p>
              </div>

              {!pendingProposal ? (
                <div className="neo-card p-12 text-center space-y-6">
                  <div className="bg-[#FFD600] border-4 border-black w-20 h-20 flex items-center justify-center mx-auto shadow-neo rotate-[-3deg]">
                    <CreditCard className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold uppercase mb-2">No pending payroll proposals found</h3>
                    <p className="text-sm text-gray-600 max-w-lg mx-auto">
                      Go to the **AI Chat Agent** tab and describe the payroll batch you wish to distribute (e.g. "Pay all designers this Friday in USDC"). StableFlow AI will automatically assemble the proposal.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('ai-agent')} 
                    className="neo-btn px-6 py-3 uppercase text-sm"
                  >
                    Open Chat Agent 💬
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Recap */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="neo-card p-6 space-y-4">
                      <div className="flex justify-between items-center border-b-2 border-black pb-3">
                        <span className="font-extrabold uppercase text-gray-500 text-xs font-mono">BATCH ID: {pendingProposal.batchId}</span>
                        <span className="bg-black text-[#B6FF00] font-mono text-xs px-2 py-0.5">PENDING APPROVAL</span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-extrabold uppercase text-sm border-b border-black pb-1">Recipient list</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {pendingProposal.recipients.map((rec, i) => (
                            <div key={i} className="border-2 border-black p-3 bg-[#F0F0F0]/50 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-extrabold block text-sm">{rec.name}</span>
                                <span className="font-mono text-gray-500 block">{rec.walletAddress}</span>
                              </div>
                              <span className="font-mono font-black text-base bg-white border border-black px-2 py-0.5">{rec.amount} {selectedStablecoin}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Token Selector Override */}
                      <div className="space-y-2 pt-2 border-t-2 border-black">
                        <label className="text-xs uppercase font-extrabold text-gray-500">Override stablecoin distribution token</label>
                        <div className="flex gap-2">
                          {(['cUSD', 'USDC', 'CELO'] as const).map(tok => (
                            <button
                              key={tok}
                              onClick={() => {
                                setSelectedStablecoin(tok);
                                // Override in pending proposal
                                if (pendingProposal) {
                                  const updated = {
                                    ...pendingProposal,
                                    stablecoin: tok,
                                    recipients: pendingProposal.recipients.map(r => ({ ...r, token: tok }))
                                  };
                                  setPendingProposal(updated);
                                }
                              }}
                              className={`flex-1 py-2 border-2 border-black text-center text-sm ${
                                selectedStablecoin === tok ? 'bg-[#FFD600]' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              {tok}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Checklist & Actions */}
                  <div className="space-y-6">
                    <div className="neo-card p-6 bg-[#B6FF00]/10 space-y-4">
                      <h3 className="font-black text-lg uppercase border-b-2 border-black pb-2">Checkout Summary</h3>
                      
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between">
                          <span>Total Recipients:</span>
                          <span className="font-extrabold">{pendingProposal.recipients.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stablecoin:</span>
                          <span className="font-extrabold">{selectedStablecoin}</span>
                        </div>
                        <div className="flex justify-between border-b-2 border-black pb-2">
                          <span>Estimated Gas:</span>
                          <span className="font-extrabold">~{pendingProposal.estimatedGas.toFixed(3)} CELO</span>
                        </div>
                        <div className="flex justify-between pt-2 text-base font-extrabold text-black">
                          <span>Total Amount:</span>
                          <span>{pendingProposal.totalAmount.toLocaleString()} {selectedStablecoin}</span>
                        </div>
                      </div>

                      {/* Payment Progress Feed */}
                      {payProgress.length > 0 && (
                        <div className="border-2 border-black p-3 bg-white max-h-32 overflow-y-auto font-mono text-[10px] space-y-1">
                          {payProgress.map((prog, idx) => (
                            <div key={idx} className={prog.startsWith('❌') ? 'text-red-600' : prog.startsWith('🎉') ? 'text-green-600 font-bold' : 'text-gray-700'}>
                              {prog}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <button
                          onClick={handleExecutePayroll}
                          disabled={isPaying}
                          className="neo-btn w-full py-4 uppercase flex items-center justify-center gap-2 text-base font-black disabled:opacity-50"
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Executing...
                            </>
                          ) : (
                            <>⚡ Execute Payment</>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Cancel this payroll proposal?')) {
                              setPendingProposal(null);
                              setPayProgress([]);
                              addNotification('Payroll proposal discarded.', 'info');
                            }
                          }}
                          disabled={isPaying}
                          className="neo-btn-white w-full py-3 text-sm text-center text-red-600 border-red-600 disabled:opacity-50"
                        >
                          Cancel Batch
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* D. AI CHAT AGENT VIEW */}
          {activeTab === 'ai-agent' && (
            <div className="h-full flex flex-col justify-between overflow-hidden p-0 border-4 border-black bg-white">
              
              {/* Chat Header */}
              <div className="p-4 border-b-4 border-black bg-[#FFD600] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white px-2 py-0.5 font-mono text-xs">AGENT</span>
                  <h3 className="font-extrabold uppercase">StableFlow AI Agent CFO</h3>
                </div>
                <div className="text-xs font-mono flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  AI Engine Live
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F0F0F0]/30 font-mono text-xs md:text-sm">
                
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4">
                    <span className="bg-[#B6FF00] border-4 border-black p-4 text-4xl shadow-neo rotate-[2deg]">🤖</span>
                    <div>
                      <h4 className="font-black text-lg uppercase">StableFlow Payroll Assistant</h4>
                      <p className="text-gray-500 text-xs max-w-md mt-1">
                        Use natural language commands to control payroll execution. The agent evaluates salaries, verifies identities, and generates checkout proposals.
                      </p>
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                  >
                    <div className={`p-4 border-2 border-black shadow-neo-sm rounded-none text-left leading-relaxed ${
                      msg.sender === 'user' ? 'bg-[#B6FF00]' : 'bg-white'
                    }`}>
                      {/* Formatted markdown text manually rendered for MVP */}
                      <p className="whitespace-pre-line font-medium text-black">
                        {msg.text}
                      </p>
                      
                      {msg.proposal && (
                        <div className="mt-4 border-t-2 border-black pt-3 space-y-2">
                          <span className="bg-black text-white text-[10px] px-2 py-0.5">BATCH #{msg.proposal.batchId} READY</span>
                          <div className="text-xs space-y-1">
                            <div>Recipients: **{msg.proposal.recipients.length}**</div>
                            <div>Volume: **{msg.proposal.totalAmount} {msg.proposal.stablecoin}**</div>
                            <div>Gas Estimate: **{msg.proposal.estimatedGas} CELO**</div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('payroll');
                            }}
                            className="neo-btn py-1.5 px-3 text-xs w-full mt-2 inline-block text-center uppercase"
                          >
                            Review & Execute Proposal →
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                
                {isAiLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white border-2 border-black w-fit font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>AI CFO is compiling payroll metrics...</span>
                  </div>
                )}
              </div>

              {/* Shortcut buttons */}
              <div className="p-3 bg-white border-t-2 border-black flex gap-2 overflow-x-auto shrink-0 font-mono text-[10px]">
                {[
                  "Pay all developers in cUSD",
                  "Pay all designers in USDC",
                  "Run payroll for Charlie Brown",
                  "Tell me about ERC-8004 standard",
                  "How does MiniPay integration work?"
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(cmd)}
                    className="shrink-0 px-2.5 py-1.5 border-2 border-black hover:bg-[#FFD600] bg-white transition-colors"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t-4 border-black bg-white flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Ask agent: 'Pay all designers' or 'Show highest salary'..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="neo-input flex-1 font-bold text-sm bg-[#F0F0F0]/50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="neo-btn px-6 uppercase text-sm"
                >
                  Send ⚡
                </button>
              </div>

            </div>
          )}

          {/* E. TRANSACTIONS VIEW */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              
              <div className="border-b-4 border-black pb-4">
                <h2 className="text-2xl md:text-3xl font-black uppercase">Transaction Ledger & Explorer</h2>
                <p className="text-sm text-gray-600">Track and audit transaction logs matching your agent's payroll activities.</p>
              </div>

              {/* Tx lists */}
              <div className="neo-card">
                <div className="p-4 bg-[#F0F0F0] border-b-2 border-black flex items-center justify-between font-mono text-xs">
                  <span>SHOWING RECORD HISTORY</span>
                  <span>NETWORK: ALFAJORES</span>
                </div>
                
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b-2 border-black font-extrabold">
                    <tr>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Amount Distributed</th>
                      <th className="p-4">Celo Testnet Hash</th>
                      <th className="p-4 text-center">8004scan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 font-mono text-xs">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-500 font-bold">
                          No transactions recorded on Celo testnet yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-sm text-black">{tx.employeeName}</td>
                          <td className="p-4 text-gray-500">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}</td>
                          <td className="p-4 font-extrabold text-sm text-black">
                            {tx.amount} {tx.token}
                          </td>
                          <td className="p-4">
                            <a 
                              href={`https://alfajores.celoscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline flex items-center gap-1"
                            >
                              {tx.hash.substring(0, 10)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-4 text-center">
                            <a
                              href={`http://8004scan.io/agent/${agentMetrics?.agentId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 border border-black bg-[#B6FF00]/20 text-black rounded-none text-[10px]"
                            >
                              Track telemetry
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* F. ANALYTICS VIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="border-b-4 border-black pb-4">
                <h2 className="text-2xl md:text-3xl font-black uppercase">Financial & stablecoin Analytics</h2>
                <p className="text-sm text-gray-600">Review payroll expenditures, stablecoin ratio breakdowns, and agent score timelines.</p>
              </div>

              {/* Recharts widgets */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Payroll Distribution chart */}
                <div className="neo-card p-6">
                  <h3 className="text-base font-black uppercase border-b-2 border-black pb-2 mb-4">Stablecoin Payroll Weights</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'cUSD (Celo Dollar)', value: employees.filter(e => e.paymentType === 'cUSD').reduce((sum, e) => sum + e.monthlySalary, 0) },
                            { name: 'USDC (USD Coin)', value: employees.filter(e => e.paymentType === 'USDC').reduce((sum, e) => sum + e.monthlySalary, 0) },
                            { name: 'CELO Native', value: employees.filter(e => e.paymentType === 'CELO').reduce((sum, e) => sum + e.monthlySalary, 0) }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#FFD600" stroke="#000" strokeWidth={2} />
                          <Cell fill="#B6FF00" stroke="#000" strokeWidth={2} />
                          <Cell fill="#FFFFFF" stroke="#000" strokeWidth={2} />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#FFD600] border border-black"></span> cUSD</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#B6FF00] border border-black"></span> USDC</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-black"></span> CELO</span>
                  </div>
                </div>

                {/* Salary distribution bar */}
                <div className="neo-card p-6">
                  <h3 className="text-base font-black uppercase border-b-2 border-black pb-2 mb-4">Worker Salaries Matrix (Base Values)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={employees.map(e => ({ name: e.name, Salary: e.monthlySalary }))}
                        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#000" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip />
                        <Bar dataKey="Salary" fill="#B6FF00" stroke="#000" strokeWidth={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Historical timelines */}
              <div className="neo-card p-6">
                <h3 className="text-base font-black uppercase border-b-2 border-black pb-2 mb-4">Cashflow Projections & Insights</h3>
                <div className="p-4 bg-[#B6FF00]/10 border-2 border-black font-mono text-xs leading-relaxed space-y-2">
                  <div>💡 **Quarterly Runway Analysis**: Based on current staff metrics, quarterly spend stands at **{ (employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.monthlySalary, 0) * 3).toLocaleString() } cUSD**. Ensure sufficient reserve balances in your organization's delegate smart contracts.</div>
                  <div>💡 **MiniPay Adoption Metric**: Most of employee wallets are compatible with lightweight Opera Mini browser claimant protocols, lowering transaction failure risk.</div>
                </div>
              </div>

            </div>
          )}

          {/* G. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              
              <div className="border-b-4 border-black pb-4">
                <h2 className="text-2xl md:text-3xl font-black uppercase">Configuration Settings</h2>
                <p className="text-sm text-gray-600">Configure testnet wallet overrides and x402 settings.</p>
              </div>

              <div className="space-y-4">

                {/* Agent & Org Identity */}
                <div className="neo-card p-6 space-y-4">
                  <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2">ERC-8004 Agent Profile</h3>
                  
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                    <div>
                      <span className="block text-gray-400">ORGANIZATION ID</span>
                      <span className="font-extrabold text-sm">org-flow-99a</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">AGENT ID</span>
                      <span className="font-extrabold text-sm">{agentMetrics?.agentId}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">8004SCAN SYNC LEVEL</span>
                      <span className="font-extrabold text-sm text-green-600">Live Telemetry</span>
                    </div>
                  </div>
                </div>

                {/* On-Chain ERC-8004 Registration */}
                <div className="neo-card p-6 space-y-4">
                  <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    ERC-8004 Identity Registry
                  </h3>
                  
                  <p className="text-xs text-gray-600 leading-relaxed font-bold">
                    Register KIMO on-chain using the standard ERC-8004 AI Agent registry. This will mint an Identity NFT to your connected wallet, making KIMO discoverable and trackable on explorers like <span className="underline">agentscan.info</span>.
                  </p>

                  {!isConnected ? (
                    <div className="bg-[#FFD600]/10 border-2 border-black p-4 text-xs font-mono text-center">
                      Please connect your wallet at the top of the dashboard to register KIMO.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-black p-3 bg-gray-50 font-mono text-xs space-y-1">
                        <div>Connected Wallet: <span className="underline">{address}</span></div>
                        <div>Connected Network: <span className="font-extrabold">{chainId === 42220 ? 'Celo Mainnet' : chainId === 44787 ? 'Celo Alfajores Testnet' : 'Other Network'}</span></div>
                        {agentMetrics?.agentId && agentMetrics.agentId !== 'agent-8004-stableflow-x19' && (
                          <div className="text-green-600 font-extrabold mt-1">✓ KIMO is registered on-chain with Agent ID: {agentMetrics.agentId}</div>
                        )}
                      </div>

                      {chainId !== 42220 ? (
                        <div className="space-y-2">
                          <div className="bg-yellow-50 border-2 border-yellow-500 p-3 text-xs text-yellow-800 leading-relaxed">
                            ⚠️ **Registration Recommended on Celo Mainnet**:
                            You are connected to a testnet. To register KIMO on-chain so it indexes on agentscan.info explorer, switch your network to Celo Mainnet.
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await switchChainAsync({ chainId: 42220 });
                              } catch (e: any) {
                                alert(`Failed to switch network: ${e.message || e}`);
                              }
                            }}
                            className="w-full py-2.5 border-2 border-black hover:bg-[#FFD600] bg-white text-black font-extrabold uppercase text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-neo-sm"
                          >
                            Switch to Celo Mainnet ⚡
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleRegisterKimo}
                          disabled={isRegistering}
                          className="w-full py-3 border-4 border-black bg-[#B6FF00] hover:bg-[#a2e600] text-black font-extrabold uppercase text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-neo flex items-center justify-center gap-2"
                        >
                          {isRegistering ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-black" />
                              Registering KIMO on Celo...
                            </>
                          ) : (
                            'Register KIMO On-chain (Celo Mainnet) 🚀'
                          )}
                        </button>
                      )}

                      {registrationTx && (
                        <div className="border-2 border-black p-3 bg-indigo-50 font-mono text-[11px] space-y-1.5 animate-pop-in">
                          <div className="font-extrabold text-indigo-900">TRANSACTION BROADCASTED</div>
                          <div className="text-gray-600 break-all">
                            Hash: <a href={`https://celoscan.io/tx/${registrationTx}`} target="_blank" rel="noreferrer" className="underline text-blue-600 font-bold">{registrationTx}</a>
                          </div>
                          {isRegistering && <div className="text-indigo-600 animate-pulse font-bold">Waiting for block receipt confirmation...</div>}
                          {registeredAgentId && (
                            <div className="pt-2 border-t border-black/10 text-green-700 font-extrabold space-y-1.5">
                              <div>✓ REGISTRATION CONFIRMED!</div>
                              <div>Agent ID: {registeredAgentId}</div>
                              <div className="pt-1.5">
                                <a 
                                  href={`https://agentscan.info/agents?search=KIMO`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-black text-white px-2.5 py-1 text-[10px] rounded-none hover:bg-black/90"
                                >
                                  View on AgentScan
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="neo-card p-6 space-y-4">
                  <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 text-red-600">Danger Zone</h3>
                  <p className="text-xs text-gray-500">Resetting will purge employee databases and return variables to initial state.</p>
                  
                  <button 
                    onClick={handleResetData}
                    className="px-6 py-3 border-4 border-black bg-red-100 hover:bg-red-200 text-red-700 font-extrabold uppercase text-xs"
                  >
                    Wipe Database and Reload Defaults ⚠
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="neo-card p-6 max-w-lg w-full bg-white space-y-4">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Add New Worker</h3>
            
            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmployee.name || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    className="neo-input w-full"
                    placeholder="Alice Chen"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={newEmployee.email || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    className="neo-input w-full"
                    placeholder="alice@stableflow.ai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Role / Title</label>
                  <input
                    type="text"
                    value={newEmployee.role || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value }))}
                    className="neo-input w-full"
                    placeholder="Lead Developer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Category</label>
                  <select
                    value={newEmployee.category}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, category: e.target.value as any }))}
                    className="neo-input w-full"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Management">Management</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Monthly Salary *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newEmployee.monthlySalary || 1000}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, monthlySalary: Number(e.target.value) }))}
                    className="neo-input w-full font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-gray-700">Payment stablecoin</label>
                  <select
                    value={newEmployee.paymentType}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, paymentType: e.target.value as any }))}
                    className="neo-input w-full"
                  >
                    <option value="cUSD">cUSD (Celo Dollar)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                    <option value="CELO">CELO Native Token</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-gray-700">Celo Wallet Address *</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newEmployee.walletAddress || ''}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, walletAddress: e.target.value }))}
                  className="neo-input w-full font-mono text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button type="submit" className="neo-btn px-6 py-2.5 flex-1 uppercase">
                  Register Worker
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="neo-btn-white px-6 py-2.5 flex-1 uppercase"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="neo-card p-6 max-w-lg w-full bg-white space-y-4">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">CSV Importer</h3>
            <p className="text-xs text-gray-600">Paste raw CSV data matching format. Ensure headers match variables.</p>
            
            <div className="bg-gray-100 border-2 border-black p-3 font-mono text-[10px] space-y-1">
              <div>Name,Email,Role,Salary,WalletAddress,Stablecoin</div>
              <div>Alice Chen,alice@com.com,Developer,8500,0x70997970C51812dc3A010C7d01b50e0d17dc79C8,cUSD</div>
              <div>Bob Smith,bob@com.com,Designer,6200,0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,USDC</div>
            </div>

            <textarea
              placeholder="Name,Email,Role,Salary,WalletAddress,Stablecoin..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="neo-input w-full h-48 font-mono text-xs bg-white"
            ></textarea>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCsvImport} className="neo-btn px-6 py-2.5 flex-1 uppercase">
                Import CSV
              </button>
              <button
                onClick={() => setShowCsvModal(false)}
                className="neo-btn-white px-6 py-2.5 flex-1 uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MiniPay QR modal */}
      {showQrModal && qrEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="neo-card p-6 max-w-sm w-full bg-white space-y-4 text-center">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">MiniPay Claim Portal</h3>
            
            <div className="bg-white border-4 border-black p-4 inline-block shadow-neo mx-auto">
              <QRCodeSVG 
                value={`celo://transfer?to=${qrEmployee.walletAddress}&amount=${qrEmployee.monthlySalary}&token=${qrEmployee.paymentType}`} 
                size={200}
              />
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="font-extrabold text-sm">{qrEmployee.name}</div>
              <div className="text-gray-500">Claim Amount: **{qrEmployee.monthlySalary} {qrEmployee.paymentType}**</div>
              <div className="underline text-[10px] break-all">{qrEmployee.walletAddress}</div>
            </div>

            <div className="bg-[#B6FF00]/10 border-2 border-black p-3 text-[10px] text-left leading-relaxed">
              💡 **MiniPay Mobile Flow**: Scanning this QR code inside Opera Mini browser wallet instantly pre-fills the salary transfer transaction on Celo Alfajores Testnet.
            </div>

            <button
              onClick={() => {
                setShowQrModal(false);
                setQrEmployee(null);
              }}
              className="neo-btn w-full py-2.5 uppercase text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
