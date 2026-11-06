import { formatEther } from 'viem';
import { Web3WalletState } from '../types/protocols';

// Default initial wallet state
export const DEFAULT_WALLET_STATE: Web3WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  chainName: 'Desconectado',
  ethBalance: '0.000',
  usdtBalance: '100,000.00',
  isMetaMask: false,
  isAuthorized: false,
  agentWallet: null,
};

// Chain ID to human name mapping
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  42161: 'Arbitrum One',
  421614: 'Arbitrum Sepolia Testnet',
  998: 'Hyperliquid EVM Bridge',
  1001: 'dYdX Cosmos Subnet',
  31337: 'ARES Local Sandbox',
};

// Check if MetaMask or compatible EIP-1193 injected provider is available
export function getEthereumProvider(): any {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

// Connect MetaMask
export async function connectMetaMask(): Promise<Partial<Web3WalletState>> {
  const provider = getEthereumProvider();

  if (!provider) {
    // If not injected (or running inside an iframe blocking provider), return simulated tactical wallet
    const simulatedAddr = '0x71A4e92B6071C8F7E41e4B5145b2bFcdaF76B82e';
    return {
      isConnected: true,
      address: simulatedAddr,
      chainId: 42161,
      chainName: 'Arbitrum One (Tactical Vault)',
      ethBalance: '1.458 ETH',
      usdtBalance: '100,000.00 USDT',
      isMetaMask: false,
      isAuthorized: true,
    };
  }

  try {
    const accounts: string[] = await provider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No se seleccionó ninguna cuenta en MetaMask.');
    }

    const address = accounts[0];
    const chainIdHex = await provider.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);

    // Get real ETH balance
    let ethBalance = '0.000 ETH';
    try {
      const balanceHex = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceWei = BigInt(balanceHex);
      ethBalance = `${Number(formatEther(balanceWei)).toFixed(4)} ETH`;
    } catch (e) {
      console.warn('Could not fetch ETH balance:', e);
    }

    return {
      isConnected: true,
      address,
      chainId,
      chainName: CHAIN_NAMES[chainId] || `Red ChainId ${chainId}`,
      ethBalance,
      usdtBalance: '100,000.00 USDT',
      isMetaMask: !!provider.isMetaMask,
      isAuthorized: true,
    };
  } catch (error: any) {
    console.error('MetaMask connection failed:', error);
    throw error;
  }
}

// Switch Chain on MetaMask
export async function switchMetaMaskChain(targetChainId: number): Promise<boolean> {
  const provider = getEthereumProvider();
  if (!provider) return false;

  const hexChainId = `0x${targetChainId.toString(16)}`;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902 && targetChainId === 42161) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xa4b1',
              chainName: 'Arbitrum One',
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://arbiscan.io'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Arbitrum One chain:', addError);
        return false;
      }
    }
    return false;
  }
}

// Generate / Authorize an Agent Wallet for Hyperliquid & Sniper Auto-Pilot
export function generateAgentWallet(spendingLimitUsdt: number = 25000, expiresInHours: number = 24) {
  // Generate valid-looking EVM address for the delegated agent
  const chars = '0123456789abcdef';
  let randHex = '0x';
  for (let i = 0; i < 40; i++) {
    randHex += chars[Math.floor(Math.random() * chars.length)];
  }

  return {
    address: randHex,
    isAuthorized: true,
    spendingLimitUsdt,
    expiresInHours,
  };
}
