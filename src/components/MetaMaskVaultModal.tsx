import React, { useState } from 'react';
import { Web3WalletState, ProtocolId, PROTOCOLS } from '../types/protocols';
import {
  Wallet,
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RefreshCw,
  Cpu,
  Key,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { switchMetaMaskChain, generateAgentWallet } from '../utils/web3Wallet';
import { tacticalAudio } from '../utils/audio';

interface MetaMaskVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: Web3WalletState;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  selectedProtocol: ProtocolId;
  onSelectProtocol: (protocol: ProtocolId) => void;
  onUpdateAgentWallet: (agent: Web3WalletState['agentWallet']) => void;
  onFaucetUsdt: () => void;
}

export const MetaMaskVaultModal: React.FC<MetaMaskVaultModalProps> = ({
  isOpen,
  onClose,
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  selectedProtocol,
  onSelectProtocol,
  onUpdateAgentWallet,
  onFaucetUsdt,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'METAMASK' | 'PROTOCOLS' | 'AGENT_WALLET'>('METAMASK');
  const [agentSpendingLimit, setAgentSpendingLimit] = useState<number>(25000);
  const [agentExpiryHours, setAgentExpiryHours] = useState<number>(24);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    tacticalAudio.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = async (chainId: number) => {
    tacticalAudio.playClick();
    await switchMetaMaskChain(chainId);
  };

  const handleGenerateAgent = () => {
    tacticalAudio.playVictory();
    const newAgent = generateAgentWallet(agentSpendingLimit, agentExpiryHours);
    onUpdateAgentWallet(newAgent);
  };

  const handleRevokeAgent = () => {
    tacticalAudio.playClick();
    onUpdateAgentWallet(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#070d14] border-2 border-cyan-500/60 rounded-lg tactical-box flex flex-col shadow-[0_0_35px_rgba(6,182,212,0.3)] overflow-hidden font-mono-military text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/60 bg-[#091522] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Wallet className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-warfare text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  BÓVEDA TÁCTICA WEB3: METAMASK & PROTOCOLOS
                </h2>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    walletState.isConnected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      : 'bg-rose-950 text-rose-300 border border-rose-500'
                  }`}
                >
                  {walletState.isConnected ? 'ENLACE AUTORIZADO' : 'DESCONECTADO'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Puerta de entrada de identidad Web3, activos y enrutamiento a Hyperliquid, GMX y dYdX.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-black/40 text-xs">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveTab('METAMASK');
            }}
            className={`flex-1 py-2.5 px-3 font-warfare font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'METAMASK'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🦊 METAMASK & CUENTA
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveTab('PROTOCOLS');
            }}
            className={`flex-1 py-2.5 px-3 font-warfare font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'PROTOCOLS'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ MOTORES DE FUTUROS (3)
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveTab('AGENT_WALLET');
            }}
            className={`flex-1 py-2.5 px-3 font-warfare font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'AGENT_WALLET'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🤖 AGENT WALLET (HYPERLIQUID)
          </button>
        </div>

        {/* Tab 1: MetaMask State & Networks */}
        {activeTab === 'METAMASK' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Connection Status Box */}
            <div className="bg-[#091522] p-3.5 rounded border border-cyan-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    ESTADO DE CONEXIÓN:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        walletState.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-bold text-sm text-white">
                      {walletState.isConnected ? 'CONECTADO A METAMASK' : 'WALLET DESCONECTADA'}
                    </span>
                  </div>
                  {walletState.address && (
                    <div className="flex items-center gap-2 mt-1.5 text-slate-300">
                      <span className="font-mono-military text-cyan-300 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                        {walletState.address}
                      </span>
                      <button
                        onClick={() => handleCopy(walletState.address!)}
                        className="p-1 hover:text-cyan-400 text-slate-400 cursor-pointer"
                        title="Copiar dirección pública"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  {walletState.isConnected ? (
                    <button
                      onClick={() => {
                        tacticalAudio.playClick();
                        onDisconnectWallet();
                      }}
                      className="px-3.5 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 font-bold cursor-pointer"
                    >
                      DESCONECTAR
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        tacticalAudio.playClick();
                        onConnectWallet();
                      }}
                      className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-warfare font-bold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      CONECTAR METAMASK
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Balances Display (ETH & USDT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-black/60 p-3 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">SALDO GAS (ETH NATIVO):</span>
                <span className="text-lg font-extrabold text-cyan-400 font-mono-military">
                  {walletState.ethBalance}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Disponible para fees en Arbitrum / Ethereum</span>
              </div>

              <div className="bg-black/60 p-3 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">SALDO MARGEN (USDT COLATERAL):</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono-military">
                    ${walletState.usdtBalance}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Colateral para abrir futuros perpetuos</span>
                </div>
                <button
                  onClick={() => {
                    tacticalAudio.playVictory();
                    onFaucetUsdt();
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900 cursor-pointer flex items-center gap-1"
                  title="Recargar munición USDT"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+10K FAUCET</span>
                </button>
              </div>
            </div>

            {/* Supported Networks Matrix */}
            <div>
              <span className="text-[11px] text-slate-400 font-bold block mb-2">
                REDES BLOCKCHAIN COMPATIBLES (SELECCIÓN DIRECTA EN METAMASK):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => handleSwitchNetwork(42161)}
                  className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    walletState.chainId === 42161
                      ? 'bg-blue-950/60 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-black/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white text-xs block">Arbitrum One (ChainId: 42161)</span>
                    <span className="text-[10px] text-blue-400">GMX v2, DeFi Perpetuals & Rollup L2</span>
                  </div>
                  {walletState.chainId === 42161 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold">ACTIVA</span>
                  )}
                </div>

                <div
                  onClick={() => handleSwitchNetwork(1)}
                  className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    walletState.chainId === 1
                      ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-black/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white text-xs block">Ethereum Mainnet (ChainId: 1)</span>
                    <span className="text-[10px] text-slate-400">Custodia ERC-20, Vaults principales</span>
                  </div>
                  {walletState.chainId === 1 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500 text-black font-bold">ACTIVA</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Future Engines (Hyperliquid, GMX v2, dYdX, Simulator) */}
        {activeTab === 'PROTOCOLS' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
            <span className="text-[11px] text-slate-400 font-bold block">
              SELECCIONA EL MOTOR DE EJECUCIÓN ACTIVO DE ARES-X:
            </span>

            {Object.values(PROTOCOLS).map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  tacticalAudio.playClick();
                  onSelectProtocol(p.id);
                }}
                className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  selectedProtocol === p.id
                    ? 'bg-[#091824] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-black/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                      style={{ backgroundColor: `${p.color}25`, color: p.color, border: `1px solid ${p.color}60` }}
                    >
                      {p.badge}
                    </span>
                    <h3 className="font-warfare text-sm font-bold text-white">{p.name}</h3>
                    <span className="text-[10px] text-slate-500">| Max {p.maxLeverage}x</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.map((feat, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-slate-800 text-slate-400">
                        • {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {selectedProtocol === p.id ? (
                    <span className="px-3 py-1 rounded bg-cyan-500 text-black font-warfare font-bold text-[11px] uppercase tracking-wider shadow-sm">
                      MOTOR ACTIVO
                    </span>
                  ) : (
                    <button className="px-3 py-1 rounded bg-black/80 border border-slate-700 text-slate-300 text-[11px] hover:text-white">
                      CONECTAR MOTOR
                    </button>
                  )}
                  <div className="text-[9px] text-slate-500 mt-1.5">Oráculo: {p.oracle}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Agent Wallet for Hyperliquid / Sniper Auto-Pilot */}
        {activeTab === 'AGENT_WALLET' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="bg-[#091522] p-3.5 rounded border border-amber-500/40">
              <h3 className="font-warfare text-sm font-bold text-amber-300 uppercase mb-1 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                MECANISMO DE AGENT WALLET (HYPERLIQUID API DELEGATION)
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tal como especifica la arquitectura oficial de Hyperliquid, <strong>la Agent Wallet no es tu MetaMask ni expone tu clave privada</strong>.
                Es una clave de firma delegada secundaria generada por ARES-X para ejecutar órdenes de Sniper Auto-Pilot dentro de los límites de riesgo que autorices.
              </p>
            </div>

            {walletState.agentWallet ? (
              <div className="bg-black/70 p-4 rounded border border-emerald-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-emerald-300 font-bold text-sm block">AGENT WALLET ACTIVA Y AUTORIZADA</span>
                      <span className="font-mono-military text-[11px] text-slate-400">{walletState.agentWallet.address}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRevokeAgent}
                    className="px-3 py-1 rounded bg-rose-950 border border-rose-500/60 text-rose-300 text-[10px] font-bold cursor-pointer hover:bg-rose-900"
                  >
                    REVOCAR PERMISOS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">LÍMITE MÁXIMO DE MARGEN:</span>
                    <span className="text-amber-400 font-bold">${walletState.agentWallet.spendingLimitUsdt.toLocaleString()} USDT</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DURACIÓN AUTORIZADA:</span>
                    <span className="text-cyan-400 font-bold">{walletState.agentWallet.expiresInHours} Horas (Renovable)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black/70 p-4 rounded border border-slate-800 space-y-3">
                <p className="text-slate-300 font-semibold text-xs">
                  Autorizar nueva Agent Wallet para ejecución Sniper automática:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">LÍMITE DE COLATERAL (USDT):</span>
                    <input
                      type="number"
                      value={agentSpendingLimit}
                      onChange={(e) => setAgentSpendingLimit(Number(e.target.value))}
                      className="w-full bg-black/90 border border-slate-700 text-white px-2 py-1.5 rounded focus:border-cyan-500 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">VENTANA DE VALIDEZ (HORAS):</span>
                    <input
                      type="number"
                      value={agentExpiryHours}
                      onChange={(e) => setAgentExpiryHours(Number(e.target.value))}
                      className="w-full bg-black/90 border border-slate-700 text-white px-2 py-1.5 rounded focus:border-cyan-500 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateAgent}
                  className="w-full py-2.5 rounded bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-warfare font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span>AUTORIZAR AGENT WALLET PARA ARES-X</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-cyan-900/60 bg-[#091522] px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="text-[10px] text-slate-400">
            MOTOR ACTIVO: <strong className="text-cyan-400">{PROTOCOLS[selectedProtocol].name}</strong>
          </div>
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            CONFIRMAR Y VOLVER AL HUD
          </button>
        </div>
      </div>
    </div>
  );
};
