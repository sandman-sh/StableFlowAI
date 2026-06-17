export interface CelopediaArticle {
  title: string;
  category: string;
  content: string;
  sourceUrl: string;
}

export const CELOPEDIA_KNOWLEDGE: Record<string, CelopediaArticle> = {
  cusd: {
    title: 'cUSD (Celo Dollar)',
    category: 'Stablecoins',
    content: `cUSD is a stablecoin pegged to the US Dollar on the Celo network. It uses a decentralized stability mechanism backed by the Celo Reserve. 
One of cUSD's key features is **Gas Fee Abstraction**: users can pay gas fees directly in cUSD instead of needing CELO, which makes it perfect for non-technical employees and mobile-first MiniPay users.`,
    sourceUrl: 'https://docs.celo.org/integration/cusd'
  },
  celo: {
    title: 'CELO Native Asset',
    category: 'Network',
    content: `CELO is the native governance and utility asset of the Celo blockchain. It is used to secure the network via proof-of-stake, participate in governance voting, and pay transaction fees. 
For payroll, CELO provides a direct way to distribute equity or reward contractors in the native ecosystem token.`,
    sourceUrl: 'https://docs.celo.org/developer'
  },
  erc8004: {
    title: 'ERC-8004 Agent Wallet Standard',
    category: 'AI Agents',
    content: `ERC-8004 defines a standard for Onchain AI Agents. It provides a formal representation of an Agent's identity, metadata, delegate wallet permissions, and activity monitoring. 
By adhering to ERC-8004, StableFlow AI gains a verified Agent ID (e.g., \`agent-8004-stableflow-x19\`) and registers its transaction telemetry to **8004scan.io**, which ranks agents based on payment volume and onchain activity scores.`,
    sourceUrl: 'https://docs.celo.org/build-on-celo/build-with-ai/8004'
  },

  x402: {
    title: 'x402 Payment Protocol',
    category: 'Payments',
    content: `The x402 protocol is Thirdweb's agent-to-agent payment standard. It enables autonomous software agents to request, approve, and execute token transactions without manual intervention. 
In StableFlow AI, the x402 protocol is used to handle subscription-based payroll tasks and schedule future payouts that the agent can trigger based on time-locks or milestone completions.`,
    sourceUrl: 'https://www.thirdweb.com'
  },
  minipay: {
    title: 'MiniPay Integration',
    category: 'Mobile Wallet',
    content: `MiniPay is a ultra-lightweight web3 wallet built by Opera, integrated directly inside the Opera Mini browser for millions of users in developing markets (especially Africa). 
It focuses on sub-cent transaction fees, instant transfers, and gas fee abstraction (cUSD/cEUR). StableFlow AI generates MiniPay-compatible transaction QR codes for direct mobile-friendly salary claims.`,
    sourceUrl: 'https://minipay.xyz'
  },
  alfajores: {
    title: 'Celo Alfajores Testnet',
    category: 'Development',
    content: `Celo Alfajores is the official developer sandbox and testnet. It mimics the mainnet environment but allows developers to deploy smart contracts and test payment architectures for free. 
* Chain ID: 44787
* RPC URL: https://alfajores-forno.celo-testnet.org
* Block Explorer: https://alfajores.celoscan.io`,
    sourceUrl: 'https://docs.celo.org/developer/development-chain'
  }
};

/**
 * Searches the Celopedia Knowledge Base for relevant articles
 */
export function queryCelopedia(query: string): CelopediaArticle[] {
  const q = query.toLowerCase();
  const results: CelopediaArticle[] = [];
  
  if (q.includes('cusd') || q.includes('stable') || q.includes('dollar')) {
    results.push(CELOPEDIA_KNOWLEDGE.cusd);
  }
  if (q.includes('celo') && !q.includes('cusd') && !q.includes('sepolia')) {
    results.push(CELOPEDIA_KNOWLEDGE.celo);
  }
  if (q.includes('8004') || q.includes('agent wallet') || q.includes('standard')) {
    results.push(CELOPEDIA_KNOWLEDGE.erc8004);
  }

  if (q.includes('x402') || q.includes('protocol') || q.includes('agent-to-agent')) {
    results.push(CELOPEDIA_KNOWLEDGE.x402);
  }
  if (q.includes('minipay') || q.includes('opera') || q.includes('mobile') || q.includes('qr')) {
    results.push(CELOPEDIA_KNOWLEDGE.minipay);
  }
  if (q.includes('testnet') || q.includes('alfajores') || q.includes('rpc') || q.includes('chain')) {
    results.push(CELOPEDIA_KNOWLEDGE.alfajores);
  }
  
  // If nothing matched, return default articles
  if (results.length === 0) {
    return [CELOPEDIA_KNOWLEDGE.cusd, CELOPEDIA_KNOWLEDGE.erc8004];
  }
  
  return results;
}
