import React, { useState, useEffect, useCallback } from 'react';
import { useMarketStream } from './hooks/useMarketStream';
import { Position, OrderSide, MarginMode, TradingSkill } from './types/trading';
import { ProtocolId, PROTOCOLS, Web3WalletState } from './types/protocols';
import { TRADING_SKILLS_DATABASE } from './data/skillsDatabase';
import { HeaderHUD } from './components/HeaderHUD';
import { ChartHUD } from './components/ChartHUD';
import { OrderBookTapeHUD } from './components/OrderBookTapeHUD';
import { OrderExecutionPanel } from './components/OrderExecutionPanel';
import { TacticalAiPanel } from './components/TacticalAiPanel';
import { PositionsManager } from './components/PositionsManager';
import { SkillsDatabaseModal } from './components/SkillsDatabaseModal';
import { WarGameModal } from './components/WarGameModal';
import { LiquidationRadar } from './components/LiquidationRadar';
import { AiCommsChat } from './components/AiCommsChat';
import { MetaMaskVaultModal } from './components/MetaMaskVaultModal';
import { BtcOracleTab } from './components/BtcOracleTab';
import { SweepHunterTab } from './components/SweepHunterTab';
import { BtcOracleEngine, BtcOracleData, OracleVerdictType } from './services/btcOracleEngine';
import { connectMetaMask, DEFAULT_WALLET_STATE, getEthereumProvider } from './utils/web3Wallet';
import { tacticalAudio } from './utils/audio';
import { useSweepHunterAutonomous } from './hooks/useSweepHunterAutonomous';

export default function App() {
  // Live Market Stream
  const {
    assets,
    activeAsset,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    candles,
    bids,
    asks,
    trades,
    rsi,
    cvdDelta,
    orderbookImbalance,
  } = useMarketStream('BTC-PERP');

  // Main Workspace Tab: Chart vs BTC Oracle vs Sweeps/SFP Hunter
  const [mainWorkspaceTab, setMainWorkspaceTab] = useState<'CHART' | 'ORACLE' | 'SWEEPS'>('CHART');

  // Protocol Engine Selection (Hyperliquid, GMX v2 Arbitrum, dYdX, Simulator)
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolId>('HYPERLIQUID');

  // Web3 Wallet / MetaMask State
  const [walletState, setWalletState] = useState<Web3WalletState>({
    ...DEFAULT_WALLET_STATE,
    isConnected: true,
    address: '0x71A4e92B6071C8F7E41e4B5145b2bFcdaF76B82e',
    chainId: 42161,
    chainName: 'Arbitrum One',
    ethBalance: '1.458 ETH',
    usdtBalance: '100,000.00 USDT',
    isMetaMask: true,
    isAuthorized: true,
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [closedCount, setClosedCount] = useState<number>(0);
  const [totalRealizedPnl, setTotalRealizedPnl] = useState<number>(0);

  // Trading Skills state
  const [skills, setSkills] = useState<TradingSkill[]>(TRADING_SKILLS_DATABASE);

  // AI Presets and Auto-Pilot
  const [aiPreset, setAiPreset] = useState<{
    side: OrderSide;
    leverage: number;
    takeProfit: number;
    stopLoss: number;
  } | null>(null);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState<boolean>(false);

  // Modals
  const [showVaultModal, setShowVaultModal] = useState<boolean>(false);
  const [showSkillsModal, setShowSkillsModal] = useState<boolean>(false);
  const [showWarGameModal, setShowWarGameModal] = useState<boolean>(false);
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showCommsModal, setShowCommsModal] = useState<boolean>(false);

  // UI Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);

  // BTC Price from assets (or activeAsset if BTC is active)
  const btcAsset = assets.find((a) => a.symbol === 'BTC-PERP') || activeAsset;

  // Quantitative BTC Oracle Data
  const [oracleData, setOracleData] = useState<BtcOracleData>(() =>
    BtcOracleEngine.evaluateOracle(btcAsset.currentPrice, candles, candles)
  );

  // Oracle 15-second reevaluation interval
  const updateOracleCalculations = useCallback(() => {
    const updated = BtcOracleEngine.evaluateOracle(btcAsset.currentPrice, candles, candles);
    setOracleData(updated);
  }, [btcAsset.currentPrice, candles]);

  useEffect(() => {
    updateOracleCalculations();
    const oracleTimer = setInterval(updateOracleCalculations, 15000);
    return () => clearInterval(oracleTimer);
  }, [updateOracleCalculations]);

  // Auto-detect MetaMask on mount if present
  useEffect(() => {
    const provider = getEthereumProvider();
    if (provider) {
      provider.on?.('accountsChanged', (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setWalletState((prev) => ({ ...prev, isConnected: false, address: null }));
        } else {
          setWalletState((prev) => ({ ...prev, address: accounts[0], isConnected: true }));
        }
      });
      provider.on?.('chainChanged', (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        setWalletState((prev) => ({ ...prev, chainId }));
      });
    }
  }, []);

  // Connect MetaMask handler
  const handleConnectWallet = async () => {
    try {
      const state = await connectMetaMask();
      setWalletState((prev) => ({ ...prev, ...state }));
      tacticalAudio.playVictory();
    } catch (e: any) {
      alert(`Error al conectar MetaMask: ${e?.message || e}`);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletState(DEFAULT_WALLET_STATE);
  };

  // Import custom wallet address (Hyperliquid + Arbitrum sync)
  const handleImportWallet = async (address: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallet/sync-imported', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al sincronizar');
      }
      const data = await res.json();
      const hlEquity = data.hyperliquid.accountValue;
      const formattedUsdt =
        hlEquity > 0
          ? `${hlEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
          : '100,000.00 USDT';

      setWalletState((prev) => ({
        ...prev,
        isConnected: true,
        address: data.address,
        chainId: 42161,
        chainName: 'Arbitrum One / Hyperliquid L1',
        ethBalance: data.ethBalance || '0.0000 ETH',
        usdtBalance: formattedUsdt,
        isAuthorized: true,
        isImported: true,
        hyperliquidState: data.hyperliquid,
        agentWallet: prev.agentWallet || {
          address: data.address,
          isAuthorized: true,
          spendingLimitUsdt: 25000,
          expiresInHours: 24,
        },
      }));

      tacticalAudio.playVictory();
      tacticalAudio.speakTacticalVoice('Billetera importada y vinculada a Hyperliquid.');
      return true;
    } catch (e: any) {
      alert(`Error al importar: ${e?.message || e}`);
      return false;
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    tacticalAudio.isMuted = !next;
  };

  // Faucet reload
  const handleFaucet = () => {
    setWalletState((prev) => {
      const currentVal = parseFloat(prev.usdtBalance.replace(/[^0-9.]/g, '')) || 0;
      const newVal = (currentVal + 10000).toLocaleString('en-US', { minimumFractionDigits: 2 });
      return { ...prev, usdtBalance: `${newVal} USDT` };
    });
    tacticalAudio.playVictory();
  };

  // Toggle skill active state in radar
  const handleToggleSkill = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, activeInRadar: !s.activeInRadar } : s))
    );
  };

  // Execute new order
  const handleExecuteOrder = (order: {
    symbol: string;
    side: OrderSide;
    margin: number;
    leverage: number;
    marginMode: MarginMode;
    takeProfit?: number;
    stopLoss?: number;
    protocol: ProtocolId;
  }) => {
    // ENFORCE ABSOLUTE ORACLE RULE
    if (oracleData.trend1h.isBlocked) {
      tacticalAudio.playKlaxon();
      alert('ORDEN BLOQUEADA: Regla fija del Oráculo: BTC 1H en rojo = bloqueo estricto de nuevas entradas.');
      return;
    }

    const currentPrice = activeAsset.currentPrice;
    const estLiqPrice =
      order.side === 'LONG'
        ? Math.max(0, currentPrice * (1 - (1 / order.leverage) * 0.9))
        : currentPrice * (1 + (1 / order.leverage) * 0.9);

    const newPosition: Position = {
      id: Math.random().toString(36).substring(2, 9),
      symbol: order.symbol,
      side: order.side,
      entryPrice: currentPrice,
      markPrice: currentPrice,
      size: (order.margin * order.leverage) / currentPrice,
      margin: order.margin,
      leverage: order.leverage,
      liquidationPrice: Number(estLiqPrice.toFixed(2)),
      takeProfit: order.takeProfit,
      stopLoss: order.stopLoss,
      marginMode: order.marginMode,
      protocol: order.protocol,
      pnl: 0,
      roe: 0,
      openedAt: Date.now(),
    };

    setWalletState((prev) => {
      const currentVal = parseFloat(prev.usdtBalance.replace(/[^0-9.]/g, '')) || 0;
      const newVal = Math.max(0, currentVal - order.margin).toLocaleString('en-US', { minimumFractionDigits: 2 });
      return { ...prev, usdtBalance: `${newVal} USDT` };
    });

    setPositions((prev) => [newPosition, ...prev]);
  };

  // Close position (full or 50% partial)
  const handleClosePosition = (id: string, partial = false) => {
    setPositions((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;

      if (partial) {
        const returnedMargin = target.margin * 0.5 + target.pnl * 0.5;
        setWalletState((w) => {
          const currentVal = parseFloat(w.usdtBalance.replace(/[^0-9.]/g, '')) || 0;
          const newVal = (currentVal + returnedMargin).toLocaleString('en-US', { minimumFractionDigits: 2 });
          return { ...w, usdtBalance: `${newVal} USDT` };
        });
        setTotalRealizedPnl((p) => p + target.pnl * 0.5);

        return prev.map((p) =>
          p.id === id
            ? {
                ...p,
                margin: p.margin * 0.5,
                size: p.size * 0.5,
                pnl: p.pnl * 0.5,
              }
            : p
        );
      } else {
        const returnedMargin = target.margin + target.pnl;
        setWalletState((w) => {
          const currentVal = parseFloat(w.usdtBalance.replace(/[^0-9.]/g, '')) || 0;
          const newVal = (currentVal + returnedMargin).toLocaleString('en-US', { minimumFractionDigits: 2 });
          return { ...w, usdtBalance: `${newVal} USDT` };
        });
        setTotalRealizedPnl((p) => p + target.pnl);
        setClosedCount((c) => c + 1);

        return prev.filter((p) => p.id !== id);
      }
    });
  };

  // Set Break Even
  const handleSetBreakEven = (id: string) => {
    tacticalAudio.playClick();
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stopLoss: p.entryPrice } : p))
    );
  };

  // Autonomous Sweep Hunter Trading Module Engine
  const {
    isAiAutonomyEnabled,
    toggleAiAutonomy,
    autonomousStatus,
    tradeLogs,
    lastDecision,
    decisionHistory,
    totalAutonomousPnl,
    winRatePct,
    triggerManualTacticalSweep,
  } = useSweepHunterAutonomous({
    activeAsset,
    candles,
    cvdDelta,
    oracleData,
    orderbookImbalance,
    selectedProtocol,
    walletState,
    positions,
    onExecuteOrder: handleExecuteOrder,
    onClosePosition: handleClosePosition,
    onSetBreakEven: handleSetBreakEven,
  });

  // Update open positions on each live price tick
  useEffect(() => {
    setPositions((prevPositions) =>
      prevPositions.map((pos) => {
        const asset = assets.find((a) => a.symbol === pos.symbol);
        const currentMark = asset ? asset.currentPrice : pos.markPrice;

        const priceDiff =
          pos.side === 'LONG' ? currentMark - pos.entryPrice : pos.entryPrice - currentMark;
        const pnl = priceDiff * pos.size;
        const roe = (pnl / pos.margin) * 100;

        return {
          ...pos,
          markPrice: currentMark,
          pnl: Number(pnl.toFixed(2)),
          roe: Number(roe.toFixed(2)),
        };
      })
    );
  }, [assets]);

  // Determine DEFCON Level based on positions risk & market volatility
  const hasDanger = positions.some(
    (p) =>
      (p.side === 'LONG' && p.markPrice <= p.liquidationPrice * 1.05) ||
      (p.side === 'SHORT' && p.markPrice >= p.liquidationPrice * 0.95)
  );
  const defconLevel = oracleData.trend1h.isBlocked ? 1 : hasDanger ? 1 : Math.abs(activeAsset.change24h) > 5 ? 2 : 3;

  const activeSkillsNames = skills.filter((s) => s.activeInRadar).map((s) => s.name);
  const currentNumericBalance = parseFloat(walletState.usdtBalance.replace(/[^0-9.]/g, '')) || 0;

  // Handle verdict apply
  const handleApplyVerdictToOrder = (verdict: OracleVerdictType) => {
    if (verdict === 'LONG') {
      setAiPreset({
        side: 'LONG',
        leverage: 20,
        takeProfit: Number((btcAsset.currentPrice * 1.035).toFixed(2)),
        stopLoss: Number((btcAsset.currentPrice * 0.985).toFixed(2)),
      });
      tacticalAudio.playVictory();
    } else if (verdict === 'SHORT') {
      setAiPreset({
        side: 'SHORT',
        leverage: 20,
        takeProfit: Number((btcAsset.currentPrice * 0.965).toFixed(2)),
        stopLoss: Number((btcAsset.currentPrice * 1.015).toFixed(2)),
      });
      tacticalAudio.playStrikeLaunch('SHORT');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#04070b] text-slate-100 flex flex-col font-mono-military selection:bg-cyan-500 selection:text-black">
      {/* CRT Scanline overlay effect */}
      {scanlinesEnabled && <div className="fixed inset-0 scanlines pointer-events-none z-50 opacity-40" />}

      {/* Military HUD Header */}
      <HeaderHUD
        walletState={walletState}
        onOpenVault={() => setShowVaultModal(true)}
        selectedProtocol={selectedProtocol}
        onSelectProtocol={setSelectedProtocol}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSkills={() => setShowSkillsModal(true)}
        onOpenWarGame={() => setShowWarGameModal(true)}
        onOpenRadar={() => setShowRadarModal(true)}
        onOpenComms={() => setShowCommsModal(true)}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled((prev) => !prev)}
        defconLevel={defconLevel}
        oracleVerdict={oracleData.verdict.type}
        onOpenOracle={() => setMainWorkspaceTab('ORACLE')}
      />

      {/* Main Warfare Terminal Workspace */}
      <main className="flex-1 p-2 sm:p-3 max-w-[1920px] mx-auto w-full flex flex-col gap-3">
        {/* Top Grid: Main Chart/Oracle/Sweeps & AI / Order Execution Column */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
          {/* Main Area (8 cols on XL) with Workspace Switcher */}
          <div className="xl:col-span-8 flex flex-col gap-2 min-h-[460px]">
            {/* Top Workspace Tab Switcher */}
            <div className="flex items-center justify-between bg-[#08121d] p-1.5 rounded border border-cyan-900/60">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setMainWorkspaceTab('CHART');
                  }}
                  className={`px-3 py-1.5 rounded font-warfare font-bold text-xs uppercase transition-all cursor-pointer ${
                    mainWorkspaceTab === 'CHART'
                      ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📈 GRÁFICO BÉLICO
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setMainWorkspaceTab('ORACLE');
                  }}
                  className={`px-3 py-1.5 rounded font-warfare font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    mainWorkspaceTab === 'ORACLE'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔮 ORÁCULO BTC (HYPERLIQUID)</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                      oracleData.verdict.type === 'BLOQUEADO'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500 animate-pulse'
                        : oracleData.verdict.type === 'LONG'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        : oracleData.verdict.type === 'SHORT'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500'
                        : 'bg-black text-amber-300 border border-amber-600'
                    }`}
                  >
                    {oracleData.verdict.type}
                  </span>
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setMainWorkspaceTab('SWEEPS');
                  }}
                  className={`px-3 py-1.5 rounded font-warfare font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    mainWorkspaceTab === 'SWEEPS'
                      ? 'bg-amber-600 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎯 SWEEP HUNTER AUTÓNOMO</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                      isAiAutonomyEnabled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 animate-pulse'
                        : 'bg-black text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isAiAutonomyEnabled ? 'IA ON' : 'IA OFF'}
                  </span>
                </button>
              </div>

              {/* Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                <span>REGLA 1H:</span>
                <span
                  className={`font-bold ${
                    oracleData.trend1h.isBlocked ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {oracleData.trend1h.isBlocked ? '⛔ BLOQUEO ACTIVO (1H ROJO)' : '✅ ENTRADAS PERMITIDAS'}
                </span>
              </div>
            </div>

            {/* Dynamic View based on Workspace Tab */}
            <div className="flex-1 min-h-[440px]">
              {mainWorkspaceTab === 'CHART' && (
                <ChartHUD
                  assets={assets}
                  activeAsset={activeAsset}
                  onSelectSymbol={setSelectedSymbol}
                  candles={candles}
                  timeframe={timeframe}
                  onChangeTimeframe={setTimeframe}
                  rsi={rsi}
                  cvdDelta={cvdDelta}
                />
              )}

              {mainWorkspaceTab === 'ORACLE' && (
                <BtcOracleTab
                  btcPrice={btcAsset.currentPrice}
                  candles1h={candles}
                  candles15m={candles}
                  oracleData={oracleData}
                  onRefreshData={updateOracleCalculations}
                  onApplyVerdictToOrder={handleApplyVerdictToOrder}
                />
              )}

              {mainWorkspaceTab === 'SWEEPS' && (
                <SweepHunterTab
                  activeAsset={activeAsset}
                  candles={candles}
                  cvdDelta={cvdDelta}
                  selectedProtocol={selectedProtocol}
                  walletState={walletState}
                  positions={positions}
                  oracleData={oracleData}
                  isAiAutonomyEnabled={isAiAutonomyEnabled}
                  toggleAiAutonomy={toggleAiAutonomy}
                  autonomousStatus={autonomousStatus}
                  tradeLogs={tradeLogs}
                  lastDecision={lastDecision}
                  decisionHistory={decisionHistory}
                  totalAutonomousPnl={totalAutonomousPnl}
                  winRatePct={winRatePct}
                  onClosePosition={handleClosePosition}
                  triggerManualTacticalSweep={triggerManualTacticalSweep}
                />
              )}
            </div>

            {/* Positions Table in main area */}
            <div className="min-h-[200px]">
              <PositionsManager
                positions={positions}
                onClosePosition={handleClosePosition}
                onSetBreakEven={handleSetBreakEven}
                closedPositionsCount={closedCount}
                totalPnl={totalRealizedPnl}
              />
            </div>
          </div>

          {/* Right Operational Control Column (4 cols on XL) */}
          <div className="xl:col-span-4 flex flex-col gap-3">
            {/* Tactical AI Intelligence Engine */}
            <div className="min-h-[320px]">
              <TacticalAiPanel
                activeAsset={activeAsset}
                rsi={rsi}
                cvdDelta={cvdDelta}
                orderbookImbalance={orderbookImbalance}
                timeframe={timeframe}
                activeSkillsNames={activeSkillsNames}
                protocol={selectedProtocol}
                candles={candles}
                onApplyAiSetup={(setup) => setAiPreset(setup)}
                autoPilotEnabled={autoPilotEnabled}
                onToggleAutoPilot={() => setAutoPilotEnabled((prev) => !prev)}
              />
            </div>

            {/* Order Execution Panel with Oracle Enforcement */}
            <div className="min-h-[360px]">
              <OrderExecutionPanel
                activeAsset={activeAsset}
                balance={currentNumericBalance}
                selectedProtocol={selectedProtocol}
                walletState={walletState}
                onExecuteOrder={handleExecuteOrder}
                isOracleBlocked={oracleData.trend1h.isBlocked}
                oracleBlockReason={oracleData.verdict.explanation}
                aiPreset={aiPreset}
              />
            </div>

            {/* Live Orderbook & Trades Tape */}
            <div className="min-h-[340px]">
              <OrderBookTapeHUD
                bids={bids}
                asks={asks}
                trades={trades}
                currentPrice={activeAsset.currentPrice}
                imbalance={orderbookImbalance}
              />
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {/* 1. MetaMask & Web3 Vault Hub Modal */}
      <MetaMaskVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        selectedProtocol={selectedProtocol}
        onSelectProtocol={setSelectedProtocol}
        onUpdateAgentWallet={(agent) =>
          setWalletState((prev) => ({ ...prev, agentWallet: agent }))
        }
        onFaucetUsdt={handleFaucet}
        onImportWallet={handleImportWallet}
      />

      {/* 2. Trading Skills Database Modal */}
      <SkillsDatabaseModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        skills={skills}
        onToggleSkill={handleToggleSkill}
      />

      {/* 3. SURPRISE GIFT: Black Ops War Room Simulator Modal */}
      <WarGameModal
        isOpen={showWarGameModal}
        onClose={() => setShowWarGameModal(false)}
      />

      {/* 4. Liquidation Cascades Heatmap Radar Modal */}
      <LiquidationRadar
        isOpen={showRadarModal}
        onClose={() => setShowRadarModal(false)}
      />

      {/* 5. AI Radio Comms Chat Modal */}
      <AiCommsChat
        isOpen={showCommsModal}
        onClose={() => setShowCommsModal(false)}
        marketContext={{
          symbol: activeAsset.symbol,
          price: activeAsset.currentPrice,
          change24h: activeAsset.change24h,
          rsi,
          cvdDelta,
          orderbookImbalance,
          protocol: selectedProtocol,
          oracleVerdict: oracleData.verdict.type,
          isOracleBlocked: oracleData.trend1h.isBlocked,
        }}
        positions={positions}
      />
    </div>
  );
}
