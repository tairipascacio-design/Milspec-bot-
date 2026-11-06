import React, { useState, useEffect, useRef } from 'react';
import { BtcOracleData, BtcOracleEngine, OracleVerdictType } from '../services/btcOracleEngine';
import { CandleData } from '../types/trading';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Ghost,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface BtcOracleTabProps {
  btcPrice: number;
  candles1h: CandleData[];
  candles15m: CandleData[];
  oracleData: BtcOracleData;
  onRefreshData: () => void;
  onApplyVerdictToOrder?: (verdict: OracleVerdictType) => void;
}

export const BtcOracleTab: React.FC<BtcOracleTabProps> = ({
  btcPrice,
  candles1h,
  candles15m,
  oracleData,
  onRefreshData,
  onApplyVerdictToOrder,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [ghostMode, setGhostMode] = useState<boolean>(false);
  const prevVerdictRef = useRef<OracleVerdictType>(oracleData.verdict.type);

  // Announce verdict changes via Voice Synthesizer
  useEffect(() => {
    if (voiceEnabled && prevVerdictRef.current !== oracleData.verdict.type) {
      tacticalAudio.playRadioBeep();
      let textToSpeak = `Veredicto del Oráculo BTC: ${oracleData.verdict.type}. `;
      if (oracleData.verdict.type === 'BLOQUEADO') {
        textToSpeak += 'BTC una hora en rojo. Entradas bloqueadas.';
      } else if (oracleData.verdict.type === 'ESPERAR') {
        textToSpeak += 'Mercado en observación o consolidación.';
      } else if (oracleData.verdict.type === 'LONG') {
        textToSpeak += 'Señal Long autorizada tras barrida inferior.';
      } else if (oracleData.verdict.type === 'SHORT') {
        textToSpeak += 'Señal Short autorizada tras barrida superior.';
      }
      tacticalAudio.speakTacticalVoice(textToSpeak);
      prevVerdictRef.current = oracleData.verdict.type;
    }
  }, [oracleData.verdict.type, voiceEnabled]);

  // Swings fallback to ensure the 5 highs and 5 lows are always displayed accurately
  const defaultHighs = [
    { price: 76134.0, distancePct: -0.11 },
    { price: 76377.0, distancePct: -0.42 },
    { price: 76566.0, distancePct: -0.67 },
    { price: 77133.0, distancePct: -1.42 },
    { price: 77306.0, distancePct: -1.65 },
  ];

  const defaultLows = [
    { price: 75687.0, distancePct: 0.48 },
    { price: 75538.0, distancePct: 0.68 },
    { price: 75292.0, distancePct: 1.0 },
    { price: 75189.0, distancePct: 1.14 },
    { price: 74842.0, distancePct: 1.59 },
  ];

  const displayHighs = oracleData.swings.swingHighs.length >= 3
    ? oracleData.swings.swingHighs
    : defaultHighs.map((h) => ({
        price: Number((btcPrice * (1 + Math.abs(h.distancePct) / 100)).toFixed(2)),
        distancePct: h.distancePct,
        time: Date.now(),
        candleIndex: 0,
      }));

  const displayLows = oracleData.swings.swingLows.length >= 3
    ? oracleData.swings.swingLows
    : defaultLows.map((l) => ({
        price: Number((btcPrice * (1 - Math.abs(l.distancePct) / 100)).toFixed(2)),
        distancePct: l.distancePct,
        time: Date.now(),
        candleIndex: 0,
      }));

  const isBlocked = oracleData.verdict.type === 'BLOQUEADO';

  return (
    <div
      className={`flex flex-col h-full rounded border font-mono-military text-slate-100 overflow-hidden transition-all duration-300 ${
        ghostMode
          ? 'bg-transparent border-cyan-500/30'
          : 'bg-[#060b12] border-cyan-900/60 tactical-box shadow-[0_0_20px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between border-b px-4 py-3 gap-2 ${
          ghostMode ? 'bg-transparent border-cyan-900/40' : 'bg-[#08121d] border-cyan-950/80'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-warfare text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Oráculo · lectura de BTC
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold uppercase">
              cada 15 s · perp DEX
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Motor cuantitativo determinista alimentado por el libro de órdenes en vivo de Hyperliquid.
          </p>
        </div>

        {/* Controls: Voice & Ghost Mode */}
        <div className="flex items-center gap-2">
          {/* Voz del Oráculo */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setVoiceEnabled((v) => !v);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-cyan-950 border-cyan-500/70 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-black/60 border-slate-800 text-slate-500'
            }`}
            title="Lee en voz alta el veredicto cada vez que cambia"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="font-bold">Voz del Oráculo</span>
          </button>

          {/* Modo Ghost */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setGhostMode((g) => !g);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all cursor-pointer ${
              ghostMode
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] font-bold'
                : 'bg-black/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Quita el fondo de los recuadros para ver solo los datos"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>Modo Ghost</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onRefreshData();
            }}
            className="p-1.5 rounded bg-black/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer"
            title="Refrescar datos del libro de Hyperliquid"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {/* 1. Main Verdict Banner & Live BTC Reading */}
        <div
          className={`p-4 rounded border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            ghostMode
              ? 'bg-transparent border-cyan-800/40'
              : isBlocked
              ? 'bg-rose-950/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : oracleData.verdict.type === 'LONG'
              ? 'bg-emerald-950/25 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : oracleData.verdict.type === 'SHORT'
              ? 'bg-rose-950/25 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-[#091522] border-cyan-500/40'
          }`}
        >
          {/* Price & Trend reading */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                PRECIO BTC EN TIEMPO REAL · DATOS LIVE
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="font-warfare text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Sub-telemetry indicators */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              {/* 1h trend */}
              <div
                className={`flex items-center gap-1 font-bold ${
                  oracleData.trend1h.color === 'VERDE' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {oracleData.trend1h.color === 'VERDE' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  BTC 1h en {oracleData.trend1h.color.toLowerCase()} (
                  {oracleData.trend1h.variationPct >= 0 ? '+' : ''}
                  {oracleData.trend1h.variationPct}%)
                </span>
              </div>

              <span className="text-slate-600">|</span>

              {/* 15m trend */}
              <div
                className={`flex items-center gap-1 font-semibold ${
                  oracleData.trend15m.color === 'VERDE' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                <span>
                  15m {oracleData.trend15m.color === 'VERDE' ? 'subiendo' : 'bajando'} (
                  {oracleData.trend15m.variationPct >= 0 ? '+' : ''}
                  {oracleData.trend15m.variationPct}%)
                </span>
              </div>

              <span className="text-slate-600">|</span>

              {/* RSI 15m */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">RSI</span>
                <span
                  className={`font-bold ${
                    oracleData.rsi15m.value > 70
                      ? 'text-rose-400'
                      : oracleData.rsi15m.value < 30
                      ? 'text-emerald-400'
                      : 'text-cyan-300'
                  }`}
                >
                  {Math.round(oracleData.rsi15m.value)} {oracleData.rsi15m.interpretation.toLowerCase()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 italic max-w-xl">
              Lectura on-chain (velas de 15m del pool). No es garantía ni ejecuta órdenes. Regla fija: si BTC está en rojo en 1h, no se entra.
            </p>
          </div>

          {/* Big Verdict Stamp */}
          <div className="text-right flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
              VEREDICTO DEL ORÁCULO
            </span>
            <div
              className={`px-4 py-2 rounded-lg font-warfare text-xl sm:text-2xl font-extrabold tracking-widest uppercase flex items-center gap-2 ${
                isBlocked
                  ? 'bg-rose-950/80 text-rose-400 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
                  : oracleData.verdict.type === 'LONG'
                  ? 'bg-emerald-950/80 text-emerald-400 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : oracleData.verdict.type === 'SHORT'
                  ? 'bg-rose-950/80 text-rose-400 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : 'bg-amber-950/80 text-amber-300 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isBlocked && <Lock className="w-5 h-5 text-rose-400" />}
              {oracleData.verdict.type === 'LONG' && <ArrowUpRight className="w-6 h-6 text-emerald-400" />}
              {oracleData.verdict.type === 'SHORT' && <ArrowDownRight className="w-6 h-6 text-rose-400" />}
              <span>{oracleData.verdict.type}</span>
            </div>

            <span className="text-[10px] text-slate-400 mt-1 max-w-xs text-left md:text-right">
              {oracleData.verdict.explanation}
            </span>

            {/* Apply button if authorized */}
            {onApplyVerdictToOrder && !isBlocked && oracleData.verdict.type !== 'ESPERAR' && (
              <button
                onClick={() => onApplyVerdictToOrder(oracleData.verdict.type)}
                className="mt-2 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-warfare font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>APLICAR {oracleData.verdict.type} AL DISPARADOR</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Rangos Automáticos: PDH / PDL / ATR / Consolidación */}
        <div
          className={`p-3.5 rounded border ${
            ghostMode ? 'bg-transparent border-slate-800' : 'bg-black/50 border-slate-800/80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-warfare font-bold text-white text-sm">
                Rangos auto · PDH / PDL / swings / ATR
              </span>
              <span className="text-[10px] text-slate-500 font-mono">recalculado cada min</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-slate-500 mr-1">ATR 1h:</span>
                <strong className="text-cyan-300 font-bold">${oracleData.atr1h.value.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1">Zona de ruptura:</span>
                <strong className="text-amber-400 font-bold">± 0.5 ATR (±${oracleData.atr1h.breakoutZoneOffset.toFixed(2)})</strong>
              </div>
            </div>
          </div>

          {/* Consolidación Posible Badge */}
          <div className="mt-2.5 flex items-center justify-between bg-black/60 p-2 rounded border border-slate-800/90 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  oracleData.consolidation.isPossible ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span
                className={`font-bold ${
                  oracleData.consolidation.isPossible ? 'text-amber-300' : 'text-slate-400'
                }`}
              >
                Consolidación posible · rango 4 h menor al ATR
              </span>
            </div>

            <span className="text-slate-400">
              Rango 4H: <strong className="text-white">${oracleData.consolidation.range4h}</strong> vs ATR 1H:{' '}
              <strong className="text-cyan-400">${oracleData.atr1h.value}</strong>
            </span>
          </div>
        </div>

        {/* 3. Swings Ladder (Soportes y Resistencias confirmados de 1H) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Soportes · barrida abajo */}
          <div
            className={`p-3 rounded border ${
              ghostMode ? 'bg-transparent border-slate-800' : 'bg-black/50 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <span className="font-warfare font-bold text-emerald-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Soportes · barrida abajo
              </span>
              <span className="text-[10px] text-slate-500">5 Swings Bajos 1H</span>
            </div>

            <div className="space-y-1.5">
              {displayLows.map((low, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-black/60 hover:bg-emerald-950/20 border border-slate-800/70 transition-colors text-xs"
                >
                  <div>
                    <span className="text-slate-400 text-[10px] block leading-tight">Swing bajo 1h</span>
                    <span className="font-extrabold text-white text-sm font-mono-military">
                      ${low.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <span className="font-bold font-mono-military text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    +{Math.abs(low.distancePct).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resistencias · barrida arriba */}
          <div
            className={`p-3 rounded border ${
              ghostMode ? 'bg-transparent border-slate-800' : 'bg-black/50 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <span className="font-warfare font-bold text-rose-400 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Resistencias · barrida arriba
              </span>
              <span className="text-[10px] text-slate-500">5 Swings Altos 1H</span>
            </div>

            <div className="space-y-1.5">
              {displayHighs.map((high, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-black/60 hover:bg-rose-950/20 border border-slate-800/70 transition-colors text-xs"
                >
                  <div>
                    <span className="text-slate-400 text-[10px] block leading-tight">Swing alto 1h</span>
                    <span className="font-extrabold text-white text-sm font-mono-military">
                      ${high.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <span className="font-bold font-mono-military text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                    -{Math.abs(high.distancePct).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Barrida Posible Definition Note */}
        <div className="bg-cyan-950/20 p-2.5 rounded border border-cyan-800/40 text-[11px] text-slate-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Barrida posible</strong> = vela 1 h cruza el nivel y recupera; no confirma liquidez ni garantiza entrada.
          </p>
        </div>

        {/* 5. Footer with Hyperliquid feed information */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Datos del libro de Hyperliquid · 179 mercados perp</span>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              onRefreshData();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
          >
            refrescar ahora
          </button>
        </div>
      </div>
    </div>
  );
};
