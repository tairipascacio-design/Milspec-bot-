import React, { useState } from 'react';
import { CryptoAsset, OrderSide, MarginMode } from '../types/trading';
import { ProtocolId, PROTOCOLS, Web3WalletState } from '../types/protocols';
import { Crosshair, Shield, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Cpu, CheckCircle } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import { ProtocolEnginesService } from '../services/protocolEngines';

interface OrderExecutionPanelProps {
  activeAsset: CryptoAsset;
  balance: number;
  selectedProtocol: ProtocolId;
  walletState: Web3WalletState;
  onExecuteOrder: (order: {
    symbol: string;
    side: OrderSide;
    margin: number;
    leverage: number;
    marginMode: MarginMode;
    takeProfit?: number;
    stopLoss?: number;
    protocol: ProtocolId;
  }) => void;
  isOracleBlocked?: boolean;
  oracleBlockReason?: string;
  aiPreset?: {
    side: OrderSide;
    leverage: number;
    takeProfit: number;
    stopLoss: number;
  } | null;
}

export const OrderExecutionPanel: React.FC<OrderExecutionPanelProps> = ({
  activeAsset,
  balance,
  selectedProtocol,
  walletState,
  onExecuteOrder,
  isOracleBlocked = false,
  oracleBlockReason = '',
  aiPreset,
}) => {
  const currentProto = PROTOCOLS[selectedProtocol];
  const maxLeverageAllowed = Math.min(activeAsset.maxLeverage, currentProto.maxLeverage);

  const [side, setSide] = useState<OrderSide>('LONG');
  const [marginMode, setMarginMode] = useState<MarginMode>('ISOLATED');
  const [leverage, setLeverage] = useState<number>(20);
  const [amountUsdt, setAmountUsdt] = useState<number>(1000);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [executionReceipt, setExecutionReceipt] = useState<{
    txHash: string;
    response: string;
  } | null>(null);

  React.useEffect(() => {
    if (aiPreset) {
      setSide(aiPreset.side);
      setLeverage(Math.min(maxLeverageAllowed, aiPreset.leverage));
      setTakeProfit(aiPreset.takeProfit.toString());
      setStopLoss(aiPreset.stopLoss.toString());
    }
  }, [aiPreset, maxLeverageAllowed]);

  const notionalSize = amountUsdt * leverage;
  const currentPrice = activeAsset.currentPrice;

  const estLiqPrice =
    side === 'LONG'
      ? Math.max(0, currentPrice * (1 - (1 / leverage) * 0.9))
      : currentPrice * (1 + (1 / leverage) * 0.9);

  const liqDistancePct = Math.abs(((estLiqPrice - currentPrice) / currentPrice) * 100).toFixed(2);

  const handlePercentSelect = (pct: number) => {
    tacticalAudio.playClick();
    const allocated = Math.floor(balance * (pct / 100));
    setAmountUsdt(Math.max(10, allocated));
  };

  const handleApplyTacticalRatio = () => {
    tacticalAudio.playClick();
    if (side === 'LONG') {
      const sl = Number((currentPrice * 0.985).toFixed(2));
      const tp = Number((currentPrice * 1.045).toFixed(2));
      setStopLoss(sl.toString());
      setTakeProfit(tp.toString());
    } else {
      const sl = Number((currentPrice * 1.015).toFixed(2));
      const tp = Number((currentPrice * 0.955).toFixed(2));
      setStopLoss(sl.toString());
      setTakeProfit(tp.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOracleBlocked) {
      tacticalAudio.playKlaxon();
      alert(`ENTRADA BLOQUEADA POR EL ORÁCULO BTC: ${oracleBlockReason || 'BTC 1H en rojo. Por regla estricta de protección de capital no se autorizan nuevas entradas.'}`);
      return;
    }
    if (amountUsdt > balance) {
      tacticalAudio.playKlaxon();
      alert('MUNICIÓN INSUFICIENTE: Recargue USDT en la Bóveda Web3.');
      return;
    }
    if (amountUsdt <= 0) return;

    tacticalAudio.playStrikeLaunch(side);

    // Protocol dispatch
    const dispatchResult = await ProtocolEnginesService.dispatchOrder(selectedProtocol, {
      symbol: activeAsset.symbol,
      side,
      margin: amountUsdt,
      leverage,
      marginMode,
      price: currentPrice,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      walletAddress: walletState.address || undefined,
      agentWalletAddress: walletState.agentWallet?.address,
    });

    setExecutionReceipt({
      txHash: dispatchResult.txHash,
      response: dispatchResult.protocolResponse,
    });

    onExecuteOrder({
      symbol: activeAsset.symbol,
      side,
      margin: amountUsdt,
      leverage,
      marginMode,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      protocol: selectedProtocol,
    });
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#060b12] border rounded tactical-box overflow-hidden ${
        side === 'LONG' ? 'border-emerald-900/60 tactical-box-success' : 'border-rose-900/60 tactical-box-danger'
      }`}
    >
      {/* Panel Tactical Header */}
      <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#08111c] px-3 py-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="font-warfare text-xs tracking-wider font-bold text-white uppercase">
            PANEL DE DISPARO · {currentProto.name}
          </span>
        </div>

        {/* Margin Mode Selector */}
        <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-slate-800 text-[10px] font-mono-military">
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playClick();
              setMarginMode('ISOLATED');
            }}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              marginMode === 'ISOLATED' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            ISOLATED
          </button>
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playClick();
              setMarginMode('CROSS');
            }}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              marginMode === 'CROSS' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            CROSS
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-3 font-mono-military text-xs flex-1">
        {/* Active Engine Badge */}
        <div className="bg-black/60 p-2 rounded border border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">MOTOR DE EJECUCIÓN:</span>
          <span className="font-bold flex items-center gap-1.5" style={{ color: currentProto.color }}>
            <Cpu className="w-3.5 h-3.5 inline" />
            {currentProto.badge} ({currentProto.chain})
          </span>
        </div>

        {/* Agent Wallet badge if authorized */}
        {walletState.agentWallet && (
          <div className="bg-emerald-950/40 p-1.5 rounded border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center justify-between">
            <span className="font-bold">⚡ AGENT WALLET AUTORIZADA:</span>
            <span>{walletState.agentWallet.address.slice(0, 8)}...</span>
          </div>
        )}

        {/* Order Side Buttons: LONG vs SHORT */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playClick();
              setSide('LONG');
            }}
            className={`py-2 rounded flex items-center justify-center gap-1.5 font-extrabold tracking-wider transition-all cursor-pointer ${
              side === 'LONG'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)] border border-emerald-400'
                : 'bg-emerald-950/30 text-emerald-600 hover:bg-emerald-950/60 border border-emerald-900/40'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ATAQUE LONG</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tacticalAudio.playClick();
              setSide('SHORT');
            }}
            className={`py-2 rounded flex items-center justify-center gap-1.5 font-extrabold tracking-wider transition-all cursor-pointer ${
              side === 'SHORT'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.5)] border border-rose-400'
                : 'bg-rose-950/30 text-rose-600 hover:bg-rose-950/60 border border-rose-900/40'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>ATAQUE SHORT</span>
          </button>
        </div>

        {/* Leverage Controls */}
        <div className="bg-black/50 p-2.5 rounded border border-slate-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-slate-400">APALANCAMIENTO BÉLICO:</span>
            <span className="font-extrabold text-amber-400 text-sm">{leverage}x</span>
          </div>

          <input
            type="range"
            min={1}
            max={maxLeverageAllowed}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between mt-1 text-[10px] text-slate-400">
            {[5, 10, 20, Math.min(50, maxLeverageAllowed), maxLeverageAllowed].map((lev, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  tacticalAudio.playClick();
                  setLeverage(lev);
                }}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  leverage === lev ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-white'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Margin Ammo Input (USDT) */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>COLATERAL (MARGEN USDT):</span>
            <span>
              DISPONIBLE: <strong className="text-white">${balance.toLocaleString()}</strong>
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={10}
              max={balance}
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(Number(e.target.value))}
              className="w-full bg-black/70 border border-cyan-900/70 focus:border-cyan-400 text-white font-bold px-3 py-2 rounded focus:outline-none"
              placeholder="1000"
            />
            <span className="absolute right-3 top-2 text-cyan-400 font-bold">USDT</span>
          </div>

          {/* Quick Percent Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                type="button"
                key={pct}
                onClick={() => handlePercentSelect(pct)}
                className="py-1 rounded bg-black/60 hover:bg-cyan-950 border border-slate-800 text-[10px] text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Take Profit & Stop Loss inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-emerald-400 block mb-0.5">TAKE PROFIT (TP)</span>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-black/70 border border-emerald-900/50 focus:border-emerald-400 text-white px-2 py-1.5 rounded text-xs focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-rose-400 block mb-0.5">STOP LOSS (SL)</span>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-black/70 border border-rose-900/50 focus:border-rose-400 text-white px-2 py-1.5 rounded text-xs focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyTacticalRatio}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 py-0.5 border border-dashed border-cyan-800/60 rounded cursor-pointer"
        >
          <Target className="w-3 h-3" />
          <span>AUTOCALCULAR RATIO BÉLICO 1:3 TÁCTICO</span>
        </button>

        {/* Risk & Telemetry Summary Box */}
        <div className="bg-black/80 p-2.5 rounded border border-slate-800/90 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">VALOR NOCIONAL:</span>
            <span className="font-bold text-white">${notionalSize.toLocaleString()} USDT</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">LIQUIDACIÓN ESTIMADA:</span>
            <span className={`font-bold ${leverage > 30 ? 'text-rose-400' : 'text-amber-300'}`}>
              ${estLiqPrice.toFixed(2)} ({liqDistancePct}%)
            </span>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
            <span>ORÁCULO Y VERIFICACIÓN:</span>
            <span className="text-emerald-400 font-bold">{currentProto.oracle}</span>
          </div>
        </div>

        {/* Execution receipt notification if present */}
        {executionReceipt && (
          <div className="bg-emerald-950/30 p-2 rounded border border-emerald-500/40 text-[10px] space-y-0.5">
            <div className="text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>ORDEN TRANSMITIDA AL MOTOR</span>
            </div>
            <p className="text-slate-300 text-[10px]">{executionReceipt.response}</p>
            <p className="text-slate-500 font-mono-military text-[9px]">TX: {executionReceipt.txHash.slice(0, 24)}...</p>
          </div>
        )}

        {/* Primary Launch Execution Button */}
        {isOracleBlocked ? (
          <div className="w-full py-3 px-2 rounded bg-rose-950/90 border border-rose-500/80 text-rose-300 font-warfare font-bold text-xs uppercase tracking-wider text-center shadow-[0_0_15px_rgba(244,63,94,0.3)] mt-auto animate-pulse flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>BLOQUEADO: BTC 1H EN ROJO (ORÁCULO)</span>
          </div>
        ) : (
          <button
            type="submit"
            className={`w-full py-3 rounded font-warfare font-bold text-sm uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto ${
              side === 'LONG'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.5)] border border-emerald-400'
                : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.5)] border border-rose-400'
            }`}
          >
            <Zap className="w-4 h-4 fill-current animate-pulse" />
            <span>EJECUTAR ORDEN EN {currentProto.badge}</span>
          </button>
        )}
      </form>
    </div>
  );
};
