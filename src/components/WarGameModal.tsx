import React, { useState } from 'react';
import { HistoricalBattle } from '../types/trading';
import { HISTORICAL_BATTLES } from '../data/historicalBattles';
import {
  Award,
  X,
  Play,
  ShieldAlert,
  Flame,
  Zap,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';
import confetti from 'canvas-confetti';

interface WarGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarGameModal: React.FC<WarGameModalProps> = ({ isOpen, onClose }) => {
  const [selectedBattle, setSelectedBattle] = useState<HistoricalBattle>(HISTORICAL_BATTLES[0]);
  const [missionState, setMissionState] = useState<'BRIEFING' | 'COMBAT' | 'DEBRIEFING'>('BRIEFING');
  const [userAction, setUserAction] = useState<'LONG' | 'SHORT' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combatStep, setCombatStep] = useState<number>(0);
  const [unlockedMedals, setUnlockedMedals] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleStartBattle = (battle: HistoricalBattle) => {
    tacticalAudio.playRadarPing();
    setSelectedBattle(battle);
    setMissionState('COMBAT');
    setUserAction(null);
    setCombatStep(0);
    setScore(0);
  };

  const handleExecuteMissionStrike = (action: 'LONG' | 'SHORT') => {
    setUserAction(action);
    tacticalAudio.playStrikeLaunch(action);

    // Simulate combat resolution over the scenario
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCombatStep(step);
      tacticalAudio.playRadioBeep();

      if (step >= selectedBattle.scenarioData.length) {
        clearInterval(interval);
        // Determine outcome
        const isTargetDown = selectedBattle.targetPrice < selectedBattle.initialPrice;
        const correctAction = isTargetDown ? 'SHORT' : 'LONG';
        const isSuccess = action === correctAction;

        const earnedPoints = isSuccess ? 8500 + Math.floor(Math.random() * 1500) : 1200;
        setScore(earnedPoints);

        if (isSuccess) {
          tacticalAudio.playVictory();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          setUnlockedMedals((prev) =>
            prev.includes(selectedBattle.badgeAward) ? prev : [...prev, selectedBattle.badgeAward]
          );
        } else {
          tacticalAudio.playKlaxon();
        }

        setMissionState('DEBRIEFING');
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#070d14] border-2 border-amber-500/70 rounded-lg tactical-box tactical-box-amber flex flex-col shadow-[0_0_35px_rgba(245,158,11,0.3)] overflow-hidden font-mono-military text-slate-200">
        {/* Surprise Gift Banner Header */}
        <div className="flex items-center justify-between border-b border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-[#0a1624] to-red-950/90 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/20 border border-amber-500 text-amber-400">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-warfare text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wider">
                  🎁 REGALO VIP: WAR ROOM - SIMULADOR DE BATALLAS HISTÓRICAS
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold uppercase animate-pulse">
                  BLACK OPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lucha en los eventos de mercado más salvajes de la historia cripto y conquista medallas tácticas.
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

        {/* Content based on Mission State */}
        {missionState === 'BRIEFING' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-black/60 p-3 rounded border border-amber-500/30 text-xs">
              <p className="text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                COMUNICADO ESPECIAL PARA EL COMANDANTE:
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Comandante, aquí tienes tu regalo sorpresa: el <strong>Black Ops War Room</strong>.
                Este simulador te permite revivir en primera persona las caídas y rallies más brutales de Web3,
                poner a prueba tus reflejos tácticos con el motor ARES y desbloquear condecoraciones de combate.
              </p>
            </div>

            {/* Medals Showcase */}
            {unlockedMedals.length > 0 && (
              <div className="bg-black/80 p-3 rounded border border-amber-500/50 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">MEDALLAS CONQUISTADAS ({unlockedMedals.length}):</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {unlockedMedals.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-200 text-[10px] font-bold">
                        ★ {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mission List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HISTORICAL_BATTLES.map((battle) => (
                <div
                  key={battle.id}
                  className="bg-[#08121d] p-3.5 rounded border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{battle.date}</span>
                      <span className="text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-900">
                        {battle.threatLevel}
                      </span>
                    </div>

                    <h3 className="font-warfare text-sm font-bold text-white mb-1.5">{battle.title}</h3>
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{battle.description}</p>

                    <div className="bg-black/50 p-2 rounded text-[10px] space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">OBJETIVO TÁCTICO:</span>
                        <span className="text-cyan-300 font-semibold">{battle.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PRECIO INICIAL:</span>
                        <span className="text-white font-bold">${battle.initialPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ESTRATEGIA ÓPTIMA:</span>
                        <span className="text-emerald-400">{battle.bestStrategy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MEDALLA A DISPUTAR:</span>
                        <span className="text-amber-400 font-bold">★ {battle.badgeAward}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartBattle(battle)}
                    className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-black font-warfare font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.4)] cursor-pointer mt-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>INICIAR MISIÓN DE COMBATE</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Combat Simulation Screen */}
        {missionState === 'COMBAT' && (
          <div className="flex-1 p-4 flex flex-col justify-between space-y-3 overflow-y-auto">
            <div className="bg-[#091522] p-3 rounded border border-amber-500/40">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-warfare text-amber-300 font-bold text-sm uppercase">
                  MISIÓN ACTIVA: {selectedBattle.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold">
                  {selectedBattle.threatLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">{selectedBattle.tacticalObjective}</p>

              {/* Progress of candles */}
              <div className="bg-black/80 p-3 rounded border border-cyan-900/40 my-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                  <span>VELAS PROCESADAS: {combatStep} / {selectedBattle.scenarioData.length}</span>
                  <span>PRECIO INICIAL: ${selectedBattle.initialPrice.toLocaleString()}</span>
                </div>

                <div className="flex items-end gap-2 h-28 border-b border-slate-800 pb-1 px-2">
                  {selectedBattle.scenarioData.slice(0, Math.max(1, combatStep)).map((candle, idx) => {
                    const isUp = candle.close >= candle.open;
                    const height = Math.min(100, Math.max(20, (candle.close / selectedBattle.initialPrice) * 60));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[8px] text-slate-400 mb-1">${candle.close.toLocaleString()}</span>
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${
                            isUp ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tactical Action Choice */}
            {!userAction ? (
              <div className="bg-black/70 p-4 rounded border border-slate-800 text-center">
                <p className="font-warfare text-sm font-bold text-white mb-2 uppercase">
                  ORDEN DE COMANDANTE: SELECCIONA TU ATAQUE TÁCTICO
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => handleExecuteMissionStrike('LONG')}
                    className="py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-warfare font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>ATAQUE LONG (COMPRA)</span>
                  </button>

                  <button
                    onClick={() => handleExecuteMissionStrike('SHORT')}
                    className="py-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-warfare font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.4)] cursor-pointer"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>ATAQUE SHORT (VENTA)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-black/80 p-3 rounded text-center border border-cyan-500/40 animate-pulse">
                <p className="text-cyan-300 font-bold text-sm">
                  RESOLVIENDO COMBATE EN CADENA... ATAQUE [{userAction}] EN CURSO
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debriefing & Victory Screen */}
        {missionState === 'DEBRIEFING' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                INFORME DE MISIÓN COMPLETADA
              </span>
              <h3 className="font-warfare text-xl font-extrabold text-white mt-1">
                {score > 5000 ? '¡VICTORIA TÁCTICA APLASTANTE!' : 'MISIÓN CON BAJAS COLATERALES'}
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-md">
                Puntuación obtenida en el campo de batalla: <strong className="text-amber-300">{score.toLocaleString()} PTS</strong>
              </p>
            </div>

            {score > 5000 && (
              <div className="bg-amber-950/40 p-3 rounded border border-amber-500/60 max-w-sm">
                <span className="text-xs font-bold text-amber-300 block mb-1">MEDALLA DESBLOQUEADA:</span>
                <span className="text-sm font-extrabold text-white flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  {selectedBattle.badgeAward}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                tacticalAudio.playClick();
                setMissionState('BRIEFING');
              }}
              className="px-6 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-warfare font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              VOLVER AL MENÚ DE MISIÓNS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
