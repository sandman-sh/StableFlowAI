import { Employee, localDB } from './supabase';
import { queryCelopedia } from './celopedia';

export interface AIChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  proposal?: AIProposal;
}

export interface AIProposal {
  batchId: string;
  recipients: {
    employeeId: string;
    name: string;
    role?: string;
    walletAddress: string;
    amount: number;
    token: 'cUSD' | 'USDC' | 'CELO';
  }[];
  totalAmount: number;
  stablecoin: 'cUSD' | 'USDC' | 'CELO';
  estimatedGas: number; // in CELO
}

const SYSTEM_PROMPT = `You are KIMO, a personalized autonomous onchain AI payroll agent built for the Celo ecosystem.
Your job is to convert natural language requests into structured payroll actions, employee filters, payments, and analytical reports.

You MUST respond in JSON format. The JSON object must have the following structure:
{
  "text": "Your friendly conversational response to the user. Explain what action was taken or what you found.",
  "proposal": {
    "batchId": "A unique batch identifier starting with 'batch-' followed by random numbers",
    "recipients": [
      {
        "employeeId": "The database employee ID",
        "name": "Employee name",
        "role": "Employee role",
        "walletAddress": "Employee Celo wallet address",
        "amount": 100, // numerical amount to pay
        "token": "cUSD" | "USDC" | "CELO"
      }
    ],
    "totalAmount": 100, // sum of recipient amounts
    "stablecoin": "cUSD" | "USDC" | "CELO",
    "estimatedGas": 0.003 // Gas estimate in CELO (calculate as recipients.length * 0.003)
  } // Set to null if the user is not requesting to run payroll / distribute funds
}

Guidelines:
1. Always behave as KIMO, a professional CFO assistant.
2. In the "text" field, respond naturally to greetings, lookups, or queries.
3. If the user requests to pay a group of workers (e.g. "Pay all designers in USDC"), scan the employee database provided and populate the "proposal" object.
4. If the user does not request a transaction or payroll payout, set "proposal" to null.
5. Do not include markdown code block backticks (like \`\`\`json) in the raw output if response format is JSON. Just output the clean JSON object.
`;

export async function stableFlowAIChat(
  message: string,
  history: AIChatMessage[],
  apiKey?: string,
  employeesOverride?: Employee[]
): Promise<AIChatMessage> {
  const employees = employeesOverride || localDB.getEmployees();
  const lowerMsg = message.toLowerCase();

  // If a key is available, we try to call OpenRouter
  if (apiKey) {
    try {
      const response = await callOpenRouter(message, history, employees, apiKey);
      if (response) return response;
    } catch (e) {
      console.error('OpenRouter call failed, falling back to simulated parser:', e);
    }
  }

  // Fallback Rule-Based Parser (Autonomous NLP Simulator)
  return simulateAIPayrollAgent(message, employees);
}

/**
 * OpenRouter API integration
 */
async function callOpenRouter(
  message: string,
  history: AIChatMessage[],
  employees: Employee[],
  apiKey: string
): Promise<AIChatMessage | null> {
  const celoContext = queryCelopedia(message)
    .map(a => `[Celopedia: ${a.title}] ${a.content}`)
    .join('\n\n');

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nCelopedia Context:\n${celoContext}\n\nCurrent Employee Database:\n${JSON.stringify(employees, null, 2)}` },
    ...history.map(h => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text
    })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://stableflow.ai',
      'X-Title': 'KIMO AI Celo Agent'
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter call failed:', response.status, errorText);
    return null;
  }
  
  const data = await response.json();
  const replyText = data.choices[0]?.message?.content || '';

  let parsed: any = null;
  try {
    parsed = JSON.parse(replyText);
  } catch (e) {
    const jsonMatch = replyText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error('Failed to parse matched JSON substring:', err);
      }
    }
  }

  if (parsed && parsed.text) {
    return {
      sender: 'agent',
      text: parsed.text,
      timestamp: new Date().toISOString(),
      proposal: parsed.proposal || undefined
    };
  }

  return {
    sender: 'agent',
    text: replyText || 'I processed your query but could not format the output properly.',
    timestamp: new Date().toISOString()
  };
}

/**
 * Local NLP Simulator mapping keywords to specific employee filters
 */
function simulateAIPayrollAgent(message: string, employees: Employee[]): AIChatMessage {
  const lowerMsg = message.toLowerCase();
  
  // Check for Celopedia knowledge lookups
  if (lowerMsg.includes('cusd') || lowerMsg.includes('minipay') || lowerMsg.includes('8004') || lowerMsg.includes('self') || lowerMsg.includes('x402') || lowerMsg.includes('alfajores')) {
    const articles = queryCelopedia(message);
    const content = articles.map(art => `### 📖 Celopedia: ${art.title}\n${art.content}\n*Source: [Celo Docs](${art.sourceUrl})*`).join('\n\n');
    return {
      sender: 'agent',
      text: `Based on Celo Knowledge base retrieval, here is what I found:\n\n${content}\n\nHow does this apply to your current payroll plan?`,
      timestamp: new Date().toISOString()
    };
  }

  // Check for payroll intent
  const isPayrollIntent = lowerMsg.includes('pay') || lowerMsg.includes('run payroll') || lowerMsg.includes('salary') || lowerMsg.includes('distribute') || lowerMsg.includes('send');
  
  if (isPayrollIntent) {
    // Filter employees based on keywords
    let filtered = [...employees];
    let filterDescription = 'all employees';

    if (lowerMsg.includes('designer') || lowerMsg.includes('design')) {
      filtered = employees.filter(e => e.role.toLowerCase().includes('design') || e.category === 'Designer');
      filterDescription = 'all designers';
    } else if (lowerMsg.includes('developer') || lowerMsg.includes('dev') || lowerMsg.includes('engineer') || lowerMsg.includes('coder')) {
      filtered = employees.filter(e => e.role.toLowerCase().includes('dev') || e.role.toLowerCase().includes('engineer') || e.category === 'Developer');
      filterDescription = 'all engineers and developers';
    } else if (lowerMsg.includes('contractor') || lowerMsg.includes('freelancer')) {
      filtered = employees.filter(e => e.category === 'Contractor');
      filterDescription = 'all contractors';
    } else if (lowerMsg.includes('manager') || lowerMsg.includes('owner') || lowerMsg.includes('lead')) {
      filtered = employees.filter(e => e.category === 'Management' || e.role.toLowerCase().includes('lead') || e.role.toLowerCase().includes('owner'));
      filterDescription = 'management and lead roles';
    }

    // Filter out inactive unless explicitly asked
    if (!lowerMsg.includes('inactive') && !lowerMsg.includes('everyone')) {
      filtered = filtered.filter(e => e.status === 'Active');
      filterDescription += ' (Active only)';
    }

    if (filtered.length === 0) {
      return {
        sender: 'agent',
        text: `I scanned the employee database but couldn't find any active employees matching that filter. Try adding some employees or updating their roles in the **Employees** dashboard!`,
        timestamp: new Date().toISOString()
      };
    }

    // Default stablecoin selection based on user text or fallback
    let token: 'cUSD' | 'USDC' | 'CELO' = 'cUSD';
    if (lowerMsg.includes('usdc')) token = 'USDC';
    else if (lowerMsg.includes('celo')) token = 'CELO';

    const recipients = filtered.map(e => ({
      employeeId: e.id,
      name: e.name,
      role: e.role,
      walletAddress: e.walletAddress,
      amount: e.monthlySalary,
      token: token
    }));

    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
    const estimatedGas = recipients.length * 0.003; // ~0.003 CELO per transaction on Alfajores

    const proposal: AIProposal = {
      batchId: `batch-${Math.floor(1000 + Math.random() * 9000)}`,
      recipients,
      totalAmount,
      stablecoin: token,
      estimatedGas
    };

    const recipientList = recipients.map(r => `* **${r.name}** (${r.role}) - **${r.amount} ${r.token}** at \`${r.walletAddress.substring(0, 6)}...${r.walletAddress.substring(38)}\``).join('\n');

    return {
      sender: 'agent',
      text: `### 🚀 Payroll Batch Proposal Generated\n\nI have created a pending payroll proposal for **${filterDescription}** using **${token}** stablecoins on the Celo Alfajores Testnet.\n\n**Proposal Summary:**\n* **Total Recipients:** ${recipients.length}\n* **Total Payout:** ${totalAmount} ${token}\n* **Estimated Gas:** ~${estimatedGas.toFixed(3)} CELO\n\n**Recipient Details:**\n${recipientList}\n\n*Review this proposal in the box below and click **Execute Payment** to sign the onchain transaction.*`,
      timestamp: new Date().toISOString(),
      proposal
    };
  }

  // Analytics query fallback
  if (lowerMsg.includes('highest') || lowerMsg.includes('most paid') || lowerMsg.includes('salary')) {
    const highestPaid = [...employees].sort((a, b) => b.monthlySalary - a.monthlySalary)[0];
    return {
      sender: 'agent',
      text: `According to my financial breakdown, **${highestPaid.name}** holds the highest payroll salary at **${highestPaid.monthlySalary} ${highestPaid.paymentType}** per month as our *${highestPaid.role}*.`,
      timestamp: new Date().toISOString()
    };
  }

  if (lowerMsg.includes('total') || lowerMsg.includes('spend') || lowerMsg.includes('cost')) {
    const totalActiveSalary = employees
      .filter(e => e.status === 'Active')
      .reduce((sum, e) => sum + e.monthlySalary, 0);
    
    return {
      sender: 'agent',
      text: `The current total recurring monthly cost for all active employees is **${totalActiveSalary} cUSD** (including mixed stablecoins converted to base value).`,
      timestamp: new Date().toISOString()
    };
  }

  // Default greetings
  return {
    sender: 'agent',
    text: `Hello! I am KIMO, your personalized autonomous Celo payroll agent. 

I can help you filter employees and schedule payouts. You can prompt me with commands like:
* "Pay all designers this Friday in USDC"
* "Run payroll for engineering developers"
* "Who is the highest paid worker?"
* "What is ERC-8004 standard?" or "How does MiniPay work?"

How can I assist you with your business payroll today?`,
    timestamp: new Date().toISOString()
  };
}
