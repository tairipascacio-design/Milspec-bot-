import React, { useState, useRef, useEffect } from 'react';
import { CryptoAsset, CandleData } from '../types/trading';
import { Activity, TrendingUp, TrendingDown, Clock, Crosshair, BarChart2 } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface ChartHUDProps {
  assets: CryptoAsset[];
  activeAsset: CryptoAsset;
  onSelectSymbol: (symbol: string) => void;
  candles: CandleData[];
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h';
  onChangeTimeframe: (tf: '1m' | '5m' | '15m' | '1h' | '4h') => void;
  rsi: number;
  cvdDelta: number;
}

export const ChartHUD: React.FC<ChartHUDProps> = ({
  assets,
  activeAsset,
  onSelectSymbol,
  candles,
  timeframe,
  onChangeTimeframe,
  rsi,
  cvdDelta,
}) => {
  const [showIndicators, setShowIndicators] = useState({
    ema: true,
    bollinger: true,
    volume: true,
  });
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(340, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute price min and max
  const minPrice = candles.length ? Math.min(...candles.map((c) => c.low)) : activeAsset.currentPrice * 0.98;
  const maxPrice = candles.length ? Math.max(...candles.map((c) => c.high)) : activeAsset.currentPrice * 1.02;
  const priceRange = maxPrice - minPrice || 1;
  const paddingBottom = 40;
  const chartHeight = dimensions.height - paddingBottom;

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 40) - 20;
  };

  const candleWidth = Math.max(4, (dimensions.width - 90) / (candles.length || 1));

  // Current market laser line Y position
  const currentPriceY = getY(activeAsset.currentPrice);

  return (
    <div className="flex flex-col h-full bg-[#060b12] border border-cyan-900/40 rounded tactical-box overflow-hidden">
      {/* Ticker & Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-950/80 bg-[#08111c] px-3 py-2 gap-2">
        {/* Asset Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={activeAsset.symbol}
            onChange={(e) => {
              tacticalAudio.playClick();
              onSelectSymbol(e.target.value);
            }}
            className="bg-black/80 border border-cyan-500/50 text-white font-mono-military font-bold text-sm px-2.5 py-1 rounded focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} (x{a.maxLeverage})
              </option>
            ))}
          </select>

          <div className="flex items-baseline gap-2">
            <span className="font-mono-military text-lg font-extrabold text-white">
              ${activeAsset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`flex items-center text-xs font-mono-military font-bold ${
                activeAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeAsset.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
              {activeAsset.change24h >= 0 ? '+' : ''}
              {activeAsset.change24h}%
            </span>
          </div>
        </div>

        {/* Tactical Market Stats */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono-military text-slate-300">
          <div>
            <span className="text-slate-500 block leading-tight">24H HIGH</span>
            <span className="text-emerald-400">${activeAsset.high24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block leading-tight">24H LOW</span>
            <span className="text-rose-400">${activeAsset.low24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block leading-tight">FUNDING / 8H</span>
            <span className={`font-bold ${activeAsset.fundingRate >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {(activeAsset.fundingRate * 100).toFixed(4)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 block leading-tight">RSI (14)</span>
            <span className={`font-bold ${rsi > 70 ? 'text-rose-400' : rsi < 30 ? 'text-emerald-400' : 'text-cyan-300'}`}>
              {rsi}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block leading-tight">CVD DELTA</span>
            <span className={`font-bold ${cvdDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {cvdDelta >= 0 ? `+${cvdDelta}` : cvdDelta}
            </span>
          </div>
        </div>

        {/* Timeframe & Indicators Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-black/60 border border-slate-800 rounded p-0.5">
            {(['1m', '5m', '15m', '1h', '4h'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  tacticalAudio.playClick();
                  onChangeTimeframe(tf);
                }}
                className={`px-2 py-0.5 text-xs font-mono-military rounded transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-cyan-600 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setShowIndicators((prev) => ({ ...prev, bollinger: !prev.bollinger }));
            }}
            className={`px-2 py-1 text-[11px] font-mono-military rounded border transition-colors cursor-pointer ${
              showIndicators.bollinger
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                : 'bg-black/40 border-slate-800 text-slate-500'
            }`}
            title="Bandas de Bollinger Tácticas"
          >
            BB
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setShowIndicators((prev) => ({ ...prev, ema: !prev.ema }));
            }}
            className={`px-2 py-1 text-[11px] font-mono-military rounded border transition-colors cursor-pointer ${
              showIndicators.ema
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-black/40 border-slate-800 text-slate-500'
            }`}
            title="EMA 20 Algorítmica"
          >
            EMA20
          </button>
        </div>
      </div>

      {/* Main Candlestick Chart Area */}
      <div
        ref={containerRef}
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setCrosshairPos({ x, y });

          // Find hovered candle
          const idx = Math.min(
            candles.length - 1,
            Math.max(0, Math.floor(x / candleWidth))
          );
          if (candles[idx]) {
            setHoveredCandle(candles[idx]);
          }
        }}
        onMouseLeave={() => {
          setCrosshairPos(null);
          setHoveredCandle(null);
        }}
        className="relative flex-1 w-full min-h-[340px] bg-radar-grid cursor-crosshair select-none overflow-hidden"
      >
        <svg className="w-full h-full" width={dimensions.width} height={dimensions.height}>
          <defs>
            {/* Bollinger Band area glow */}
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
            </linearGradient>
            {/* Bullish & Bearish Glow */}
            <filter id="bullGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
            <filter id="bearGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f43f5e" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines horizontal */}
          {[0.2, 0.4, 0.6, 0.8].map((pct) => {
            const y = chartHeight * pct;
            const priceLevel = maxPrice - pct * priceRange;
            return (
              <g key={pct}>
                <line x1="0" y1={y} x2={dimensions.width - 65} y2={y} stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.8" />
                <text x={dimensions.width - 60} y={y + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                  ${priceLevel.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Shaded Area */}
          {showIndicators.bollinger && candles.length > 1 && (
            <path
              d={
                candles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${i * candleWidth + candleWidth / 2} ${getY(c.upperBand || c.high)}`).join(' ') +
                ' ' +
                candles
                  .slice()
                  .reverse()
                  .map((c, i) => `L ${(candles.length - 1 - i) * candleWidth + candleWidth / 2} ${getY(c.lowerBand || c.low)}`)
                  .join(' ') +
                ' Z'
              }
              fill="url(#bbGradient)"
              stroke="#a855f7"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          )}

          {/* EMA 20 Line */}
          {showIndicators.ema && candles.length > 1 && (
            <path
              d={candles
                .map((c, i) => `${i === 0 ? 'M' : 'L'} ${i * candleWidth + candleWidth / 2} ${getY(c.ema20 || c.close)}`)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {/* Candlesticks & Volume Bars */}
          {candles.map((c, idx) => {
            const isBullish = c.close >= c.open;
            const x = idx * candleWidth;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            // Volume bar in bottom area
            const maxVol = Math.max(...candles.map((k) => k.volume)) || 1;
            const volHeight = (c.volume / maxVol) * 45;
            const volY = dimensions.height - volHeight - 5;

            return (
              <g key={c.time} className="transition-opacity duration-150">
                {/* Volume bar */}
                {showIndicators.volume && (
                  <rect
                    x={x + 1}
                    y={volY}
                    width={Math.max(1, candleWidth - 2)}
                    height={volHeight}
                    fill={isBullish ? '#10b981' : '#f43f5e'}
                    opacity="0.25"
                  />
                )}

                {/* Candlestick Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={highY}
                  x2={x + candleWidth / 2}
                  y2={lowY}
                  stroke={isBullish ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                />

                {/* Candlestick Body */}
                <rect
                  x={x + 1.2}
                  y={bodyTop}
                  width={Math.max(2, candleWidth - 2.4)}
                  height={bodyHeight}
                  fill={isBullish ? '#10b981' : '#f43f5e'}
                  filter={isBullish ? 'url(#bullGlow)' : 'url(#bearGlow)'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Current Real-time Price Laser Line */}
          <line
            x1="0"
            y1={currentPriceY}
            x2={dimensions.width - 65}
            y2={currentPriceY}
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeDasharray="4 2"
            className="animate-pulse"
          />

          {/* Current Price Marker Badge */}
          <rect
            x={dimensions.width - 65}
            y={currentPriceY - 10}
            width="65"
            height="20"
            fill="#0891b2"
            rx="2"
          />
          <text
            x={dimensions.width - 60}
            y={currentPriceY + 4}
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            ${activeAsset.currentPrice.toFixed(1)}
          </text>

          {/* Crosshair on Hover */}
          {crosshairPos && (
            <g>
              <line
                x1={crosshairPos.x}
                y1="0"
                x2={crosshairPos.x}
                y2={dimensions.height}
                stroke="#38bdf8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={crosshairPos.y}
                x2={dimensions.width}
                y2={crosshairPos.y}
                stroke="#38bdf8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>

        {/* Hovered Candle Telemetry Box */}
        {hoveredCandle && (
          <div className="absolute top-2 left-3 bg-black/90 border border-cyan-500/40 px-2.5 py-1.5 rounded text-[10px] font-mono-military pointer-events-none shadow-lg z-10 flex gap-3 text-slate-300">
            <span>
              O: <strong className="text-white">${hoveredCandle.open}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">${hoveredCandle.high}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">${hoveredCandle.low}</strong>
            </span>
            <span>
              C: <strong className="text-cyan-300">${hoveredCandle.close}</strong>
            </span>
            <span>
              VOL: <strong className="text-amber-400">{hoveredCandle.volume.toLocaleString()}</strong>
            </span>
          </div>
        )}

        {/* Military HUD Tactical Watermark */}
        <div className="absolute bottom-3 left-3 text-[10px] font-mono-military text-cyan-900/40 uppercase tracking-widest pointer-events-none select-none flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          <span>RADAR TÁCTICO VECTOR 44.9° | COORD: [{candles.length} BARS SYNCED]</span>
        </div>
      </div>
    </div>
  );
};
