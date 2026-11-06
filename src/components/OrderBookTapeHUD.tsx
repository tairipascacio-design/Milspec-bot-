import React, { useState } from 'react';
import { OrderBookEntry, TradeTapeItem } from '../types/trading';
import { Layers, ArrowDownUp, ShieldAlert, Zap } from 'lucide-react';

interface OrderBookTapeHUDProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  trades: TradeTapeItem[];
  currentPrice: number;
  imbalance: number;
}

export const OrderBookTapeHUD: React.FC<OrderBookTapeHUDProps> = ({
  bids,
  asks,
  trades,
  currentPrice,
  imbalance,
}) => {
  const [activeTab, setActiveTab] = useState<'BOOK' | 'TAPE'>('BOOK');

  const maxBidTotal = bids.length ? Math.max(...bids.map((b) => b.total)) : 1;
  const maxAskTotal = asks.length ? Math.max(...asks.map((a) => a.total)) : 1;

  const spread = asks.length && bids.length ? Math.max(0, asks[asks.length - 1].price - bids[0].price) : 0;
  const spreadPct = currentPrice ? ((spread / currentPrice) * 100).toFixed(3) : '0.000';

  return (
    <div className="flex flex-col h-full bg-[#060b12] border border-cyan-900/40 rounded tactical-box overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#08111c] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('BOOK')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-military font-bold rounded transition-colors cursor-pointer ${
              activeTab === 'BOOK'
                ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ORDER BOOK</span>
          </button>

          <button
            onClick={() => setActiveTab('TAPE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-military font-bold rounded transition-colors cursor-pointer ${
              activeTab === 'TAPE'
                ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>TAPE EN VIVO</span>
          </button>
        </div>

        {/* Imbalance Meter Badge */}
        <div className="flex items-center gap-1 text-[11px] font-mono-military">
          <span className="text-slate-500 text-[10px]">PRESIÓN:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              imbalance >= 0
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
            }`}
          >
            {imbalance >= 0 ? `+${imbalance}% BIDS` : `${imbalance}% ASKS`}
          </span>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'BOOK' ? (
        <div className="flex flex-col flex-1 p-2 text-[11px] font-mono-military select-none overflow-hidden">
          {/* Column labels */}
          <div className="grid grid-cols-3 text-slate-500 text-[10px] pb-1 border-b border-slate-800/80 px-1">
            <span>PRECIO ($)</span>
            <span className="text-right">TAMAÑO</span>
            <span className="text-right">TOTAL</span>
          </div>

          {/* Asks (Sell Orders - descending) */}
          <div className="flex flex-col justify-end gap-0.5 py-1">
            {asks.slice(0, 7).map((ask) => {
              const depthPct = Math.min(100, (ask.total / maxAskTotal) * 100);
              return (
                <div key={`ask-${ask.price}`} className="relative grid grid-cols-3 px-1 py-0.5 hover:bg-rose-950/30">
                  <div
                    className="absolute top-0 right-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-400 font-semibold relative z-10">${ask.price.toFixed(2)}</span>
                  <span className="text-slate-300 text-right relative z-10">{ask.amount.toFixed(3)}</span>
                  <span className="text-slate-500 text-right relative z-10">{ask.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Current Spread Bar */}
          <div className="my-1 py-1.5 px-2 bg-black/80 border-y border-cyan-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">MARK:</span>
              <span className="font-extrabold text-cyan-300 text-sm tracking-wider">
                ${currentPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              SPREAD: <span className="text-amber-400 font-bold">${spread.toFixed(2)} ({spreadPct}%)</span>
            </div>
          </div>

          {/* Bids (Buy Orders - ascending) */}
          <div className="flex flex-col gap-0.5 py-1">
            {bids.slice(0, 7).map((bid) => {
              const depthPct = Math.min(100, (bid.total / maxBidTotal) * 100);
              return (
                <div key={`bid-${bid.price}`} className="relative grid grid-cols-3 px-1 py-0.5 hover:bg-emerald-950/30">
                  <div
                    className="absolute top-0 right-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-emerald-400 font-semibold relative z-10">${bid.price.toFixed(2)}</span>
                  <span className="text-slate-300 text-right relative z-10">{bid.amount.toFixed(3)}</span>
                  <span className="text-slate-500 text-right relative z-10">{bid.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Visual Orderbook Depth Pressure Indicator */}
          <div className="mt-auto pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span className="text-emerald-400">COMPRADORES (BIDS)</span>
              <span className="text-rose-400">VENDEDORES (ASKS)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(10, Math.min(90, 50 + imbalance / 2))}%` }}
              />
              <div
                className="bg-rose-500 transition-all duration-300 flex-1"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Real-time Trades Tape */
        <div className="flex flex-col flex-1 p-2 text-[11px] font-mono-military overflow-y-auto max-h-[380px]">
          <div className="grid grid-cols-3 text-slate-500 text-[10px] pb-1 border-b border-slate-800/80 px-1 sticky top-0 bg-[#060b12]">
            <span>PRECIO</span>
            <span className="text-right">TAMAÑO</span>
            <span className="text-right">HORA</span>
          </div>

          <div className="divide-y divide-slate-900/60">
            {trades.map((t) => (
              <div
                key={t.id}
                className={`grid grid-cols-3 px-1 py-1 items-center transition-colors ${
                  t.isWhale ? 'bg-amber-950/40 border-l-2 border-amber-500' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`font-bold ${
                      t.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${t.price.toFixed(2)}
                  </span>
                  {t.isWhale && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400 inline" /> WHALE
                    </span>
                  )}
                </div>
                <span className="text-slate-300 text-right">{t.amount.toFixed(3)}</span>
                <span className="text-slate-500 text-right text-[10px]">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
