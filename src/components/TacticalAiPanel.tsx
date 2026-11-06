import React, { useState } from 'react';
import { CryptoAsset, AiTacticalAnalysis, OrderSide, CandleData } from '../types/trading';
import {
  Brain,
  Crosshair,
  Shield,
  Volume2,
  Zap,
  TrendingUp,
  TrendingDown,
  Cpu,
  Target,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

import { ProtocolId, PROTOCOLS } from '../types/protocols';
import { InstitutionalAnalysisEngine } from '../services/institutionalAnalysis';

interface TacticalAiPanelProps {
  activeAsset: CryptoAsset;
  rsi: number;
  cvdDelta: number;
  orderbookImbalance: number;
  timeframe: string;
  activeSkillsNames: string[];
  protocol: ProtocolId;
  candles: CandleData[];
  onApplyAiSetup: (setup: {
    side: OrderSide;
    leverage: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
  autoPilotEnabled: boolean;
  onToggleAutoPilot: () => void;
}

export const TacticalAiPanel: React.FC<TacticalAiPanelProps> = ({
  activeAsset,
  rsi,
  cvdDelta,
  orderbookImbalance,
  timeframe,
  activeSkillsNames,
  protocol,
  candles,
  onApplyAiSetup,
  autoPilotEnabled,
  onToggleAutoPilot,
}) => {
  const [analysis, setAnalysis] = useState<AiTacticalAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const smcTelemetry = InstitutionalAnalysisEngine.runSmcAnalysis(candles, activeAsset.currentPrice);
  const ictTelemetry = InstitutionalAnalysisEngine.runIctAnalysis(activeAsset.currentPrice);

  const runAiTacticalScan = async () => {
    tacticalAudio.playRadarPing();
    setLoading(true);

    try {
      const res = await fetch('/api/ai/analyze-tactical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeAsset.symbol,
          price: activeAsset.currentPrice,
          change24h: activeAsset.change24h,
          high24h: activeAsset.high24h,
          low24h: activeAsset.low24h,
          fundingRate: activeAsset.fundingRate,
          rsi,
          cvdDelta,
          orderbookImbalance,
          timeframe,
          activeSkills: activeSkillsNames,
          protocol,
        }),
      });

      const data: AiTacticalAnalysis = await res.json();
      setAnalysis(data);
      setLastScanTime(new Date().toLocaleTimeString('es-ES', { hour12: false }));

      // If voice transmission exists, announce it
      if (data.voiceTransmission) {
        tacticalAudio.speakTacticalVoice(data.voiceTransmission);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteNow = () => {
    if (!analysis || analysis.action === 'HOLD') return;
    tacticalAudio.playStrikeLaunch(analysis.action);
    onApplyAiSetup({
      side: analysis.action,
      leverage: analysis.recommendedLeverage,
      takeProfit: analysis.takeProfit1,
      stopLoss: analysis.stopLoss,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#060b12] border border-cyan-900/40 rounded tactical-box overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#08111c] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="font-warfare text-xs tracking-wider font-bold text-white uppercase">
            ARES-X INTELIGENCIA BÉLICA
          </span>
        </div>

        {/* Sniper Auto-Pilot Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-military text-slate-400">AUTO-PILOT:</span>
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playClick();
              onToggleAutoPilot();
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono-military font-bold border transition-all cursor-pointer ${
              autoPilotEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-black/60 text-slate-500 border-slate-800'
            }`}
          >
            {autoPilotEnabled ? 'FRANCOTIRADOR ACTIVO' : 'MANUAL'}
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3 font-mono-military text-xs flex-1 overflow-y-auto">
        {/* Live Institutional Indicators Strip */}
        <div className="bg-black/60 p-2 rounded border border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-slate-500 block">ESTRUCTURA SMC:</span>
            <span className="font-bold text-cyan-300">
              {smcTelemetry.orderBlockType === 'BULLISH_OB' ? '🟢 OB COMPRADOR DETECTADO' : '🔴 OB VENDEDOR DETECTADO'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">KILLZONE ICT ({ictTelemetry.timeUtc}):</span>
            <span className="font-bold text-amber-300">
              {ictTelemetry.currentKillzone.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          onClick={runAiTacticalScan}
          disabled={loading}
          className="w-full py-2.5 rounded bg-gradient-to-r from-cyan-950 via-cyan-800 to-cyan-950 hover:from-cyan-900 hover:to-cyan-900 border border-cyan-500/60 text-cyan-100 font-warfare font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(6,182,212,0.35)] cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Cpu className="w-4 h-4 animate-spin text-cyan-300" />
              <span>ESCANEANDO MATRIZ DE MERCADO Y HABILIDADES...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '8s' }} />
              <span>DISPARAR ESCANEO TÁCTICO BÉLICO (AI)</span>
            </>
          )}
        </button>

        {/* Analysis Output Result */}
        {analysis ? (
          <div className="flex flex-col gap-2.5 bg-black/60 p-2.5 rounded border border-cyan-900/60 text-slate-200">
            {/* Top Bar: Action & Confluence */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded font-extrabold text-sm flex items-center gap-1 ${
                    analysis.action === 'LONG'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                      : analysis.action === 'SHORT'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500'
                      : 'bg-amber-600/30 text-amber-300 border border-amber-500'
                  }`}
                >
                  {analysis.action === 'LONG' && <TrendingUp className="w-4 h-4" />}
                  {analysis.action === 'SHORT' && <TrendingDown className="w-4 h-4" />}
                  VECTOR: {analysis.action}
                </span>

                <span className="text-[11px] text-slate-400">
                  APALANCAMIENTO: <strong className="text-amber-400">{analysis.recommendedLeverage}x</strong>
                </span>
              </div>

              {/* Confluence Meter */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block leading-tight">CONFLUENCIA BÉLICA</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {analysis.confluenceScore}%
                </span>
              </div>
            </div>

            {/* Tactical Trading Skill Applied from Database */}
            <div className="bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 uppercase tracking-wider mb-1 font-bold">
                <Target className="w-3.5 h-3.5" />
                <span>HABILIDAD BÉLICA APLICADA:</span>
              </div>
              <p className="text-white font-semibold text-xs">{analysis.tacticalSkillUsed}</p>
            </div>

            {/* Tactical Briefing & Radio Voice Button */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>INFORME DE COMBATE ARES:</span>
                <button
                  onClick={() => tacticalAudio.speakTacticalVoice(analysis.voiceTransmission || analysis.briefing)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  title="Reproducir transmisión de radio por voz"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>REPETIR RADIO</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2 rounded border-l-2 border-cyan-500">
                "{analysis.briefing}"
              </p>
            </div>

            {/* Strike Coordinates Grid (Entry, TP1, TP2, SL, R:R) */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">PRECIO ENTRADA:</span>
                <span className="text-white font-bold">${analysis.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">RATIO R:R:</span>
                <span className="text-cyan-400 font-bold">{analysis.riskRewardRatio}</span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px]">TARGET 1 (TP):</span>
                <span className="text-emerald-300 font-bold">${analysis.takeProfit1.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-rose-400 block text-[10px]">INVALIDACIÓN (SL):</span>
                <span className="text-rose-300 font-bold">${analysis.stopLoss.toLocaleString()}</span>
              </div>
            </div>

            {/* Threat Level */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>AMENAZA DEL MERCADO:</span>
              <span className="font-bold text-amber-400 uppercase">{analysis.threatLevel}</span>
            </div>

            {/* One-Click Execute Tactical Order */}
            {analysis.action !== 'HOLD' && (
              <button
                onClick={handleExecuteNow}
                className={`w-full py-2 rounded font-warfare font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md mt-1 ${
                  analysis.action === 'LONG'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>TRANSFERIR COORDENADAS A PANEL DE ATAQUE</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-500 border border-dashed border-cyan-900/40 rounded bg-black/40">
            <Crosshair className="w-8 h-8 text-cyan-900 mb-2 animate-spin" style={{ animationDuration: '20s' }} />
            <p className="text-xs font-semibold text-slate-400">SISTEMA EN ESPERA DE DISPARO</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
              Presione el botón superior para que ARES procese los flujos de mercado y la base de datos de trading mundial.
            </p>
          </div>
        )}

        {/* Active Trading Skills in Radar Footer */}
        <div className="mt-auto pt-2 border-t border-cyan-950 text-[10px] text-slate-400 flex items-center justify-between">
          <span>HABILIDADES EN RADAR:</span>
          <span className="text-cyan-400 font-bold">{activeSkillsNames.length} PROTOCOLOS ACTIVOS</span>
        </div>
      </div>
    </div>
  );
};
