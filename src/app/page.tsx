'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { 
  Terminal, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Database, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  const faqs = [
    {
      q: "How does the AI Agent process payroll payments?",
      a: "StableFlow AI uses natural language understanding (backed by OpenRouter API with offline backup rules) to parse commands like 'Pay all designers 500 cUSD'. It scans the employee database, queries the Celopedia database for gas optimizations, builds a standard ERC-8004 batch proposal, and presents the onchain transaction for your final approval. Payments are sent directly to the employees' wallets on the Celo Alfajores Testnet."
    },
    {
      q: "What stablecoins are supported?",
      a: "Currently, we fully support cUSD (Celo Dollar), USDC (USD Coin), and CELO (Celo native utility token). You can configure individual salaries in specific tokens or override the token for the entire batch during checkout."
    },
    {
      q: "What is the ERC-8004 Agent Standard?",
      a: "ERC-8004 is a standard for autonomous AI Agent wallets on Celo. It separates user control from agent execution logic. When StableFlow AI creates a batch, it uploads metadata to 8004scan, allowing public auditing of your agent's transaction volume, ranking, and activity score."
    },

    {
      q: "Can my team receive payouts on their phones?",
      a: "Yes! StableFlow AI is built mobile-first and fully integrated with MiniPay. When executing payroll, employees receive cUSD stablecoins directly in their Opera Mini browser wallet instantly and with sub-cent gas fees."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0] text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#F0F0F0] border-b-4 border-black px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 shrink-0 animate-spin" style={{ animationDuration: '6s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#000000" />
            <circle cx="16" cy="16" r="11" fill="#FFD600" />
            <path d="M10 16 C 12 12, 14 12, 16 16 S 20 20, 22 16" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3.5" fill="#B6FF00" stroke="#000000" strokeWidth="2" />
          </svg>
          <span className="font-extrabold text-2xl tracking-tighter">StableFlow <span className="bg-[#B6FF00] text-black px-1.5 py-0.5 border-2 border-black text-xs font-mono">AI</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-bold">
          <a href="#how-it-works" className="hover:text-[#FFD600] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#FFD600] transition-colors">Features</a>
          <a href="#why-celo" className="hover:text-[#FFD600] transition-colors">Why Celo</a>
          <a href="#faq" className="hover:text-[#FFD600] transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="scale-90 md:scale-100">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-24 px-4 lg:px-8 bg-[#FFD600] border-b-4 border-black flex flex-col items-center text-center animate-pop-in">
        <div className="max-w-4xl">
          <div className="inline-block bg-black text-[#B6FF00] font-extrabold px-4 py-1.5 border-2 border-black mb-6 rotate-[-1deg] text-sm md:text-base animate-pulse">
            🚀 ENTERPRISE STABLECOIN SETTLEMENT AGENT
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none mb-6 animate-slide-up">
            PAYROLL POWERED BY<br/>
            <span className="bg-[#FFFFFF] px-4 py-1 inline-block border-4 border-black mt-2 shadow-neo rotate-[1deg]">AI AGENTS</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-10 text-black/85">
            Pay global freelancers using Celo stablecoins with a single natural language prompt. Autonomous accounting meets instant testnet execution.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up">
            <button
              onClick={() => {
                if (isConnected) {
                  router.push('/dashboard');
                } else if (openConnectModal) {
                  openConnectModal();
                }
              }}
              className="neo-btn text-lg px-10 py-5 flex items-center justify-center gap-2"
            >
              <Wallet className="w-6 h-6" />
              {isConnected ? 'Enter Workspace' : 'Connect Corporate Wallet'}
            </button>
          </div>
        </div>

        {/* Visual Teaser */}
        <div className="mt-12 w-full max-w-4xl bg-white border-4 border-black shadow-neo-lg p-3 text-left">
          <div className="bg-black text-[#B6FF00] p-3 font-mono text-sm flex items-center justify-between border-b-2 border-black">
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <span>KIMO Personalized AI Agent Chat</span>
            <span className="text-xs text-white/50">Celo Alfajores Testnet</span>
          </div>
          <div className="p-4 bg-white font-mono space-y-4 text-xs md:text-sm">
            <div className="text-gray-500">&gt; Prompt: "Pay all designers this Friday in cUSD stablecoins"</div>
            <div className="text-black font-semibold flex items-start gap-2 bg-[#B6FF00]/20 p-3 border-2 border-black">
              <span className="bg-black text-white p-1 font-bold text-[10px]">AI</span>
              <div>
                <strong>Proposal Generated (Batch #3884):</strong> Found 1 active designer (Bob Smith - 6,200 cUSD). <br/>
                Onchain wallet validation verified via <strong>ERC-8004 Standard</strong>. Ready to transfer 6,200 cUSD. <br/>
                <span className="text-[#0052FF] underline cursor-pointer">Preview approval payload...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MiniPay Bar */}
      <section className="bg-black text-white py-4 px-4 overflow-hidden border-b-4 border-black">
        <div className="flex flex-wrap justify-around gap-6 items-center font-black text-center tracking-widest text-[#B6FF00] uppercase text-xs md:text-sm">
          <span>⚡ RUNNING ON CELO ALFAJORES</span>
          <span>⚡ INTEGRATED WITH MINIPAY</span>
          <span>⚡ COMPLIANT WITH ERC-8004</span>
          <span>⚡ PERSONALIZED KIMO AGENT</span>
          <span>⚡ POWERED BY OPENROUTER AI</span>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8 border-b-4 border-black bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 text-center uppercase">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
            <div className="neo-card neo-card-interactive p-6 flex flex-col justify-between h-full">
              <div>
                <div className="bg-[#FFD600] border-4 border-black w-14 h-14 flex items-center justify-center font-black text-2xl shadow-neo-sm mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Add Employee Profiles</h3>
                <p className="text-gray-700 text-sm">
                  Add workers manually or import a CSV list of names, roles, Celo testnet wallet addresses, stablecoin selections, and salary amounts.
                </p>
              </div>
              <div className="border-t-2 border-black mt-6 pt-4 flex items-center gap-2 text-xs font-mono text-gray-500">
                <Database className="w-4 h-4 text-black" />
                Supabase / LocalStorage
              </div>
            </div>

            <div className="neo-card neo-card-interactive p-6 flex flex-col justify-between h-full bg-[#B6FF00]/10">
              <div>
                <div className="bg-[#B6FF00] border-4 border-black w-14 h-14 flex items-center justify-center font-black text-2xl shadow-neo-sm mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Prompt the AI CFO</h3>
                <p className="text-gray-700 text-sm">
                  Ask the AI Agent to prepare a payout list using plain English: e.g., "Pay everyone except contractors." The agent filters employees and drafts a proposal.
                </p>
              </div>
              <div className="border-t-2 border-black mt-6 pt-4 flex items-center gap-2 text-xs font-mono text-gray-500">
                <Terminal className="w-4 h-4 text-black" />
                Natural Language Parser
              </div>
            </div>

            <div className="neo-card neo-card-interactive p-6 flex flex-col justify-between h-full bg-[#FFD600]/10">
              <div>
                <div className="bg-[#FFD600] border-4 border-black w-14 h-14 flex items-center justify-center font-black text-2xl shadow-neo-sm mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Sign Onchain Payout</h3>
                <p className="text-gray-700 text-sm">
                  Review the totals, check the gas estimations, and click Approve to execute the transactions via your connected wallet onto Celo Alfajores.
                </p>
              </div>
              <div className="border-t-2 border-black mt-6 pt-4 flex items-center gap-2 text-xs font-mono text-gray-500">
                <ShieldCheck className="w-4 h-4 text-black" />
                Viem & RainbowKit Connectors
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 lg:px-8 border-b-4 border-black bg-[#F0F0F0]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 text-center uppercase">
            Agent Superpowers
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Feature 1 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-[#FFD600] p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">ERC-8004 Agent Standard</h4>
              <p className="text-sm text-gray-700">
                Functions as an autonomous wallet framework, registering payroll actions to 8004scan.io with ranking telemetry and live activity score charts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-[#B6FF00] p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">MiniPay Integration</h4>
              <p className="text-sm text-gray-700">
                Detects mobile browsers and displays quick QR codes to claim payroll, offering a direct avenue for global freelancers to utilize sub-cent gas fees.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-white p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">KIMO Personalized Chat</h4>
              <p className="text-sm text-gray-700">
                Interact directly with KIMO from your workspace dashboard. Perform natural language queries and configure multi-token transactions instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-[#FFD600] p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Celopedia Knowledge Layer</h4>
              <p className="text-sm text-gray-700">
                Queries the Celo documentation repository dynamically, allowing the agent to answer ecosystem questions and recommend correct RPC setups.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-[#B6FF00] p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">x402 Agent Payments</h4>
              <p className="text-sm text-gray-700">
                Utilizes agent-to-agent transaction templates for sub-billing and automation, minimizing complex human approvals.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="neo-card neo-card-interactive p-6">
              <div className="bg-white p-3 border-2 border-black w-fit mb-4 shadow-neo-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">NeoBrutalist Analytics</h4>
              <p className="text-sm text-gray-700">
                View real-time salary distribution charts, cashflow projections, stablecoin trends, and transactional history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Celo Section */}
      <section id="why-celo" className="py-20 px-4 lg:px-8 border-b-4 border-black bg-[#FFD600]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="font-mono font-bold uppercase text-black/60 bg-white border-2 border-black px-2 py-0.5 text-xs inline-block mb-3">
              ECOSYSTEM SYNERGY
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-6">
              BUILT SPECIALLY FOR THE CELO ECOSYSTEM
            </h2>
            <p className="font-bold text-lg mb-6 leading-relaxed">
              Celo Alfajores Testnet provides the ultimate sandbox for micro-transactions, stablecoin velocity, and AI agents. By utilizing cUSD gas abstraction and lightweight mobile channels, StableFlow AI reduces the barriers to business payments in emerging economies.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-black p-4 shadow-neo-sm">
                <div className="text-2xl font-black text-[#FFD600] stroke-black font-mono">100%</div>
                <div className="text-xs font-bold text-gray-700">Stablecoin Settlement</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-neo-sm">
                <div className="text-2xl font-black text-[#B6FF00] font-mono">&lt; $0.01</div>
                <div className="text-xs font-bold text-gray-700">Average Gas Fee</div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-80 bg-white border-4 border-black shadow-neo-lg p-6 rotate-[2deg]">
            <h4 className="font-black text-xl mb-4 uppercase border-b-2 border-black pb-2">Active Coins</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-2 border-black p-2 bg-[#FFD600]/10">
                <span className="font-extrabold">Celo Dollar (cUSD)</span>
                <span className="bg-black text-[#FFD600] text-xs font-mono font-extrabold px-2 py-1">Gas-Free option</span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2 bg-[#B6FF00]/10">
                <span className="font-extrabold">USD Coin (USDC)</span>
                <span className="bg-black text-white text-xs font-mono font-extrabold px-2 py-1">ERC-20</span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2">
                <span className="font-extrabold">CELO Native</span>
                <span className="bg-[#B6FF00] border-2 border-black text-black text-xs font-mono font-extrabold px-2 py-1">Utility Token</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 lg:px-8 bg-white border-b-4 border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 text-center uppercase">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="neo-card rounded-none overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left p-6 font-bold text-lg flex items-center justify-between bg-white hover:bg-[#FFD600]/10 transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`w-6 h-6 transform transition-transform ${activeFaq === i ? 'rotate-180 text-[#FFD600]' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="p-6 border-t-2 border-black bg-[#F0F0F0]/50 text-sm md:text-base leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 lg:px-8 border-t-4 border-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD600] border-2 border-white text-black p-1 font-black text-lg shadow-neo-sm">
              SF⚡AI
            </div>
            <span className="font-black text-xl tracking-tight">StableFlow AI</span>
          </div>
          <p className="text-xs text-gray-500 text-center md:text-right">
            StableFlow AI © 2026. Distributed under MIT License.<br />
            Disclaimer: Testing on Celo Alfajores Testnet. Do not send mainnet funds.
          </p>
        </div>
      </footer>
    </div>
  );
}
