import React from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  BookOpen,
  Award,
  Flame,
  Wallet,
  PlusCircle,
  Eye,
  Crosshair,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { Web3WalletState, ProtocolId, PROTOCOLS } from '../types/protocols';
import { tacticalAudio } from '../utils/audio';

interface HeaderHUDProps {
  walletState: Web3WalletState;
  onOpenVault: () => void;
  selectedProtocol: ProtocolId;
  onSelectProtocol: (protocol: ProtocolId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSkills: () => void;
  onOpenWarGame: () => void;
  onOpenRadar: () => void;
  onOpenComms: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  defconLevel: number;
  oracleVerdict?: string;
  onOpenOracle?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  walletState,
  onOpenVault,
  selectedProtocol,
  onSelectProtocol,
  soundEnabled,
  onToggleSound,
  onOpenSkills,
  onOpenWarGame,
  onOpenRadar,
  onOpenComms,
  scanlinesEnabled,
  onToggleScanlines,
  defconLevel,
  oracleVerdict = 'ESPERAR',
  onOpenOracle,
}) => {
  const currentProto = PROTOCOLS[selectedProtocol];

  return (
    <header className="border-b border-cyan-900/40 bg-[#070d14]/95 backdrop-blur-md sticky top-0 z-40 px-3 py-2">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Tactical Callsign */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Crosshair className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '14s' }} />
            <div className="absolute inset-0 bg-cyan-400/10 animate-ping rounded" style={{ animationDuration: '3s' }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-warfare tracking-widest text-lg font-bold text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                ARES-X
              </span>
              <span className="text-[10px] font-mono-military uppercase px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-semibold tracking-wider animate-pulse">
                BÉLICO MIL-SPEC
              </span>
              <span className="text-[10px] font-mono-military uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                WEB3 FUTURES
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono-military flex items-center gap-2">
              <span>CALLSIGN: <strong className="text-emerald-400">WARLORD-01</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">PING: 14ms</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-bold">{currentProto.badge} MOTOR</span>
            </p>
          </div>
        </div>

        {/* Protocol Selector & DEFCON Status */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Protocol Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/70 border border-cyan-800/60 px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400">MOTOR:</span>
            <select
              value={selectedProtocol}
              onChange={(e) => {
                tacticalAudio.playClick();
                onSelectProtocol(e.target.value as ProtocolId);
              }}
              className="bg-transparent text-white font-bold text-xs font-mono-military focus:outline-none cursor-pointer"
            >
              <option value="HYPERLIQUID" className="bg-[#070d14] text-cyan-300">⚡ Hyperliquid L1/L2</option>
              <option value="GMX_V2" className="bg-[#070d14] text-blue-400">🛡️ GMX v2 (Arbitrum)</option>
              <option value="DYDX" className="bg-[#070d14] text-purple-400">⚔️ dYdX Chain v4</option>
              <option value="ARES_SIM" className="bg-[#070d14] text-emerald-400">🎯 ARES Simulador (100x)</option>
            </select>
          </div>

          {/* DEFCON Threat Badge */}
          <div className="flex items-center gap-2 border border-cyan-900/50 bg-black/40 px-3 py-1.5 rounded">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-tactical-pulse" />
            <span className="text-xs font-mono-military text-slate-300">ESTADO:</span>
            <span className="text-xs font-bold font-mono-military px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-300 tracking-wider">
              DEFCON {defconLevel}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation Hub */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* ORÁCULO BTC BUTTON */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              if (onOpenOracle) onOpenOracle();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono-military font-bold transition-all cursor-pointer ${
              oracleVerdict === 'BLOQUEADO'
                ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse'
                : oracleVerdict === 'LONG'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : oracleVerdict === 'SHORT'
                ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-black/60 border-cyan-800/80 text-cyan-300 hover:border-cyan-500'
            }`}
            title="Oráculo cuantitativo de BTC (Hyperliquid) - Veredicto automático"
          >
            <span>🔮</span>
            <span>ORÁCULO: {oracleVerdict}</span>
          </button>

          {/* Tactical Skills Database Button */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onOpenSkills();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono-military transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
            title="Base de Datos Mundial de Trading Institucional"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">BASE DE DATOS TÁCTICA</span>
            <span className="sm:hidden">HABILIDADES</span>
          </button>

          {/* SURPRISE GIFT: Black Ops War Room Simulator */}
          <button
            onClick={() => {
              tacticalAudio.playVictory();
              onOpenWarGame();
            }}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-gradient-to-r from-amber-950/80 via-red-950/80 to-amber-950/80 hover:from-amber-900 hover:to-red-900 border border-amber-500/70 text-amber-300 text-xs font-mono-military font-bold shadow-[0_0_14px_rgba(245,158,11,0.35)] transition-all cursor-pointer group"
            title="Tu Regalo Sorpresa: Simulador Bélico de Batallas Históricas Cripto"
          >
            <Award className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>🎁 WAR ROOM</span>
            <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[9px] bg-red-600 text-white font-bold rounded-full animate-pulse">
              PLUS
            </span>
          </button>

          {/* Liquidation & Arbitrage Radar */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onOpenRadar();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono-military transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">RADAR LIQ</span>
          </button>

          {/* AI Comms Radio */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onOpenComms();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono-military transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">RADIO IA</span>
          </button>

          {/* METAMASK & WEB3 VAULT BUTTON */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onOpenVault();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all cursor-pointer ${
              walletState.isConnected
                ? 'bg-[#091522] border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:border-cyan-400'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black border-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
            }`}
          >
            <span className="text-sm">🦊</span>
            <div className="text-left font-mono-military">
              {walletState.isConnected ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">
                      {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                    </span>
                    {walletState.isImported && (
                      <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-500 px-1 rounded font-bold">
                        IMPORTADA
                      </span>
                    )}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="text-[9px] text-cyan-400 block leading-none">
                    ${walletState.usdtBalance}
                  </span>
                </>
              ) : (
                <span className="text-xs font-warfare font-bold uppercase tracking-wider text-black">
                  CONECTAR METAMASK
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Sound & HUD Scanlines Toggles */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => {
                onToggleSound();
                tacticalAudio.playClick();
              }}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Audio bélico activado' : 'Audio silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                tacticalAudio.playClick();
                onToggleScanlines();
              }}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                scanlinesEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400'
                  : 'bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Efecto de líneas de escaneo HUD CRT Militar"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
