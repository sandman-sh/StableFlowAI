import { http } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Stablecoin Contract Addresses mapped by Chain ID
// Celo Mainnet: 42220
// Celo Alfajores Testnet: 44787
export const STABLECOINS = {
  42220: {
    cUSD: {
      address: '0x765de816845861e75a25fca122bb6898b8b1282a' as `0x${string}`,
      decimals: 18,
      symbol: 'cUSD',
      name: 'Celo Dollar',
    },
    USDC: {
      address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
    },
    CELO: {
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      decimals: 18,
      symbol: 'CELO',
      name: 'Celo Native Asset',
    }
  },
  44787: {
    cUSD: {
      address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as `0x${string}`,
      decimals: 18,
      symbol: 'cUSD',
      name: 'Celo Dollar',
    },
    USDC: {
      address: '0x2F27A7e7769eE143df2c6328A253448a587DED3C' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
    },
    CELO: {
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      decimals: 18,
      symbol: 'CELO',
      name: 'Celo Native Asset',
    }
  }
};

// Standard ERC20 ABI for Transfers
export const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'boolean' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  }
] as const;

// RainbowKit project configuration
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'stableflow-celo-agent-id-1';

export const wagmiConfig = getDefaultConfig({
  appName: 'StableFlow AI',
  projectId,
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
  ssr: true,
});

