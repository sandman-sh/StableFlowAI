# StableFlow AI

<div align="center">

  ![Celo Alfajores](https://img.shields.io/badge/Celo-Alfajores_Testnet-FBCC5C?style=for-the-badge&logo=celo&logoColor=black)
  ![Next.js 16](https://img.shields.io/badge/Next.js_16-Turbopack-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
  ![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS_4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
  ![KIMO AI Agent](https://img.shields.io/badge/AI_Agent-KIMO-B6FF00?style=for-the-badge&logo=openai&logoColor=black)
  ![License-MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

  <p align="center">
    <strong>StableFlow AI</strong> is an autonomous, non-custodial Web3 payroll settlement agent running on the <strong>Celo blockchain</strong>. 
    It leverages <strong>KIMO</strong> (a personalized AI CFO assistant) to convert natural language statements into onchain multi-token batch payment approvals.
  </p>

  <h4>
    <a href="#key-capabilities">Key Capabilities</a> ·
    <a href="#architectural-flow">System Architecture</a> ·
    <a href="#installation-and-setup">Installation</a> ·
    <a href="#vercel-ready-deployment">Deployment</a>
  </h4>

</div>

---

## Key Capabilities

* **🤖 KIMO Personalized AI CFO**: An interactive assistant embedded directly into your Overview dashboard. Ask KIMO to filter workers (e.g. *"Pay all developers in cUSD"*), generate proposals, or look up Celo documentation.
* **⚡ Sequential Onchain Settlements**: Fully end-to-end blockchain execution on the **Celo Alfajores Testnet**:
  * Native transfers for **CELO** distributions.
  * ERC-20 contract `transfer` execution for **cUSD** and **USDC** scaled automatically to correct decimals (18 for cUSD, 6 for USDC) using `viem` and `wagmi`.
* **📊 ERC-8004 Telemetry Sync**: Complies with the ERC-8004 agent wallet standard. The agent automatically submits execution logs, scoring indicators, and rank telemetry data directly to the **8004scan.io** ledger.
* **📱 Mobile MiniPay Claims**: Generates claimable QR codes that pre-fill payment transactions, letting mobile users in developing economies claim salaries in Opera Mini browser instantly.
* **🔒 CORS-Free Server Security**: OpenRouter API communication is routed through a secure backend Next.js API endpoint (`/api/chat`). Your API key is safely housed in `.env.local` and never exposed to client browsers.
* **🎨 Neo-Brutalist Analytics**: Harmonic custom-tailored dark and light palettes displaying pie charts of stablecoin distribution weights and bar graphs of payroll distributions.

---

## System Architecture

The following ASCII diagram maps the end-to-end data lifecycle of the StableFlow AI payroll process:

```
[ User Prompt ] --(Dashboard Overview Input)--> [ Next.js Server Handler ]
                                                           |
                                                (Secure Env Verification)
                                                           |
                                                           v
[ Employee Database ] --(JSON Structured Schema)--> [ KIMO (OpenRouter API) ]
                                                           |
                                               (Validates & Bundles Proposal)
                                                           |
                                                           v
[ Signature Request ] <--(Prompts Sequential Actions)-- [ Wagmi/Viem Connector ]
         |
    (Sign Tx)
         |
         v
[ Celo Alfajores Blockchain ] --(Emits Telemetry Logs)--> [ 8004scan Ledger ]
```

---

## API Documentation

### POST `/api/chat`

Handles conversational prompts and compiles structured transaction proposals.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body Schema
```json
{
  "message": "Pay all designers 100 USDC",
  "history": [
    {
      "sender": "user",
      "text": "hello"
    },
    {
      "sender": "agent",
      "text": "Hello, I am KIMO."
    }
  ],
  "employees": [
    {
      "id": "emp-1",
      "name": "Alice Chen",
      "email": "alice@company.com",
      "role": "Designer",
      "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "monthlySalary": 5000,
      "paymentType": "USDC",
      "country": "Germany",
      "status": "Active",
      "category": "Designer"
    }
  ]
}
```

#### Response Body Schema
```json
{
  "sender": "agent",
  "text": "I have successfully compiled a payroll proposal...",
  "timestamp": "2026-06-17T10:55:00.000Z",
  "proposal": {
    "batchId": "batch-8491",
    "recipients": [
      {
        "employeeId": "emp-1",
        "name": "Alice Chen",
        "role": "Designer",
        "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "amount": 5000,
        "token": "USDC"
      }
    ],
    "totalAmount": 5000,
    "stablecoin": "USDC",
    "estimatedGas": 0.003
  }
}
```

---

## Installation and Setup

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* [MetaMask](https://metamask.io/) or another Celo Alfajores compatible wallet

### Steps

1. **Clone & Install**:
   ```bash
   git clone https://github.com/sandman-sh/StableFlowAI.git
   cd StableFlowAI
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # RainbowKit Wallet Connect Project ID
   NEXT_PUBLIC_PROJECT_ID="your_project_id"

   # Supabase DB Sync Credentials
   NEXT_PUBLIC_SUPABASE_URL="https://your_project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"

   # OpenRouter AI Credentials
   OPENROUTER_API_KEY="your_openrouter_key"
   ```

3. **Run Dev Mode**:
   ```bash
   npm run dev
   ```

4. **Access Portal**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Vercel Ready Deployment

This project is fully verified to build on Vercel:

1. Connect your repository to [Vercel](https://vercel.com).
2. Configure environment variables in the Vercel console.
3. Vercel automatically deploys using the configuration presets. Next.js serverless functions handle the chat API route out-of-the-box.
