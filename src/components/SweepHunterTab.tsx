import React, { useState } from 'react';
import { CryptoAsset, CandleData, OrderSide, Position } from '../types/trading';
import { ProtocolId, PROTOCOLS, Web3WalletState } from '../types/protocols';
import { BtcOracleData } from '../services/btcOracleEngine';
import {
  SweepDetectorEngine,
  SweepSignal,
  FalseBreakoutSignal,
  FakeSweepSignal,
} from '../services/sweepDetector';
import {
  AutonomousAiStatus,
  SweepHunterTradeLog,
  SweepHunterDecision,
} from '../types/sweepHunter';
import {
  Crosshair,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BookOpen,
  Calculator,
  Target,
  CheckCircle,
  Clock,
  Activity,
  Cpu,
  Lock,
  Unlock,
  Power,
  RefreshCw,
  Wallet,
  DollarSign,
  History,
  Radio,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SweepHunterTabProps {
  activeAsset: CryptoAsset;
  candles: CandleData[];
  cvdDelta: number;
  selectedProtocol: ProtocolId;
  walletState: Web3WalletState;
  positions: Position[];
  oracleData: BtcOracleData;
  isAiAutonomyEnabled: boolean;
  toggleAiAutonomy: () => void;
  autonomousStatus: AutonomousAiStatus;
  tradeLogs: SweepHunterTradeLog[];
  lastDecision: SweepHunterDecision | null;
  decisionHistory: SweepHunterDecision[];
  totalAutonomousPnl: number;
  winRatePct: number;
  onClosePosition: (id: string) => void;
  triggerManualTacticalSweep: (side: OrderSide) => void;
}

export const SweepHunterTab: React.FC<SweepHunterTabProps> = ({
  activeAsset,
  candles,
  cvdDelta,
  selectedProtocol,
  walletState,
  positions,
  oracleData,
  isAiAutonomyEnabled,
  toggleAiAutonomy,
  autonomousStatus,
  tradeLogs,
  lastDecision,
  decisionHistory,
  totalAutonomousPnl,
  winRatePct,
  onClosePosition,
  triggerManualTacticalSweep,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'AUTONOMOUS_HUB' | 'RADAR_SCAN' | 'MATH_FORMULAS' | 'AI_RULES'>('AUTONOMOUS_HUB');

  // Math detectors always active
  const sweepSignal: SweepSignal = SweepDetectorEngine.detectLiquiditySweep(candles, 20);
  const falseBreakoutSignal: FalseBreakoutSignal = SweepDetectorEngine.detectFalseBreakout(candles, cvdDelta);
  const fakeSweepSignal: FakeSweepSignal = SweepDetectorEngine.detectFakeSweep(candles, activeAsset.currentPrice);

  const currentProto = PROTOCOLS[selectedProtocol];
  const activeHunterPositions = positions.filter((p) => p.symbol === activeAsset.symbol);
  const currentUnrealizedPnl = activeHunterPositions.reduce((acc, p) => acc + p.pnl, 0);

  // Status badge styling helper
  const renderStatusBadge = () => {
    switch (autonomousStatus) {
      case 'OFF':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/80 border border-slate-700 text-slate-400 font-mono text-xs">
            <Power className="w-3.5 h-3.5 text-slate-500" />
            <span>AUTONOMÍA IA: OFF (MANUAL / OBSERVACIÓN)</span>
          </span>
        );
      case 'MONITORING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/70 border border-emerald-500 text-emerald-300 font-mono text-xs shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>AUTONOMÍA IA: ON · VIGILANCIA ACTIVA DE BARRIDAS</span>
          </span>
        );
      case 'EVALUATING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-mono text-xs animate-pulse">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>EVALUANDO DISPARO CON GEMINI 3.8 FLASH</span>
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 border border-amber-400 text-amber-200 font-mono text-xs animate-pulse">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>EJECUTANDO ORDEN AUTÓNOMA EN {currentProto.badge}</span>
          </span>
        );
      case 'MANAGING_POSITIONS':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-950/70 border border-purple-500 text-purple-200 font-mono text-xs">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>SUPERVISANDO POSICIONES ACTIVAS (TP / SL / BE)</span>
          </span>
        );
      case 'BLOCKED_ORACLE_RED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/90 border border-rose-500 text-rose-300 font-mono text-xs shadow-[0_0_14px_rgba(244,63,94,0.4)] animate-pulse">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>BLOQUEADO: BTC 1H EN ROJO (ENTRADAS PAUSADAS)</span>
          </span>
        );
      case 'BLOCKED_SAFETY':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-mono text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>BLOQUEADO: FILTRO ANTI-INDUCEMENT ACTIVO</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05090f] border border-cyan-900/60 rounded tactical-box overflow-hidden font-mono-military text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      {/* Top Autonomy Commander Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-950/80 bg-[#08121d] px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          {/* Main AI Autonomy Switch Button */}
          <button
            onClick={toggleAiAutonomy}
            className={`px-4 py-2 rounded-lg font-warfare font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isAiAutonomyEnabled
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-slate-900 to-black text-slate-400 border border-slate-700 hover:border-slate-500'
            }`}
            title="Activa o desactiva la autonomía de la IA para comprar y vender automáticamente"
          >
            <Power className={`w-4 h-4 ${isAiAutonomyEnabled ? 'text-white animate-pulse' : 'text-slate-500'}`} />
            <span>AUTONOMÍA IA: {isAiAutonomyEnabled ? 'ON (ACTIVA)' : 'OFF (DETENIDA)'}</span>
          </button>

          {/* Dynamic Status Badge */}
          {renderStatusBadge()}
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 bg-black/70 p-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('AUTONOMOUS_HUB');
            }}
            className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
              activeSubTab === 'AUTONOMOUS_HUB'
                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ HUB AUTÓNOMO & LOGS
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('RADAR_SCAN');
            }}
            className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
              activeSubTab === 'RADAR_SCAN'
                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 RADAR DE BARRIDAS
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveSubTab('MATH_FORMULAS');
            }}
            className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
              activeSubTab === 'MATH_FORMULAS'
                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📐 FÓRMULAS & REGLAS
          </button>
        </div>
      </div>

      {/* System Telemetry Engines Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 bg-black/60 border-b border-cyan-950/60 text-[11px]">
        {/* 1. Hyperliquid Status */}
        <div className="p-2 rounded bg-black/70 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">HYPERLIQUID L1:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE FEED
          </span>
        </div>

        {/* 2. BTC Oracle Status */}
        <div className="p-2 rounded bg-black/70 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">ORÁCULO BTC 1H:</span>
          <span
            className={`font-bold flex items-center gap-1 ${
              oracleData.trend1h.isBlocked ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {oracleData.trend1h.isBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {oracleData.trend1h.color} ({oracleData.trend1h.variationPct}%)
          </span>
        </div>

        {/* 3. Sweep Detector Status */}
        <div className="p-2 rounded bg-black/70 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">BARRIDA DETECTADA:</span>
          <span
            className={`font-bold ${
              sweepSignal.type === 'SSL_SWEEP_BULLISH'
                ? 'text-emerald-300'
                : sweepSignal.type === 'BSL_SWEEP_BEARISH'
                ? 'text-rose-300'
                : 'text-slate-400'
            }`}
          >
            {sweepSignal.type.replace('_SWEEP', '').replace('_', ' ')}
          </span>
        </div>

        {/* 4. Risk Engine / Kelly status */}
        <div className="p-2 rounded bg-black/70 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">RISK ENGINE:</span>
          <span className="text-cyan-300 font-bold">KELLY 1/2 ACTIVO</span>
        </div>
      </div>

      {/* Capital Real vs Capital Simulado Separation Box */}
      <div className="p-2.5 bg-[#070e17] border-b border-cyan-950/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {/* Real Web3 Capital (MetaMask) */}
        <div className="p-2.5 rounded bg-black/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block leading-tight">BÓVEDA REAL (METAMASK)</span>
              <span className="font-bold text-white font-mono">{walletState.ethBalance}</span>
            </div>
          </div>
          <div className="text-right text-[10px]">
            <span className="text-emerald-400 font-bold block">{walletState.chainName}</span>
            <span className="text-slate-500">Fondos protegidos on-chain</span>
          </div>
        </div>

        {/* Combat Simulated Capital */}
        <div className="p-2.5 rounded bg-black/80 border border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block leading-tight">CAPITAL DE COMBATE SWEEP HUNTER</span>
              <span className="font-bold text-cyan-300 font-mono">{walletState.usdtBalance}</span>
            </div>
          </div>
          <div className="text-right text-[10px]">
            <span className="text-slate-300 font-bold block">
              PnL Realizado: <strong className={totalAutonomousPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${totalAutonomousPnl.toFixed(2)}</strong>
            </span>
            <span className="text-cyan-400 font-bold">Tasa Acierto: {winRatePct}%</span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* SUBTAB 1: AUTONOMOUS HUB & LOGS */}
        {activeSubTab === 'AUTONOMOUS_HUB' && (
          <div className="space-y-3">
            {/* Last Autonomous AI Decision Card */}
            <div className="bg-[#091522] p-3.5 rounded-lg border border-cyan-500/40 space-y-2.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-warfare text-xs font-bold text-white uppercase tracking-wider">
                    ÚLTIMA DECISIÓN DE LA IA Y JUSTIFICACIÓN BÉLICA
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    {lastDecision ? new Date(lastDecision.timestamp).toLocaleTimeString('es-ES') : 'EN ESPERA'}
                  </span>
                </div>

                {lastDecision && (
                  <span
                    className={`font-warfare text-xs font-extrabold px-2.5 py-0.5 rounded border ${
                      lastDecision.action === 'LONG'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : lastDecision.action === 'SHORT'
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : 'bg-amber-950 text-amber-300 border-amber-600'
                    }`}
                  >
                    VEREDICTO: {lastDecision.action} ({lastDecision.confidence}%)
                  </span>
                )}
              </div>

              {lastDecision ? (
                <div className="space-y-2">
                  <div className="bg-black/60 p-2.5 rounded border border-slate-800/80 text-xs">
                    <p className="text-slate-200 italic leading-relaxed">
                      "{lastDecision.reasoning}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="bg-black/40 p-1.5 rounded border border-slate-900">
                      <span className="text-slate-500 block text-[10px]">ESTRATEGIA:</span>
                      <span className="text-cyan-300 font-bold">{lastDecision.strategy}</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-slate-900">
                      <span className="text-slate-500 block text-[10px]">ESTADO ORÁCULO:</span>
                      <span className="text-emerald-400 font-bold">{lastDecision.oracleStatus}</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-slate-900">
                      <span className="text-slate-500 block text-[10px]">RIESGO KELLY:</span>
                      <span className="text-amber-300 font-bold">{lastDecision.riskEvaluation}</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-slate-900">
                      <span className="text-slate-500 block text-[10px]">AMENAZA:</span>
                      <span className="text-white font-bold">{lastDecision.threatLevel}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-slate-500 text-xs">
                  Sin decisiones recientes. Active la autonomía de la IA para que el motor evalúe barridas de liquidez de forma continua.
                </div>
              )}
            </div>

            {/* Open Positions Managed by Sweep Hunter */}
            <div className="bg-black/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
                <span className="font-warfare font-bold text-white uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  POSICIONES ABIERTAS SUPERVISADAS ({activeHunterPositions.length})
                </span>
                <span className="text-slate-400 text-[11px]">
                  PnL No Realizado:{' '}
                  <strong className={currentUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ${currentUnrealizedPnl.toFixed(2)} USDT
                  </strong>
                </span>
              </div>

              {activeHunterPositions.length > 0 ? (
                <div className="space-y-2">
                  {activeHunterPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-2.5 rounded bg-black/80 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                              : 'bg-rose-950 text-rose-300 border border-rose-500'
                          }`}
                        >
                          {pos.side} {pos.leverage}x
                        </span>
                        <div>
                          <span className="font-bold text-white">{pos.symbol}</span>
                          <span className="text-slate-400 text-[10px] block">
                            Entrada: ${pos.entryPrice.toFixed(2)} | Mark: ${pos.markPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* TP & SL targets */}
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-emerald-400">TP: ${pos.takeProfit?.toFixed(2) || 'Sin TP'}</div>
                        <div className="text-rose-400">SL: ${pos.stopLoss?.toFixed(2) || 'Sin SL'}</div>
                      </div>

                      {/* Realized / Unrealized PnL & Action */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span
                            className={`font-warfare text-sm font-extrabold block ${
                              pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.roe.toFixed(2)}%)
                          </span>
                          <span className="text-slate-500 text-[10px]">Margen: ${pos.margin} USDT</span>
                        </div>

                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          CERRAR AHORA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-2 text-center italic">
                  No hay posiciones abiertas en este momento. La IA entrará cuando detecte una barrida con confluencia y el Oráculo lo autorice.
                </p>
              )}
            </div>

            {/* Executed Trades History Table */}
            <div className="bg-black/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
                <span className="font-warfare font-bold text-white uppercase flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  HISTORIAL DE OPERACIONES AUTÓNOMAS ({tradeLogs.length})
                </span>
                <span className="text-[10px] text-slate-500">Últimos disparos de la IA</span>
              </div>

              {tradeLogs.length > 0 ? (
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-[11px] font-mono-military">
                    <thead className="bg-[#08121d] text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Hora</th>
                        <th className="p-2">Activo</th>
                        <th className="p-2">Lado</th>
                        <th className="p-2">Entrada</th>
                        <th className="p-2">Salida</th>
                        <th className="p-2">TP / SL</th>
                        <th className="p-2">PnL</th>
                        <th className="p-2">Estado</th>
                        <th className="p-2">Estrategia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tradeLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="p-2 text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                          </td>
                          <td className="p-2 font-bold text-white">{log.symbol}</td>
                          <td className="p-2 font-bold">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] ${
                                log.side === 'LONG'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {log.side} {log.leverage}x
                            </span>
                          </td>
                          <td className="p-2 text-slate-300">${log.entryPrice.toFixed(2)}</td>
                          <td className="p-2 text-slate-300">
                            {log.exitPrice ? `$${log.exitPrice.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-2 text-[10px] text-slate-400">
                            ${log.takeProfit.toFixed(0)} / ${log.stopLoss.toFixed(0)}
                          </td>
                          <td className="p-2 font-bold font-mono">
                            {log.pnl !== undefined ? (
                              <span className={log.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {log.pnl >= 0 ? '+' : ''}${log.pnl.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-amber-400">EN CURSO</span>
                            )}
                          </td>
                          <td className="p-2 text-[10px]">
                            {log.status === 'OPEN' && (
                              <span className="text-cyan-300 font-bold">ABIERTA</span>
                            )}
                            {log.status === 'CLOSED_TP' && (
                              <span className="text-emerald-400 font-bold">TP ALCANZADO</span>
                            )}
                            {log.status === 'CLOSED_SL' && (
                              <span className="text-rose-400 font-bold">SL EJECUTADO</span>
                            )}
                            {log.status === 'CLOSED_MANUAL' && (
                              <span className="text-slate-400">CIERRE MANUAL</span>
                            )}
                          </td>
                          <td className="p-2 text-[10px] text-slate-400 truncate max-w-xs" title={log.reason}>
                            {log.strategyUsed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-3 text-center italic">
                  Aún no se han ejecutado operaciones en esta sesión.
                </p>
              )}
            </div>

            {/* Autonomous Simulation & Instant Testing Bar */}
            <div className="bg-[#091522] p-3 rounded-lg border border-cyan-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-warfare font-bold text-white uppercase block">
                  BANCO DE PRUEBAS DE DISPARO AUTÓNOMO
                </span>
                <span className="text-[11px] text-slate-400">
                  Permite comprobar el flujo completo de ejecución, validación de riesgo y log sin arriesgar capital real.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerManualTacticalSweep('LONG')}
                  disabled={oracleData.trend1h.isBlocked}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1 shadow-md"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>PROBAR DISPARO LONG</span>
                </button>

                <button
                  onClick={() => triggerManualTacticalSweep('SHORT')}
                  disabled={oracleData.trend1h.isBlocked}
                  className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1 shadow-md"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>PROBAR DISPARO SHORT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: RADAR DE BARRIDAS EN VIVO */}
        {activeSubTab === 'RADAR_SCAN' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Liquidity Sweep */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  sweepSignal.type === 'SSL_SWEEP_BULLISH'
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : sweepSignal.type === 'BSL_SWEEP_BEARISH'
                    ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-black/50 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">MÓDULO 01</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                        sweepSignal.type !== 'NONE'
                          ? 'bg-amber-500 text-black animate-pulse'
                          : 'bg-black text-slate-500 border border-slate-800'
                      }`}
                    >
                      {sweepSignal.type !== 'NONE' ? 'BARRIDA ACTIVA' : 'EN ESPERA'}
                    </span>
                  </div>
                  <h3 className="font-warfare text-sm font-bold text-white mb-1.5">
                    BARRIDA DE LIQUIDEZ (SWEEP)
                  </h3>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {sweepSignal.description}
                  </p>
                  <div className="bg-black/60 p-2 rounded text-[10px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">NIVEL SWING:</span>
                      <span className="font-bold text-white">${sweepSignal.levelPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RATIO MECHA:</span>
                      <span className="font-bold text-cyan-300">{Math.round(sweepSignal.wickRatio * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">VOLUMEN:</span>
                      <span className="font-bold text-amber-400">{sweepSignal.volumeMultiplier}x SMA20</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">CONFLUENCIA:</span>
                  <span className="font-extrabold text-sm text-cyan-300">{sweepSignal.confidenceScore}%</span>
                </div>
              </div>

              {/* 2. False Breakout SFP */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  falseBreakoutSignal.status === 'FALSE_BREAKOUT_BULL_TRAP'
                    ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : falseBreakoutSignal.status === 'FALSE_BREAKOUT_BEAR_TRAP'
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-black/50 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">MÓDULO 02</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                        falseBreakoutSignal.status !== 'NONE'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-black text-slate-500 border border-slate-800'
                      }`}
                    >
                      {falseBreakoutSignal.status !== 'NONE' ? 'TRAMPA SFP DETECTADA' : 'SIN TRAMPA'}
                    </span>
                  </div>
                  <h3 className="font-warfare text-sm font-bold text-white mb-1.5">
                    RUPTURA FALSA (SFP / TRAP)
                  </h3>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {falseBreakoutSignal.description}
                  </p>
                  <div className="bg-black/60 p-2 rounded text-[10px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">PENETRACIÓN:</span>
                      <span className="font-bold text-amber-300">+{falseBreakoutSignal.penetrationPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DIVERGENCIA CVD:</span>
                      <span className="font-bold text-cyan-300">
                        {falseBreakoutSignal.deltaDivergenceDetected ? 'SÍ (CONFIRMADA)' : 'NEUTRA'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">SCORE SFP:</span>
                  <span className="font-extrabold text-sm text-cyan-300">{falseBreakoutSignal.confidenceScore}%</span>
                </div>
              </div>

              {/* 3. Inducement Trap */}
              <div
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  fakeSweepSignal.isTrap
                    ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-black/50 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">MÓDULO 03</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                        fakeSweepSignal.isTrap
                          ? 'bg-amber-500 text-black font-extrabold animate-pulse'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                      }`}
                    >
                      {fakeSweepSignal.isTrap ? 'CEBO ACTIVO' : 'ESTRUCTURA LIMPIA'}
                    </span>
                  </div>
                  <h3 className="font-warfare text-sm font-bold text-white mb-1.5">
                    BARRIDA FALSA (INDUCEMENT)
                  </h3>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {fakeSweepSignal.description}
                  </p>
                  <div className="bg-black/60 p-2 rounded text-[10px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">POOL MACRO:</span>
                      <span className="font-bold text-rose-400">${fakeSweepSignal.majorPoolPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DISTANCIA POOL:</span>
                      <span className="font-bold text-amber-300">{fakeSweepSignal.distanceToMajorPoolPct}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">ACCIÓN:</span>
                  <span className={`text-[10px] font-bold ${fakeSweepSignal.isTrap ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {fakeSweepSignal.isTrap ? 'BLOQUEO ACTIVO' : 'LIMPIO'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: FÓRMULAS & REGLAS */}
        {activeSubTab === 'MATH_FORMULAS' && (
          <div className="space-y-4">
            <div className="bg-black/60 p-4 rounded border border-cyan-800/60 space-y-3">
              <h3 className="font-warfare text-sm font-bold text-cyan-300 uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                FÓRMULAS MATEMÁTICAS Y REGLAS DE SEGURIDAD OBLIGATORIAS
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                El módulo Sweep Hunter funciona mediante reglas deterministas inviolables que la IA ejecuta de forma autónoma:
              </p>

              {/* Security Rules Box */}
              <div className="bg-[#091522] p-3 rounded border border-rose-500/40 space-y-2">
                <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  REGLAS DE SEGURIDAD INMUTABLES (NO ANULABLES POR GEMINI):
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                  <li><strong>BTC 1H ROJO:</strong> Bloquea automáticamente cualquier nueva entrada LONG o SHORT.</li>
                  <li><strong>DATA_STALE:</strong> Si la conexión a Hyperliquid se degrada, se congelan nuevas órdenes.</li>
                  <li><strong>FILTRO ANTI-INDUCEMENT:</strong> Prohíbe comprar o vender en un nivel menor si hay un pool macro no purgado a &lt;1.2%.</li>
                  <li><strong>OFF NO CIERRA POSICIONES:</strong> Pasar la autonomía a OFF suspende nuevas órdenes pero preserva posiciones abiertas.</li>
                </ul>
              </div>

              {/* Math Formulas Box */}
              <div className="bg-[#091522] p-3 rounded border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 text-xs">
                  CÁLCULO EXACTO DE BARRIDA (SWEEP FORMULA):
                </span>
                <pre className="bg-black/80 p-2.5 rounded text-[11px] text-cyan-200 font-mono overflow-x-auto">
{`SSL Sweep (Compra): Low[t] < SwingLow && Close[t] > SwingLow
Ratio Mecha = (min(Open, Close) - Low) / (High - Low) >= 0.40 (40%+ mecha de rechazo)
Volumen = Volume[t] > 1.5 * SMA(Volume, 20)`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
