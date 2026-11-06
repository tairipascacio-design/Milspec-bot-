import React from 'react';
import { Flame, X, AlertTriangle, ShieldCheck, Zap, Crosshair, Radio } from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface LiquidationRadarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiquidationRadar: React.FC<LiquidationRadarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const liquidationZones = [
    {
      symbol: 'BTC-PERP',
      price: '$91,850.00',
      density: '$48.2M EN SHORTS',
      type: 'SQUEEZE_ALCISTA',
      threat: 'CRÍTICA',
      exchange: 'Hyperliquid L2',
      intensityPct: 92,
    },
    {
      symbol: 'BTC-PERP',
      price: '$86,400.00',
      density: '$62.5M EN LONGS',
      type: 'CASCADA_BAJISTA',
      threat: 'ALTA',
      exchange: 'Arbitrum GMX',
      intensityPct: 84,
    },
    {
      symbol: 'ETH-PERP',
      price: '$3,540.00',
      density: '$21.8M EN SHORTS',
      type: 'SQUEEZE_ALCISTA',
      threat: 'MEDIA',
      exchange: 'dYdX Chain',
      intensityPct: 68,
    },
    {
      symbol: 'SOL-PERP',
      price: '$194.20',
      density: '$34.1M EN LONGS',
      type: 'BARRIDO_LIQUIDEZ',
      threat: 'MUY ALTA',
      exchange: 'Drift Protocol',
      intensityPct: 88,
    },
    {
      symbol: 'DOGE-PERP',
      price: '$0.3150',
      density: '$12.4M EN SHORTS',
      type: 'FOMO_LIQUIDACIÓN',
      threat: 'MEDIA',
      exchange: 'Aevo Web3',
      intensityPct: 60,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#070d14] border border-red-500/50 rounded-lg tactical-box tactical-box-danger flex flex-col shadow-[0_0_35px_rgba(239,68,68,0.25)] overflow-hidden font-mono-military text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/60 bg-[#160a0f] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-warfare text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  RADAR BÉLICO DE CASCADAS DE LIQUIDACIÓN WEB3
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 border border-red-500 text-red-300 font-bold">
                  HEATMAP INSTITUCIONAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Monitoreo satelital de bolsas de colateral en peligro de detonación en tiempo real.
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

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Radar Visual Centerpiece */}
          <div className="relative h-44 bg-black/80 rounded border border-red-950 flex items-center justify-center overflow-hidden">
            {/* Concentric Radar Rings */}
            <div className="absolute w-28 h-28 rounded-full border border-red-900/30" />
            <div className="absolute w-44 h-44 rounded-full border border-red-900/30" />
            <div className="absolute w-60 h-60 rounded-full border border-red-900/20" />
            <div className="absolute w-full h-px bg-red-900/30" />
            <div className="absolute h-full w-px bg-red-900/30" />

            {/* Sweep Line */}
            <div className="absolute w-36 h-36 border-r-2 border-red-500/80 animate-radar origin-center pointer-events-none" />

            <div className="relative z-10 text-center">
              <Crosshair className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
              <p className="text-white font-bold text-sm mt-1">RADAR DE LIQUIDACIONES EN CADENA</p>
              <p className="text-[10px] text-red-400">MONITOREANDO $179.0M EN POSICIONES CON RIESGO DE CIERRE FORZOSO</p>
            </div>
          </div>

          {/* List of Detected Liquidation Targets */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold block">
              ZONAS DE DETONACIÓN DETECTADAS:
            </span>

            {liquidationZones.map((zone, idx) => (
              <div
                key={idx}
                className="bg-[#0b141d] p-3 rounded border border-slate-800 hover:border-red-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{zone.symbol}</span>
                    <span className="text-cyan-400 text-xs">@ {zone.price}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-slate-800 text-slate-400">
                      {zone.exchange}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">
                    TIPO: <strong className="text-amber-400">{zone.type}</strong> ({zone.density})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 text-right">
                    <span className="text-[10px] text-slate-500 block">DENSIDAD</span>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${zone.intensityPct}%` }}
                      />
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      zone.threat === 'CRÍTICA' || zone.threat === 'MUY ALTA'
                        ? 'bg-red-950 text-red-300 border border-red-500 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border border-amber-600'
                    }`}
                  >
                    {zone.threat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-red-950 bg-[#160a0f] px-4 py-2.5 flex justify-end">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            CERRAR RADAR
          </button>
        </div>
      </div>
    </div>
  );
};
