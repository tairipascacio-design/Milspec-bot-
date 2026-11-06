import React, { useState } from 'react';
import { Position } from '../types/trading';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  XCircle,
  Percent,
  CheckCircle,
  History,
  Crosshair,
  Award,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import confetti from 'canvas-confetti';

interface PositionsManagerProps {
  positions: Position[];
  onClosePosition: (id: string, partial?: boolean) => void;
  onSetBreakEven: (id: string) => void;
  closedPositionsCount: number;
  totalPnl: number;
}

export const PositionsManager: React.FC<PositionsManagerProps> = ({
  positions,
  onClosePosition,
  onSetBreakEven,
  closedPositionsCount,
  totalPnl,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SUMMARY'>('ACTIVE');

  const winCount = positions.filter((p) => p.pnl > 0).length;
  const winRate = positions.length ? Math.round((winCount / positions.length) * 100) : 100;

  const handleClose = (pos: Position, partial = false) => {
    if (pos.pnl > 0) {
      tacticalAudio.playVictory();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } else {
      tacticalAudio.playClick();
    }
    onClosePosition(pos.id, partial);
  };

  return (
    <div className="flex flex-col h-full bg-[#060b12] border border-cyan-900/40 rounded tactical-box overflow-hidden">
      {/* Header Tabs & Telemetry */}
      <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#08111c] px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-military font-bold rounded transition-colors cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>POSICIONES EN BATALLA ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-military font-bold rounded transition-colors cursor-pointer ${
              activeTab === 'SUMMARY'
                ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>RENDIMIENTO DE CAMPO</span>
          </button>
        </div>

        {/* Global PnL Stats */}
        <div className="flex items-center gap-3 text-xs font-mono-military">
          <span className="text-slate-400 text-[10px]">PNL ACUMULADO:</span>
          <span
            className={`font-extrabold ${
              totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`}
          </span>
        </div>
      </div>

      {activeTab === 'ACTIVE' ? (
        <div className="flex-1 p-2 text-xs font-mono-military overflow-x-auto overflow-y-auto">
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 border border-dashed border-slate-800 rounded">
              <ShieldAlert className="w-8 h-8 text-slate-700 mb-1" />
              <p className="font-semibold text-slate-400">NO HAY POSICIONES ACTIVAS EN COMBATE</p>
              <p className="text-[11px] text-slate-500">
                Seleccione un activo y ejecute una orden LONG o SHORT desde el panel de ataque.
              </p>
            </div>
          ) : (
            <div className="min-w-[680px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-slate-800/80">
                    <th className="py-1 px-2">ACTIVO / LADO</th>
                    <th className="py-1 px-2">TAMAÑO (MARGEN)</th>
                    <th className="py-1 px-2">ENTRADA / MARK</th>
                    <th className="py-1 px-2">LIQUIDACIÓN</th>
                    <th className="py-1 px-2">PNL NO REALIZADO (ROE %)</th>
                    <th className="py-1 px-2 text-right">ACCIONES TÁCTICAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {positions.map((pos) => {
                    const isWinning = pos.pnl >= 0;
                    const liqDanger =
                      pos.side === 'LONG'
                        ? pos.markPrice <= pos.liquidationPrice * 1.05
                        : pos.markPrice >= pos.liquidationPrice * 0.95;

                    return (
                      <tr
                        key={pos.id}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          liqDanger ? 'bg-rose-950/20 border-l-2 border-rose-500 animate-tactical-pulse' : ''
                        }`}
                      >
                        {/* Symbol & Side */}
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                pos.side === 'LONG'
                                  ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                                  : 'bg-rose-950 border border-rose-500/50 text-rose-400'
                              }`}
                            >
                              {pos.side} {pos.leverage}x
                            </span>
                            <span className="font-bold text-white">{pos.symbol}</span>
                            {pos.protocol && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold uppercase">
                                {pos.protocol.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Size & Margin */}
                        <td className="py-2 px-2 text-slate-300">
                          <div>
                            <span className="text-white font-semibold">
                              ${(pos.margin * pos.leverage).toLocaleString()}
                            </span>
                            <span className="text-slate-500 block text-[10px]">
                              Margen: ${pos.margin.toFixed(0)} ({pos.marginMode})
                            </span>
                          </div>
                        </td>

                        {/* Entry vs Mark Price */}
                        <td className="py-2 px-2">
                          <div className="text-slate-300">
                            <span>${pos.entryPrice.toFixed(2)}</span>
                            <span className="text-cyan-400 block font-semibold text-[11px]">
                              ${pos.markPrice.toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Liquidation Price */}
                        <td className="py-2 px-2">
                          <span
                            className={`font-semibold ${
                              liqDanger ? 'text-rose-400 font-extrabold animate-pulse' : 'text-amber-400'
                            }`}
                          >
                            ${pos.liquidationPrice.toFixed(2)}
                          </span>
                          {liqDanger && (
                            <span className="text-[9px] block text-rose-500 font-bold uppercase">
                              ¡PELIGRO LIQ!
                            </span>
                          )}
                        </td>

                        {/* PnL & ROE */}
                        <td className="py-2 px-2">
                          <div
                            className={`font-extrabold flex items-center gap-1 ${
                              isWinning ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isWinning ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>
                              {isWinning ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`}
                            </span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-black/60 border border-slate-800">
                              {pos.roe >= 0 ? `+${pos.roe.toFixed(2)}%` : `${pos.roe.toFixed(2)}%`}
                            </span>
                          </div>
                        </td>

                        {/* Tactical Actions */}
                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSetBreakEven(pos.id)}
                              className="px-2 py-1 rounded bg-black/70 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] cursor-pointer"
                              title="Mover Stop Loss al precio de entrada"
                            >
                              BE
                            </button>

                            <button
                              onClick={() => handleClose(pos, true)}
                              className="px-2 py-1 rounded bg-black/70 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] cursor-pointer"
                              title="Cerrar el 50% de la posición"
                            >
                              50%
                            </button>

                            <button
                              onClick={() => handleClose(pos, false)}
                              className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              title="Cierre táctico total a mercado"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>CERRAR</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Performance Summary Tab */
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono-military">
          <div className="bg-black/50 p-3 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] block">TOTAL POSICIONES CERRADAS</span>
            <span className="text-lg font-bold text-white">{closedPositionsCount}</span>
          </div>

          <div className="bg-black/50 p-3 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] block">RATIO DE VICTORIAS (WIN RATE)</span>
            <span className="text-lg font-bold text-emerald-400">{winRate}%</span>
          </div>

          <div className="bg-black/50 p-3 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] block">PROFIT FACTOR ESTIMADO</span>
            <span className="text-lg font-bold text-cyan-400">2.84</span>
          </div>

          <div className="bg-black/50 p-3 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] block">RANGO TÁCTICO BÉLICO</span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>COMANDANTE GENERAL</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
