export type ProtocolId = 'HYPERLIQUID' | 'GMX_V2' | 'DYDX' | 'ARES_SIM';

export interface Web3WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  chainName: string;
  ethBalance: string;
  usdtBalance: string;
  isMetaMask: boolean;
  isAuthorized: boolean;
  isImported?: boolean;
  hyperliquidState?: {
    accountValue: number;
    totalRawUsd: number;
    withdrawable: number;
    totalMarginUsed: number;
    positions: any[];
  } | null;
  agentWallet: {
    address: string;
    isAuthorized: boolean;
    spendingLimitUsdt: number;
    expiresInHours: number;
  } | null;
}

export interface ProtocolConfig {
  id: ProtocolId;
  name: string;
  chain: string;
  chainId: number;
  badge: string;
  color: string;
  description: string;
  features: string[];
  docUrl: string;
  endpoint: string;
  oracle: string;
  maxLeverage: number;
}

export const PROTOCOLS: Record<ProtocolId, ProtocolConfig> = {
  HYPERLIQUID: {
    id: 'HYPERLIQUID',
    name: 'Hyperliquid L1/L2',
    chain: 'Hyperliquid EVM / Custom L1',
    chainId: 998,
    badge: 'HL-PERP',
    color: '#06b6d4',
    description: 'DEX de perpetuos de alto rendimiento con libro de órdenes on-chain y soporte para Agent Wallets.',
    features: ['L2 Orderbook nativo', 'Agent Wallets (API)', '0 Gas fees en L1', 'Liquidaciones en sub-segundo'],
    docUrl: 'https://hyperliquid.gitbook.io/hyperliquid-docs/',
    endpoint: 'https://api.hyperliquid.xyz',
    oracle: 'Hyperliquid HyperBFT Oracles',
    maxLeverage: 50,
  },
  GMX_V2: {
    id: 'GMX_V2',
    name: 'GMX v2 (Arbitrum One)',
    chain: 'Arbitrum One',
    chainId: 42161,
    badge: 'GMX-ARB',
    color: '#3b82f6',
    description: 'Futuros descentralizados en Arbitrum One con pools de liquidez GM y oráculos Chainlink de baja latencia.',
    features: ['Chainlink Data Streams', 'Arbitrum L2 Rollup', 'GMX SDK v2 oficial', 'Pools GM aislados'],
    docUrl: 'https://docs.gmx.io/docs/sdk/overview/',
    endpoint: 'https://arbitrum-api.gmxinfra.io',
    oracle: 'Chainlink Data Feeds & Streams',
    maxLeverage: 50,
  },
  DYDX: {
    id: 'DYDX',
    name: 'dYdX Chain (v4)',
    chain: 'dYdX Cosmos Standalone Chain',
    chainId: 1001,
    badge: 'DYDX-V4',
    color: '#a855f7',
    description: 'Protocolo de perpetuos descentralizado sobre Cosmos SDK con motor de matching off-chain y consenso CometBFT.',
    features: ['Libro de órdenes totalmente descentralizado', 'Subcuentas de trading', 'Cross-margin nativo'],
    docUrl: 'https://docs.dydx.xyz/',
    endpoint: 'https://indexer.dydx.trade',
    oracle: 'dYdX CometBFT Oracles',
    maxLeverage: 20,
  },
  ARES_SIM: {
    id: 'ARES_SIM',
    name: 'ARES Simulador Táctico Bélico',
    chain: 'ARES Web3 Testnet Sandbox',
    chainId: 31337,
    badge: 'ARES-LAB',
    color: '#10b981',
    description: 'Entorno de simulación bélica con 100x de apalancamiento sin riesgo de capital para validación de algoritmos.',
    features: ['100x Apalancamiento Máximo', 'Zero Slippage forzado', 'Faucet ilimitado', 'Medición de confluencia'],
    docUrl: 'https://ai.google.dev',
    endpoint: 'http://localhost:3000',
    oracle: 'ARES Hybrid Synthetic Oracle',
    maxLeverage: 100,
  },
};
